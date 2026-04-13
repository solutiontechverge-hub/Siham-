"use client";

import ContactUs from "../../components/common/ContactUs";
import { MarketingShellLayout } from "../../components/marketing";

export default function ContactUsPage() {
  return (
    <MarketingShellLayout audience="clients">
      <ContactUs illustrationSrc="/about/about-gears-photo.png" />
    </MarketingShellLayout>
  );
}
