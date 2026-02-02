package com.medinsight.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String type;
    private String specialite;
}
