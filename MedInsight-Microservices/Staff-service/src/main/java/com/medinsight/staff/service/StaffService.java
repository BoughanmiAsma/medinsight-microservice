package com.medinsight.staff.service;

import com.medinsight.staff.dto.StaffDTO;
import com.medinsight.staff.entities.Staff;
import com.medinsight.staff.exception.ResourceNotFoundException;
import com.medinsight.staff.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StaffService {

    private final StaffRepository staffRepository;
    private final KeycloakUserService keycloakUserService;

    private StaffDTO toDTO(Staff staff) {
        return StaffDTO.builder()
                .id(staff.getId())
                .nom(staff.getNom())
                .prenom(staff.getPrenom())
                .email(staff.getEmail())
                .telephone(staff.getTelephone())
                .type(staff.getType())
                .specialite(staff.getSpecialite())
                .numeroLicence(staff.getNumeroLicence())
                .actif(staff.getActif())
                .dateEmbauche(staff.getDateEmbauche())
                .createdAt(staff.getCreatedAt())
                .updatedAt(staff.getUpdatedAt())
                .build();
    }

    private Staff toEntity(StaffDTO dto) {
        return Staff.builder()
                .id(dto.getId())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .type(dto.getType())
                .specialite(dto.getSpecialite())
                .numeroLicence(dto.getNumeroLicence())
                .actif(dto.getActif())
                .dateEmbauche(dto.getDateEmbauche())
                .build();
    }

    public StaffDTO createStaff(StaffDTO staffDTO) {
        log.info("Création d'un nouveau staff: {}", staffDTO.getEmail());

        if (staffRepository.findByEmail(staffDTO.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Un staff avec cet email existe déjà");
        }

        Staff staff = toEntity(staffDTO);
        Staff savedStaff = staffRepository.save(staff);
        log.info("Staff créé avec succès: {}", savedStaff.getId());

        String generatedPassword = generateRandomPassword();
        String kcId = keycloakUserService.createUser(savedStaff.getEmail(), savedStaff.getEmail(),
                savedStaff.getPrenom(), savedStaff.getNom(), generatedPassword);

        String roleKeycloak;
        switch (staffDTO.getType()) {
            case MEDECIN -> roleKeycloak = "ROLE_MEDECIN";
            case SECRETAIRE -> roleKeycloak = "ROLE_SECRETAIRE";
            case INFIRMIER -> roleKeycloak = "ROLE_INFIRMIER";
            case TECHNICIEN -> roleKeycloak = "ROLE_TECHNICIEN";
            case AIDE_SOIGNANT -> roleKeycloak = "ROLE_AIDE_SOIGNANT";
            case LABORATOIRE -> roleKeycloak = "ROLE_LABORATOIRE";
            case PHARMACIE -> roleKeycloak = "ROLE_PHARMACIEN";
            default -> throw new IllegalArgumentException("Type de staff inconnu");
        }

        keycloakUserService.assignRealmRoleToUser(kcId, roleKeycloak);

        savedStaff.setKeycloakId(kcId);
        staffRepository.save(savedStaff);

        StaffDTO outDto = toDTO(savedStaff);
        outDto.setKeycloakId(kcId);

        return outDto;
    }

    private String generateRandomPassword() {
        return "Passw0rd!" + System.currentTimeMillis() % 10000;
    }

    @Transactional(readOnly = true)
    public List<StaffDTO> getAllStaff() {
        log.info("Récupération de tous les staffs");
        return staffRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffDTO getStaffById(Long id) {
        log.info("Récupération du staff avec ID: {}", id);
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Staff non trouvé avec l'ID: " + id));
        return toDTO(staff);
    }

    public StaffDTO updateStaff(Long id, StaffDTO staffDTO) {
        log.info("Modification du staff avec ID: {}", id);

        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Staff non trouvé avec l'ID: " + id));

        staff.setNom(staffDTO.getNom());
        staff.setPrenom(staffDTO.getPrenom());
        staff.setTelephone(staffDTO.getTelephone());
        staff.setType(staffDTO.getType());
        staff.setSpecialite(staffDTO.getSpecialite()); // Correction typo potential here if specialite is a method or
                                                       // field
        staff.setNumeroLicence(staffDTO.getNumeroLicence());
        staff.setActif(staffDTO.getActif());

        Staff updatedStaff = staffRepository.save(staff);
        log.info("Staff modifié avec succès: {}", updatedStaff.getId());

        // Sync with Keycloak if keycloakId exists
        if (updatedStaff.getKeycloakId() != null) {
            try {
                keycloakUserService.updateUser(updatedStaff.getKeycloakId(), updatedStaff.getPrenom(),
                        updatedStaff.getNom());
            } catch (Exception e) {
                log.error("Erreur lors de la mise à jour Keycloak pour {}: {}", updatedStaff.getKeycloakId(),
                        e.getMessage());
            }
        }

        return toDTO(updatedStaff);
    }

    public void deleteStaff(Long id) {
        log.info("Suppression du staff avec ID: {}", id);

        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Staff non trouvé avec l'ID: " + id));

        staffRepository.delete(staff);
        log.info("Staff supprimé avec succès: {}", id);
    }

    @Transactional(readOnly = true)
    public List<StaffDTO> getActiveStaff() {
        log.info("Récupération des staffs actifs");
        return staffRepository.findByActif(true)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
