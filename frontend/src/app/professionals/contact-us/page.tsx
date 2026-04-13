"use client";

import ContactUs from "../../../components/common/ContactUs";
import { MarketingShellLayout } from "../../../components/marketing";

export default function ProfessionalsContactUsPage() {
  return (
    <MarketingShellLayout audience="professionals">
      <ContactUs illustrationSrc="/about/about-gears-photo.png" />
    </MarketingShellLayout>
  );
}
