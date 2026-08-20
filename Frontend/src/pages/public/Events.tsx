import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../../api/events";
import type { EventItem, PaginationMeta } from "../../types";
import { DEFAULT_PAGE_SIZE } from "../../constants";
import EventCard from "../../components/EventCard";
import Pagination from "../../components/Pagination";
import PageSizeSelect from "../../components/PageSizeSelect";

export default function Events() {
  useEffect(() => {
    document.title = "Events — SPMJ Foundation";
  }, []);

  const [upPage, setUpPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [upcoming, setUpcoming] = useState<{ items: EventItem[]; pagination: PaginationMeta } | null>(null);
  const [past, setPast] = useState<{ items: EventItem[]; pagination: PaginationMeta } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getEvents(upPage, pastPage, pageSize);
    setUpcoming(data.upcoming);
    setPast(data.past);
    setLoading(false);
  }, [upPage, pastPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setUpPage(1);
    setPastPage(1);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Events</span>
          <h1 className="display">What's <span className="grad">happening</span>.</h1>
          <p className="lead">Camps, community days, and milestones — come be part of the journey.</p>
        </div>
      </section>

      <section className="section" id="upcoming">
        <div className="container">
          <div className="list-controls">
            <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
          </div>
          <div className="section-head" style={{ textAlign: "left", marginBottom: 32 }}>
            <h2>Upcoming events</h2>
          </div>
          {!loading && upcoming && (
            upcoming.items.length === 0 ? (
              <p className="muted">No upcoming events right now — check back soon.</p>
            ) : (
              <>
                <div className="grid grid-3">
                  {upcoming.items.map((e) => (
                    <EventCard event={e} key={e.id} />
                  ))}
                </div>
                <Pagination pagination={upcoming.pagination} onPageChange={setUpPage} />
              </>
            )
          )}
        </div>
      </section>

      <section className="section section-alt" id="past">
        <div className="container">
          <div className="section-head" style={{ textAlign: "left", marginBottom: 32 }}>
            <h2>Past events</h2>
          </div>
          {!loading && past && (
            past.items.length === 0 ? (
              <p className="muted">No past events to show yet.</p>
            ) : (
              <>
                <div className="grid grid-3">
                  {past.items.map((e) => (
                    <EventCard event={e} key={e.id} />
                  ))}
                </div>
                <Pagination pagination={past.pagination} onPageChange={setPastPage} />
              </>
            )
          )}
        </div>
      </section>
    </>
  );
}
