#!/usr/bin/env python3
"""
Script de génération de données pour MedInsight via Kong Gateway
Utilise les médecins existants et génère des patients + RDV
"""

import requests
from datetime import datetime, timedelta
import random
from faker import Faker

# Configuration
KEYCLOAK_URL = "http://localhost:8180"
KEYCLOAK_REALM = "microservices-realm"
KEYCLOAK_ADMIN = "admin"
KEYCLOAK_PASSWORD = "admin"
ADMIN_USERNAME = "admin1"
ADMIN_PASSWORD = "Admin123!"

# Kong Gateway URL
KONG_URL = "http://localhost:8200"

fake = Faker('fr_FR')

MOTIFS = [
    "Consultation générale", "Suivi médical", "Renouvellement ordonnance",
    "Douleurs thoraciques", "Migraine", "Bilan de santé",
    "Vaccination", "Certificat médical", "Troubles du sommeil",
    "Suivi diabète", "Contrôle tension", "Douleur articulaire"
]

DIAGNOSTICS = [
    "Hypertension artérielle", "Diabète type 2", "Asthme",
    "Rhinopharyngite", "Gastro-entérite", "Lombalgie",
    "Anxiété", "Migraine", "Allergie", "Arthrose",
    "Hypercholestérolémie", "Fatigue chronique"
]

def get_user_jwt_token(username, password):
    """Obtient un JWT token pour l'application via Keycloak"""
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        'client_id': 'medinsight-client',
        'username': username,
        'password': password,
        'grant_type': 'password'
    }
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            return response.json()['access_token']
    except Exception:
        pass
    return None

