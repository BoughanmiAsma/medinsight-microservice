# 🛡️ Wazuh Security Monitoring - Guide de Déploiement MedInsight

## Vue d'ensemble

Wazuh est déployé en mode **hybride** pour MedInsight :
- **Wazuh Manager + Dashboard** : Sur le master node via Docker (✅ Déjà installé)
- **Wazuh Agents** : Dans le cluster Kubernetes pour surveiller les microservices

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Master Node (52.205.61.44)            │
│  ┌───────────────────────────────────────────┐  │
│  │  Wazuh Manager (Docker)                   │  │
│  │  - Port 1514/1515: Agent communication    │  │
│  │  - Port 55000: REST API                   │  │
│  │  - OpenSearch Indexer                     │  │
│  │  - Dashboard (Port 443)                   │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▲
                      │ TCP/1514
                      │
┌─────────────────────────────────────────────────┐
│         Kubernetes Cluster (medinsight NS)      │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Node 1      │  │ Node 2      │              │
│  │ Wazuh Agent │  │ Wazuh Agent │  ...         │
│  └─────────────┘  └─────────────┘              │
│                                                 │
│  Microservices monitored:                      │
│  - appointment-service                         │
│  - dossier-service                             │
│  - laboratoire-service                         │
│  - ordonnance-service                          │
│  - staff-service                               │
└─────────────────────────────────────────────────┘
```

---

## Déploiement

### Prérequis

- ✅ Wazuh Manager déjà installé (via `install_wazuh.sh`)
- ✅ Cluster Kubernetes opérationnel
- ✅ Namespace `medinsight` créé
- ✅ `kubectl` configuré

### Étape 1 : Déployer les agents Wazuh

**Via le script automatisé** :
```bash
cd /path/to/MedInsight/k8s/wazuh
chmod +x deploy-wazuh-agents.sh
./deploy-wazuh-agents.sh
```

**Ou manuellement** :
```bash
kubectl apply -f k8s/wazuh/wazuh-agent-configmap.yml -n medinsight
kubectl apply -f k8s/wazuh/wazuh-agent-daemonset.yml -n medinsight
```

### Étape 2 : Vérifier le déploiement

```bash
# Vérifier que les pods agents sont en cours d'exécution
kubectl get pods -n medinsight -l app=wazuh-agent

# Vérifier les logs des agents
kubectl logs -n medinsight -l app=wazuh-agent --tail=50

# Vérifier la connexion au Manager
docker exec single-node-wazuh.manager-1 /var/ossec/bin/agent_control -l
```

**Résultat attendu** : Les agents doivent apparaître en état `Active`

### Étape 3 : Appliquer les règles de sécurité personnalisées

```bash
# Copier les règles personnalisées dans le Manager
docker cp k8s/wazuh/custom-rules.xml single-node-wazuh.manager-1:/var/ossec/etc/rules/local_rules.xml

# Redémarrer le Manager pour charger les règles
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-control restart
```

### Étape 4 : Vérifier les règles

```bash
# Lister les règles chargées
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-logtest
```

---

## Accès au Dashboard

- **URL** : https://52.205.61.44
- **Username** : `admin`
- **Password** : `SecretPassword`

### Navigation dans le Dashboard

1. **Agents** : `Management` → `Agents` pour voir tous les agents connectés
2. **Security Events** : `Threat Hunting` → `Security events` pour les événements en temps réel
3. **Compliance** : `Regulatory compliance` → `HIPAA`, `GDPR`, `PCI DSS`
4. **Vulnerabilities** : `Threat detection and response` → `Vulnerabilities`

---

## Règles de Sécurité Personnalisées MedInsight

### Règles HIPAA / GDPR

| Rule ID | Description | Niveau |
|---------|-------------|--------|
| 100103 | Accès non autorisé aux dossiers patients | 12 (Critique) |
| 100104 | Modification de prescription | 8 (Élevé) |
| 100105 | Accès aux résultats de laboratoire | 6 (Moyen) |
| 100113 | Exposition de données sensibles | 15 (Critique) |

### Règles d'Authentification

| Rule ID | Description | Niveau |
|---------|-------------|--------|
| 100100 | Authentification réussie via Keycloak | 3 (Info) |
| 100101 | Tentative d'authentification échouée | 5 (Moyen) |
| 100102 | Brute force (5 tentatives en 2min) | 10 (Élevé) |
| 100107 | Escalade de privilèges (Staff) | 12 (Critique) |

### Règles d'Attaque

| Rule ID | Description | Niveau |
|---------|-------------|--------|
| 100109 | Tentative d'injection SQL | 15 (Critique) |
| 100108 | Limite de débit API dépassée (DDoS) | 7 (Élevé) |
| 100110 | Pattern d'accès API suspect | 10 (Élevé) |

---

## Tests de Validation

### Test 1 : Tentative d'authentification échouée
```bash
# Depuis votre machine locale
curl -X POST https://52.205.61.44:8180/realms/medinsight/protocol/openid-connect/token \
  -d "username=invalid&password=wrong&grant_type=password"
