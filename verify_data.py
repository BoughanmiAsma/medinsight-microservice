import requests

KEYCLOAK_URL = "http://localhost:8180"
KEYCLOAK_REALM = "microservices-realm"
ADMIN_USERNAME = "admin1"
ADMIN_PASSWORD = "Admin123!"
KONG_URL = "http://localhost:8200"

def get_token():
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        'client_id': 'medinsight-client',
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD,
        'grant_type': 'password'
    }
    return requests.post(url, data=data).json()['access_token']

token = get_token()
headers = {'Authorization': f'Bearer {token}'}

print("--- VERIFICATION DES DONNÉES ---")

# Patients
patients = requests.get(f"{KONG_URL}/dossiers", headers=headers).json()
print(f"Total Patients: {len(patients)}")

# Doctors
doctors = requests.get(f"{KONG_URL}/staffs/actifs", headers=headers).json()
doctors_with_id = [d for d in doctors if d.get('keycloakId')]
print(f"Total Medecins Actifs: {len(doctors_with_id)}")

# Appointments per doctor
total_apt = 0
for doctor in doctors_with_id:
    doc_id = doctor['keycloakId']
    resp = requests.get(f"{KONG_URL}/appointments/doctor/{doc_id}", headers=headers)
    if resp.status_code == 200:
        apts = resp.json()
        print(f"Medecin {doctor.get('nom')} ({doc_id}): {len(apts)} RDV")
        total_apt += len(apts)
    else:
        print(f"Erreur pour Medecin {doctor.get('nom')}: {resp.status_code}")

print(f"\nTotal Rendez-vous trouvés: {total_apt}")
