import type { Metadata } from "next";
import {
  MarketingShellLayout,
  TermsPageContent,
} from "../../components/marketing";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Mollure Terms & Conditions for using the platform.",
};

export default function TermsAndConditionsPage() {
  return (
    <MarketingShellLayout audience="clients">
      <TermsPageContent />
    </MarketingShellLayout>
  );
}
