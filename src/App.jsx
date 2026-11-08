import { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import api from "./api/axios";

import MainLayout from "./layouts/MainLayout";

import ProductListPage from "./pages/ProductListPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardPage from "./pages/DashboardPage";
 import UsersPage from "./pages/UserPage";  

// Pulls the item out of either { data: {...} } or {...}
const unwrap = (response) => response.data?.data ?? response.data;

// Builds multipart form data so the image file can be uploaded
const toFormData = (values) => {
  const fd = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "imageFile") {
      if (value) fd.append("image_file", value);
      return;
    }
    if (value !== null && value !== undefined) fd.append(key, value);
  });
  return fd;
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ: list all products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/products");
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError("Unable to load products. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // CREATE: POST /products (multipart)
  async function createProduct(values) {
    const response = await api.post("/products", toFormData(values));
    setProducts((current) => [...current, unwrap(response)]);
  }

  // UPDATE: multipart can't be read on a real PATCH in PHP,
  // so send POST with _method=PATCH (Laravel treats it as PATCH)
  async function updateProduct(id, values) {
    const fd = toFormData(values);
    fd.append("_method", "PATCH");
    const response = await api.post(`/products/${id}`, fd);
    const updated = unwrap(response);
    setProducts((current) =>
      current.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  }

  // DELETE: DELETE /products/{id}
  async function removeProduct(id) {
    await api.delete(`/products/${id}`);
    setProducts((current) => current.filter((p) => p.id !== id));
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>

        {/* Product Catalog */}
        <Route
          path="/"
          element={
            <ProductListPage
              products={products}
              loading={loading}
              error={error}
              onRefresh={loadProducts}
              onCreate={createProduct}
              onUpdate={updateProduct}
              onRemove={removeProduct}
            />
          }
        />
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
         <Route path="/users" element={<UsersPage />} />
        {/* Product Details (fetches its own data by id) */}
        <Route path="/products/:id" element={<ProductDetailsPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />

      </Route>
    </Routes>
  );
}