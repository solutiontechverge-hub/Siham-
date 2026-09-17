"use client";

import type { MarketingAudience } from "./MarketingShellLayout";
import { HowItWorksReschedulingSection } from "./HowItWorksReschedulingSection";
import { HowItWorksPaymentsAndInvoicesSection } from "./HowItWorksPaymentsAndInvoicesSection";
import { HowItWorksGroupedBookingsSection } from "./HowItWorksGroupedBookingsSection";
import { HowItWorksBookingCommunicationSection } from "./HowItWorksBookingCommunicationSection";

export function HowItWorksPaymentsSections({
  audience,
  bgshadow,
}: {
  audience: MarketingAudience;
  bgshadow: string;
}) {
  return (
    <>
      <HowItWorksReschedulingSection />
      <HowItWorksPaymentsAndInvoicesSection audience={audience} />
      <HowItWorksGroupedBookingsSection />
      <HowItWorksBookingCommunicationSection bgshadow={bgshadow} />
    </>
  );
}
