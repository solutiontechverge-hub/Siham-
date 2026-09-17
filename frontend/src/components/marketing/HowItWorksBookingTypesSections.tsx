"use client";

import type { MarketingAudience } from "./MarketingShellLayout";
import { HowItWorksClientBookingTypesSection } from "./HowItWorksClientBookingTypesSection";
import { HowItWorksProfessionalBookingTypesSection } from "./HowItWorksProfessionalBookingTypesSection";
import { HowItWorksProfessionalServiceLocationSection } from "./HowItWorksProfessionalServiceLocationSection";

export function HowItWorksBookingTypesSections({
  audience,
}: {
  audience: MarketingAudience;
}) {
  return (
    <>
      {audience === "clients" && <HowItWorksClientBookingTypesSection />}
      {audience === "professionals" && (
        <>
          <HowItWorksProfessionalBookingTypesSection />
          <HowItWorksProfessionalServiceLocationSection />
        </>
      )}
    </>
  );
}
