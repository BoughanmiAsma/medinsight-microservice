import requests

def test_staff_creation():
    # 1. Get Token
    token_url = "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token"
    token_data = {
        "grant_type": "password",
        "client_id": "medinsight-client",
        "username": "admin1",
        "password": "Admin123!"
    }
    r = requests.post(token_url, data=token_data)
    token = r.json().get("access_token")
    if not token:
        print("Failed to get token:", r.text)
        return

    # 2. Create Staff
    staff_url = "http://localhost:9002/staffs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "nom": "Test",
        "prenom": "User",
        "email": f"test.user_{int(__import__('time').time())}@medinsight.local",
        "telephone": "0600000000",
        "type": "MEDECIN",
        "specialite": "GENERALISTE",
        "numeroLicence": "12345",
        "actif": True
    }
    r = requests.post(staff_url, headers=headers, json=payload)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test_staff_creation()
