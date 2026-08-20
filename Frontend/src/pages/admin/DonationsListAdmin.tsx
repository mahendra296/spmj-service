import { useEffect, useState } from "react";
import { listDonationsAdmin } from "../../api/donations";
import { usePagedList } from "../../hooks/usePagedList";
import PageSizeSelect from "../../components/PageSizeSelect";
import Pagination from "../../components/Pagination";
import { formatPaiseINR } from "../../utils/money";
import type { DonationStats } from "../../types";

export default function DonationsListAdmin() {
  useEffect(() => {
    document.title = "Donations — SPMJ Admin";
  }, []);

  const [stats, setStats] = useState<DonationStats | null>(null);
  const { items, pagination, pageSize, setPage, setPageSize, loading } = usePagedList((p, size) =>
    listDonationsAdmin(p, size).then((d) => {
      setStats(d.stats);
      return { items: d.donations, pagination: d.pagination };
    })
  );

  const badgeClass = (status: string) =>
    status === "paid" ? "upcoming" : status === "failed" ? "past" : status === "refunded" ? "press" : "draft";

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Donations</span>
          <h1>Donations</h1>
        </div>
        <div className="admin-list-actions">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
          <a href="/api/admin/donations/export.csv" className="btn btn-ghost">↓ Export CSV</a>
        </div>
      </div>

      {stats && (
        <div className="stat-row">
          <div className="manage-card">
            <strong>{formatPaiseINR(stats.raisedPaise)}</strong>
            <span>Total raised</span>
          </div>
          <div className="manage-card">
            <strong>{stats.paidCount.toLocaleString("en-IN")}</strong>
            <span>Successful donations</span>
          </div>
          <div className="manage-card">
            <strong>{stats.totalCount.toLocaleString("en-IN")}</strong>
            <span>Total records</span>
          </div>
        </div>
      )}

      <div className="admin-panel">
        {!loading && (
          items.length === 0 ? (
            <p className="muted">No donations yet.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table data-table-rich">
                  <thead>
                    <tr>
                      <th>Donor</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Reference</th>
                      <th>Payment id</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span className="table-title">{d.donorName}</span>{" "}
                          <span className="muted nowrap">{d.donorEmail}</span>
                        </td>
                        <td className="nowrap"><strong>{formatPaiseINR(d.amount, d.currency)}</strong></td>
                        <td><span className={`badge badge-${badgeClass(d.status)}`}>{d.status}</span></td>
                        <td className="nowrap">{d.receipt}</td>
                        <td className="nowrap">{d.razorpayPaymentId || "—"}</td>
                        <td className="nowrap">
                          {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
