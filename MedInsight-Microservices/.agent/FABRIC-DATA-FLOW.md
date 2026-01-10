# Diagramme de Flux : Création d'un Dossier Médical

## Flux Complet avec Numérotation

```
┌─────────┐   ┌──────────┐   ┌──────┐   ┌──────────┐   ┌─────────────┐   ┌──────────┐   ┌────────┐   ┌───────┐
│  User   │   │ Frontend │   │ Kong │   │ Keycloak │   │   Dossier   │   │PostgreSQL│   │ Fabric │   │ Kafka │
│         │   │ (React)  │   │  API │   │  (Auth)  │   │   Service   │   │    DB    │   │Network │   │       │
└────┬────┘   └────┬─────┘   └───┬──┘   └────┬─────┘   └──────┬──────┘   └────┬─────┘   └───┬────┘   └───┬───┘
     │             │              │           │                 │                │             │            │
     │ 1. Créer   │              │           │                 │                │             │            │
     │  dossier   │              │           │                 │                │             │            │
     ├───────────>│              │           │                 │                │             │            │
     │            │              │           │                 │                │             │            │
     │            │ 2. POST      │           │                 │                │             │            │
     │            │ /api/dossiers│           │                 │                │             │            │
     │            │ + JWT        │           │                 │                │             │            │
     │            ├─────────────>│           │                 │                │             │            │
     │            │              │           │                 │                │             │            │
     │            │              │ 3. Valider│                 │                │             │            │
     │            │              │    JWT    │                 │                │             │            │
     │            │              ├──────────>│                 │                │             │            │
     │            │              │           │                 │                │             │            │
     │            │              │ 4. Token  │                 │                │             │            │
     │            │              │   valide  │                 │                │             │            │
     │            │              │<──────────┤                 │                │             │            │
     │            │              │           │                 │                │             │            │
     │            │              │ 5. Forward│                 │                │             │            │
     │            │              │  request  │                 │                │             │            │
     │            │              ├──────────────────────────────>                │             │            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 6. Vérifier    │             │            │
     │            │              │           │                 │    rôle        │             │            │
     │            │              │           │                 │ "dossier:write"│             │            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 7. INSERT      │             │            │
     │            │              │           │                 │   metadata     │             │            │
     │            │              │           │                 ├───────────────>│             │            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 8. Metadata    │             │            │
     │            │              │           │                 │    saved       │             │            │
     │            │              │           │                 │<───────────────┤             │            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 9. submitTransaction         │            │
     │            │              │           │                 │   ("CreateRecord", ...)      │            │
     │            │              │           │                 ├─────────────────────────────>│            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │                │             │ 10. Valider│
     │            │              │           │                 │                │             │     MSP ID │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │                │             │ 11. Exécuter
     │            │              │           │                 │                │             │   chaincode│
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │                │             │ 12. Commit │
     │            │              │           │                 │                │             │   to ledger│
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 13. Transaction committed    │            │
     │            │              │           │                 │<─────────────────────────────┤            │
     │            │              │           │                 │                │             │            │
     │            │              │           │                 │ 14. Publish                  │            │
     │            │              │           │                 │  "dossier.created"           │            │
     │            │              │           │                 ├──────────────────────────────────────────>│
     │            │              │           │                 │                │             │            │
     │            │              │ 15. 201 Created + Dossier   │                │             │            │
     │            │              │<────────────────────────────┤                │             │            │
     │            │              │           │                 │                │             │            │
     │            │ 16. Response │           │                 │                │             │            │
     │            │<─────────────┤           │                 │                │             │            │
     │            │              │           │                 │                │             │            │
     │ 17. Succès │              │           │                 │                │             │            │
     │<───────────┤              │           │                 │                │             │            │
     │            │              │           │                 │                │             │            │
```

---

## Détails des Étapes

### Étape 1-2 : Soumission du Formulaire
- L'utilisateur remplit le formulaire de création de dossier
- Le frontend envoie une requête POST avec le JWT d'authentification

### Étape 3-4 : Authentification
- Kong valide le JWT auprès de Keycloak
- Keycloak confirme la validité du token et retourne les rôles

### Étape 5 : Routage
- Kong forward la requête au microservice avec le contexte utilisateur

### Étape 6 : Autorisation
- Le service vérifie que l'utilisateur a le rôle `dossier:write`

### Étape 7-8 : Persistance Métadonnées
- Les métadonnées sont sauvegardées dans PostgreSQL
- PostgreSQL confirme l'insertion

### Étape 9-13 : Enregistrement Blockchain
- Le service soumet une transaction au réseau Fabric
- Fabric valide l'identité MSP (DoctorOrgMSP)
- Le chaincode s'exécute et valide les règles métier
- La transaction est committée dans le ledger

