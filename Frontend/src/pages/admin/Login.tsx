import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "ROLE_ADMIN" ? "/admin/dashboard" : "/"} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(
        from || (loggedInUser.role === "ROLE_ADMIN" ? "/admin/dashboard" : "/"),
        { replace: true }
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <a href="/" className="brand auth-brand">
        <span className="brand-mark">SPMJ</span>
        <span className="brand-dot"></span>
      </a>

      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to the SPMJ Foundation admin console.</p>

        {error && <div className="alert error">{error}</div>}

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              placeholder="you@spmjfoundation.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <a href="/" className="auth-back">← Back to website</a>
    </>
  );
}
