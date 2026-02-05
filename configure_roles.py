#!/usr/bin/env python3
"""
Script pour configurer les rôles Keycloak pour MedInsight
Définit les permissions appropriées pour chaque rôle
"""

import requests
import json

KEYCLOAK_URL = "http://localhost:8180"
REALM = "microservices-realm"
ADMIN_USER = "admin"
ADMIN_PASSWORD = "admin"

def get_admin_token():
    """Obtenir le token d'administration Keycloak"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "client_id": "admin-cli",
        "username": ADMIN_USER,
        "password": ADMIN_PASSWORD,
        "grant_type": "password"
    }
    response = requests.post(url, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def create_realm_role(token, role_name, description):
    """Créer un rôle realm"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles"
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
        print(f"✓ Rôle {role_name} existe déjà")
    elif response.status_code == 201:
        print(f"✓ Rôle {role_name} créé")
    else:
        print(f"✗ Erreur création {role_name}: {response.status_code}")

def main():
    print("=== Configuration des rôles Keycloak pour MedInsight ===\n")
    
    try:
        token = get_admin_token()
        print("✓ Token admin obtenu\n")
        
        # Définition des rôles avec leurs descriptions
        roles = [
            # Rôles principaux
            ("ROLE_PATIENT", "Patient - Peut créer et gérer ses propres rendez-vous"),
            ("ROLE_MEDECIN", "Médecin - Peut consulter, accepter et gérer les rendez-vous"),
            ("ROLE_SECRETAIRE", "Secrétaire - Peut gérer tous les rendez-vous et dossiers"),
            ("ROLE_INFIRMIER", "Infirmier - Peut consulter les dossiers patients"),
            ("ROLE_TECHNICIEN", "Technicien - Accès aux équipements médicaux"),
            ("ROLE_AIDE_SOIGNANT", "Aide-soignant - Assistance aux soins"),
            ("ROLE_LABORATOIRE", "Laboratoire - Gestion des analyses"),
            ("ROLE_PHARMACIEN", "Pharmacien - Gestion des ordonnances"),
            
            # Permissions granulaires
            ("appointment:create", "Permission de créer des rendez-vous (PATIENT, SECRETAIRE)"),
            ("appointment:read", "Permission de lire les rendez-vous"),
            ("appointment:update", "Permission de modifier les rendez-vous (MEDECIN, SECRETAIRE)"),
            ("appointment:delete", "Permission d'annuler les rendez-vous"),
            
            ("dossier:read", "Permission de lire les dossiers patients"),
            ("dossier:write", "Permission de modifier les dossiers patients"),
            
            ("staff:read", "Permission de lire les informations du personnel"),
            ("staff:write", "Permission de créer/modifier le personnel"),
            ("staff:delete", "Permission de supprimer le personnel"),
            
            ("lab:read", "Permission de lire les résultats de laboratoire"),
            ("lab:write", "Permission de créer/modifier les analyses"),
            
            ("prescription:read", "Permission de lire les ordonnances"),
            ("prescription:write", "Permission de créer des ordonnances"),
        ]
        
        print("Création des rôles...")
        for role_name, description in roles:
            create_realm_role(token, role_name, description)
        
        print("\n=== Configuration terminée ===")
        print("\nRésumé des permissions par rôle:")
        print("\n📋 PATIENT:")
        print("  - Créer ses rendez-vous (appointment:create)")
        print("  - Voir ses rendez-vous (appointment:read)")
        print("  - Annuler ses rendez-vous (appointment:delete)")
        print("  - Voir son dossier (dossier:read)")
        
        print("\n👨‍⚕️ MEDECIN:")
        print("  - Voir ses rendez-vous (appointment:read)")
        print("  - Accepter/Refuser/Replanifier rendez-vous (appointment:update)")
        print("  - Lire les dossiers patients (dossier:read)")
        print("  - Modifier les dossiers (dossier:write)")
        print("  - Créer des ordonnances (prescription:write)")
        
        print("\n👩‍💼 SECRETAIRE:")
        print("  - Gérer tous les rendez-vous (appointment:*)")
        print("  - Gérer tous les dossiers (dossier:*)")
        print("  - Gérer le personnel (staff:*)")
        
        print("\n🔬 LABORATOIRE:")
        print("  - Gérer les analyses (lab:*)")
        print("  - Lire les dossiers (dossier:read)")
        
    except Exception as e:
        print(f"\n✗ Erreur: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
