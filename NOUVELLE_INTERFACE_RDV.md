# Nouvelle Interface de Réservation de Rendez-vous

## 🎨 Concept d'Interface

Une interface moderne et intuitive en **3 étapes** pour la réservation de rendez-vous, remplaçant l'ancien formulaire basique.

## 📋 Flux de Réservation

### Étape 1 : Sélection du Médecin 👨‍⚕️

**Composant :** `DoctorSelector.tsx`

**Fonctionnalités :**
- ✅ **Affichage en cartes** avec avatar, nom, spécialité
- ✅ **Barre de recherche** pour trouver un médecin par nom ou spécialité
- ✅ **Filtres par spécialité** (Cardiologie, Dermatologie, Pédiatrie, etc.)
- ✅ **Indicateurs visuels** : note, disponibilité, numéro de licence
- ✅ **Sélection visuelle** avec highlight et icône de confirmation

**Design :**
```
┌─────────────────────────────────────┐
│  🔍 Rechercher un médecin...        │
└─────────────────────────────────────┘

[Tous] [Cardiologie] [Dermatologie] ...

┌──────────────────────────────────────┐
│  👤  Dr. Sophie Martin               │
│      Cardiologie                     │
│      N° 12345                        │
│      ⭐ 4.8  🕐 Disponible          │
└──────────────────────────────────────┘
```

**Validation :**
- Le bouton "Suivant" est désactivé tant qu'aucun médecin n'est sélectionné

---

### Étape 2 : Choix de la Date et Heure 📅

**Composant :** `TimeSlotSelector.tsx`

**Fonctionnalités :**
- ✅ **Calendrier hebdomadaire** avec navigation
- ✅ **Affichage des jours** avec mise en évidence du jour actuel
- ✅ **Créneaux horaires** affichés par tranche de 30 minutes
- ✅ **Indication visuelle** des créneaux disponibles/indisponibles
- ✅ **Rappel du médecin sélectionné** en haut

**Design :**
```
┌─────────────────────────────────────┐
│  Rendez-vous avec                   │
│  Dr. Sophie Martin                  │
└─────────────────────────────────────┘

    ← Février 2026 →

[Lun] [Mar] [Mer] [Jeu] [Ven] [Sam] [Dim]
  2     3     4     5     6     7     8

Créneaux disponibles - Mercredi 4 février

[08:00] [08:30] [09:00] [09:30] ...
[14:00] [14:30] [15:00] [15:30] ...

Légende: ■ Sélectionné  □ Disponible  ⊘ Indisponible
```

**Validation :**
- Le bouton "Suivant" est désactivé tant qu'aucun créneau n'est sélectionné

---

### Étape 3 : Confirmation et Motif ✅

**Composant :** `AppointmentSummary.tsx`

**Fonctionnalités :**
- ✅ **Résumé visuel** avec icône de succès
- ✅ **Cartes d'information** pour médecin, date, heure
- ✅ **Champ motif** avec textarea pour description détaillée
- ✅ **Note informative** sur le statut PENDING

**Design :**
```
        ✓
    ┌───────┐
    │   ✓   │  Confirmer votre rendez-vous
    └───────┘

┌─────────────────────────────────────┐
│  👤 Médecin                         │
│     Dr. Sophie Martin               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📅 Date                            │
│     Mercredi 4 février 2026         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🕐 Heure                           │
│     10:00                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📝 Motif de la consultation        │
│  ┌───────────────────────────────┐ │
│  │ Ex: Consultation de suivi...  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

ℹ️ Votre rendez-vous sera en attente de 
   confirmation par le médecin.
```

**Validation :**
- Le bouton "Confirmer" est désactivé si le motif est vide

---

## 🎯 Avantages de la Nouvelle Interface

### Pour le Patient :

1. **Intuitivité** 
   - Plus besoin de connaître l'ID du médecin
   - Sélection visuelle avec photos et informations

2. **Transparence**
   - Voir les spécialités disponibles
   - Consulter les notes et disponibilités
   - Visualiser les créneaux libres

3. **Guidage**
   - Progression claire en 3 étapes
   - Validation à chaque étape
   - Impossible de manquer une information

4. **Esthétique**
   - Interface moderne et professionnelle
   - Animations fluides
   - Design responsive

### Pour le Système :

1. **Validation**
   - Chaque étape valide les données
   - Impossible de soumettre un formulaire incomplet
   - Meilleure qualité des données

2. **UX**
   - Réduction des erreurs utilisateur
   - Moins de support nécessaire
   - Meilleur taux de conversion

3. **Évolutivité**
   - Facile d'ajouter des filtres
   - Possibilité d'intégrer la disponibilité réelle
   - Extensible pour d'autres fonctionnalités

