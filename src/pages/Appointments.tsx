import { useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment, AppointmentStatus } from '@/types';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mock data
const generateMockAppointments = (): Appointment[] => {
  const today = new Date();
  return [
    {
      id: '1',
      patientId: '1',
      patientNom: 'Dupont',
      patientPrenom: 'Marie',
      medecinId: '1',
      medecinNom: 'Dr. Martin',
      dateHeure: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
      duree: 30,
      motif: 'Consultation générale',
      statut: 'CONFIRMED',
    },
    {
      id: '2',
      patientId: '2',
      patientNom: 'Bernard',
      patientPrenom: 'Pierre',
      medecinId: '1',
      medecinNom: 'Dr. Martin',
      dateHeure: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
      duree: 45,
      motif: 'Suivi diabète',
      statut: 'PENDING',
    },
    {
      id: '3',
      patientId: '3',
      patientNom: 'Leroy',
      patientPrenom: 'Sophie',
      medecinId: '1',
      medecinNom: 'Dr. Martin',
      dateHeure: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
      duree: 30,
      motif: 'Renouvellement ordonnance',
      statut: 'CONFIRMED',
    },
    {
      id: '4',
      patientId: '4',
      patientNom: 'Moreau',
      patientPrenom: 'Jean',
      medecinId: '1',
      medecinNom: 'Dr. Martin',
      dateHeure: addDays(new Date().setHours(11, 0, 0, 0), 1).toString(),
      duree: 60,
      motif: 'Bilan complet',
      statut: 'CONFIRMED',
    },
    {
      id: '5',
      patientId: '1',
      patientNom: 'Dupont',
      patientPrenom: 'Marie',
      medecinId: '1',
      medecinNom: 'Dr. Martin',
      dateHeure: addDays(new Date().setHours(9, 30, 0, 0), 2).toString(),
      duree: 30,
      motif: 'Suivi post-opératoire',
      statut: 'PENDING',
    },
  ];
};

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  CONFIRMED: 'bg-success/10 text-success border-success/20',
  COMPLETED: 'bg-muted text-muted-foreground border-muted',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const Appointments = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments] = useState<Appointment[]>(generateMockAppointments());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.dateHeure), date)
    );
  };

  const selectedDateAppointments = selectedDate 
    ? getAppointmentsForDate(selectedDate)
    : [];

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-subtitle">
            Gérez votre planning de consultations
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nouveau RDV
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg font-display">
            {format(weekStart, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all duration-200",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                    : isToday 
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "hover:bg-muted"
                )}
              >
                <span className={cn(
                  "text-xs font-medium uppercase",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE', { locale: fr })}
                </span>
                <span className={cn(
                  "text-2xl font-bold mt-1",
                  isSelected ? "text-primary-foreground" : ""
                )}>
                  {format(day, 'd')}
                </span>
                {dayAppointments.length > 0 && (
                  <div className={cn(
                    "flex gap-0.5 mt-2",
                    isSelected ? "opacity-80" : ""
                  )}>
                    {dayAppointments.slice(0, 3).map((apt, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected 
                            ? "bg-primary-foreground" 
                            : apt.statut === 'CONFIRMED' 
                              ? "bg-success" 
                              : "bg-warning"
                        )}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <span className={cn(
                        "text-xs ml-1",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        +{dayAppointments.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Appointments */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg font-display">
                  {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDateAppointments.length} rendez-vous
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedDateAppointments.length === 0 ? (
          <div className="empty-state py-12">
            <Clock className="empty-state-icon" />
            <p className="text-muted-foreground">Aucun rendez-vous ce jour</p>
            <Button className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un RDV
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedDateAppointments
              .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
              .map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-foreground">
                      {format(parseISO(appointment.dateHeure), 'HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.duree} min
                    </p>
                  </div>
                  <div className="w-1 h-12 rounded-full bg-primary/20" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium truncate">
                        {appointment.patientPrenom} {appointment.patientNom}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {appointment.motif}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(statusStyles[appointment.statut])}
                  >
                    {statusLabels[appointment.statut]}
                  </Badge>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
