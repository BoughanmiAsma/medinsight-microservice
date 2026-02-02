import requests
import json

KONG_ADMIN = "http://localhost:8201"
KEYCLOAK_URL = "http://host.docker.internal:8180/realms/microservices-realm"

services = [
    {"name": "staff-service", "url": "http://staff-service:9002", "routes": [{"paths": ["/staffs"], "strip_path": False}]},
    {"name": "dossier-service", "url": "http://dossier-service:8080", "routes": [{"paths": ["/api/dossiers"], "strip_path": False}]},
    {"name": "lab-service", "url": "http://lab-service:8081", "routes": [
        {"paths": ["/api/lab-orders"], "strip_path": False},
        {"paths": ["/api/lab/upload"], "strip_path": False},
        {"paths": ["/api/lab/files"], "strip_path": False, "public": True}
    ]},
    {"name": "ordonnance-service", "url": "http://ordonnance-service:8082", "routes": [{"paths": ["/api/prescriptions"], "strip_path": False}]},
    {"name": "appointment-service", "url": "http://appointment-service:8083", "routes": [{"paths": ["/api/appointments"], "strip_path": False}]},
]

def setup():
    for s_info in services:
        # Create Service
        s_resp = requests.post(f"{KONG_ADMIN}/services", json={
            "name": s_info["name"],
            "url": s_info["url"]
        })
        s_data = s_resp.json()
        if "id" not in s_data:
            print(f"Error creating service {s_info['name']}: {s_data}")
            continue
        s_id = s_data["id"]
        print(f"Created service: {s_info['name']}")

        # Create Routes
        for r_info in s_info["routes"]:
            is_public = r_info.pop("public", False)
            r_resp = requests.post(f"{KONG_ADMIN}/services/{s_id}/routes", json=r_info)
            r_data = r_resp.json()
            if "id" not in r_data:
                print(f"Error creating route {r_info['paths']}: {r_data}")
                continue
            r_id = r_data["id"]
            print(f"  Created route: {r_info['paths']} (Public: {is_public})")

            if is_public:
                continue

            # Add OIDC Plugin to each non-public route
            oidc_config = {
                "name": "oidc",
                "route": {"id": r_id},
                "config": {
                    "discovery": f"{KEYCLOAK_URL}/.well-known/openid-configuration",
                    "client_id": "staff-service",
                    "client_secret": "staff-service-secret-2024",
                    "bearer_only": "yes",
                    "introspection_endpoint": f"{KEYCLOAK_URL}/protocol/openid-connect/token/introspect",
                    "token_endpoint_auth_method": "client_secret_post",
                    "ssl_verify": "no",
                    "response_type": "code"
                }
            }
            p_resp = requests.post(f"{KONG_ADMIN}/plugins", json=oidc_config)
            print(f"    Added OIDC plugin: {p_resp.status_code}")
            if p_resp.status_code != 201:
                print(p_resp.text)

if __name__ == "__main__":
    setup()
