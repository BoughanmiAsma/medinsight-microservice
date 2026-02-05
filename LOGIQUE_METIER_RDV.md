# MedInsight - Logique Métier des Rendez-vous

## Rôles et Permissions

### 👤 PATIENT
**Permissions :**
- ✅ **Créer** des rendez-vous avec un médecin
- ✅ **Consulter** ses propres rendez-vous
- ✅ **Replanifier** ses rendez-vous (avant confirmation)
- ✅ **Annuler** ses rendez-vous
- ✅ **Consulter** son propre dossier médical
- ✅ **Voir** ses résultats de laboratoire
- ✅ **Voir** ses ordonnances

**Restrictions :**
- ❌ Ne peut pas voir les rendez-vous des autres patients
- ❌ Ne peut pas créer de rendez-vous pour d'autres patients
- ❌ Ne peut pas modifier son dossier médical (lecture seule)

### 👨‍⚕️ MEDECIN
**Permissions :**
- ✅ **Consulter** tous ses rendez-vous assignés
- ✅ **Accepter** les rendez-vous en attente
- ✅ **Refuser** les rendez-vous (avec motif)
- ✅ **Replanifier** les rendez-vous
- ✅ **Marquer comme terminé** après consultation
- ✅ **Consulter** les dossiers de ses patients
- ✅ **Modifier** les dossiers patients
- ✅ **Créer** des ordonnances

**Restrictions :**
- ❌ **Ne peut PAS créer** de rendez-vous
- ❌ Ne peut pas voir les rendez-vous d'autres médecins
- ❌ Ne peut pas supprimer définitivement un rendez-vous

### 👩‍💼 SECRETAIRE
**Permissions :**
- ✅ **Créer** des rendez-vous pour les patients
- ✅ **Consulter** tous les rendez-vous
- ✅ **Modifier** tous les rendez-vous
- ✅ **Gérer** les dossiers patients
- ✅ **Gérer** le personnel médical

**Restrictions :**
- ❌ Ne peut pas créer d'ordonnances

### 🔬 LABORATOIRE
**Permissions :**
- ✅ **Créer** des demandes d'analyse
- ✅ **Uploader** les résultats
- ✅ **Consulter** les dossiers patients (lecture seule)

### 💊 PHARMACIEN
**Permissions :**
- ✅ **Consulter** les ordonnances
- ✅ **Marquer** les ordonnances comme délivrées
- ✅ **Consulter** les dossiers patients (lecture seule)

## Workflow des Rendez-vous

### 1. Création (PATIENT ou SECRETAIRE)
```
Patient/Secrétaire → Sélectionne médecin + date/heure + motif
                   → Statut: PENDING
                   → Notification au médecin
```

### 2. Validation (MEDECIN)
```
Médecin → Consulte les rendez-vous PENDING
        → Option 1: ACCEPTER → Statut: CONFIRMED
        → Option 2: REFUSER → Statut: CANCELLED (+ motif)
        → Option 3: REPLANIFIER → Nouvelle date + Statut: CONFIRMED
```

### 3. Consultation (MEDECIN)
```
Médecin → Marque comme COMPLETED après consultation
        → Peut créer ordonnance
        → Peut demander analyses
```

### 4. Annulation
```
Patient → Peut annuler si statut = PENDING ou CONFIRMED
Médecin → Peut annuler avec motif
Secrétaire → Peut annuler n'importe quand
```

## Statuts des Rendez-vous

| Statut | Description | Qui peut modifier |
|--------|-------------|-------------------|
| `PENDING` | En attente de validation médecin | Patient, Médecin, Secrétaire |
| `CONFIRMED` | Accepté par le médecin | Médecin, Secrétaire |
| `COMPLETED` | Consultation terminée | Médecin uniquement |
| `CANCELLED` | Annulé | Patient, Médecin, Secrétaire |

## API Endpoints

### Création de rendez-vous
```http
POST /appointments
Authorization: Bearer {token}
Roles: ROLE_PATIENT, ROLE_SECRETAIRE

{
  "doctorId": "keycloak-id-du-medecin",
  "patientId": "id-du-dossier-patient",
  "appointmentDate": "2026-02-05T10:00:00",
  "motif": "Consultation de suivi"
}
```

### Mise à jour du statut (Médecin)
```http
PUT /appointments/{id}/status?status=CONFIRMED
Authorization: Bearer {token}
Roles: ROLE_MEDECIN, ROLE_SECRETAIRE
```

### Consultation des rendez-vous
```http
# Pour un médecin
GET /appointments/doctor/{doctorId}
Authorization: Bearer {token}
Roles: ROLE_MEDECIN

# Pour un patient
GET /appointments/patient/{patientId}
Authorization: Bearer {token}
Roles: ROLE_PATIENT, ROLE_SECRETAIRE
```

## Configuration Keycloak

### Rôles Realm
- `ROLE_PATIENT`
- `ROLE_MEDECIN`
- `ROLE_SECRETAIRE`
- `ROLE_INFIRMIER`
- `ROLE_TECHNICIEN`
- `ROLE_AIDE_SOIGNANT`
- `ROLE_LABORATOIRE`
- `ROLE_PHARMACIEN`

### Permissions Granulaires
- `appointment:create` → PATIENT, SECRETAIRE
- `appointment:read` → Tous
- `appointment:update` → MEDECIN, SECRETAIRE
- `appointment:delete` → SECRETAIRE
- `dossier:read` → MEDECIN, INFIRMIER, LABORATOIRE, PHARMACIEN
- `dossier:write` → MEDECIN, SECRETAIRE
- `staff:write` → SECRETAIRE
- `prescription:write` → MEDECIN
- `lab:write` → LABORATOIRE

## Configuration Initiale

1. **Exécuter le script de configuration des rôles :**
```bash
python configure_roles.py
```

2. **Créer les utilisateurs de test dans Keycloak :**
   - Patient: `patient@test.com` → ROLE_PATIENT
   - Médecin: `medecin@test.com` → ROLE_MEDECIN
   - Secrétaire: `secretaire@test.com` → ROLE_SECRETAIRE

3. **Créer les fiches personnel pour les médecins :**
   - Via l'interface Staff
   - Lier le Keycloak ID au personnel

## Notes Importantes

⚠️ **Le médecin NE CRÉE PAS de rendez-vous** - C'est le patient ou la secrétaire qui le fait

⚠️ **Validation obligatoire** - Tous les rendez-vous créés sont en PENDING jusqu'à validation médecin

⚠️ **Keycloak ID** - Les médecins sont identifiés par leur Keycloak ID (UUID), pas par un ID numérique
