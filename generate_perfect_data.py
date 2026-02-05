import requests
import random
from datetime import datetime, timedelta
from faker import Faker
import uuid

# Configuration
KEYCLOAK_URL = "http://localhost:8180"
KEYCLOAK_REALM = "microservices-realm"
ADMIN_USERNAME = "admin1"
ADMIN_PASSWORD = "Admin123!"
KONG_URL = "http://localhost:8200"

fake = Faker('fr_FR')

# Medical Data
DIAGNOSTICS = [
    "Diabète de type 2", "Infection respiratoire", "Lombalgie", 
    "Asthme", "Hypertension", "Migraine", "Anémie", "Gastro-entérite"
]

SYMPTOMES = [
    "Fatigue et soif", "Céphalées", "Toux et fièvre", "Douleur lombaire",
    "Oppression thoracique", "Pâleur", "Nausées"
]

RECOMMANDATIONS = [
    "Repos strict 3 jours", "Hydratation abondante", "A revoir dans 15 jours",
    "Bilan sanguin à faire", "Continuer traitement actuel"
]

MOTIFS = [
    "Consultation de routine", "Suivi mensuel", "Urgence", "Renouvellement"
]

DRUGS = [
    {"name": "Doliprane 1000mg", "dosage": "1 comprimé 3 fois par jour"},
    {"name": "Amoxicilline 500mg", "dosage": "2 gélules par jour"},
    {"name": "Ventoline", "dosage": "2 bouffées par jour"}
]

LAB_TESTS = ["NFS", "Glycémie", "Bilan Lipidique", "CRP"]

def get_token():
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        'client_id': 'medinsight-client',
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD,
        'grant_type': 'password'
    }
    return requests.post(url, data=data).json()['access_token']

def main():
    print("🚀 GÉNÉRATION DES DONNÉES PARFAITES...")
    token = get_token()
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # 1. Get Doctors
    resp = requests.get(f"{KONG_URL}/staffs/actifs", headers=headers)
    doctors = [d for d in resp.json() if d.get('type') == 'MEDECIN' and d.get('keycloakId')]
    print(f"👨‍⚕️ {len(doctors)} médecins valides trouvés.")

    # 2. Create 50 Patients
    patients = []
    print("👥 Création de 50 patients...")
    for i in range(50):
        sexe = random.choice(['M', 'F'])
        first_name = fake.first_name_male() if sexe == 'M' else fake.first_name_female()
        last_name = fake.last_name()
        
        patient_data = {
            "nom": last_name,
            "prenom": first_name,
            "dateNaissance": fake.date_of_birth(minimum_age=18, maximum_age=85).isoformat(),
            "sexe": sexe,
            "telephone": fake.phone_number(),
            "email": f"{first_name.lower()}.{last_name.lower()}{random.randint(100, 999)}@example.com",
            "adresse": fake.address().replace('\n', ', '),
            "numeroSecuriteSociale": f"{random.randint(1, 2)}{random.randint(1000000000000, 9999999999999)}",
            "groupeSanguin": random.choice(['A+', 'B+', 'O+', 'AB+']),
            "poids": float(random.randint(50, 100)),
            "allergies": random.sample(["Pollen", "Pénicilline", "Acariens"], k=random.randint(0, 1)),
            "antecedents": random.sample(["Diabète", "Hypertension"], k=random.randint(0, 1))
        }
        
        resp = requests.post(f"{KONG_URL}/dossiers", json=patient_data, headers=headers)
        if resp.status_code in [200, 201]:
            patients.append(resp.json())

    print(f"✅ {len(patients)} patients créés.")

    # 3. Create 100 Appointments & Consultations
    print("📅 Génération des rendez-vous et consultations...")
    for i in range(100):
        if not patients or not doctors: break
        patient = random.choice(patients)
        doctor = random.choice(doctors)
        
        date = datetime.now() - timedelta(days=random.randint(1, 60))
        date = date.replace(hour=random.randint(8, 17), minute=random.choice([0, 30]), second=0, microsecond=0)
        
        apt_data = {
            "patientId": patient['id'],
            "doctorId": doctor['keycloakId'],
            "appointmentDate": date.isoformat(),
            "status": "COMPLETED",
            "motif": random.choice(MOTIFS)
        }
        
        resp = requests.post(f"{KONG_URL}/appointments", json=apt_data, headers=headers)
        if resp.status_code in [200, 201]:
            consult_id = str(uuid.uuid4())
            # Consultation with CORRECT fields
            consult_data = {
                "id": consult_id,
                "dossierId": patient['id'],
                "doctorLastName": doctor['nom'],
                "doctorFirstName": doctor['prenom'],
                "consultationDate": date.isoformat(),
                "reason": apt_data['motif'],
                "observations": random.choice(SYMPTOMES),
                "diagnosis": random.choice(DIAGNOSTICS),
                "recommendations": random.choice(RECOMMANDATIONS)
            }
            requests.post(f"{KONG_URL}/dossiers/{patient['id']}/consultations", json=consult_data, headers=headers)
            
            # Prescription
            drug = random.choice(DRUGS)
            presc_data = {
                "patientId": patient['id'],
                "doctorId": doctor['keycloakId'],
                "datePrescription": date.isoformat(),
                "medicaments": [{
                    "nom": drug['name'],
                    "dosage": drug['dosage'],
                    "duree": "1 mois",
                    "instructions": "A prendre le matin"
                }],
                "status": "ACTIVE"
            }
            requests.post(f"{KONG_URL}/prescriptions", json=presc_data, headers=headers)
        else:
            print(f"❌ Erreur RDV: {resp.status_code} - {resp.text}")

    print("✨ TERMINÉ ! Les dashboards sont maintenant remplis avec des données réelles.")

if __name__ == "__main__":
    main()
