"use client";

import ContactUs from "../../components/common/ContactUs";
import { MarketingShellLayout } from "../../components/marketing";
import { AboutGearsPhotoSrc } from "../../../images";

export default function ContactUsPage() {
  return (
    <MarketingShellLayout audience="clients" hideFooter>
      <ContactUs illustrationSrc={AboutGearsPhotoSrc} />
    </MarketingShellLayout>
  );
}
