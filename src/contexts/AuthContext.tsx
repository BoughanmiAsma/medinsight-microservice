import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development - Replace with actual Keycloak integration
const mockUser: User = {
  id: '1',
  email: 'dr.martin@medinsight.com',
  nom: 'Martin',
  prenom: 'Jean',
  roles: ['MEDECIN', 'ADMIN'],
  specialite: 'Médecine Générale',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    // Simulate auth check - Replace with Keycloak init
    const initAuth = async () => {
      try {
        // In production, initialize Keycloak here:
        // const keycloak = new Keycloak({
        //   url: 'http://localhost:8080',
        //   realm: 'microservices-realm',
        //   clientId: 'medinsight-client',
        // });
        // await keycloak.init({ onLoad: 'login-required' });
        
        // For development, auto-login with mock user
        setTimeout(() => {
          setAuthState({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            token: 'mock-jwt-token',
          });
        }, 500);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = () => {
    // In production: keycloak.login()
    setAuthState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-jwt-token',
    });
  };

  const logout = () => {
    // In production: keycloak.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.user?.roles.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
