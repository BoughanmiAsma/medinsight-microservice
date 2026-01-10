# 📚 Documentation : Liaison Fabric-Backend MedInsight

## 🎯 Bienvenue !

Cette documentation explique comment **Hyperledger Fabric** (blockchain) est intégré avec les **microservices backend** dans le projet MedInsight.

---

## 📖 Documents Disponibles

### 1. 🚀 **Commencer Ici** : Résumé Exécutif
**Fichier** : [`FABRIC-BACKEND-SUMMARY.md`](./FABRIC-BACKEND-SUMMARY.md)

**Pour qui ?** Tous (débutants et experts)

**Contenu** :
- Vue d'ensemble en 3 points
- Schémas simplifiés
- Concepts clés expliqués simplement
- FAQ (Questions fréquentes)
- Checklist des prochaines étapes

**Temps de lecture** : ~10 minutes

---

### 2. 🏗️ **Architecture Complète**
**Fichier** : [`FABRIC-BACKEND-INTEGRATION.md`](./FABRIC-BACKEND-INTEGRATION.md)

**Pour qui ?** Architectes, développeurs expérimentés

**Contenu** :
- Architecture détaillée (3 couches)
- Composants Fabric (organisations, channels, chaincodes)
- Composants Backend (services, bases de données)
- Mécanisme de liaison (Docker, Spring Boot, SDK)
- Flux de données complets
- Configuration détaillée
- Sécurité multi-niveaux
- Diagrammes de séquence

**Temps de lecture** : ~30 minutes

---

### 3. 💻 **Guide Pratique d'Implémentation**
**Fichier** : [`FABRIC-INTEGRATION-GUIDE.md`](./FABRIC-INTEGRATION-GUIDE.md)

**Pour qui ?** Développeurs Java/Spring Boot

