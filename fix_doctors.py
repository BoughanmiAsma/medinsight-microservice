import requests
import json
import uuid

# Configuration
KEYCLOAK_URL = "http://localhost:8180"
REALM = "microservices-realm"
ADMIN_USER = "admin"
ADMIN_PASSWORD = "admin"
STAFF_SERVICE_URL = "http://localhost:9002/staffs"

def get_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {"client_id": "admin-cli", "username": ADMIN_USER, "password": ADMIN_PASSWORD, "grant_type": "password"}
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"✗ Erreur connexion Keycloak: {e}")
        return None

def get_keycloak_user_by_email(token, email):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    params = {"email": email, "exact": True}
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200 and len(response.json()) > 0:
        return response.json()[0]
    return None

def create_keycloak_user(token, staff):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Créer un username basé sur le nom
    username = f"{staff['prenom'].lower()}.{staff['nom'].lower()}".replace(" ", "")
    
    user_data = {
        "username": username,
        "email": staff['email'],
        "firstName": staff['prenom'],
        "lastName": staff['nom'],
        "enabled": True,
        "emailVerified": True,
        "credentials": [{"type": "password", "value": "password", "temporary": False}]
    }
    
    response = requests.post(url, headers=headers, json=user_data)
    if response.status_code == 201:
        # Récupérer l'ID
        user = get_keycloak_user_by_email(token, staff['email'])
        if user:
            # Assigner le rôle MEDECIN
            user_id = user['id']
            role_url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles/ROLE_MEDECIN"
            role_resp = requests.get(role_url, headers=headers)
            if role_resp.status_code == 200:
                role_data = [role_resp.json()]
                mapping_url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm"
                requests.post(mapping_url, headers=headers, json=role_data)
            return user_id
    return None

def update_staff_keycloak_id(staff, keycloak_id):
    url = f"{STAFF_SERVICE_URL}/{staff['id']}"
    
    # Préparer les données mises à jour
    updated_data = staff.copy()
    updated_data['keycloakId'] = keycloak_id
    
    # Nettoyer les champs que l'API n'aime peut-être pas recevoir en retour direct (timestamps parfois)
    # L'API Spring Boot ignore généralement les champs inconnus ou gère les timestamps s'ils sont au bon format
    # Pour être sûr, on garde l'essentiel
    
    try:
        response = requests.put(url, json=updated_data)
        if response.status_code == 200:
            # Vérification immédiate
            verify_resp = requests.get(url)
            if verify_resp.status_code == 200 and verify_resp.json().get('keycloakId') == keycloak_id:
                print(f"   ✓ Mise à jour réussie et VÉRIFIÉE via API !")
                return True
            else:
                print(f"   ⚠️ Mise à jour envoyée mais le champ keycloakId n'a pas changé. REDÉMARREZ LE BACKEND STAFF-SERVICE !")
                return False
        else:
            print(f"   ✗ Erreur API: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ✗ Exception lors de l'appel API: {e}")
        return False

def main():
    print("=== Réparation des Médecins (Lien Keycloak) ===\n")
    
    token = get_admin_token()
    if not token:
        return

    # 1. Récupérer les staffs
    try:
        response = requests.get(f"{STAFF_SERVICE_URL}/actifs")
        staffs = response.json()
    except Exception as e:
        print(f"✗ Erreur accès Staff Service: {e}")
        return

    doctors = [s for s in staffs if s.get('type') == 'MEDECIN']
    print(f"Trouvé {len(doctors)} médecins actifs.\n")

    for doc in doctors:
        print(f"Traitement Dr. {doc['prenom']} {doc['nom']} ({doc.get('email', 'Pas d\'email')})...")
        
        if doc.get('keycloakId'):
            print("   ✓ OK (Déjà lié)")
            continue

        if not doc.get('email'):
            print("   ✗ Ignoré (Pas d'email)")
            continue

        # Chercher dans Keycloak
        user = get_keycloak_user_by_email(token, doc['email'])
        
        if user:
            print(f"   ✓ Utilisateur trouvé dans Keycloak (ID: {user['id']})")
            keycloak_id = user['id']
        else:
            print("   + Création de l'utilisateur Keycloak...")
            keycloak_id = create_keycloak_user(token, doc)
            if keycloak_id:
                 print(f"   ✓ Créé avec succès (ID: {keycloak_id})")
            else:
                 print("   ✗ Échec création Keycloak")
                 continue
        
        if keycloak_id:
            update_staff_keycloak_id(doc, keycloak_id)

if __name__ == "__main__":
    main()
