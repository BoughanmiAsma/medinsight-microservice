import { useState } from 'react';
import {
  Search,
  Filter,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LabOrder } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; class: string }> = {
  PENDING: {
    label: 'En attente',
    icon: Clock,
    class: 'bg-warning/10 text-warning border-warning/20'
  },
  IN_PROGRESS: {
    label: 'En cours',
    icon: FlaskConical,
    class: 'bg-info/10 text-info border-info/20'
  },
  COMPLETED: {
    label: 'Terminé',
    icon: CheckCircle2,
    class: 'bg-success/10 text-success border-success/20'
  },
  CANCELLED: {
    label: 'Annulé',
    icon: AlertCircle,
    class: 'bg-destructive/10 text-destructive border-destructive/20'
  },
};

const LabResults = () => {
  const { hasRole } = useAuth();
  const isTechnician = hasRole('TECHNICIEN') || hasRole('ADMIN') || hasRole('LABORATOIRE');
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data: labOrders = [], isLoading, error } = useQuery({
    queryKey: ['labOrders'],
    queryFn: async () => {
      const response = await api.get<LabOrder[]>('/lab-orders');
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ dossierId, file, labOrderId }: { dossierId: string; file: File; labOrderId?: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossierId', dossierId);
      if (labOrderId) {
        formData.append('labOrderId', labOrderId.toString());
      }
      return api.post('/lab/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labOrders'] });
      setIsUploadModalOpen(false);
      setFile(null);
      setSelectedOrder(null);
      toast.success('Rapport uploadé avec succès');
    },
    onError: () => toast.error("Erreur lors de l'upload")
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder && file) {
      uploadMutation.mutate({
        dossierId: selectedOrder.dossierId,
        file,
        labOrderId: selectedOrder.id
      });
    }
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.dossierId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.testCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && (order.status === 'PENDING' || order.status === 'IN_PROGRESS');
    if (activeTab === 'completed') return matchesSearch && order.status === 'COMPLETED';
    return matchesSearch;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Erreur lors du chargement des commandes labo.
    </div>
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Laboratoire</h1>
          <p className="page-subtitle">
            Suivi des analyses et résultats
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par dossier ou analyse..."
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
        </div>

        <TabsContent value={activeTab} className="mt-0 space-y-4">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className="glass-card overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Dossier: {order.dossierId}</p>
                      <p className="text-sm text-muted-foreground">
                        Cmd #{order.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(statusInfo.class)}>
                      <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Tests */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary">{order.testCode}</p>
                    <p className="text-xs text-muted-foreground">Consultation: {order.consultationId}</p>
                  </div>

                  {isTechnician && order.status !== 'COMPLETED' && (
                    <Button
                      className="gap-2"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsUploadModalOpen(true);
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Compléter
                    </Button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Rapport envoyé
                    </Badge>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center p-8 text-muted-foreground">
              Aucune commande trouvée.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader un résultat</DialogTitle>
            <DialogDescription>
              Sélectionnez le fichier du rapport pour le dossier {selectedOrder?.dossierId}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Fichier (PDF, Image...)</Label>
              <Input id="file" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabResults;
