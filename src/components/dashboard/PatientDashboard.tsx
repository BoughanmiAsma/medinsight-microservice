import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, FlaskConical, Heart, TrendingUp, Clock, Star, Activity } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/api/axios';
import { format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

export function PatientDashboard() {
    const { user } = useAuth();

    // Fetch patient's appointments
    const { data: appointments = [] } = useQuery({
        queryKey: ['patient-appointments'],
        queryFn: async () => {
            const response = await api.get<Appointment[]>('/appointments/patient/all');
            return response.data;
        }
    });

    // Upcoming appointments
    const upcomingAppointments = appointments
        .filter(a => a.status !== 'CANCELLED' && parseISO(a.appointmentDate) > new Date())
        .sort((a, b) => parseISO(a.appointmentDate).getTime() - parseISO(b.appointmentDate).getTime())
        .slice(0, 3);

    const stats = {
        upcoming: upcomingAppointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        pending: appointments.filter(a => a.status === 'PENDING').length,
    };

    // Chart data for status
    const statusData = [
        { name: 'Terminés', value: stats.completed, color: '#10b981' },
        { name: 'En attente', value: stats.pending, color: '#f59e0b' },
        { name: 'À venir', value: stats.upcoming, color: '#0ea5e9' },
    ].filter(d => d.value > 0);

    // Activity stats (appointments per month for the last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        const monthStr = format(d, 'MMM', { locale: fr });
        const count = appointments.filter(apt => {
            const aptDate = parseISO(apt.appointmentDate);
            return aptDate.getMonth() === d.getMonth() && aptDate.getFullYear() === d.getFullYear();
        }).length;
        return { name: monthStr, count };
    });

    const mockDoctors = [
        { id: '1', name: 'Dr. Martin', specialty: 'Cardiologie', rating: 4.8, reviews: 124 },
        { id: '2', name: 'Dr. Dubois', specialty: 'Dermatologie', rating: 4.9, reviews: 98 },
        { id: '3', name: 'Dr. Bernard', specialty: 'Pédiatrie', rating: 4.7, reviews: 156 },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="RDV à venir"
                    value={stats.upcoming.toString()}
                    subtitle="Prochainement"
                    icon={Calendar}
                    variant="primary"
                />

                <StatCard
                    title="Consultations"
                    value={stats.completed.toString()}
                    subtitle="Historique total"
                    icon={FileText}
                    variant="success"
                />

                <StatCard
                    title="En attente"
                    value={stats.pending.toString()}
                    subtitle="À confirmer"
                    icon={Clock}
                    variant="warning"
                />

                <StatCard
                    title="Ma santé"
                    value="Excellent"
                    subtitle="État général"
                    icon={Heart}
                    variant="success"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prochains rendez-vous */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Mes prochains rendez-vous</h2>
                        </div>
                    </div>

                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Vous n'avez aucun rendez-vous prévu</p>
                            <p className="text-sm mt-1">Prenez rendez-vous dans l'onglet "Rendez-vous"</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[80px] p-2 bg-primary/10 rounded-lg">
                                            <p className="text-xs text-muted-foreground">
                                                {format(parseISO(apt.appointmentDate), 'EEE', { locale: fr })}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                {format(parseISO(apt.appointmentDate), 'd MMM', { locale: fr })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium">Consultation Médicale</p>
                                            <p className="text-sm text-muted-foreground">{apt.motif || 'Suivi général'}</p>
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

                {/* Patient Activity Visualizations */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Suivi de mes visites</h2>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last6Months}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4 italic">
                        Nombre de consultations par mois sur le dernier semestre
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown (Pie Chart) */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Répartition de mes rendez-vous</h2>
                    </div>

                    {appointments.length > 0 ? (
                        <div className="flex flex-col md:flex-row items-center justify-around h-[200px]">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {statusData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="font-medium">{d.name}:</span>
                                        <span>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground opacity-50">
                            Aucune donnée à afficher
                        </div>
                    )}
                </Card>

                {/* Médecins recommandés */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Star className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Médecins suggérés</h2>
                    </div>

                    <div className="space-y-3">
                        {mockDoctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {doctor.name.split(' ')[1].slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{doctor.name}</p>
                                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-semibold">{doctor.rating}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
