import { Users, Calendar, FlaskConical, Stethoscope } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, Patient } from '@/types';

// Mock data for development
const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientNom: 'Dupont',
    patientPrenom: 'Marie',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateHeure: new Date().toISOString(),
    duree: 30,
    motif: 'Consultation générale',
    statut: 'CONFIRMED',
  },
  {
    id: '2',
    patientId: '2',
    patientNom: 'Bernard',
    patientPrenom: 'Pierre',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateHeure: new Date(Date.now() + 3600000).toISOString(),
    duree: 45,
    motif: 'Suivi diabète',
    statut: 'PENDING',
  },
  {
    id: '3',
    patientId: '3',
    patientNom: 'Leroy',
    patientPrenom: 'Sophie',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateHeure: new Date(Date.now() + 7200000).toISOString(),
    duree: 30,
    motif: 'Renouvellement ordonnance',
    statut: 'CONFIRMED',
  },
];

const mockPatients: Patient[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    dateNaissance: '1985-03-15',
    sexe: 'F',
    telephone: '06 12 34 56 78',
    email: 'marie.dupont@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    nom: 'Bernard',
    prenom: 'Pierre',
    dateNaissance: '1972-08-22',
    sexe: 'M',
    telephone: '06 98 76 54 32',
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    nom: 'Leroy',
    prenom: 'Sophie',
    dateNaissance: '1990-11-08',
    sexe: 'F',
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const Dashboard = () => {
  const { user, hasRole } = useAuth();

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Bonjour, {hasRole('MEDECIN') ? 'Dr. ' : ''}{user?.prenom} 👋
        </h1>
        <p className="page-subtitle">
          Voici un aperçu de votre journée
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value="1,234"
          subtitle="Dossiers actifs"
          icon={Users}
          trend={{ value: 12, label: 'ce mois' }}
          variant="primary"
        />
        <StatCard
          title="RDV Aujourd'hui"
          value="8"
          subtitle="3 confirmés"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Résultats Labo"
          value="5"
          subtitle="En attente"
          icon={FlaskConical}
          variant="warning"
        />
        <StatCard
          title="Consultations"
          value="24"
          subtitle="Cette semaine"
          icon={Stethoscope}
          trend={{ value: 8, label: 'vs semaine précédente' }}
          variant="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <AppointmentsList appointments={mockAppointments} />
          <QuickActions />
        </div>

        {/* Right Column - Recent Patients */}
        <div className="space-y-6">
          <RecentPatients patients={mockPatients} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
