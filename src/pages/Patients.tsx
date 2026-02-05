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
import { Patient } from '@/types';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Patients = () => {
  const { t } = useLanguage();
  const { hasRole, user } = useAuth();
  const isAuthorized = hasRole('MEDECIN') || hasRole('SECRETAIRE') || hasRole('LABORATOIRE') || hasRole('PHARMACIE') || hasRole('INFIRMIER') || hasRole('PATIENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    sexe: 'M',
    groupeSanguin: 'O+',
    dateNaissance: new Date().toISOString().split('T')[0],
    poids: undefined
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: Partial<Patient>) => api.post('/dossiers', {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      sexe: data.sexe,
      dateNaissance: data.dateNaissance,
      groupeSanguin: data.groupeSanguin,
      poids: data.poids
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsAddModalOpen(false);
      setNewPatient({ sexe: 'M', groupeSanguin: 'O+', dateNaissance: new Date().toISOString().split('T')[0], poids: undefined });
      toast.success('Dossier créé avec succès');
    },
    onError: () => toast.error("Erreur lors de l'ajout du patient")
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(newPatient);
  };

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get<Patient[]>('/dossiers');
      return response.data;
    },
    enabled: isAuthorized
  });

  const filteredPatients = patients.filter(patient => {
    // Si l'utilisateur est un PATIENT, il ne voit QUE son propre dossier (filtré par email)
    if (hasRole('PATIENT')) {
      return patient.email === user?.email;
    }

    // Pour le personnel, on applique le filtre de recherche habituel
    return `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.telephone?.includes(searchQuery)
  });

  const calculateAge = (dateNaissance: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateNaissance));
    } catch (e) {
      return 0;
    }
  };

  if (!isAuthorized) {
    return <div className="p-8 text-center text-destructive font-medium">Accès refusé. Rôle insuffisant.</div>;
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Erreur lors du chargement des dossiers patients.
    </div>
  );

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">{t('patient.list.title')}</h1>
          <p className="page-subtitle">
            {filteredPatients.length} {t('patient.list.count')}
          </p>
        </div>

        {(hasRole('ADMIN') || hasRole('SECRETAIRE') || hasRole('MEDECIN')) && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddPatient}>
                <DialogHeader>
                  <DialogTitle>{t('patient.new_dossier')}</DialogTitle>
                  <DialogDescription>
                    {t('patient.form.description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">{t('patient.form.last_name')}</Label>
                    <Input id="nom" className="col-span-3" required
                      value={newPatient.nom || ''}
                      onChange={e => setNewPatient({ ...newPatient, nom: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prenom" className="text-right">{t('patient.form.first_name')}</Label>
                    <Input id="prenom" className="col-span-3" required
                      value={newPatient.prenom || ''}
                      onChange={e => setNewPatient({ ...newPatient, prenom: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">{t('common.email') || 'Email'}</Label>
                    <Input id="email" type="email" className="col-span-3"
                      value={newPatient.email || ''}
                      onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="telephone" className="text-right">{t('patient.form.phone')}</Label>
                    <Input id="telephone" className="col-span-3"
                      value={newPatient.telephone || ''}
                      onChange={e => setNewPatient({ ...newPatient, telephone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sexe" className="text-right">{t('patient.form.sex')}</Label>
                    <Select value={newPatient.sexe} onValueChange={(v: 'M' | 'F') => setNewPatient({ ...newPatient, sexe: v })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">{t('patient.form.male')}</SelectItem>
                        <SelectItem value="F">{t('patient.form.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dateNaissance" className="text-right">{t('patient.form.birth_date')}</Label>
                    <Input id="dateNaissance" type="date" className="col-span-3"
                      value={newPatient.dateNaissance || ''}
                      onChange={e => setNewPatient({ ...newPatient, dateNaissance: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="age" className="text-right">{t('patient.info.age')}</Label>
                    <Input id="age" className="col-span-3 bg-muted" readOnly
                      value={newPatient.dateNaissance ? `${calculateAge(newPatient.dateNaissance)} ${t('patient.years')}` : ''} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="poids" className="text-right">{t('patient.form.weight')}</Label>
                    <Input id="poids" type="number" step="0.1" className="col-span-3"
                      placeholder="ex: 75.5"
                      value={newPatient.poids ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        setNewPatient({ ...newPatient, poids: val === '' ? undefined : parseFloat(val) });
                      }} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="groupe" className="text-right">{t('patient.form.blood_group')}</Label>
                    <Select value={newPatient.groupeSanguin} onValueChange={(v) => setNewPatient({ ...newPatient, groupeSanguin: v })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.save')}
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
            placeholder={t('patient.list.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          {t('common.filter')}
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader className="data-table-header">
            <TableRow>
              <TableHead>{t('patient.table.patient')}</TableHead>
              <TableHead>{t('patient.table.age_sex')}</TableHead>
              <TableHead>{t('patient.table.weight')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('patient.table.contact')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('patient.table.blood_group')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('patient.table.last_update')}</TableHead>
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
                      {(patient.prenom || '?').charAt(0)}{(patient.nom || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{patient.prenom || 'Prénom Inconnu'} {patient.nom || 'Nom Inconnu'}</p>
                      {!!(patient.allergies?.length || patient.antecedents?.length) && (
                        <div className="flex gap-1 mt-0.5">
                          {!!patient.allergies?.length && (
                            <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                              {patient.allergies.length} allergie(s)
                            </span>
                          )}
                          {!!patient.antecedents?.length && (
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
                <TableCell>
                  <span className="font-medium">
                    {patient.poids !== undefined && patient.poids !== null ? `${patient.poids} kg` : '—'}
                  </span>
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
                    {patient.updatedAt ? format(parseISO(patient.updatedAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {!hasRole('PATIENT') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(hasRole('ADMIN') || hasRole('MEDECIN')) && (
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {
        filteredPatients.length === 0 && (
          <div className="empty-state">
            <FolderOpen className="empty-state-icon" />
            <p className="text-muted-foreground">Aucun patient trouvé</p>
            {(hasRole('ADMIN') || hasRole('SECRETAIRE') || hasRole('MEDECIN')) && (
              <Button variant="outline" className="mt-4">
                Créer un nouveau dossier
              </Button>
            )}
          </div>
        )
      }
    </div >
  );
};

export default Patients;
