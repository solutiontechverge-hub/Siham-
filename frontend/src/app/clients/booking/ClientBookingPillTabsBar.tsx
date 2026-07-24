"use client";

import { Box, Container } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppPillTabs } from "../../../components/common";
import {
  CLIENT_BOOKING_PILL_TABS,
  parseBookingListTab,
} from "./bookingPillTabs";
import type { BookingListTab } from "./clientBookingRecords";

type Props = {
  active: BookingListTab;
};

export default function ClientBookingPillTabsBar({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (next: string) => {
    const tab = parseBookingListTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab !== "upcoming") {
      params.delete("mode");
      params.delete("from");
      params.delete("t");
    }
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 0, pt: 1 }}>
      <Box>
        <AppPillTabs
          tabs={CLIENT_BOOKING_PILL_TABS}
          active={active}
          onChange={handleChange}
          alignStart
        />
      </Box>
    </Container>
  );
}
