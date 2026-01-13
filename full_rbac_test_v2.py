import requests
import json

base_url = "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token"
kong_url = "http://localhost:8200"

users = [
    {"name": "Admin", "user": "admin1", "pw": "Admin123!"},
    {"name": "Medecin", "user": "medecin1", "pw": "Medecin123!"},
    {"name": "Secretaire", "user": "secretaire1", "pw": "Secret123!"},
    {"name": "Technicien", "user": "technicien1", "pw": "Tech123!"}
]

endpoints = [
    {"name": "Staff", "path": "/staffs"},
    {"name": "Dossier", "path": "/api/dossiers"},
    {"name": "Lab", "path": "/api/lab-orders"},
    {"name": "Ordonnance", "path": "/api/prescriptions"},
    {"name": "Appoint", "path": "/api/appointments/patient/P-123"}
]

def get_token(username, password):
    data = {"grant_type": "password", "client_id": "medinsight-client", "username": username, "password": password}
    r = requests.post(base_url, data=data)
    return r.json().get("access_token")

for u in users:
    print(f"Testing for ROLE: {u['name']}")
    token = get_token(u["user"], u["pw"])
    for ep in endpoints:
        r = requests.get(f"{kong_url}{ep['path']}", headers={"Authorization": f"Bearer {token}"})
        status = "OK (200)" if r.status_code == 200 else f"DENIED ({r.status_code})"
        print(f"  - {ep['name']}: {status}")
    print("-" * 30)
