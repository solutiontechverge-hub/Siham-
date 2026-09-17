"use client";

import { HowItWorksRequestTypesSection } from "./HowItWorksRequestTypesSection";
import { HowItWorksChangesWithoutApprovalSection } from "./HowItWorksChangesWithoutApprovalSection";
import { HowItWorksProfessionalResponseSection } from "./HowItWorksProfessionalResponseSection";
import { HowItWorksDiscardingRequestsSection } from "./HowItWorksDiscardingRequestsSection";

export function HowItWorksRequestsSections({
  bgshadow,
}: {
  bgshadow: string;
}) {
  return (
    <>
      <HowItWorksRequestTypesSection />
      <HowItWorksChangesWithoutApprovalSection />
      <HowItWorksProfessionalResponseSection />
      <HowItWorksDiscardingRequestsSection bgshadow={bgshadow} />
    </>
  );
}
