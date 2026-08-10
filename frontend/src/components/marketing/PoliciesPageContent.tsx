"use client";

import { LegalPageContent } from "./TermsPageContent";
import { policiesPageData } from "../../app/policies/policies.data";

export function PoliciesPageContent() {
  return <LegalPageContent data={policiesPageData} />;
}
