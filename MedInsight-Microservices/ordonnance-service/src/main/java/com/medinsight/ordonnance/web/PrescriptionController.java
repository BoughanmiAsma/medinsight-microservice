package com.medinsight.ordonnance.web;

import org.springframework.web.bind.annotation.*;
import com.medinsight.ordonnance.domain.Prescription;
import com.medinsight.ordonnance.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import java.util.List;

import com.medinsight.ordonnance.security.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionRepository repo;

    @GetMapping
    public ResponseEntity<?> getAll() {
        if (!UserContext.getCurrent().hasAnyRole("ordonnance:read", "ROLE_MEDECIN", "ROLE_INFIRMIER",
                "ROLE_PHARMACIE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        if (!UserContext.getCurrent().hasAnyRole("ordonnance:read", "ROLE_MEDECIN", "ROLE_INFIRMIER",
                "ROLE_PHARMACIE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findById(id).orElse(null));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<?> getByDossierId(@PathVariable String dossierId) {
        if (!UserContext.getCurrent().hasAnyRole("ordonnance:read", "ROLE_MEDECIN", "ROLE_INFIRMIER",
                "ROLE_PHARMACIE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findByDossierId(dossierId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        if (!UserContext.getCurrent().hasAnyRole("ROLE_PHARMACIE", "ROLE_ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role PHARMACIE");
        }
        
        return repo.findById(id).map(prescription -> {
            String newStatus = body.get("status");
            if (newStatus != null) {
                prescription.setStatus(newStatus);
                repo.save(prescription);
                return ResponseEntity.ok(prescription);
            }
            return ResponseEntity.badRequest().body("Status is required");
        }).orElse(ResponseEntity.notFound().build());
    }
}
