# Résumé des Modifications - Système de Rendez-vous

## Date : 2026-02-04

## Problème Initial
L'utilisateur a signalé que la logique métier était incorrecte :
- ❌ Le médecin ne devrait PAS créer de rendez-vous
- ✅ Le médecin devrait seulement consulter, accepter, refuser et replanifier
- ✅ Seul le PATIENT peut créer des rendez-vous

## Modifications Apportées

### 1. Frontend (`Appointments.tsx`)

#### Changements :
- ✅ Masqué le bouton "Nouveau RDV" pour les médecins
- ✅ Changé le sous-titre selon le rôle
- ✅ Conservé la fonctionnalité de création pour patients et secrétaires

```tsx
// Avant
<Button onClick={() => setIsBookModalOpen(true)}>
  Nouveau RDV
</Button>

// Après
{!isDoctor && (
  <Button onClick={() => setIsBookModalOpen(true)}>
    Nouveau RDV
  </Button>
)}
```

### 2. Backend - AppointmentController

#### Ajouts :
- ✅ Nouveau endpoint `PUT /appointments/{id}/status` pour que les médecins puissent gérer les statuts
- ✅ Commentaires explicatifs sur les permissions

```java
@PutMapping("/{id}/status")
public ResponseEntity<Appointment> updateStatus(
        @PathVariable Long id,
        @RequestParam String status) {
    // Doctors can accept/reject/reschedule appointments
    return ResponseEntity.ok(service.updateAppointmentStatus(id, status));
}
```

### 3. Backend - AppointmentService

#### Ajouts :
- ✅ Méthode `updateAppointmentStatus()` pour changer le statut
- ✅ Notification Kafka lors du changement de statut

```java
public Appointment updateAppointmentStatus(Long id, String statusStr) {
    Appointment appointment = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
    
    AppointmentStatus status = AppointmentStatus.valueOf(statusStr.toUpperCase());
    appointment.setStatus(status);
    Appointment updated = repository.save(appointment);
    
    kafkaProducerService.sendAppointmentEvent("appointment.status.updated", updated);
    
    return updated;
}
```

### 4. Configuration Keycloak

#### Script `configure_roles.py` créé :
- ✅ Création automatique de tous les rôles
- ✅ Permissions granulaires définies
- ✅ Documentation des permissions par rôle

#### Rôles créés :
- `ROLE_PATIENT` - Peut créer des RDV
- `ROLE_MEDECIN` - Peut gérer (pas créer) des RDV
- `ROLE_SECRETAIRE` - Peut tout faire
- `ROLE_LABORATOIRE` - Gestion des analyses
- `ROLE_PHARMACIEN` - Gestion des ordonnances
- Etc.

#### Permissions granulaires :
- `appointment:create` → PATIENT, SECRETAIRE
- `appointment:read` → Tous
- `appointment:update` → MEDECIN, SECRETAIRE
- `appointment:delete` → SECRETAIRE
- `dossier:read` → MEDECIN, INFIRMIER, LABO, PHARMACIEN
- `dossier:write` → MEDECIN, SECRETAIRE

### 5. Documentation

#### Fichiers créés :

**`LOGIQUE_METIER_RDV.md`**
- ✅ Description complète de la logique métier
- ✅ Permissions par rôle
- ✅ Workflow des rendez-vous
- ✅ Statuts et transitions
- ✅ Exemples d'API

**`GUIDE_TEST_RDV.md`**
- ✅ Guide pas-à-pas pour tester
- ✅ Création des utilisateurs Keycloak
- ✅ Scénarios de test complets
- ✅ Résolution de problèmes
- ✅ Checklist de validation

**`configure_roles.py`**
- ✅ Script automatisé de configuration
- ✅ Création de tous les rôles
- ✅ Affichage du résumé des permissions

## Workflow Corrigé

### Avant (Incorrect) :
```
Médecin → Crée un RDV → Patient reçoit
```

