import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import ProductCard from "../components/ProductCard";
import ProductFormDialog from "../components/ProductFormDialog";
import DeleteProductDialog from "../components/DeleteProductDialog";

export default function ProductListPage({
  products,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onRemove,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [notice, setNotice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [search, setSearch] = useState("");

  // Open Add Product Dialog
  const openAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  // Open Edit Product Dialog
  const openEdit = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  // Save or Update Product
  // If onCreate/onUpdate throws, the error goes to the dialog, which shows it
  // and stays open, so the lines after the await are skipped.
  const handleSave = async (values) => {
    if (editingProduct) {
      await onUpdate(editingProduct.id, values);
      setNotice("Product updated successfully.");
    } else {
      await onCreate(values);
      setNotice("Product added successfully.");
    }

    setFormOpen(false);
    setEditingProduct(null);
  };

  // Delete Product (a failure is shown inside the delete dialog)
  const handleDelete = async () => {
    if (!deletingProduct) return;

    await onRemove(deletingProduct.id);
    setDeletingProduct(null);
    setNotice("Product deleted successfully.");
  };

  // Search + sort
  const visibleProducts = products
    .filter((p) =>
      String(p.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.price) - Number(b.price);

        case "price-high":
          return Number(b.price) - Number(a.price);

        case "name-asc":
          return String(a.name ?? "").localeCompare(String(b.name ?? ""));

        case "name-desc":
          return String(b.name ?? "").localeCompare(String(a.name ?? ""));

        default:
          return 0;
      }
    });

  return (
    <main className="page-container">

      {/* Page Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <div>
          <Typography variant="h4" component="h1">
            Product Catalog
          </Typography>

          <Typography color="text.secondary">
            Browse and manage the store's products.
          </Typography>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
        >
          Add Product
        </Button>

        <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{ alignItems: { sm: "center" }, mb: 3 }}
>
  {/* Sort */}
  <FormControl size="small" sx={{ minWidth: 220 }}>
    <InputLabel id="sort-products-label">Sort Products</InputLabel>

    <Select
      labelId="sort-products-label"
      value={sortBy}
      label="Sort Products"
      onChange={(event) => setSortBy(event.target.value)}
    >
      <MenuItem value="default">Default Order</MenuItem>
      <MenuItem value="price-low">Price: Lowest to Highest</MenuItem>
      <MenuItem value="price-high">Price: Highest to Lowest</MenuItem>
      <MenuItem value="name-asc">Name: A to Z</MenuItem>
      <MenuItem value="name-desc">Name: Z to A</MenuItem>
    </Select>
  </FormControl>

  {/* Search */}
  <TextField
    size="small"
    label="Search by product name"
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    sx={{ flex: 1 }}
  />
</Stack>
        
      
      </Stack>
      {/* Product List */}
      {loading && <CircularProgress />}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && products.length === 0 && (
        <Alert severity="info">
          There are no products yet. Add your first product.
        </Alert>
      )}

      {!loading && !error && products.length > 0 && visibleProducts.length === 0 && (
        <Alert severity="info">No products match your search.Try different term.</Alert>
      )}

      {!loading && !error && visibleProducts.length > 0 && (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEdit}
              onDelete={setDeletingProduct}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Product Dialog */}
      <ProductFormDialog
        open={formOpen}
        product={editingProduct}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
      />

      {/* Success Notification */}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={() => setNotice("")}
          severity="success"
          variant="filled"
        >
          {notice}
        </Alert>
      </Snackbar>

    </main>
  );
}