-- V1__init.sql
-- Migration initiale: Création des tables pour le microservice Staff Service

-- Créer la base de données (optionnel si déjà créée)
-- CREATE DATABASE IF NOT EXISTS Staff_service;
-- USE Staff_service;

-- =============================================
-- Table: staff
-- Description: Stocke les informations du personnel hospitalier
-- =============================================
CREATE TABLE IF NOT EXISTS staff (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(20) NOT NULL,
    type ENUM('MEDECIN', 'SECRETAIRE', 'INFIRMIER', 'TECHNICIEN', 'AIDE_SOIGNANT') NOT NULL,
    specialite VARCHAR(100) NOT NULL,
    numero_licence VARCHAR(50) UNIQUE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_embauche DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes pour les performances
    INDEX idx_email (email),
    INDEX idx_type (type),
    INDEX idx_actif (actif),
    INDEX idx_numero_licence (numero_licence),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: audit_log (optionnel - pour tracer les modifications)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         staff_id BIGINT NOT NULL,
                                         action VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE',
    details JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    INDEX idx_staff_id (staff_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Données d'exemple (optionnel)
-- =============================================
INSERT INTO staff (nom, prenom, email, telephone, type, specialite, numero_licence, actif, date_embauche)
VALUES
    ('Dupont', 'Jean', 'jean.dupont@hospital.com', '0612345678', 'MEDECIN', 'Cardiologie', 'MED12345', TRUE, NOW()),
    ('Martin', 'Marie', 'marie.martin@hospital.com', '0687654321', 'SECRETAIRE', 'Secrétariat', NULL, TRUE, NOW()),
    ('Lemoine', 'Pierre', 'pierre.lemoine@hospital.com', '0698765432', 'INFIRMIER', 'Soins généraux', 'INF54321', TRUE, NOW());