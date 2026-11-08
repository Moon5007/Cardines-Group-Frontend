import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, MenuItem, Snackbar, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import api from "../api/axios";

const PAGE_SIZE = 5;
const ROLES = ["customer", "admin"];
const EMPTY = { name: "", email: "", password: "", role: "customer" };

const toList = (res) => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  return [];
};
const unwrap = (res) => res.data?.data ?? res.data;

const errorText = (err) => {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  if (data?.message) return data.message;
  if (err.response?.status === 401 || err.response?.status === 403)
    return "You need an admin account to manage users.";
  if (!err.response) return "Cannot reach the API. Is the Laravel server running?";
  return "Something went wrong. Please try again.";
};

// Active means the user is logged in. The backend sets is_active on login and logout.
const isActive = (u) => Boolean(u.is_active) || String(u.status).toLowerCase() === "active";

const headCell = {
  fontWeight: 500, fontSize: 17, color: "#16324f", pl: 4,
  borderRight: "1px solid rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.7)",
};
const bodyCell = { fontSize: 12, color: "#111", borderBottom: "none", py: 1.6 };

function StatusPill({ active }) {
  return (
    <Box component="span" sx={{
      display: "inline-block", minWidth: 62, textAlign: "center", px: 1.2, py: 0.2,
      borderRadius: 0.8, fontSize: 11, fontWeight: 700,
      bgcolor: active ? "#2dea3c" : "#a8a8a8",
      color: active ? "#06370b" : "#fff",
    }}>
      {active ? "ACTIVE" : "IN-ACTIVE"}
    </Box>
  );
}

const pillBtn = (bg, color, hover) => ({
  bgcolor: bg, color, borderRadius: 5, px: 2.5, py: 0.1, minWidth: 0,
  fontSize: 12, textTransform: "none", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
  "&:hover": { bgcolor: hover },
});

const pageBtn = (selected) => ({
  minWidth: 40, height: 22, borderRadius: 5, p: 0, fontSize: 12, fontWeight: 600,
  color: "#0b3d3a", textTransform: "none",
  bgcolor: selected ? "rgba(15,143,134,0.45)" : "rgba(105,228,218,0.55)",
  "&:hover": { bgcolor: "rgba(15,143,134,0.45)" },
  "&.Mui-disabled": { opacity: 0.4 },
});

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // READ
  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(toList(res)))
      .catch((err) => setLoadError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = users.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setFormError(""); setFormOpen(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name || "", email: u.email || "", password: "",
      role: u.role || "customer",
    });
    setFormError(""); setFormOpen(true);
  };
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // CREATE / UPDATE
  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || (!editing && !form.password)) {
      setFormError(editing ? "Name and email are required." : "Name, email and password are required.");
      return;
    }
    if (form.password && form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true); setFormError("");
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        const res = await api.patch(`/users/${editing.id}`, payload);
        setUsers((cur) => cur.map((u) => (u.id === editing.id ? { ...u, ...unwrap(res) } : u)));
        setToast("User updated");
      } else {
        const res = await api.post("/users", payload);
        setUsers((cur) => [...cur, unwrap(res)]);
        setToast("User created");
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleting.id}`);
      setUsers((cur) => cur.filter((u) => u.id !== deleting.id));
      setDeleting(null);
      setToast("User deleted");
    } catch (err) {
      setDeleteError(errorText(err));
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", placeItems: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* + New User */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button onClick={openCreate} sx={{
          bgcolor: "#fff", color: "#16324f", fontWeight: 500, fontSize: 18, textTransform: "none",
          px: 3, py: 1, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,80,75,.15)",
          "&:hover": { bgcolor: "#f3fffe" },
        }}>
          + New User
        </Button>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      {/* Table */}
      <Box sx={{
        border: "1px solid rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.25)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", overflow: "hidden",
      }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(255,255,255,0.4)" }}>
                {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                  <TableCell key={h} sx={headCell}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, borderBottom: "none" }}>
                    No users yet. Click "+ New User" to add one.
                  </TableCell>
                </TableRow>
              ) : rows.map((u, i) => (
                <TableRow key={u.id} sx={{ bgcolor: i % 2 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.22)" }}>
                  <TableCell sx={{ ...bodyCell, pl: 4 }}>
                    <RouterLink to={`/users/${u.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {u.name}
                    </RouterLink>
                  </TableCell>
                  <TableCell sx={bodyCell}>{u.email}</TableCell>
                  <TableCell sx={{
                    ...bodyCell, fontWeight: 600, textTransform: "capitalize",
                    color: u.role === "admin" ? "#ff1a1a" : "#111",
                  }}>
                    {u.role || "customer"}
                  </TableCell>
                  <TableCell sx={bodyCell}><StatusPill active={isActive(u)} /></TableCell>
                  <TableCell sx={bodyCell}>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => openEdit(u)} sx={pillBtn("#fff", "#222", "#f0f0f0")}>Edit</Button>
                      <Button size="small" onClick={() => { setDeleteError(""); setDeleting(u); }}
                        sx={pillBtn("#ff1a1a", "#fff", "#d90000")}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Pagination */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center" sx={{ mt: 1.5, pr: 1 }}>
        <Button disabled={current === 1} onClick={() => setPage(current - 1)} sx={pageBtn(false)}>‹</Button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <Button key={n} onClick={() => setPage(n)} sx={pageBtn(n === current)}>{n}</Button>
        ))}
        <Button disabled={current === pageCount} onClick={() => setPage(current + 1)} sx={pageBtn(false)}>›</Button>
      </Stack>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onClose={saving ? undefined : () => setFormOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} required />
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <TextField
              label={editing ? "New password (leave blank to keep)" : "Password"}
              name="password" type="password" value={form.password} onChange={handleChange}
              required={!editing} helperText="At least 8 characters"
            />
            <TextField select fullWidth label="Role" name="role" value={form.role} onChange={handleChange}>
              {ROLES.map((r) => <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: "#0f8f86" }}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>Are you sure you want to delete "{deleting?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}