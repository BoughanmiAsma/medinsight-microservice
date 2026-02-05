import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, TrendingUp, Calendar, BarChart3, Activity, Briefcase } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/api/axios';
import { Staff } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';

export function AdminDashboard() {
    // Fetch all staff
    const { data: staffList = [] } = useQuery({
        queryKey: ['all-staff'],
        queryFn: async () => {
            const response = await api.get<Staff[]>('/staffs');
            return response.data;
        }
    });

    // Fetch all appointments (for stats)
    const { data: allAppointments = [] } = useQuery({
        queryKey: ['admin-all-appointments'],
        queryFn: async () => {
            const response = await api.get('/appointments/all');
            return response.data;
        }
    });

    // Fetch total patients
    const { data: patients = [] } = useQuery({
        queryKey: ['all-patients'],
        queryFn: async () => {
            const response = await api.get('/dossiers');
            return response.data;
        }
    });

    // Calculate staff statistics
    const staffStats = {
        total: staffList.length,
        active: staffList.filter(s => s.actif).length,
        inactive: staffList.filter(s => !s.actif).length,
        byType: [
            { name: 'MÉDECIN', value: staffList.filter(s => s.type === 'MEDECIN').length, color: '#0ea5e9' },
            { name: 'INFIRMIER', value: staffList.filter(s => s.type === 'INFIRMIER').length, color: '#10b981' },
            { name: 'SECRÉTAIRE', value: staffList.filter(s => s.type === 'SECRETAIRE').length, color: '#f59e0b' },
            { name: 'TECHNICIEN', value: staffList.filter(s => s.type === 'TECHNICIEN').length, color: '#6366f1' },
            { name: 'SEC-LABO', value: staffList.filter(s => s.type === 'LABORATOIRE').length, color: '#f97316' },
            { name: 'PHARMACIEN', value: staffList.filter(s => s.type === 'PHARMACIE').length, color: '#22c55e' },
        ]
    };

    const today = new Date();
    const thisMonth = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear();
    });

    // Generate chart data for last 7 days activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        const count = allAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === d.toDateString();
        }).length;
        return { name: dateStr, count };
    });

    const activeRate = staffStats.total > 0
        ? Math.round((staffStats.active / staffStats.total) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Dossiers Patients"
                    value={patients.length.toString()}
                    subtitle="Total inscrits"
                    icon={Users}
                    variant="primary"
                    trend={{ value: patients.length > 0 ? 100 : 0, label: 'données chargées' }}
                />

                <StatCard
                    title="Personnel Total"
                    value={staffStats.total.toString()}
                    subtitle={`${staffStats.active} actifs`}
                    icon={Briefcase}
                    variant="info"
                />

                <StatCard
                    title="Staff Actif"
                    value={staffStats.active.toString()}
                    subtitle="En service"
                    icon={UserCheck}
                    variant="success"
                />

                <StatCard
                    title="Staff Inactif"
                    value={staffStats.inactive.toString()}
                    subtitle="Hors service"
                    icon={UserX}
                    variant="warning"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staff Distribution Chart */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Répartition du personnel</h2>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={staffStats.byType} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {staffStats.byType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Monthly Activity Area Chart */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Activité des 7 derniers jours</h2>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={last7Days}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
                                    dataKey="count"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Activity Overview & Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Bilan mensuel</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total consultations</span>
                            <span className="text-2xl font-bold">{thisMonth.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Confirmées</span>
                            <span className="font-semibold text-success">
                                {thisMonth.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Annulées</span>
                            <span className="font-semibold text-destructive">
                                {thisMonth.filter(a => a.status === 'CANCELLED').length}
                            </span>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-success" />
                                <span className="text-muted-foreground">
                                    {(thisMonth.length > 0 ? (thisMonth.filter(a => a.status === 'COMPLETED').length / thisMonth.length) * 100 : 0).toFixed(1)}% de complétion
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Indicateurs de performance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-primary/5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Occupation des lits / Capacité</span>
                                <span className="text-lg font-bold text-primary">78%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `78%` }} />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-success/5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Disponibilité Médecins</span>
                                <span className="text-lg font-bold text-success">
                                    {staffList.filter(s => s.type === 'MEDECIN' && s.actif).length} / {staffList.filter(s => s.type === 'MEDECIN').length}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-indigo-50">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Temps d'attente moyen</span>
                                <span className="text-lg font-bold text-indigo-600">12 min</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Staff */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Personnel récent</h2>
                </div>

                <div className="space-y-2">
                    {staffList
                        .sort((a, b) => new Date(b.dateEmbauche || 0).getTime() - new Date(a.dateEmbauche || 0).getTime())
                        .slice(0, 5)
                        .map((staff) => (
                            <div
                                key={staff.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${staff.actif ? 'bg-success' : 'bg-muted'}`} />
                                    <div>
                                        <p className="font-medium">{staff.prenom} {staff.nom}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {staff.type === 'MEDECIN' ? 'Médecin' :
                                                staff.type === 'INFIRMIER' ? 'Infirmier(e)' :
                                                    staff.type === 'SECRETAIRE' ? 'Secrétaire' :
                                                        staff.type === 'ADMIN' ? 'Admin' :
                                                            staff.type === 'TECHNICIEN' ? 'Technicien' :
                                                                staff.type === 'AIDE_SOIGNANT' ? 'Aide-soignant' :
                                                                    staff.type === 'LABORATOIRE' ? 'Séc. Labo' :
                                                                        staff.type === 'PHARMACIE' ? 'Pharmacien' :
                                                                            staff.type}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={staff.actif ? 'default' : 'secondary'}>
                                    {staff.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                            </div>
                        ))}
                </div>
            </Card>
        </div>
    );
}
