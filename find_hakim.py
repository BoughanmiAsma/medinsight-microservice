import requests

KEYCLOAK_URL = "http://localhost:8180"
REALM_NAME = "microservices-realm"

# Obtenir le token admin
response = requests.post(
    f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token",
    data={
        "grant_type": "password",
        "client_id": "admin-cli",
        "username": "admin",
        "password": "admin"
    }
)
token = response.json()["access_token"]

# Rechercher tous les utilisateurs contenant "hakim" ou "arbi"
for search_term in ["hakim", "arbi"]:
    print(f"\nRecherche de '{search_term}'...")
    response = requests.get(
        f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users",
        headers={"Authorization": f"Bearer {token}"},
        params={"search": search_term}
    )
    users = response.json()
    
    if users:
        for user in users:
            print(f"  - Username: {user.get('username')}")
            print(f"    Nom: {user.get('firstName')} {user.get('lastName')}")
            print(f"    Email: {user.get('email')}")
            print(f"    ID: {user.get('id')}")
            print()
    else:
        print(f"  Aucun utilisateur trouvé")
