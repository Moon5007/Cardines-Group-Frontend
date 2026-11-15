import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, Navigate } from "react-router-dom";
import api from "../../api/axios";
import UserHeader from "../../components/userheader/UserHeader";

const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";

const hasToken = () => Boolean(localStorage.getItem("token"));

// Works with either [ ... ] or { data: [ ... ] }
const toList = (response) => {
  const d = response.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value) || 0
  );

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const statusColor = (status = "") => {
  const s = String(status).toLowerCase();
  if (["delivered", "completed", "paid"].includes(s)) return "#2e9e4f";
  if (["cancelled", "canceled", "failed"].includes(s)) return "#d63b3b";
  if (["shipped", "processing"].includes(s)) return "#1976d2";
  return "#ef8a17"; // pending / anything else
};

// The API may name these a few different ways, so read them defensively
const getItems = (order) =>
  order.items ?? order.order_products ?? order.orderProducts ?? [];
const itemName = (i) => i.product?.name ?? i.name ?? "Product";
const itemPrice = (i) => Number(i.price ?? i.product?.price) || 0;
const itemQty = (i) => Number(i.quantity) || 1;
const itemTotal = (i) => Number(i.total) || itemPrice(i) * itemQty(i);
const orderTotal = (o) =>
  Number(o.total_amount ?? o.total ?? o.amount) ||
  getItems(o).reduce((sum, i) => sum + itemTotal(i), 0);

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/my-orders");
      setOrders(toList(res));
    } catch (err) {
      console.error("Orders failed:", err);
      setError("Couldn't load your orders. Check that the API is running, then try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasToken()) load();
  }, [load]);

  if (!hasToken()) {
    return <Navigate to="/login" replace state={{ from: "/order-history" }} />;
  }

  return (
    <>
      <UserHeader />

      <Box
        sx={{
          minHeight: "100%",
          py: { xs: 3, md: 5 },
          background: `linear-gradient(180deg, ${TEAL_LIGHT} 0%, rgba(255,255,255,0) 280px)`,
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction="row"
            sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: TEAL_DARK }}>
                My Orders
              </Typography>
              <Typography color="text.secondary">
                Track what you've ordered.
              </Typography>
            </Box>

            <Button
              onClick={load}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ color: TEAL_DARK, fontWeight: 700 }}
            >
              Refresh
            </Button>
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
          ) : !error && orders.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No orders yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Your orders will show up here once you check out.
              </Typography>
              <Button
                component={RouterLink}
                to="/"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  bgcolor: TEAL_DARK,
                  "&:hover": { bgcolor: "#08463f" },
                }}
              >
                Browse products
              </Button>
            </Box>
          ) : (
            !error && (
              <Stack spacing={2}>
                {orders.map((order) => {
                  const items = getItems(order);
                  return (
                    <Accordion
                      key={order.id}
                      disableGutters
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid rgba(11,93,87,0.15)",
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(105,228,218,0.2))",
                        backdropFilter: "blur(16px) saturate(160%)",
                        WebkitBackdropFilter: "blur(16px) saturate(160%)",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack
                          direction="row"
                          sx={{
                            width: "100%",
                            pr: 1,
                            gap: 2,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: TEAL_DARK }}>
                              Order #{order.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(order.created_at)} · {items.length}{" "}
                              {items.length === 1 ? "item" : "items"}
                            </Typography>
                          </Box>

                          <Stack
                            direction="row"
                            sx={{ gap: 1.5, alignItems: "center" }}
                          >
                            <Chip
                              size="small"
                              label={order.status ?? "pending"}
                              sx={{
                                bgcolor: statusColor(order.status),
                                color: "#fff",
                                fontWeight: 700,
                                textTransform: "capitalize",
                              }}
                            />
                            <Typography sx={{ fontWeight: 800 }}>
                              {formatPrice(orderTotal(order))}
                            </Typography>
                          </Stack>
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails>
                        <Divider sx={{ mb: 1.5 }} />
                        {items.length === 0 ? (
                          <Typography color="text.secondary">
                            No item details for this order.
                          </Typography>
                        ) : (
                          <Stack spacing={1.25}>
                            {items.map((item, index) => (
                              <Stack
                                key={item.id ?? index}
                                direction="row"
                                sx={{
                                  gap: 2,
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {itemName(item)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatPrice(itemPrice(item))} × {itemQty(item)}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  {formatPrice(itemTotal(item))}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            )
          )}
        </Container>
      </Box>
    </>
  );
}