import type { FixedLocationTopTab } from "../../../components/common/FixedLocationTopTabs";

export const fixedLocationTopTabs: readonly FixedLocationTopTab[] = [
  { label: "Profile", href: "/professionals/fixed-location/profile" },
  { label: "Calendar", href: "/professionals/fixed-location/calendar" },
  { label: "Client", href: "/professionals/fixed-location/client" },
  { label: "Finance", href: "/professionals/fixed-location/finance" },
  { label: "Analytics", href: "/professionals/fixed-location/analytics" },
] as const;

