import { useEffect, useState } from "react";
import {
  Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from "@mui/material";
import api from "../api/axios";

const emptyForm = {
  name: "",
  price: "",
  category: "",
  image: "",
  description: "",
  stock: "",
  sku: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255, 255, 255, 0.45)",
    borderRadius: 3,
  },
};

// Derive status from stock quantity
const getStatusLabel = (stock) => {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 5) return "Low Stock";
  return "Available";
};

export default function ProductFormDialog({ open, product, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  // Load category names for the autocomplete
  useEffect(() => {
    let active = true;
    api
      .get("/categories")
      .then((res) => {
        const list = res.data?.data ?? res.data;
        if (!Array.isArray(list)) return;
        const names = list.map((c) => (typeof c === "string" ? c : c.name));
        if (active) setCategoryOptions(names.filter(Boolean));
      })
      .catch(() => {
        if (active) setCategoryOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name ?? "",
              price: String(product.price ?? ""),
              category:
                typeof product.category === "object"
                  ? product.category?.name ?? ""
                  : product.category ?? "",
              image: product.image ?? "",
              description: product.description ?? "",
              stock: String(product.stock ?? ""),
              sku: product.sku ?? "",
            }
          : emptyForm
      );
      setImageFile(null);
      setErrors({});
    }
  }, [open, product]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.sku.trim()) nextErrors.sku = "SKU is required.";
    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.category.trim()) nextErrors.category = "Category is required.";
    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      nextErrors.price = "Enter a valid price of zero or more.";
    }
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0) {
      nextErrors.stock = "Enter a whole number of zero or more.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSave({
        name: form.name.trim(),
        price,
        category: form.category.trim(),
        image: form.image.trim() || null,
        imageFile,
        description: form.description.trim(),
        stock,
        sku: form.sku.trim(),
        status: getStatusLabel(stock), // derived from stock; remove if the API doesn't need it
      });
    } catch (err) {
      const serverErrors = err.response?.data?.errors; // Laravel 422: { field: ["message"] }

      if (serverErrors) {
        const mapped = {};
        Object.entries(serverErrors).forEach(([field, messages]) => {
          const key = field === "image_file" ? "image" : field;
          mapped[key] = messages[0];
        });
        setErrors(mapped);
      } else {
        setErrors({
          form: err.response?.data?.message || "Something went wrong. Please try again.",
        });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: "blur(4px)", background: "rgba(11, 43, 41, 0.35)" },
        },
        paper: {
          sx: {
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            border: "1px solid rgba(255, 255, 255, 0.7)",
            borderRadius: 4,
            boxShadow: "0 16px 48px rgba(15, 158, 148, 0.3)",
          },
        },
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {product ? "Edit Product" : "Add Product"}
        </DialogTitle>
        <DialogContent>
          {errors.form && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {errors.form}
            </Alert>
          )}
          <TextField
            autoFocus margin="normal" fullWidth label="Product name"
            name="name" value={form.name} onChange={handleChange}
            error={Boolean(errors.name)} helperText={errors.name}
            sx={fieldSx}
            required
          />
          <TextField
            margin="normal" fullWidth label="Price (PHP)" name="price"
            type="number" slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            value={form.price} onChange={handleChange}
            error={Boolean(errors.price)} helperText={errors.price}
            sx={fieldSx}
            required
          />
          <TextField
            margin="normal" fullWidth label="Stock" name="stock"
            type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }}
            value={form.stock} onChange={handleChange}
            error={Boolean(errors.stock)} helperText={errors.stock}
            sx={fieldSx}
            required
          />
          <TextField
            margin="normal" fullWidth label="SKU" name="sku"
            value={form.sku} onChange={handleChange}
            error={Boolean(errors.sku)} helperText={errors.sku}
            sx={fieldSx}
            required
          />
          <Autocomplete
            freeSolo
            options={categoryOptions}
            inputValue={form.category}
            onInputChange={(_, value) =>
              handleChange({ target: { name: "category", value } })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal" fullWidth label="Category" required
                error={Boolean(errors.category)} helperText={errors.category}
                sx={fieldSx}
              />
            )}
          />
          <TextField
            margin="normal" fullWidth label="Image file name or URL" name="image"
            helperText={errors.image || "Optional: a full image URL. Or use Upload image below."}
            error={Boolean(errors.image)}
            value={form.image} onChange={handleChange}
            sx={fieldSx}
          />
          <Button component="label" variant="outlined" sx={{ mb: 1, borderRadius: 999 }}>
            {imageFile ? imageFile.name : "Upload image"}
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          <TextField
            margin="normal" fullWidth label="Description" name="description"
            value={form.description} onChange={handleChange}
            multiline minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ borderRadius: 999 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ borderRadius: 999, boxShadow: "none" }}
          >
            {product ? "Save Changes" : "Add Product"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}