# Résumé Exécutif : Liaison Fabric-Backend

## 🎯 Vue d'Ensemble en 3 Points

### 1️⃣ **Qu'est-ce que Hyperledger Fabric dans MedInsight ?**

Hyperledger Fabric est une **blockchain privée** qui stocke les dossiers médicaux de manière **immuable** et **traçable**. Contrairement à une base de données classique, chaque modification est enregistrée de façon permanente avec l'identité de l'auteur.

### 2️⃣ **Comment les services backend communiquent-ils avec Fabric ?**

Les microservices (dossier-service, lab-service) utilisent le **Fabric Gateway SDK** pour :
- **Écrire** des données via `submitTransaction()` (ex: créer un dossier)
- **Lire** des données via `evaluateTransaction()` (ex: consulter un dossier)

### 3️⃣ **Pourquoi utiliser Fabric ET PostgreSQL ?**

| Composant | Rôle | Exemple de Données |
|-----------|------|-------------------|
| **PostgreSQL** | Métadonnées rapides, recherche, cache | Liste des dossiers, index, relations |
| **Fabric** | Source de vérité immuable | Contenu complet du dossier médical |

---

## 📊 Schéma Simplifié

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUÊTE UTILISATEUR                       │
│              POST /api/dossiers (Créer un dossier)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  DOSSIER-SERVICE (Java)                      │
│                                                               │
│  1. Validation JWT (Keycloak)                                │
│  2. Vérification des rôles (dossier:write)                   │
│  3. Sauvegarde métadonnées → PostgreSQL                      │
│  4. Enregistrement blockchain → Fabric                       │
│  5. Publication événement → Kafka                            │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────────┐
│   PostgreSQL    │            │  Fabric Network     │
│                 │            │                     │
│  • ID: REC001   │            │  Chaincode:         │
│  • PatientID    │            │  CreateRecord()     │
│  • DoctorID     │            │                     │
│  • Timestamp    │            │  Validation:        │
│                 │            │  MSP = DoctorOrgMSP │
│  (Métadonnées)  │            │                     │
│                 │            │  Stockage:          │
│                 │            │  Ledger immuable    │
└─────────────────┘            └─────────────────────┘
```

---

## 🔑 Composants Clés

### A. Configuration Docker

```yaml
# docker-compose.yml
dossier-service:
  volumes:
    - ../fabric-network/connection-doctor.json:/app/connection-doctor.json
    - ../fabric-network/wallets/doctor/dossierAppUser:/app/wallet
  networks:
    - fabric-net  # ← Réseau partagé avec Fabric
```

**Ce que ça fait** : Monte les fichiers de configuration Fabric dans le conteneur du service.

---

### B. Configuration Java

```java
// FabricConfig.java
@Bean
public Gateway gateway(Wallet wallet) {
    return Gateway.createBuilder()
        .identity(wallet, "dossierAppUser")  // ← Identité crypto
        .networkConfig(connectionProfile)     // ← Profil réseau
        .connect();
}

@Bean
public Contract contract(Network network) {
    return network.getContract("medical-records");  // ← Chaincode
}
```

**Ce que ça fait** : Crée une connexion au réseau Fabric et récupère le contrat (chaincode).

---

### C. Utilisation dans le Contrôleur

```java
// DossierController.java
@PostMapping
public ResponseEntity<?> create(@RequestBody Dossier dossier) {
    // 1. Sauvegarder dans PostgreSQL
    Dossier saved = repo.save(dossier);
    
    // 2. Enregistrer dans Fabric
    contract.submitTransaction(
        "CreateRecord",
        saved.getId(),
        saved.getPatientId(),
        saved.getDoctorId(),
        // ... autres paramètres
    );
    
    return ResponseEntity.ok(saved);
}
```

**Ce que ça fait** : Enregistre le dossier dans PostgreSQL puis dans Fabric.

---

## 🔐 Sécurité Multi-Niveaux

```
Niveau 1: API Gateway (Kong)
    ↓ Authentification JWT
    
Niveau 2: Microservice (Spring Boot)
    ↓ Vérification des rôles Keycloak
    
Niveau 3: Fabric Network
    ↓ Validation MSP ID
    
Niveau 4: Chaincode (Go)
    ↓ Logique métier (ex: seuls les docteurs peuvent créer)
    
