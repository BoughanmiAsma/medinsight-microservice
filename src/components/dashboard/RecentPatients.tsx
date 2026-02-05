import { FolderOpen, ChevronRight, Plus } from 'lucide-react';
import { Patient } from '@/types';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RecentPatientsProps {
  patients: Patient[];
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  const navigate = useNavigate();

  const calculateAge = (dateNaissance: string) => {
    return differenceInYears(new Date(), parseISO(dateNaissance));
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg font-display">Patients récents</h3>
          <Button 
            size="sm" 
            className="gap-1"
            onClick={() => navigate('/patients/new')}
          >
            <Plus className="w-4 h-4" />
            Nouveau
          </Button>
        </div>
      </div>
      
      {patients.length === 0 ? (
        <div className="empty-state py-8">
          <FolderOpen className="empty-state-icon" />
          <p className="text-muted-foreground">Aucun patient récent</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {patients.map((patient) => (
            <div 
              key={patient.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent font-medium">
                {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {patient.prenom} {patient.nom}
                </p>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(patient.dateNaissance)} ans • {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground shrink-0">
                {format(parseISO(patient.updatedAt), 'dd MMM', { locale: fr })}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
      
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/patients')}
        >
          Voir tous les patients
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
