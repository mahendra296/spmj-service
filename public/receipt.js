/* Client-side PDF receipt generation (donate-success.ejs, receipt.ejs).
   Uses jsPDF (loaded via CDN script tag before this file). Data comes from
   data-donation / data-amount-display attributes rendered server-side —
   nothing is fetched here. */
(function () {
  'use strict';

  // jsPDF's built-in fonts (Helvetica/Times/Courier — the standard PDF-14
  // set) don't include the ₹ glyph, so it renders as garbage ("¹500.00").
  // The web page can use the real ₹ symbol (browsers have full Unicode font
  // support), but the PDF needs a plain-ASCII stand-in instead.
  function formatAmountForPdf(amount, currency) {
    var n = Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (currency === 'INR' ? 'Rs.' : currency) + ' ' + n;
  }

  function downloadReceiptPdf(donation) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'pt', format: 'a4' });
    var marginX = 56;
    var y = 64;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SPMJ Foundation', marginX, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    y += 18;
    doc.text('Reg. No. F-723/B.K, Guj-737/B.K', marginX, y);
    y += 13;
    doc.text('103/104 Shop No, Virat Complex, Prabhat Typing Gali, Near Jilla Panchayat,', marginX, y);
    y += 13;
    doc.text('Palanpur, Banaskantha, Gujarat - 385001', marginX, y);
    y += 13;
    doc.text('sahyogjasali@gmail.com  ·  +91 99986 70081', marginX, y);

    doc.setDrawColor(220);
    y += 18;
    doc.line(marginX, y, 595 - marginX, y);

    y += 36;
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Donation Receipt', marginX, y);

    var isPaid = donation.status === 'paid';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (isPaid) doc.setTextColor(30, 120, 60);
    else doc.setTextColor(150, 90, 20);
    y += 20;
    doc.text(isPaid ? 'Status: PAID' : ('Status: ' + donation.status.toUpperCase()), marginX, y);
    doc.setTextColor(20);

    function row(label, value) {
      y += 26;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), marginX + 160, y);
    }

    y += 10;
    row('Reference', donation.receipt);
    row('Donor name', donation.donorName);
    row('Donor email', donation.donorEmail);
    if (donation.donorPhone) row('Donor phone', donation.donorPhone);
    row('Amount', formatAmountForPdf(donation.amount, donation.currency));
    row('Date', new Date(donation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
    if (donation.razorpayPaymentId) row('Payment ID', donation.razorpayPaymentId);

    y += 40;
    doc.setDrawColor(220);
    doc.line(marginX, y, 595 - marginX, y);
    y += 24;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Thank you for supporting SPMJ Foundation. This receipt was generated automatically', marginX, y);
    y += 13;
    doc.text('and is valid without a signature.', marginX, y);

    doc.save('receipt-' + donation.receipt + '.pdf');
  }

  document.querySelectorAll('[data-receipt-download]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      try {
        var donation = JSON.parse(btn.getAttribute('data-donation'));
        downloadReceiptPdf(donation);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Could not generate the receipt PDF', err);
        alert('Could not generate the receipt PDF. Please try again.');
      }
    });
  });
})();
