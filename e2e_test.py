import requests
import time
import json

BASE_URL = "http://localhost:8200"
KC_TOKEN_URL = "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token"

def get_token(username, password):
    resp = requests.post(KC_TOKEN_URL, data={
        "grant_type": "password",
        "client_id": "medinsight-client",
        "username": username,
        "password": password
    })
    return resp.json().get("access_token")

def test_staff_crud(token):
    print("\n--- Testing Staff CRUD (ADMIN) ---")
    # Create
    email = f"staff_{int(time.time())}@test.com"
    payload = {
        "nom": "Doe", "prenom": "John", "email": email,
        "telephone": "12345", "type": "MEDECIN", "specialite": "CARDIOLOGY",
        "numeroLicence": "LC123", "actif": True
    }
    resp = requests.post(f"{BASE_URL}/staffs", json=payload, headers={"Authorization": f"Bearer {token}"})
    print(f"Create Staff: {resp.status_code}")
    if resp.status_code != 201: return None
    staff_id = resp.json()["id"]

    # Read
    resp = requests.get(f"{BASE_URL}/staffs", headers={"Authorization": f"Bearer {token}"})
    print(f"List Staff: {resp.status_code}")

    # Update
    payload["nom"] = "Updated"
    resp = requests.put(f"{BASE_URL}/staffs/{staff_id}", json=payload, headers={"Authorization": f"Bearer {token}"})
    print(f"Update Staff: {resp.status_code}")

    # Delete
    resp = requests.delete(f"{BASE_URL}/staffs/{staff_id}", headers={"Authorization": f"Bearer {token}"})
    print(f"Delete Staff: {resp.status_code}")
    return staff_id

def test_dossier_flow(admin_token, medecin_token):
    print("\n--- Testing Dossier & Consultation Flow ---")
    # 1. Create Dossier (Admin or Secretaire)
    dossier_id = f"DOS-{int(time.time())}"
    payload = {
        "id": dossier_id, "nom": "Patient", "prenom": "Test",
        "dateNaissance": "1990-01-01", "sexe": "M", "email": "patient@test.com"
    }
    resp = requests.post(f"{BASE_URL}/dossiers", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Create Dossier: {resp.status_code}")
    if resp.status_code != 201: return

    # 2. Create Consultation (Medecin)
    consult_payload = {
        "reason": "Test Consult", "diagnosis": "Healthy", "observations": "All Good"
    }
    resp = requests.post(f"{BASE_URL}/dossiers/{dossier_id}/consultations", json=consult_payload, headers={"Authorization": f"Bearer {medecin_token}"})
    print(f"Create Consultation: {resp.status_code}")
    consult_id = resp.json()["id"]

    # 3. Request Prescription (Medecin)
    presc_payload = {"medicationDetails": "Vitamin C 500mg"}
    resp = requests.post(f"{BASE_URL}/dossiers/{dossier_id}/consultations/{consult_id}/prescriptions", json=presc_payload, headers={"Authorization": f"Bearer {medecin_token}"})
    print(f"Request Prescription: {resp.status_code}")

    # 4. Request Lab Order (Medecin)
    lab_payload = {"testCode": "BLOOD_TEST"}
    resp = requests.post(f"{BASE_URL}/dossiers/{dossier_id}/consultations/{consult_id}/lab-orders", json=lab_payload, headers={"Authorization": f"Bearer {medecin_token}"})
    print(f"Request Lab Order: {resp.status_code}")

    # Wait for Kafka
    time.sleep(2)

    # 5. Verify Prescription Service (Medecin or Pharma)
    resp = requests.get(f"{BASE_URL}/prescriptions/dossier/{dossier_id}", headers={"Authorization": f"Bearer {medecin_token}"})
    print(f"Verify Prescription: {resp.status_code} - Found: {len(resp.json())}")

def test_lab_upload(medecin_token, technicien_token):
    print("\n--- Testing Lab Upload Flow ---")
    # Need a dossier
    d_id = f"DOS-LAB-{int(time.time())}"
    requests.post(f"{BASE_URL}/dossiers", json={"id": d_id, "nom": "Lab", "prenom": "User"}, headers={"Authorization": f"Bearer {medecin_token}"})
    
    # Upload file
    files = {'file': ('test.txt', 'Lab Result Content')}
    data = {'dossierId': d_id}
    resp = requests.post(f"{BASE_URL}/lab/upload", files=files, data=data, headers={"Authorization": f"Bearer {technicien_token}"})
    print(f"Upload Lab Result: {resp.status_code}")

    # Wait for Kafka
    time.sleep(2)

    # Verify in Dossier Service
    resp = requests.get(f"{BASE_URL}/dossiers/{d_id}/analyses", headers={"Authorization": f"Bearer {medecin_token}"})
    print(f"Verify Analysis in Dossier: {resp.status_code} - Found: {len(resp.json())}")

if __name__ == "__main__":
    admin_token = get_token("admin1", "Admin123!")
    medecin_token = get_token("medecin1", "Medecin123!")
    secretaire_token = get_token("secretaire1", "Secret123!")
    technicien_token = get_token("technicien1", "Tech123!")

    if not all([admin_token, medecin_token, secretaire_token, technicien_token]):
        print("Error obtaining tokens. Check Keycloak.")
    else:
        test_staff_crud(admin_token)
        test_dossier_flow(admin_token, medecin_token)
        test_lab_upload(medecin_token, technicien_token)
