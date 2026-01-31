# Guide d'Implémentation de Wazuh (SIEM/XDR) sur Kubernetes

Ce document détaille l'installation de la plateforme de sécurité Wazuh sur votre cluster Kubernetes MedInsight.

## Architecture Cible
- **Wazuh Manager/Indexer/Dashboard** : Déployés en tant que Pods dans le cluster (Namespace: `wazuh`).
- **Wazuh Agents** : Déployés sur TOUS les nœuds (Master & Worker) via un DaemonSet pour une surveillance automatique.

---

## Étape 1 : Prérequis (Sur le Master Node)

Connectez-vous à votre instance **Master** via MobaXterm.

1. **Vérifier Helm**
   Assurez-vous que Helm est installé pour gérer les paquets Kubernetes.
   ```bash
   helm version
   ```
   *Si commande non trouvée :*
   ```bash
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

2. **Ajouter le dépôt Wazuh**
   ```bash
   helm repo add wazuh https://github.com/wazuh/wazuh-kubernetes
   helm repo update
   ```

---

## Étape 2 : Déploiement du Serveur Wazuh

1. **Créer le Namespace dédié**
   ```bash
   kubectl create namespace wazuh
   ```

2. **Cloner les fichiers de configuration**
   Nous avons besoin du repo pour certaines configurations de certificats par défaut.
   ```bash
   git clone https://github.com/wazuh/wazuh-kubernetes.git
   cd wazuh-kubernetes/charts/wazuh
   ```

3. **Générer les certificats (automatique via le chart)**
   Lancez l'installation. Cela va déployer l'Indexer (Base de données), le Manager (Serveur) et le Dashboard (Interface Web).
   *Note : Cela peut prendre 3 à 5 minutes.*
   ```bash
   helm install wazuh -n wazuh .
   ```

4. **Vérifier le déploiement**
   Attendez que tous les pods soient en statut "Running". Vous devriez avoir 3 pods principaux (dashboard, indexer-0, manager-master-0).
   ```bash
   kubectl get pods -n wazuh -w
   ```
   *(Faites `Ctrl+C` une fois qu'ils sont tous Running)*

---

## Étape 3 : Déploiement des Agents (Surveillance des Nœuds)

Nous allons utiliser un **DaemonSet**. C'est un objet K8s qui assure qu'un pod "Agent" tourne sur **chaque** machine du cluster.

1. **Aller dans le dossier Agent**
   ```bash
   cd ../wazuh-agent
   ```

2. **Installer l'Agent**
   Nous devons dire à l'agent où se trouve le serveur (Service interne K8s : `wazuh-manager-master`).
   
   ```bash
   helm install wazuh-agent -n wazuh . \
     --set wazuhManager.host=wazuh-manager-master.wazuh.svc.cluster.local \
     --set wazuhManager.password=SecretPassword \
     --set wazuhManager.protocol=TCP
   ```

3. **Vérifier les Agents**
   ```bash
   kubectl get pods -n wazuh -l app.kubernetes.io/name=wazuh-agent
   ```
   Vous devriez voir **2 pods wazuh-agent** (un pour votre Master, un pour votre Worker).

---

## Étape 4 : Accéder à l'Interface (Dashboard)

Le dashboard est sécurisé dans le cluster. Pour y accéder depuis votre PC Windows :

1. **Créer un tunnel (Port-Forward)**
   Sur votre terminal MobaXterm (Master), lancez :
   ```bash
   kubectl port-forward svc/wazuh-dashboard 8443:443 -n wazuh --address 0.0.0.0
   ```
   *Laissez ce terminal ouvert, ne le fermez pas.*

2. **Connexion Web**
   Ouvrez votre navigateur Windows et allez sur :
   `https://<IP_PUBLIQUE_DE_VOTRE_MASTER>:8443`

   - Acceptez l'avertissement de sécurité (Certificat auto-signé).
   - **Login :** `admin`
   - **Password :** `SecretPassword` (C'est le défaut pour ce chart Helm).

---

## Étape 5 : Validation

Dans le Dashboard Wazuh :
1. Cliquez sur le log **Wazuh** (en haut à gauche).
2. Allez dans l'onglet **Agents**.
3. Vous devez voir 2 Agents "Active".
4. Cliquez sur un agent pour voir ses alertes de sécurité (FIM, SCA, etc.).

## Dépannage
- Si les pods restent en "Pending", vos instances EC2 manquent peut-être de RAM. Wazuh est gourmand.
  - *Solution :* Augmentez la taille des instances (t3.medium ou t3.large recommandé).
