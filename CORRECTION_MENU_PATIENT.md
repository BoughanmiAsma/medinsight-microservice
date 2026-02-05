# Correction : Menu Rendez-vous pour les Patients

## Date : 2026-02-04

## Problème Signalé
Le patient n'avait pas accès au menu "Rendez-vous" dans la navbar, alors qu'il devrait pouvoir créer et gérer ses propres rendez-vous.

## Cause Racinaire
Dans le fichier `AppSidebar.tsx`, le menu "Rendez-vous" était configuré pour être visible uniquement pour les rôles :
- `ADMIN`
- `MEDECIN`
- `SECRETAIRE`

Le rôle `PATIENT` était manquant dans la liste.

## Corrections Apportées

### 1. Ajout du type PATIENT dans les types TypeScript

**Fichier :** `front/src/types/index.ts`

```typescript
// Avant
export type UserRole = 'ADMIN' | 'MEDECIN' | 'INFIRMIER' | 'SECRETAIRE' | 'TECHNICIEN' | 'AIDE_SOIGNANT' | 'PHARMACIEN' | 'LABORATOIRE' | 'PHARMACIE';

// Après
export type UserRole = 'ADMIN' | 'MEDECIN' | 'INFIRMIER' | 'SECRETAIRE' | 'TECHNICIEN' | 'AIDE_SOIGNANT' | 'PHARMACIEN' | 'LABORATOIRE' | 'PHARMACIE' | 'PATIENT';
```

### 2. Ajout du rôle PATIENT au menu Rendez-vous

**Fichier :** `front/src/components/layout/AppSidebar.tsx`

```typescript
// Avant
{
  title: 'Rendez-vous',
  href: '/appointments',
  icon: Calendar,
  roles: ['ADMIN', 'MEDECIN', 'SECRETAIRE']
},

// Après
{
  title: 'Rendez-vous',
  href: '/appointments',
  icon: Calendar,
  roles: ['ADMIN', 'MEDECIN', 'SECRETAIRE', 'PATIENT']
},
```

### 3. Ajout du rôle PATIENT au menu Dossiers

**Fichier :** `front/src/components/layout/AppSidebar.tsx`

```typescript
// Avant
{
  title: 'Dossiers Patients',
  href: '/patients',
  icon: FolderOpen,
  roles: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'LABORATOIRE', 'PHARMACIE']
},

// Après
{
  title: 'Dossiers Patients',
  href: '/patients',
  icon: FolderOpen,
  roles: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'LABORATOIRE', 'PHARMACIE', 'PATIENT']
},
```

**Justification :** Le patient doit pouvoir consulter son propre dossier médical (en lecture seule).

## Résultat Attendu

### Menu visible pour le PATIENT :
- ✅ **Tableau de bord** - Vue d'ensemble de ses informations
- ✅ **Dossiers Patients** - Consultation de son propre dossier (lecture seule)
- ✅ **Rendez-vous** - Création et gestion de ses rendez-vous

### Menu NON visible pour le PATIENT :
- ❌ **Personnel** - Réservé aux administrateurs
- ❌ **Laboratoire** - Réservé au personnel médical
- ❌ **Ordonnances** - Réservé aux médecins

## Fonctionnalités Patient dans Rendez-vous

Lorsqu'un patient accède à `/appointments`, il peut :

1. **Voir le calendrier** de ses rendez-vous
2. **Créer un nouveau rendez-vous** (bouton "Nouveau RDV" visible)
3. **Sélectionner un médecin** dans la liste
4. **Choisir une date et heure**
5. **Indiquer le motif** de la consultation
6. **Voir le statut** de ses rendez-vous :
   - 🟡 **PENDING** - En attente de validation médecin
   - 🟢 **CONFIRMED** - Accepté par le médecin
   - ⚪ **COMPLETED** - Consultation terminée
   - 🔴 **CANCELLED** - Annulé

## Différences avec le Médecin

| Fonctionnalité | PATIENT | MEDECIN |
|----------------|---------|---------|
| Voir le bouton "Nouveau RDV" | ✅ Oui | ❌ Non |
| Créer des rendez-vous | ✅ Oui | ❌ Non |
| Voir ses propres RDV | ✅ Oui | ✅ Oui (assignés) |
| Accepter/Refuser RDV | ❌ Non | ✅ Oui |
| Replanifier RDV | ✅ Avant confirmation | ✅ Toujours |
| Annuler RDV | ✅ Ses propres RDV | ✅ Ses RDV assignés |

## Test de Validation

### Étapes pour tester :
1. Se connecter avec un compte patient (ex: `patient@test.com`)
2. Vérifier que le menu "Rendez-vous" apparaît dans la sidebar
3. Cliquer sur "Rendez-vous"
4. Vérifier que le bouton "Nouveau RDV" est visible
5. Créer un rendez-vous
6. Vérifier qu'il apparaît dans le calendrier avec statut PENDING

### Capture d'écran attendue :
La sidebar du patient doit montrer :
```
📊 Tableau de bord
📁 Dossiers Patients
📅 Rendez-vous  ← NOUVEAU !
```

## Notes Importantes

⚠️ **Le patient ne voit QUE ses propres rendez-vous**, pas ceux des autres patients

⚠️ **Le patient peut créer des RDV** mais ils restent en PENDING jusqu'à validation médecin

✅ **Le patient peut consulter son dossier** mais en lecture seule (pas de modification)

## Fichiers Modifiés

1. ✅ `front/src/types/index.ts` - Ajout du type PATIENT
2. ✅ `front/src/components/layout/AppSidebar.tsx` - Ajout PATIENT aux menus
3. ✅ `medinsight-microservice/LOGIQUE_METIER_RDV.md` - Mise à jour documentation

## Prochaines Étapes

1. **Tester avec un vrai compte patient** dans Keycloak
2. **Vérifier que le backend filtre correctement** les rendez-vous par patient
3. **Implémenter la vue "Mon Dossier"** pour le patient (lecture seule)
4. **Ajouter les notifications** quand un médecin accepte/refuse un RDV
