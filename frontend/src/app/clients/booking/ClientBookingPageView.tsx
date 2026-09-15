"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import DynamicChunkFallback from "../../../components/common/DynamicChunkFallback";
import ClientBookingPageShell from "./ClientBookingPageShell";
import { parseBookingListTab } from "./bookingPillTabs";

const ClientBookingCreateView = dynamic(() => import("./ClientBookingCreateView"), {
  ssr: false,
  loading: () => <DynamicChunkFallback />,
});
const ClientBookingListView = dynamic(() => import("./ClientBookingListView"), {
  ssr: false,
  loading: () => <DynamicChunkFallback />,
});

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
      <ClientBookingPageShell activeTab="upcoming" hideChrome>
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
