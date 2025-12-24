package com.medinsight.staff.controllers;

import com.medinsight.staff.DTO.StaffDTO;
import com.medinsight.staff.services.Staffservice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.medinsight.staff.security.UserContext;
import java.util.List;

@RestController
@RequestMapping("/staffs")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StaffController {
    @Autowired
    private final Staffservice staffService;

    // POST: Créer un nouveau staff
    @PostMapping
    public ResponseEntity<?> createStaff(@Valid @RequestBody StaffDTO staffDTO) {
        log.info("Requête POST: Création d'un nouveau staff");
        if (!UserContext.getCurrent().hasRole("staff:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:write");
        }
        StaffDTO createdStaff = staffService.createStaff(staffDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStaff);
    }

    // GET: Récupérer tous les staffs
    @GetMapping
    public ResponseEntity<?> getAllStaff() {
        log.info("Requête GET: Récupération de tous les staffs");
        if (!UserContext.getCurrent().hasRole("staff:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:read");
        }
        List<StaffDTO> staffs = staffService.getAllStaff();
        return ResponseEntity.ok(staffs);
    }

    // GET: Récupérer les staffs actifs
    @GetMapping("/actifs")
    public ResponseEntity<List<StaffDTO>> getActiveStaff() {
        log.info("Requête GET: Récupération des staffs actifs");
        List<StaffDTO> staffs = staffService.getActiveStaff();
        return ResponseEntity.ok(staffs);
    }

    // GET: Récupérer un staff par ID
    @GetMapping("/{id}")
    public ResponseEntity<StaffDTO> getStaffById(@PathVariable Long id) {
        log.info("Requête GET: Récupération du staff avec ID: {}", id);
        StaffDTO staff = staffService.getStaffById(id);
        return ResponseEntity.ok(staff);
    }

    // PUT: Modifier un staff
    @PutMapping("/{id}")
    public ResponseEntity<StaffDTO> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody StaffDTO staffDTO) {
        log.info("Requête PUT: Modification du staff avec ID: {}", id);
        StaffDTO updatedStaff = staffService.updateStaff(id, staffDTO);
        return ResponseEntity.ok(updatedStaff);
    }

    // DELETE: Supprimer un staff
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        log.info("Requête DELETE: Suppression du staff avec ID: {}", id);
        if (!UserContext.getCurrent().hasRole("staff:delete")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:delete");
        }
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Staff Service is running!");
    }
}
