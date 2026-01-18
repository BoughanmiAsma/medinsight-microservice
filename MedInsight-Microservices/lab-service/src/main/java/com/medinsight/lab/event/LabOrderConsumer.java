package com.medinsight.lab.event;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.lab.domain.LabOrder;
import com.medinsight.lab.repository.LabOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class LabOrderConsumer {

    private final LabOrderRepository labOrderRepository;
    private final ObjectMapper objectMapper;
    private final KafkaProducerService kafkaProducerService;

    @KafkaListener(topics = "lab.requests", groupId = "lab-group")
    public void consumeLabRequest(String message) {
        log.info("Received lab request: {}", message);
        try {
            // Simple deserialization - assuming message is JSON
            // In real app, use a DTO. Here mapping directly for simplicity if fields match,
            // or parsing manually.

            // For this demo, we'll create a dummy order or parse simple JSON
            // Assuming message: {"dossierId":"...", "consultationId":"...",
            // "testCode":"..."}

            LabOrder order = new LabOrder();
            // Basic parsing or use ObjectMapper if DTO existed.
            // Let's rely on ObjectMapper to map to a temporary map or class, or directly to
            // Entity if compatible.
            // Using a loose mapping for robustness in this restored version.
            var jsonNode = objectMapper.readTree(message);

            order.setDossierId(jsonNode.path("dossierId").asText());
            order.setConsultationId(jsonNode.path("consultationId").asText());
            order.setTestCode(jsonNode.path("testCode").asText());
            order.setStatus("PENDING");

            labOrderRepository.save(order);
            log.info("LabOrder saved: {}", order);

            // Send completion event to dossier-service
            java.util.Map<String, String> resultPayload = java.util.Map.of(
                    "dossierId", order.getDossierId(),
                    "fileName", "Analysis_" + order.getTestCode(),
                    "fileUrl", "http://lab-storage/" + order.getId());
            kafkaProducerService.sendAnalysisCompleted("analysis.completed", resultPayload);

        } catch (Exception e) {
            log.error("Error processing lab request", e);
        }
    }
}
