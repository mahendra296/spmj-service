/* Donation checkout flow (Razorpay).
   1) POST /donate/order  → create an order server-side
   2) open Razorpay Checkout with that order
   3) POST /donate/verify → confirm the signature, then redirect to the
      thank-you page. The server webhook is the ultimate source of truth. */
(function () {
  'use strict';

  const form = document.getElementById('donate-form');
  if (!form || typeof Razorpay === 'undefined') return;

  const amountInput = document.getElementById('amount');
  const chips = Array.from(form.querySelectorAll('.amount-chip'));
  const submitBtn = document.getElementById('donate-submit');
  const errorBox = document.getElementById('donate-error');

  const min = Number(form.dataset.min) || 1;
  const max = Number(form.dataset.max) || Number.MAX_SAFE_INTEGER;

  /* ---------- amount presets ---------- */
  const syncChips = () => {
    const val = Number(amountInput.value);
    chips.forEach((c) => c.classList.toggle('is-active', Number(c.dataset.amount) === val));
  };
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      amountInput.value = chip.dataset.amount;
      syncChips();
      hideError();
    });
  });
  amountInput.addEventListener('input', () => { syncChips(); hideError(); });

  /* ---------- helpers ---------- */
  const showError = (msg) => {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const hideError = () => { errorBox.hidden = true; errorBox.textContent = ''; };

  const setLoading = (loading, label) => {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? (label || 'Processing…') : 'Donate securely →';
  };

  const postJSON = async (url, body) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  /* ---------- verify after payment ---------- */
  const verify = async (response) => {
    setLoading(true, 'Confirming…');
    const { ok, data } = await postJSON('/donate/verify', {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });
    if (ok && data.success && data.data && data.data.redirect) {
      window.location.assign(data.data.redirect);
    } else {
      setLoading(false);
      showError((data && data.message) || 'We could not confirm your payment. If you were charged, please contact us.');
    }
  };

  /* ---------- submit → create order → open checkout ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const amount = Number(amountInput.value);
    if (!Number.isInteger(amount) || amount < min || amount > max) {
      showError('Please enter an amount between ₹' + min + ' and ₹' + max.toLocaleString('en-IN') + '.');
      return;
    }

    setLoading(true, 'Starting…');
    const { ok, data } = await postJSON('/donate/order', {
      amount: amount,
      donorName: form.donorName.value.trim(),
      donorEmail: form.donorEmail.value.trim(),
      donorPhone: form.donorPhone.value.trim(),
      message: form.message.value.trim(),
    });

    if (!ok || !data.success || !data.data) {
      setLoading(false);
      showError((data && data.message) || 'Could not start the payment. Please try again.');
      return;
    }

    const order = data.data;
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'SPMJ Foundation',
      description: 'Donation',
      order_id: order.orderId,
      prefill: {
        name: order.donor.name,
        email: order.donor.email,
        contact: order.donor.phone,
      },
      notes: { receipt: order.receipt },
      theme: { color: '#ff5a1f' },
      handler: verify,
      modal: {
        ondismiss: function () {
          setLoading(false);
          showError('Payment cancelled. You can try again whenever you like.');
        },
      },
    });

    rzp.on('payment.failed', function (resp) {
      setLoading(false);
      showError((resp && resp.error && resp.error.description) || 'Payment failed. Please try again.');
    });

    setLoading(false);
    rzp.open();
  });
})();
