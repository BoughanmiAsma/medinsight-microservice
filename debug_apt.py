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
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Get a doctor and a patient
doctors = requests.get(f"{KONG_URL}/staffs/actifs", headers=headers).json()
patients = requests.get(f"{KONG_URL}/dossiers", headers=headers).json()

doctor = next(d for d in doctors if d.get('type') == 'MEDECIN')
print(f"DEBUG: Selected Doctor: {json.dumps(doctor, indent=2)}")
patient = patients[-1] # The latest one

apt_data = {
    "patientId": patient['id'],
    "doctorId": doctor['keycloakId'],
    "appointmentDate": "2026-02-05T10:00:00",
    "status": "PENDING",
    "motif": "Debug TEST"
}

resp = requests.post(f"{KONG_URL}/appointments", json=apt_data, headers=headers)
print(f"Status: {resp.status_code}")
print(f"Body: {resp.text}")
