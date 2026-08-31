import type { DesiredLocationTopTab } from "../../../components/common/DesiredLocationTopTabs";

export const desiredLocationTopTabs: readonly DesiredLocationTopTab[] = [
  { label: "Profile", href: "/professionals/desired-location/profile" },
  // Same shared calendar as Fixed Location (one component/hook — no duplicate page).
  { label: "Calendar", href: "/professionals/calendar" },
  { label: "Client", href: "/professionals/client" },
  { label: "Finance", href: "/professionals/desired-location/finance/overview" },
  { label: "Analytics", href: "/professionals/desired-location/analytics" },
] as const;

