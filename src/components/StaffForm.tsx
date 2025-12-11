// src/components/StaffForm.tsx
import {
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { Staff, StaffType } from "../api/staffApi";

interface Props {
  onSubmit: (data: Staff) => Promise<void> | void;
  initialData?: Staff;
  submitting?: boolean;
  title?: string;
}

const STAFF_TYPES: StaffType[] = [
  "MEDECIN",
  "INFIRMIER",
  "AIDE_SOIGNANT",
  "TECHNICIEN",
  "SECRETAIRE",
];

export default function StaffForm({
  onSubmit,
  initialData,
  submitting = false,
  title = "Formulaire Staff",
}: Props) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data: Staff = {
      nom: (form.get("nom") as string).trim(),
      prenom: (form.get("prenom") as string).trim(),

      // ✅ cast correct
      type: form.get("type") as StaffType,

      email: ((form.get("email") as string) || "").trim(),
      telephone: ((form.get("telephone") as string) || "").trim(),
      specialite: ((form.get("specialite") as string) || "").trim(),

      // ✅ champs que ton form utilise
      numeroLicence: ((form.get("numeroLicence") as string) || "").trim(),
      dateEmbauche: (form.get("dateEmbauche") as string) || undefined,
      actif: form.get("actif") === "true",
    };

    await onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" mb={2}>
        {title}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="nom"
            label="Nom"
            fullWidth
            required
            defaultValue={initialData?.nom || ""}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="prenom"
            label="Prénom"
            fullWidth
            required
            defaultValue={initialData?.prenom || ""}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="type"
            label="Type"
            select
            fullWidth
            required
            defaultValue={initialData?.type || "MEDECIN"}
          >
            {STAFF_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="specialite"
            label="Spécialité"
            fullWidth
            defaultValue={initialData?.specialite || ""}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="email"
            label="Email"
            fullWidth
            defaultValue={initialData?.email || ""}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="telephone"
            label="Téléphone"
            fullWidth
            defaultValue={initialData?.telephone || ""}
          />
        </Grid>

        {/* ✅ AJOUTS: numeroLicence */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="numeroLicence"
            label="Numéro de licence"
            fullWidth
            defaultValue={initialData?.numeroLicence || ""}
          />
        </Grid>

        {/* ✅ AJOUTS: dateEmbauche */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="dateEmbauche"
            label="Date d'embauche"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            defaultValue={
              initialData?.dateEmbauche
                ? initialData.dateEmbauche.substring(0, 10)
                : ""
            }
          />
        </Grid>

        {/* ✅ AJOUTS: actif */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="actif"
            label="Statut"
            select
            fullWidth
            defaultValue={initialData?.actif ? "true" : "false"}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="true">Actif</MenuItem>
            <MenuItem value="false">Inactif</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "En cours..." : "Enregistrer"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
