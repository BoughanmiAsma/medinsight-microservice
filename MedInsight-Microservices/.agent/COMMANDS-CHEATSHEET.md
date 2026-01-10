# 🔧 Commandes Utiles : Fabric & Backend

## 📋 Table des Matières

1. [Gestion du Réseau Fabric](#gestion-du-réseau-fabric)
2. [Gestion des Services Backend](#gestion-des-services-backend)
3. [Tests et Debugging](#tests-et-debugging)
4. [Monitoring et Logs](#monitoring-et-logs)
5. [Opérations Courantes](#opérations-courantes)

---

## 1. Gestion du Réseau Fabric

### Démarrer le Réseau Fabric

```bash
# Depuis le dossier fabric-network
cd ../fabric-network

# Démarrer tous les conteneurs Fabric
docker-compose -f docker-compose-fabric.yml up -d

# Vérifier que tous les conteneurs sont démarrés
docker ps | grep fabric
```

### Arrêter le Réseau Fabric

```bash
# Arrêter sans supprimer les volumes
docker-compose -f docker-compose-fabric.yml down

# Arrêter ET supprimer les volumes (⚠️ perte de données)
docker-compose -f docker-compose-fabric.yml down -v
```

### Vérifier l'État du Réseau

```bash
# Lister les channels sur le peer doctor
docker exec peer0.doctor.medinsight.com peer channel list

# Vérifier les chaincodes déployés sur recordschannel
docker exec cli peer lifecycle chaincode querycommitted --channelID recordschannel

# Vérifier les chaincodes sur consentchannel
docker exec cli peer lifecycle chaincode querycommitted --channelID consentchannel

# Vérifier les chaincodes sur prescriptionschannel
docker exec cli peer lifecycle chaincode querycommitted --channelID prescriptionschannel
```

### Redéployer un Chaincode

```bash
# Depuis fabric-network
./scripts/deploy-chaincode.sh

# Ou manuellement pour medical-records
docker exec cli peer lifecycle chaincode package medical-records.tar.gz \
  --path /opt/gopath/src/github.com/chaincode/medical-records \
  --lang golang \
  --label medical-records_1.0

docker exec cli peer lifecycle chaincode install medical-records.tar.gz
```

---

## 2. Gestion des Services Backend

### Démarrer les Microservices

```bash
# Depuis MedInsight-Microservices
cd MedInsight-Microservices

# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d dossier-service
docker-compose up -d lab-service
docker-compose up -d ordonnance-service
```

### Arrêter les Microservices

```bash
# Arrêter tous les services
docker-compose down

# Arrêter un service spécifique
docker-compose stop dossier-service
```

### Reconstruire un Service

```bash
# Reconstruire et redémarrer dossier-service
docker-compose up -d --build dossier-service

# Reconstruire sans cache
docker-compose build --no-cache dossier-service
docker-compose up -d dossier-service
```

### Vérifier l'État des Services

```bash
# Lister tous les conteneurs
docker ps

# Vérifier un service spécifique
docker ps | grep dossier-service

# Vérifier la santé d'un service
docker inspect --format='{{.State.Health.Status}}' dossier-service
```

---

## 3. Tests et Debugging

### Tester le Chaincode Directement

```bash
# Créer un dossier médical
docker exec cli peer chaincode invoke \
  -o orderer.medinsight.com:7050 \
  -C recordschannel \
  -n medical-records \
  -c '{"function":"CreateRecord","Args":["REC001","PAT001","DOC001","Hypertension","Medication","[\"Lisinopril 10mg\"]","BP: 140/90","Patient advised"]}'

# Lire un dossier médical
docker exec cli peer chaincode query \
  -C recordschannel \
  -n medical-records \
  -c '{"function":"ReadRecord","Args":["REC001"]}'

# Lister tous les dossiers d'un patient
docker exec cli peer chaincode query \
  -C recordschannel \
  -n medical-records \
  -c '{"function":"QueryRecordsByPatient","Args":["PAT001"]}'
```

### Tester les API REST

```bash
# Obtenir un token JWT (remplacer les credentials)
TOKEN=$(curl -X POST http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=doctor1" \
  -d "password=password" \
  -d "grant_type=password" \
  -d "client_id=dossier-service" \
  -d "client_secret=dossier-service-secret-2024" \
  | jq -r '.access_token')

# Créer un dossier via l'API
curl -X POST http://localhost:8083/api/dossiers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "PAT001",
    "doctorId": "DOC001",
    "diagnosis": "Hypertension",
    "treatment": "Medication",
    "medications": ["Lisinopril 10mg"],
    "labResults": "BP: 140/90",
    "notes": "Patient advised"
  }'

# Lire un dossier
curl -X GET http://localhost:8083/api/dossiers/REC001 \
  -H "Authorization: Bearer $TOKEN"

# Lister tous les dossiers
curl -X GET http://localhost:8083/api/dossiers \
  -H "Authorization: Bearer $TOKEN"
```

### Tester la Base de Données

```bash
# Se connecter à PostgreSQL
docker exec -it medinsight-postgres psql -U admin -d medinsight_platform

# Lister les tables
\dt

# Voir les dossiers
SELECT * FROM dossiers;

# Quitter
\q
```

---

## 4. Monitoring et Logs

### Logs des Services Backend

```bash
# Logs en temps réel du dossier-service
docker logs -f dossier-service

# Logs des 100 dernières lignes
docker logs --tail 100 dossier-service

# Logs avec timestamp
docker logs -t dossier-service

# Logs de tous les services
docker-compose logs -f
```

### Logs du Réseau Fabric

```bash
# Logs du peer doctor
docker logs -f peer0.doctor.medinsight.com

# Logs de l'orderer
docker logs -f orderer.medinsight.com

# Logs du CA doctor
docker logs -f ca.doctor.medinsight.com

# Logs du CLI
docker logs -f cli
```

### Logs Kafka

```bash
# Logs de Kafka
docker logs -f medinsight-kafka

# Logs de Zookeeper
docker logs -f medinsight-zookeeper

# Lister les topics Kafka
docker exec medinsight-kafka kafka-topics --list --bootstrap-server localhost:9092

# Consommer les messages d'un topic
docker exec medinsight-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic dossier.created \
  --from-beginning
```

### Monitoring des Ressources

```bash
# Utilisation CPU/Mémoire de tous les conteneurs
docker stats

# Utilisation d'un conteneur spécifique
docker stats dossier-service

# Espace disque utilisé par Docker
docker system df

# Nettoyer les ressources inutilisées
docker system prune -a
```

---

## 5. Opérations Courantes

### Réinitialiser Complètement le Projet

```bash
# ⚠️ ATTENTION : Supprime TOUTES les données

# 1. Arrêter tous les conteneurs
cd MedInsight-Microservices
docker-compose down -v

cd ../fabric-network
docker-compose -f docker-compose-fabric.yml down -v

# 2. Supprimer les artefacts Fabric
rm -rf crypto-config channel-artifacts

# 3. Supprimer les wallets
rm -rf wallets/*/

# 4. Redémarrer Fabric
./scripts/start-network.sh
./scripts/deploy-chaincode.sh

# 5. Redémarrer les microservices
cd ../MedInsight-Microservices
docker-compose up -d
```

### Vérifier la Connectivité Fabric

```bash
# Ping du peer depuis le service
docker exec dossier-service ping -c 3 peer0.doctor.medinsight.com

# Vérifier la résolution DNS
docker exec dossier-service nslookup peer0.doctor.medinsight.com

# Tester la connexion gRPC (si grpcurl installé)
docker exec dossier-service grpcurl -plaintext peer0.doctor.medinsight.com:7051 list
```

### Backup et Restore

```bash
# Backup de PostgreSQL
docker exec medinsight-postgres pg_dump -U admin medinsight_platform > backup.sql

# Restore de PostgreSQL
cat backup.sql | docker exec -i medinsight-postgres psql -U admin -d medinsight_platform

# Backup du ledger Fabric (copier les volumes)
docker run --rm -v fabric-network_peer0.doctor.medinsight.com:/data \
  -v $(pwd):/backup alpine tar czf /backup/peer-backup.tar.gz /data
```

### Accéder aux Conteneurs

```bash
# Shell dans dossier-service
docker exec -it dossier-service /bin/bash

# Shell dans le peer doctor
docker exec -it peer0.doctor.medinsight.com /bin/bash

# Shell dans PostgreSQL
docker exec -it medinsight-postgres /bin/bash

# Shell dans le CLI Fabric
docker exec -it cli /bin/bash
```

---

## 6. Commandes de Développement

### Compiler et Tester Localement

```bash
# Depuis dossier-service
cd dossier-service

# Compiler avec Maven
mvn clean compile

# Exécuter les tests
mvn test

# Créer le JAR
mvn clean package

# Exécuter localement (sans Docker)
mvn spring-boot:run
```

### Vérifier les Dépendances

```bash
# Afficher l'arbre des dépendances
mvn dependency:tree

# Vérifier les mises à jour disponibles
mvn versions:display-dependency-updates

# Vérifier les vulnérabilités
mvn dependency-check:check
```

### Formater le Code

```bash
# Formater avec Maven
mvn spotless:apply

# Vérifier le style
mvn checkstyle:check
```

---

## 7. Troubleshooting

### Problème : Service ne démarre pas

```bash
# Vérifier les logs
docker logs dossier-service

# Vérifier les variables d'environnement
docker exec dossier-service env | grep FABRIC

# Vérifier les volumes montés
docker inspect dossier-service | jq '.[0].Mounts'
```

### Problème : Connexion Fabric échoue

```bash
# Vérifier que le réseau fabric-net existe
docker network ls | grep fabric-net

# Vérifier que le service est sur le bon réseau
docker inspect dossier-service | jq '.[0].NetworkSettings.Networks'

# Vérifier que le wallet existe
docker exec dossier-service ls -la /app/wallet

# Vérifier que le connection profile existe
docker exec dossier-service cat /app/connection-doctor.json
```

### Problème : Transaction Fabric timeout

```bash
# Vérifier l'état des peers
docker ps | grep peer

# Vérifier les logs du peer
docker logs peer0.doctor.medinsight.com | tail -50

# Vérifier l'orderer
docker logs orderer.medinsight.com | tail -50

# Augmenter le timeout dans application.properties
# fabric.transaction.timeout=30000
```

### Problème : Base de données inaccessible

```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres

# Tester la connexion
docker exec dossier-service nc -zv postgres 5432

# Vérifier les credentials
docker exec medinsight-postgres psql -U admin -d medinsight_platform -c "SELECT 1"
```

---

## 8. Commandes Utiles Diverses

### Nettoyer Docker

```bash
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune -a

# Supprimer les volumes non utilisés
docker volume prune

# Supprimer les réseaux non utilisés
docker network prune

# Tout nettoyer (⚠️ ATTENTION)
docker system prune -a --volumes
```

### Exporter/Importer des Images

```bash
# Exporter une image
docker save -o dossier-service.tar dossier-service:latest

# Importer une image
docker load -i dossier-service.tar
```

### Copier des Fichiers

```bash
# Copier depuis le conteneur vers l'hôte
docker cp dossier-service:/app/logs/app.log ./app.log

# Copier depuis l'hôte vers le conteneur
docker cp ./config.json dossier-service:/app/config.json
```

---

## 📝 Notes Importantes

### Variables d'Environnement

Les services utilisent ces variables d'environnement clés :

```bash
# Fabric
FABRIC_WALLET_PATH=/app/wallet
FABRIC_CONNECTION_PROFILE=/app/connection-doctor.json

# PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/medinsight_platform
SPRING_DATASOURCE_USERNAME=admin
SPRING_DATASOURCE_PASSWORD=password

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092

# Keycloak
KEYCLOAK_SERVER_URL=http://host.docker.internal:8180
```

### Ports Importants

| Service | Port | Description |
|---------|------|-------------|
| dossier-service | 8083 | API REST |
| lab-service | 8081 | API REST |
| ordonnance-service | 8082 | API REST |
| PostgreSQL | 5434 | Base de données |
| Kafka | 9092 | Message broker |
| Keycloak | 8180 | Authentification |
| peer0.doctor | 7051 | Peer Fabric |
| ca.doctor | 7054 | CA Fabric |
| orderer | 7050 | Orderer Fabric |

---

**Dernière mise à jour** : 2026-01-10  
**Version** : 1.0
