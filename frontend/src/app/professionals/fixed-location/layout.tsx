import { Box } from "@mui/material";
import { ProfessionalMarketingHeader } from "../../../components/common";
import { stickyFooterPageSx } from "../../../components/common/StickyFooterPageShell";
import AuthGuard from "../../../components/common/auth/AuthGuard";

export default function FixedLocationLayout({
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
        {children}
      </Box>
    </AuthGuard>
  );
}
