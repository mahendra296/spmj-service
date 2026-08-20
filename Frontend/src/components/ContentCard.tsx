import { Link } from "react-router-dom";
import type { BlogPost } from "../types";

export default function ContentCard({ post }: { post: BlogPost }) {
  return (
    <article className="content-card">
      <Link to={`/blog/${post.slug}`} className="content-media">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" />
        ) : (
          <div className="content-media placeholder" aria-hidden="true">
            <span>{post.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="content-body">
        <div className="content-meta">
          <span className={`badge badge-${post.category}`}>{post.category}</span>
          <time dateTime={new Date(post.publishedAt).toISOString()}>
            {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </time>
        </div>
        <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <Link to={`/blog/${post.slug}`} className="link-arrow">Read more →</Link>
      </div>
    </article>
  );
}
