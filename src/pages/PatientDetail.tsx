import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Calendar,
    FileText,
    Beaker,
    Plus,
    Loader2,
    User,
    Activity,
    ClipboardList,
    Printer,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, Consultation } from '@/types';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

    const { user, hasRole, hasAnyRole } = useAuth();
    const isLab = hasRole('LABORATOIRE');
    const isPharma = hasAnyRole(['PHARMACIE', 'PHARMACIEN']);
    const isDoctor = hasAnyRole(['MEDECIN', 'ADMIN']);
    const isMedical = hasAnyRole(['MEDECIN', 'ADMIN', 'INFIRMIER', 'SECRETAIRE']);

    const [testCode, setTestCode] = useState('');
    const [medicationDetails, setMedicationDetails] = useState('');
    const [consultationData, setConsultationData] = useState<Partial<Consultation>>({
        reason: '',
        diagnosis: '',
        observations: ''
    });

    // Queries
    const { data: dossiers = [] } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const resp = await api.get<Patient[]>('/dossiers');
            return resp.data;
        }
    });

    const patient = dossiers.find(p => p.id === id);

    const { data: consultations = [], isLoading: loadingConsults } = useQuery({
        queryKey: ['consultations', id],
        queryFn: async () => {
            const resp = await api.get<Consultation[]>(`/dossiers/${id}/consultations`);
            return resp.data;
        },
        enabled: !!id
    });

    const { data: analyses = [], isLoading: loadingAnalyses } = useQuery({
        queryKey: ['analyses', id],
        queryFn: async () => {
            const resp = await api.get<any[]>(`/dossiers/${id}/analyses`);
            return resp.data;
        },
        enabled: !!id
    });

    const { data: prescriptions = [], isLoading: loadingPrescriptions } = useQuery({
        queryKey: ['prescriptions', id],
        queryFn: async () => {
            const resp = await api.get<any[]>(`/prescriptions/dossier/${id}`);
            return resp.data;
        },
        enabled: !!id
    });

    // Mutations
    const consultMutation = useMutation({
        mutationFn: (data: Partial<Consultation>) => api.post(`/dossiers/${id}/consultations`, {
            ...data,
            doctorLastName: user?.nom || '',
            doctorFirstName: user?.prenom || '',
            consultationDate: new Date().toISOString()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultations', id] });
            setIsConsultationModalOpen(false);
            setConsultationData({ reason: '', diagnosis: '', observations: '' });
            toast.success('Consultation enregistrée');
        },
        onError: (error: any) => {
            console.error('Error saving consultation:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l’enregistrement de la consultation');
        }
    });

    const labMutation = useMutation({
        mutationFn: (testCode: string) => api.post(`/dossiers/${id}/consultations/${consultations[0]?.id || 'latest'}/lab-orders`, { testCode }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analyses', id] });
            setIsLabModalOpen(false);
            setTestCode('');
            toast.success('Demande d’analyse envoyée');
        },
        onError: (error: any) => {
            toast.error('Erreur lors de l’envoi de la demande d’analyse');
        }
    });

    const prescriptionMutation = useMutation({
        mutationFn: (details: string) => api.post(`/dossiers/${id}/consultations/${consultations[0]?.id || 'latest'}/prescriptions`, { medicationDetails: details }),
        onSuccess: async () => {
            // Wait 1 second for Kafka processing
            await new Promise(url => setTimeout(url, 1000));
            queryClient.invalidateQueries({ queryKey: ['consultations', id] });
            queryClient.invalidateQueries({ queryKey: ['prescriptions', id] });
            setIsPrescriptionModalOpen(false);
            setMedicationDetails('');
            toast.success('Ordonnance envoyée');
        },
        onError: (error: any) => {
            toast.error('Erreur lors de l’envoi de l’ordonnance');
        }
    });

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['consultations', id] });
        queryClient.invalidateQueries({ queryKey: ['analyses', id] });
        queryClient.invalidateQueries({ queryKey: ['prescriptions', id] });
        toast.info('Données actualisées');
    };

    if (!patient) return <div className="p-8 text-center">Dossier introuvable</div>;

    return (
        <div className="page-transition space-y-6">
            <Button
                variant="ghost"
                className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/patients')}
            >
                <ArrowLeft className="w-4 h-4" />
                Retour aux dossiers
            </Button>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side: Patient Info */}
                <div className="w-full lg:w-80 space-y-6">
                    <Card>
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{patient.prenom} {patient.nom}</CardTitle>
                            <CardDescription>ID Patient: {patient.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4 border-t">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Contact</p>
                                <p className="text-sm">{patient.email || 'Pas d\'email'}</p>
                                <p className="text-sm">{patient.telephone || 'Pas de téléphone'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Infos Vitales</p>
                                <p className="text-sm">Sexe: {patient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                                <p className="text-sm">Groupe: <span className="text-primary font-medium">{patient.groupeSanguin || 'Inconnu'}</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {isDoctor && (
                                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsConsultationModalOpen(true)}>
                                    <Plus className="w-4 h-4" /> Nouvelle Consultation
                                </Button>
                            )}
                            <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsLabModalOpen(true)}>
                                <Beaker className="w-4 h-4" /> {isLab ? 'Écrire Analyse' : 'Demander Analyse'}
                            </Button>
                            {isDoctor && (
                                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsPrescriptionModalOpen(true)}>
                                    <FileText className="w-4 h-4" /> Nouvelle Ordonnance
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Tabs */}
                <div className="flex-1 min-w-0">
                    <Tabs defaultValue={isLab ? "analyses" : isPharma ? "prescriptions" : "consultations"} className="space-y-4">
                        <TabsList>
                            {isMedical && (
                                <TabsTrigger value="consultations" className="gap-2">
                                    <Activity className="w-4 h-4" /> Consultations
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="analyses" className="gap-2">
                                <Beaker className="w-4 h-4" /> Analyses
                            </TabsTrigger>
                            {(isMedical || isPharma) && (
                                <TabsTrigger value="prescriptions" className="gap-2">
                                    <FileText className="w-4 h-4" /> Ordonnances
                                </TabsTrigger>
                            )}
                            {isMedical && (
                                <TabsTrigger value="vitals" className="gap-2">
                                    <ClipboardList className="w-4 h-4" /> Antécédents
                                </TabsTrigger>
                            )}
                            <Button variant="ghost" size="sm" onClick={refreshData} className="ml-auto gap-2">
                                <RefreshCw className="w-4 h-4" /> Actualiser
                            </Button>
                        </TabsList>

                        {/* Tab Content */}
                        {isMedical && (
                            <TabsContent value="consultations" className="space-y-4">
                                {loadingConsults ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : consultations.length > 0 ? (
                                    consultations.map((c) => (
                                        <Card key={c.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-md">{c.reason || c.motif}</CardTitle>
                                                        <CardDescription>
                                                            {format(parseISO(c.consultationDate), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline">Dr. {c.medecinNom || c.doctorLastName || 'Inconnu'}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Diagnostic</p>
                                                    <p className="text-sm">{c.diagnosis || c.diagnostic || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                                                    <p className="text-sm">{c.observations || c.notes || 'N/A'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                                        <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                        <p className="text-muted-foreground">Aucune consultation enregistrée</p>
                                    </Card>
                                )}
                            </TabsContent>
                        )}

                        <TabsContent value="analyses" className="space-y-4">
                            {loadingAnalyses ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : analyses.length > 0 ? (
                                analyses.map((a, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <div className="flex justify-between">
                                                <CardTitle className="text-md">Résultat d'analyse</CardTitle>
                                                <Badge variant="secondary" className="bg-success/10 text-success">Complété</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm font-medium">{a.testType || a.fileName || 'Analyse de routine'}</p>
                                            <p className="text-xs text-muted-foreground">Daté du {format(parseISO(a.dateResultat || a.createdAt || a.receivedAt), 'dd/MM/yyyy')}</p>
                                            <Button variant="link" className="px-0 h-auto text-primary mt-2">Voir le rapport d'analyse</Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="flex flex-col items-center justify-center p-12 text-center">
                                    <Beaker className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-muted-foreground">Aucun résultat d'analyse disponible</p>
                                </Card>
                            )}
                        </TabsContent>



                        {(isMedical || isPharma) && (
                            <TabsContent value="prescriptions" className="space-y-4">
                                {loadingPrescriptions ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : prescriptions.length > 0 ? (
                                    prescriptions.map((p, idx) => (
                                        <Card key={idx}>
                                            <CardHeader>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <CardTitle className="text-md">Ordonnance #{p.id}</CardTitle>
                                                        {p.createdAt && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Émise le {format(parseISO(p.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{p.status || 'EN_ATTENTE'}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">{p.medicationDetails || 'Détails non disponibles'}</p>
                                                <div className="flex justify-end mt-2">
                                                    <Button variant="ghost" size="sm" className="gap-2">
                                                        <Printer className="w-4 h-4" /> Imprimer
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                                        <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                        <p className="text-muted-foreground">Aucune ordonnance enregistrée</p>
                                    </Card>
                                )}
                            </TabsContent>
                        )}

                        {isMedical && (
                            <TabsContent value="vitals">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Historique Médical</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-semibold">Allergies</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {patient.allergies?.map((a, i) => <Badge key={i} variant="destructive">{a}</Badge>) || 'Aucune'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Antécédents</p>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                                {patient.antecedents?.map((a, i) => <li key={i}>{a}</li>) || 'Aucun'}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nouvelle Consultation</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Motif</Label>
                            <Input value={consultationData.reason} onChange={e => setConsultationData({ ...consultationData, reason: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Diagnostic</Label>
                            <Textarea value={consultationData.diagnosis} onChange={e => setConsultationData({ ...consultationData, diagnosis: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes (Observations)</Label>
                            <Textarea value={consultationData.observations} onChange={e => setConsultationData({ ...consultationData, observations: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => consultMutation.mutate(consultationData)} disabled={consultMutation.isPending}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLabModalOpen} onOpenChange={setIsLabModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Demander une analyse</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Type de test (Code)</Label>
                        <Input placeholder="ex: NFS, Glycémie..." value={testCode} onChange={e => setTestCode(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => labMutation.mutate(testCode)} disabled={labMutation.isPending}>Envoyer au laboratoire</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nouvelle Ordonnance</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Détails des médicaments</Label>
                        <Textarea placeholder="ex: Paracétamol 500mg, 1 matin et soir pendant 5 jours..." value={medicationDetails} onChange={e => setMedicationDetails(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => prescriptionMutation.mutate(medicationDetails)} disabled={prescriptionMutation.isPending}>Envoyer à la pharmacie</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default PatientDetail;
