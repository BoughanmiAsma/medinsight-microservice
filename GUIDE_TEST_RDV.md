# Guide de Test - Système de Rendez-vous MedInsight

## Prérequis

Avant de tester, assurez-vous que :
1. ✅ Tous les services Docker sont démarrés
2. ✅ Keycloak est accessible sur http://localhost:8180
3. ✅ Les rôles ont été configurés (`python configure_roles.py`)

## Étape 1 : Créer les Utilisateurs de Test dans Keycloak

### Accéder à Keycloak Admin
1. Ouvrir http://localhost:8180
2. Se connecter avec `admin` / `admin`
3. Sélectionner le realm `microservices-realm`

### Créer un Patient
1. Aller dans **Users** → **Add user**
2. Remplir :
   - Username: `patient.test`
   - Email: `patient@test.com`
   - First name: `Jean`
   - Last name: `Dupont`
   - Email verified: ✅
3. Cliquer **Create**
4. Onglet **Credentials** → Définir mot de passe `password` (Temporary: OFF)
5. Onglet **Role mapping** → Assign role → `ROLE_PATIENT`

### Créer un Médecin
1. **Users** → **Add user**
2. Remplir :
   - Username: `dr.martin`
   - Email: `dr.martin@medinsight.com`
   - First name: `Sophie`
   - Last name: `Martin`
   - Email verified: ✅
3. Cliquer **Create**
4. **Copier l'ID Keycloak** (dans l'URL ou onglet Details)
   - Exemple: `02537445-449a-4ddd-ac91-70e10af23e4f`
5. Onglet **Credentials** → mot de passe `password`
6. Onglet **Role mapping** → `ROLE_MEDECIN`

### Créer une Secrétaire
1. **Users** → **Add user**
2. Remplir :
   - Username: `secretaire.admin`
   - Email: `secretaire@medinsight.com`
   - First name: `Marie`
   - Last name: `Leblanc`
3. Mot de passe `password`
4. Role: `ROLE_SECRETAIRE`

## Étape 2 : Créer la Fiche Personnel du Médecin

### Se connecter en tant que Secrétaire
1. Frontend: http://localhost:5173
2. Login: `secretaire@medinsight.com` / `password`

### Créer le Personnel Médecin
1. Menu **Personnel** → **Nouveau Personnel**
2. Remplir :
   - Nom: `Martin`
   - Prénom: `Sophie`
   - Email: `dr.martin@medinsight.com` ⚠️ **IMPORTANT : même email que Keycloak**
   - Type: `MEDECIN`
   - Spécialité: `Cardiologie`
   - Numéro de licence: `12345`
   - Téléphone: `0123456789`
3. **Enregistrer**

> ⚠️ Le système va automatiquement lier le Keycloak ID au personnel via l'email

## Étape 3 : Créer un Dossier Patient

### Toujours connecté en tant que Secrétaire
1. Menu **Dossiers** → **Nouveau Dossier**
2. Remplir :
   - Nom: `Dupont`
   - Prénom: `Jean`
   - Date de naissance: `1990-01-15`
   - Sexe: `M`
   - Email: `patient@test.com`
   - Téléphone: `0612345678`
   - Adresse: `123 Rue de la Santé, Paris`
3. **Enregistrer**
4. **Noter l'ID du dossier** (visible dans l'URL ou la liste)

## Étape 4 : Tester la Création de Rendez-vous (PATIENT)

### Se déconnecter et se reconnecter en tant que Patient
1. Logout
2. Login: `patient@test.com` / `password`

### Créer un Rendez-vous
1. Menu **Rendez-vous** → **Nouveau RDV**
2. Remplir :
   - Médecin: Sélectionner `Dr. Sophie Martin`
   - Date/Heure: Choisir une date future (ex: demain 10h00)
   - Motif: `Consultation de contrôle`
   - ID Dossier: `[l'ID noté à l'étape 3]`
3. **Réserver**

### Vérifier
✅ Le rendez-vous apparaît dans le calendrier avec statut **PENDING** (orange)

## Étape 5 : Tester la Validation (MEDECIN)

### Se reconnecter en tant que Médecin
1. Logout
2. Login: `dr.martin@medinsight.com` / `password`

### Consulter les Rendez-vous
1. Menu **Rendez-vous**
2. ✅ Le rendez-vous créé par le patient doit apparaître
3. ⚠️ **Pas de bouton "Nouveau RDV"** (normal, le médecin ne crée pas de RDV)

### Accepter le Rendez-vous
1. Cliquer sur le rendez-vous
2. Bouton **Accepter** ou **Confirmer**
3. Le statut passe à **CONFIRMED** (vert)

## Étape 6 : Tests Supplémentaires

### Test : Médecin ne peut pas créer de RDV
- ✅ Connecté en tant que médecin
- ✅ Pas de bouton "Nouveau RDV" visible
- ✅ Uniquement consultation et gestion

### Test : Patient voit uniquement ses RDV
- ✅ Créer 2 patients différents
- ✅ Chaque patient ne voit que ses propres RDV

### Test : Secrétaire voit tout
- ✅ Connecté en tant que secrétaire
- ✅ Peut voir tous les RDV
- ✅ Peut créer des RDV pour n'importe quel patient

## Résolution de Problèmes

### Erreur : "Le médecin n'existe pas"
➡️ **Solution** : Vérifier que :
1. La fiche personnel a été créée
2. L'email du personnel = email Keycloak
3. Le Keycloak ID a été correctement lié

### Erreur 401 lors de la création
➡️ **Solution** :
1. Vérifier que l'utilisateur a le bon rôle (ROLE_PATIENT ou ROLE_SECRETAIRE)
2. Vérifier le token JWT dans les DevTools

### Le médecin ne voit pas ses RDV
➡️ **Solution** :
1. Vérifier que le `doctorId` dans la BDD = Keycloak ID du médecin
2. Vérifier les logs du service appointment

## Commandes Utiles

### Vérifier les logs
```bash
# Appointment service
docker logs appointment-service --tail 100

# Staff service
docker logs staff-service --tail 100
```

### Tester l'API directement
```bash
# Obtenir un token
curl -X POST http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token \
  -d "client_id=medinsight-client" \
  -d "username=patient@test.com" \
  -d "password=password" \
  -d "grant_type=password"

# Créer un RDV (remplacer {TOKEN})
curl -X POST http://localhost:8200/appointments \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "02537445-449a-4ddd-ac91-70e10af23e4f",
    "patientId": "1",
    "appointmentDate": "2026-02-05T10:00:00",
    "motif": "Test"
  }'
```

## Checklist de Validation

- [ ] Patient peut créer un RDV
- [ ] Patient ne voit que ses RDV
- [ ] Médecin ne peut PAS créer de RDV
- [ ] Médecin voit tous ses RDV assignés
- [ ] Médecin peut accepter/refuser un RDV
- [ ] Secrétaire peut tout gérer
- [ ] Les statuts changent correctement
- [ ] Les notifications Kafka fonctionnent
