import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../api/axios";

const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";

// Works with either [ ... ] or { data: [ ... ] }
const toList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

const errorMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return err.response?.data?.message ?? fallback;
};

const clearPreview = (url) => {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
};

const emptyForm = { name: "", description: "", status: "active" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(toList(res));
    } catch (err) {
      console.error(err);
      setError("Couldn't load categories. Check that the API is running, then try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      status: category.status || "active",
    });
    setFile(null);
    setPreview(category.image_url ?? null);
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    clearPreview(preview);
    setDialogOpen(false);
  };

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    clearPreview(preview);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description);
    formData.append("status", form.status);
    if (file) formData.append("image", file);

    try {
      if (editing) {
        // PHP can't read multipart bodies on a real PUT, so spoof it with POST
        formData.append("_method", "PUT");
        await api.post(`/categories/${editing.id}`, formData);
      } else {
        await api.post("/categories", formData);
      }

      clearPreview(preview);
      setDialogOpen(false);
      setToast(editing ? "Category updated" : "Category added");
      load();
    } catch (err) {
      console.error(err);
      setFormError(errorMessage(err, "Couldn't save the category."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
      setToast(errorMessage(err, "Couldn't delete the category."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        py: { xs: 3, md: 5 },
        background: `linear-gradient(180deg, ${TEAL_LIGHT} 0%, rgba(255,255,255,0) 280px)`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: TEAL_DARK }}>
            Categories
          </Typography>

          <Stack direction="row" gap={1}>
            <Button
              onClick={load}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ color: TEAL_DARK, fontWeight: 700 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ bgcolor: TEAL_DARK, fontWeight: 700, "&:hover": { bgcolor: "#08463f" } }}
            >
              Add category
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert
            severity="error"
            action={<Button onClick={load}>Try again</Button>}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: TEAL_DARK }} />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid rgba(11,93,87,0.15)", borderRadius: 3 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Products
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No categories yet. Click "Add category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => {
                    const status = c.status || "active";
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={c.image_url ?? undefined}
                            alt={c.name}
                            sx={{ width: 56, height: 56, bgcolor: TEAL_LIGHT, color: TEAL_DARK }}
                          >
                            {c.name?.[0]}
                          </Avatar>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                        <TableCell sx={{ maxWidth: 280, color: "text.secondary" }}>
                          <Typography variant="body2" noWrap>
                            {c.description || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={status}
                            sx={{
                              fontWeight: 700,
                              textTransform: "capitalize",
                              bgcolor: status === "active" ? TEAL_DARK : "grey.300",
                              color: status === "active" ? "#fff" : "text.primary",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">{c.products_count ?? 0}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton aria-label="Edit" onClick={() => openEdit(c)} sx={{ color: TEAL_DARK }}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton aria-label="Delete" color="error" onClick={() => setDeleteTarget(c)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800, color: TEAL_DARK }}>
            {editing ? "Edit category" : "Add category"}
          </DialogTitle>

          <DialogContent>
            <Stack gap={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}

              <TextField
                label="Category name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                multiline
                rows={3}
              />

              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                helperText="Inactive categories are hidden from the user dashboard."
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>
                  Category image
                </Typography>

                {preview && (
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 2, mb: 1 }}
                  />
                )}

                <Button
                  variant="outlined"
                  component="label"
                  sx={{ color: TEAL_DARK, borderColor: TEAL_DARK }}
                >
                  {preview ? "Change image" : "Upload image"}
                  <input type="file" hidden accept="image/*" onChange={handleFile} />
                </Button>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving} sx={{ color: TEAL_DARK }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: TEAL_DARK, fontWeight: 700, "&:hover": { bgcolor: "#08463f" } }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete category?</DialogTitle>
        <DialogContent>
          <Typography>
            "{deleteTarget?.name}" will be removed. Categories that still have products can't be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: TEAL_DARK }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}