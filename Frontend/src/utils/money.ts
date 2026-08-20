/** Format paise (integer) as a localised currency string, e.g. 150000 → "₹1,500". */
export const formatPaiseINR = (paise: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(paise / 100);
  } catch {
    return `₹${paise / 100}`;
  }
};
