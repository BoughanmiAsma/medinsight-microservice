// src/api/staffApi.ts
import axios from "axios";

export type StaffType =
  | "MEDECIN"
  | "INFIRMIER"
  | "AIDE_SOIGNANT"
  | "TECHNICIEN"
  | "SECRETAIRE";

export interface Staff {
  id?: number;
  nom: string;
  prenom: string;
  type: StaffType;

  specialite?: string;
  email?: string;
  telephone?: string;

  numeroLicence?: string;
  dateEmbauche?: string; // ISO yyyy-mm-dd ou yyyy-mm-ddThh:mm:ss
  actif?: boolean;
}

/**
 * ✅ CRA proxy friendly:
 * - en dev, si tu mets proxy dans package.json, utilise une URL relative.
 * - en prod, tu peux surcharger via REACT_APP_STAFF_API_URL.
 *
 * Ton backend expose /staffs (pas /api/staff)
 */
const API_URL =
  (process as any).env?.REACT_APP_STAFF_API_URL || "/staffs";

export const staffApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ✅ Ajout automatique du token Keycloak si présent.
 * Adapte la clé selon ton Auth (localStorage / zustand / etc.)
 */
staffApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// CRUD
export const getAllStaffs = () => staffApi.get<Staff[]>("");
export const getStaffById = (id: number) =>
  staffApi.get<Staff>(`/${id}`);

export const createStaff = (staff: Staff) =>
  staffApi.post<Staff>("", staff);

export const updateStaff = (id: number, staff: Staff) =>
  staffApi.put<Staff>(`/${id}`, staff);

export const deleteStaff = (id: number) =>
  staffApi.delete<void>(`/${id}`);
