package com.medinsight.lab.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medinsight.lab.domain.LabOrder;

import java.util.List;

public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {
    List<LabOrder> findByDossierId(String dossierId);
}
