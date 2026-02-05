import requests

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

def create_role(token, role_name, description):
    """Créer un rôle dans Keycloak"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/roles"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "name": role_name,
        "description": description
    }
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 409:
        print(f"✓ Le rôle '{role_name}' existe déjà")
        return
    
    response.raise_for_status()
    print(f"✓ Rôle '{role_name}' créé avec succès")

def main():
    try:
        print("Connexion à Keycloak...")
        token = get_admin_token()
        print("✓ Connecté en tant qu'admin")
        
        print("\nCréation du rôle ROLE_PHARMACIE...")
        create_role(token, "ROLE_PHARMACIE", "Rôle pour le personnel de pharmacie")
        
        print("\n✅ Configuration terminée!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
