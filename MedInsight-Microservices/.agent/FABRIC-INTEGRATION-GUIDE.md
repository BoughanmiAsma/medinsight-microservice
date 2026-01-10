# Guide Pratique : Intégration Fabric dans les Microservices

## 📌 Objectif

Ce guide fournit des exemples de code **concrets et prêts à l'emploi** pour intégrer Hyperledger Fabric dans les microservices MedInsight.

---

## 1. Service Fabric Helper

Créez une classe utilitaire pour gérer les interactions Fabric :

### `FabricService.java`

```java
package com.medinsight.dossier.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.gateway.Contract;
import org.hyperledger.fabric.gateway.ContractException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
@Slf4j
public class FabricService {
    
    private final Contract contract;
    private final ObjectMapper objectMapper;
    
    /**
     * Soumet une transaction au chaincode (modifie l'état)
     */
    public <T> T submitTransaction(String functionName, Class<T> responseType, String... args) 
            throws FabricException {
        try {
            log.info("Submitting transaction: {} with args: {}", functionName, args);
            
            byte[] result = contract.submitTransaction(functionName, args);
            
            if (result == null || result.length == 0) {
                return null;
            }
            
            String jsonResult = new String(result, StandardCharsets.UTF_8);
            log.debug("Transaction result: {}", jsonResult);
            
            return objectMapper.readValue(jsonResult, responseType);
            
        } catch (TimeoutException e) {
            log.error("Fabric transaction timeout for function: {}", functionName, e);
            throw new FabricException("Transaction timeout", e);
        } catch (ContractException e) {
            log.error("Chaincode error for function {}: {}", functionName, e.getMessage(), e);
            throw new FabricException("Chaincode error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during transaction: {}", functionName, e);
            throw new FabricException("Fabric network error", e);
        }
    }
    
    /**
     * Évalue une transaction (lecture seule, pas de modification)
     */
    public <T> T evaluateTransaction(String functionName, Class<T> responseType, String... args) 
            throws FabricException {
        try {
            log.info("Evaluating transaction: {} with args: {}", functionName, args);
            
            byte[] result = contract.evaluateTransaction(functionName, args);
            
            if (result == null || result.length == 0) {
                return null;
            }
            
            String jsonResult = new String(result, StandardCharsets.UTF_8);
            log.debug("Evaluation result: {}", jsonResult);
            
            return objectMapper.readValue(jsonResult, responseType);
            
        } catch (ContractException e) {
            log.error("Chaincode error for function {}: {}", functionName, e.getMessage(), e);
            throw new FabricException("Chaincode error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during evaluation: {}", functionName, e);
            throw new FabricException("Fabric network error", e);
        }
    }
    
    /**
     * Soumet une transaction sans attendre de résultat
     */
    public void submitTransactionAsync(String functionName, String... args) {
        try {
            contract.submitTransaction(functionName, args);
            log.info("Async transaction submitted: {}", functionName);
        } catch (Exception e) {
            log.error("Error submitting async transaction: {}", functionName, e);
        }
    }
}
```

### `FabricException.java`

```java
package com.medinsight.dossier.service;

public class FabricException extends Exception {
    public FabricException(String message) {
        super(message);
    }
    
    public FabricException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

---

## 2. Modèles de Données

### `MedicalRecord.java`

```java
package com.medinsight.dossier.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {
    
    @JsonProperty("recordId")
    private String recordId;
    
    @JsonProperty("patientId")
    private String patientId;
    
    @JsonProperty("doctorId")
    private String doctorId;
    
    @JsonProperty("diagnosis")
    private String diagnosis;
    
    @JsonProperty("treatment")
    private String treatment;
    
    @JsonProperty("medications")
    private List<String> medications;
    
    @JsonProperty("labResults")
    private String labResults;
    
    @JsonProperty("notes")
    private String notes;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
    
    @JsonProperty("createdBy")
    private String createdBy;
}
```

---

## 3. Contrôleur Amélioré

### `DossierController.java` (Version avec Fabric)

```java
package com.medinsight.dossier.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.dossier.domain.Dossier;
import com.medinsight.dossier.event.KafkaProducerService;
import com.medinsight.dossier.model.MedicalRecord;
import com.medinsight.dossier.repository.DossierRepository;
import com.medinsight.dossier.security.UserContext;
import com.medinsight.dossier.service.FabricException;
import com.medinsight.dossier.service.FabricService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dossiers")
@RequiredArgsConstructor
@Slf4j
public class DossierController {

    private final DossierRepository repo;
    private final FabricService fabricService;
    private final KafkaProducerService producerService;
    private final ObjectMapper objectMapper;

