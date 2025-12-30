package com.medinsight.ordonnance.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medinsight.ordonnance.domain.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
}
