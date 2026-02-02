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
                "ROLE_PHARMACIEN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        if (!UserContext.getCurrent().hasAnyRole("ordonnance:read", "ROLE_MEDECIN", "ROLE_INFIRMIER",
                "ROLE_PHARMACIEN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findById(id).orElse(null));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<?> getByDossierId(@PathVariable String dossierId) {
        if (!UserContext.getCurrent().hasAnyRole("ordonnance:read", "ROLE_MEDECIN", "ROLE_INFIRMIER",
                "ROLE_PHARMACIEN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role ordonnance:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findByDossierId(dossierId));
    }
}
