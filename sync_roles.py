import requests
import json

KC_URL = "http://localhost:8180"
REALM = "microservices-realm"

def get_token():
    try:
        resp = requests.post(f"{KC_URL}/realms/master/protocol/openid-connect/token", data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": "admin",
            "password": "admin"
        })
        resp.raise_for_status()
        return resp.json()["access_token"]
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

def add_role(token, role_name):
    url = f"{KC_URL}/admin/realms/{REALM}/roles"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, headers=headers, json={"name": role_name})
    if resp.status_code == 201:
        print(f"Role {role_name} added successfully.")
    elif resp.status_code == 409:
        print(f"Role {role_name} already exists.")
    else:
        print(f"Error adding role {role_name}: {resp.status_code} - {resp.text}")

def check_roles(token):
    url = f"{KC_URL}/admin/realms/{REALM}/roles"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        roles = [r["name"] for r in resp.json()]
        print(f"Current roles in {REALM}: {roles}")
    else:
        print(f"Error fetching roles: {resp.status_code}")

if __name__ == "__main__":
    token = get_token()
    if token:
        print("Successfully obtained admin token.")
        check_roles(token)
        add_role(token, "ROLE_LABORATOIRE")
        add_role(token, "ROLE_PHARMACIEN")
    else:
        print("Failed to start role sync.")
