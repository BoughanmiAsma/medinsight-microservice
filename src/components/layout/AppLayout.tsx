import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">MedInsight</h2>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Connexion requise</h1>
          <p className="text-muted-foreground mb-6">
            Veuillez vous connecter pour accéder à MedInsight.
          </p>
          <button
            onClick={login}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Se connecter avec Keycloak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container py-6 px-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
