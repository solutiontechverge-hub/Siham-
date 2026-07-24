"use client";

import { useSearchParams } from "next/navigation";
import ClientBookingCreateView from "./ClientBookingCreateView";
import ClientBookingListView from "./ClientBookingListView";
import ClientBookingPageShell from "./ClientBookingPageShell";
import { parseBookingListTab } from "./bookingPillTabs";

export default function ClientBookingPageView() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode") ?? "";
  const showCreate = mode === "create";
  const tabParam = searchParams?.get("tab");
  const legacyView = searchParams?.get("view");
  const activeTab = parseBookingListTab(
    tabParam ?? (legacyView === "history" ? "ongoing" : undefined),
  );

  if (showCreate) {
    return (
      <ClientBookingPageShell activeTab="upcoming">
        <ClientBookingCreateView />
      </ClientBookingPageShell>
    );
  }

  return (
    <ClientBookingPageShell activeTab={activeTab}>
      <ClientBookingListView listTab={activeTab} />
    </ClientBookingPageShell>
  );
}
