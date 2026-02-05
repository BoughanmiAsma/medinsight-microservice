
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { useAuth as useOidcAuth } from "react-oidc-context";
import { User as OidcUser } from "oidc-client-ts";

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map OIDC User Profile to App User
const mapOidcUserToAppUser = (profile: any): User => {
  const rolesSet = new Set<string>();

  // Extract from realm_access
  if (profile.realm_access?.roles) {
    profile.realm_access.roles.forEach((r: string) => {
      rolesSet.add(r);
      if (r.startsWith('ROLE_')) rolesSet.add(r.replace('ROLE_', ''));
    });
  }

  // Extract from resource_access (client-specific roles)
  if (profile.resource_access) {
    Object.values(profile.resource_access).forEach((client: any) => {
      if (client.roles) {
        client.roles.forEach((r: string) => {
          rolesSet.add(r);
          if (r.startsWith('ROLE_')) rolesSet.add(r.replace('ROLE_', ''));
        });
      }
    });
  }

  const roles = Array.from(rolesSet) as UserRole[];

  return {
    id: profile.sub,
    email: profile.email,
    nom: profile.family_name || 'Admin',
    prenom: profile.given_name || 'System',
    roles: roles,
    specialite: profile.specialite || (roles.includes('MEDECIN') ? 'Médecin' : 'Personnel'),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useOidcAuth();

  const user = useMemo(() => {
    if (auth.user?.profile) {
      return mapOidcUserToAppUser(auth.user.profile);
    }
    return null;
  }, [auth.user]);

  const login = () => {
    auth.signinRedirect();
  };

  const logout = () => {
    auth.signoutRedirect();
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const value = {
    user,
    isAuthenticated: auth.isAuthenticated ?? false,
    isLoading: auth.isLoading,
    token: auth.user?.access_token ?? null,
    login,
    logout,
    hasRole,
    hasAnyRole
  };

  if (auth.isLoading) {
    return <div>Loading authentication...</div>;
  }

  // Auto-login check (optional, or rely on Protected Routes)
  // If we want to force login everywhere:
  // if (!auth.isAuthenticated) {
  //    auth.signinRedirect();
  //    return <div>Redirecting to login...</div>;
  // }

  return (
    <AuthContext.Provider value={value}>
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
