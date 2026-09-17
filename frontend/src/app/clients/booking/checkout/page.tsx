"use client";

import ClientBookingCheckoutGate from "./ClientBookingCheckoutGate";

/** Non-prepaid checkout – draft review or full booking details. */
export default function ClientBookingCheckoutPage() {
  return <ClientBookingCheckoutGate variant="standard" />;
}