**Contenu** :
- Code source complet et prêt à l'emploi
- `FabricService.java` (service utilitaire)
- `FabricException.java` (gestion d'erreurs)
- `MedicalRecord.java` (modèle de données)
- `DossierController.java` (contrôleur REST amélioré)
- Tests unitaires avec JUnit et Mockito
- Configuration `application.properties`
- Commandes curl pour tester
- Checklist d'implémentation

**Temps de lecture** : ~20 minutes  
**Temps d'implémentation** : ~2-4 heures

---

### 4. 🔄 **Diagrammes de Flux de Données**
**Fichier** : [`FABRIC-DATA-FLOW.md`](./FABRIC-DATA-FLOW.md)

**Pour qui ?** Tous (visuel)

**Contenu** :
- Diagramme ASCII complet (création de dossier)
- Diagramme de lecture (GET)
- Détails de chaque étape
- Temps de réponse estimés
- Gestion des erreurs (3 scénarios)
- Optimisations possibles

**Temps de lecture** : ~15 minutes

---

## 🗺️ Parcours Recommandés

### Pour les Débutants
```
1. FABRIC-BACKEND-SUMMARY.md (résumé)
   ↓
2. FABRIC-DATA-FLOW.md (flux visuels)
   ↓
3. FABRIC-BACKEND-INTEGRATION.md (architecture)
```

### Pour les Développeurs
```
1. FABRIC-BACKEND-SUMMARY.md (vue d'ensemble)
   ↓
2. FABRIC-INTEGRATION-GUIDE.md (code pratique)
   ↓
3. Implémentation dans le projet
   ↓
4. Tests avec Postman/curl
```

### Pour les Architectes
```
1. FABRIC-BACKEND-INTEGRATION.md (architecture complète)
   ↓
2. FABRIC-DATA-FLOW.md (flux de données)
   ↓
3. Analyse des performances et sécurité
```

---

## 📊 Diagramme d'Architecture (Visuel)

Un diagramme visuel de l'architecture est disponible :

**Fichier** : `fabric_backend_architecture.png`

**Contenu** :
- Couche Application (Frontend, Kong, Keycloak)
- Couche Microservices (Dossier, Lab, Ordonnance)
- Couche Blockchain (DoctorOrg, PharmacyOrg, PatientOrg)
- Connexions et protocoles (REST, gRPC, JDBC)

---

## 🔑 Concepts Clés (Glossaire)

| Terme | Définition |
|-------|------------|
| **Fabric** | Hyperledger Fabric, plateforme blockchain privée |
| **Chaincode** | Smart contract écrit en Go, définit les règles métier |
| **Channel** | Canal de communication isolé entre organisations |
| **MSP** | Membership Service Provider, identifie une organisation |
| **Wallet** | Portefeuille contenant les identités cryptographiques |
| **Gateway** | Point d'entrée SDK pour se connecter au réseau Fabric |
| **Ledger** | Registre immuable stockant toutes les transactions |
| **Peer** | Nœud du réseau Fabric hébergeant le ledger |
| **Orderer** | Service de consensus ordonnant les transactions |
| **Transaction** | Opération modifiant ou lisant l'état du ledger |

---

## 🛠️ Fichiers Importants du Projet

### Configuration Docker
```
MedInsight-Microservices/
├── docker-compose.yml          # Configure les services et volumes Fabric
└── .agent/
    └── (cette documentation)
```

### Services Backend
```
MedInsight-Microservices/
├── dossier-service/
│   ├── src/main/java/com/medinsight/dossier/
│   │   ├── config/
│   │   │   └── FabricConfig.java          # Configuration Fabric
│   │   ├── web/
│   │   │   └── DossierController.java     # Contrôleur REST
│   │   └── domain/
│   │       └── Dossier.java               # Entité JPA
│   ├── src/main/resources/
│   │   └── application.properties         # Configuration Spring
│   └── pom.xml                            # Dépendances Maven
```

### Réseau Fabric
```
fabric-network/
├── chaincode/
│   ├── medical-records/
│   │   └── main.go                        # Chaincode dossiers médicaux
│   ├── consent/
│   │   └── main.go                        # Chaincode consentements
│   └── prescriptions/
│       └── main.go                        # Chaincode prescriptions
├── connection-doctor.json                 # Profil de connexion DoctorOrg
├── connection-lab.json                    # Profil de connexion LabOrg
├── wallets/
│   ├── doctor/
│   │   └── dossierAppUser/                # Identité crypto dossier-service
│   └── lab/
│       └── labAppUser/                    # Identité crypto lab-service
├── docker-compose-fabric.yml              # Déploiement réseau Fabric
└── README.md                              # Documentation Fabric
```

---

## 🚀 Quick Start

### 1. Lire la Documentation
```bash
# Commencer par le résumé
cat .agent/FABRIC-BACKEND-SUMMARY.md

# Puis le guide pratique
cat .agent/FABRIC-INTEGRATION-GUIDE.md
```

### 2. Vérifier la Configuration
```bash
# Vérifier que le réseau Fabric est démarré
docker ps | grep fabric

# Vérifier les services backend
docker ps | grep -E "dossier|lab|ordonnance"
```

### 3. Tester la Connexion
```bash
# Depuis le dossier fabric-network
docker exec cli peer channel list

# Vérifier les chaincodes déployés
docker exec cli peer lifecycle chaincode querycommitted --channelID recordschannel
```

### 4. Implémenter le Code
Suivre le guide [`FABRIC-INTEGRATION-GUIDE.md`](./FABRIC-INTEGRATION-GUIDE.md)

---

## 📞 Support et Ressources

### Documentation Officielle
- **Hyperledger Fabric** : https://hyperledger-fabric.readthedocs.io/
- **Fabric Gateway SDK** : https://github.com/hyperledger/fabric-gateway
- **Spring Boot** : https://spring.io/projects/spring-boot

### Documentation Projet
- **Fabric Network** : `../fabric-network/README.md`
- **Postman Collection** : `../MedInsight-Postman-Collection.json`

### Logs et Debugging
```bash
# Logs du service dossier
docker logs -f dossier-service

# Logs du peer Fabric
docker logs -f peer0.doctor.medinsight.com

# Logs de l'orderer
docker logs -f orderer.medinsight.com
```

---

## 🎓 Prochaines Étapes

### Phase 1 : Compréhension (FAIT ✅)
- [x] Lire la documentation
- [x] Comprendre l'architecture
- [x] Identifier les composants

### Phase 2 : Implémentation (À FAIRE ⬜)
- [ ] Créer `FabricService.java`
- [ ] Mettre à jour `DossierController.java`
- [ ] Ajouter la gestion d'erreurs
- [ ] Écrire les tests unitaires

### Phase 3 : Tests (À FAIRE ⬜)
- [ ] Tester la création de dossiers
- [ ] Tester la lecture depuis Fabric
- [ ] Tester la gestion des erreurs
- [ ] Valider avec Postman

### Phase 4 : Production (À FAIRE ⬜)
- [ ] Activer TLS sur Fabric
- [ ] Migrer vers Raft consensus
- [ ] Implémenter le monitoring
- [ ] Déployer sur Kubernetes

---

## 📝 Changelog

### Version 1.0 (2026-01-10)
- ✅ Documentation initiale créée
- ✅ 4 documents complets
- ✅ Diagramme d'architecture
- ✅ Exemples de code
- ✅ Guides pratiques

---

## 🤝 Contribution

Pour améliorer cette documentation :
1. Identifier les sections à améliorer
2. Proposer des modifications
3. Mettre à jour les fichiers correspondants
4. Incrémenter la version

---

## 📄 Licence

Documentation du projet MedInsight  
© 2026 - Tous droits réservés

---

**Dernière mise à jour** : 2026-01-10  
**Version** : 1.0  
**Auteur** : Documentation MedInsight
