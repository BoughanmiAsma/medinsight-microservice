import { Button, Grid, TextField, MenuItem, Card } from "@mui/material";
import { Staff } from "../api/staffApi";
import { useState, useEffect } from "react";

interface Props {
  onSubmit: (data: Staff) => void;
  initialData?: Staff;
}

export default function StaffForm({ onSubmit, initialData }: Props) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const toLocalDateTime = (date: any) => {
    if (!date) return null;
    return `${date}T00:00:00`;
  };

  const validateForm = (form: FormData): boolean => {
    const errors: Record<string, string> = {};

    if (!form.get("nom") || (form.get("nom") as string).trim() === "") {
      errors.nom = "Le nom est requis";
    }

    if (!form.get("prenom") || (form.get("prenom") as string).trim() === "") {
      errors.prenom = "Le prénom est requis";
    }

    const email = form.get("email") as string;
    if (!email || email.trim() === "") {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "L'email n'est pas valide";
    }

    if (!form.get("telephone") || (form.get("telephone") as string).trim() === "") {
      errors.telephone = "Le téléphone est requis";
    }

    if (!form.get("type") || (form.get("type") as string).trim() === "") {
      errors.type = "Le type est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    if (!validateForm(form)) {
      return;
    }

    const data: Staff = {
      id: initialData?.id,
      nom: (form.get("nom") as string).trim(),
      prenom: (form.get("prenom") as string).trim(),
      email: (form.get("email") as string).trim(),
      telephone: (form.get("telephone") as string).trim(),
      type: form.get("type") as string,
      specialite: (form.get("specialite") as string)?.trim() || "",
      numeroLicence: (form.get("numeroLicence") as string)?.trim() || "",
      actif: form.get("actif") === "true",
      dateEmbauche: toLocalDateTime(form.get("dateEmbauche")),
    };

    onSubmit(data);
  };

  useEffect(() => {
    setFormErrors({});
  }, [initialData]);

  return (
    <Card sx={{ p: 4 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="nom" 
              label="Nom" 
              fullWidth 
              required 
              defaultValue={initialData?.nom}
              error={!!formErrors.nom}
              helperText={formErrors.nom}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="prenom" 
              label="Prénom" 
              fullWidth 
              required 
              defaultValue={initialData?.prenom}
              error={!!formErrors.prenom}
              helperText={formErrors.prenom}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="email" 
              label="Email" 
              type="email"
              fullWidth 
              required 
              defaultValue={initialData?.email}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="telephone" 
              label="Téléphone" 
              fullWidth 
              required 
              defaultValue={initialData?.telephone}
              error={!!formErrors.telephone}
              helperText={formErrors.telephone}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="type" 
              label="Type" 
              select 
              fullWidth 
              required
              defaultValue={initialData?.type || ""}
              error={!!formErrors.type}
              helperText={formErrors.type}
            >
              <MenuItem value="MEDECIN">Médecin</MenuItem>
              <MenuItem value="INFIRMIER">Infirmier</MenuItem>
              <MenuItem value="AIDE_SOIGNANT">Aide-soignant</MenuItem>
              <MenuItem value="TECHNICIEN">Technicien</MenuItem>
              <MenuItem value="SECRETAIRE">Secrétaire</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="specialite" 
              label="Spécialité" 
              fullWidth 
              defaultValue={initialData?.specialite} 
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="numeroLicence" 
              label="Numéro de licence" 
              fullWidth 
              defaultValue={initialData?.numeroLicence} 
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="dateEmbauche" 
              type="date" 
              label="Date d'embauche"
              fullWidth
              InputLabelProps={{ shrink: true }}
              defaultValue={initialData?.dateEmbauche?.substring(0, 10) || ""}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              name="actif" 
              label="Actif" 
              select 
              fullWidth 
              defaultValue={initialData?.actif ? "true" : "false"}
            >
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Non Actif</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} textAlign="right">
            <Button type="submit" variant="contained">Enregistrer</Button>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}
