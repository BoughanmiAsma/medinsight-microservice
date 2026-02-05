package com.medinsight.lab.web;

import org.springframework.web.bind.annotation.*;
import com.medinsight.lab.domain.LabOrder;
import com.medinsight.lab.repository.LabOrderRepository;
import lombok.RequiredArgsConstructor;
import java.util.List;

import com.medinsight.lab.security.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/lab-orders")
@RequiredArgsConstructor
public class LabOrderController {

    private final LabOrderRepository repo;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String dossierId) {
        if (!UserContext.getCurrent().hasAnyRole("lab:read", "ROLE_MEDECIN", "ROLE_INFIRMIER", "ROLE_LABORATOIRE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role lab:read or Medical Staff");
        }
        if (dossierId != null) {
            return ResponseEntity.ok(repo.findByDossierId(dossierId));
        }
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        if (!UserContext.getCurrent().hasAnyRole("lab:read", "ROLE_MEDECIN", "ROLE_INFIRMIER", "ROLE_LABORATOIRE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: Required role lab:read or Medical Staff");
        }
        return ResponseEntity.ok(repo.findById(id).orElse(null));
    }
}
