# Guide Simplifié : Compléter MedInsight SANS Créer de Nouveaux Services

## 🎯 Objectif

Permettre aux **patients** et **médecins** d'utiliser le système **en utilisant les services existants** avec un contrôle d'accès basé sur les rôles Keycloak.

---

## ✅ Avantages de Cette Approche

1. **Pas de nouveau code** : Utiliser les services existants (dossier-service, ordonnance-service, lab-service)
2. **Simplicité** : Un seul service par domaine métier
3. **Sécurité** : Contrôle d'accès via Keycloak + Fabric MSP
4. **Maintenabilité** : Moins de services à gérer

---

## 📋 Architecture Simplifiée

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                       │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Interface  │  │  Interface  │  │  Interface  │     │
│  │   Patient   │  │   Médecin   │  │  Pharmacie  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────┐
│           Kong API Gateway + Keycloak (Auth)             │
│  Rôles: PATIENT, DOCTOR, PHARMACIST, LAB_TECH           │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   dossier-   │  │ ordonnance-  │  │     lab-     │
│   service    │  │   service    │  │   service    │
│              │  │              │  │              │
│ Port: 8083   │  │ Port: 8082   │  │ Port: 8081   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┴────────────────┘
                         │
                         ↓
              ┌──────────────────┐
              │ Fabric Network   │
              │ - DoctorOrg      │
              │ - PharmacyOrg    │
              │ - LabOrg         │
              │ - PatientOrg ✨  │
              └──────────────────┘
```

---

## 🔧 Étape 1 : Configurer Keycloak avec les Rôles

### 1.1 Créer les Rôles dans Keycloak

Connectez-vous à Keycloak Admin Console : `http://localhost:8080`

1. Aller dans **Realm Settings** → **Roles**
2. Créer les rôles suivants :
   - `ROLE_PATIENT`
   - `ROLE_DOCTOR`
   - `ROLE_PHARMACIST`
   - `ROLE_LAB_TECH`
   - `ROLE_ADMIN`

### 1.2 Créer des Utilisateurs de Test

Créer des utilisateurs avec différents rôles :

| Username | Password | Rôle | Description |
|----------|----------|------|-------------|
| `patient1` | `patient123` | ROLE_PATIENT | Patient test |
| `doctor1` | `doctor123` | ROLE_DOCTOR | Médecin test |
| `pharmacist1` | `pharma123` | ROLE_PHARMACIST | Pharmacien test |
| `lab1` | `lab123` | ROLE_LAB_TECH | Technicien labo |

### 1.3 Configurer les Clients Keycloak

Pour chaque service, configurez le client dans Keycloak :

**Exemple pour dossier-service** :
- Client ID: `dossier-service`
- Access Type: `confidential`
- Valid Redirect URIs: `http://localhost:8083/*`
- Web Origins: `*`

---

## 🔧 Étape 2 : Modifier `dossier-service` pour Supporter les Patients

### 2.1 Ajouter des Endpoints pour Patients

Modifiez `DossierController.java` pour ajouter des endpoints accessibles aux patients :

```java
package com.medinsight.dossier.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dossiers")
public class DossierController {
    
    // ========== ENDPOINTS POUR MÉDECINS ==========
    
    /**
     * Créer un dossier médical (Médecins uniquement)
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createDossier(@RequestBody Dossier dossier) {
        // Logique existante
        return ResponseEntity.ok(dossierService.create(dossier));
    }
    
    /**
     * Modifier un dossier (Médecins uniquement)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateDossier(@PathVariable String id, @RequestBody Dossier dossier) {
        return ResponseEntity.ok(dossierService.update(id, dossier));
    }
    
    /**
     * Lister tous les dossiers (Médecins et Admins)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> getAllDossiers() {
        return ResponseEntity.ok(dossierService.findAll());
    }
    
    // ========== ENDPOINTS POUR PATIENTS ==========
    
    /**
     * Récupérer MES dossiers médicaux (Patients)
     */
    @GetMapping("/my-records")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyRecords(Authentication auth) {
        String patientId = auth.getName(); // ID du patient depuis Keycloak
        return ResponseEntity.ok(dossierService.findByPatientId(patientId));
    }
    
    /**
     * Récupérer UN de mes dossiers (Patients)
     */
    @GetMapping("/my-records/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyRecord(@PathVariable String id, Authentication auth) {
        String patientId = auth.getName();
        Dossier dossier = dossierService.findById(id);
        
        // Vérifier que le dossier appartient au patient
        if (!dossier.getPatientId().equals(patientId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        return ResponseEntity.ok(dossier);
    }
    
    // ========== ENDPOINTS MIXTES ==========
    
    /**
     * Récupérer un dossier par ID (Médecins et Patient propriétaire)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ResponseEntity<?> getDossierById(@PathVariable String id, Authentication auth) {
        Dossier dossier = dossierService.findById(id);
        
        // Si c'est un patient, vérifier qu'il est propriétaire
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            if (!dossier.getPatientId().equals(auth.getName())) {
                return ResponseEntity.status(403).body("Access denied");
            }
        }
        
        return ResponseEntity.ok(dossier);
    }
}
```

