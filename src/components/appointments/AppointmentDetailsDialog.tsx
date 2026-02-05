import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, PlayCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentDetailsDialogProps {
    appointment: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (id: number, newStatus: string) => void;
    isUpdating?: boolean;
}

const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
};

export function AppointmentDetailsDialog({
    appointment,
    isOpen,
    onClose,
    onStatusChange,
    isUpdating = false
}: AppointmentDetailsDialogProps) {
    const { hasRole } = useAuth();

    // Only doctors and secretaries can manage appointments usually
    const canManage = hasRole('MEDECIN') || hasRole('SECRETAIRE');

    if (!appointment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        Rendez-vous
                        <Badge
                            variant="outline"
                            className={cn("ml-2 font-normal", statusStyles[appointment.status] || statusStyles.PENDING)}
                        >
                            {statusLabels[appointment.status] || appointment.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Détails du rendez-vous sélectionné
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Time & Date */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-semibold text-foreground">
                                {format(parseISO(appointment.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr })}
                            </p>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Clock className="h-4 w-4" />
                                <span>{format(parseISO(appointment.appointmentDate), 'HH:mm')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Patient</h4>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Dossier #{appointment.patientId.substring(0, 8)}...</p>
                                <p className="text-xs text-muted-foreground">{appointment.patientId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reason / Motif */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Motif</h4>
                        <div className="flex gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <p className="text-sm leading-relaxed">
                                {appointment.motif || appointment.notes || "Aucun motif précisé"}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
                    {/* Actions for Status Management */}
                    {canManage && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                        <>
                            {appointment.status === 'PENDING' && (
                                <Button
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}
                                    disabled={isUpdating}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirmer
                                </Button>
                            )}

                            {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                                <Button
                                    variant="default" // Completed is often primary action when confirmed
                                    onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
                                    disabled={isUpdating}
                                    className="w-full sm:w-auto"
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Terminer
                                </Button>
                            )}

                            <Button
                                variant="destructive"
                                onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
                                disabled={isUpdating}
                                className="w-full sm:w-auto"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
                            </Button>
                        </>
                    )}

                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto mt-2 sm:mt-0">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
