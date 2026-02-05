import { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { DoctorSelector } from '@/components/appointments/DoctorSelector';
import { TimeSlotSelector } from '@/components/appointments/TimeSlotSelector';
import { AppointmentSummary } from '@/components/appointments/AppointmentSummary';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  CONFIRMED: 'bg-success/10 text-success border-success/20',
  COMPLETED: 'bg-muted text-muted-foreground border-muted',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const Appointments = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    dossierId: '',
    medecinId: user?.id || '',
    dateHeure: '',
    motif: '',
    selectedDoctorName: '',
  });

  const isDoctor = hasRole('MEDECIN');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.put(`/appointments/${id}/status?status=${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Statut du rendez-vous mis à jour');
      setSelectedAppointment(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  });

  const resetBookingWizard = () => {
    setBookingStep(1);
    setBookingData({
      dossierId: '',
      medecinId: '',
      dateHeure: '',
      motif: '',
      selectedDoctorName: '',
    });
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const endpoint = isDoctor
        ? `/appointments/doctor/${user.id}`
        : `/appointments/patient/all`; // Fallback or mock list for others
      try {
        const response = await api.get<Appointment[]>(endpoint);
        return response.data;
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const bookMutation = useMutation({
    mutationFn: (data: any) => api.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsBookModalOpen(false);
      resetBookingWizard();
      toast.success('Rendez-vous réservé avec succès! En attente de confirmation du médecin.');
    },
    onError: (error: any) => {
      console.error(error);
      const message = error.response?.data?.message || 'Erreur lors de la réservation';
      toast.error(message);
    }
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt =>
      apt.appointmentDate && isSameDay(parseISO(apt.appointmentDate), date)
    );
  };

  const selectedDateAppointments = selectedDate
    ? getAppointmentsForDate(selectedDate)
    : [];

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const handleOpenBookingModal = () => {
    resetBookingWizard();
    setIsBookModalOpen(true);
  };

  const handleBook = () => {
    if (!bookingData.medecinId || !bookingData.dateHeure || !bookingData.motif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    bookMutation.mutate({
      doctorId: bookingData.medecinId,
      patientId: bookingData.dossierId || user?.id || '',
      appointmentDate: bookingData.dateHeure.length === 16 ? `${bookingData.dateHeure}:00` : bookingData.dateHeure,
      status: 'PENDING',
      motif: bookingData.motif
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-subtitle">
            {isDoctor ? 'Consultez et gérez vos rendez-vous' : 'Gérez votre planning de consultations'}
          </p>
        </div>
        {!isDoctor && (
          <Button className="gap-2 shrink-0" onClick={handleOpenBookingModal}>
            <Plus className="w-4 h-4" />
            Nouveau RDV
          </Button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg font-display">
            {format(weekStart, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
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
                  <div className="flex gap-0.5 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
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
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedDateAppointments
              .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-foreground">
                      {format(parseISO(appointment.appointmentDate), 'HH:mm')}
                    </p>
                  </div>
                  <div className="w-1 h-12 rounded-full bg-primary/20" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium truncate">
                        Dossier: {appointment.patientId}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {appointment.motif || 'Consultation'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(statusStyles[appointment.status] || statusStyles.PENDING)}
                  >
                    {statusLabels[appointment.status] || appointment.status}
                  </Badge>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Booking Modal - Multi-Step Wizard */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {bookingStep === 1 && 'Choisissez votre médecin'}
              {bookingStep === 2 && 'Sélectionnez un créneau'}
              {bookingStep === 3 && 'Confirmez votre rendez-vous'}
            </DialogTitle>
            <DialogDescription>
              {bookingStep === 1 && 'Recherchez et sélectionnez le médecin avec qui vous souhaitez prendre rendez-vous'}
              {bookingStep === 2 && 'Choisissez la date et l\'heure qui vous conviennent'}
              {bookingStep === 3 && 'Vérifiez les informations et ajoutez le motif de votre consultation'}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={cn(
                  "h-2 rounded-full flex-1 transition-all duration-300",
                  step <= bookingStep ? "bg-primary" : "bg-muted"
                )} />
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {bookingStep === 1 && (
              <DoctorSelector
                onSelect={(doctorId, doctorName) => {
                  setBookingData({
                    ...bookingData,
                    medecinId: doctorId,
                    selectedDoctorName: doctorName
                  });
                }}
                selectedDoctorId={bookingData.medecinId}
              />
            )}

            {bookingStep === 2 && (
              <TimeSlotSelector
                onSelect={(dateTime) => {
                  setBookingData({ ...bookingData, dateHeure: dateTime });
                }}
                selectedDateTime={bookingData.dateHeure}
                doctorName={bookingData.selectedDoctorName}
              />
            )}

            {bookingStep === 3 && (
              <AppointmentSummary
                doctorName={bookingData.selectedDoctorName || ''}
                dateTime={bookingData.dateHeure}
                motif={bookingData.motif}
                onMotifChange={(motif) => setBookingData({ ...bookingData, motif })}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
            {bookingStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setBookingStep(bookingStep - 1)}
              >
                Retour
              </Button>
            )}

            <div className="flex gap-2 ml-auto">
              {bookingStep < 3 ? (
                <Button
                  onClick={() => setBookingStep(bookingStep + 1)}
                  disabled={
                    (bookingStep === 1 && !bookingData.medecinId) ||
                    (bookingStep === 2 && !bookingData.dateHeure)
                  }
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleBook}
                  disabled={bookMutation.isPending || !bookingData.motif}
                >
                  {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer le rendez-vous
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
};

export default Appointments;