### 2.2 Ajouter la Méthode dans le Service

Dans `DossierService.java`, ajoutez :

```java
public List<Dossier> findByPatientId(String patientId) {
    return dossierRepository.findByPatientId(patientId);
}
```

### 2.3 Ajouter la Méthode dans le Repository

Dans `DossierRepository.java`, ajoutez :

```java
List<Dossier> findByPatientId(String patientId);
```

---

## 🔧 Étape 3 : Modifier `ordonnance-service` pour Patients et Pharmaciens

### 3.1 Endpoints pour Patients

```java
@RestController
@RequestMapping("/api/ordonnances")
public class OrdonnanceController {
    
    // ========== ENDPOINTS POUR MÉDECINS ==========
    
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createOrdonnance(@RequestBody Ordonnance ordonnance) {
        return ResponseEntity.ok(ordonnanceService.create(ordonnance));
    }
    
    // ========== ENDPOINTS POUR PATIENTS ==========
    
    @GetMapping("/my-prescriptions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyPrescriptions(Authentication auth) {
        String patientId = auth.getName();
        return ResponseEntity.ok(ordonnanceService.findByPatientId(patientId));
    }
    
    // ========== ENDPOINTS POUR PHARMACIENS ==========
    
    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<?> dispensePrescription(@PathVariable String id) {
        return ResponseEntity.ok(ordonnanceService.dispense(id));
    }
    
    @GetMapping("/pending")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<?> getPendingPrescriptions() {
        return ResponseEntity.ok(ordonnanceService.findPending());
    }
}
```

---

## 🔧 Étape 4 : Configurer Kong API Gateway

### 4.1 Routes pour dossier-service

```yaml
# Route pour médecins - Créer un dossier
- name: dossier-create
  paths:
    - /api/dossiers
  methods:
    - POST
  service: dossier-service
  plugins:
    - name: jwt
    - name: acl
      config:
        allow:
          - ROLE_DOCTOR

# Route pour patients - Voir mes dossiers
- name: dossier-my-records
  paths:
    - /api/dossiers/my-records
  methods:
    - GET
  service: dossier-service
  plugins:
    - name: jwt
    - name: acl
      config:
        allow:
          - ROLE_PATIENT
```

---

## 🎨 Étape 5 : Frontend - Interfaces Différenciées

### 5.1 Structure du Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── patient/
│   │   │   ├── MyRecords.jsx        # Mes dossiers
│   │   │   ├── MyPrescriptions.jsx  # Mes ordonnances
│   │   │   └── MyConsents.jsx       # Mes consentements
│   │   ├── doctor/
│   │   │   ├── CreateRecord.jsx     # Créer un dossier
│   │   │   ├── PatientList.jsx      # Liste des patients
│   │   │   └── Prescriptions.jsx    # Prescrire
│   │   └── pharmacist/
│   │       ├── DispensePrescription.jsx
│   │       └── PendingOrders.jsx
│   ├── pages/
│   │   ├── PatientDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   └── PharmacistDashboard.jsx
│   └── App.jsx
```

### 5.2 Routage Basé sur les Rôles

```javascript
// App.jsx
import { useKeycloak } from '@react-keycloak/web';

