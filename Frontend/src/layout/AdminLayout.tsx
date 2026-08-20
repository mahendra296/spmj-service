import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/blog", label: "Blog" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/donations", label: "Donations" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div data-page="admin">
      <header className="admin-header">
        <div className="container nav-container">
          <NavLink to="/admin/dashboard" className="brand">
            <span className="brand-mark">SPMJ</span>
            <span className="brand-dot"></span>
            <span className="admin-tag">Admin</span>
          </NavLink>
          <nav className="admin-nav" aria-label="Admin">
            {ADMIN_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {user && (
              <span className="muted">
                Signed in as <strong>{user.name}</strong>
              </span>
            )}
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container admin-main">
        <Outlet />
      </main>
    </div>
  );
}
