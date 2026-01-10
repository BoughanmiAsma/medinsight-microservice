# Guide Complet : Intégration PatientOrg - Prochaines Étapes

## 📋 Vue d'ensemble

Ce guide détaille les étapes pour compléter l'intégration de **PatientOrg** dans le système MedInsight, incluant le déploiement des chaincodes, la création d'un service patient, et l'implémentation des contrôles d'accès.

---

## ✅ Étape 1 : Déployer les Chaincodes avec PatientOrg

### 1.1 Exécuter le Script de Déploiement

Le script `deploy-chaincode.ps1` a été mis à jour pour inclure PatientOrg. Il va :
- **Packager** les 3 chaincodes (medical-records, consent, prescriptions)
- **Installer** sur les 4 peers (Doctor, Pharmacy, Lab, **Patient**)
- **Approuver** pour les 4 organisations
- **Commit** sur les channels respectifs

```powershell
cd c:\Users\amani\Desktop\MedInsight\fabric-network
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-chaincode.ps1
```

### 1.2 Vérifier le Déploiement

Après le déploiement, vérifiez que les chaincodes sont actifs :

```powershell
# Vérifier les chaincodes installés sur PatientOrg
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP `
  -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 `
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp `
  cli peer lifecycle chaincode queryinstalled

# Vérifier les chaincodes committés sur recordschannel
docker exec cli peer lifecycle chaincode querycommitted --channelID recordschannel

# Vérifier les chaincodes committés sur consentchannel
docker exec cli peer lifecycle chaincode querycommitted --channelID consentchannel

# Vérifier les chaincodes committés sur prescriptionschannel
docker exec cli peer lifecycle chaincode querycommitted --channelID prescriptionschannel
```

**Résultat attendu** : Vous devriez voir les 3 chaincodes avec la version 1.0 et les 4 organisations ayant approuvé.

---

## ✅ Étape 2 : Enregistrer des Identités Applicatives pour PatientOrg

### 2.1 Créer un Script d'Enregistrement

Créez le fichier `fabric-network/scripts/register-patient-identities.ps1` :

```powershell
# Register Patient Application Identities
# PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Registering Patient Application Identities" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:FABRIC_CA_CLIENT_HOME = "c:\Users\amani\Desktop\MedInsight\fabric-network"

# Register patientAppUser
Write-Host "Registering patientAppUser..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com fabric-ca-client register `
  --id.name patientAppUser `
  --id.secret patientpw `
  --id.type client `
  --id.affiliation patient `
  -u http://admin:adminpw@ca.patient.medinsight.com:10054

# Enroll patientAppUser
Write-Host "Enrolling patientAppUser..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com fabric-ca-client enroll `
  -u http://patientAppUser:patientpw@ca.patient.medinsight.com:10054 `
  -M /tmp/patientAppUser/msp

# Copy the enrolled identity to wallets directory
Write-Host "Copying identity to wallets..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com mkdir -p /etc/hyperledger/fabric-ca-server/wallets/patient/patientAppUser
docker exec ca.patient.medinsight.com cp -r /tmp/patientAppUser/msp /etc/hyperledger/fabric-ca-server/wallets/patient/patientAppUser/

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Patient Identities Registered Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
```

### 2.2 Exécuter le Script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-patient-identities.ps1
```

### 2.3 Vérifier les Wallets

```powershell
# Vérifier que le wallet a été créé
docker exec ca.patient.medinsight.com ls -la /etc/hyperledger/fabric-ca-server/wallets/patient/patientAppUser/msp
```

---

## ✅ Étape 3 : Créer un Service Patient dans les Microservices

### 3.1 Structure du Service

Créez la structure suivante :

