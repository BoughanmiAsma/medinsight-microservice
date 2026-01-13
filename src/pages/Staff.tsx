import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Pencil,
  Trash2,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Staff as StaffType, UserRole } from '@/types';

// Mock data
const mockStaff: StaffType[] = [
  {
    id: '1',
    nom: 'Martin',
    prenom: 'Jean',
    type: 'MEDECIN',
    specialite: 'Médecine Générale',
    email: 'jean.martin@medinsight.com',
    telephone: '06 12 34 56 78',
    statut: 'ACTIF',
  },
  {
    id: '2',
    nom: 'Dubois',
    prenom: 'Claire',
    type: 'INFIRMIER',
    email: 'claire.dubois@medinsight.com',
    telephone: '06 23 45 67 89',
    statut: 'ACTIF',
  },
  {
    id: '3',
    nom: 'Petit',
    prenom: 'Luc',
    type: 'SECRETAIRE',
    email: 'luc.petit@medinsight.com',
    telephone: '06 34 56 78 90',
    statut: 'ACTIF',
  },
  {
    id: '4',
    nom: 'Moreau',
    prenom: 'Anne',
    type: 'TECHNICIEN',
    email: 'anne.moreau@medinsight.com',
    telephone: '06 45 67 89 01',
    statut: 'ACTIF',
  },
  {
    id: '5',
    nom: 'Lefevre',
    prenom: 'Paul',
    type: 'ADMIN',
    email: 'paul.lefevre@medinsight.com',
    telephone: '06 56 78 90 12',
    statut: 'INACTIF',
  },
];

const roleStyles: Record<UserRole, string> = {
  MEDECIN: 'badge-doctor',
  INFIRMIER: 'badge-nurse',
  SECRETAIRE: 'badge-secretary',
  ADMIN: 'badge-admin',
  TECHNICIEN: 'bg-purple-100 text-purple-700',
};

const roleLabels: Record<UserRole, string> = {
  MEDECIN: 'Médecin',
  INFIRMIER: 'Infirmier(e)',
  SECRETAIRE: 'Secrétaire',
  ADMIN: 'Admin',
  TECHNICIEN: 'Technicien',
};

const Staff = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [staff] = useState<StaffType[]>(mockStaff);

  const filteredStaff = staff.filter(member =>
    `${member.prenom} ${member.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Personnel</h1>
          <p className="page-subtitle">
            Gérez les membres de votre équipe médicale
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
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
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Spécialité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((member) => (
              <TableRow key={member.id} className="data-table-row">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.prenom} {member.nom}</p>
                      <p className="text-sm text-muted-foreground md:hidden">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(roleStyles[member.type])}>
                    {roleLabels[member.type]}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </div>
                    {member.telephone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {member.telephone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-muted-foreground">
                    {member.specialite || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={member.statut === 'ACTIF' ? 'default' : 'secondary'}
                    className={cn(
                      member.statut === 'ACTIF' 
                        ? 'bg-success/10 text-success hover:bg-success/20' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {member.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="empty-state">
          <UserCircle className="empty-state-icon" />
          <p className="text-muted-foreground">Aucun membre trouvé</p>
        </div>
      )}
    </div>
  );
};

export default Staff;
