
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import { Link as RouterLink, useParams } from "react-router-dom";
import api from "../api/axios";

// Format product price to Philippine Peso
const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price));

// Derive status from stock quantity
const getStockStatus = (stock) => {
  const n = Number(stock);
  if (!Number.isFinite(n) || n <= 0) return { label: "Out of Stock", color: "#d32f2f" }; // red
  if (n <= 5) return { label: "Low Stock", color: "#ed6c02" }; // orange
  return { label: "Available", color: "#2e7d32" }; // green
};

export default function ProductDetailsPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ: view one product from the API
  useEffect(() => {
    let active = true; // ignore results if the user navigates away mid-request

    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/products/${id}`);
        const data = response.data?.data ?? response.data;
        if (active) setProduct(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.status === 404
              ? "Product not found."
              : "Unable to load this product. Please try again later."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      active = false;
    };
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <main className="page-container" style={{ minHeight: "100vh" }}>
        <CircularProgress />
      </main>
    );
  }

  // Error / not found state
  if (error || !product) {
    return (
      <main
        className="page-container"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #69E4DA, #FFFFFF)",
        }}
      >
        <Alert severity="warning">{error || "Product not found."}</Alert>
        <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
          Return to catalog
        </Button>
      </main>
    );
  }

  // Status is derived from stock quantity
  const status = getStockStatus(product.stock);

  return (
    <main
      className="page-container"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Product Details Card */}
      <Card
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          overflow: "hidden",
          background: "linear-gradient(to bottom, #69E4DA, #FFFFFF)",
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        {/* Product Image */}
        <CardMedia
          component="img"
          image={product.image_url || "https://placehold.co/600x400?text=Product"}
          alt={product.name}
          sx={{
            height: {
              xs: 260,
              md: "100%",
            },
            minHeight: 320,
            objectFit: "cover",
          }}
        />

        {/* Product Information */}
        <Stack
          spacing={2}
          sx={{
            p: {
              xs: 2.5,
              md: 4,
            },
            alignItems: "flex-start",
          }}
        >
          <Typography color="text.secondary">{product.category}</Typography>

          <Typography variant="h4" component="h1">
            {product.name}
          </Typography>

          {/* Product Price */}
          <Typography variant="h5" color="primary">
            {formatPrice(product.price)}
          </Typography>

          {/* Product Stock */}
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              Stock
            </Typography>

            <Typography variant="body1" fontWeight="bold">
              {product.stock ?? 0} units
            </Typography>
          </Stack>

          {/* Product Status (derived from stock) */}
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              Product Status
            </Typography>

            <Chip
              label={status.label}
              size="small"
              sx={{
                fontWeight: 700,
                color: status.color,
                backgroundColor: `${status.color}1f`,
                border: `1px solid ${status.color}`,
              }}
            />
          </Stack>

          {/* Product Description */}
          <Typography>
            {product.description || "No description provided."}
          </Typography>

          {/* Return Button */}
          <Button component={RouterLink} to="/" variant="contained">
            Return to catalog
          </Button>
        </Stack>
      </Card>
    </main>
  );
}