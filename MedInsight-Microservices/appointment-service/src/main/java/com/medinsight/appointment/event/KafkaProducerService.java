package com.medinsight.appointment.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendAppointmentEvent(String topic, Object payload) {
        log.info("Sending appointment event to topic {}: {}", topic, payload);
        kafkaTemplate.send(topic, payload);
    }
}
