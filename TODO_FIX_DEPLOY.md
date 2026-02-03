# ✅ Checklist de Correction du Déploiement K8s (AWS EC2)

## 🚨 Problème Actuel
Le pipeline GitHub Actions ne peut pas se connecter à l'API Kubernetes sur le Master Node (`52.205.61.44:6443`), causant une erreur `i/o timeout`.

---

## 🛠️ Solution 1 : Autoriser GitHub Actions (Rapide)
**Recommandé pour un test rapide.**

1.  Se connecter à la **Console AWS**.
2.  Aller dans **EC2 > Security Groups**.
3.  Trouver le Security Group attaché à l'instance **Master Node**.
4.  Modifier les **Inbound Rules** (Règles d'entrée).
5.  Ajouter une règle :
    *   **Type :** Custom TCP
    *   **Port Range :** `6443`
    *   **Source :** `0.0.0.0/0` (⚠️ Autorise tout internet, temporaire !)
6.  Sauvegarder.
7.  Relancer le pipeline GitHub Actions.

---

## 🛡️ Solution 2 : Self-Hosted Runner (Sécurisé)
**Recommandé pour la production.**

1.  Aller sur le repo GitHub : **Settings > Actions > Runners**.
2.  Cliquer sur **New self-hosted runner**.
3.  Sélectionner **Linux**.
4.  Copier les commandes affichées.
5.  Se connecter en **SSH** sur l'instance **Master Node** (ou Worker).
6.  Coller et exécuter les commandes pour installer le runner.
7.  Lancer le runner : `./run.sh`
8.  Modifier le fichier `.github/workflows/devsecops-pipeline.yml` :
    ```yaml
    runs-on: self-hosted  # Au lieu de 'ubuntu-latest'
    ```
9.  Pousser les changements. Le pipeline s'exécutera *DANS* votre cluster AWS.

---

## 📝 Une fois la connexion réparée...
N'oubliez pas de **décommenter** les étapes de déploiement dans le pipeline :

```yaml
# Decommenter dans devsecops-pipeline.yml :
- name: Configure Kubectl
  uses: azure/k8s-set-context@v4
  ...
- name: Deploy to Kubernetes
  run: |
  ...
```

---

## 🛡️ Configuration Wazuh (Monitoring de Sécurité)

Pour que les agents Wazuh dans Kubernetes puissent communiquer avec le Wazuh Manager :

1. Aller dans **EC2 > Security Groups**
2. Modifier le Security Group du **Master Node**
3. Ajouter une règle **Inbound** :
   - **Type** : Custom TCP
   - **Port** : `1514`
   - **Source** : Security Group des Worker Nodes (ou CIDR du VPC interne)
   - **Description** : Wazuh Agent Communication

> **Note** : Le port 1514 permet aux agents Kubernetes de se connecter au Wazuh Manager pour la surveillance de sécurité.

