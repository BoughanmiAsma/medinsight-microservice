import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Stethoscope,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Consultation } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mock data
const mockConsultations: Consultation[] = [
  {
    id: '1',
    dossierId: '1',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateConsultation: new Date().toISOString(),
    motif: 'Douleurs abdominales',
    symptomes: 'Douleurs diffuses, nausées légères',
    diagnostic: 'Gastrite aiguë',
    notes: 'Prescription d\'IPP pendant 2 semaines',
    visiteType: 'En cabinet',
  },
  {
    id: '2',
    dossierId: '2',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateConsultation: new Date(Date.now() - 86400000).toISOString(),
    motif: 'Suivi diabète type 2',
    symptomes: 'RAS',
    diagnostic: 'Diabète équilibré',
    notes: 'HbA1c à 6.8%, continuer traitement actuel',
    visiteType: 'Téléconsultation',
  },
  {
    id: '3',
    dossierId: '3',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateConsultation: new Date(Date.now() - 172800000).toISOString(),
    motif: 'Renouvellement ordonnance',
    symptomes: 'Tension artérielle stable',
    notes: 'Renouvellement pour 3 mois',
    visiteType: 'En cabinet',
  },
];

const Consultations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [consultations] = useState<Consultation[]>(mockConsultations);

  const filteredConsultations = consultations.filter(c =>
    c.motif.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.diagnostic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Consultations</h1>
          <p className="page-subtitle">
            Historique et gestion des consultations
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nouvelle Consultation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par motif ou diagnostic..."
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

      {/* Consultations List */}
      <div className="space-y-4">
        {filteredConsultations.map((consultation) => (
          <div 
            key={consultation.id}
            className="glass-card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="icon-info shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{consultation.motif}</h3>
                    <Badge variant="outline" className="bg-muted">
                      {consultation.visiteType}
                    </Badge>
                  </div>
                  
                  {consultation.diagnostic && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Diagnostic: </span>
                      {consultation.diagnostic}
                    </p>
                  )}
                  
                  {consultation.symptomes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Symptômes: </span>
                      {consultation.symptomes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {format(parseISO(consultation.dateConsultation), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                    {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {consultation.prescriptions.length} ordonnance(s)
                      </div>
                    )}
                    {consultation.labOrders && consultation.labOrders.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4" />
                        {consultation.labOrders.length} analyse(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {filteredConsultations.length === 0 && (
        <div className="empty-state">
          <Stethoscope className="empty-state-icon" />
          <p className="text-muted-foreground">Aucune consultation trouvée</p>
        </div>
      )}
    </div>
  );
};

export default Consultations;
