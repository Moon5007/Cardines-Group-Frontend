import { useState } from "react";
import {
  AppBar, Box, Tooltip,  Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemText,
  Toolbar, Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/images/myLogo.png";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
const TEAL_DARK = "#0b5d57";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Users", to: "/users" },
  { label: "Products", to: "/admin/products" },
  { label: "Orders", to: "/orders" },
  { label: "Inventory", to: "/inventory" },
  { label: "Reviews", to: "/reviews" },
  { label: "Reports", to: "/reports" },
  { label: "Categories", to: "/admin/categories" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role !== "admin") return null;

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // token may already be invalid; log out locally anyway
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("storage"));
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(105,228,218,0.35))",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          color: TEAL_DARK,
        }}
      >
        {/* space-between: logo on the left, everything else on the far right edge */}
        <Toolbar sx={{ justifyContent: "space-between", pl: 2, pr: { xs: 0.5, md: 1 } }}>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/dashboard"
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

          {/* Right edge */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Desktop: links + logout shown directly in the header */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: "center" }}>
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Button
                    key={item.label}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 1.5,
                      background: active ? "rgba(255,255,255,0.6)" : "transparent",
                      "&:hover": { background: "rgba(105,228,218,0.35)" },
                      "&:active": { transform: "scale(0.97)" },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}

            <Tooltip title="Logout" arrow>
              <IconButton
                variant="outlined"
                size="small"
                onClick={logout}
                sx={{
                  ml: 1,
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 1.5,
                  borderColor: TEAL_DARK,
                  color: TEAL_DARK,
                }}
              >
                <LogoutRoundedIcon />
              </IconButton>
            </Tooltip>
            </Box>

            {/* Phone: burger on the far right edge */}
            <IconButton
              color="inherit"
              edge="end"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Phone: the same links inside the drawer, opening from the right */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, rgba(255,255,255,0.8), rgba(105,228,218,0.35))",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            borderLeft: "1px solid rgba(74, 167, 220, 0.6)",
          },
        }}
      >
        <Box sx={{ width: 250 }} role="navigation" onClick={() => setDrawerOpen(false)}>
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.label}
                component={RouterLink}
                to={item.to}
                selected={pathname === item.to}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  color: TEAL_DARK,
                  "&.Mui-selected": { background: "linear-gradient(160deg, rgba(255,255,255,0.8), rgba(105,228,218,0.35))" },
                  "&:hover": { background: "rgba(105,228,218,0.35)" },
                  "&:active": { transform: "scale(0.97)" },
                  "& .MuiTouchRipple-child": { backgroundColor: "#69E4DA" },
                }}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            ))}

            <Divider sx={{ my: 1 }} />

            <ListItemButton
              onClick={logout}
              sx={{
                mx: 1,
                borderRadius: 2,
                color: TEAL_DARK,
                "&:hover": { background: "rgba(105,228,218,0.35)" },
              }}
            >
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}