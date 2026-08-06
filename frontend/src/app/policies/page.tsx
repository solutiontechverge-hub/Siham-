import type { Metadata } from "next";
import {
  MarketingShellLayout,
  PoliciesPageContent,
} from "../../components/marketing";

export const metadata: Metadata = {
  title: "Policies",
  description: "Mollure platform policies including privacy, cookies, and booking rules.",
};

export default function PoliciesPage() {
  return (
    <MarketingShellLayout audience="clients">
      <PoliciesPageContent />
    </MarketingShellLayout>
  );
}
