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
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useLanguage } from '@/contexts/LanguageContext';
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
    const { t, language } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

    const { user, hasRole, hasAnyRole } = useAuth();
    const isLab = hasRole('LABORATOIRE');
    const isPharma = hasRole('PHARMACIE');
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
            const resp = await api.get<any[]>(`/lab-orders?dossierId=${id}`);
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
            toast.success(t('common.success.consultation'));
        },
        onError: (error: any) => {
            console.error('Error saving consultation:', error);
            toast.error(error.response?.data?.message || t('common.error'));
        }
    });

    const labMutation = useMutation({
        mutationFn: (testCode: string) => api.post(`/dossiers/${id}/consultations/${consultations[0]?.id || 'latest'}/lab-orders`, { testCode }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analyses', id] });
            setIsLabModalOpen(false);
            setTestCode('');
            toast.success(t('common.success.lab_order'));
        },
        onError: (error: any) => {
            console.error('Error sending lab order:', error);
            toast.error(error.response?.data?.message || t('common.error'));
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
            toast.success(t('common.success.prescription'));
        },
        onError: (error: any) => {
            console.error('Error sending prescription:', error);
            toast.error(error.response?.data?.message || t('common.error'));
        }
    });

    const updatePrescriptionMutation = useMutation({
        mutationFn: (data: { id: number; status: string }) => api.put(`/prescriptions/${data.id}/status`, { status: data.status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions', id] });
            toast.success(t('common.success.status_updated'));
        },
        onError: (error: any) => {
            console.error('Error updating prescription:', error);
            toast.error(error.response?.data?.message || t('common.error'));
        }
    });

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['consultations', id] });
        queryClient.invalidateQueries({ queryKey: ['analyses', id] });
        queryClient.invalidateQueries({ queryKey: ['prescriptions', id] });
        toast.info(t('common.refresh_info'));
    };

    if (!patient) return <div className="p-8 text-center">{t('common.not_found')}</div>;

    return (
        <div className="page-transition space-y-6">
            <Button
                variant="ghost"
                className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/patients')}
            >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back_to_records')}
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
                            <CardDescription>{t('common.id_patient')}: {patient.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4 border-t">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">{t('patient.info.contact')}</p>
                                <p className="text-sm">{patient.email || t('common.email_none')}</p>
                                <p className="text-sm">{patient.telephone || t('common.phone_none')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">{t('patient.info.vital_signs')}</p>
                                <p className="text-sm">{t('patient.form.sex')}: {patient.sexe === 'M' ? t('common.male_gender') : t('common.female_gender')}</p>
                                <p className="text-sm">{t('patient.form.weight')}: <span className="font-medium">{patient.poids !== undefined && patient.poids !== null ? `${patient.poids} ${t('common.weight_kg')}` : t('common.unknown')}</span></p>
                                <p className="text-sm">{t('patient.form.blood_group')}: <span className="text-primary font-medium">{patient.groupeSanguin || t('common.unknown')}</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    {!hasRole('PATIENT') && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">{t('common.actions.quick')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {isDoctor && (
                                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsConsultationModalOpen(true)}>
                                        <Plus className="w-4 h-4" /> {t('patient.actions.new_consultation')}
                                    </Button>
                                )}
                                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsLabModalOpen(true)}>
                                    <Beaker className="w-4 h-4" /> {isLab ? t('common.lab.write_analysis') : t('common.lab.request_analysis')}
                                </Button>
                                {isDoctor && (
                                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsPrescriptionModalOpen(true)}>
                                        <FileText className="w-4 h-4" /> {t('patient.actions.new_prescription')}
                                    </Button>
                                )}
                                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => { toast.info(t('common.preparing_report')); setTimeout(() => window.print(), 500); }}>
                                    <Printer className="w-4 h-4" /> {t('common.actions.generate_report')}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Side: Tabs */}
                <div className="flex-1 min-w-0">
                    <Tabs defaultValue={isLab ? "analyses" : isPharma ? "prescriptions" : "consultations"} className="space-y-4">
                        <TabsList>
                            {isMedical && (
                                <TabsTrigger value="consultations" className="gap-2">
                                    <Activity className="w-4 h-4" /> {t('patient.tabs.consultations')}
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="analyses" className="gap-2">
                                <Beaker className="w-4 h-4" /> {t('patient.tabs.analyses')}
                            </TabsTrigger>
                            {(isMedical || isPharma || hasRole('PATIENT')) && (
                                <TabsTrigger value="prescriptions" className="gap-2">
                                    <FileText className="w-4 h-4" /> {t('patient.tabs.prescriptions')}
                                </TabsTrigger>
                            )}
                            {isMedical && (
                                <TabsTrigger value="vitals" className="gap-2">
                                    <ClipboardList className="w-4 h-4" /> {t('patient.tabs.medical_history')}
                                </TabsTrigger>
                            )}
                            <Button variant="ghost" size="sm" onClick={refreshData} className="ml-auto gap-2">
                                <RefreshCw className="w-4 h-4" /> {t('common.actions.refresh')}
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
                                                        <CardTitle className="text-md">{c.reason || c.motif || t('common.reason')}</CardTitle>
                                                        <CardDescription>
                                                            {format(parseISO(c.consultationDate), 'dd MMMM yyyy HH:mm', { locale: language === 'fr' ? fr : undefined })}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline">{t('common.doctor')} {c.medecinNom || c.doctorLastName || t('common.unknown')}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">{t('common.diagnosis')}</p>
                                                    <p className="text-sm">{c.diagnosis || c.diagnostic || '---'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">{t('common.notes')}</p>
                                                    <p className="text-sm">{c.observations || c.notes || '---'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                                        <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                        <p className="text-muted-foreground">{t('common.no_consultation')}</p>
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
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-md font-bold text-primary">
                                                        {t('nav.lab')}: {a.testCode || t('common.unknown')}
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('common.id_request')}: {a.id}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={a.status === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}
                                                >
                                                    {a.status === 'COMPLETED' ? t('lab.status.completed') : t('lab.status.pending')}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {a.status === 'COMPLETED' ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-muted-foreground">{t('common.result_available')}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-start text-success border-success/20 hover:bg-success/5"
                                                        onClick={() => a.result && window.open(a.result, '_blank')}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        {t('common.view_analysis_report')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">
                                                    {t('common.lab_processing')}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="flex flex-col items-center justify-center p-12 text-center">
                                    <Beaker className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-muted-foreground">{t('common.no_lab_results')}</p>
                                </Card>
                            )}
                        </TabsContent>



                        {(isMedical || isPharma || hasRole('PATIENT')) && (
                            <TabsContent value="prescriptions" className="space-y-4">
                                {loadingPrescriptions ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : prescriptions.length > 0 ? (
                                    prescriptions.map((p, idx) => (
                                        <Card key={idx}>
                                            <CardHeader>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <CardTitle className="text-md">{t('nav.prescriptions')} #{p.id}</CardTitle>
                                                        {p.createdAt && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('common.emitted_on')} {format(parseISO(p.createdAt), 'dd MMMM yyyy HH:mm', { locale: language === 'fr' ? fr : undefined })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="outline" className={cn(
                                                            p.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                        )}>
                                                            {p.status === 'VALIDATED' ? t('prescription.status.validated') || 'Validée' :
                                                                p.status === 'PENDING' ? t('lab.status.pending') :
                                                                    p.status === 'COMPLETED' ? t('lab.status.completed') :
                                                                        p.status === 'CREATED' ? t('prescription.status.created') :
                                                                            p.status === 'DISPENSED' ? t('prescription.status.dispensed') :
                                                                                p.status || t('lab.status.pending')}
                                                        </Badge>
                                                        {p.status === 'DISPENSED' && (
                                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> {t('prescription.medications_purchased')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">{p.medicationDetails || t('common.medication_details_none')}</p>
                                                {!hasRole('PATIENT') && (
                                                    <div className="flex justify-end mt-2 gap-2">
                                                        {isPharma && p.status !== 'DISPENSED' && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => updatePrescriptionMutation.mutate({ id: p.id!, status: 'DISPENSED' })}
                                                                disabled={updatePrescriptionMutation.isPending}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" /> Marquer comme délivrée
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="gap-2">
                                                            <Printer className="w-4 h-4" /> Imprimer
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                                        <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                        <p className="text-muted-foreground">{t('common.no_prescriptions')}</p>
                                    </Card>
                                )}
                            </TabsContent>
                        )}

                        {isMedical && (
                            <TabsContent value="vitals">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('patient.tabs.medical_history')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-semibold">{t('patient.tabs.medical_history')}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {patient.allergies?.map((a, i) => <Badge key={i} variant="destructive">{a}</Badge>) || t('common.no_data')}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{t('patient.tabs.medical_history')}</p>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                                {patient.antecedents?.map((a, i) => <li key={i}>{a}</li>) || t('common.no_data')}
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
                    <DialogHeader><DialogTitle>{t('patient.actions.new_consultation')}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('common.reason')}</Label>
                            <Input value={consultationData.reason} onChange={e => setConsultationData({ ...consultationData, reason: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('common.diagnosis')}</Label>
                            <Textarea value={consultationData.diagnosis} onChange={e => setConsultationData({ ...consultationData, diagnosis: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('common.notes')}</Label>
                            <Textarea value={consultationData.observations} onChange={e => setConsultationData({ ...consultationData, observations: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => consultMutation.mutate(consultationData)} disabled={consultMutation.isPending}>
                            {consultMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLabModalOpen} onOpenChange={setIsLabModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{isLab ? t('common.lab.write_analysis') : t('common.lab.request_analysis')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>{t('lab.type') || 'Type d\'analyse'}</Label>
                        <Input placeholder="ex: NFS, Glycémie..." value={testCode} onChange={e => setTestCode(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => labMutation.mutate(testCode)} disabled={labMutation.isPending}>
                            {labMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('patient.actions.new_prescription')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>{t('prescription.medications') || 'Détails des médicaments'}</Label>
                        <Textarea placeholder="ex: Paracétamol 500mg, 1 matin et soir pendant 5 jours..." value={medicationDetails} onChange={e => setMedicationDetails(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => prescriptionMutation.mutate(medicationDetails)} disabled={prescriptionMutation.isPending}>
                            {prescriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default PatientDetail;
