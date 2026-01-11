package com.medinsight.dossier.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.dossier.domain.AnalysisEntry;
import com.medinsight.dossier.repository.AnalysisEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalysisResultConsumer {

    private final AnalysisEntryRepository analysisEntryRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "analysis.completed", groupId = "dossier-group")
    public void consumeAnalysisResult(String message) {
        log.info("Received analysis result event: {}", message);
        try {
            Map<String, String> payload = objectMapper.readValue(message, Map.class);

            AnalysisEntry entry = new AnalysisEntry();
            entry.setDossierId(payload.get("dossierId"));
            entry.setFileName(payload.get("fileName"));
            entry.setFileUrl(payload.get("fileUrl"));
            entry.setReceivedAt(LocalDateTime.now());

            analysisEntryRepository.save(entry);
            log.info("Saved analysis entry for dossier: {}", entry.getDossierId());

        } catch (Exception e) {
            log.error("Error processing analysis result event", e);
        }
    }
}
