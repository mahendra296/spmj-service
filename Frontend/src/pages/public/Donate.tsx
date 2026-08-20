import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getDonationConfig, createOrder, verifyPayment, type DonationConfig } from "../../api/donations";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (resp: unknown) => void) => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment provider."));
    document.body.appendChild(script);
  });
}

export default function Donate() {
  useEffect(() => {
    document.title = "Donate — SPMJ Foundation";
  }, []);

  const navigate = useNavigate();
  const [config, setConfig] = useState<DonationConfig | null>(null);
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDonationConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config?.paymentsEnabled) {
      loadRazorpayScript().catch((err) => setError(err.message));
    }
  }, [config]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!config) return;

    const amt = Number(amount);
    if (!Number.isInteger(amt) || amt < config.minAmount || amt > config.maxAmount) {
      showError(`Please enter an amount between ₹${config.minAmount} and ₹${config.maxAmount.toLocaleString("en-IN")}.`);
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        amount: amt,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorPhone: donorPhone.trim(),
        message: message.trim(),
      });

      setLoading(false);

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SPMJ Foundation",
        description: "Donation",
        order_id: order.orderId,
        prefill: { name: order.donor.name, email: order.donor.email, contact: order.donor.phone },
        notes: { receipt: order.receipt },
        theme: { color: "#ff5a1f" },
        handler: async (response: unknown) => {
          setLoading(true);
          const r = response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
          try {
            const result = await verifyPayment(r);
            navigate(`/donate/success?ref=${encodeURIComponent(result.receipt || "")}`);
          } catch (err) {
            setLoading(false);
            showError(err instanceof Error ? err.message : "We could not confirm your payment. If you were charged, please contact us.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showError("Payment cancelled. You can try again whenever you like.");
          },
        },
      });

      rzp.on("payment.failed", (resp: unknown) => {
        setLoading(false);
        const r = resp as { error?: { description?: string } };
        showError(r?.error?.description || "Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      showError(err instanceof Error ? err.message : "Could not start the payment. Please try again.");
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Donate</span>
          <h1 className="display">Give the gift of <span className="grad">education</span>.</h1>
          <p className="lead">
            Every contribution funds books, meals, and safe classrooms for children who need them
            most. Donations are processed securely by Razorpay.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container two-col contact-wrap">
          <div className="contact-info">
            <h3>Where your money goes</h3>
            <p className="muted">100% of your donation supports our programmes.</p>
            <ul className="contact-list">
              <li><span className="contact-label">₹500</span><span>School supplies for a child for a term</span></li>
              <li><span className="contact-label">₹1,000</span><span>A month of nutritious midday meals</span></li>
              <li><span className="contact-label">₹2,500</span><span>After-school tutoring for a student</span></li>
              <li><span className="contact-label">₹5,000</span><span>A need-based scholarship contribution</span></li>
            </ul>
          </div>

          <div className="contact-form-wrap">
            {config && !config.paymentsEnabled && (
              <div className="alert error">
                <strong>Donations are temporarily unavailable.</strong>
                <p>Online giving isn't configured right now. Please <a href="/contact">contact us</a> to donate another way.</p>
              </div>
            )}
            {config?.paymentsEnabled && (
              <form className="contact-form donate-form" noValidate onSubmit={handleSubmit}>
                <fieldset className="donate-amount-field">
                  <legend>Choose an amount</legend>
                  <div className="donate-amounts" role="group" aria-label="Preset donation amounts">
                    {config.presets.map((p) => (
                      <button
                        type="button"
                        key={p}
                        className={`amount-chip${Number(amount) === p ? " is-active" : ""}`}
                        onClick={() => {
                          setAmount(String(p));
                          setError(null);
                        }}
                      >
                        ₹{p.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                  <div className="form-row amount-input-row">
                    <label htmlFor="amount">Or enter an amount (₹)</label>
                    <input
                      type="number"
                      id="amount"
                      inputMode="numeric"
                      min={config.minAmount}
                      max={config.maxAmount}
                      step={1}
                      placeholder="e.g. 1500"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError(null);
                      }}
                      required
                    />
                  </div>
                </fieldset>

                <div className="form-row">
                  <label htmlFor="donorName">Your name</label>
                  <input type="text" id="donorName" placeholder="Jane Cooper" value={donorName} onChange={(e) => setDonorName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <label htmlFor="donorEmail">Email</label>
                  <input type="email" id="donorEmail" placeholder="you@example.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} required />
                </div>
                <div className="form-row">
                  <label htmlFor="donorPhone">Phone <span className="muted">(optional)</span></label>
                  <input type="tel" id="donorPhone" placeholder="+91 98765 43210" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} />
                </div>
                <div className="form-row">
                  <label htmlFor="message">Message <span className="muted">(optional)</span></label>
                  <textarea id="message" rows={3} maxLength={500} placeholder="Add a note with your donation" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                {error && (
                  <div id="donate-error" className="alert error" role="alert" ref={errorRef}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                  {loading ? "Processing…" : "Donate securely →"}
                </button>
                <p className="muted donate-secure-note">🔒 Payments are secured by Razorpay. We never store your card details.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
