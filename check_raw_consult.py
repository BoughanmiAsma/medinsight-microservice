import requests
import json

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

patients = requests.get(f"{KONG_URL}/dossiers", headers=headers).json()
# Find a patient with a name from the recent ones
recent_patients = [p for p in patients if p.get('nom') and p.get('nom') != "None"]
recent_patients.sort(key=lambda x: x.get('createdAt') or '', reverse=True)

if recent_patients:
    p = recent_patients[0]
    print(f"Patient: {p['prenom']} {p['nom']} ({p['id']})")
    consults = requests.get(f"{KONG_URL}/dossiers/{p['id']}/consultations", headers=headers).json()
    if consults:
        print(json.dumps(consults[0], indent=2))
