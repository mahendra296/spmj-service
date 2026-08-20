import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found — SPMJ Foundation";
  }, []);

  return (
    <section className="page-hero" style={{ textAlign: "center" }}>
      <div className="container">
        <span className="eyebrow">Error 404</span>
        <h1 className="display">Hmm, <span className="grad">that page wandered off</span>.</h1>
        <p className="lead">The link you followed may be broken, or the page may have been moved.</p>
        <Link to="/" className="btn btn-primary btn-lg">Back to home →</Link>
      </div>
    </section>
  );
}
