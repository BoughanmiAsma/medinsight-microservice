package com.medinsight.staff.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_id", unique = true)
    private String keycloakId; // <- nouvel attribut

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(nullable = false)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Column(nullable = false)
    private String telephone;

    @NotNull(message = "Le type de staff est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffType type;

    @Column(nullable = false)
    private String specialite;

    @Column(name = "numero_licence", unique = true)
    private String numeroLicence;

    @NotNull(message = "Le statut est obligatoire")
    @Column(nullable = false)
    private Boolean actif = true;

    @Column(name = "date_embauche", nullable = false)
    private LocalDateTime dateEmbauche;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        dateEmbauche = dateEmbauche != null ? dateEmbauche : LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