```
MedInsight-Microservices/
└── patient-service/
    ├── src/
    │   └── main/
    │       ├── java/
    │       │   └── com/
    │       │       └── medinsight/
    │       │           └── patient/
    │       │               ├── PatientServiceApplication.java
    │       │               ├── config/
    │       │               │   ├── FabricConfig.java
    │       │               │   └── SecurityConfig.java
    │       │               ├── controller/
    │       │               │   ├── PatientRecordController.java
    │       │               │   ├── ConsentController.java
    │       │               │   └── PrescriptionController.java
    │       │               ├── service/
    │       │               │   ├── PatientRecordService.java
    │       │               │   ├── ConsentService.java
    │       │               │   └── PrescriptionService.java
    │       │               └── model/
    │       │                   ├── MedicalRecord.java
    │       │                   ├── Consent.java
    │       │                   └── Prescription.java
    │       └── resources/
    │           └── application.properties
    ├── Dockerfile
    └── pom.xml
```

### 3.2 Fichier `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.medinsight</groupId>
    <artifactId>patient-service</artifactId>
    <version>1.0.0</version>
    <name>Patient Service</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Keycloak -->
        <dependency>
            <groupId>org.keycloak</groupId>
            <artifactId>keycloak-spring-boot-starter</artifactId>
            <version>23.0.0</version>
        </dependency>

        <!-- Hyperledger Fabric Gateway SDK -->
        <dependency>
            <groupId>org.hyperledger.fabric</groupId>
            <artifactId>fabric-gateway-java</artifactId>
            <version>2.2.9</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 3.3 Configuration Fabric (`FabricConfig.java`)

```java
package com.medinsight.patient.config;

import org.hyperledger.fabric.gateway.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FabricConfig {
    
    @Value("${fabric.walletPath}")
    private String walletPath;
    
    @Value("${fabric.connectionProfile}")
    private String connectionProfile;
    
    @Value("${fabric.userName}")
    private String userName;
    
    @Bean
    public Wallet wallet() throws IOException {
        return Wallets.newFileSystemWallet(Paths.get(walletPath));
    }
    
    @Bean
    public Gateway gateway(Wallet wallet) throws IOException {
        Path networkConfigPath = Paths.get(connectionProfile);
        
        Gateway.Builder builder = Gateway.createBuilder();
        builder.identity(wallet, userName)
               .networkConfig(networkConfigPath)
               .discovery(true);
        
        return builder.connect();
    }
    
    @Bean(name = "recordsNetwork")
    public Network recordsNetwork(Gateway gateway) {
        return gateway.getNetwork("recordschannel");
    }
    
    @Bean(name = "consentNetwork")
    public Network consentNetwork(Gateway gateway) {
        return gateway.getNetwork("consentchannel");
    }
    
    @Bean(name = "prescriptionsNetwork")
    public Network prescriptionsNetwork(Gateway gateway) {
        return gateway.getNetwork("prescriptionschannel");
    }
    
    @Bean(name = "medicalRecordsContract")
    public Contract medicalRecordsContract(Network recordsNetwork) {
        return recordsNetwork.getContract("medical-records");
    }
    
    @Bean(name = "consentContract")
    public Contract consentContract(Network consentNetwork) {
        return consentNetwork.getContract("consent");
    }
    
    @Bean(name = "prescriptionsContract")
    public Contract prescriptionsContract(Network prescriptionsNetwork) {
        return prescriptionsNetwork.getContract("prescriptions");
    }
}
```

### 3.4 Service de Dossiers Médicaux (`PatientRecordService.java`)

```java
package com.medinsight.patient.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.patient.model.MedicalRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.gateway.Contract;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientRecordService {
    
    @Qualifier("medicalRecordsContract")
    private final Contract contract;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Récupérer tous les dossiers du patient connecté
     */
    public List<MedicalRecord> getMyRecords() throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String patientId = auth.getName(); // ID du patient depuis Keycloak
        
        log.info("Fetching records for patient: {}", patientId);
        
        byte[] result = contract.evaluateTransaction("QueryRecordsByPatient", patientId);
        MedicalRecord[] records = objectMapper.readValue(result, MedicalRecord[].class);
        
        return Arrays.asList(records);
    }
    
    /**
     * Récupérer un dossier spécifique
     */
    public MedicalRecord getRecordById(String recordId) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String patientId = auth.getName();
        
        log.info("Fetching record {} for patient {}", recordId, patientId);
        
        byte[] result = contract.evaluateTransaction("ReadRecord", recordId);
        MedicalRecord record = objectMapper.readValue(result, MedicalRecord.class);
        
        // Vérifier que le dossier appartient bien au patient
        if (!record.getPatientId().equals(patientId)) {
            throw new SecurityException("Access denied: This record does not belong to you");
        }
        
        return record;
    }
}
```

