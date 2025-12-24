package com.medinsight.dossier.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medinsight.dossier.domain.Dossier;

public interface DossierRepository extends JpaRepository<Dossier, String> {
}
