package com.medinsight.dossier.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Consultation {
    @Id
    private String id;
    private String dossierId;
    private String doctorLastName;
    private String doctorFirstName;

    @Column(columnDefinition = "TEXT")
    private String reason; // Motif

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    private String recommendations;
    private LocalDateTime consultationDate;
}
