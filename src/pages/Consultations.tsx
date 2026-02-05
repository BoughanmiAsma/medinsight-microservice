import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Stethoscope,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { cn } from '@/lib/utils';
import { Consultation } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';

const Consultations = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all dossiers to aggregate consultations (Temporary solution as no global endpoint exists)
  // In a real app, we would add GET /dossiers/consultations/all endpoint
  const { data: consultations = [], isLoading, error } = useQuery({
    queryKey: ['all-consultations'],
    queryFn: async () => {
      // 1. Get all dossiers
      const dossiersRes = await api.get<any[]>('/dossiers');
      const dossiers = dossiersRes.data;
      
      // 2. For each dossier, get consultations
      const allConsultations: Consultation[] = [];
      
      // Using Promise.all to fetch concurrently
      await Promise.all(dossiers.map(async (d: any) => {
        try {
            const consultsRes = await api.get<Consultation[]>(`/dossiers/${d.id}/consultations`);
            // Enrich with patient info if needed
            const consults = consultsRes.data.map(c => ({
                ...c,
                patientNom: d.nom,
                patientPrenom: d.prenom
            }));
            allConsultations.push(...consults);
        } catch (e) {
            console.error(`Failed to fetch consultations for dossier ${d.id}`, e);
        }
      }));
      
      // Sort by date desc
      return allConsultations.sort((a, b) => 
        new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime()
      );
    }
  });

  const filteredConsultations = consultations.filter(c =>
    c.motif?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.diagnostic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Erreur lors du chargement des consultations.
    </div>
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
                    {/* Display Patient Name if available (added in fetch) */}
                    {(consultation as any).patientNom && (
                        <Badge variant="outline" className="bg-primary/5 text-primary">
                            {(consultation as any).patientPrenom} {(consultation as any).patientNom}
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-muted">
                      {consultation.visiteType || 'Consultation'}
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
