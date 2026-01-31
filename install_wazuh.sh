#!/bin/bash
# Script d'installation Wazuh (Version Docker Standalone)
# Cette méthode contourne les problèmes de réseau Kubernetes (Cert-Manager).

set -e

echo "=================================================="
echo "   INSTALLATION WAZUH (MODE DOCKER HYBRIDE)       "
echo "=================================================="

# 1. Installation de Docker & Docker Compose (si absents)
if ! command -v docker &> /dev/null; then
    echo "Installation de Docker..."
    curl -fsSL https://get.docker.com | sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 2. Nettoyage
echo "Préparation de l'environnement..."
rm -rf wazuh-docker-deploy
mkdir -p wazuh-docker-deploy
cd wazuh-docker-deploy

# 3. Téléchargement du Docker Compose officiel Wazuh (Single Node)
echo "Téléchargement de Wazuh..."
curl -sO https://raw.githubusercontent.com/wazuh/wazuh-docker/v4.7.2/single-node/docker-compose.yml
curl -sO https://raw.githubusercontent.com/wazuh/wazuh-docker/v4.7.2/single-node/config/wazuh_cluster/wazuh_manager.conf


# Génération de certificats simplifiée (Auto-signés via le conteneur)
echo "Lancement des conteneurs Wazuh..."
/usr/local/bin/docker-compose up -d

echo ""
echo "=================================================="
echo "   INSTALLATION TERMINÉE !"
echo "=================================================="
echo "Attendez 2-3 minutes que Wazuh démarre."
echo ""
echo "ACCÈS DASHBOARD :"
echo "   https://52.205.61.44:8443 (IP Publique)"
echo "   (Ou https://<VOTRE_IP_PRIVÉE>:443 si vous êtes en local)"
echo "" 
echo "IDENTIFIANTS PAR DÉFAUT :"
echo "   User: admin"
echo "   Pass: SecretPassword"
echo ""
echo "SI CA NE MARCHE PAS :"
echo "Assurez-vous que le port 443 est ouvert dans votre Security Group AWS ! (Inbound Rules)"
