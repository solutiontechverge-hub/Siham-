export type CancellationFeeSettlement = {
  bookingTotal: number;
  feePercent: number;
  cancellationFee: number;
  prepaidPaid: number;
  appliedFromPrepaid: number;
  amountDueNow: number;
  refundAmount: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Split cancellation fee against prepaid balance (adjust fee, refund remainder). */
export function settleCancellationFee(input: {
  bookingTotal: number;
  feePercent: number;
  prepaidPaid: number;
}): CancellationFeeSettlement {
  const bookingTotal = Math.max(0, Number(input.bookingTotal) || 0);
  const feePercent = Math.max(0, Number(input.feePercent) || 0);
  const prepaidPaid = Math.max(0, Number(input.prepaidPaid) || 0);
  const cancellationFee = roundMoney((bookingTotal * feePercent) / 100);
  const appliedFromPrepaid = roundMoney(Math.min(prepaidPaid, cancellationFee));
  const amountDueNow = roundMoney(Math.max(0, cancellationFee - appliedFromPrepaid));
  const refundAmount = roundMoney(Math.max(0, prepaidPaid - cancellationFee));

  return {
    bookingTotal,
    feePercent,
    cancellationFee,
    prepaidPaid,
    appliedFromPrepaid,
    amountDueNow,
    refundAmount,
  };
}