### Étape 14 : Publication Événement
- Un événement Kafka est publié pour notifier les autres services

### Étape 15-17 : Réponse
- Le service retourne le dossier créé au frontend
- Le frontend affiche un message de succès à l'utilisateur

---

## Flux Simplifié (Vue d'Ensemble)

```
User → Frontend → Kong → Keycloak ✓
                    ↓
              Dossier Service
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   PostgreSQL    Fabric      Kafka
   (Metadata)   (Ledger)   (Events)
```

---

## Temps de Réponse Typiques

| Étape | Composant | Temps Estimé |
|-------|-----------|--------------|
| 1-2 | Frontend → Kong | ~50ms |
| 3-4 | Kong → Keycloak | ~100ms |
| 5-6 | Kong → Service | ~10ms |
| 7-8 | Service → PostgreSQL | ~20ms |
| 9-13 | Service → Fabric | **~500-1000ms** ⚠️ |
| 14 | Service → Kafka | ~10ms |
| 15-17 | Service → Frontend | ~50ms |

**Total** : ~750-1250ms

⚠️ **Note** : Fabric est le composant le plus lent car il nécessite :
- Validation par les peers
- Exécution du chaincode
- Consensus entre les nœuds
- Commit dans le ledger

---

## Gestion des Erreurs

### Scénario 1 : JWT Invalide
```
User → Frontend → Kong → Keycloak ✗
                    ↓
              401 Unauthorized
                    ↓
              Frontend → User
```

### Scénario 2 : Rôle Insuffisant
```
User → Frontend → Kong → Service
                           ↓
                    Check role ✗
                           ↓
                    403 Forbidden
                           ↓
                    Frontend → User
```

### Scénario 3 : Erreur Fabric
```
Service → PostgreSQL ✓
    ↓
Service → Fabric ✗ (timeout/error)
    ↓
Rollback PostgreSQL
    ↓
500 Internal Server Error → User
```

---

## Flux de Lecture (GET /api/dossiers/{id})

```
┌─────────┐   ┌──────────┐   ┌──────┐   ┌─────────────┐   ┌────────┐
│  User   │   │ Frontend │   │ Kong │   │   Dossier   │   │ Fabric │
│         │   │ (React)  │   │  API │   │   Service   │   │Network │
└────┬────┘   └────┬─────┘   └───┬──┘   └──────┬──────┘   └───┬────┘
     │             │              │             │              │
     │ 1. Voir    │              │             │              │
     │  dossier   │              │             │              │
     ├───────────>│              │             │              │
     │            │              │             │              │
     │            │ 2. GET       │             │              │
     │            │ /api/dossiers│             │              │
     │            │ /REC001      │             │              │
     │            ├─────────────>│             │              │
     │            │              │             │              │
     │            │              │ 3. Auth     │              │
     │            │              ├────────────>│              │
     │            │              │             │              │
     │            │              │             │ 4. evaluateTransaction
     │            │              │             │   ("ReadRecord", "REC001")
     │            │              │             ├─────────────>│
     │            │              │             │              │
     │            │              │             │              │ 5. Query
     │            │              │             │              │   ledger
     │            │              │             │              │
     │            │              │             │ 6. Record    │
     │            │              │             │<─────────────┤
     │            │              │             │              │
     │            │              │ 7. 200 OK   │              │
     │            │              │<────────────┤              │
     │            │              │             │              │
     │            │ 8. Response  │             │              │
     │            │<─────────────┤             │              │
     │            │              │             │              │
     │ 9. Afficher│              │             │              │
     │<───────────┤              │             │              │
     │            │              │             │              │
```

**Temps de réponse** : ~200-400ms (plus rapide car pas de commit)

---

## Points Clés à Retenir

### ✅ Avantages
1. **Double persistance** : PostgreSQL (rapide) + Fabric (immuable)
2. **Sécurité multi-niveaux** : JWT → Rôles → MSP → Chaincode
3. **Traçabilité** : Chaque action enregistrée avec son auteur
4. **Événements** : Kafka permet la communication asynchrone

### ⚠️ Considérations
1. **Latence** : Fabric ajoute ~500-1000ms par transaction
2. **Complexité** : Plus de composants = plus de points de défaillance
3. **Rollback** : Nécessite une gestion manuelle des transactions distribuées

### 🚀 Optimisations Possibles
1. **Cache** : Redis pour les lectures fréquentes
2. **Async** : Enregistrement Fabric en arrière-plan
3. **Batch** : Grouper plusieurs transactions Fabric
4. **CDN** : Pour les fichiers statiques

---

**Date** : 2026-01-10  
**Version** : 1.0
