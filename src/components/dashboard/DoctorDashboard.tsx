import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, XCircle, CheckCircle, Users, TrendingUp, FileText, Activity } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/api/axios';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export function DoctorDashboard() {
    const { user } = useAuth();

    // Fetch doctor's appointments
    const { data: appointments = [] } = useQuery({
        queryKey: ['doctor-appointments', user?.id],
        queryFn: async () => {
            const response = await api.get<Appointment[]>(`/appointments/doctor/${user?.id}`);
            return response.data;
        },
        enabled: !!user?.id
    });

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Statistiques calculées
    const todayAppointments = appointments.filter(apt =>
        isWithinInterval(parseISO(apt.appointmentDate), { start: todayStart, end: todayEnd })
    );

    const stats = {
        totalToday: todayAppointments.length,
        confirmed: todayAppointments.filter(a => a.status === 'CONFIRMED').length,
        pending: todayAppointments.filter(a => a.status === 'PENDING').length,
        cancelled: todayAppointments.filter(a => a.status === 'CANCELLED').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,

        // Stats de la semaine
        weekTotal: appointments.filter(apt => {
            const date = parseISO(apt.appointmentDate);
            return isWithinInterval(date, {
                start: subDays(today, 7),
                end: today
            });
        }).length,

        weekCancelled: appointments.filter(apt => {
            const date = parseISO(apt.appointmentDate);
            return apt.status === 'CANCELLED' && isWithinInterval(date, {
                start: subDays(today, 7),
                end: today
            });
        }).length,
    };

    const attendanceRate = stats.weekTotal > 0
        ? Math.round(((stats.weekTotal - stats.weekCancelled) / stats.weekTotal) * 100)
        : 0;

    const nextAppointments = todayAppointments
        .filter(a => a.status !== 'CANCELLED' && parseISO(a.appointmentDate) > new Date())
        .sort((a, b) => parseISO(a.appointmentDate).getTime() - parseISO(b.appointmentDate).getTime())
        .slice(0, 5);

    // Activity chart data
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i);
        const dayStr = format(d, 'EEE', { locale: fr });
        const count = appointments.filter(apt => {
            const aptDate = parseISO(apt.appointmentDate);
            return format(aptDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
        }).length;
        return { name: dayStr, rdv: count };
    });

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="RDV Aujourd'hui"
                    value={stats.totalToday.toString()}
                    subtitle={`${stats.confirmed} confirmés`}
                    icon={Calendar}
                    variant="primary"
                    trend={{ value: stats.pending, label: 'en attente' }}
                />

                <StatCard
                    title="Consultations"
                    value={stats.completed.toString()}
                    subtitle="Total terminées"
                    icon={CheckCircle}
                    variant="success"
                    trend={{ value: stats.weekTotal, label: 'cette semaine' }}
                />

                <StatCard
                    title="Annulations"
                    value={stats.weekCancelled.toString()}
                    subtitle="Cette semaine"
                    icon={XCircle}
                    variant="warning"
                />

                <StatCard
                    title="Taux de présence"
                    value={`${attendanceRate}%`}
                    subtitle="7 derniers jours"
                    icon={TrendingUp}
                    variant={attendanceRate > 80 ? "success" : attendanceRate > 60 ? "warning" : "info"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prochains rendez-vous */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Prochains rendez-vous</h2>
                    </div>

                    {nextAppointments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Aucun rendez-vous prévu pour aujourd'hui</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {nextAppointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-sm font-medium text-primary">
                                                {format(parseISO(apt.appointmentDate), 'HH:mm')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium">Patient #{apt.patientId.substring(0, 8)}...</p>
                                            <p className="text-sm text-muted-foreground">{apt.motif || 'Consultation'}</p>
                                        </div>
                                    </div>
                                    <Badge variant={
                                        apt.status === 'CONFIRMED' ? 'default' :
                                            apt.status === 'COMPLETED' ? 'secondary' :
                                                apt.status === 'CANCELLED' ? 'destructive' :
                                                    'outline'
                                    }>
                                        {apt.status === 'CONFIRMED' ? 'Confirmé' :
                                            apt.status === 'CANCELLED' ? 'Annulé' :
                                                apt.status === 'COMPLETED' ? 'Terminé' :
                                                    'En attente'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Activité Hebdomadaire Chart */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Volume de rendez-vous (7j)</h2>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRdv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="rdv"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRdv)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Resume de la semaine */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Récapitulatif Hebdomadaire</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Total RDV</p>
                        <p className="text-2xl font-bold">{stats.weekTotal}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                        <p className="text-sm text-muted-foreground mb-1">Présence</p>
                        <p className="text-2xl font-bold text-success">{attendanceRate}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                        <p className="text-sm text-muted-foreground mb-1">Annulations</p>
                        <p className="text-2xl font-bold text-destructive">{stats.weekCancelled}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
