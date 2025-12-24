package com.medinsight.dossier.event;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendLabRequest(String topic, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, json);
            log.info("Sent event to topic {}: {}", topic, json);
        } catch (Exception e) {
            log.error("Failed to send Kafka event", e);
        }
    }

    public void sendPrescriptionRequest(String topic, Object payload) {
        sendLabRequest(topic, payload); // Reusing logic
    }
}
