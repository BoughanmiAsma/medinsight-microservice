import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentSummaryProps {
    doctorName: string;
    dateTime: string;
    motif: string;
    onMotifChange: (motif: string) => void;
}

export function AppointmentSummary({
    doctorName,
    dateTime,
    motif,
    onMotifChange
}: AppointmentSummaryProps) {
    const appointmentDate = parseISO(dateTime);

    return (
        <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-full p-4">
                        <CheckCircle2 className="h-12 w-12 text-primary-foreground" />
                    </div>
                </div>
            </div>

            <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Confirmer votre rendez-vous</h3>
                <p className="text-muted-foreground">
                    Vérifiez les informations avant de confirmer
                </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-3">
                {/* Doctor */}
                <div className="glass-card p-4 flex items-start gap-3">
                    <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Médecin</p>
                        <p className="font-semibold">{doctorName}</p>
                    </div>
                </div>

                {/* Date */}
                <div className="glass-card p-4 flex items-start gap-3">
                    <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold">
                            {format(appointmentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                    </div>
                </div>

                {/* Time */}
                <div className="glass-card p-4 flex items-start gap-3">
                    <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Heure</p>
                        <p className="font-semibold">
                            {format(appointmentDate, 'HH:mm', { locale: fr })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Motif */}
            <div className="space-y-2">
                <Label htmlFor="motif" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Motif de la consultation
                </Label>
                <Textarea
                    id="motif"
                    placeholder="Ex: Consultation de suivi, Douleurs abdominales, Renouvellement d'ordonnance..."
                    value={motif}
                    onChange={(e) => onMotifChange(e.target.value)}
                    className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                    Décrivez brièvement la raison de votre consultation
                </p>
            </div>

            {/* Info Box */}
            <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Note :</strong> Votre rendez-vous sera en attente de confirmation par le médecin.
                    Vous recevrez une notification une fois confirmé.
                </p>
            </div>
        </div>
    );
}
