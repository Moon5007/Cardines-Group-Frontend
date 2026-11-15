import { useEffect, useState } from "react";
import { AppBar, Badge, Box, Button, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/images/myLogo.png";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

const TEAL_DARK = "#0b5d57";
const hasToken = () => Boolean(localStorage.getItem("token"));

const guestRoutes = [{ label: "Home", to: "/" }];

const userRoutes = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Order History", to: "/order-history" },
];

export default function UserHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { totalItems, clearCart } = useCart();

  // Only used to force a re-render when auth changes; the real value is read below
  const [, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("auth:unauthorized", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("auth:unauthorized", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Read fresh on every render (including after Not Found -> Home)
  const loggedIn = hasToken();

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // token may already be invalid; log out locally anyway
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof clearCart === "function") clearCart();
      window.dispatchEvent(new Event("storage"));
      navigate("/login", { replace: true });
    }
  };

  const routes = loggedIn ? userRoutes : guestRoutes;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(105,228,218,0.35))",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
        color: "#0b5d57",
      }}
    >
      <Toolbar
        sx={{
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.5,
          py: 1,
          minHeight: "auto",
          pl: 2,
          pr: { xs: 0.5, md: 1 },
        }}
      >
        {/* Top row: logo (left) + auth actions (right) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            width: "100%",
          }}
        >
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              color: "inherit",
              textDecoration: "none",
              transition: "transform .15s ease",
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="GoCart logo"
              sx={{ height: { xs: 32, sm: 40 }, width: { xs: 32, sm: 40 }, objectFit: "contain" }}
            />
            <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              GoCart
            </Typography>
          </Box>

          {/* Auth actions (upper right) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {loggedIn ? (
              <>
              <Tooltip title="View Cart" arrow>
                <IconButton
                  component={RouterLink}
                  to="/cart"
                  aria-label="View Cart"
                  sx={{ color: TEAL_DARK }}
                >
                  <Badge badgeContent={totalItems} color="primary" max={99}>
                    <ShoppingCartOutlinedIcon />
                  </Badge>
                </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={logout}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 1.5,
                    borderColor: TEAL_DARK,
                    color: TEAL_DARK,
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 1.5,
                    borderColor: TEAL_DARK,
                    color: TEAL_DARK,
                  }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 1.5,
                    bgcolor: TEAL_DARK,
                    "&:hover": { bgcolor: "#08463f" },
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Nav routes under the logo */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          {routes.map((route) => (
            <Button
              key={route.to}
              component={RouterLink}
              to={route.to}
              color="inherit"
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 1.5,
                bgcolor: pathname === route.to ? "rgba(11,93,87,0.12)" : "transparent",
              }}
            >
              {route.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}