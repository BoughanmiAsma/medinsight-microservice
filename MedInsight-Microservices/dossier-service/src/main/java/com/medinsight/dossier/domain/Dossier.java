package com.medinsight.dossier.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import jakarta.persistence.ElementCollection;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Dossier {
    @Id
    private String id;
    private String patientId;

    private String nom;
    private String prenom;
    private String dateNaissance;
    private String sexe;
    private String telephone;
    private String email;
    private String adresse;
    private String numeroSecuriteSociale;
    private String groupeSanguin;

    @ElementCollection
    private List<String> allergies;

    @ElementCollection
    private List<String> antecedents;

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @jakarta.persistence.PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
