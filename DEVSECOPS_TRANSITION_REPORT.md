# Rapport Complet de l'Architecture DevSecOps & Infrastructure

**Date :** 31 Janvier 2026
**Livrables :** Pipeline DevSecOps Complet & Initialisation Terraform

Ce rapport détaille l'état actuel du pipeline CI/CD du projet MedInsight, intégrant désormais l'ensemble des pratiques de sécurité (DevSecOps) ainsi que la gestion automatisée de l'infrastructure (IaC).

## 1. Pipeline DevSecOps : Vue d'Ensemble

Le pipeline a été sécurisé selon l'approche "Shift Left" (sécurité intégrée à chaque étape) et couvre désormais 6 niveaux de contrôle.

### 🔒 Phase 1 : Protection du Code Source
1.  **Secret Scanning (Nouveau)**
    *   **Outil :** TruffleHog.
    *   **Action :** Scanne l'historique Git et les commits entrants.
    *   **Objectif :** Détecter et bloquer tout secret (API Keys, Passwords, Certificats) avant qu'ils n'atteignent le dépôt.

2.  **SCA - Software Composition Analysis (Existant)**
    *   **Outil :** Trivy (Mode Filesystem).
    *   **Action :** Analyse les dépendances (Maven/Pom.xml).
    *   **Objectif :** Identifier les vulnérabilités connues (CVEs) dans les bibliothèques tierces utilisées par les microservices.

### 🔍 Phase 2 : Qualité & Sécurité du Code (Build)
3.  **SAST - Static Application Security Testing (Optimisé)**
    *   **Outil :** SonarQube.
    *   **Action :** Analyse statique du code source Java/Spring Boot.
    *   **Objectif :** Détecter les bugs, les "Code Smells" et les failles de sécurité dans la logique du code.
    *   **Amélioration :** Sécurisation de l'authentification via Secrets GitHub (suppression des mots de passe en clair).

### 📦 Phase 3 : Sécurité des Artefacts & Infrastructure
4.  **Container Security (Existant)**
    *   **Outil :** Trivy (Mode Image).
    *   **Action :** Scanne l'image Docker finale avant le push vers le registre.
    *   **Objectif :** S'assurer que l'OS de base (Alpine/Debian) et les packages système de l'image sont sécurisés.

5.  **IaC Security - Infrastructure as Code (Nouveau)**
    *   **Outil :** Trivy (Mode Config) & Terraform Validate.
    *   **Action :** Analyse les fichiers YAML Kubernetes et les scripts Terraform.
    *   **Objectif :** Bloquer le déploiement de configurations dangereuses (ex: conteneurs privilégiés, ports SSH ouverts, absence de quotas).

### 🛡️ Phase 4 : Sécurité à l'Exécution (Runtime)
6.  **DAST - Dynamic Application Security Testing (Existant)**
    *   **Outil :** OWASP ZAP (Zed Attack Proxy).
    *   **Action :** Attaque simulée sur l'application déployée via le Gateway Kong.
    *   **Objectif :** Détecter les vulnérabilités exploitables de l'extérieur (Injections SQL, XSS, problèmes de configuration HTTP) dans un environnement réel.

---

## 2. Infrastructure as Code (Terraform)

Transition d'une gestion manuelle vers une infrastructure automatisée et auditée.

### Architecture Mise en Place :
1.  **Code Terraform (`infra/terraform/main.tf`)**
    *   **Provider :** `kubernetes` (Connecté via Kubeconfig sécurisé).
    *   **Ressources Gérées :**
        *   `kubernetes_namespace` : Gestion du namespace `medinsight`.
        *   `kubernetes_limit_range` : Sécurité par défaut (Quotas CPU/RAM).

2.  **Automation (`terraform.yml`)**
    *   Nouveau workflow GitHub Actions dédié à l'infrastructure.
    *   Permet de visualiser les changements (`plan`) avant de les appliquer (`apply`).

---

## 3. État Final du Projet

Le projet MedInsight dispose maintenant d'une chaîne de livraison logicielle de niveau professionnel :
*   ✅ **Code Sécurisé** (SAST/SCA/Secrets).
*   ✅ **Infrastructure Sécurisée** (IaC Scan/Terraform).
*   ✅ **Déploiement Audité** (Traceabilité via GitHub Actions).
*   ✅ **Application Testée** (DAST).
