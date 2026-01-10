# Intégration de PatientOrg au Réseau Fabric

## 📋 Vue d'ensemble

Ce document décrit l'ajout de l'organisation **PatientOrg** au réseau Hyperledger Fabric de MedInsight. PatientOrg était mentionné dans la documentation mais n'existait pas dans la configuration réelle du réseau.

---

## ✅ Modifications Effectuées

### 1. **crypto-config.yaml**
Ajout de la définition de PatientOrg pour la génération des certificats cryptographiques :

```yaml
# Organisation des Patients (PatientOrg)
- Name: PatientOrg
  Domain: patient.medinsight.com
  EnableNodeOUs: true
  Template:
    Count: 1
  Users:
    Count: 1
```

**Rôle** : Permet de générer les certificats X.509 pour PatientOrg via `cryptogen`.

---

### 2. **configtx.yaml**
Ajout de PatientOrg dans trois sections :

#### a) Définition de l'organisation (lignes 85-105)
```yaml
- &PatientOrg
  Name: PatientOrgMSP
  ID: PatientOrgMSP
  MSPDir: crypto-config/peerOrganizations/patient.medinsight.com/msp
  Policies:
    Readers:
      Type: Signature
      Rule: "OR('PatientOrgMSP.admin', 'PatientOrgMSP.peer', 'PatientOrgMSP.client')"
    Writers:
      Type: Signature
      Rule: "OR('PatientOrgMSP.admin', 'PatientOrgMSP.client')"
    Admins:
      Type: Signature
      Rule: "OR('PatientOrgMSP.admin')"
    Endorsement:
      Type: Signature
      Rule: "OR('PatientOrgMSP.peer')"
  AnchorPeers:
    - Host: peer0.patient.medinsight.com
      Port: 13051
```

#### b) Consortium MedInsightConsortium
```yaml
Consortiums:
  MedInsightConsortium:
    Organizations:
      - *DoctorOrg
      - *PharmacyOrg
      - *LabOrg
      - *PatientOrg  # ← Ajouté
```

#### c) Tous les channels
PatientOrg a été ajouté aux trois channels :
- **ConsentChannel** : Gestion des consentements
- **RecordsChannel** : Dossiers médicaux
- **PrescriptionsChannel** : Ordonnances

---

### 3. **docker-compose-fabric.yml**
Ajout des services Docker pour PatientOrg :

#### a) Volume Docker
```yaml
volumes:
  peer0.patient.medinsight.com:
```

#### b) Certificate Authority (CA)
```yaml
ca.patient.medinsight.com:
  image: hyperledger/fabric-ca:1.5
  container_name: ca.patient.medinsight.com
  environment:
    - FABRIC_CA_SERVER_PORT=10054
  ports:
    - "10054:10054"
```

**Port** : 10054

#### c) Peer Node
```yaml
peer0.patient.medinsight.com:
  image: hyperledger/fabric-peer:2.5
  container_name: peer0.patient.medinsight.com
  environment:
    - CORE_PEER_ID=peer0.patient.medinsight.com
    - CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051
    - CORE_PEER_LOCALMSPID=PatientOrgMSP
  ports:
    - 13051:13051  # Peer port
    - 9447:9447    # Operations port
```

**Ports** :
- **13051** : Communication peer
- **9447** : Métriques/opérations

---

### 4. **scripts/generate-genesis.ps1**
Ajout de la génération des anchor peers pour PatientOrg :

```powershell
# Anchor peer for PatientOrg
& $CONFIGTXGEN -profile ConsentChannel -outputAnchorPeersUpdate ".\channel-artifacts\PatientOrgMSPanchors_consent.tx" -channelID consentchannel -asOrg PatientOrgMSP
& $CONFIGTXGEN -profile RecordsChannel -outputAnchorPeersUpdate ".\channel-artifacts\PatientOrgMSPanchors_records.tx" -channelID recordschannel -asOrg PatientOrgMSP
& $CONFIGTXGEN -profile PrescriptionsChannel -outputAnchorPeersUpdate ".\channel-artifacts\PatientOrgMSPanchors_prescriptions.tx" -channelID prescriptionschannel -asOrg PatientOrgMSP
```

---

## 🔧 Prochaines Étapes

