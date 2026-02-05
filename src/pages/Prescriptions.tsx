import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Printer,
  Copy,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Prescription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';

const Prescriptions = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isAuthorized = hasRole('MEDECIN') || hasRole('PHARMACIE') || hasRole('ADMIN');
  const isPharma = hasRole('PHARMACIE');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: prescriptions = [], isLoading, error } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const response = await api.get<Prescription[]>('/prescriptions');
      return response.data;
    },
    enabled: isAuthorized
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      api.put(`/prescriptions/${data.id}/status`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Ordonnance marquée comme délivrée');
    },
    onError: (error: any) => {
      console.error('Error updating prescription:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });

  const filteredPrescriptions = prescriptions.filter(p =>
    p.dossierId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.medicationDetails.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CREATED': return 'Créée';
      case 'VALIDATED': return 'Validée';
      case 'PENDING': return 'En attente';
      case 'COMPLETED': return 'Terminée';
      case 'DISPENSED': return 'Délivrée';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPENSED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CREATED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VALIDATED': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!isAuthorized) {
    return <div className="p-8 text-center text-destructive font-medium">Accès refusé. Rôle insuffisant.</div>;
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Erreur lors du chargement des ordonnances.
    </div>
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Ordonnances</h1>
          <p className="page-subtitle">
            Gérez les prescriptions médicales
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par dossier ou médicament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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
                  <p className="font-medium">Dossier: {prescription.dossierId}</p>
                  <p className="text-sm text-muted-foreground">Cmd #{prescription.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className={cn(getStatusColor(prescription.status))}>
                  {getStatusLabel(prescription.status)}
                </Badge>
                {prescription.status === 'DISPENSED' && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Médicaments achetés
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap text-sm">
                {prescription.medicationDetails}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20">
              {isPharma && prescription.status !== 'DISPENSED' && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updatePrescriptionMutation.mutate({ id: prescription.id!, status: 'DISPENSED' })}
                  disabled={updatePrescriptionMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" /> Marquer comme délivrée
                </Button>
              )}
              <Button variant="outline" size="sm" className={cn("gap-2", isPharma && prescription.status !== 'DISPENSED' ? 'flex-1' : 'flex-1')}>
                <Printer className="w-4 h-4" />
                Imprimer
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
