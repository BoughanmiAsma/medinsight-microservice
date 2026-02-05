package com.medinsight.appointment.service;

import com.medinsight.appointment.domain.Appointment;
import com.medinsight.appointment.domain.AppointmentStatus;
import com.medinsight.appointment.event.KafkaProducerService;
import com.medinsight.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import com.medinsight.appointment.client.StaffClient;
import com.medinsight.appointment.dto.StaffDTO;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository repository;
    private final KafkaProducerService kafkaProducerService;
    private final StaffClient staffClient;

    public Appointment createAppointment(Appointment appointment) {
        System.out.println("Tentative de création de rendez-vous pour le docteur ID: " + appointment.getDoctorId());
        // Validate doctor exists in Staff-service using Keycloak ID
        try {
            StaffDTO doctor = staffClient.getStaffByKeycloakId(appointment.getDoctorId());
            if (doctor == null) {
                String error = "Le médecin avec l'ID " + appointment.getDoctorId() + " n'existe pas dans la table staff.";
                System.err.println(error);
                throw new RuntimeException(error);
            }
            System.out.println("Docteur validé: " + doctor.getNom());
        } catch (Exception e) {
            String error = "Erreur de validation du médecin (ID: " + appointment.getDoctorId() + ") : " + e.getMessage();
            System.err.println(error);
            throw new RuntimeException(error);
        }

        appointment.setStatus(AppointmentStatus.PENDING);
        Appointment saved = repository.save(appointment);

        // Notify other services (e.g., Staff-service to block calendar)
        kafkaProducerService.sendAppointmentEvent("appointment.booked", saved);

        return saved;
    }

    public List<Appointment> getAppointmentsByDoctor(String doctorId) {
        return repository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAppointmentsByPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }

    public Appointment updateAppointmentStatus(Long id, String statusStr) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        AppointmentStatus status = AppointmentStatus.valueOf(statusStr.toUpperCase());
        appointment.setStatus(status);
        Appointment updated = repository.save(appointment);
        
        // Notify via Kafka
        kafkaProducerService.sendAppointmentEvent("appointment.status.updated", updated);
        
        return updated;
    }

    public List<Appointment> getAllAppointments() {
        return repository.findAll();
    }
}
