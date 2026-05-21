"use client";

import { Stack } from "@mui/material";
import { MarketingSiteHeader } from "../../../components/common";
import AuthGuard from "../../../components/common/auth/AuthGuard";
import FixedLocationPageScaffold from "../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixed-location/fixedLocationTopTabs";
import FinanceSubTabs from "../fixed-location/finance/FinanceSubTabs";

export default function ProfessionalsFinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["professional"]}>
      <MarketingSiteHeader
        navItems={[]}
        primaryActionLabel="signup"
        primaryActionHref="/auth/signup"
        professionalLinkLabel=""
        withDivider
      />
      <FixedLocationPageScaffold activeTopTab="Finance" topTabs={fixedLocationTopTabs}>
        <Stack spacing={2}>
          <FinanceSubTabs />
          {children}
        </Stack>
      </FixedLocationPageScaffold>
    </AuthGuard>
  );
}

