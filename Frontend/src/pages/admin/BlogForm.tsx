import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBlogAdmin, createBlogPost, updateBlogPost } from "../../api/blog";
import { ApiError } from "../../api/client";
import type { FieldErrors, BlogCategory } from "../../types";
import { BLOG_CATEGORIES } from "../../constants";
import { useToast } from "../../components/Toast";

interface Props {
  mode: "create" | "edit";
}

interface FormState {
  title: string;
  category: BlogCategory;
  author: string;
  excerpt: string;
  content: string;
  published: boolean;
}

const EMPTY: FormState = { title: "", category: "article", author: "", excerpt: "", content: "", published: true };

export default function BlogForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");

  const heading = mode === "create" ? "Create post" : "Edit post";

  useEffect(() => {
    document.title = `${heading} — SPMJ Admin`;
  }, [heading]);

  useEffect(() => {
    if (mode === "edit" && id) {
      getBlogAdmin(Number(id)).then(({ post }) => {
        setForm({
          title: post.title,
          category: post.category,
          author: post.author || "",
          excerpt: post.excerpt || "",
          content: post.content,
          published: post.published,
        });
        setCoverImage(post.coverImage);
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
    data.set("category", form.category);
    data.set("author", form.author);
    data.set("excerpt", form.excerpt);
    data.set("content", form.content);
    data.set("published", form.published ? "true" : "false");
    if (file) data.set("coverImage", file);

    try {
      if (mode === "create") {
        await createBlogPost(data);
        toast.success("Post published.");
      } else {
        await updateBlogPost(Number(id), data);
        toast.success("Post updated.");
      }
      navigate("/admin/blog");
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
          <span className="eyebrow">Blog &amp; News</span>
          <h1>{heading}</h1>
        </div>
        <Link to="/admin/blog" className="btn btn-ghost">← Back</Link>
      </div>

      <div className="admin-panel form-panel">
        <form className="contact-form" noValidate onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input type="text" id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label htmlFor="category">Category</label>
              <select id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BlogCategory }))} required>
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              {errors.category && <span className="error">{errors.category}</span>}
            </div>
            <div className="form-row">
              <label htmlFor="author">Author <span className="muted">(optional)</span></label>
              <input type="text" id="author" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
              {errors.author && <span className="error">{errors.author}</span>}
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="excerpt">Excerpt <span className="muted">(optional)</span></label>
            <input type="text" id="excerpt" maxLength={500} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
            {errors.excerpt && <span className="error">{errors.excerpt}</span>}
          </div>

          <div className="form-row">
            <label htmlFor="content">Content</label>
            <textarea id="content" rows={12} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required />
            <span className="muted" style={{ fontSize: ".82rem" }}>Separate paragraphs with a blank line.</span>
            {errors.content && <span className="error">{errors.content}</span>}
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
            {submitting ? "Saving…" : "Save post"}
          </button>
        </form>
      </div>
    </>
  );
}
