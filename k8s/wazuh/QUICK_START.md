# 🚀 Guide de Déploiement Rapide - Wazuh Agents

## Prérequis
- [x] Wazuh Manager installé sur master node ✅
- [x] Cluster Kubernetes opérationnel ✅
- [x] Namespace `medinsight` créé ✅
- [ ] Port 1514 ouvert dans AWS Security Group ⚠️

---

## Étape 1 : Ouvrir le Port 1514 (AWS Console)

**OBLIGATOIRE** pour la communication agents → manager

### Via AWS Console (Interface Web)
1. Ouvrir la **AWS Console** : https://console.aws.amazon.com/ec2
2. **EC2** → **Security Groups**
3. Trouver le Security Group du **Master Node** (52.205.61.44)
4. **Inbound Rules** → **Edit inbound rules**
5. **Add Rule** :
   - **Type** : Custom TCP
   - **Port Range** : `1514`
   - **Source** : Choisir le Security Group des Workers OU le CIDR de votre VPC (ex: `172.31.0.0/16`)
   - **Description** : `Wazuh Agent Communication`
6. **Save rules**

### Via AWS CLI (Alternative)
```bash
# Récupérer le Security Group ID du master
SG_ID=$(aws ec2 describe-instances --instance-ids <MASTER_INSTANCE_ID> \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)

# Ajouter la règle
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 1514 \
  --source-group $WORKER_SG_ID  # OU --cidr <VPC_CIDR>
```

---

## Étape 2 : Copier les Fichiers vers le Master Node

**Depuis votre machine Windows** (PowerShell) :

```powershell
# Naviguer vers le dossier du projet
cd C:\Users\amani\Desktop\MedInsight

# Copier les fichiers Wazuh vers le master
scp -r k8s\wazuh ubuntu@52.205.61.44:~/
```

**Mot de passe** : [Votre clé SSH ou mot de passe]

---

## Étape 3 : Déployer les Agents (Via MobaXterm)

### Méthode 1 : Script Automatisé (Recommandé)

```bash
# Connexion au master node
ssh ubuntu@52.205.61.44

# Naviguer vers le dossier
cd ~/wazuh

# Rendre le script exécutable
chmod +x deploy-wazuh-agents.sh

# Exécuter le déploiement
./deploy-wazuh-agents.sh
```

Le script va :
1. Vérifier les prérequis
2. Déployer le ConfigMap
3. Déployer le DaemonSet
4. Attendre 30 secondes
5. Afficher le statut des pods

### Méthode 2 : Déploiement Manuel

```bash
# Déployer le ConfigMap
kubectl apply -f ~/wazuh/wazuh-agent-configmap.yml -n medinsight

# Déployer le DaemonSet
kubectl apply -f ~/wazuh/wazuh-agent-daemonset.yml -n medinsight

# Attendre que les pods démarrent
sleep 30

# Vérifier le statut
kubectl get pods -n medinsight -l app=wazuh-agent
```

---

## Étape 4 : Vérifier les Agents Connectés

### Vérifier dans Kubernetes
```bash
# Voir tous les pods agents
kubectl get pods -n medinsight -l app=wazuh-agent

# Voir les logs d'un agent
kubectl logs -n medinsight <nom-du-pod-agent> --tail=50
```

**Résultat attendu** : Pods en état `Running`

### Vérifier dans le Wazuh Manager
```bash
# Lister les agents connectés
docker exec single-node-wazuh.manager-1 /var/ossec/bin/agent_control -l
```

**Résultat attendu** : Nouveaux agents en état `Active` (nommés selon les nodes K8s)

---

## Étape 5 : Appliquer les Règles de Sécurité Personnalisées

```bash
# Copier les règles personnalisées
docker cp ~/wazuh/custom-rules.xml single-node-wazuh.manager-1:/var/ossec/etc/rules/local_rules.xml

# Redémarrer le Manager pour charger les règles
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-control restart

# Attendre le redémarrage (30 secondes)
sleep 30

# Vérifier que le Manager a redémarré
docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-control status
```

---

## Étape 6 : Vérifier dans le Dashboard Wazuh

1. **Ouvrir le navigateur** : https://52.205.61.44
2. **Connexion** : admin / SecretPassword
3. **Voir les agents** :
   - Menu **Management** → **Agents**
   - Vous devriez voir les nouveaux agents (nommés par nodes K8s)
4. **Voir les événements** :
   - Menu **Threat Hunting** → **Security events**
   - Onglet **Events** pour voir les premiers logs

---

## Étape 7 : Tester les Règles (Optionnel)

### Test 1 : Authentification Échouée (Règle 100101)
```bash
# Depuis le master ou votre machine
curl -X POST https://52.205.61.44:8180/realms/medinsight/protocol/openid-connect/token \
  -d "username=testuser&password=wrongpassword&grant_type=password" \
  -d "client_id=test"
```

**Dashboard** : Chercher alerte ID `100101` dans Security Events

### Test 2 : Pattern d'Accès Suspect (Règle 100110)
```bash
# Envoyer 15 requêtes en 30 secondes
for i in {1..15}; do
  curl -k https://52.205.61.44:8200/api/appointments 2>/dev/null
  echo "Request $i sent"
  sleep 2
done
```

**Dashboard** : Chercher alerte ID `100110` (10 requêtes en 60s)

---

## Dépannage Rapide

### Les pods agents ne démarrent pas
```bash
# Voir les événements du pod
kubectl describe pod <nom-pod> -n medinsight

# Voir les logs
kubectl logs <nom-pod> -n medinsight
```

### Les agents n'apparaissent pas dans le Manager
1. Vérifier que le port 1514 est ouvert (AWS Security Group)
2. Tester la connectivité :
   ```bash
   kubectl exec -it <pod-agent> -n medinsight -- ping 52.205.61.44
   kubectl exec -it <pod-agent> -n medinsight -- telnet 52.205.61.44 1514
   ```

### Dashboard inaccessible
```bash
# Vérifier les conteneurs
docker ps | grep wazuh

# Redémarrer le dashboard si nécessaire
docker restart single-node-wazuh.dashboard-1
```

---

## Checklist de Déploiement

- [ ] Port 1514 ouvert dans AWS Security Group
- [ ] Fichiers Wazuh copiés sur le master node
- [ ] DaemonSet déployé (`kubectl get ds -n medinsight`)
- [ ] Pods agents en état Running (`kubectl get pods`)
- [ ] Agents connectés au Manager (`agent_control -l`)
- [ ] Règles personnalisées appliquées
- [ ] Dashboard accessible et affiche les agents
- [ ] Test d'une règle réussi

---

## 🎉 Félicitations !

Une fois toutes les étapes complétées, votre plateforme MedInsight dispose d'une surveillance de sécurité complète avec :
- ✅ Wazuh Manager centralisé
- ✅ Agents sur tous les nodes Kubernetes
- ✅ 16 règles de sécurité personnalisées (HIPAA, GDPR, PCI DSS)
- ✅ Dashboard de monitoring en temps réel

**Prochaines étapes** :
- Configurer les notifications par email/Slack pour les alertes critiques
- Ajouter des règles spécifiques aux cas d'usage métier
- Intégrer Wazuh dans le pipeline CI/CD

---

## Ressources

- **Documentation Complète** : [`docs/WAZUH_DEPLOYMENT_GUIDE.md`](../docs/WAZUH_DEPLOYMENT_GUIDE.md)
- **Règles Personnalisées** : [`k8s/wazuh/custom-rules.xml`](custom-rules.xml)
- **Dashboard** : https://52.205.61.44
