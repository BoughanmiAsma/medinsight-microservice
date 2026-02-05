#!/usr/bin/env python3
"""
Script de génération de données réalistes pour MedInsight
Génère : Patients, Médecins, RDV, Consultations, Ordonnances, Analyses
"""

import requests
from datetime import datetime, timedelta
import random
import json
from faker import Faker

# Configuration
KONG_URL = "http://localhost:8200"
STAFF_API = "http://localhost:9002"
DOSSIER_API = "http://localhost:9003"
APPOINTMENT_API = "http://localhost:9004"
ORDONNANCE_API = "http://localhost:9005"
LAB_API = "http://localhost:9006"

KEYCLOAK_URL = "http://localhost:8180"
KEYCLOAK_REALM = "microservices-realm"
KEYCLOAK_ADMIN = "admin"
KEYCLOAK_PASSWORD = "admin"

# Admin user credentials for API access
ADMIN_USERNAME = "admin1"
ADMIN_PASSWORD = "Admin123!"

# Initialiser Faker en français
fake = Faker('fr_FR')

# Données de référence
SPECIALITES = [
    "Cardiologie", "Dermatologie", "Pédiatrie", "Neurologie",
    "Orthopédie", "Ophtalmologie", "ORL", "Psychiatrie",
    "Rhumatologie", "Endocrinologie"
]

MOTIFS_CONSULTATION = [
    "Consultation générale", "Suivi médical", "Renouvellement ordonnance",
    "Douleurs thoraciques", "Migraine", "Contrôle post-opératoire",
    "Vaccination", "Bilan de santé", "Certificat médical",
    "Troubles du sommeil", "Stress et anxiété", "Problèmes digestifs"
]

DIAGNOSTICS = [
    "Hypertension artérielle", "Diabète type 2", "Asthme",
    "Rhinopharyngite", "Gastro-entérite", "Lombalgie",
    "Anxiété généralisée", "Migraine", "Allergie saisonnière",
    "Arthrose", "Hypercholestérolémie", "Anémie"
]

MEDICAMENTS = [
    {"nom": "Doliprane 1000mg", "dosage": "1 comprimé"},
    {"nom": "Ibuprofen 400mg", "dosage": "1 comprimé"},
    {"nom": "Amoxicilline 500mg", "dosage": "1 gélule"},
    {"nom": "Paracétamol 500mg", "dosage": "1-2 comprimés"},
    {"nom": "Ventoline 100µg", "dosage": "2 bouffées"},
    {"nom": "Levothyrox 50µg", "dosage": "1 comprimé"},
    {"nom": "Metformine 850mg", "dosage": "1 comprimé"},
]

TESTS_LABO = [
    "Numération formule sanguine (NFS)",
    "Glycémie à jeun",
    "Bilan lipidique",
    "Créatinine",
    "TSH (hormone thyroïde)",
    "Vitamine D",
    "Ferritine",
    "CRP (protéine C-réactive)"
]

def get_user_jwt_token(username, password):
    """Obtient un JWT token pour un utilisateur de l'application"""
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
        else:
            print(f"❌ Erreur auth utilisateur: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception auth: {e}")
        return None

def get_keycloak_admin_token():
    """Récupère le token admin Keycloak"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        'client_id': 'admin-cli',
        'username': KEYCLOAK_ADMIN,
        'password': KEYCLOAK_PASSWORD,
        'grant_type': 'password'
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"❌ Erreur auth Keycloak: {response.status_code}")
        return None

def create_keycloak_user(token, email, first_name, last_name, password, role):
    """Crée un utilisateur dans Keycloak avec un rôle"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Créer l'utilisateur
    user_data = {
        'username': email,
        'email': email,
        'firstName': first_name,
        'lastName': last_name,
        'enabled': True,
        'credentials': [{
            'type': 'password',
            'value': password,
            'temporary': False
        }]
    }
    
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
    response = requests.post(url, json=user_data, headers=headers)
    
    if response.status_code == 201:
        # Récupérer l'ID utilisateur
        location = response.headers.get('Location')
        user_id = location.split('/')[-1]
        
        # Assigner le rôle
        role_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm"
        
        # Récupérer l'ID du rôle
        roles_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role}"
        role_response = requests.get(roles_url, headers=headers)
        
        if role_response.status_code == 200:
            role_data = role_response.json()
            requests.post(role_url, json=[role_data], headers=headers)
        
        return user_id
    elif response.status_code == 409:
        print(f"   ℹ️  Utilisateur {email} existe déjà")
        # Chercher l'utilisateur existant
        search_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users?username={email}"
        search_response = requests.get(search_url, headers=headers)
        if search_response.status_code == 200 and search_response.json():
            return search_response.json()[0]['id']
    return None

