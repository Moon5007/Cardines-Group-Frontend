import {
  Button, Card, CardActions, CardContent, CardMedia, Chip, Stack, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const TEAL = "105, 228, 218"; // #69E4DA as RGB

const glassCard = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
  borderRadius: 4,
  background: `linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 45%, rgba(${TEAL},0.35) 100%)`,
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: `0 8px 32px rgba(${TEAL},0.35), inset 0 1px 0 rgba(255,255,255,0.8)`,
  transition: "transform .25s ease, box-shadow .25s ease",
  WebkitTapHighlightColor: "transparent",

  // light sweep across the card
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
    transform: "translateX(-120%)",
    transition: "transform .7s ease",
    pointerEvents: "none",
  },
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: `0 16px 40px rgba(${TEAL},0.55), inset 0 1px 0 rgba(255,255,255,0.9)`,
  },
  "&:hover::after": { transform: "translateX(120%)" },

  // touch press
  "&:active": { transform: "scale(0.97)" },
};

const glassButton = {
  borderRadius: 3,
  textTransform: "none",
  fontWeight: 600,
  color: "#0b5d57",
  background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.25))",
  border: "1px solid rgba(255,255,255,0.7)",
  backdropFilter: "blur(6px)",
  transition: "transform .15s ease, background .2s ease",
  "&:hover": {
    background: `linear-gradient(180deg, rgba(255,255,255,0.9), rgba(${TEAL},0.45))`,
  },
  "&:active": { transform: "scale(0.94)" },
  // MUI ripple color
  "& .MuiTouchRipple-child": { backgroundColor: "#69E4DA" },
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(price ?? 0));

// Derive status from stock quantity
const getStockStatus = (stock) => {
  const n = Number(stock);
  if (!Number.isFinite(n) || n <= 0) return { label: "Out of Stock", color: "#d32f2f" }; // red
  if (n <= 5) return { label: "Low Stock", color: "#ed6c02" }; // orange
  return { label: "Available", color: "#2e7d32" }; // green
};

export default function ProductCard({ product, onEdit = () => {}, onDelete = () => {} }) {
  const status = getStockStatus(product.stock);

  return (
    <Card sx={glassCard}>
      <CardMedia
        component="img"
        image={product.image_url || "https://placehold.co/600x400?text=Product"}
        alt={product.name}
       sx={{
    width: "100%",
    height: "auto",      // height follows the picture's own proportions
    maxHeight: 520,      // stops very tall pictures from making huge cards
    objectFit: "contain",
    display: "block",
  }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={product.category || "Uncategorized"}
            size="small"
            sx={{
              fontWeight: 600,
              color: "#0b5d57",
              background: `rgba(${TEAL},0.35)`,
              border: "1px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(4px)",
            }}
          />
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
        <Typography variant="h6" component="h2" gutterBottom>{product.name}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0b8a80" }}>
          {formatPrice(product.price)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {product.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button size="small" sx={glassButton} component={RouterLink} to={`/products/${product.id}`}>
          Details
        </Button>
        <Button size="small" sx={glassButton} onClick={() => onEdit(product)}>Edit</Button>
        <Button
          size="small"
          sx={{ ...glassButton, color: "#c62828", "& .MuiTouchRipple-child": { backgroundColor: "#ef5350" } }}
          onClick={() => onDelete(product)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}