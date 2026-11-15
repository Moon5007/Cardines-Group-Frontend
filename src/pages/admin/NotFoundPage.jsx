import AdminNotFound from "./AdminNotFound";
import UserNotFound from "../user/UserNotFound";

export default function NotFoundPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return user?.role === "admin" ? <AdminNotFound /> : <UserNotFound />;
}