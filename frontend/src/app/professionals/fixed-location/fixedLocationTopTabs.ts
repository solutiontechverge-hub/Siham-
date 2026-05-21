import type { FixedLocationTopTab } from "../../../components/common/FixedLocationTopTabs";

export const fixedLocationTopTabs: readonly FixedLocationTopTab[] = [
  { label: "Profile", href: "/professionals/profile" },
  { label: "Calendar", href: "/professionals/calendar" },
  { label: "Client", href: "/professionals/client" },
  { label: "Finance", href: "/professionals/finance/overview" },
  { label: "Analytics", href: "/professionals/analytics" },
] as const;

