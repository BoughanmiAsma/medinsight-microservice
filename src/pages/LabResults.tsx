import { useState } from 'react';
import { 
  Search, 
  Filter, 
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LabOrder, LabOrderStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mock data
const mockLabOrders: LabOrder[] = [
  {
    id: '1',
    patientId: '1',
    patientNom: 'Marie Dupont',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateCommande: new Date().toISOString(),
    tests: [
      { code: 'NFS', nom: 'Numération Formule Sanguine' },
      { code: 'GLY', nom: 'Glycémie à jeun' },
    ],
    statut: 'PENDING',
    priorite: 'NORMAL',
  },
  {
    id: '2',
    patientId: '2',
    patientNom: 'Pierre Bernard',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateCommande: new Date(Date.now() - 86400000).toISOString(),
    tests: [
      { code: 'HBA1C', nom: 'Hémoglobine glyquée', resultat: '6.8', unite: '%', valeurReference: '< 7%', interpretation: 'NORMAL' },
      { code: 'CREAT', nom: 'Créatinine', resultat: '95', unite: 'µmol/L', valeurReference: '60-110', interpretation: 'NORMAL' },
    ],
    statut: 'COMPLETED',
    priorite: 'NORMAL',
    dateResultat: new Date().toISOString(),
  },
  {
    id: '3',
    patientId: '3',
    patientNom: 'Sophie Leroy',
    medecinId: '1',
    medecinNom: 'Dr. Martin',
    dateCommande: new Date(Date.now() - 3600000).toISOString(),
    tests: [
      { code: 'TSH', nom: 'TSH ultra-sensible' },
      { code: 'T4', nom: 'T4 libre' },
    ],
    statut: 'IN_PROGRESS',
    priorite: 'URGENT',
    technicienId: '4',
    technicienNom: 'Anne Moreau',
  },
];

const statusConfig: Record<LabOrderStatus, { label: string; icon: React.ComponentType<any>; class: string }> = {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [labOrders] = useState<LabOrder[]>(mockLabOrders);
  const [activeTab, setActiveTab] = useState('all');

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.patientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tests.some(t => t.nom.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && (order.statut === 'PENDING' || order.statut === 'IN_PROGRESS');
    if (activeTab === 'completed') return matchesSearch && order.statut === 'COMPLETED';
    return matchesSearch;
  });

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
                placeholder="Rechercher par patient ou analyse..."
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
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.statut];
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
                      <p className="font-medium">{order.patientNom}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(order.dateCommande), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.priorite === 'URGENT' && (
                      <Badge variant="destructive" className="uppercase text-xs">
                        Urgent
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn(statusInfo.class)}>
                      <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Tests */}
                <div className="p-4 space-y-3">
                  {order.tests.map((test, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        test.resultat ? "bg-muted/30" : "bg-muted/50"
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">{test.nom}</p>
                        <p className="text-xs text-muted-foreground">{test.code}</p>
                      </div>
                      {test.resultat ? (
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            test.interpretation === 'NORMAL' 
                              ? "text-success" 
                              : "text-destructive"
                          )}>
                            {test.resultat} {test.unite}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Réf: {test.valeurReference}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          En attente
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {order.statut === 'COMPLETED' && (
                  <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      Résultats disponibles le {format(parseISO(order.dateResultat!), "d MMM yyyy", { locale: fr })}
                    </p>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileDown className="w-4 h-4" />
                      Télécharger PDF
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <FlaskConical className="empty-state-icon" />
          <p className="text-muted-foreground">Aucune analyse trouvée</p>
        </div>
      )}
    </div>
  );
};

export default LabResults;
