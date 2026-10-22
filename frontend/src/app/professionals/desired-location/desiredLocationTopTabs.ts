import type { DesiredLocationTopTab } from "../../../components/common/DesiredLocationTopTabs";

export const desiredLocationTopTabs: readonly DesiredLocationTopTab[] = [
  { label: "Profile", href: "/professionals/desired-location/profile" },
  // Shared routes with Fixed Location (same calendar/finance/API — no duplicate pages).
  { label: "Calendar", href: "/professionals/calendar" },
  { label: "Client", href: "/professionals/client" },
  { label: "Finance", href: "/professionals/finance/overview" },
  { label: "Analytics", href: "/professionals/analytics" },
] as const;

