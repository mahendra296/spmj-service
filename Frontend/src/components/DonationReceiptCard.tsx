import { Link } from "react-router-dom";
import type { Donation } from "../types";
import { downloadReceiptPdf } from "../utils/receiptPdf";

interface Props {
  donation: Donation;
  amountDisplay: string;
  /** "success" shows the post-payment thank-you copy; "lookup" is neutral (used on the reference lookup page). */
  variant?: "success" | "lookup";
}

export default function DonationReceiptCard({ donation, amountDisplay, variant = "success" }: Props) {
  const isPaid = donation.status === "paid";

  return (
    <div className="donate-receipt">
      <div className={`donate-receipt-icon ${isPaid ? "is-paid" : "is-pending"}`}>
        {isPaid ? "✓" : "⏳"}
      </div>

      {variant === "success" ? (
        isPaid ? (
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
        )
      ) : (
        <>
          <h1>Donation receipt</h1>
          <p className="lead">
            Here's the record for <strong>{donation.receipt}</strong>.
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
        {isPaid ? (
          <button type="button" className="btn btn-ghost" onClick={() => downloadReceiptPdf(donation)}>
            ↓ Download receipt (PDF)
          </button>
        ) : (
          <span className="muted">A downloadable receipt will be available once payment is confirmed.</span>
        )}
        <Link to="/" className="btn btn-ghost">Back to home</Link>
        <Link to="/donate" className="btn btn-primary">Donate again</Link>
      </div>
    </div>
  );
}
