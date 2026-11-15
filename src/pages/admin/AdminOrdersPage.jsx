import { useCallback, useEffect, useMemo, useState } from "react";
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
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../api/axios";

const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  pending: "#ef8a17",
  processing: "#1976d2",
  shipped: "#7b2d8e",
  delivered: "#2e9e4f",
  cancelled: "#d63b3b",
};

// Works with either [ ... ] or { data: [ ... ] }
const toList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

// Pulls the item out of either { data: {...} } or {...}
const unwrap = (response) => response.data?.data ?? response.data;

const peso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0);

const errorMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return err.response?.data?.message ?? fallback;
};

const statusOf = (order) => String(order.status || "").toLowerCase();

const orderTotal = (order) =>
  Number(order.total) ||
  (order.items ?? []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);

const formatDate = (order) => {
  const raw = order.created_at ?? order.date;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" });
};

const countItems = (order) =>
  (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [updatingId, setUpdatingId] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setOrders(toList(res));
    } catch (err) {
      console.error(err);
      setError("Couldn't load orders. Check that the API is running and you're logged in as admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result = { all: orders.length };
    STATUSES.forEach((s) => {
      result[s] = orders.filter((o) => statusOf(o) === s).length;
    });
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^#/, "");

    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || statusOf(o) === statusFilter;
      const matchesSearch =
        !term ||
        String(o.id).includes(term) ||
        o.customer?.name?.toLowerCase().includes(term) ||
        o.customer?.email?.toLowerCase().includes(term) ||
        o.contact_number?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === statusOf(order)) return;

    if (
      newStatus === "cancelled" &&
      !window.confirm(
        `Cancel order #${order.id}? Its items go back to stock and it can't be reopened.`
      )
    ) {
      return;
    }

    setUpdatingId(order.id);
    try {
      const res = await api.put(`/orders/${order.id}`, { status: newStatus });
      const updated = unwrap(res);
      setOrders((current) => current.map((o) => (o.id === order.id ? updated : o)));
      setViewing((current) => (current?.id === order.id ? updated : current));
      setToast(`Order #${order.id} is now ${newStatus}`);
    } catch (err) {
      console.error(err);
      setToast(errorMessage(err, "Couldn't update the order."));
    } finally {
      setUpdatingId(null);
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
            Orders
          </Typography>
          <Button
            onClick={load}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ color: TEAL_DARK, fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by order number, customer, email or contact number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2 }}
        />

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
          {["all", ...STATUSES].map((s) => {
            const active = statusFilter === s;
            return (
              <Chip
                key={s}
                clickable
                onClick={() => setStatusFilter(s)}
                label={`${s === "all" ? "All" : s} (${counts[s] ?? 0})`}
                sx={{
                  fontWeight: 700,
                  textTransform: "capitalize",
                  bgcolor: active ? TEAL_DARK : "transparent",
                  color: active ? "#fff" : TEAL_DARK,
                  border: `1px solid ${TEAL_DARK}`,
                  "&:hover": { bgcolor: active ? "#08463f" : TEAL_LIGHT },
                }}
              />
            );
          })}
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
                  <TableCell sx={{ fontWeight: 800 }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Items
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Total
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    View
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleOrders.map((order) => {
                    const status = statusOf(order);
                    const options = STATUSES.includes(status) ? STATUSES : [status, ...STATUSES];

                    return (
                      <TableRow key={order.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>#{order.id}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {order.customer?.name ?? "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customer?.email ?? order.contact_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(order)}</TableCell>
                        <TableCell align="right">{countItems(order)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {peso(orderTotal(order))}
                        </TableCell>
                        <TableCell>
                          {status === "cancelled" ? (
                            <Chip
                              size="small"
                              label="Cancelled"
                              sx={{ bgcolor: STATUS_COLORS.cancelled, color: "#fff", fontWeight: 700 }}
                            />
                          ) : (
                            <Select
                              size="small"
                              value={status}
                              disabled={updatingId === order.id}
                              onChange={(e) => handleStatusChange(order, e.target.value)}
                              sx={{
                                minWidth: 130,
                                fontSize: 13,
                                fontWeight: 700,
                                textTransform: "capitalize",
                                color: STATUS_COLORS[status] ?? "inherit",
                              }}
                            >
                              {options.map((s) => (
                                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                                  {s}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View details">
                            <IconButton
                              aria-label="View details"
                              onClick={() => setViewing(order)}
                              sx={{ color: TEAL_DARK }}
                            >
                              <VisibilityIcon />
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

      {/* Order details */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} fullWidth maxWidth="sm">
        {viewing && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: TEAL_DARK }}>
              Order #{viewing.id}
            </DialogTitle>

            <DialogContent>
              <Stack gap={0.5} sx={{ mb: 2 }}>
                <Typography>
                  <strong>Customer:</strong> {viewing.customer?.name ?? "Unknown"}
                  {viewing.customer?.email ? ` (${viewing.customer.email})` : ""}
                </Typography>
                <Typography>
                  <strong>Date:</strong> {formatDate(viewing)}
                </Typography>
                <Typography>
                  <strong>Contact:</strong> {viewing.contact_number}
                </Typography>
                <Typography>
                  <strong>Address:</strong> {viewing.address}
                </Typography>
                <Typography sx={{ textTransform: "capitalize" }}>
                  <strong>Status:</strong> {statusOf(viewing)}
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack gap={1.5}>
                {(viewing.items ?? []).map((item) => (
                  <Stack key={item.id} direction="row" alignItems="center" gap={1.5}>
                    <Avatar
                      variant="rounded"
                      src={item.product?.image_url ?? undefined}
                      alt={item.product?.name}
                      sx={{ bgcolor: TEAL_LIGHT, color: TEAL_DARK }}
                    >
                      {item.product?.name?.[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 700 }}>
                        {item.product?.name ?? `Product #${item.product_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.quantity} × {peso(item.price)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{peso(item.total)}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, color: TEAL_DARK }}>
                  {peso(orderTotal(viewing))}
                </Typography>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewing(null)} sx={{ color: TEAL_DARK }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
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