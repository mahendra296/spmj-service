import { jsPDF } from "jspdf";
import type { Donation } from "../types";

/**
 * jsPDF's built-in fonts (Helvetica/Times/Courier — the standard PDF-14 set)
 * don't include the ₹ glyph, so it renders as garbage ("¹500.00"). The web
 * page can use the real ₹ symbol (browsers have full Unicode font support),
 * but the PDF needs a plain-ASCII stand-in instead.
 */
const formatAmountForPdf = (amount: number, currency: string) =>
  `${currency === "INR" ? "Rs." : currency} ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Builds and triggers a download of a simple, print-quality PDF receipt for
 * a paid donation. Pure client-side — the donation data is already fetched
 * from the Backend (GET /api/donations/receipt/:ref), this just formats it.
 */
export function downloadReceiptPdf(donation: Donation) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SPMJ Foundation", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  y += 18;
  doc.text("Reg. No. F-723/B.K, Guj-737/B.K", marginX, y);
  y += 13;
  doc.text("103/104 Shop No, Virat Complex, Prabhat Typing Gali, Near Jilla Panchayat,", marginX, y);
  y += 13;
  doc.text("Palanpur, Banaskantha, Gujarat - 385001", marginX, y);
  y += 13;
  doc.text("sahyogjasali@gmail.com  ·  +91 99986 70081", marginX, y);

  doc.setDrawColor(220);
  y += 18;
  doc.line(marginX, y, 595 - marginX, y);

  y += 36;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Donation Receipt", marginX, y);

  const isPaid = donation.status === "paid";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(isPaid ? 30 : 150, isPaid ? 120 : 90, isPaid ? 60 : 20);
  y += 20;
  doc.text(isPaid ? "Status: PAID" : `Status: ${donation.status.toUpperCase()}`, marginX, y);
  doc.setTextColor(20);

  const row = (label: string, value: string) => {
    y += 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, marginX + 160, y);
  };

  y += 10;
  row("Reference", donation.receipt);
  row("Donor name", donation.donorName);
  row("Donor email", donation.donorEmail);
  if (donation.donorPhone) row("Donor phone", donation.donorPhone);
  row("Amount", formatAmountForPdf(donation.amount, donation.currency));
  row("Date", new Date(donation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
  if (donation.razorpayPaymentId) row("Payment ID", donation.razorpayPaymentId);

  y += 40;
  doc.setDrawColor(220);
  doc.line(marginX, y, 595 - marginX, y);
  y += 24;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Thank you for supporting SPMJ Foundation. This receipt was generated automatically", marginX, y);
  y += 13;
  doc.text("and is valid without a signature.", marginX, y);

  doc.save(`receipt-${donation.receipt}.pdf`);
}
