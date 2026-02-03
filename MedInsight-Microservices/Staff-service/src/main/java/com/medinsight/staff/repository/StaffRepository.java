package com.medinsight.staff.repository;

import com.medinsight.staff.entities.Staff;
import com.medinsight.staff.entities.StaffType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByEmail(String email);

    List<Staff> findByType(StaffType type);

    List<Staff> findByActif(Boolean actif);
}
