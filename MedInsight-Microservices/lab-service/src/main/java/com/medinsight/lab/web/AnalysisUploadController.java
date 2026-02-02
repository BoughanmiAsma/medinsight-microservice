package com.medinsight.lab.web;

import com.medinsight.lab.domain.AnalysisReport;
import com.medinsight.lab.event.KafkaProducerService;
import com.medinsight.lab.repository.AnalysisReportRepository;
import com.medinsight.lab.security.UserContext;
import com.medinsight.lab.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/lab")
@RequiredArgsConstructor
public class AnalysisUploadController {

    private final FileStorageService fileStorageService;
    private final AnalysisReportRepository analysisReportRepository;
    private final KafkaProducerService kafkaProducerService;

    @Value("${file.download-base-url:http://localhost:8200/lab/files/}")
    private String downloadBaseUrl;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
            @RequestParam("dossierId") String dossierId) {

        if (!UserContext.getCurrent().hasRole("lab:write")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Required role lab:write");
        }

        String fileName = fileStorageService.storeFile(file);

        String fileDownloadUri = downloadBaseUrl + fileName;

        AnalysisReport report = new AnalysisReport();
        report.setDossierId(dossierId);
        report.setFileName(file.getOriginalFilename());
        report.setFileUrl(fileDownloadUri);
        report.setUploadedAt(LocalDateTime.now());

        analysisReportRepository.save(report);

        // Notify Dossier Service via Kafka
        Map<String, String> event = Map.of(
                "dossierId", dossierId,
                "fileName", report.getFileName(),
                "fileUrl", report.getFileUrl(),
                "status", "COMPLETED");
        kafkaProducerService.sendAnalysisCompleted("analysis.completed", event);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.loadFile(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
