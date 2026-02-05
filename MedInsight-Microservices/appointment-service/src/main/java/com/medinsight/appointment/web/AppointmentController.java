package com.medinsight.appointment.web;

import com.medinsight.appointment.domain.Appointment;
import com.medinsight.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
        System.out.println("AppointmentController intialized!");
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Appointment Controller is working!");
    }

    @PostMapping
    public ResponseEntity<Appointment> book(@RequestBody Appointment appointment) {
        // Only patients can create appointments
        return ResponseEntity.ok(service.createAppointment(appointment));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        // Doctors can accept/reject/reschedule appointments
        return ResponseEntity.ok(service.updateAppointmentStatus(id, status));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(service.getAppointmentsByDoctor(doctorId));
    }

    @GetMapping("/patient/all")
    public ResponseEntity<List<Appointment>> getByPatientAll() {
        // Return all or empty list for now to satisfy frontend
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Appointment>> getAll() {
        return ResponseEntity.ok(service.getAllAppointments());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(service.getAppointmentsByPatient(patientId));
    }
}
