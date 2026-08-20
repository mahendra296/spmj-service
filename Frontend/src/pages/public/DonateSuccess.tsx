import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDonationReceipt } from "../../api/donations";
import type { Donation } from "../../types";
import DonationReceiptCard from "../../components/DonationReceiptCard";
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

  return (
    <section className="section">
      <div className="container">
        <DonationReceiptCard donation={donation} amountDisplay={amountDisplay} variant="success" />
      </div>
    </section>
  );
}
