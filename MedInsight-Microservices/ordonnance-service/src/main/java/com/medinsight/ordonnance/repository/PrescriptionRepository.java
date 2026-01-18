package com.medinsight.ordonnance.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medinsight.ordonnance.domain.Prescription;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByDossierId(String dossierId);
}
