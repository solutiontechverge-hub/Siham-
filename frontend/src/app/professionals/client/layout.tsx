"use client";

import { MarketingSiteHeader } from "../../../components/common";
import AuthGuard from "../../../components/common/auth/AuthGuard";

export default function ProfessionalsClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["professional"]}>
      <MarketingSiteHeader
        navItems={[]}
        primaryActionLabel="signup"
        primaryActionHref="/auth/signup"
        professionalLinkLabel=""
        withDivider
      />
      {children}
    </AuthGuard>
  );
}

