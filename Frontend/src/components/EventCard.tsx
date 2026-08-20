import { Link } from "react-router-dom";
import type { EventItem } from "../types";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="content-card event-card-pub">
      <Link to={`/events/${event.slug}`} className="content-media">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} loading="lazy" />
        ) : (
          <div className="content-media placeholder" aria-hidden="true">
            <span>{event.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="content-body">
        <div className="content-meta">
          <time dateTime={new Date(event.eventDate).toISOString()}>
            {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </time>
          {event.location && <span>· {event.location}</span>}
        </div>
        <h3><Link to={`/events/${event.slug}`}>{event.title}</Link></h3>
        {event.summary && <p>{event.summary}</p>}
        <Link to={`/events/${event.slug}`} className="link-arrow">View details →</Link>
      </div>
    </article>
  );
}
