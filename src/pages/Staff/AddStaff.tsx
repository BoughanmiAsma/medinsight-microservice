import { Grid, Box, Toolbar, Container, Button, CircularProgress, Alert, Snackbar } from "@mui/material";
import { createStaff, Staff } from "../../api/staffApi";
import StaffForm from "../../components/StaffForm";
import { useNavigate } from "react-router-dom";
import Appbar from "../../components/Appbar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";

export default function AddStaff() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const handleSubmit = (data: Staff) => {
    setLoading(true);
    setError(null);
    createStaff(data)
      .then(() => {
        setSnackbar({ open: true, message: "Staff ajouté avec succès", severity: "success" });
        setTimeout(() => navigate("/staff"), 1500);
      })
      .catch((err) => {
        setError("Erreur lors de l'ajout du staff");
        setSnackbar({ open: true, message: "Erreur lors de l'ajout du staff", severity: "error" });
        setLoading(false);
        console.error(err);
      });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Appbar appBarTitle="Ajouter un Staff" />
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
              ) : (
                <StaffForm onSubmit={handleSubmit} />
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