    /**
     * Récupère tous les dossiers (depuis PostgreSQL pour les métadonnées)
     */
    @GetMapping
    public ResponseEntity<?> getAll() {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:read");
        }
        return ResponseEntity.ok(repo.findAll());
    }

    /**
     * Récupère un dossier spécifique (depuis Fabric pour la source de vérité)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:read");
        }

        try {
            // Lire depuis Fabric (source de vérité)
            MedicalRecord record = fabricService.evaluateTransaction(
                "ReadRecord",
                MedicalRecord.class,
                id
            );
            
            return ResponseEntity.ok(record);
            
        } catch (FabricException e) {
            log.error("Failed to read record from Fabric: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Record not found: " + e.getMessage());
        }
    }

    /**
     * Crée un nouveau dossier (dans PostgreSQL ET Fabric)
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Dossier dossier) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:write");
        }

        // 1. Générer un ID unique
        if (dossier.getId() == null) {
            dossier.setId(UUID.randomUUID().toString());
        }

        // 2. Sauvegarder les métadonnées dans PostgreSQL
        Dossier saved = repo.save(dossier);
        log.info("Saved dossier metadata to PostgreSQL: {}", saved.getId());

        // 3. Enregistrer dans Fabric Blockchain
        try {
            String medicationsJson = objectMapper.writeValueAsString(
                dossier.getMedications() != null ? dossier.getMedications() : List.of()
            );
            
            fabricService.submitTransaction(
                "CreateRecord",
                Void.class,
                saved.getId(),
                saved.getPatientId(),
                saved.getDoctorId(),
                saved.getDiagnosis() != null ? saved.getDiagnosis() : "",
                saved.getTreatment() != null ? saved.getTreatment() : "",
                medicationsJson,
                saved.getLabResults() != null ? saved.getLabResults() : "",
                saved.getNotes() != null ? saved.getNotes() : ""
            );
            
            log.info("Recorded dossier in Fabric blockchain: {}", saved.getId());
            
        } catch (FabricException | JsonProcessingException e) {
            log.error("Failed to record in Fabric, rolling back PostgreSQL transaction", e);
            // Le @Transactional va automatiquement rollback PostgreSQL
            throw new RuntimeException("Failed to record in blockchain: " + e.getMessage(), e);
        }

        // 4. Publier un événement Kafka
        try {
            producerService.sendDossierCreated("dossier.created", saved);
            log.info("Published Kafka event for dossier: {}", saved.getId());
        } catch (Exception e) {
            log.warn("Failed to publish Kafka event, but dossier was created", e);
            // Ne pas échouer la requête si Kafka est down
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Met à jour un dossier existant
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Dossier dossier) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:write");
        }

        // 1. Vérifier que le dossier existe
        if (!repo.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Dossier not found: " + id);
        }

        // 2. Mettre à jour PostgreSQL
        dossier.setId(id);
        Dossier updated = repo.save(dossier);

        // 3. Mettre à jour Fabric
        try {
            String medicationsJson = objectMapper.writeValueAsString(
                dossier.getMedications() != null ? dossier.getMedications() : List.of()
            );
            
            fabricService.submitTransaction(
                "UpdateRecord",
                Void.class,
                id,
                dossier.getDiagnosis() != null ? dossier.getDiagnosis() : "",
                dossier.getTreatment() != null ? dossier.getTreatment() : "",
                medicationsJson,
                dossier.getLabResults() != null ? dossier.getLabResults() : "",
                dossier.getNotes() != null ? dossier.getNotes() : ""
            );
            
            log.info("Updated dossier in Fabric: {}", id);
            
        } catch (FabricException | JsonProcessingException e) {
            log.error("Failed to update in Fabric", e);
            throw new RuntimeException("Failed to update in blockchain: " + e.getMessage(), e);
        }

        return ResponseEntity.ok(updated);
    }

    /**
     * Récupère tous les dossiers d'un patient (depuis Fabric)
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getByPatientId(@PathVariable String patientId) {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:read");
        }

        try {
            // Query Fabric pour tous les dossiers du patient
            MedicalRecord[] records = fabricService.evaluateTransaction(
                "QueryRecordsByPatient",
                MedicalRecord[].class,
                patientId
            );
            
            return ResponseEntity.ok(records);
            
        } catch (FabricException e) {
            log.error("Failed to query records from Fabric for patient: {}", patientId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to query records: " + e.getMessage());
        }
    }

    /**
     * Demande une analyse de laboratoire
     */
    @PostMapping("/{dossierId}/consultations/{consultationId}/lab-orders")
    public ResponseEntity<?> requestLabOrder(
            @PathVariable String dossierId,
            @PathVariable String consultationId,
            @RequestBody Map<String, String> body) {
        
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:write");
        }

        Map<String, String> event = Map.of(
            "dossierId", dossierId,
            "consultationId", consultationId,
            "testCode", body.getOrDefault("testCode", "UNKNOWN")
        );

        producerService.sendLabRequest("lab.requests", event);
        return ResponseEntity.ok("Lab Order Requested");
    }

    /**
     * Demande une prescription
     */
    @PostMapping("/{dossierId}/consultations/{consultationId}/prescriptions")
    public ResponseEntity<?> requestPrescription(
            @PathVariable String dossierId,
            @PathVariable String consultationId,
            @RequestBody Map<String, String> body) {
        
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access Denied: Required role dossier:write");
        }

        Map<String, String> event = Map.of(
            "dossierId", dossierId,
            "consultationId", consultationId,
            "medicationDetails", body.getOrDefault("medicationDetails", "Paracetamol")
        );

        producerService.sendPrescriptionRequest("prescription.requests", event);
        return ResponseEntity.ok("Prescription Requested");
    }
}
```

---

## 4. Configuration Complète

### `application.properties`

```properties
# Server
server.port=8080
spring.application.name=dossier-service