function App() {
  const { keycloak } = useKeycloak();
  
  const isPatient = keycloak.hasRealmRole('ROLE_PATIENT');
  const isDoctor = keycloak.hasRealmRole('ROLE_DOCTOR');
  const isPharmacist = keycloak.hasRealmRole('ROLE_PHARMACIST');
  
  return (
    <Routes>
      {isPatient && (
        <>
          <Route path="/my-records" element={<MyRecords />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route path="/my-consents" element={<MyConsents />} />
        </>
      )}
      
      {isDoctor && (
        <>
          <Route path="/patients" element={<PatientList />} />
          <Route path="/create-record" element={<CreateRecord />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
        </>
      )}
      
      {isPharmacist && (
        <>
          <Route path="/dispense" element={<DispensePrescription />} />
          <Route path="/pending" element={<PendingOrders />} />
        </>
      )}
    </Routes>
  );
}
```

### 5.3 Exemple de Composant Patient

```javascript
// components/patient/MyRecords.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function MyRecords() {
  const [records, setRecords] = useState([]);
  
  useEffect(() => {
    axios.get('http://localhost:8083/api/dossiers/my-records', {
      headers: {
        Authorization: `Bearer ${keycloak.token}`
      }
    })
    .then(response => setRecords(response.data))
    .catch(error => console.error(error));
  }, []);
  
  return (
    <div>
      <h2>Mes Dossiers Médicaux</h2>
      {records.map(record => (
        <div key={record.id}>
          <h3>Dossier #{record.id}</h3>
          <p>Date: {record.date}</p>
          <p>Diagnostic: {record.diagnosis}</p>
          <p>Traitement: {record.treatment}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Résumé : Ce Qu'il Faut Faire

### Modifications Minimales

1. **Keycloak** (5 min)
   - Créer les rôles (PATIENT, DOCTOR, PHARMACIST, LAB_TECH)
   - Créer des utilisateurs de test

2. **dossier-service** (15 min)
   - Ajouter `@PreAuthorize` sur les endpoints existants
   - Ajouter 2 nouveaux endpoints : `/my-records` et `/my-records/{id}`
   - Ajouter la méthode `findByPatientId()` dans le service

3. **ordonnance-service** (15 min)
   - Ajouter `@PreAuthorize` sur les endpoints
   - Ajouter `/my-prescriptions` pour les patients
   - Ajouter `/pending` et `/{id}/dispense` pour les pharmaciens

4. **Frontend** (30 min)
   - Créer 3 dashboards (Patient, Doctor, Pharmacist)
   - Routage basé sur les rôles Keycloak
   - Composants pour afficher les données

### Pas Besoin de :

❌ Créer patient-service  
❌ Créer doctor-service  
❌ Dupliquer la logique métier  
❌ Gérer plusieurs bases de données  

---

## 🚀 Commandes pour Tester

### 1. Obtenir un Token Patient

```bash
curl -X POST http://localhost:8080/realms/medinsight/protocol/openid-connect/token \
  -d "client_id=dossier-service" \
  -d "client_secret=your-secret" \
  -d "grant_type=password" \
  -d "username=patient1" \
  -d "password=patient123"
```

### 2. Récupérer Mes Dossiers (Patient)

```bash
curl -X GET http://localhost:8083/api/dossiers/my-records \
  -H "Authorization: Bearer <token>"
```

### 3. Créer un Dossier (Médecin)

```bash
curl -X POST http://localhost:8083/api/dossiers \
  -H "Authorization: Bearer <doctor-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient1",
    "diagnosis": "Hypertension",
    "treatment": "Medication"
  }'
```

---

## 📊 Comparaison des Approches

| Critère | Services Séparés | Services Existants avec Rôles |
|---------|------------------|-------------------------------|
| **Complexité** | ⚠️ Élevée | ✅ Faible |
| **Temps de dev** | ⚠️ 2-3 jours | ✅ 1-2 heures |
| **Maintenance** | ⚠️ Difficile | ✅ Facile |
| **Performance** | ⚠️ Plus de services | ✅ Moins de overhead |
| **Sécurité** | ✅ Isolation | ✅ Contrôle d'accès |

---

## ✅ Conclusion

**Vous pouvez compléter votre projet en utilisant les services existants** avec un contrôle d'accès basé sur Keycloak. C'est :
- ✅ **Plus simple**
- ✅ **Plus rapide**
- ✅ **Tout aussi sécurisé**
- ✅ **Plus facile à maintenir**

La séparation se fait au niveau du **frontend** (interfaces différentes) et de la **sécurité** (rôles Keycloak), pas au niveau des services backend.

---

**Auteur** : Guide simplifié MedInsight  
**Date** : 2026-01-10  
**Version** : 1.0
