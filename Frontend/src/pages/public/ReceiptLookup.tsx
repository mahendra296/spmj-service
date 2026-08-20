import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { getDonationReceipt } from "../../api/donations";
import { ApiError } from "../../api/client";
import type { Donation } from "../../types";
import DonationReceiptCard from "../../components/DonationReceiptCard";

export default function ReceiptLookup() {
  useEffect(() => {
    document.title = "Find your receipt — SPMJ Foundation";
  }, []);

  const [searchParams] = useSearchParams();
  const [ref, setRef] = useState(searchParams.get("ref") || "");
  const [donation, setDonation] = useState<Donation | null>(null);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setDonation(null);
    try {
      const data = await getDonationReceipt(value.trim());
      setDonation(data.donation);
      setAmountDisplay(data.amountDisplay);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not find that receipt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get("ref");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookup(ref);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Receipts</span>
          <h1 className="display">Find your <span className="grad">donation receipt</span>.</h1>
          <p className="lead">
            Enter the reference number from your donation confirmation to view or download your receipt.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 480, margin: "0 auto" }}>
          <form className="contact-form" noValidate onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="ref">Reference number</label>
              <input
                type="text"
                id="ref"
                placeholder="don_xxxxxxxxxxxxxxxx"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                required
              />
              {error && <span className="error">{error}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Looking up…" : "Find receipt →"}
            </button>
          </form>
        </div>
      </section>

      {donation && (
        <section className="section">
          <div className="container">
            <DonationReceiptCard donation={donation} amountDisplay={amountDisplay} variant="lookup" />
          </div>
        </section>
      )}
    </>
  );
}
