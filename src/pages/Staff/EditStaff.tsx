import { Grid, Box, Toolbar, Container, Button, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getStaffById, updateStaff, Staff } from "../../api/staffApi";
import StaffForm from "../../components/StaffForm";
import { useEffect, useState } from "react";
import Appbar from "../../components/Appbar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function EditStaff() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStaffById(Number(id))
      .then((res) => {
        setStaff(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Erreur lors du chargement du staff");
        setLoading(false);
        console.error(err);
      });
  }, [id]);

  const handleSubmit = (data: Staff) => {
    setSaving(true);
    setError(null);
    updateStaff(Number(id), data)
      .then(() => {
        setSnackbar({ open: true, message: "Staff modifié avec succès", severity: "success" });
        setTimeout(() => navigate("/staff"), 1500);
      })
      .catch((err) => {
        setError("Erreur lors de la modification du staff");
        setSnackbar({ open: true, message: "Erreur lors de la modification du staff", severity: "error" });
        setSaving(false);
        console.error(err);
      });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Appbar appBarTitle="Modifier Staff" />
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto"
        }}
      >
        <Toolbar />
        <Container sx={{ mt: 4, mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/staff")}
            sx={{ mb: 2 }}
          >
            Retour
          </Button>

          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
                  <CircularProgress />
                </Box>
              ) : staff ? (
                <StaffForm onSubmit={handleSubmit} initialData={staff} />
              ) : (
                <Alert severity="warning">Staff introuvable</Alert>
              )}
            </Grid>
          </Grid>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
}