Pour activer PatientOrg dans le réseau, vous devez **régénérer les artefacts Fabric** :

### Étape 1 : Arrêter le réseau actuel
```powershell
cd c:\Users\amani\Desktop\MedInsight\fabric-network
docker-compose -f docker-compose-fabric.yml down -v
```

**⚠️ Attention** : L'option `-v` supprime les volumes et donc **toutes les données blockchain**. Sauvegardez si nécessaire.

---

### Étape 2 : Régénérer les certificats cryptographiques
```powershell
cd c:\Users\amani\Desktop\MedInsight\fabric-network
.\scripts\generate-crypto.ps1
```

**Résultat attendu** :
```
crypto-config/
├── ordererOrganizations/
│   └── medinsight.com/
└── peerOrganizations/
    ├── doctor.medinsight.com/
    ├── pharmacy.medinsight.com/
    ├── lab.medinsight.com/
    └── patient.medinsight.com/  ← Nouveau !
```

---

### Étape 3 : Régénérer le genesis block et les channel artifacts
```powershell
.\scripts\generate-genesis.ps1
```

**Nouveaux fichiers générés** :
```
channel-artifacts/
├── genesis.block
├── consentchannel.tx
├── recordschannel.tx
├── prescriptionschannel.tx
├── PatientOrgMSPanchors_consent.tx      ← Nouveau !
├── PatientOrgMSPanchors_records.tx      ← Nouveau !
└── PatientOrgMSPanchors_prescriptions.tx ← Nouveau !
```

---

### Étape 4 : Démarrer le réseau avec PatientOrg
```powershell
docker-compose -f docker-compose-fabric.yml up -d
```

**Vérification** :
```powershell
docker ps
```

Vous devriez voir :
- `ca.patient.medinsight.com`
- `peer0.patient.medinsight.com`

---

### Étape 5 : Créer et joindre les channels
Utilisez le script de démarrage du réseau :
```powershell
.\scripts\start-network.ps1
```

Ou manuellement via le CLI :
```bash
docker exec -it cli bash

# Créer le channel
peer channel create -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/recordschannel.tx

# Joindre PatientOrg au channel
export CORE_PEER_LOCALMSPID="PatientOrgMSP"
export CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp

peer channel join -b recordschannel.block

# Mettre à jour l'anchor peer
peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PatientOrgMSPanchors_records.tx
```

---

### Étape 6 : Enregistrer les identités applicatives
Créer un utilisateur pour l'application patient :
```powershell
.\scripts\register-identities.ps1
```

Ou manuellement :
```bash
# Enregistrer patientAppUser
fabric-ca-client register --caname ca.patient.medinsight.com --id.name patientAppUser --id.secret patientpw --id.type client --tls.certfiles ${PWD}/crypto-config/peerOrganizations/patient.medinsight.com/ca/ca.patient.medinsight.com-cert.pem

# Enroller l'utilisateur
fabric-ca-client enroll -u https://patientAppUser:patientpw@localhost:10054 --caname ca.patient.medinsight.com -M ${PWD}/wallets/patient/patientAppUser/msp --tls.certfiles ${PWD}/crypto-config/peerOrganizations/patient.medinsight.com/ca/ca.patient.medinsight.com-cert.pem
```

---

## 📊 Architecture Mise à Jour

