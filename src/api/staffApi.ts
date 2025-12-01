import axios from "axios";

export interface Staff {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type: string;
  specialite: string;
  numeroLicence: string;
  actif: boolean;
  dateEmbauche: string | null; // LocalDateTime ISO
}

const API_URL = "http://localhost:9088/staffs";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.data);
      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error:", error.request);
      return Promise.reject(new Error("Erreur de connexion au serveur"));
    } else {
      // Something else happened
      console.error("Error:", error.message);
      return Promise.reject(error);
    }
  }
);

export const getAllStaffs = () => apiClient.get("");

export const getStaffById = (id: number) =>
  apiClient.get(`/${id}`);

export const createStaff = (data: Staff) =>
  apiClient.post("", data);

export const updateStaff = (id: number, data: Staff) =>
  apiClient.put(`/${id}`, data);

export const deleteStaff = (id: number) =>
  apiClient.delete(`/${id}`);
