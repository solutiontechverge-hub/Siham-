"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Stack } from "@mui/material";
import FixedLocationPageScaffold from "./FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../../app/professionals/fixed-location/fixedLocationTopTabs";
import FinanceSubTabs from "../../app/professionals/fixed-location/finance/FinanceSubTabs";

type DashboardTabKey =
  "profile" | "calendar" | "client" | "finance" | "analytics";

type CachedPanel = {
  node: React.ReactNode;
  pathname: string;
};

function resolveTabKey(pathname: string): DashboardTabKey {
  if (pathname.startsWith("/professionals/profile")) return "profile";
  if (pathname.startsWith("/professionals/calendar")) return "calendar";
  if (pathname.startsWith("/professionals/client")) return "client";
  if (pathname.startsWith("/professionals/finance")) return "finance";
  if (pathname.startsWith("/professionals/analytics")) return "analytics";
  return "profile";
}

function resolveActiveTopTab(tab: DashboardTabKey): string {
  switch (tab) {
    case "profile":
      return "Profile";
    case "calendar":
      return "Calendar";
    case "client":
      return "Client";
    case "finance":
      return "Finance";
    case "analytics":
      return "Analytics";
    default:
      return "Profile";
  }
}

export type ProfessionalDashboardShellProps = {
  children: React.ReactNode;
};

export default function ProfessionalDashboardShell({
  children,
}: ProfessionalDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = resolveTabKey(pathname);
  const panelCacheRef = React.useRef<
    Partial<Record<DashboardTabKey, CachedPanel>>
  >({});

  const cachedPanel = panelCacheRef.current[activeTab];
  const shouldStorePanel =
    !cachedPanel ||
    (activeTab === "finance" && cachedPanel.pathname !== pathname);

  if (shouldStorePanel) {
    panelCacheRef.current[activeTab] = { node: children, pathname };
  }

  const mountedTabs = Object.keys(panelCacheRef.current) as DashboardTabKey[];

  React.useEffect(() => {
    for (const tab of fixedLocationTopTabs) {
      router.prefetch(tab.href);
    }
  }, [router]);

  const activeTopTab = resolveActiveTopTab(activeTab);

  return (
    <FixedLocationPageScaffold
      activeTopTab={activeTopTab}
      topTabs={fixedLocationTopTabs}
    >
      {mountedTabs.map((tabKey) => {
        const panel = panelCacheRef.current[tabKey]?.node;
        if (!panel) return null;

        const isVisible = tabKey === activeTab;
        const panelBody =
          tabKey === "finance" ? (
            <Stack spacing={2}>
              <FinanceSubTabs />
              {panel}
            </Stack>
          ) : (
            panel
          );

        return (
          <Box
            key={tabKey}
            sx={{
              display: isVisible ? "block" : "none",
              width: "100%",
            }}
            aria-hidden={!isVisible}
          >
            {panelBody}
          </Box>
        );
      })}
    </FixedLocationPageScaffold>
  );
}
