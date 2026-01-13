import requests
import json

base_url = "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token"
kong_url = "http://localhost:8200"

users = [
    {"name": "Admin", "user": "admin1", "pw": "Admin123!"},
    {"name": "Médecin", "user": "medecin1", "pw": "Medecin123!"},
    {"name": "Secrétaire", "user": "secretaire1", "pw": "Secret123!"},
    {"name": "Technicien", "user": "technicien1", "pw": "Tech123!"}
]

endpoints = [
    {"service": "Staff", "path": "/staffs"},
    {"service": "Dossier", "path": "/api/dossiers"},
    {"service": "Lab", "path": "/api/lab-orders"},
    {"service": "Ordonnance", "path": "/api/prescriptions"},
    {"service": "Appt", "path": "/api/appointments/patient/P-123"}
]

def get_token(username, password):
    data = {
        "grant_type": "password",
        "client_id": "medinsight-client",
        "username": username,
        "password": password
    }
    try:
        r = requests.post(base_url, data=data, timeout=5)
        if r.status_code == 200:
            return r.json()["access_token"]
    except:
        pass
    return None

print(f"{'Role':<12} | {'Staff':<10} | {'Dossier':<10} | {'Lab':<10} | {'Ordonnance':<12} | {'Appt':<10}")
print("-" * 80)

for u_info in users:
    token = get_token(u_info["user"], u_info["pw"])
    if not token:
        print(f"{u_info['name']:<12} | CRITICAL: LOGIN FAILED")
        continue
    
    results = []
    for ep in endpoints:
        headers = {"Authorization": f"Bearer {token}"}
        try:
            r = requests.get(f"{kong_url}{ep['path']}", headers=headers, timeout=5)
            if r.status_code == 200:
                results.append("✅ 200")
            elif r.status_code == 403:
                results.append("🚫 403")
            elif r.status_code == 401:
                results.append("🔒 401")
            else:
                results.append(f"❌ {r.status_code}")
        except:
            results.append("💥 ERR")
    
    print(f"{u_info['name']:<12} | {results[0]:<10} | {results[1]:<10} | {results[2]:<10} | {results[3]:<12} | {results[4]:<10}")

print("-" * 80)
print("Légende : ✅ Succès | 🚫 Refusé (Pas le rôle) | 🔒 Non authentifié | ❌ Erreur")
