import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Not logged in -> go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not an admin -> go to the user home page
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}