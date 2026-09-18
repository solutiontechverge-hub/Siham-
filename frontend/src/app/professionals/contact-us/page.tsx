"use client";

import ContactUs from "../../../components/common/ContactUs";
import { MarketingShellLayout } from "../../../components/marketing";
import { AboutGearsPhotoSrc } from "../../../../images";

export default function ProfessionalsContactUsPage() {
  return (
    <MarketingShellLayout audience="professionals" hideFooter>
      <ContactUs illustrationSrc={AboutGearsPhotoSrc} />
    </MarketingShellLayout>
  );
}
