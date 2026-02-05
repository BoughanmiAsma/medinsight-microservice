import requests
import json
import sys

KEYCLOAK_URL = "http://localhost:8180"
REALM = "microservices-realm"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"

def get_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    payload = {
        "client_id": "admin-cli",
        "username": ADMIN_USER,
        "password": ADMIN_PASS,
        "grant_type": "password"
    }
    response = requests.post(url, data=payload)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to get admin token: {response.status_code} - {response.text}")
        sys.exit(1)

def reset_password(username, new_password):
    token = get_admin_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. Find User ID
    search_url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users?username={username}"
    resp = requests.get(search_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"Error searching user: {resp.text}")
        return

    users = resp.json()
    if not users:
        print(f"User '{username}' not found.")
        return

    user_id = users[0]['id']
    print(f"Found user {username} with ID {user_id}")

    # 2. Reset Password
    reset_url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/reset-password"
    payload = {
        "type": "password",
        "value": new_password,
        "temporary": False
    }

    resp = requests.put(reset_url, headers=headers, json=payload)
    if resp.status_code == 204:
        print(f"✅ Success! Password for '{username}' changed to: {new_password}")
    else:
        print(f"❌ Failed to reset password: {resp.text}")

if __name__ == "__main__":
    reset_password("amal@gmail.com", "Amal123!")
