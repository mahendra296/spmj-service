import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEventAdmin, createEvent, updateEvent } from "../../api/events";
import { ApiError } from "../../api/client";
import type { FieldErrors } from "../../types";
import { useToast } from "../../components/Toast";

interface Props {
  mode: "create" | "edit";
}

interface FormState {
  title: string;
  summary: string;
  eventDate: string;
  location: string;
  description: string;
  published: boolean;
}

const EMPTY: FormState = { title: "", summary: "", eventDate: "", location: "", description: "", published: true };

export default function EventForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");

  const heading = mode === "create" ? "Create event" : "Edit event";

  useEffect(() => {
    document.title = `${heading} — SPMJ Admin`;
  }, [heading]);

  useEffect(() => {
    if (mode === "edit" && id) {
      getEventAdmin(Number(id)).then(({ event }) => {
        setForm({
          title: event.title,
          summary: event.summary || "",
          eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
          location: event.location || "",
          description: event.description,
          published: event.published,
        });
        setCoverImage(event.coverImage);
        setLoading(false);
      });
    }
  }, [mode, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const data = new FormData();
    data.set("title", form.title);
    data.set("summary", form.summary);
    data.set("eventDate", form.eventDate);
    data.set("location", form.location);
    data.set("description", form.description);
    data.set("published", form.published ? "true" : "false");
    if (file) data.set("coverImage", file);

    try {
      if (mode === "create") {
        await createEvent(data);
        toast.success("Event created.");
      } else {
        await updateEvent(Number(id), data);
        toast.success("Event updated.");
      }
      navigate("/admin/events");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors || {});
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Events</span>
          <h1>{heading}</h1>
        </div>
        <Link to="/admin/events" className="btn btn-ghost">← Back</Link>
      </div>

      <div className="admin-panel form-panel">
        <form className="contact-form" noValidate onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input type="text" id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          <div className="form-row">
            <label htmlFor="summary">Short summary <span className="muted">(optional)</span></label>
            <input type="text" id="summary" maxLength={500} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
            {errors.summary && <span className="error">{errors.summary}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label htmlFor="eventDate">Date &amp; time</label>
              <input type="datetime-local" id="eventDate" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} required />
              {errors.eventDate && <span className="error">{errors.eventDate}</span>}
            </div>
            <div className="form-row">
              <label htmlFor="location">Location <span className="muted">(optional)</span></label>
              <input type="text" id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              {errors.location && <span className="error">{errors.location}</span>}
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows={8} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            <span className="muted" style={{ fontSize: ".82rem" }}>Separate paragraphs with a blank line.</span>
            {errors.description && <span className="error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <label htmlFor="coverImage">Cover image <span className="muted">(optional, max 5MB)</span></label>
            <input type="file" id="coverImage" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {coverImage && (
              <div className="form-preview">
                <img src={coverImage} alt="Current cover" />
                <span className="muted">Current cover — uploading a new file replaces it.</span>
              </div>
            )}
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            <span>Published (visible on the public site)</span>
          </label>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save event"}
          </button>
        </form>
      </div>
    </>
  );
}