```
┌─────────────────────────────────────────────────────────────────┐
│              COUCHE BLOCKCHAIN (Hyperledger Fabric)              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Fabric Network                        │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  DoctorOrg   │  │  PharmacyOrg │  │    LabOrg    │  │   │
│  │  │  Peer:7051   │  │  Peer:9051   │  │  Peer:11051  │  │   │
│  │  │  CA:7054     │  │  CA:8054     │  │  CA:9054     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────┐                                        │   │
│  │  │  PatientOrg  │  ← NOUVEAU !                          │   │
│  │  │  Peer:13051  │                                        │   │
│  │  │  CA:10054    │                                        │   │
│  │  └──────────────┘                                        │   │
│  │                                                           │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │              Orderer Service (Port 7050)          │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  Channels (avec PatientOrg) :                            │   │
│  │  • consentchannel    → consent chaincode                │   │
│  │  • recordschannel    → medical-records chaincode        │   │
│  │  • prescriptionschannel → prescriptions chaincode       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Ports Utilisés

| Organisation | Service | Port |
|-------------|---------|------|
| **DoctorOrg** | Peer | 7051 |
| | CA | 7054 |
| | Operations | 9444 |
| **PharmacyOrg** | Peer | 9051 |
| | CA | 8054 |
| | Operations | 9445 |
| **LabOrg** | Peer | 11051 |
| | CA | 9054 |
| | Operations | 9446 |
| **PatientOrg** | Peer | **13051** |
| | CA | **10054** |
| | Operations | **9447** |
| **Orderer** | Orderer | 7050 |
| | Operations | 8443 |

---

## 🎯 Cas d'Usage de PatientOrg

### 1. Gestion des Consentements
Les patients peuvent :
- Accorder des consentements pour accéder à leurs dossiers
- Révoquer des consentements
- Consulter l'historique des accès

### 2. Consultation des Dossiers Médicaux
Les patients peuvent :
- Lire leurs propres dossiers médicaux
- Voir l'historique des modifications
- Vérifier qui a accédé à leurs données

### 3. Gestion des Prescriptions
Les patients peuvent :
- Consulter leurs prescriptions
- Vérifier le statut de dispensation
- Voir l'historique des prescriptions

---

## 📝 Modifications du Chaincode

Pour permettre aux patients d'interagir avec le réseau, vous devrez mettre à jour les chaincodes :

### Exemple : medical-records chaincode
```go
func (c *MedicalRecordsContract) ReadRecord(ctx contractapi.TransactionContextInterface, recordID string) (*MedicalRecord, error) {
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return nil, err
    }
    
    record, err := c.getRecord(ctx, recordID)
    if err != nil {
        return nil, err
    }
    
    // Autoriser le patient à lire son propre dossier
    if mspID == "PatientOrgMSP" {
        patientID, _ := ctx.GetClientIdentity().GetID()
        if record.PatientID != patientID {
            return nil, fmt.Errorf("patients can only read their own records")
        }
    }
    
    return record, nil
}
```

---

## ⚠️ Points d'Attention

### 1. **Données Existantes**
La régénération des artefacts **supprime toutes les données** de la blockchain. Si vous avez des données importantes :
- Exportez-les avant de régénérer
- Ou utilisez une migration de channel

### 2. **Connection Profiles**
Le fichier `connection-patient.json` existe déjà. Vérifiez qu'il pointe vers les bons ports :
```json
{
  "peers": {
    "peer0.patient.medinsight.com": {
      "url": "grpcs://localhost:13051"
    }
  },
  "certificateAuthorities": {
    "ca.patient.medinsight.com": {
      "url": "https://localhost:10054"
    }
  }
}
```

### 3. **Microservices**
Si vous créez un service pour les patients, configurez-le dans `docker-compose.yml` :
```yaml
patient-service:
  build:
    context: ./patient-service
  environment:
    FABRIC_CONNECTION_PROFILE: /app/connection-patient.json
    FABRIC_WALLET_PATH: /app/wallet
  volumes:
    - ../fabric-network/connection-patient.json:/app/connection-patient.json
    - ../fabric-network/wallets/patient/patientAppUser:/app/wallet
  networks:
    - medinsight-net
    - fabric-net
```

---

## ✅ Vérification

Après avoir suivi toutes les étapes, vérifiez que PatientOrg fonctionne :

```bash
# 1. Vérifier que le peer est en cours d'exécution
docker logs peer0.patient.medinsight.com

# 2. Vérifier que le peer a rejoint le channel
docker exec -it cli bash
export CORE_PEER_LOCALMSPID="PatientOrgMSP"
export CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051
peer channel list

# 3. Tester une query
peer chaincode query -C recordschannel -n medical-records -c '{"Args":["QueryAllRecords"]}'
```

---

## 📚 Ressources

- **Documentation Fabric** : https://hyperledger-fabric.readthedocs.io/
- **Fichier de configuration** : `fabric-network/configtx.yaml`
- **Scripts de génération** : `fabric-network/scripts/`
- **Connection Profile** : `fabric-network/connection-patient.json`

---

**Auteur** : Documentation générée pour l'intégration de PatientOrg  
**Date** : 2026-01-10  
**Version** : 1.0
