"use client";

import ClientBookingCheckoutGate from "../ClientBookingCheckoutGate";

/** Prepaid checkout – draft review first, then prepaid details after submit. */
export default function ClientBookingCheckoutPrepaidPage() {
  return <ClientBookingCheckoutGate variant="prepaid" />;
}