---

## 🔧 Composants Créés

### 1. `DoctorSelector.tsx`
```typescript
interface DoctorSelectorProps {
  onSelect: (doctorId: string, doctorName: string) => void;
  selectedDoctorId?: string;
}
```

**Fonctionnalités :**
- Récupération des médecins actifs via API
- Filtrage par recherche et spécialité
- Affichage en grille responsive
- Gestion de l'état de sélection

### 2. `TimeSlotSelector.tsx`
```typescript
interface TimeSlotSelectorProps {
  onSelect: (dateTime: string) => void;
  selectedDateTime?: string;
  doctorName?: string;
}
```

**Fonctionnalités :**
- Navigation hebdomadaire
- Désactivation des dates passées
- Affichage des créneaux horaires
- Mock de disponibilité (à connecter avec le backend)

### 3. `AppointmentSummary.tsx`
```typescript
interface AppointmentSummaryProps {
  doctorName: string;
  dateTime: string;
  motif: string;
  onMotifChange: (motif: string) => void;
}
```

**Fonctionnalités :**
- Affichage formaté des informations
- Saisie du motif
- Note informative sur le processus

---

## 📱 Responsive Design

L'interface s'adapte à tous les écrans :

**Desktop (> 768px) :**
- Grille 2 colonnes pour les médecins
- Créneaux sur 4 colonnes
- Modal large (max-w-3xl)

**Mobile (< 768px) :**
- Grille 1 colonne pour les médecins
- Créneaux sur 3 colonnes
- Modal pleine largeur
- Scroll optimisé

---

## 🎨 Design System

### Couleurs :
- **Primary** : Accent principal (boutons, sélections)
- **Muted** : Fond des éléments non sélectionnés
- **Success** : Confirmations
- **Warning** : États en attente

### Animations :
- **Hover** : Scale 1.02 sur les cartes
- **Selection** : Ring 2px + background teinté
- **Transitions** : 200ms duration

### Icônes :
- Lucide React pour cohérence
- Taille 4-5 pour les petites icônes
- Taille 12 pour les icônes principales

---

## 🚀 Améliorations Futures

### Court Terme :
1. **Disponibilité réelle** des médecins
2. **Intégration avec le calendrier** du médecin
3. **Photos réelles** des médecins
4. **Filtres avancés** (langue, localisation)

### Moyen Terme :
1. **Notifications** en temps réel
2. **Rappels** automatiques
3. **Historique** des consultations
4. **Recommandations** de médecins

### Long Terme :
1. **Téléconsultation** intégrée
2. **IA** pour suggestion de spécialité
3. **Intégration** avec calendriers externes
4. **Multi-langues**

---

## 📊 Métriques de Succès

Pour mesurer l'efficacité de la nouvelle interface :

1. **Taux de complétion** : % de réservations finalisées
2. **Temps moyen** : Durée pour réserver un RDV
3. **Taux d'erreur** : Nombre de soumissions échouées
4. **Satisfaction** : Feedback utilisateurs
5. **Taux d'annulation** : RDV annulés après création

---

## 🔗 Intégration Backend

### Endpoints Nécessaires :

```http
GET /staffs/actifs
→ Liste des médecins actifs

GET /appointments/availability/{doctorId}?date={date}
→ Créneaux disponibles pour un médecin

POST /appointments
→ Création du rendez-vous
```

### Données Envoyées :

```json
{
  "doctorId": "keycloak-uuid",
  "patientId": "patient-id",
  "appointmentDate": "2026-02-04T10:00:00",
  "status": "PENDING",
  "motif": "Consultation de suivi"
}
```

---

## ✅ Checklist d'Implémentation

- [x] Créer DoctorSelector component
- [x] Créer TimeSlotSelector component
- [x] Créer AppointmentSummary component
- [x] Intégrer dans Appointments.tsx
- [x] Ajouter navigation entre étapes
- [x] Ajouter barre de progression
- [x] Gérer la validation par étape
- [x] Réinitialiser le wizard après succès
- [ ] Connecter avec API de disponibilité
- [ ] Ajouter photos des médecins
- [ ] Tests utilisateurs
- [ ] Optimisation mobile

---

## 🎓 Guide d'Utilisation

### Pour le Patient :

1. **Cliquer sur "Nouveau RDV"**
2. **Étape 1** : Rechercher et sélectionner un médecin
3. **Étape 2** : Choisir une date et un créneau horaire
4. **Étape 3** : Remplir le motif et confirmer
5. **Attendre** la confirmation du médecin

### Navigation :
- **Suivant** : Passer à l'étape suivante
- **Retour** : Revenir à l'étape précédente
- **X** : Annuler et fermer le modal
