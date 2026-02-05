#!/usr/bin/env python3
"""
Script de génération de données via Kong Gateway
"""

import requests
from datetime import datetime, timedelta
import random
from faker import Faker

# Configuration - Utiliser Kong comme proxy
KEYCLOAK_URL = "http://localhost:8180"
KEYCLOAK_REALM = "microservices-realm"
ADMIN_USERNAME = "admin1"
ADMIN_PASSWORD = "Admin123!"

# Toutes les APIs passent par Kong
KONG_URL = "http://localhost:8200"

fake = Faker('fr_FR')

MOTIFS = [
    "Consultation générale", "Suivi médical", "Renouvellement ordonnance",
    "Douleurs thoraciques", "Migraine", "Bilan de santé",
    "Vaccination", "Certificat médical", "Troubles du sommeil"
]

def get_jwt_token(username, password):
    """Obtient un JWT token"""
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        'client_id': 'medinsight-client',
        'username': username,
        'password': password,
        'grant_type': 'password'
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()['access_token']
    return None

def main():
    print("🏥 === Génération de données via Kong ===\n")
    
    # Auth
    print("🔑 Authentification...")
    jwt_token = get_jwt_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    
    if not jwt_token:
        print("❌ Erreur d'authentification")
        return
    print("✅ Authentifié\n")
    
    headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
    
    # Récupérer les médecins existants via Kong
    print("👨‍⚕️ Récupération des médecins...")
    response = requests.get(f"{KONG_URL}/staffs/actifs", headers=headers)
    if response.status_code == 200:
        doctors = [d for d in response.json() if d.get('type') == 'MEDECIN' and d.get('keycloakId')]
        print(f"✅ {len(doctors)} médecins trouvés\n")
    else:
        print(f"❌ Erreur récupération médecins: {response.status_code}")
        doctors = []
    
    if not doctors:
        print("❌ Aucun médecin disponible. Arrêt.")
        return
    
    # Tester la création d'un patient
    print("👥 Test de création de patient...")
    test_patient = {
        "nom": "Test",
        "prenom": "Patient",
        "dateNaissance": "1990-01-01",
        "sexe": "M",
        "telephone": "0612345678",
        "email": "test.patient@email.com",
       "numeroSecuriteSociale": "190017512345678",
        "groupeSanguin": "O+",
        "poids": 75.5
    }
    
    response = requests.post(f"{KONG_URL}/dossiers", json=test_patient, headers=headers)
    if response.status_code in [200, 201]:
        patient = response.json()
        print(f"✅ Patient créé: {patient.get('id')}\n")
        
        # Tester la création d'un RDV
        print("📅 Test de création de rendez-vous...")
        doctor = doctors[0]
        apt_data = {
            "patientId": patient['id'],
            "doctorId": doctor['keycloakId'],
            "appointmentDate": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
            "status": "PENDING",
            "motif": "Test consultation"
        }
        
        response = requests.post(f"{KONG_URL}/appointments", json=apt_data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"✅ RDV créé!\n")
            print("🎉 Le système fonctionne! Vous pouvez maintenant voir les données dans les dashboards.")
        else:
            print(f"⚠️  Erreur création RDV: {response.status_code} - {response.text}")
    else:
        print(f"⚠️  Erreur création patient: {response.status_code} - {response.text}")

if __name__ == "__main__":
    main()
