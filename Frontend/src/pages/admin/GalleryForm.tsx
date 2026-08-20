import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getGalleryAdmin, createGalleryItem, updateGalleryItem } from "../../api/gallery";
import { listEventsMeta } from "../../api/events";
import { ApiError } from "../../api/client";
import type { FieldErrors, MediaType } from "../../types";
import { useToast } from "../../components/Toast";

interface Props {
  mode: "create" | "edit";
}

interface FormState {
  title: string;
  mediaType: MediaType;
  caption: string;
  mediaUrl: string; // the visible "paste URL" input — only for external URLs
  eventId: string;
}

const EMPTY: FormState = { title: "", mediaType: "image", caption: "", mediaUrl: "", eventId: "" };

export default function GalleryForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [events, setEvents] = useState<{ id: number; title: string }[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const heading = mode === "create" ? "Add media" : "Edit media";

  useEffect(() => {
    document.title = `${heading} — SPMJ Admin`;
  }, [heading]);

  useEffect(() => {
    (async () => {
      const [eventsMeta, item] = await Promise.all([
        listEventsMeta(),
        mode === "edit" && id ? getGalleryAdmin(Number(id)) : Promise.resolve(null),
      ]);
      setEvents(eventsMeta.events);
      if (item) {
        const isFile = item.item.mediaUrl.startsWith("/uploads/");
        setForm({
          title: item.item.title || "",
          mediaType: item.item.mediaType,
          caption: item.item.caption || "",
          mediaUrl: isFile ? "" : item.item.mediaUrl,
          eventId: item.item.eventId ? String(item.item.eventId) : "",
        });
        setExistingMediaUrl(item.item.mediaUrl);
      }
      setLoading(false);
    })();
  }, [mode, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const data = new FormData();
    data.set("title", form.title);
    data.set("mediaType", form.mediaType);
    data.set("caption", form.caption);
    // A new upload wins on the Backend; otherwise send the typed URL, falling
    // back to whatever media the item already has so it isn't lost on save.
    data.set("mediaUrl", form.mediaUrl.trim() || existingMediaUrl || "");
    if (form.eventId) data.set("eventId", form.eventId);
    if (file) data.set("mediaFile", file);

    try {
      if (mode === "create") {
        await createGalleryItem(data);
        toast.success("Media added to the gallery.");
      } else {
        await updateGalleryItem(Number(id), data);
        toast.success("Media updated.");
      }
      navigate("/admin/gallery");
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

  const previewIsFile = existingMediaUrl?.startsWith("/uploads/");

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Gallery</span>
          <h1>{heading}</h1>
        </div>
        <Link to="/admin/gallery" className="btn btn-ghost">← Back</Link>
      </div>

      <div className="admin-panel form-panel">
        <form className="contact-form" noValidate onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-row">
              <label htmlFor="title">Title <span className="muted">(optional)</span></label>
              <input type="text" id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              {errors.title && <span className="error">{errors.title}</span>}
            </div>
            <div className="form-row">
              <label htmlFor="mediaType">Media type</label>
              <select id="mediaType" value={form.mediaType} onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value as MediaType }))} required>
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
              {errors.mediaType && <span className="error">{errors.mediaType}</span>}
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="caption">Caption <span className="muted">(optional)</span></label>
            <input type="text" id="caption" maxLength={500} value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
            {errors.caption && <span className="error">{errors.caption}</span>}
          </div>

          <div className="form-row">
            <label htmlFor="mediaFile">Upload file <span className="muted">(photo or video, max 50MB)</span></label>
            <input type="file" id="mediaFile" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {existingMediaUrl && (
              <div className="form-preview">
                {form.mediaType === "video" && previewIsFile ? (
                  <video src={existingMediaUrl} preload="metadata" muted />
                ) : previewIsFile ? (
                  <img src={existingMediaUrl} alt="Current media" />
                ) : null}
                <span className="muted">Current media is kept unless you upload a new file or enter a URL.</span>
              </div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="mediaUrl">…or paste a media URL <span className="muted">(e.g. a YouTube link for video)</span></label>
            <input
              type="url"
              id="mediaUrl"
              placeholder="https://…"
              value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
            />
            {errors.mediaUrl && <span className="error">{errors.mediaUrl}</span>}
          </div>

          <div className="form-row">
            <label htmlFor="eventId">Link to event <span className="muted">(optional)</span></label>
            <select id="eventId" value={form.eventId} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}>
              <option value="">— None —</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save media"}
          </button>
        </form>
      </div>
    </>
  );
}
