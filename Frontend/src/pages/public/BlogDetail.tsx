import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogPostBySlug } from "../../api/blog";
import type { BlogPost } from "../../types";
import NotFound from "./NotFound";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getBlogPostBySlug(slug)
      .then((data) => setPost(data.post))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.title} — SPMJ Foundation`;
  }, [post]);

  if (notFound) return <NotFound />;
  if (loading || !post) return null;

  return (
    <article className="section article-page">
      <div className="container article-narrow">
        <Link to="/blog" className="auth-back">← All posts</Link>
        <div className="content-meta" style={{ marginTop: 16 }}>
          <span className={`badge badge-${post.category}`}>{post.category}</span>
          <time dateTime={new Date(post.publishedAt).toISOString()}>
            {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          {post.author && <span>· by {post.author}</span>}
        </div>
        <h1 className="display" style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", marginTop: 8 }}>
          {post.title}
        </h1>
        {post.excerpt && <p className="lead">{post.excerpt}</p>}

        {post.coverImage && <img className="article-cover" src={post.coverImage} alt={post.title} />}

        <div className="article-content">
          {post.content.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
