"use client";

import PrepaymentStatusIcon from "../calendar/PrepaymentStatusIcon";

/** Euro prepayment pending — uses shared calendar prepayment icon. */
export default function PrepaymentPayNowIcon({ size = 28 }: { size?: number }) {
  return <PrepaymentStatusIcon variant="pending" size={size} />;
}
