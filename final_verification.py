import requests
import json

base_url = "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token"
kong_url = "http://localhost:8200"

def get_token(username, password):
    data = {
        "grant_type": "password",
        "client_id": "medinsight-client",
        "username": username,
        "password": password
    }
    r = requests.post(base_url, data=data)
    if r.status_code == 200:
        return r.json()["access_token"]
    else:
        print(f"Failed to get token for {username}: {r.status_code} - {r.text}")
        return None

def test_endpoint(name, path, token, method="GET", body=None):
    headers = {"Authorization": f"Bearer {token}"}
    if method == "GET":
        r = requests.get(f"{kong_url}{path}", headers=headers)
    else:
        r = requests.post(f"{kong_url}{path}", headers=headers, json=body)
    
    status = r.status_code
    result = "🟢 OK" if status in [200, 201] else f"🔴 FAILED ({status})"
    print(f"[{name}] {method} {path} -> {result}")
    if status not in [200, 201]:
        print(f"   Response: {r.text[:200]}")

print("--- Starting Final Verification ---")

# 1. Admin Login (Full Access)
admin_token = get_token("admin1", "Admin123!")
if admin_token:
    print("\n--- Testing with Admin Account ---")
    test_endpoint("Staff Service", "/staffs", admin_token)
    test_endpoint("Dossier Service", "/api/dossiers", admin_token)
    test_endpoint("Lab Orders", "/api/lab-orders", admin_token)
    test_endpoint("Prescriptions", "/api/prescriptions", admin_token)
    test_endpoint("Appointments (Patient)", "/api/appointments/patient/P-123", admin_token)

# 2. Technicien Login (Lab Access)
tech_token = get_token("technicien1", "Tech123!")
if tech_token:
    print("\n--- Testing with Technicien Account ---")
    test_endpoint("Lab Orders", "/api/lab-orders", tech_token)
    test_endpoint("Staff (Should fail)", "/staffs", tech_token) # Role check in code

print("\n--- Verification Finished ---")
