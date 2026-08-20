import type { GalleryItem } from "../types";

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) {
    return <p className="muted" style={{ textAlign: "center" }}>No photos or videos have been added yet.</p>;
  }

  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <figure className="gallery-item" key={item.id}>
          {item.mediaType === "video" ? (
            item.mediaUrl.startsWith("/uploads/") ? (
              <video controls preload="metadata" src={item.mediaUrl} />
            ) : (
              <div className="gallery-embed">
                <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="gallery-play" aria-label="Play video">
                  <span>▶</span>
                  <small>Watch video</small>
                </a>
              </div>
            )
          ) : (
            <img src={item.mediaUrl} alt={item.title || item.caption || "Gallery photo"} loading="lazy" />
          )}
          {(item.title || item.caption || item.eventTitle) && (
            <figcaption>
              {item.title && <strong>{item.title}</strong>}
              {item.caption && <span>{item.caption}</span>}
              {item.eventTitle && <span className="gallery-tag">{item.eventTitle}</span>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
