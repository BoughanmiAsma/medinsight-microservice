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
  UserCircle,
  Loader2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { Staff as StaffType, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';

const roleStyles: Record<UserRole, string> = {
  MEDECIN: 'badge-doctor',
  INFIRMIER: 'badge-nurse',
  SECRETAIRE: 'badge-secretary',
  ADMIN: 'badge-admin',
  TECHNICIEN: 'bg-purple-100 text-purple-700',
  AIDE_SOIGNANT: 'bg-blue-100 text-blue-700',
  LABORATOIRE: 'bg-orange-100 text-orange-700',
  PHARMACIE: 'bg-green-100 text-green-700',
};

const roleLabels: Record<UserRole, string> = {
  MEDECIN: 'Médecin',
  INFIRMIER: 'Infirmier(e)',
  SECRETAIRE: 'Secrétaire',
  ADMIN: 'Admin',
  TECHNICIEN: 'Technicien',
  AIDE_SOIGNANT: 'Aide-soignant',
  LABORATOIRE: 'Laboratoire',
  PHARMACIE: 'Pharmacie',
};

const Staff = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffType> | null>(null);
  const [newStaff, setNewStaff] = useState<Partial<StaffType>>({
    type: 'MEDECIN',
    actif: true
  });

  const { data: staff = [], isLoading, error } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await api.get<StaffType[]>('/staffs');
      return response.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: Partial<StaffType>) => api.post('/staffs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsAddModalOpen(false);
      setNewStaff({ type: 'MEDECIN', actif: true });
      toast.success('Membre ajouté avec succès');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data || "Erreur lors de l'ajout du membre";
      toast.error(typeof message === 'string' ? message : "Erreur lors de l'ajout du membre");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: StaffType) => api.put(`/staffs/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsEditModalOpen(false);
      setEditingStaff(null);
      toast.success('Membre modifié avec succès');
    },
    onError: () => toast.error("Erreur lors de la modification")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/staffs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Membre supprimé avec succès');
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(newStaff);
  };

  const handleEditStaff = (staffMember: StaffType) => {
    setEditingStaff({ ...staffMember });
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate(editingStaff as StaffType);
    }
  };

  const filteredStaff = staff.filter(member =>
    `${member.prenom} ${member.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Erreur lors du chargement des données.
    </div>
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

        {isAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Ajouter un membre
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddStaff}>
                <DialogHeader>
                  <DialogTitle>Ajouter un membre</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations du nouveau membre du personnel.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">Nom</Label>
                    <Input id="nom" className="col-span-3" required
                      value={newStaff.nom || ''}
                      onChange={e => setNewStaff({ ...newStaff, nom: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prenom" className="text-right">Prénom</Label>
                    <Input id="prenom" className="col-span-3" required
                      value={newStaff.prenom || ''}
                      onChange={e => setNewStaff({ ...newStaff, prenom: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" className="col-span-3" required
                      value={newStaff.email || ''}
                      onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="telephone" className="text-right">Téléphone</Label>
                    <Input id="telephone" className="col-span-3" required
                      value={newStaff.telephone || ''}
                      onChange={e => setNewStaff({ ...newStaff, telephone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Rôle</Label>
                    <Select value={newStaff.type} onValueChange={(v: UserRole) => setNewStaff({ ...newStaff, type: v })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="specialite" className="text-right">Spécialité</Label>
                    <Input id="specialite" className="col-span-3" required
                      value={newStaff.specialite || ''}
                      onChange={e => setNewStaff({ ...newStaff, specialite: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="licence" className="text-right">Licence</Label>
                    <Input id="licence" className="col-span-3"
                      value={newStaff.numeroLicence || ''}
                      onChange={e => setNewStaff({ ...newStaff, numeroLicence: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="actif" className="text-right">Statut</Label>
                    <Select value={newStaff.actif ? 'true' : 'false'} onValueChange={(v) => setNewStaff({ ...newStaff, actif: v === 'true' })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Actif</SelectItem>
                        <SelectItem value="false">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
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
                    variant={member.actif ? 'default' : 'secondary'}
                    className={cn(
                      member.actif
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {member.actif ? 'Actif' : 'Inactif'}
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
                      <DropdownMenuItem className="gap-2" onClick={() => handleEditStaff(member)}>
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => deleteMutation.mutate(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {editingStaff && (
            <form onSubmit={handleUpdateStaff}>
              <DialogHeader>
                <DialogTitle>Modifier le membre</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du membre du personnel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nom" className="text-right">Nom</Label>
                  <Input id="edit-nom" className="col-span-3" required
                    value={editingStaff.nom || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, nom: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-prenom" className="text-right">Prénom</Label>
                  <Input id="edit-prenom" className="col-span-3" required
                    value={editingStaff.prenom || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, prenom: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input id="edit-email" type="email" className="col-span-3" required disabled
                    value={editingStaff.email || ''} />
                  <p className="text-[10px] text-muted-foreground col-start-2 col-span-3">L'email ne peut pas être modifié.</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-telephone" className="text-right">Téléphone</Label>
                  <Input id="edit-telephone" className="col-span-3" required
                    value={editingStaff.telephone || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, telephone: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-type" className="text-right">Rôle</Label>
                  <Select value={editingStaff.type} onValueChange={(v: UserRole) => setEditingStaff({ ...editingStaff, type: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-specialite" className="text-right">Spécialité</Label>
                  <Input id="edit-specialite" className="col-span-3" required
                    value={editingStaff.specialite || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, specialite: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-licence" className="text-right">Licence</Label>
                  <Input id="edit-licence" className="col-span-3"
                    value={editingStaff.numeroLicence || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, numeroLicence: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-actif" className="text-right">Statut</Label>
                  <Select value={editingStaff.actif ? 'true' : 'false'} onValueChange={(v) => setEditingStaff({ ...editingStaff, actif: v === 'true' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Modifier
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