### 3.5 Service de Consentements (`ConsentService.java`)

```java
package com.medinsight.patient.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.patient.model.Consent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.gateway.Contract;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentService {
    
    @Qualifier("consentContract")
    private final Contract contract;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Accorder un consentement
     */
    public Consent grantConsent(String doctorId, String purpose) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String patientId = auth.getName();
        
        log.info("Patient {} granting consent to doctor {} for {}", patientId, doctorId, purpose);
        
        byte[] result = contract.submitTransaction(
            "GrantConsent",
            patientId,
            doctorId,
            purpose,
            String.valueOf(System.currentTimeMillis())
        );
        
        return objectMapper.readValue(result, Consent.class);
    }
    
    /**
     * Révoquer un consentement
     */
    public void revokeConsent(String consentId) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String patientId = auth.getName();
        
        log.info("Patient {} revoking consent {}", patientId, consentId);
        
        contract.submitTransaction("RevokeConsent", consentId, patientId);
    }
    
    /**
     * Lister mes consentements
     */
    public List<Consent> getMyConsents() throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String patientId = auth.getName();
        
        log.info("Fetching consents for patient {}", patientId);
        
        byte[] result = contract.evaluateTransaction("QueryConsentsByPatient", patientId);
        Consent[] consents = objectMapper.readValue(result, Consent[].class);
        
        return Arrays.asList(consents);
    }
}
```

### 3.6 Contrôleur REST (`PatientRecordController.java`)

```java
package com.medinsight.patient.controller;

import com.medinsight.patient.model.MedicalRecord;
import com.medinsight.patient.service.PatientRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient/records")
@RequiredArgsConstructor
public class PatientRecordController {
    
    private final PatientRecordService recordService;
    
    /**
     * GET /api/patient/records
     * Récupérer tous mes dossiers médicaux
     */
    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<MedicalRecord>> getMyRecords() {
        try {
            List<MedicalRecord> records = recordService.getMyRecords();
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * GET /api/patient/records/{id}
     * Récupérer un dossier spécifique
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalRecord> getRecordById(@PathVariable String id) {
        try {
            MedicalRecord record = recordService.getRecordById(id);
            return ResponseEntity.ok(record);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
```

### 3.7 Configuration (`application.properties`)

```properties
# Server Configuration
server.port=8084
spring.application.name=patient-service

# Hyperledger Fabric Configuration
fabric.walletPath=/app/wallet
fabric.connectionProfile=/app/connection-patient.json
fabric.userName=patientAppUser

# Keycloak Configuration
keycloak.realm=medinsight
keycloak.auth-server-url=http://keycloak:8080
keycloak.resource=patient-service
keycloak.credentials.secret=your-client-secret
keycloak.use-resource-role-mappings=true
keycloak.bearer-only=true

# Logging
logging.level.com.medinsight=DEBUG
logging.level.org.hyperledger.fabric=INFO
```

### 3.8 Dockerfile

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/patient-service-1.0.0.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3.9 Ajouter au `docker-compose.yml`

```yaml
  patient-service:
    build:
      context: ./patient-service
    container_name: patient-service
    ports:
      - "8084:8084"
    environment:
      - FABRIC_WALLET_PATH=/app/wallet
      - FABRIC_CONNECTION_PROFILE=/app/connection-patient.json
      - KEYCLOAK_AUTH_SERVER_URL=http://keycloak:8080
    volumes:
      - ../fabric-network/connection-patient.json:/app/connection-patient.json:ro
      - ../fabric-network/wallets/patient/patientAppUser:/app/wallet:ro
    networks:
      - medinsight-net
      - fabric-net
    depends_on:
      - keycloak
      - peer0.patient.medinsight.com
```

