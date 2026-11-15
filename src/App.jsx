import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import api from "./api/axios";

import MainLayout from "./layouts/MainLayout";
// Admin pages
import ProductListPage from "./pages/admin/ProductListPage";
import ProductDetailsPage from "./pages/admin/ProductDetailsPage";
import NotFoundPage from "./pages/admin/NotFoundPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UsersPage from "./pages/admin/UserPage";
import ReviewsPage from "./pages/admin/ReviewsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
// User pages
import UserDashboardPage from "./pages/User/UserDashboardPage";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import CartPage from "./pages/user/CartPage";
import AdminRoute from "./components/AdminRoute";
import ShopPage from "./pages/user/ShopPage";
import OrderPage from "./pages/user/OrderPage";

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

  // UPDATE: send POST with _method=PATCH so PHP can read the multipart body
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
        {/* Default route: user dashboard (public, guests can browse) */}
        <Route path="/" element={<UserDashboardPage />} />
        <Route path="/user" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/order-history" element={<OrderPage />} />

        {/* Product details */}
        <Route path="/products/:id" element={<ProductDetailsPage />} />

        {/* Admin pages */}
        <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />
        <Route path="/users" element={<UsersPage />} />

        <Route
          path="/admin/products"
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

        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <CategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <AdminRoute>
              <ReviewsPage />
            </AdminRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}