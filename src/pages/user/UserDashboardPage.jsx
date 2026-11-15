import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  CircularProgress,
  Container,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import UserHeader from "../../components/userheader/UserHeader";

const BLUE = "#4f86ad";
const BORDER = "1px solid rgba(0,0,0,0.35)";

// Put your banner in /public (e.g. public/images/banner.png) and set "/images/banner.png"
const BANNER_SRC = null;

// Works with either [ ... ] or { data: [ ... ] }
const toList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

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

export default function UserDashboardPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category filter: stored but not applied yet (for later use)
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const [categoriesRes, productsRes] = await Promise.allSettled([
        api.get("/categories"),
        api.get("/products"),
      ]);

      if (categoriesRes.status === "fulfilled") setCategories(toList(categoriesRes.value));
      if (productsRes.status === "fulfilled") setProducts(toList(productsRes.value));

      setLoading(false);
    };
    load();
  }, []);

  // Open the shop filtered to this category
  const handleCategoryClick = (category) => {
    navigate(`/shop?category=${category.id}`);
  };

  const featured = products.slice(0, 5);

  return (
    <>
      <UserHeader />

      <Box
        sx={{
          minHeight: "100vh",
          py: { xs: 2, md: 3 },
          background: `linear-gradient(180deg, ${BLUE} 0%, #ffffff 520px)`,
        }}
      >
        <Container maxWidth="lg">
          {/* Category filter (placeholder) */}
          <Select
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{
              mb: 2,
              minWidth: 220,
              bgcolor: "#fff",
              borderRadius: 3,
              fontSize: 13,
            }}
          >
            <MenuItem value="all">All Categories / Sorter</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>

          {/* Banner */}
          {BANNER_SRC ? (
            <Box
              component="img"
              src={BANNER_SRC}
              alt="Promotions"
              sx={{ width: "100%", height: { xs: 110, md: 150 }, objectFit: "cover", mb: 3 }}
            />
          ) : (
            <Box
              sx={{
                height: { xs: 110, md: 150 },
                mb: 3,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: { xs: 22, md: 32 },
                background: "linear-gradient(90deg, #ff7a18 0%, #ffb347 100%)",
              }}
            >
              Great deals are waiting for you
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Shop by category */}
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Shop by category</Typography>

              <Stack
                direction="row"
                gap={2}
                sx={{ mb: 4, overflowX: "auto", pb: 1 }}
              >
                {categories.map((c) => (
                  <Card
                    key={c.id}
                    elevation={0}
                    onClick={() => handleCategoryClick(c)}
                    sx={{
                      flex: "0 0 auto",
                      width: 120,
                      border: BORDER,
                      borderRadius: 0,
                      cursor: "pointer",
                    }}
                  >
                    {c.image_url ? (
                      <CardMedia
                        component="img"
                        image={c.image_url}
                        alt={c.name}
                        sx={{ height: 95, objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 95,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "#e8eef3",
                          fontSize: 12,
                        }}
                      >
                        No image
                      </Box>
                    )}
                    <Typography
                      noWrap
                      sx={{
                        py: 0.5,
                        px: 0.5,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        borderTop: BORDER,
                        textTransform: "uppercase",
                        bgcolor: "#fff",
                      }}
                    >
                      {c.name}
                    </Typography>
                  </Card>
                ))}
              </Stack>

              {/* Featured products */}
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Featured Products</Typography>

              {featured.length === 0 ? (
                <Typography color="text.secondary">No products yet.</Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                      md: "repeat(5, 1fr)",
                    },
                  }}
                >
                  {featured.map((p) => (
                    <FeaturedCard key={p.id} product={p} onOpen={() => navigate(`/products/${p.id}`)} />
                  ))}
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}

function FeaturedCard({ product, onOpen }) {
  const image = getImage(product);
  const rating = product.rating ?? product.reviews_avg_rating;

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{ border: BORDER, borderRadius: 0, cursor: "pointer", bgcolor: "#fff" }}
    >
      {image ? (
        <CardMedia
          component="img"
          image={image}
          alt={product.name}
          sx={{ height: 120, objectFit: "contain", p: 1 }}
        />
      ) : (
        <Box sx={{ height: 120, display: "grid", placeItems: "center", bgcolor: "#e8eef3", fontSize: 12 }}>
          No photo
        </Box>
      )}

      <Box sx={{ p: 1, borderTop: BORDER }}>
        <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
          {product.name}
        </Typography>
        <Typography sx={{ fontSize: 12 }}>{formatPrice(product.price)}</Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
          {rating !== undefined && rating !== null ? (
            <Stack direction="row" alignItems="center" gap={0.5}>
              <StarIcon sx={{ fontSize: 14, color: "#f5b301" }} />
              <Typography sx={{ fontSize: 10 }}>Rating: {Number(rating).toFixed(0)}/5</Typography>
            </Stack>
          ) : (
            <span />
          )}
          {product.total_sold !== undefined && (
            <Typography sx={{ fontSize: 10 }}>Sold {product.total_sold}</Typography>
          )}
        </Stack>
      </Box>
    </Card>
  );
}