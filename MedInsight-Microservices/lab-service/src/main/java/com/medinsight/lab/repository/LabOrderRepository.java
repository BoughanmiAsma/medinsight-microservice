package com.medinsight.lab.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medinsight.lab.domain.LabOrder;

public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {
}
