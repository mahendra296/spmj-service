import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDonationReceipt } from "../../api/donations";
import type { Donation } from "../../types";
import NotFound from "./NotFound";

export default function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const [donation, setDonation] = useState<Donation | null>(null);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Thank you — SPMJ Foundation";
  }, []);

  useEffect(() => {
    if (!ref) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getDonationReceipt(ref)
      .then((data) => {
        setDonation(data.donation);
        setAmountDisplay(data.amountDisplay);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ref]);

  if (notFound) return <NotFound />;
  if (loading || !donation) return null;

  const isPaid = donation.status === "paid";

  return (
    <section className="section">
      <div className="container">
        <div className="donate-receipt">
          <div className={`donate-receipt-icon ${isPaid ? "is-paid" : "is-pending"}`}>
            {isPaid ? "✓" : "⏳"}
          </div>
          {isPaid ? (
            <>
              <h1>Thank you, {donation.donorName}!</h1>
              <p className="lead">
                Your donation of <strong>{amountDisplay}</strong> has been received. You're helping a
                child stay in school.
              </p>
            </>
          ) : (
            <>
              <h1>Payment is being confirmed</h1>
              <p className="lead">
                Thanks, {donation.donorName}. Your donation of <strong>{amountDisplay}</strong> is
                processing — we'll email you once it's confirmed.
              </p>
            </>
          )}

          <dl className="donate-receipt-meta">
            <div><dt>Reference</dt><dd>{donation.receipt}</dd></div>
            <div><dt>Amount</dt><dd>{amountDisplay}</dd></div>
            <div>
              <dt>Status</dt>
              <dd><span className={`badge badge-${isPaid ? "upcoming" : "draft"}`}>{donation.status}</span></dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{new Date(donation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
            </div>
          </dl>

          <p className="muted">A receipt has been recorded against your email, {donation.donorEmail}.</p>
          <div className="donate-receipt-actions">
            <Link to="/" className="btn btn-ghost">Back to home</Link>
            <Link to="/donate" className="btn btn-primary">Donate again</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
