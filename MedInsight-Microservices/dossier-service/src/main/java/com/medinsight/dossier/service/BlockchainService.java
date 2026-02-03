package com.medinsight.dossier.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinsight.dossier.domain.Consultation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.gateway.*;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BlockchainService {

    private final Contract contract;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean recordConsultation(Consultation consultation) {
        if (contract == null) {
            log.warn("Blockchain contract not initialized. Consultation {} will not be recorded on blockchain.",
                    consultation.getId());
            return false;
        }

        try {
            log.info("Recording consultation {} on blockchain", consultation.getId());
            contract.submitTransaction("CreateRecord",
                    consultation.getId(),
                    consultation.getDossierId(),
                    (consultation.getDoctorLastName() != null ? consultation.getDoctorLastName() : "") + " " +
                            (consultation.getDoctorFirstName() != null ? consultation.getDoctorFirstName() : ""),
                    consultation.getDiagnosis() != null ? consultation.getDiagnosis() : "",
                    "", // treatment
                    "[]", // medications
                    "", // labResults
                    consultation.getObservations() != null ? consultation.getObservations() : "");
            log.info("Consultation {} successfully recorded on blockchain", consultation.getId());
            return true;
        } catch (Exception e) {
            log.error("Error submitting transaction to blockchain: {}", e.getMessage(), e);
            return false;
        }
    }

    public List<Consultation> getConsultations(String dossierId) {
        if (contract == null) {
            log.warn("Blockchain contract not initialized. Cannot fetch consultations.");
            return new ArrayList<>();
        }

        try {
            log.info("Fetching all consultations from blockchain for filtering (LevelDB Workaround)");
            byte[] result = contract.evaluateTransaction("GetAllRecords");
            String jsonResult = new String(result, StandardCharsets.UTF_8);

            List<Consultation> consultations = new ArrayList<>();
            List<MedicalRecordDTO> records = objectMapper.readValue(jsonResult,
                    new TypeReference<List<MedicalRecordDTO>>() {
                    });

            log.info("Filtering {} total records for dossierId: {}", records.size(), dossierId);
            for (MedicalRecordDTO record : records) {
                if (dossierId.equals(record.patientId)) {
                    Consultation c = new Consultation();
                    c.setId(record.getRecordId());
                    c.setDossierId(record.getPatientId());
                    c.setDiagnosis(record.getDiagnosis());
                    c.setObservations(record.getNotes());
                    c.setDoctorLastName(record.getDoctorId());
                    c.setDoctorFirstName("");
                    consultations.add(c);
                }
            }
            log.info("Found {} matching consultations for dossierId: {}", consultations.size(), dossierId);
            return consultations;
        } catch (Exception e) {
            log.error("Error fetching consultations from blockchain: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    // DTO matches Chaincode
    private static class MedicalRecordDTO {
        private String recordId;
        private String patientId;
        private String doctorId;
        private String diagnosis;
        private String treatment;
        private List<String> medications;
        private String labResults;
        private String notes;
        private String createdAt;
        private String updatedAt;
        private String createdBy;

        // Getters and Setters
        public String getRecordId() {
            return recordId;
        }

        public void setRecordId(String recordId) {
            this.recordId = recordId;
        }

        public String getPatientId() {
            return patientId;
        }

        public void setPatientId(String patientId) {
            this.patientId = patientId;
        }

        public String getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(String doctorId) {
            this.doctorId = doctorId;
        }

        public String getDiagnosis() {
            return diagnosis;
        }

        public void setDiagnosis(String diagnosis) {
            this.diagnosis = diagnosis;
        }

        public String getTreatment() {
            return treatment;
        }

        public void setTreatment(String treatment) {
            this.treatment = treatment;
        }

        public List<String> getMedications() {
            return medications;
        }

        public void setMedications(List<String> medications) {
            this.medications = medications;
        }

        public String getLabResults() {
            return labResults;
        }

        public void setLabResults(String labResults) {
            this.labResults = labResults;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(String updatedAt) {
            this.updatedAt = updatedAt;
        }

        public String getCreatedBy() {
            return createdBy;
        }

        public void setCreatedBy(String createdBy) {
            this.createdBy = createdBy;
        }
    }
}
