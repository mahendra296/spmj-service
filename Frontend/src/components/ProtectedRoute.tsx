import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="container" style={{ padding: "48px 0" }}>Loading…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "ROLE_ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}