```
**Attendu** : Alerte `100101` dans Wazuh Dashboard

### Test 2 : Accès non autorisé
```bash
# Tenter d'accéder à un endpoint protégé sans token
curl https://52.205.61.44:8200/api/dossier/1
```
**Attendu** : Alerte `100103` pour accès refusé

### Test 3 : Pattern d'accès suspect
```bash
# Script pour générer 10 requêtes en 30 secondes
for i in {1..10}; do
  curl https://52.205.61.44:8200/api/appointments
  sleep 3
done
```
**Attendu** : Alerte `100110` pour comportement suspect

---

## Maintenance

### Redémarrer les agents
```bash
kubectl rollout restart daemonset/wazuh-agent -n medinsight
```

### Nettoyer les agents déconnectés
```bash
docker exec single-node-wazuh.manager-1 /var/ossec/bin/manage_agents -r <AGENT_ID>
```

### Mettre à jour la configuration
```bash
kubectl edit configmap wazuh-agent-config -n medinsight
kubectl rollout restart daemonset/wazuh-agent -n medinsight
```

### Visualiser les logs du Manager
```bash
docker logs single-node-wazuh.manager-1 --tail 100 -f
```

---

## Troubleshooting

### Les agents n'apparaissent pas comme "Active"

**Diagnostic** :
```bash
kubectl logs -n medinsight <wazuh-agent-pod-name>
```

**Solutions courantes** :
1. Vérifier que le port 1514 est ouvert dans le Security Group AWS
2. Vérifier la connectivité réseau : `kubectl exec -it <pod> -- ping 52.205.61.44`
3. Vérifier la configuration dans le ConfigMap

### Dashboard inaccessible

**Diagnostic** :
```bash
docker logs single-node-wazuh.dashboard-1 --tail 50
```

**Solutions** :
1. Vérifier que le port 443 est ouvert dans le Security Group
2. Redémarrer le dashboard : `docker restart single-node-wazuh.dashboard-1`

### Règles personnalisées non appliquées

```bash
# Vérifier les règles chargées
docker exec single-node-wazuh.manager-1 cat /var/ossec/etc/rules/local_rules.xml

# Vérifier les erreurs de parsing
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-logtest -t
```

---

## Intégration CI/CD

Pour automatiser le déploiement dans le pipeline GitHub Actions, ajoutez cette étape :

```yaml
- name: Deploy Wazuh Agents
  run: |
    kubectl apply -f k8s/wazuh/ -n medinsight
    sleep 30
    kubectl get pods -n medinsight -l app=wazuh-agent
```

---

## Ressources

- **Documentation officielle Wazuh** : https://documentation.wazuh.com
- **Wazuh Ruleset** : https://github.com/wazuh/wazuh-ruleset
- **Dashboard MedInsight** : https://52.205.61.44

---

## Support

Pour toute question ou problème, vérifiez d'abord :
1. Les logs des agents Wazuh dans Kubernetes
2. Les logs du Wazuh Manager
3. La connectivité réseau entre agents et manager