def create_patient(dossier_data, jwt_token):
    """Crée un dossier patient"""
    try:
        headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{DOSSIER_API}/dossiers", json=dossier_data, headers=headers)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"   ⚠️  Erreur création patient: {response.status_code}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def create_staff(staff_data, jwt_token):
    """Crée un membre du staff"""
    try:
        headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{STAFF_API}/staffs", json=staff_data, headers=headers)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"   ⚠️  Erreur création staff: {response.status_code}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def create_appointment(appointment_data, jwt_token):
    """Crée un rendez-vous"""
    try:
        headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{APPOINTMENT_API}/appointments", json=appointment_data, headers=headers)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"   ⚠️  Erreur création RDV: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def create_consultation(consult_data, jwt_token):
    """Crée une consultation"""
    try:
        headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{DOSSIER_API}/dossiers/{consult_data['dossierId']}/consultations", json=consult_data, headers=headers)
        if response.status_code in [200, 201]:
            return response.json()
        return None
    except Exception as e:
        return None

def main():
    print("🏥 === Génération de données réalistes pour MedInsight ===\n")
    
    # 1. Authentification utilisateur admin (pour les APIs)
    print("🔑 Connexion avec l'admin...")
    jwt_token = get_user_jwt_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not jwt_token:
        print("❌ Impossible d'obtenir le token JWT. Vérifiez les credentials admin.")
        return
    print("✅ Token JWT obtenu\n")
    
    # 2. Authentification Keycloak
    print("🔑 Connexion à Keycloak...")
    kc_token = get_keycloak_admin_token()
    if not kc_token:
        print("❌ Impossible de se connecter à Keycloak. Arrêt.")
        return
    print("✅ Connecté à Keycloak\n")
    
    # 3. Créer des médecins
    print("👨‍⚕️ Création de 15 médecins...")
    doctors = []
    for i in range(15):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}@medinsight.local"
        specialty = random.choice(SPECIALITES)
        
        # Créer dans Keycloak
        kc_id = create_keycloak_user(
            kc_token, email, first_name, last_name,
            "Medecin123!", "ROLE_MEDECIN"
        )
        
        if kc_id:
            # Créer dans Staff
            staff_data = {
                "keycloakId": kc_id,
                "nom": last_name,
                "prenom": first_name,
                "email": email,
                "telephone": fake.phone_number(),
                "type": "MEDECIN",
                "specialite": specialty,
                "numeroLicence": f"MED{random.randint(100000, 999999)}",
                "actif": True,
                "dateEmbauche": (datetime.now() - timedelta(days=random.randint(30, 1825))).isoformat()
            }
            
            staff = create_staff(staff_data, jwt_token)
            if staff:
                doctors.append(staff)
                print(f"   ✅ Dr. {first_name} {last_name} ({specialty})")
    
    print(f"\n✅ {len(doctors)} médecins créés\n")
    
    # 4. Créer des patients
    print("👥 Création de 50 patients...")
    patients = []
    for i in range(50):
        sexe = random.choice(['M', 'F'])
        first_name = fake.first_name_male() if sexe == 'M' else fake.first_name_female()
        last_name = fake.last_name()
        
        # Créer dans Keycloak
        email = f"{first_name.lower()}.{last_name.lower()}{i}@email.com"
        kc_id = create_keycloak_user(
            kc_token, email, first_name, last_name,
            "Patient123!", "ROLE_PATIENT"
        )
        
        if kc_id:
            patient_data = {
                "nom": last_name,
                "prenom": first_name,
                "dateNaissance": fake.date_of_birth(minimum_age=18, maximum_age=85).isoformat(),
                "sexe": sexe,
                "telephone": fake.phone_number(),
                "email": email,
                "adresse": fake.address().replace('\n', ', '),
                "numeroSecuriteSociale": f"{random.randint(1, 2)}{fake.random_number(digits=14)}",
                "groupeSanguin": random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
                "poids": round(random.uniform(50, 100), 1),
                "allergies": random.sample(["Pénicilline", "Arachides", "Lactose", "Pollen"], random.randint(0, 2)),
                "antecedents": random.sample(["Hypertension", "Diabète", "Asthme", "Allergie"], random.randint(0, 2))
            }
            
            patient = create_patient(patient_data, jwt_token)
            if patient and 'id' in patient:
                patients.append(patient)
                if (i + 1) % 10 == 0:
                    print(f"   ✅ {i + 1} patients créés...")
    
    print(f"\n✅ {len(patients)} patients créés\n")
    
    # 4. Créer des rendez-vous (passés, présents, futurs)
    print("📅 Création de 200 rendez-vous...")
    appointments = []
    statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
    
    for i in range(200):
        if not doctors or not patients:
            break
            
        doctor = random.choice(doctors)
        patient = random.choice(patients)
        
        # Générer une date (50% passé, 30% futur proche, 20% futur lointain)
        rand = random.random()
        if rand < 0.5:  # Passé
            date = datetime.now() - timedelta(days=random.randint(1, 365))
            status = random.choice(['COMPLETED', 'CANCELLED'])
        elif rand < 0.8:  # Futur proche (1-30 jours)
            date = datetime.now() + timedelta(days=random.randint(1, 30))
            status = random.choice(['PENDING', 'CONFIRMED'])
        else:  # Futur lointain
            date = datetime.now() + timedelta(days=random.randint(31, 180))
            status = 'PENDING'
        
        # Arrondir à une heure pleine
        date = date.replace(hour=random.randint(8, 18), minute=random.choice([0, 15, 30, 45]), second=0, microsecond=0)
        
        appointment_data = {
            "patientId": patient['id'],
            "doctorId": doctor.get('keycloakId', f"doctor-{doctor['id']}"),
            "appointmentDate": date.isoformat(),
            "status": status,
            "motif": random.choice(MOTIFS_CONSULTATION),
            "notes": fake.sentence() if random.random() > 0.7 else None
        }
        
        apt = create_appointment(appointment_data, jwt_token)
        if apt:
            appointments.append(apt)
            
            # Si le RDV est complété, créer une consultation
            if status == 'COMPLETED' and random.random() > 0.3:
                consult_data = {
                    "dossierId": patient['id'],
                    "medecinId": doctor.get('keycloakId', f"doctor-{doctor['id']}"),
                    "consultationDate": date.isoformat(),
                    "motif": appointment_data['motif'],
                    "symptomes": fake.sentence(),
                    "diagnostic": random.choice(DIAGNOSTICS),
                    "notes": fake.text(max_nb_chars=150),
                    "visiteType": random.choice(["CONSULTATION", "SUIVI", "URGENCE"])
                }
                create_consultation(consult_data, jwt_token)
            
            if (i + 1) % 50 == 0:
                print(f"   ✅ {i + 1} rendez-vous créés...")
    
    print(f"\n✅ {len(appointments)} rendez-vous créés\n")
    
    # Résumé
    print("\n🎉 === Génération terminée ! ===")
    print(f"✅ {len(doctors)} médecins")
    print(f"✅ {len(patients)} patients")
    print(f"✅ {len(appointments)} rendez-vous")
    print(f"\n💡 Vos dashboards sont maintenant remplis de données réalistes !")
    print(f"🔐 Mot de passe par défaut:")
    print(f"   - Médecins: Medecin123!")
    print(f"   - Patients: Patient123!")

if __name__ == "__main__":
    main()
