import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotSelectorProps {
    onSelect: (dateTime: string) => void;
    selectedDateTime?: string;
    doctorName?: string;
}

const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export function TimeSlotSelector({ onSelect, selectedDateTime, doctorName }: TimeSlotSelectorProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
    };

    const handleTimeSelect = (time: string) => {
        if (!selectedDate) return;

        setSelectedTime(time);
        const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')}T${time}:00`;
        onSelect(dateTimeStr);
    };

    const isDateDisabled = (date: Date) => {
        return isBefore(startOfDay(date), startOfDay(new Date()));
    };

    return (
        <div className="space-y-6">
            {doctorName && (
                <div className="glass-card p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm text-muted-foreground">Rendez-vous avec</p>
                    <p className="font-semibold text-primary">{doctorName}</p>
                </div>
            )}

            {/* Week Navigation */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="font-semibold text-lg font-display flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {format(weekStart, 'MMMM yyyy', { locale: fr })}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        const isDisabled = isDateDisabled(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => !isDisabled && handleDateSelect(day)}
                                disabled={isDisabled}
                                className={cn(
                                    "flex flex-col items-center p-3 rounded-xl transition-all duration-200",
                                    isDisabled && "opacity-40 cursor-not-allowed",
                                    !isDisabled && !isSelected && "hover:bg-muted",
                                    isSelected && "bg-primary text-primary-foreground shadow-lg scale-105",
                                    isCurrentDay && !isSelected && "bg-primary/10"
                                )}
                            >
                                <span className={cn(
                                    "text-xs font-medium uppercase mb-1",
                                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                    {format(day, 'EEE', { locale: fr })}
                                </span>
                                <span className={cn(
                                    "text-2xl font-bold",
                                    isSelected && "text-primary-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">
                            Créneaux disponibles - {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                        </h4>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {timeSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            // Mock: some slots are "taken"
                            const isTaken = Math.random() > 0.7;

                            return (
                                <button
                                    key={time}
                                    onClick={() => !isTaken && handleTimeSelect(time)}
                                    disabled={isTaken}
                                    className={cn(
                                        "p-3 rounded-lg font-medium transition-all duration-200",
                                        isTaken && "opacity-40 cursor-not-allowed bg-muted line-through",
                                        !isTaken && !isSelected && "bg-muted hover:bg-primary/10 hover:text-primary",
                                        isSelected && "bg-primary text-primary-foreground shadow-md scale-105"
                                    )}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-primary"></div>
                            <span>Sélectionné</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-muted"></div>
                            <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-muted opacity-40"></div>
                            <span>Indisponible</span>
                        </div>
                    </div>
                </div>
            )}

            {!selectedDate && (
                <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez une date pour voir les créneaux disponibles</p>
                </div>
            )}
        </div>
    );
}
