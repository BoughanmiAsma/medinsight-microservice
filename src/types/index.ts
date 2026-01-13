// User & Authentication Types
export type UserRole = 'ADMIN' | 'MEDECIN' | 'INFIRMIER' | 'SECRETAIRE' | 'TECHNICIEN';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: UserRole[];
  specialite?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// Staff Types
export interface Staff {
  id: string;
  nom: string;
  prenom: string;
  type: UserRole;
  specialite?: string;
  email: string;
  telephone?: string;
  dateEmbauche?: string;
  statut: 'ACTIF' | 'INACTIF';
}

// Patient/Dossier Types
export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'M' | 'F';
  telephone?: string;
  email?: string;
  adresse?: string;
  numeroSecuriteSociale?: string;
  groupeSanguin?: string;
  allergies?: string[];
  antecedents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Dossier {
  id: string;
  patient: Patient;
  consultations: Consultation[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
}

// Appointment Types
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  medecinId: string;
  medecinNom: string;
  dateHeure: string;
  duree: number; // in minutes
  motif: string;
  statut: AppointmentStatus;
  notes?: string;
}

// Consultation Types
export interface Consultation {
visiteType: string;
  id: string;
  dossierId: string;
  medecinId: string;
  medecinNom: string;
  dateConsultation: string;
  motif: string;
  symptomes?: string;
  diagnostic?: string;
  notes?: string;
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
}

// Prescription Types
export interface Medication {
  nom: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medecinId: string;
  medecinNom: string;
  patientId: string;
  patientNom: string;
  datePrescription: string;
  medications: Medication[];
  notes?: string;
  statut: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

// Lab Types
export type LabOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface LabTest {
  code: string;
  nom: string;
  resultat?: string;
  unite?: string;
  valeurReference?: string;
  interpretation?: 'NORMAL' | 'ANORMAL_BAS' | 'ANORMAL_HAUT';
}

export interface LabOrder {
  id: string;
  consultationId?: string;
  patientId: string;
  patientNom: string;
  medecinId: string;
  medecinNom: string;
  technicienId?: string;
  technicienNom?: string;
  dateCommande: string;
  dateResultat?: string;
  tests: LabTest[];
  statut: LabOrderStatus;
  priorite: 'NORMAL' | 'URGENT';
  notes?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingLabResults: number;
  activeConsultations: number;
  recentPatients: Patient[];
  upcomingAppointments: Appointment[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