✅ Transaction acceptée
```

---

## 📁 Fichiers Importants

| Fichier | Localisation | Rôle |
|---------|-------------|------|
| `docker-compose.yml` | `MedInsight-Microservices/` | Configure les services et volumes Fabric |
| `FabricConfig.java` | `dossier-service/src/.../config/` | Configure la connexion Fabric |
| `connection-doctor.json` | `fabric-network/` | Profil de connexion au réseau |
| `wallet/` | `fabric-network/wallets/doctor/` | Identités cryptographiques |
| `main.go` | `fabric-network/chaincode/medical-records/` | Code du smart contract |

---

## 🚀 Flux de Données Complet

### Création d'un Dossier

```
1. User → Frontend : Remplit le formulaire
2. Frontend → Kong : POST /api/dossiers + JWT
3. Kong → Keycloak : Valide le JWT
4. Kong → Dossier-Service : Forward la requête
5. Dossier-Service → PostgreSQL : INSERT INTO dossiers
6. Dossier-Service → Fabric : submitTransaction("CreateRecord")
7. Fabric Peer → Chaincode : Exécute CreateRecord()
8. Chaincode : Valide MSP ID = "DoctorOrgMSP"
9. Chaincode → Ledger : Enregistre le dossier
10. Fabric → Dossier-Service : Transaction committed
11. Dossier-Service → Kafka : Publish "dossier.created"
12. Dossier-Service → Frontend : 201 Created
```

### Lecture d'un Dossier

```
1. User → Frontend : Clique sur "Voir le dossier"
2. Frontend → Kong : GET /api/dossiers/REC001 + JWT
3. Kong → Dossier-Service : Forward la requête
4. Dossier-Service → Fabric : evaluateTransaction("ReadRecord", "REC001")
5. Fabric Peer → Chaincode : Exécute ReadRecord()
6. Chaincode → Ledger : Lit le dossier
7. Fabric → Dossier-Service : Retourne le JSON
8. Dossier-Service → Frontend : 200 OK + Dossier
```

---

## 🛠️ Technologies Utilisées

### Backend
- **Framework** : Spring Boot 3.2.0
- **Langage** : Java 17
- **SDK Fabric** : fabric-gateway-java 2.2.9

### Blockchain
- **Plateforme** : Hyperledger Fabric 2.5
- **Langage Chaincode** : Go 1.20
- **Consensus** : Solo (dev) → Raft (prod)

### Infrastructure
- **Conteneurisation** : Docker + Docker Compose
- **Base de données** : PostgreSQL 15
- **Messaging** : Apache Kafka
- **Authentification** : Keycloak

---

## ⚙️ Organisations Fabric

| Organisation | MSP ID | Peer | Port | Rôle |
|-------------|--------|------|------|------|
| **DoctorOrg** | DoctorOrgMSP | peer0.doctor | 7051 | Créer/Modifier dossiers |
| **PharmacyOrg** | PharmacyOrgMSP | peer0.pharmacy | 9051 | Dispenser prescriptions |
| **PatientOrg** | PatientOrgMSP | peer0.patient | 11051 | Gérer consentements |

---

## 📋 Channels et Chaincodes

| Channel | Chaincode | Fonctions | Organisations |
|---------|-----------|-----------|---------------|
| **recordschannel** | medical-records | CreateRecord, ReadRecord, UpdateRecord, DeleteRecord, QueryRecordsByPatient | DoctorOrg, PatientOrg |
| **consentchannel** | consent | GrantConsent, RevokeConsent, CheckConsent | Toutes |
| **prescriptionschannel** | prescriptions | CreatePrescription, DispensePrescription | DoctorOrg, PharmacyOrg |

---

## 🎓 Concepts Clés

### Wallet (Portefeuille)
Contient les **identités cryptographiques** (certificats X.509) permettant de s'authentifier sur le réseau Fabric.

### Gateway
Point d'entrée pour se connecter au réseau Fabric. Gère automatiquement :
- La découverte des peers
- La soumission des transactions
- La gestion des erreurs

### Network (Réseau)
Représente un **channel** Fabric (ex: recordschannel).

### Contract (Contrat)
Représente un **chaincode** déployé sur un channel (ex: medical-records).

### MSP (Membership Service Provider)
Identifie l'organisation d'un utilisateur (ex: DoctorOrgMSP).

### Transaction
- **submitTransaction()** : Modifie l'état du ledger (écriture)
- **evaluateTransaction()** : Lit l'état sans modification (lecture)

---

## ✅ Avantages de cette Architecture

1. **Immuabilité** : Les dossiers ne peuvent pas être modifiés rétroactivement
2. **Traçabilité** : Chaque action est enregistrée avec son auteur
3. **Décentralisation** : Plusieurs organisations partagent le réseau
4. **Sécurité** : Contrôle d'accès à plusieurs niveaux
5. **Auditabilité** : Historique complet des modifications
6. **Conformité** : Répond aux exigences RGPD/HIPAA

---

## ⚠️ Limitations Actuelles

1. **Implémentation partielle** : Le code actuel n'utilise pas encore Fabric
2. **Pas de TLS** : Réseau en mode développement
3. **Consensus simple** : Solo orderer (non production-ready)
4. **Pas de rollback** : Manque de gestion des transactions distribuées

---

## 🔮 Prochaines Étapes

1. ✅ Comprendre l'architecture (FAIT)
2. ⬜ Implémenter `FabricService.java`
3. ⬜ Mettre à jour les contrôleurs
4. ⬜ Tester avec Postman
5. ⬜ Activer TLS pour la production
6. ⬜ Migrer vers Raft consensus
7. ⬜ Déployer sur Kubernetes

---

## 📚 Ressources

- **Documentation complète** : `.agent/FABRIC-BACKEND-INTEGRATION.md`
- **Guide pratique** : `.agent/FABRIC-INTEGRATION-GUIDE.md`
- **Fabric Network README** : `fabric-network/README.md`
- **Documentation officielle** : https://hyperledger-fabric.readthedocs.io/

---

## 💡 Questions Fréquentes

### Q: Pourquoi utiliser Fabric ET PostgreSQL ?
**R:** PostgreSQL stocke les métadonnées pour des requêtes rapides. Fabric stocke les données complètes de manière immuable et traçable.

### Q: Comment les services accèdent-ils au réseau Fabric ?
**R:** Via le SDK Fabric Gateway Java, en utilisant un wallet (identité crypto) et un connection profile (config réseau).

### Q: Qu'est-ce qu'un chaincode ?
**R:** C'est un smart contract écrit en Go qui définit les règles métier (ex: seuls les docteurs peuvent créer des dossiers).

### Q: Comment sont gérées les permissions ?
**R:** À 4 niveaux : API Gateway (JWT), Microservice (rôles Keycloak), Fabric (MSP ID), Chaincode (logique métier).

### Q: Peut-on supprimer des données de Fabric ?
**R:** Non, le ledger est immuable. On peut marquer un enregistrement comme "supprimé" mais l'historique reste.

---

**Date** : 2026-01-10  
**Version** : 1.0  
**Auteur** : Documentation MedInsight
