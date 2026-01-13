import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Patient } from '@/types';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockPatients: Patient[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    dateNaissance: '1985-03-15',
    sexe: 'F',
    telephone: '06 12 34 56 78',
    email: 'marie.dupont@email.com',
    adresse: '12 Rue de la Paix, 75001 Paris',
    groupeSanguin: 'A+',
    allergies: ['Pénicilline'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    nom: 'Bernard',
    prenom: 'Pierre',
    dateNaissance: '1972-08-22',
    sexe: 'M',
    telephone: '06 98 76 54 32',
    email: 'pierre.bernard@email.com',
    groupeSanguin: 'O-',
    antecedents: ['Diabète type 2', 'Hypertension'],
    createdAt: '2023-11-08T09:15:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
  {
    id: '3',
    nom: 'Leroy',
    prenom: 'Sophie',
    dateNaissance: '1990-11-08',
    sexe: 'F',
    telephone: '06 45 67 89 01',
    groupeSanguin: 'B+',
    createdAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-01-10T16:45:00Z',
  },
  {
    id: '4',
    nom: 'Moreau',
    prenom: 'Jean',
    dateNaissance: '1965-05-30',
    sexe: 'M',
    telephone: '06 78 90 12 34',
    email: 'jean.moreau@email.com',
    adresse: '45 Avenue des Champs-Élysées, 75008 Paris',
    groupeSanguin: 'AB+',
    antecedents: ['Chirurgie cardiaque 2019'],
    allergies: ['Aspirine', 'Iode'],
    createdAt: '2022-06-20T08:30:00Z',
    updatedAt: '2024-01-19T10:15:00Z',
  },
];

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients] = useState<Patient[]>(mockPatients);
  const navigate = useNavigate();

  const filteredPatients = patients.filter(patient =>
    `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.telephone?.includes(searchQuery)
  );

  const calculateAge = (dateNaissance: string) => {
    return differenceInYears(new Date(), parseISO(dateNaissance));
  };

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Dossiers Patients</h1>
          <p className="page-subtitle">
            {filteredPatients.length} patients dans la base de données
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nouveau Patient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          Filtrer
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader className="data-table-header">
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Âge / Sexe</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Groupe Sanguin</TableHead>
              <TableHead className="hidden lg:table-cell">Dernière Mise à Jour</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow 
                key={patient.id} 
                className="data-table-row cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                      {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{patient.prenom} {patient.nom}</p>
                      {(patient.allergies?.length || patient.antecedents?.length) && (
                        <div className="flex gap-1 mt-0.5">
                          {patient.allergies?.length && (
                            <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                              {patient.allergies.length} allergie(s)
                            </span>
                          )}
                          {patient.antecedents?.length && (
                            <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                              Antécédents
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{calculateAge(patient.dateNaissance)} ans</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    {patient.telephone && <p>{patient.telephone}</p>}
                    {patient.email && <p className="truncate max-w-[200px]">{patient.email}</p>}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="font-medium text-primary">
                    {patient.groupeSanguin || '—'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(patient.updatedAt), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        Voir le dossier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Prendre RDV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPatients.length === 0 && (
        <div className="empty-state">
          <FolderOpen className="empty-state-icon" />
          <p className="text-muted-foreground">Aucun patient trouvé</p>
          <Button variant="outline" className="mt-4">
            Créer un nouveau dossier
          </Button>
        </div>
      )}
    </div>
  );
};

export default Patients;
