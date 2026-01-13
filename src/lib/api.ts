import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';

// API Configuration
const API_BASE_URL = 'http://localhost:8200';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage or auth state
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Token expired or invalid
      // In production: Try to refresh token or redirect to login
      toast({
        title: 'Session expirée',
        description: 'Veuillez vous reconnecter.',
        variant: 'destructive',
      });
      
      // Clear auth state and redirect
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else if (status === 403) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les permissions nécessaires pour cette action.",
        variant: 'destructive',
      });
    } else if (status === 404) {
      toast({
        title: 'Ressource introuvable',
        description: "L'élément demandé n'existe pas.",
        variant: 'destructive',
      });
    } else if (status && status >= 500) {
      toast({
        title: 'Erreur serveur',
        description: 'Une erreur est survenue. Veuillez réessayer plus tard.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// API Endpoints
export const endpoints = {
  // Staff
  staff: {
    list: () => api.get('/staffs'),
    get: (id: string) => api.get(`/staffs/${id}`),
    create: (data: any) => api.post('/staffs', data),
    update: (id: string, data: any) => api.put(`/staffs/${id}`, data),
    delete: (id: string) => api.delete(`/staffs/${id}`),
  },
  
  // Dossiers (Patient Records)
  dossiers: {
    list: (params?: any) => api.get('/api/dossiers', { params }),
    get: (id: string) => api.get(`/api/dossiers/${id}`),
    create: (data: any) => api.post('/api/dossiers', data),
    update: (id: string, data: any) => api.put(`/api/dossiers/${id}`, data),
    search: (query: string) => api.get(`/api/dossiers/search`, { params: { q: query } }),
  },
  
  // Appointments
  appointments: {
    list: (params?: any) => api.get('/api/appointments', { params }),
    get: (id: string) => api.get(`/api/appointments/${id}`),
    create: (data: any) => api.post('/api/appointments', data),
    update: (id: string, data: any) => api.put(`/api/appointments/${id}`, data),
    cancel: (id: string) => api.patch(`/api/appointments/${id}/cancel`),
    today: () => api.get('/api/appointments/today'),
  },
  
  // Lab Orders
  lab: {
    list: (params?: any) => api.get('/api/lab-orders', { params }),
    get: (id: string) => api.get(`/api/lab-orders/${id}`),
    create: (data: any) => api.post('/api/lab-orders', data),
    updateResults: (id: string, data: any) => api.patch(`/api/lab-orders/${id}/results`, data),
    pending: () => api.get('/api/lab-orders/pending'),
  },
  
  // Prescriptions
  prescriptions: {
    list: (params?: any) => api.get('/api/prescriptions', { params }),
    get: (id: string) => api.get(`/api/prescriptions/${id}`),
    create: (data: any) => api.post('/api/prescriptions', data),
    byPatient: (patientId: string) => api.get(`/api/prescriptions/patient/${patientId}`),
  },
  
  // Consultations
  consultations: {
    list: (params?: any) => api.get('/api/consultations', { params }),
    get: (id: string) => api.get(`/api/consultations/${id}`),
    create: (data: any) => api.post('/api/consultations', data),
    update: (id: string, data: any) => api.put(`/api/consultations/${id}`, data),
  },
};

export default api;
