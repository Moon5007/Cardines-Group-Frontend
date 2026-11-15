import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import UserHeader from "../../components/userheader/UserHeader";

const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";

// Works with either [ ... ] or { data: [ ... ] } (Laravel paginate)
const toList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

const hasToken = () => Boolean(localStorage.getItem("token"));

const getImage = (product) =>
  product.image_url ??
  product.image ??
  product.photos?.[0]?.url ??
  product.photos?.[0]?.photo_url ??
  null;

const formatPrice = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value) || 0
  );

const chipSx = (active) => ({
  fontWeight: 700,
  bgcolor: active ? TEAL_DARK : "transparent",
  color: active ? "#fff" : TEAL_DARK,
  border: `1px solid ${TEAL_DARK}`,
  "&:hover": { bgcolor: active ? "#08463f" : TEAL_LIGHT },
});

const primaryBtnSx = {
  bgcolor: TEAL_DARK,
  fontWeight: 700,
  "&:hover": { bgcolor: "#08463f" },
};

export default function ShopPage() {
  const cart = useCart();
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(hasToken());
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";

  const selectCategory = (id) => {
    setSearchParams(id === "all" ? {} : { category: id });
  };

  // Stay in sync when the token is cleared (401) or changed in another tab
  useEffect(() => {
    const sync = () => setLoggedIn(hasToken());
    window.addEventListener("auth:unauthorized", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:unauthorized", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [productsRes, categoriesRes] = await Promise.allSettled([
      api.get("/products", { params: { per_page: 100 } }),
      api.get("/categories"),
    ]);

    if (productsRes.status === "fulfilled") {
      setProducts(toList(productsRes.value));
    } else {
      console.error("Products failed:", productsRes.reason);
      setError("Couldn't load products. Check that the API is running, then try again.");
    }

    if (categoriesRes.status === "fulfilled") {
      setCategories(toList(categoriesRes.value));
    } else {
      console.error("Categories failed:", categoriesRes.reason);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const categoryId = p.category_id ?? p.category?.id;
      const matchesCategory =
        activeCategory === "all" || String(categoryId) === String(activeCategory);
      const matchesSearch = !term || p.name?.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, activeCategory]);

  const requireLogin = () => {
    if (loggedIn) return true;
    setToast("Log in to order");
    navigate("/login", { state: { from: "/shop" } });
    return false;
  };

  const addProductToCart = (product) => {
    if (typeof cart?.addToCart !== "function") {
      setToast("Cart isn't available right now.");
      return false;
    }
    if (!(Number(product.stock) > 0)) {
      setToast("This item is out of stock.");
      return false;
    }
    // your context reads product.image, but the shop finds it with getImage()
    cart.addToCart({ ...product, image: getImage(product) });
    return true;
  };

  const handleAdd = (product) => {
    if (!requireLogin()) return;
    if (addProductToCart(product)) setToast(`${product.name} added to cart`);
  };

  // Order = add this item, then go straight to the cart
  const handleOrder = (product) => {
    if (!requireLogin()) return;
    if (addProductToCart(product)) navigate("/cart");
  };

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
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, color: TEAL_DARK, mb: 3 }}>
            Shop
          </Typography>

          {/* Search + refresh */}
          <Stack direction="row" gap={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { bgcolor: "background.paper", borderRadius: 2 },
                },
              }}
            />
            <Button
              onClick={load}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ color: TEAL_DARK, fontWeight: 700 }}
            >
              Refresh
            </Button>
          </Stack>

          {/* Category filter */}
          {categories.length > 0 && (
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
              <Chip
                label="All"
                clickable
                onClick={() => selectCategory("all")}
                sx={chipSx(activeCategory === "all")}
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  clickable
                  onClick={() => selectCategory(c.id)}
                  sx={chipSx(String(activeCategory) === String(c.id))}
                />
              ))}
            </Stack>
          )}

          {/* States */}
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
          ) : !error && visibleProducts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No products found
              </Typography>
              <Typography color="text.secondary">
                Try a different search or pick another category.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: {
                  xs: "repeat(1, 1fr)",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
              }}
            >
              {visibleProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  onAdd={handleAdd}
                  onOrder={handleOrder}
                />
              ))}
            </Box>
          )}
        </Container>

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2500}
          onClose={() => setToast("")}
          message={toast}
        />
      </Box>
    </>
  );
}

function ProductTile({ product, onAdd, onOrder }) {
  const image = getImage(product);
  const outOfStock = product.stock !== undefined && Number(product.stock) <= 0;

  return (
    <Card
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(11,93,87,0.15)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {image ? (
        <CardMedia
          component="img"
          image={image}
          alt={product.name}
          sx={{ height: 180, objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            display: "grid",
            placeItems: "center",
            bgcolor: TEAL_LIGHT,
            color: TEAL_DARK,
            fontWeight: 700,
          }}
        >
          No photo
        </Box>
      )}

      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1 }}>
        <Typography
          component={RouterLink}
          to={`/products/${product.id}`}
          sx={{
            fontWeight: 700,
            color: "inherit",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {product.name}
        </Typography>

        <Typography sx={{ color: TEAL_DARK, fontWeight: 800 }}>
          {formatPrice(product.price)}
        </Typography>

        {outOfStock && (
          <Typography variant="caption" sx={{ color: "error.main", fontWeight: 700 }}>
            Out of stock
          </Typography>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" sx={{ gap: 1, alignItems: "stretch" }}>
          <Tooltip title={outOfStock ? "Out of stock" : "Add to cart"}>
            <span>
              <IconButton
                aria-label="Add to cart"
                disabled={outOfStock}
                onClick={() => onAdd(product)}
                sx={{
                  height: "100%",
                  border: `1px solid ${TEAL_DARK}`,
                  borderRadius: 2,
                  color: TEAL_DARK,
                  "&:hover": { bgcolor: TEAL_LIGHT },
                }}
              >
                <AddShoppingCartIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            fullWidth
            size="small"
            variant="contained"
            disabled={outOfStock}
            onClick={() => onOrder(product)}
            sx={primaryBtnSx}
          >
            Order
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}