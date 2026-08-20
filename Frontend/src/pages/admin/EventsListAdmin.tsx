import { useEffect } from "react";
import { Link } from "react-router-dom";
import { listEventsAdmin, deleteEvent } from "../../api/events";
import { usePagedList } from "../../hooks/usePagedList";
import PageSizeSelect from "../../components/PageSizeSelect";
import Pagination from "../../components/Pagination";
import RowActions from "../../components/RowActions";
import { useToast } from "../../components/Toast";

export default function EventsListAdmin() {
  useEffect(() => {
    document.title = "Manage Events — SPMJ Admin";
  }, []);

  const toast = useToast();
  const { items, pagination, pageSize, setPage, setPageSize, loading, reload } = usePagedList(
    (p, size) => listEventsAdmin(p, size).then((d) => ({ items: d.events, pagination: d.pagination }))
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteEvent(id);
      toast.success("Event deleted.");
      reload();
    } catch {
      toast.error("Could not delete the event.");
    }
  };

  const now = new Date();

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Events</span>
          <h1>Manage events</h1>
        </div>
        <div className="admin-list-actions">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
          <Link to="/admin/events/new" className="btn btn-primary">+ New event</Link>
        </div>
      </div>

      <div className="admin-panel">
        {!loading && (
          items.length === 0 ? (
            <p className="muted">
              No events yet. <Link to="/admin/events/new" className="link-arrow">Create the first one →</Link>
            </p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table data-table-rich">
                  <thead>
                    <tr>
                      <th className="col-thumb"></th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => {
                      const ed = new Date(e.eventDate);
                      const running = ed.toDateString() === now.toDateString();
                      return (
                        <tr key={e.id}>
                          <td className="col-thumb">
                            {e.coverImage ? (
                              <img className="table-thumb" src={e.coverImage} alt="" loading="lazy" />
                            ) : (
                              <span className="table-thumb placeholder">{e.title.charAt(0).toUpperCase()}</span>
                            )}
                          </td>
                          <td>
                            <a className="table-title" href={`/events/${e.slug}`} target="_blank" rel="noopener noreferrer">
                              {e.title}
                            </a>
                          </td>
                          <td className="nowrap">
                            {ed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td>{e.location || "—"}</td>
                          <td>
                            {!e.published ? (
                              <span className="badge badge-draft">Draft</span>
                            ) : running ? (
                              <span className="badge badge-running">Running</span>
                            ) : ed >= now ? (
                              <span className="badge badge-upcoming">Upcoming</span>
                            ) : (
                              <span className="badge badge-past">Past</span>
                            )}
                          </td>
                          <td className="col-actions">
                            <RowActions
                              editUrl={`/admin/events/${e.id}/edit`}
                              onDelete={() => handleDelete(e.id)}
                              confirmMsg="Delete this event?"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
            </>
          )
        )}
      </div>
    </>
  );
}
