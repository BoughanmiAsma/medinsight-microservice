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

# Get patients
patients = requests.get(f"{KONG_URL}/dossiers", headers=headers).json()

print(f"Total Patients: {len(patients)}")

patients.sort(key=lambda x: x.get('createdAt') or '', reverse=True)
for p in patients[:10]:
    if not p.get('nom'): continue
    p_id = p['id']
    consults = requests.get(f"{KONG_URL}/dossiers/{p_id}/consultations", headers=headers).json()
    if len(consults) > 0:
        print(f"Patient: {p['prenom']} {p['nom']} - Consultations: {len(consults)}")
        print(f"  Dernière consult (Diagnosis): {consults[0].get('diagnosis')}")
        print(f"  Dernière consult (Reason): {consults[0].get('reason')}")
