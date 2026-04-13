"use client";

import { Stack } from "@mui/material";
import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import FinanceSubTabs from "./FinanceSubTabs";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <FixedLocationPageScaffold activeTopTab="Finance" topTabs={fixedLocationTopTabs}>
      <Stack spacing={2}>
        <FinanceSubTabs />
        {children}
      </Stack>
    </FixedLocationPageScaffold>
  );
}