def get_keycloak_admin_token():
    """Obtient le token admin pour le Keycloak Master Realm"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        'client_id': 'admin-cli',
        'username': KEYCLOAK_ADMIN,
        'password': KEYCLOAK_PASSWORD,
        'grant_type': 'password'
    }
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            return response.json()['access_token']
    except Exception:
        pass
    return None

def create_keycloak_user(token, email, first_name, last_name, password, role):
    """Crée un utilisateur dans Keycloak et lui assigne un rôle"""
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    user_data = {
        'username': email,
        'email': email,
        'firstName': first_name,
        'lastName': last_name,
        'enabled': True,
        'credentials': [{'type': 'password', 'value': password, 'temporary': False}]
    }
    
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
    try:
        response = requests.post(url, json=user_data, headers=headers)
        if response.status_code == 201:
            user_id = response.headers.get('Location').split('/')[-1]
            
            # Assigner le rôle
            role_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm"
            roles_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role}"
            role_response = requests.get(roles_url, headers=headers)
            if role_response.status_code == 200:
                requests.post(role_url, json=[role_response.json()], headers=headers)
            return user_id
        elif response.status_code == 409:
            # L'utilisateur existe déjà, on récupère son ID
            search_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users?username={email}"
            search_response = requests.get(search_url, headers=headers)
            if search_response.status_code == 200 and search_response.json():
                return search_response.json()[0]['id']
    except Exception:
        pass
    return None

def main():
    print("🏥 === GÉNÉRATION DE DONNÉES RÉELLES POUR MEDINSIGHT ===\n")
    
    # Authentification
    print("🔑 Authentification...")
    jwt_token = get_user_jwt_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    kc_token = get_keycloak_admin_token()
    
    if not jwt_token:
        print("❌ Erreur: Impossible d'obtenir le token JWT de l'application.")
        return
    if not kc_token:
        print("❌ Erreur: Impossible d'obtenir le token admin Keycloak.")
        return
    print("✅ Authentification réussie\n")
    
    headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
    
    # 1. Récupérer les médecins existants
    print("👨‍⚕️ Récupération des médecins...")
    try:
        response = requests.get(f"{KONG_URL}/staffs/actifs", headers=headers)
        if response.status_code != 200:
            print(f"❌ Erreur lors de la récupération des médecins ({response.status_code})")
            return
        
        doctors = [d for d in response.json() if d.get('type') == 'MEDECIN' and d.get('keycloakId')]
        print(f"✅ {len(doctors)} médecins trouvés avec Keycloak ID\n")
        
        if not doctors:
            print("❌ Aucun médecin configuré avec Keycloak ID n'a été trouvé. Veuillez configurer les médecins d'abord.")
            return
    except Exception as e:
        print(f"❌ Erreur de connexion au service staff: {e}")
        return

    # 2. Créer des patients
    NUM_PATIENTS = 50
    print(f"👥 Création de {NUM_PATIENTS} patients...")
    patients = []
    
    for i in range(NUM_PATIENTS):
        sexe = random.choice(['M', 'F'])
        first_name = fake.first_name_male() if sexe == 'M' else fake.first_name_female()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(100, 999)}@example.com"
        
        # Création dans Keycloak pour simulation complète (optionnel mais recommandé pour les tests)
        kc_id = create_keycloak_user(kc_token, email, first_name, last_name, "Patient123!", "ROLE_PATIENT")
        
        if kc_id:
            patient_data = {
                "nom": last_name,
                "prenom": first_name,
                "dateNaissance": fake.date_of_birth(minimum_age=18, maximum_age=85).isoformat(),
                "sexe": sexe,
                "telephone": fake.phone_number(),
                "email": email,
                "adresse": fake.address().replace('\n', ', '),
                "numeroSecuriteSociale": f"{random.randint(1, 2)}{random.randint(1000000000000, 9999999999999)}",
                "groupeSanguin": random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
                "poids": round(random.uniform(55, 95), 1),
                "allergies": random.sample(["Pénicilline", "Arachides", "Pollen", "Lactose", "Acariens"], k=random.randint(0, 2)),
                "antecedents": random.sample(["Hypertension", "Diabète", "Asthme", "Hyperthyroïdie"], k=random.randint(0, 1))
            }
            
            try:
                response = requests.post(f"{KONG_URL}/dossiers", json=patient_data, headers=headers)
                if response.status_code in [200, 201]:
                    patients.append(response.json())
                    if (i + 1) % 10 == 0:
                        print(f"   📊 {i+1}/{NUM_PATIENTS} patients créés...")
            except Exception:
                pass
    
    print(f"✅ Terminé: {len(patients)} dossiers patients créés\n")
    
    if not patients:
        print("❌ Échec de la création des patients.")
        return

    # 3. Créer des rendez-vous
    NUM_RDV = 150
    print(f"📅 Création de {NUM_RDV} rendez-vous...")
    appointments_count = 0
    consultations_count = 0
    
    for i in range(NUM_RDV):
        doctor = random.choice(doctors)
        patient = random.choice(patients)
        
        # Distribution des dates: 40% passé, 10% aujourd'hui, 50% futur
        rand = random.random()
        if rand < 0.4: # Passé
            date = datetime.now() - timedelta(days=random.randint(1, 120))
            status = random.choice(['COMPLETED', 'CANCELLED', 'COMPLETED', 'COMPLETED'])
        elif rand < 0.5: # Aujourd'hui
            date = datetime.now().replace(hour=random.randint(8, 17), minute=random.choice([0, 15, 30, 45]))
            status = random.choice(['CONFIRMED', 'PENDING', 'CONFIRMED'])
        else: # Futur
            date = datetime.now() + timedelta(days=random.randint(1, 60))
            status = random.choice(['PENDING', 'CONFIRMED'])
        
        # Arrondir l'heure pour plus de réalisme
        date = date.replace(second=0, microsecond=0)
        
        apt_data = {
            "patientId": patient['id'],
            "doctorId": doctor['keycloakId'],
            "appointmentDate": date.isoformat(),
            "status": status,
            "motif": random.choice(MOTIFS),
            "notes": fake.sentence() if random.random() > 0.8 else None
        }
        
        try:
            response = requests.post(f"{KONG_URL}/appointments", json=apt_data, headers=headers)
            if response.status_code in [200, 201]:
                appointments_count += 1
                
                # Si le RDV est terminé, on crée aussi une consultation associée
                if status == 'COMPLETED' and random.random() > 0.2:
                    consult_data = {
                        "dossierId": patient['id'],
                        "medecinId": doctor['keycloakId'],
                        "consultationDate": date.isoformat(),
                        "motif": apt_data['motif'],
                        "symptomes": fake.sentence(),
                        "diagnostic": random.choice(DIAGNOSTICS),
                        "notes": fake.text(max_nb_chars=150),
                        "visiteType": random.choice(["CONSULTATION", "SUIVI", "URGENCE"])
                    }
                    requests.post(f"{KONG_URL}/dossiers/{patient['id']}/consultations", json=consult_data, headers=headers)
                    consultations_count += 1
        except Exception:
            pass
            
        if (i + 1) % 30 == 0:
            print(f"   📊 {i+1}/{NUM_RDV} rendez-vous traités...")

    print(f"\n✅ Terminé: {appointments_count} rendez-vous et {consultations_count} consultations créés")
    print("\n🏁 === SYNCHRONISATION TERMINÉE ===\n")
    print("Détails:")
    print(f"- Médecins utilisés: {len(doctors)}")
    print(f"- Nouveaux patients: {len(patients)}")
    print(f"- Nouveaux rendez-vous: {appointments_count}")
    print(f"- Nouvelles consultations: {consultations_count}")
    print("\n💡 Vous pouvez maintenant rafraîchir le dashboard pour voir les statistiques réelles.")

if __name__ == "__main__":
    main()
