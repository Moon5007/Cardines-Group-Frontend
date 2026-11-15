import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import UserHeader from "../../components/userheader/UserHeader";

const TEAL_DARK = "#0b5d57";

const hasToken = () => Boolean(localStorage.getItem("token"));

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(price) || 0);

const errorMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return err.response?.data?.message ?? fallback;
};

const glass = {
  background: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
  border: "1px solid rgba(255, 255, 255, 0.7)",
  boxShadow: "0 8px 32px rgba(11, 93, 87, 0.15)",
  borderRadius: 4,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Removes every item from the saved cart, one by one
  const handleClear = async () => {
    for (const item of items) {
      await removeFromCart(item.id);
    }
  };

  const handleCheckout = () => {
    if (!hasToken()) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setCheckoutError("");
    setDialogOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address.trim() || !contactNumber.trim()) {
      setCheckoutError("Please enter your delivery address and contact number.");
      return;
    }

    setPlacing(true);
    setCheckoutError("");

    try {
      // The server recalculates prices and checks stock; we only send ids and quantities
      await api.post("/orders", {
        address: address.trim(),
        contact_number: contactNumber.trim(),
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });

      clearCart();
      setDialogOpen(false);
      navigate("/order-history");
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError(errorMessage(err, "Couldn't place your order. Please try again."));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <UserHeader />
        <main className="page-container">
          <Paper elevation={0} sx={{ ...glass, p: 5, textAlign: "center" }}>
            <ShoppingCartIcon sx={{ fontSize: 64, color: TEAL_DARK }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
              Your cart is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add some products to get started.
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              sx={{ borderRadius: 999, bgcolor: TEAL_DARK, "&:hover": { bgcolor: "#08463f" } }}
            >
              Browse products
            </Button>
          </Paper>
        </main>
      </>
    );
  }

  return (
    <>
      <UserHeader />

      <main className="page-container">
        <Stack
          direction="row"
          sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h4" component="h1" sx={{ color: TEAL_DARK }}>
            My Cart
          </Typography>
          <Button color="error" onClick={handleClear} sx={{ borderRadius: 999 }}>
            Clear cart
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={2}>
            {items.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  ...glass,
                  p: 2,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                <Box
                  component="img"
                  src={item.image || "https://placehold.co/600x400?text=Product"}
                  alt={item.name}
                  sx={{ width: 96, height: 96, objectFit: "cover", borderRadius: 3 }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 140 }}>
                  <Typography
                    component={RouterLink}
                    to={`/products/${item.id}`}
                    sx={{ fontWeight: 700 }}
                  >
                    {item.name}
                  </Typography>
                  <Typography color="primary" sx={{ fontWeight: 700 }}>
                    {formatPrice(item.price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.stock} in stock
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <IconButton
                    size="small"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>

                <Typography sx={{ minWidth: 90, textAlign: "right", fontWeight: 700 }}>
                  {formatPrice(item.price * item.quantity)}
                </Typography>

                <IconButton
                  color="error"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeFromCart(item.id)}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>

          <Paper elevation={0} sx={{ ...glass, p: 3, position: { md: "sticky" }, top: { md: 88 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Order summary
            </Typography>
            <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between" }}>
              <Typography color="text.secondary">Items</Typography>
              <Typography>{totalItems}</Typography>
            </Stack>
            <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800 }} color="primary">
                {formatPrice(totalPrice)}
              </Typography>
            </Stack>
            <Button
              fullWidth
              size="large"
              variant="contained"
              sx={{ borderRadius: 999, bgcolor: TEAL_DARK, "&:hover": { bgcolor: "#08463f" } }}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <Button
              fullWidth
              component={RouterLink}
              to="/"
              sx={{ mt: 1, borderRadius: 999 }}
            >
              Continue shopping
            </Button>
          </Paper>
        </Box>
      </main>

      {/* Delivery details */}
      <Dialog
        open={dialogOpen}
        onClose={() => !placing && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handlePlaceOrder}>
          <DialogTitle sx={{ fontWeight: 800, color: TEAL_DARK }}>Delivery details</DialogTitle>

          <DialogContent>
            <Stack gap={2} sx={{ pt: 1 }}>
              {checkoutError && <Alert severity="error">{checkoutError}</Alert>}

              <TextField
                label="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                multiline
                rows={3}
                required
                autoFocus
              />

              <TextField
                label="Contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />

              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography color="text.secondary">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{formatPrice(totalPrice)}</Typography>
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={placing} sx={{ color: TEAL_DARK }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={placing}
              sx={{ bgcolor: TEAL_DARK, fontWeight: 700, "&:hover": { bgcolor: "#08463f" } }}
            >
              {placing ? "Placing order..." : "Place order"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}