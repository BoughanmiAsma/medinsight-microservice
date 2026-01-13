package com.medinsight.dossier.web;

import org.springframework.web.bind.annotation.*;
import com.medinsight.dossier.domain.Consultation;
import com.medinsight.dossier.domain.Dossier;
import com.medinsight.dossier.repository.DossierRepository;
import com.medinsight.dossier.repository.ConsultationRepository;
import com.medinsight.dossier.event.KafkaProducerService;
import com.medinsight.dossier.repository.AnalysisEntryRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

import java.util.UUID;
import java.util.Map;

import com.medinsight.dossier.security.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/dossiers")
@RequiredArgsConstructor
public class DossierController {

    private final DossierRepository repo;
    private final ConsultationRepository consultationRepository;
    private final AnalysisEntryRepository analysisEntryRepository;
    private final KafkaProducerService producerService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:read");
        }
        return ResponseEntity.ok(repo.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Dossier dossier) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:write");
        }
        if (dossier.getId() == null) {
            dossier.setId(UUID.randomUUID().toString());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(dossier));
    }

    // Trigger Lab Order
    @PostMapping("/{dossierId}/consultations/{consultationId}/lab-orders")
    public ResponseEntity<?> requestLabOrder(@PathVariable String dossierId, @PathVariable String consultationId,
            @RequestBody Map<String, String> body) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:write");
        }
        // Construct event payload
        Map<String, String> event = Map.of(
                "dossierId", dossierId,
                "consultationId", consultationId,
                "testCode", body.getOrDefault("testCode", "UNKNOWN"));

        producerService.sendLabRequest("lab.requests", event);
        return ResponseEntity.ok("Lab Order Requested");
    }

    // Trigger Prescription
    @PostMapping("/{dossierId}/consultations/{consultationId}/prescriptions")
    public ResponseEntity<?> requestPrescription(@PathVariable String dossierId, @PathVariable String consultationId,
            @RequestBody Map<String, String> body) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:write");
        }
        // Construct event payload
        Map<String, String> event = Map.of(
                "dossierId", dossierId,
                "consultationId", consultationId,
                "medicationDetails", body.getOrDefault("medicationDetails", "Paracetamol"));

        producerService.sendPrescriptionRequest("prescription.requests", event);
        return ResponseEntity.ok("Prescription Requested");
    }

    @GetMapping("/{dossierId}/analyses")
    public ResponseEntity<?> getAnalyses(@PathVariable String dossierId) {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:read");
        }
        return ResponseEntity.ok(analysisEntryRepository.findByDossierId(dossierId));
    }

    // --- New Consultation Methods ---

    @PostMapping("/{dossierId}/consultations")
    public ResponseEntity<?> createConsultation(@PathVariable String dossierId, @RequestBody Consultation consultation) {
        if (!UserContext.getCurrent().hasRole("dossier:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:write");
        }
        consultation.setId(UUID.randomUUID().toString());
        consultation.setDossierId(dossierId);
        if (consultation.getConsultationDate() == null) {
            consultation.setConsultationDate(LocalDateTime.now());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(consultationRepository.save(consultation));
    }

    @GetMapping("/{dossierId}/consultations")
    public ResponseEntity<?> getConsultationsByDossier(@PathVariable String dossierId) {
        if (!UserContext.getCurrent().hasRole("dossier:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role dossier:read");
        }
        return ResponseEntity.ok(consultationRepository.findByDossierId(dossierId));
    }
}