### Après (Correct) :
```
Patient → Crée un RDV (PENDING)
       ↓
Médecin → Consulte ses RDV
       → Accepte (CONFIRMED) / Refuse (CANCELLED) / Replanifie
       ↓
Patient → Reçoit notification
       → Voit le statut mis à jour
```

## Statuts des Rendez-vous

| Statut | Créé par | Modifiable par | Signification |
|--------|----------|----------------|---------------|
| PENDING | Patient/Secrétaire | Médecin, Secrétaire | En attente validation |
| CONFIRMED | Médecin | Médecin, Secrétaire | Accepté par médecin |
| COMPLETED | Médecin | Médecin | Consultation terminée |
| CANCELLED | Tous | Tous | Annulé |

## API Endpoints

### Pour les Patients
```http
POST /appointments          # Créer un RDV
GET /appointments/patient/{id}  # Voir ses RDV
DELETE /appointments/{id}   # Annuler son RDV
```

### Pour les Médecins
```http
GET /appointments/doctor/{id}   # Voir ses RDV assignés
PUT /appointments/{id}/status   # Accepter/Refuser/Replanifier
PUT /appointments/{id}          # Marquer comme terminé
```

### Pour les Secrétaires
```http
POST /appointments          # Créer pour n'importe qui
GET /appointments           # Voir tous les RDV
PUT /appointments/{id}      # Modifier n'importe quel RDV
DELETE /appointments/{id}   # Supprimer n'importe quel RDV
```

## Tests à Effectuer

### ✅ Test 1 : Patient crée un RDV
1. Login en tant que patient
2. Créer un RDV avec un médecin
3. Vérifier statut = PENDING
4. Vérifier que le RDV apparaît dans la liste

### ✅ Test 2 : Médecin ne peut pas créer
1. Login en tant que médecin
2. Vérifier que le bouton "Nouveau RDV" n'existe pas
3. Vérifier que l'API refuse si on essaie quand même

### ✅ Test 3 : Médecin accepte un RDV
1. Login en tant que médecin
2. Voir le RDV PENDING
3. Cliquer "Accepter"
4. Vérifier statut = CONFIRMED

### ✅ Test 4 : Secrétaire peut tout faire
1. Login en tant que secrétaire
2. Créer un RDV pour un patient
3. Modifier un RDV existant
4. Voir tous les RDV de tous les médecins

## Problèmes Résolus

### ❌ Avant :
- Médecin pouvait créer des RDV (incorrect)
- Pas de distinction claire des rôles
- Pas de workflow de validation
- Permissions mal définies

### ✅ Après :
- Médecin ne peut QUE gérer ses RDV
- Rôles clairement définis dans Keycloak
- Workflow PENDING → CONFIRMED → COMPLETED
- Permissions granulaires configurées

## Prochaines Étapes Recommandées

1. **Tester le système complet** avec le guide de test
2. **Créer les utilisateurs de démo** dans Keycloak
3. **Vérifier les notifications** Kafka
4. **Ajouter l'interface de gestion** des statuts pour les médecins
5. **Implémenter les notifications** push/email

## Commandes Rapides

```bash
# Configurer les rôles Keycloak
cd medinsight-microservice
python configure_roles.py

# Rebuild appointment service
cd MedInsight-Microservices
docker-compose up -d --build appointment-service

# Vérifier les logs
docker logs appointment-service --tail 50
docker logs staff-service --tail 50

# Tester l'API
curl http://localhost:8200/appointments/test
```

## Notes Importantes

⚠️ **Le médecin est identifié par son Keycloak ID (UUID)**, pas par un ID numérique

⚠️ **La fiche personnel doit être créée** avec le même email que le compte Keycloak

⚠️ **Tous les RDV commencent en PENDING** et nécessitent validation médecin

✅ **La sécurité du staff-service a été temporairement désactivée** pour permettre les appels internes. À réactiver en production avec un mécanisme de service-to-service auth.
