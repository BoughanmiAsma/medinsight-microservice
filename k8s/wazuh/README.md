# Wazuh Security Monitoring pour MedInsight

Ce dossier contient les manifests Kubernetes et configurations pour déployer Wazuh agents dans le cluster MedInsight.

## 📁 Fichiers

- **wazuh-agent-configmap.yml** : Configuration des agents (IP Manager, ports, config OSSEC)
- **wazuh-agent-daemonset.yml** : DaemonSet pour déployer un agent sur chaque node K8s
- **custom-rules.xml** : Règles de sécurité personnalisées pour MedInsight (HIPAA, GDPR)
- **deploy-wazuh-agents.sh** : Script de déploiement automatisé

## 🚀 Déploiement Rapide

### Prérequis
- Wazuh Manager installé sur le master node (✅ Fait)
- Cluster Kubernetes avec namespace `medinsight`
- kubectl configuré

### Déployer les agents

**Option 1 : Script automatisé (Recommandé)**
```bash
cd k8s/wazuh
chmod +x deploy-wazuh-agents.sh
./deploy-wazuh-agents.sh
```

**Option 2 : Manuel**
```bash
kubectl apply -f wazuh-agent-configmap.yml -n medinsight
kubectl apply -f wazuh-agent-daemonset.yml -n medinsight
```

### Vérifier le déploiement
```bash
# Voir les pods agents
kubectl get pods -n medinsight -l app=wazuh-agent

# Voir les logs
kubectl logs -n medinsight -l app=wazuh-agent --tail=50

# Vérifier la connexion au Manager
docker exec single-node-wazuh.manager-1 /var/ossec/bin/agent_control -l
```

## 🛡️ Règles de Sécurité Personnalisées

### Appliquer les règles
```bash
# Copier les règles dans le Manager
docker cp custom-rules.xml single-node-wazuh.manager-1:/var/ossec/etc/rules/local_rules.xml

# Redémarrer pour charger les règles
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-control restart
```

### Règles disponibles

| ID | Description | Niveau | Compliance |
|----|-------------|--------|------------|
| 100100 | Auth Keycloak réussie | Info | HIPAA, GDPR |
| 100101 | Auth échouée | Moyen | PCI DSS, HIPAA |
| 100102 | Brute force détecté | Élevé | PCI DSS 11.4 |
| 100103 | Accès non autorisé dossier patient | **Critique** | HIPAA 164.308, GDPR |
| 100104 | Modification prescription | Élevé | HIPAA 164.312 |
| 100105 | Accès résultats labo | Moyen | HIPAA, GDPR |
| 100107 | Escalade privilèges staff | **Critique** | PCI DSS, HIPAA |
| 100109 | Injection SQL | **Critique** | PCI DSS 6.5.1 |
| 100113 | Exposition données sensibles | **Critique** | PCI DSS 3.4, GDPR |

## 📊 Dashboard Wazuh

**Accès** : https://52.205.61.44  
**Credentials** : admin / SecretPassword

### Navigation
- **Agents** : Management → Agents
- **Security Events** : Threat Hunting → Security events
- **Compliance** : Regulatory compliance → HIPAA/GDPR/PCI DSS
- **Vulnerabilities** : Threat detection and response → Vulnerabilities

## 🔧 Configuration

### Modifier l'IP du Wazuh Manager
```bash
kubectl edit configmap wazuh-agent-config -n medinsight
# Modifier WAZUH_MANAGER
kubectl rollout restart daemonset/wazuh-agent -n medinsight
```

### Ajuster les ressources des agents
```bash
kubectl edit daemonset wazuh-agent -n medinsight
# Modifier requests/limits CPU/Memory
```

## 📖 Documentation Complète

Voir [`docs/WAZUH_DEPLOYMENT_GUIDE.md`](../../docs/WAZUH_DEPLOYMENT_GUIDE.md) pour :
- Architecture détaillée
- Tests de validation
- Troubleshooting
- Intégration CI/CD

## ⚠️ Important

- **Port 1514** doit être ouvert dans le Security Group AWS pour la communication agents → manager
- Les agents utilisent `hostNetwork: true` pour surveiller le node complet
- Les règles personnalisées doivent respecter la syntaxe XML de Wazuh
