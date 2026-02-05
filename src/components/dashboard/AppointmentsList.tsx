import { Clock, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentsListProps {
  appointments: Appointment[];
}

const statusStyles = {
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
};

const statusLabels = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  if (appointments.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold text-lg mb-4 font-display">Rendez-vous du jour</h3>
        <div className="empty-state py-8">
          <Clock className="empty-state-icon" />
          <p className="text-muted-foreground">Aucun rendez-vous aujourd'hui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg font-display">Rendez-vous du jour</h3>
          <span className="text-sm text-muted-foreground">
            {appointments.length} rendez-vous
          </span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                Patient: {appointment.patientId}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {appointment.motif}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-medium text-foreground">
                {format(parseISO(appointment.appointmentDate), 'HH:mm', { locale: fr })}
              </p>
              <span className={cn(statusStyles[appointment.status])}>
                {statusLabels[appointment.status]}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}
