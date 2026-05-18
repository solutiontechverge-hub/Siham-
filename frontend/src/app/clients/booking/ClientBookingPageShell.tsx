"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { ClientPageTabsBar, clientTopTabsActiveLabel, MarketingSiteFooter, MollureMarketingHeader } from "../../../components/common";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { profilePageData } from "../profile/data-profile";
import { useAppSelector } from "../../../store/hooks";
import ClientBookingPillTabsBar from "./ClientBookingPillTabsBar";
import type { BookingListTab } from "./clientBookingRecords";

type Props = {
  activeTab: BookingListTab;
  children: React.ReactNode;
};

export default function ClientBookingPageShell({ activeTab, children }: Props) {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: profilePageData.pageBg }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={user?.email ?? ""}
        userAvatarSrc={undefined}
        homeHref="/clients/listing"
      />
      <ClientPageTabsBar activeLabel={clientTopTabsActiveLabel(pathname)} />
      <ClientBookingPillTabsBar active={activeTab} />
      {children}
      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
