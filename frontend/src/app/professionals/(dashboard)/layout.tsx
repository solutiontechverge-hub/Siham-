"use client";

import { Box } from "@mui/material";
import { ProfessionalMarketingHeader } from "../../../components/common";
import ProfessionalDashboardShell from "../../../components/common/ProfessionalDashboardShell";
import { stickyFooterPageSx } from "../../../components/common/StickyFooterPageShell";
import AuthGuard from "../../../components/common/auth/AuthGuard";

export default function ProfessionalsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["professional"]}>
      <Box sx={stickyFooterPageSx}>
        <ProfessionalMarketingHeader
          navItems={[]}
          primaryActionLabel="signup"
          primaryActionHref="/auth/signup"
          professionalLinkLabel=""
          withDivider
        />
        <ProfessionalDashboardShell>{children}</ProfessionalDashboardShell>
      </Box>
    </AuthGuard>
  );
}
