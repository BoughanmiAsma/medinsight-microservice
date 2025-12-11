import {
  Grid,
  Box,
  Toolbar,
  Container,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleSubmit = async (data: Staff) => {
    try {
      setLoading(true);
      setError(null);

      await createStaff(data);

      setSnackbar({
        open: true,
        message: "Staff ajouté avec succès",
        severity: "success",
      });

      setTimeout(() => navigate("/staff"), 1200);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'ajout du staff");
      setSnackbar({
        open: true,
        message: "Erreur lors de l'ajout du staff",
        severity: "error",
      });
      setLoading(false);
    }
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
          overflow: "auto",
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 400,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <StaffForm onSubmit={handleSubmit} />
              )}
            </Grid>
          </Grid>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
}
