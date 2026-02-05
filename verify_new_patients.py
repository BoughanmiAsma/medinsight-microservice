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

# Sort by createdAt to find the 50 new ones
patients.sort(key=lambda x: x.get('createdAt') or '1970-01-01T00:00:00', reverse=True)

print(f"--- VERIFICATION DES 50 DERNIERS PATIENTS ---")
for p in patients[:50]:
    p_id = p['id']
    name = f"{p.get('prenom')} {p.get('nom')}"
    consults = requests.get(f"{KONG_URL}/dossiers/{p_id}/consultations", headers=headers).json()
    print(f"Patient: {name} - Consults: {len(consults)}")
    if consults:
        c = consults[0]
        print(f"  Diagnosis: {c.get('diagnosis')}")
        print(f"  Reason: {c.get('reason')}")
