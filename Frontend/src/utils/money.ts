/** Format a rupee amount as a localised currency string, e.g. 1500 → "₹1,500.00". */
export const formatRupees = (amount: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
};
