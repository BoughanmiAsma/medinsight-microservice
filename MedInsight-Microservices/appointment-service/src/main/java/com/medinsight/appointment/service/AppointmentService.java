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
        // Validate doctor exists in Staff-service
        StaffDTO doctor = staffClient.getStaffById(appointment.getDoctorId());
        if (doctor == null) {
            throw new RuntimeException("Doctor not found with ID: " + appointment.getDoctorId());
        }

        appointment.setStatus(AppointmentStatus.PENDING);
        Appointment saved = repository.save(appointment);

        // Notify other services (e.g., Staff-service to block calendar)
        kafkaProducerService.sendAppointmentEvent("appointment.booked", saved);

        return saved;
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return repository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAppointmentsByPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }
}
