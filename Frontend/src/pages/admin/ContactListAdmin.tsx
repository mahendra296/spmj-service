import { useEffect } from "react";
import { listContactAdmin, deleteContactSubmission } from "../../api/contact";
import { usePagedList } from "../../hooks/usePagedList";
import PageSizeSelect from "../../components/PageSizeSelect";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/Toast";

export default function ContactListAdmin() {
  useEffect(() => {
    document.title = "Contact Messages — SPMJ Admin";
  }, []);

  const toast = useToast();
  const { items, pagination, pageSize, setPage, setPageSize, loading, reload } = usePagedList(
    (p, size) => listContactAdmin(p, size).then((d) => ({ items: d.submissions, pagination: d.pagination }))
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteContactSubmission(id);
      toast.success("Message deleted.");
      reload();
    } catch {
      toast.error("Could not delete the message.");
    }
  };

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Contact</span>
          <h1>Contact messages</h1>
        </div>
        <div className="admin-list-actions">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
        </div>
      </div>

      <div className="admin-panel">
        {!loading && (
          items.length === 0 ? (
            <p className="muted">No messages yet.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table data-table-rich">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span className="table-title">{s.name}</span>{" "}
                          <span className="muted nowrap">
                            <a href={`mailto:${s.email}`}>{s.email}</a>
                          </span>
                        </td>
                        <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>{s.message}</td>
                        <td className="nowrap">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="col-actions">
                          <div className="table-actions">
                            <button type="button" className="icon-btn danger" title="Delete" aria-label="Delete" onClick={() => handleDelete(s.id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