---

## ✅ Étape 4 : Implémenter les Contrôles d'Accès dans les Chaincodes

### 4.1 Modifier le Chaincode `medical-records`

Fichier : `fabric-network/chaincode/medical-records/main.go`

Ajoutez la fonction pour permettre aux patients de lire leurs propres dossiers :

```go
// ReadRecord permet de lire un dossier médical
// Les patients peuvent lire leurs propres dossiers
// Les docteurs peuvent lire tous les dossiers
func (c *MedicalRecordsContract) ReadRecord(ctx contractapi.TransactionContextInterface, recordID string) (*MedicalRecord, error) {
    // Récupérer l'identité de l'appelant
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return nil, fmt.Errorf("failed to get MSP ID: %v", err)
    }
    
    // Récupérer le dossier
    recordJSON, err := ctx.GetStub().GetState(recordID)
    if err != nil {
        return nil, fmt.Errorf("failed to read from world state: %v", err)
    }
    if recordJSON == nil {
        return nil, fmt.Errorf("record %s does not exist", recordID)
    }
    
    var record MedicalRecord
    err = json.Unmarshal(recordJSON, &record)
    if err != nil {
        return nil, err
    }
    
    // Contrôle d'accès
    if mspID == "PatientOrgMSP" {
        // Les patients peuvent seulement lire leurs propres dossiers
        clientID, err := ctx.GetClientIdentity().GetID()
        if err != nil {
            return nil, fmt.Errorf("failed to get client ID: %v", err)
        }
        
        // Extraire le CN du certificat (format: CN=patientID,...)
        // Pour simplifier, on suppose que le patientID est dans le CN
        if !strings.Contains(clientID, record.PatientID) {
            return nil, fmt.Errorf("access denied: you can only read your own records")
        }
    } else if mspID != "DoctorOrgMSP" && mspID != "LabOrgMSP" {
        return nil, fmt.Errorf("access denied: only doctors, labs, and patients can read records")
    }
    
    return &record, nil
}

// QueryRecordsByPatient permet de récupérer tous les dossiers d'un patient
func (c *MedicalRecordsContract) QueryRecordsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*MedicalRecord, error) {
    // Récupérer l'identité de l'appelant
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return nil, fmt.Errorf("failed to get MSP ID: %v", err)
    }
    
    // Contrôle d'accès
    if mspID == "PatientOrgMSP" {
        // Les patients peuvent seulement voir leurs propres dossiers
        clientID, err := ctx.GetClientIdentity().GetID()
        if err != nil {
            return nil, fmt.Errorf("failed to get client ID: %v", err)
        }
        
        if !strings.Contains(clientID, patientID) {
            return nil, fmt.Errorf("access denied: you can only query your own records")
        }
    }
    
    // Query CouchDB
    queryString := fmt.Sprintf(`{"selector":{"patientID":"%s"}}`, patientID)
    
    resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()
    
    var records []*MedicalRecord
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }
        
        var record MedicalRecord
        err = json.Unmarshal(queryResponse.Value, &record)
        if err != nil {
            return nil, err
        }
        records = append(records, &record)
    }
    
    return records, nil
}
```

### 4.2 Modifier le Chaincode `consent`

Ajoutez les fonctions pour que les patients gèrent leurs consentements :

