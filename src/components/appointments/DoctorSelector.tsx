import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Stethoscope, Star, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import api from '@/api/axios';
import { Staff } from '@/types';

interface DoctorSelectorProps {
    onSelect: (doctorId: string, doctorName: string) => void;
    selectedDoctorId?: string;
}

const specialties = [
    'Tous',
    'Cardiologie',
    'Dermatologie',
    'Pédiatrie',
    'Neurologie',
    'Orthopédie',
    'Gynécologie',
    'Ophtalmologie',
];

export function DoctorSelector({ onSelect, selectedDoctorId }: DoctorSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('Tous');

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const response = await api.get<Staff[]>('/staffs/actifs');
            // Filter only doctors
            return response.data.filter(staff => staff.type === 'MEDECIN');
        },
    });

    const filteredDoctors = doctors.filter(doctor => {
        const matchesSearch =
            doctor.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctor.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctor.specialite?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSpecialty =
            selectedSpecialty === 'Tous' ||
            doctor.specialite === selectedSpecialty;

        return matchesSearch && matchesSpecialty;
    });

    const getInitials = (nom: string, prenom: string) => {
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher un médecin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Specialty Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {specialties.map((specialty) => (
                    <Button
                        key={specialty}
                        variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSpecialty(specialty)}
                        className="shrink-0"
                    >
                        {specialty}
                    </Button>
                ))}
            </div>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {filteredDoctors.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun médecin trouvé</p>
                    </div>
                ) : (
                    filteredDoctors.map((doctor) => {
                        const isSelected = selectedDoctorId === doctor.keycloakId;
                        const hasKeycloakId = !!doctor.keycloakId;

                        return (
                            <button
                                key={doctor.id}
                                disabled={!hasKeycloakId}
                                onClick={() => hasKeycloakId && onSelect(doctor.keycloakId!, `Dr. ${doctor.prenom} ${doctor.nom}`)}
                                className={cn(
                                    "glass-card p-4 text-left transition-all duration-200 hover:scale-[1.02] group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                    isSelected && "ring-2 ring-primary bg-primary/5"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                                            {getInitials(doctor.nom, doctor.prenom)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    Dr. {doctor.prenom} {doctor.nom}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {doctor.specialite || 'Médecine générale'}
                                                </p>
                                            </div>
                                            <ChevronRight className={cn(
                                                "h-5 w-5 text-muted-foreground transition-all",
                                                isSelected && "text-primary rotate-90"
                                            )} />
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1">
                                            {doctor.numeroLicence && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="text-xs">
                                                        N° {doctor.numeroLicence}
                                                    </Badge>
                                                </div>
                                            )}

                                            {!hasKeycloakId && (
                                                <Badge variant="destructive" className="text-[10px] mt-1">
                                                    Configuration manquante
                                                </Badge>
                                            )}

                                            {/* Mock rating and availability */}
                                            {hasKeycloakId && (
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span>4.8</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Disponible</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-primary font-medium">
                                            ✓ Médecin sélectionné
                                        </p>
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {filteredDoctors.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    {filteredDoctors.length} médecin{filteredDoctors.length > 1 ? 's' : ''} disponible{filteredDoctors.length > 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}
