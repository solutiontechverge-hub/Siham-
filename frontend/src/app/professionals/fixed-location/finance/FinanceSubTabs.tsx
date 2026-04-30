"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppPillTabs from "../../../../components/common/AppPillTabs";

const OVERVIEW_HREF = "/professionals/fixed-location/finance/overview";
const SETTING_HREF = "/professionals/fixed-location/finance/setting";

export default function FinanceSubTabs() {
  const pathname = usePathname();

  const isOverview = pathname === OVERVIEW_HREF || pathname === "/professionals/fixed-location/finance";
  const isSetting = pathname?.includes("/finance/setting") ?? false;

  return (
    <AppPillTabs
      tabs={[
        { label: "Overview", href: OVERVIEW_HREF },
        { label: "Setting", href: SETTING_HREF },
      ]}
      active={isSetting ? "Setting" : isOverview ? "Overview" : "Overview"}
    />
  );
}
