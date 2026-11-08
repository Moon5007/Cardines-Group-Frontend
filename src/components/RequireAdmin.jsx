import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  return localStorage.getItem('admin_token')
    ? children
    : <Navigate to="/admin/login" replace />;
}