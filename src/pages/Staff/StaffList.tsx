import { useEffect, useState } from "react";
import { getAllStaffs, deleteStaff } from "../../api/staffApi";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Toolbar,
  Container,
  CircularProgress,
  Alert,
  Snackbar
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

import { useNavigate } from "react-router-dom";
import Appbar from "../../components/Appbar";

export default function StaffList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const load = () => {
    setLoading(true);
    setError(null);
    getAllStaffs()
      .then((res) => {
        setRows(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Erreur lors du chargement des staffs");
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = rows.filter((s: any) =>
    `${s.nom} ${s.prenom} ${s.specialite}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!selectedId) return;
    
    deleteStaff(selectedId)
      .then(() => {
        setOpenDelete(false);
        setSnackbar({ open: true, message: "Staff supprimé avec succès", severity: "success" });
        load();
      })
      .catch((err) => {
        setSnackbar({ open: true, message: "Erreur lors de la suppression", severity: "error" });
        console.error(err);
      });
  };

  const typeColor = (t: string) => {
    switch (t) {
      case "MEDECIN": return "primary";
      case "INFIRMIER": return "info";
      case "AIDE_SOIGNANT": return "warning";
      case "TECHNICIEN": return "secondary";
      case "SECRETAIRE": return "default";
      default: return "default";
    }
  };

  const columns: any = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "fullName",
      headerName: "Nom complet",
      width: 200,
      valueGetter: (params: any) => `${params.row.nom} ${params.row.prenom}`
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      renderCell: (p: any) => (
        <Chip label={p.row.type} color={typeColor(p.row.type)} variant="outlined" />
      )
    },
    { field: "specialite", headerName: "Spécialité", width: 200 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "telephone", headerName: "Téléphone", width: 150 },

    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (p: any) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => navigate(`/staff/edit/${p.row.id}`)}>
            <EditIcon color="primary" />
          </IconButton>

          <IconButton
            onClick={() => {
              setSelectedId(p.row.id);
              setOpenDelete(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <Appbar appBarTitle="Staff Management" />
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
          <Stack direction="row" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/staff/add")}
            >
              Ajouter un Staff
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            placeholder="Rechercher un staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon /> }}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 550 }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
              />
            </Box>
          )}

          {/* Delete Dialog */}
          <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
            <DialogTitle>Supprimer</DialogTitle>
            <DialogContent>Voulez-vous vraiment supprimer ce staff ?</DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
              <Button color="error" onClick={handleDelete}>Supprimer</Button>
            </DialogActions>
          </Dialog>

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
