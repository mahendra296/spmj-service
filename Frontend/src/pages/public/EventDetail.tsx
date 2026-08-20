import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEventBySlug } from "../../api/events";
import type { EventItem } from "../../types";
import NotFound from "./NotFound";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getEventBySlug(slug)
      .then((data) => setEvent(data.event))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (event) document.title = `${event.title} — SPMJ Foundation`;
  }, [event]);

  if (notFound) return <NotFound />;
  if (loading || !event) return null;

  return (
    <article className="section article-page">
      <div className="container article-narrow">
        <Link to="/events" className="auth-back">← All events</Link>
        <div className="content-meta" style={{ marginTop: 16 }}>
          <time dateTime={new Date(event.eventDate).toISOString()}>
            {new Date(event.eventDate).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          {event.location && <span>· {event.location}</span>}
        </div>
        <h1 className="display" style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", marginTop: 8 }}>
          {event.title}
        </h1>
        {event.summary && <p className="lead">{event.summary}</p>}

        {event.coverImage && <img className="article-cover" src={event.coverImage} alt={event.title} />}

        <div className="article-content">
          {event.description.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
