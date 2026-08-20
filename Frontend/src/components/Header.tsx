import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Programs" },
  { to: "/events", label: "Events" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 720) setNavOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className={`site-header${navOpen ? " nav-open" : ""}${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-container">
        <NavLink to="/" className="brand" aria-label="SPMJ Foundation home" onClick={() => setNavOpen(false)}>
          <span className="brand-mark">SPMJ</span>
          <span className="brand-dot"></span>
        </NavLink>
        <nav className="primary-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setNavOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <NavLink to="/admin/dashboard" className="btn btn-ghost" onClick={() => setNavOpen(false)}>
                Dashboard
              </NavLink>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/admin/login" className="btn btn-ghost" onClick={() => setNavOpen(false)}>
              Admin
            </NavLink>
          )}
          <NavLink to="/donate" className={({ isActive }) => `btn btn-primary${isActive ? " active" : ""}`}
            onClick={() => setNavOpen(false)}>
            Donate
          </NavLink>
        </div>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
