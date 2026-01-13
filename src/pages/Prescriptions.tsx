import { useState } from 'react';
import { 
  Plus,
  Search, 
  Filter, 
  FileText,
  Clock,
  User,
  Printer,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Prescription } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mock data
const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    consultationId: '1',
    medecinId: '1',
    medecinNom: 'Dr. Jean Martin',
    patientId: '1',
    patientNom: 'Marie Dupont',
    datePrescription: new Date().toISOString(),
    medications: [
      {
        nom: 'Oméprazole 20mg',
        dosage: '20mg',
        frequence: '1 fois par jour',
        duree: '14 jours',
        instructions: 'À prendre le matin à jeun',
      },
      {
        nom: 'Gaviscon',
        dosage: '10ml',
        frequence: '3 fois par jour',
        duree: '14 jours',
        instructions: 'Après les repas',
      },
    ],
    statut: 'ACTIVE',
  },
  {
    id: '2',
    consultationId: '2',
    medecinId: '1',
    medecinNom: 'Dr. Jean Martin',
    patientId: '2',
    patientNom: 'Pierre Bernard',
    datePrescription: new Date(Date.now() - 86400000).toISOString(),
    medications: [
      {
        nom: 'Metformine 500mg',
        dosage: '500mg',
        frequence: '2 fois par jour',
        duree: '90 jours',
        instructions: 'Pendant les repas',
      },
    ],
    statut: 'ACTIVE',
    notes: 'Renouvellement trimestriel - Surveillance HbA1c',
  },
  {
    id: '3',
    consultationId: '3',
    medecinId: '1',
    medecinNom: 'Dr. Jean Martin',
    patientId: '3',
    patientNom: 'Sophie Leroy',
    datePrescription: new Date(Date.now() - 604800000).toISOString(),
    medications: [
      {
        nom: 'Amlodipine 5mg',
        dosage: '5mg',
        frequence: '1 fois par jour',
        duree: '30 jours',
      },
    ],
    statut: 'COMPLETED',
  },
];

const statusStyles = {
  ACTIVE: 'bg-success/10 text-success border-success/20',
  COMPLETED: 'bg-muted text-muted-foreground border-muted',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels = {
  ACTIVE: 'Active',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const Prescriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions] = useState<Prescription[]>(mockPrescriptions);

  const filteredPrescriptions = prescriptions.filter(p =>
    p.patientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.medications.some(m => m.nom.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Ordonnances</h1>
          <p className="page-subtitle">
            Créez et gérez les prescriptions
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nouvelle Ordonnance
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par patient ou médicament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          Filtrer
        </Button>
      </div>

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPrescriptions.map((prescription) => (
          <div 
            key={prescription.id}
            className="glass-card overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{prescription.patientNom}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {format(parseISO(prescription.datePrescription), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn(statusStyles[prescription.statut])}>
                {statusLabels[prescription.statut]}
              </Badge>
            </div>

            {/* Medications */}
            <div className="p-4 space-y-3">
              {prescription.medications.map((med, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{med.nom}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {med.frequence} • {med.duree}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {med.dosage}
                    </Badge>
                  </div>
                  {med.instructions && (
                    <p className="text-sm text-primary mt-2 italic">
                      ℹ️ {med.instructions}
                    </p>
                  )}
                </div>
              ))}
              
              {prescription.notes && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  <span className="font-medium">Note: </span>
                  {prescription.notes}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Printer className="w-4 h-4" />
                Imprimer
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Copy className="w-4 h-4" />
                Dupliquer
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredPrescriptions.length === 0 && (
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <p className="text-muted-foreground">Aucune ordonnance trouvée</p>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
