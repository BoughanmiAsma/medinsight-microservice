export type UserRole = 'ADMIN' | 'MEDECIN' | 'INFIRMIER' | 'SECRETAIRE' | 'TECHNICIEN' | 'AIDE_SOIGNANT' | 'PHARMACIEN' | 'LABORATOIRE' | 'PHARMACIE';

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
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  type: UserRole;
  specialite?: string;
  numeroLicence?: string;
  actif: boolean;
  dateEmbauche?: string;
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
  id: number;
  dossierId: string;
  medecinId: string;
  dateHeure: string;
  status: string;
  motif?: string;
}

// Consultation Types
export interface Consultation {
  visiteType: string;
  id: string;
  dossierId: string;
  medecinId: string;
  medecinNom: string;
  consultationDate: string;
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
  id: number;
  dossierId: string;
  consultationId: string;
  medicationDetails: string;
  status: string;
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
  id: number;
  dossierId: string;
  consultationId: string;
  testCode: string;
  status: string;
  result?: string;
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