```go
// GrantConsent permet à un patient d'accorder un consentement
func (c *ConsentContract) GrantConsent(ctx contractapi.TransactionContextInterface, patientID string, doctorID string, purpose string, expiryDate string) (*Consent, error) {
    // Vérifier que l'appelant est bien le patient
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return nil, fmt.Errorf("failed to get MSP ID: %v", err)
    }
    
    if mspID != "PatientOrgMSP" {
        return nil, fmt.Errorf("only patients can grant consent")
    }
    
    clientID, err := ctx.GetClientIdentity().GetID()
    if err != nil {
        return nil, fmt.Errorf("failed to get client ID: %v", err)
    }
    
    if !strings.Contains(clientID, patientID) {
        return nil, fmt.Errorf("you can only grant consent for yourself")
    }
    
    // Créer le consentement
    consentID := fmt.Sprintf("CONSENT_%s_%s_%d", patientID, doctorID, time.Now().Unix())
    
    consent := Consent{
        ConsentID:   consentID,
        PatientID:   patientID,
        DoctorID:    doctorID,
        Purpose:     purpose,
        GrantedDate: time.Now().Format(time.RFC3339),
        ExpiryDate:  expiryDate,
        Status:      "ACTIVE",
    }
    
    consentJSON, err := json.Marshal(consent)
    if err != nil {
        return nil, err
    }
    
    err = ctx.GetStub().PutState(consentID, consentJSON)
    if err != nil {
        return nil, fmt.Errorf("failed to put consent to world state: %v", err)
    }
    
    return &consent, nil
}

// RevokeConsent permet à un patient de révoquer un consentement
func (c *ConsentContract) RevokeConsent(ctx contractapi.TransactionContextInterface, consentID string, patientID string) error {
    // Vérifier que l'appelant est bien le patient
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return fmt.Errorf("failed to get MSP ID: %v", err)
    }
    
    if mspID != "PatientOrgMSP" {
        return fmt.Errorf("only patients can revoke consent")
    }
    
    clientID, err := ctx.GetClientIdentity().GetID()
    if err != nil {
        return fmt.Errorf("failed to get client ID: %v", err)
    }
    
    if !strings.Contains(clientID, patientID) {
        return fmt.Errorf("you can only revoke your own consent")
    }
    
    // Récupérer le consentement
    consentJSON, err := ctx.GetStub().GetState(consentID)
    if err != nil {
        return fmt.Errorf("failed to read consent: %v", err)
    }
    if consentJSON == nil {
        return fmt.Errorf("consent %s does not exist", consentID)
    }
    
    var consent Consent
    err = json.Unmarshal(consentJSON, &consent)
    if err != nil {
        return err
    }
    
    // Vérifier que le consentement appartient au patient
    if consent.PatientID != patientID {
        return fmt.Errorf("access denied: this consent does not belong to you")
    }
    
    // Révoquer le consentement
    consent.Status = "REVOKED"
    consent.RevokedDate = time.Now().Format(time.RFC3339)
    
    consentJSON, err = json.Marshal(consent)
    if err != nil {
        return err
    }
    
    return ctx.GetStub().PutState(consentID, consentJSON)
}
```

---

## 📝 Résumé des Commandes

### Déployer les Chaincodes
```powershell
cd c:\Users\amani\Desktop\MedInsight\fabric-network
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-chaincode.ps1
```

### Enregistrer les Identités Patient
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-patient-identities.ps1
```

### Construire et Démarrer le Service Patient
```powershell
cd c:\Users\amani\Desktop\MedInsight\MedInsight-Microservices\patient-service
mvn clean package
cd ..
docker-compose up -d patient-service
```

### Tester le Service Patient
```bash
# Obtenir un token Keycloak
curl -X POST http://localhost:8080/realms/medinsight/protocol/openid-connect/token \
  -d "client_id=patient-service" \
  -d "client_secret=your-secret" \
  -d "grant_type=password" \
  -d "username=patient1" \
  -d "password=password"

# Récupérer mes dossiers
curl -X GET http://localhost:8084/api/patient/records \
  -H "Authorization: Bearer <token>"

# Accorder un consentement
curl -X POST http://localhost:8084/api/patient/consents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"DOC001","purpose":"Consultation"}'
```

---

## ✅ Checklist Finale

- [ ] Chaincodes déployés avec PatientOrg
- [ ] Identités applicatives enregistrées pour PatientOrg
- [ ] Service patient créé et configuré
- [ ] Contrôles d'accès implémentés dans les chaincodes
- [ ] Tests d'intégration réussis
- [ ] Documentation mise à jour

---

**Auteur** : Guide d'intégration PatientOrg  
**Date** : 2026-01-10  
**Version** : 1.0
