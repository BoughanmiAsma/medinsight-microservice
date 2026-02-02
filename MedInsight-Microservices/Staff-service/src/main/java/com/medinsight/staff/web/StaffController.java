package com.medinsight.staff.web;

import com.medinsight.staff.dto.StaffDTO;
import com.medinsight.staff.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final StaffService staffService;

    @PostMapping
    public ResponseEntity<?> createStaff(@Valid @RequestBody StaffDTO staffDTO) {
        log.info("Requête POST: Création d'un nouveau staff");
        if (!UserContext.getCurrent().hasRole("staff:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:write");
        }
        StaffDTO createdStaff = staffService.createStaff(staffDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStaff);
    }

    @GetMapping
    public ResponseEntity<?> getAllStaff() {
        log.info("Requête GET: Récupération de tous les staffs");
        if (!UserContext.getCurrent().hasRole("staff:read")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:read");
        }
        List<StaffDTO> staffs = staffService.getAllStaff();
        return ResponseEntity.ok(staffs);
    }

    @GetMapping("/actifs")
    public ResponseEntity<List<StaffDTO>> getActiveStaff() {
        log.info("Requête GET: Récupération des staffs actifs");
        List<StaffDTO> staffs = staffService.getActiveStaff();
        return ResponseEntity.ok(staffs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffDTO> getStaffById(@PathVariable Long id) {
        log.info("Requête GET: Récupération du staff avec ID: {}", id);
        StaffDTO staff = staffService.getStaffById(id);
        return ResponseEntity.ok(staff);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffDTO> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody StaffDTO staffDTO) {
        log.info("Requête PUT: Modification du staff avec ID: {}", id);
        StaffDTO updatedStaff = staffService.updateStaff(id, staffDTO);
        return ResponseEntity.ok(updatedStaff);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        log.info("Requête DELETE: Suppression du staff avec ID: {}", id);
        if (!UserContext.getCurrent().hasRole("staff:delete")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role staff:delete");
        }
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Staff Service is running!");
    }
}
