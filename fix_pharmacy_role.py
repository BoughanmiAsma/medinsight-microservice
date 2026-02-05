import requests
import json

# Configuration Keycloak
KEYCLOAK_URL = "http://localhost:8180"
ADMIN_USER = "admin"
ADMIN_PASSWORD = "admin"
REALM_NAME = "microservices-realm"

def get_admin_token():
    """Obtenir le token admin"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id": "admin-cli",
        "username": ADMIN_USER,
        "password": ADMIN_PASSWORD
    }
    response = requests.post(url, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def get_user_by_username(token, username):
    """Rechercher un utilisateur par nom d'utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"username": username, "exact": "true"}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    users = response.json()
    return users[0] if users else None

def get_role(token, role_name):
    """Obtenir les détails d'un rôle"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def get_user_roles(token, user_id):
    """Obtenir les rôles d'un utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users/{user_id}/role-mappings/realm"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def remove_role_from_user(token, user_id, role):
    """Retirer un rôle d'un utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users/{user_id}/role-mappings/realm"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.delete(url, headers=headers, json=[role])
    response.raise_for_status()

def assign_role_to_user(token, user_id, role):
    """Assigner un rôle à un utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users/{user_id}/role-mappings/realm"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers, json=[role])
    response.raise_for_status()

def fix_pharmacist_role(username):
    """Corriger le rôle pharmacien pour un utilisateur"""
    try:
        # Obtenir le token admin
        print(f"Connexion à Keycloak...")
        token = get_admin_token()
        
        # Trouver l'utilisateur
        print(f"Recherche de l'utilisateur '{username}'...")
        user = get_user_by_username(token, username)
        if not user:
            print(f"❌ Utilisateur '{username}' non trouvé")
            return
        
        user_id = user["id"]
        print(f"✓ Utilisateur trouvé: {user['firstName']} {user['lastName']} (ID: {user_id})")
        
        # Obtenir les rôles actuels
        print(f"Vérification des rôles actuels...")
        current_roles = get_user_roles(token, user_id)
        print(f"Rôles actuels: {[r['name'] for r in current_roles]}")
        
        # Retirer ROLE_PHARMACIEN s'il existe
        pharmacien_role = None
        for role in current_roles:
            if role['name'] == 'ROLE_PHARMACIEN':
                pharmacien_role = role
                break
        
        if pharmacien_role:
            print(f"Suppression du rôle ROLE_PHARMACIEN...")
            remove_role_from_user(token, user_id, pharmacien_role)
            print(f"✓ ROLE_PHARMACIEN supprimé")
        
        # Vérifier si ROLE_PHARMACIE existe
        print(f"Vérification du rôle ROLE_PHARMACIE...")
        try:
            pharmacie_role = get_role(token, "ROLE_PHARMACIE")
            print(f"✓ Rôle ROLE_PHARMACIE trouvé")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"❌ Le rôle ROLE_PHARMACIE n'existe pas dans Keycloak!")
                print(f"Veuillez créer ce rôle dans Keycloak d'abord.")
                return
            raise
        
        # Assigner ROLE_PHARMACIE
        print(f"Attribution du rôle ROLE_PHARMACIE...")
        assign_role_to_user(token, user_id, pharmacie_role)
        print(f"✓ ROLE_PHARMACIE assigné")
        
        # Vérifier les nouveaux rôles
        print(f"Vérification finale...")
        new_roles = get_user_roles(token, user_id)
        print(f"✅ Rôles finaux: {[r['name'] for r in new_roles]}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Corriger le rôle pour l'utilisateur arbihakim@gmail.com
    fix_pharmacist_role("arbihakim@gmail.com")
