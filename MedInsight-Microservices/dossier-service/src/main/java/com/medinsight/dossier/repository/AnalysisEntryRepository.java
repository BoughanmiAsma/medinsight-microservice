package com.medinsight.dossier.repository;

import com.medinsight.dossier.domain.AnalysisEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisEntryRepository extends JpaRepository<AnalysisEntry, Long> {
    List<AnalysisEntry> findByDossierId(String dossierId);
}
