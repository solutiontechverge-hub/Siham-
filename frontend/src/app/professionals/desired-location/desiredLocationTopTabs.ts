import type { DesiredLocationTopTab } from "../../../components/common/DesiredLocationTopTabs";

export const desiredLocationTopTabs: readonly DesiredLocationTopTab[] = [
  { label: "Profile", href: "/professionals/desired-location/profile" },
  { label: "Calendar", href: "/professionals/desired-location/calendar" },
  { label: "Client", href: "/professionals/desired-location/client" },
  { label: "Finance", href: "/professionals/desired-location/finance/overview" },
  { label: "Analytics", href: "/professionals/desired-location/analytics" },
] as const;

