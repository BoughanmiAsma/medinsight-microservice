import { 
  Calendar, 
  UserPlus, 
  Stethoscope, 
  FlaskConical,
  FileText,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  roles?: string[];
}

const actions: QuickAction[] = [
  {
    title: 'Nouveau RDV',
    description: 'Planifier un rendez-vous',
    icon: Calendar,
    href: '/appointments/new',
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    title: 'Nouveau Patient',
    description: 'Créer un dossier patient',
    icon: UserPlus,
    href: '/patients/new',
    color: 'bg-success/10 text-success hover:bg-success/20',
  },
  {
    title: 'Consultation',
    description: 'Démarrer une consultation',
    icon: Stethoscope,
    href: '/consultations/new',
    color: 'bg-info/10 text-info hover:bg-info/20',
    roles: ['MEDECIN'],
  },
  {
    title: 'Labo',
    description: 'Demander des analyses',
    icon: FlaskConical,
    href: '/lab/new',
    color: 'bg-warning/10 text-warning hover:bg-warning/20',
    roles: ['MEDECIN'],
  },
  {
    title: 'Ordonnance',
    description: 'Créer une prescription',
    icon: FileText,
    href: '/prescriptions/new',
    color: 'bg-accent/10 text-accent hover:bg-accent/20',
    roles: ['MEDECIN'],
  },
  {
    title: 'Rechercher',
    description: 'Trouver un patient',
    icon: Search,
    href: '/patients?search=true',
    color: 'bg-muted text-muted-foreground hover:bg-muted/80',
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return hasAnyRole(action.roles as any[]);
  });

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4 font-display">Actions rapides</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filteredActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.href)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
              action.color
            )}
          >
            <action.icon className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs opacity-70">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
