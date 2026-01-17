
import axios from 'axios';
import { User } from 'oidc-client-ts';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get token from storage (oidc-client-ts stores it in session/local storage with specific key)
function getAccessToken() {
    const oidcStorage = sessionStorage.getItem(
        `oidc.user:${import.meta.env.VITE_KEYCLOAK_URL}:${import.meta.env.VITE_KEYCLOAK_CLIENT_ID}`
    );
    if (!oidcStorage) {
        return null;
    }
    return User.fromStorageString(oidcStorage)?.access_token;
}

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
