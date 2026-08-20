import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboard } from "../../api/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<{ events: number; posts: number; gallery: number; contact: number } | null>(null);

  useEffect(() => {
    getDashboard().then((data) => setCounts(data.counts));
  }, []);

  return (
    <>
      <div className="section-head" style={{ textAlign: "left", marginBottom: 32 }}>
        <span className="eyebrow">Dashboard</span>
        <h1>Welcome back, {user?.name}.</h1>
        <p className="muted">Manage events, blog posts, and the photo &amp; video gallery.</p>
      </div>

      <div className="grid grid-4 stats-row">
        <Link className="manage-card" to="/admin/events">
          <strong>{counts?.events ?? "—"}</strong>
          <span>Events</span>
          <span className="link-arrow">Manage events →</span>
        </Link>
        <Link className="manage-card" to="/admin/blog">
          <strong>{counts?.posts ?? "—"}</strong>
          <span>Blog &amp; news posts</span>
          <span className="link-arrow">Manage blog →</span>
        </Link>
        <Link className="manage-card" to="/admin/gallery">
          <strong>{counts?.gallery ?? "—"}</strong>
          <span>Gallery items</span>
          <span className="link-arrow">Manage gallery →</span>
        </Link>
        <Link className="manage-card" to="/admin/contact">
          <strong>{counts?.contact ?? "—"}</strong>
          <span>Contact messages</span>
          <span className="link-arrow">View messages →</span>
        </Link>
      </div>

      <div className="admin-panel">
        <h3>Quick actions</h3>
        <div className="hero-actions">
          <Link to="/admin/events/new" className="btn btn-primary">+ New event</Link>
          <Link to="/admin/blog/new" className="btn btn-primary">+ New post</Link>
          <Link to="/admin/gallery/new" className="btn btn-primary">+ Add media</Link>
        </div>
      </div>
    </>
  );
}
