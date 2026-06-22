/**
 * Due datetime = calendar date from paymentDate (UTC) + time-of-day from referenceAt (UTC).
 */
export function computeCreditDueAt(
  paymentDate: string,
  referenceAt: Date,
): Date {
  const dateOnly = paymentDate.includes('T')
    ? paymentDate.slice(0, 10)
    : paymentDate;
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) {
    throw new Error(`Invalid paymentDate: ${paymentDate}`);
  }
  return new Date(
    Date.UTC(
      y,
      m - 1,
      d,
      referenceAt.getUTCHours(),
      referenceAt.getUTCMinutes(),
      referenceAt.getUTCSeconds(),
      referenceAt.getUTCMilliseconds(),
    ),
  );
}
