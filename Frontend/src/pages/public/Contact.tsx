import { useEffect, useState, type FormEvent } from "react";
import { submitContact } from "../../api/contact";
import { ApiError } from "../../api/client";
import type { FieldErrors } from "../../types";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact — SPMJ Foundation";
  }, []);

  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await submitContact(values);
      setSent(true);
      setValues({ name: "", email: "", message: "" });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1 className="display">Let's <span className="grad">talk</span>.</h1>
          <p className="lead">
            Want to donate, volunteer, partner with us, or simply learn more? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container two-col contact-wrap">
          <div className="contact-info">
            <h3>Reach us directly</h3>
            <p className="muted">We typically reply within two working days.</p>
            <ul className="contact-list">
              <li>
                <span className="contact-label">Email</span>
                <a href="mailto:sahyogjasali@gmail.com">sahyogjasali@gmail.com</a>
              </li>
              <li>
                <span className="contact-label">Phone</span>
                <a href="tel:+919998670081">+91 99986 70081</a>,{" "}
                <a href="tel:+919998500520">+91 99985 00520</a>
              </li>
              <li>
                <span className="contact-label">Palanpur Office</span>
                <span>SPMJ Foundation, 103/104 Shop No, Virat Complex, Prabhat Typing Gali<br />Near Jilla Panchayat, Palanpur, Banaskantha, Gujarat - 385001</span>
              </li>
              <li>
                <span className="contact-label">Tharad Office</span>
                <span>Police Station Road, Near Dashama Temple, Jode Dedodar<br />Vav Tharad, Banaskantha, Gujarat - 385330</span>
              </li>
              <li>
                <span className="contact-label">Registration No.</span>
                <span>F-723/B.K, Guj-737/B.K</span>
              </li>
            </ul>
          </div>

          <div className="contact-form-wrap">
            {sent && (
              <div className="alert success">
                <strong>Thank you — message received!</strong>
                <p>Our team will be in touch within two working days.</p>
              </div>
            )}
            <form className="contact-form" noValidate onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="name">Your name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Jane Cooper"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  required
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  required
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              <div className="form-row">
                <label htmlFor="message">How would you like to help?</label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Let us know if you'd like to donate, volunteer, partner with us, or simply learn more."
                  value={values.message}
                  onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                  required
                />
                {errors.message && <span className="error">{errors.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? "Sending…" : "Send message →"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