# Database (PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5434/medinsight_platform
spring.datasource.username=admin
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false

# Kafka
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer

# Keycloak
keycloak.server-url=http://localhost:8180
keycloak.realm=microservices-realm
keycloak.client-id=dossier-service
keycloak.client-secret=dossier-service-secret-2024

# Hyperledger Fabric
fabric.walletPath=wallet
fabric.connectionProfile=connection-doctor.json
fabric.userName=dossierAppUser
fabric.channelName=recordschannel
fabric.contractName=medical-records

# Logging
logging.level.com.medinsight=DEBUG
logging.level.org.hyperledger.fabric=INFO
```

---

## 5. Tests Unitaires

### `FabricServiceTest.java`

```java
package com.medinsight.dossier.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.dossier.model.MedicalRecord;
import org.hyperledger.fabric.gateway.Contract;
import org.hyperledger.fabric.gateway.ContractException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FabricServiceTest {

    @Mock
    private Contract contract;

    private FabricService fabricService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        fabricService = new FabricService(contract, objectMapper);
    }

    @Test
    void testSubmitTransaction_Success() throws Exception {
        // Given
        String recordJson = "{\"recordId\":\"REC001\",\"patientId\":\"PAT001\"}";
        byte[] result = recordJson.getBytes(StandardCharsets.UTF_8);
        
        when(contract.submitTransaction(any(), any()))
            .thenReturn(result);

        // When
        MedicalRecord record = fabricService.submitTransaction(
            "CreateRecord",
            MedicalRecord.class,
            "REC001", "PAT001"
        );

        // Then
        assertNotNull(record);
        assertEquals("REC001", record.getRecordId());
        assertEquals("PAT001", record.getPatientId());
        
        verify(contract, times(1)).submitTransaction("CreateRecord", "REC001", "PAT001");
    }

    @Test
    void testSubmitTransaction_Timeout() throws Exception {
        // Given
        when(contract.submitTransaction(any(), any()))
            .thenThrow(new TimeoutException("Transaction timeout"));

        // When & Then
        assertThrows(FabricException.class, () -> {
            fabricService.submitTransaction(
                "CreateRecord",
                MedicalRecord.class,
                "REC001"
            );
        });
    }

    @Test
    void testEvaluateTransaction_Success() throws Exception {
        // Given
        String recordJson = "{\"recordId\":\"REC001\",\"patientId\":\"PAT001\"}";
        byte[] result = recordJson.getBytes(StandardCharsets.UTF_8);
        
        when(contract.evaluateTransaction(any(), any()))
            .thenReturn(result);

        // When
        MedicalRecord record = fabricService.evaluateTransaction(
            "ReadRecord",
            MedicalRecord.class,
            "REC001"
        );

        // Then
        assertNotNull(record);
        assertEquals("REC001", record.getRecordId());
    }
}
```

---

## 6. Gestion des Erreurs Globale

### `GlobalExceptionHandler.java`

```java
package com.medinsight.dossier.exception;

import com.medinsight.dossier.service.FabricException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(FabricException.class)
    public ResponseEntity<?> handleFabricException(FabricException ex) {
        log.error("Fabric error occurred", ex);
        
        Map<String, Object> errorResponse = Map.of(
            "timestamp", LocalDateTime.now(),
            "error", "Blockchain Error",
            "message", ex.getMessage(),
            "status", HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        
        Map<String, Object> errorResponse = Map.of(
            "timestamp", LocalDateTime.now(),
            "error", "Internal Server Error",
            "message", ex.getMessage(),
            "status", HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse);
    }
}
```

---

## 7. Commandes de Test

### Créer un dossier

```bash
curl -X POST http://localhost:8083/api/dossiers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "PAT001",
    "doctorId": "DOC001",
    "diagnosis": "Hypertension",
    "treatment": "Medication and lifestyle changes",
    "medications": ["Lisinopril 10mg", "Amlodipine 5mg"],
    "labResults": "BP: 140/90 mmHg",
    "notes": "Patient advised to reduce salt intake"
  }'
```

### Lire un dossier

```bash
curl -X GET http://localhost:8083/api/dossiers/REC001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Lire tous les dossiers d'un patient

```bash
curl -X GET http://localhost:8083/api/dossiers/patient/PAT001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 8. Checklist d'Implémentation

- [ ] Créer `FabricService.java`
- [ ] Créer `FabricException.java`
- [ ] Créer `MedicalRecord.java`
- [ ] Mettre à jour `DossierController.java`
- [ ] Ajouter `GlobalExceptionHandler.java`
- [ ] Configurer `application.properties`
- [ ] Écrire les tests unitaires
- [ ] Tester avec Postman/curl
- [ ] Vérifier les logs Fabric
- [ ] Valider la persistance dans Fabric

---

**Prochaine étape** : Implémenter ce code dans votre projet !
