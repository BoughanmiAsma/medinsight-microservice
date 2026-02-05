import { useAuth } from '@/contexts/AuthContext';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { PatientDashboard } from '@/components/dashboard/PatientDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, hasRole, hasAnyRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect lab and pharmacy staff to their dedicated pages
  if (hasAnyRole(['LABORATOIRE', 'TECHNICIEN'])) {
    return <Navigate to="/lab" replace />;
  }
  if (hasRole('PHARMACIE')) {
    return <Navigate to="/prescriptions" replace />;
  }

  return (
    <div className="page-transition space-y-6">
      {/* Dynamic Header Based on Role */}
      <div className="page-header">
        <h1 className="page-title">
          {hasRole('MEDECIN') && `Bonjour Dr. ${user?.nom} 👨‍⚕️`}
          {hasRole('PATIENT') && `Bonjour ${user?.prenom} 👋`}
          {hasRole('ADMIN') && `Panneau d'administration 👔`}
          {!hasRole('MEDECIN') && !hasRole('PATIENT') && !hasRole('ADMIN') && `Bienvenue ${user?.prenom}`}
        </h1>
        <p className="page-subtitle">
          {hasRole('MEDECIN') && "Voici un aperçu de votre activité médicale"}
          {hasRole('PATIENT') && "Gérez votre santé et vos rendez-vous"}
          {hasRole('ADMIN') && "Surveillance et gestion de l'établissement"}
          {!hasRole('MEDECIN') && !hasRole('PATIENT') && !hasRole('ADMIN') && "Votre tableau de bord personnalisé"}
        </p>
      </div>

      {/* Role-based Dashboard Component */}
      {hasRole('MEDECIN') && <DoctorDashboard />}
      {hasRole('PATIENT') && !hasRole('MEDECIN') && <PatientDashboard />}
      {hasRole('ADMIN') && !hasRole('MEDECIN') && !hasRole('PATIENT') && <AdminDashboard />}

      {/* Fallback for other roles */}
      {!hasRole('MEDECIN') && !hasRole('PATIENT') && !hasRole('ADMIN') && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Dashboard en cours de développement pour votre rôle
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
