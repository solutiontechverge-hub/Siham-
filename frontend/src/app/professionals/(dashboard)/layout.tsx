"use client";

import { ProfessionalMarketingHeader } from "../../../components/common";
import AuthGuard from "../../../components/common/auth/AuthGuard";
import ProfessionalDashboardShell from "../../../components/common/ProfessionalDashboardShell";

export default function ProfessionalsDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["professional"]}>
      <ProfessionalMarketingHeader
        navItems={[]}
        primaryActionLabel="signup"
        primaryActionHref="/auth/signup"
        professionalLinkLabel=""
        withDivider
      />
      <ProfessionalDashboardShell>{children}</ProfessionalDashboardShell>
    </AuthGuard>
  );
}
