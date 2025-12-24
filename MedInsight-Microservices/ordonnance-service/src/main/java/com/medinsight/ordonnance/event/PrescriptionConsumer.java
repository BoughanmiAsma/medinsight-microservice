package com.medinsight.ordonnance.event;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.ordonnance.domain.Prescription;
import com.medinsight.ordonnance.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class PrescriptionConsumer {

    private final PrescriptionRepository repo;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "prescription.requests", groupId = "ordonnance-group")
    public void consumePrescriptionRequest(String message) {
        log.info("Received prescription request: {}", message);
        try {
            // Assuming message: {"dossierId":"...", "consultationId":"...",
            // "medicationDetails":"..."}
            var jsonNode = objectMapper.readTree(message);

            Prescription p = new Prescription();
            p.setDossierId(jsonNode.path("dossierId").asText());
            p.setConsultationId(jsonNode.path("consultationId").asText());
            p.setMedicationDetails(jsonNode.path("medicationDetails").asText());
            p.setStatus("CREATED");

            repo.save(p);
            log.info("Prescription saved: {}", p);

        } catch (Exception e) {
            log.error("Error processing prescription request", e);
        }
    }
}
