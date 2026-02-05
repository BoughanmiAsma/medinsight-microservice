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

def get_user_id(token, username):
    url = f"{KC_URL}/admin/realms/{REALM}/users?username={username}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    users = resp.json()
    for u in users:
        if u["username"] == username:
            return u["id"]
    return None

def get_role_repr(token, role_name):
    url = f"{KC_URL}/admin/realms/{REALM}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json()
    return None

def assign_role(token, user_id, role_repr):
    url = f"{KC_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, headers=headers, json=[role_repr])
    if resp.status_code in [200, 201, 204]:
        print(f"Assigned role {role_repr['name']} to user {user_id}")
    else:
        print(f"Error assigning role: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    token = get_token()
    if token:
        # Assign ROLE_LABORATOIRE to technicien1
        uid = get_user_id(token, "technicien1")
        if uid:
            r_repr = get_role_repr(token, "ROLE_LABORATOIRE")
            if r_repr:
                assign_role(token, uid, r_repr)
        
        # Create a pharmacien user
        # (Omitted for now, I'll use medecin1 or admin for pharma tests if needed, 
        # but let's just make medecin1 more powerful for tests)
        uid_med = get_user_id(token, "medecin1")
        if uid_med:
            r_pharma = get_role_repr(token, "ROLE_PHARMACIEN")
            if r_pharma:
                assign_role(token, uid_med, r_pharma)
