"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import { Box, Container, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppPillTabs, ClientPageTabsBar, MarketingSiteFooter, MollureMarketingHeader } from "..";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { useAppSelector } from "../../../store/hooks";
import {
  clearCheckoutBookingCancelled,
  isCheckoutBookingCancelled,
  markCheckoutBookingCancelled,
} from "./bookingCancellation";
import ClientBookingCancelDialog from "./ClientBookingCancelDialog";
import ClientBookingDeleteDialog from "./ClientBookingDeleteDialog";
import ClientBookingDetailsHeader from "./ClientBookingDetailsHeader";
import ClientBookingInfoBar from "./ClientBookingInfoBar";
import ClientBookingPaymentDetailsCard from "./ClientBookingPaymentDetailsCard";
import ClientBookingPoliciesAccordion from "./ClientBookingPoliciesAccordion";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useCheckoutBookingRef } from "./useCheckoutBookingRef";
import { ACTIVE_BOOKING_ID_KEY, CHECKOUT_REF_KEY } from "../../../app/clients/booking/clientBookingSession";
import { markClientBookingCancelled, removeClientBookingById } from "../../../app/clients/booking/clientBookingRecords";
import type { ClientBookingDraft } from "./types";
import type { BusinessPublicProfilePolicySection } from "../../../data/businessPublicProfile.data";

const bookingPillTabs = [
  { label: "Past", value: "past" },
  { label: "Outgoing", value: "outgoing" },
  { label: "Upcoming", value: "upcoming" },
];

const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

const fallbackPolicySections: BusinessPublicProfilePolicySection[] = [
  {
    title: "Cancellation Policy",
    fields: [],
    description:
      "Cancellations made less than 24 hours before the appointment may be subject to a cancellation fee as outlined by the professional.",
  },
  {
    title: "Late Arrival",
    fields: [],
    description:
      "If you arrive more than 15 minutes late, your appointment may be shortened or cancelled at the professional's discretion.",
  },
];

export type ClientBookingDetailsVariant = "standard" | "prepaid";

function resolvePrimaryProfessional(draft: ClientBookingDraft | null) {
  const teamMembers = draft?.teamMembers ?? [];
  if (!teamMembers.length) return { name: "Professional", id: "" };
  const countById = new Map<string, number>();
  for (const s of draft?.services ?? []) {
    if (!s.teamMemberId) continue;
    countById.set(s.teamMemberId, (countById.get(s.teamMemberId) ?? 0) + 1);
  }
  let primaryId = teamMembers[0]?.id ?? "";
  let max = -1;
  for (const [id, c] of countById) {
    if (c > max) {
      max = c;
      primaryId = id;
    }
  }
  const primary = teamMembers.find((tm) => tm.id === primaryId) ?? teamMembers[0];
  return { name: primary?.name ?? "Professional", id: primary?.id ?? "" };
}

export default function ClientBookingDetailsView({ variant }: { variant: ClientBookingDetailsVariant }) {
  const router = useRouter();
  const m = useTheme().palette.mollure;
  const user = useAppSelector((s) => s.auth.user);
  const { draft, shop, businessProfile, prepaymentPercent, requiresPrepayment } = useClientBookingDraft();
  const { requesterName, requesterAvatarUrl, requesterPhone } = useClientRequesterProfile();

  const isPrepaid = variant === "prepaid";
  const locationMode = shop?.locationMode ?? "fixed";
  const bookingRef = useCheckoutBookingRef();
  const activeBooking = useActiveClientBooking();
  const isAwaitingApproval = activeBooking?.status === "requested";

  const [phone, setPhone] = React.useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isCancelled, setIsCancelled] = React.useState(false);

  React.useEffect(() => {
    if (requesterPhone && !phone) setPhone(requesterPhone);
  }, [phone, requesterPhone]);

  React.useEffect(() => {
    setIsCancelled(isCheckoutBookingCancelled(bookingRef));
  }, [bookingRef]);

  React.useEffect(() => {
    if (!isPrepaid || !shop?.shopId) return;
    if (!requiresPrepayment) router.replace("/clients/booking/checkout");
  }, [isPrepaid, requiresPrepayment, router, shop?.shopId]);

  const professional = React.useMemo(() => resolvePrimaryProfessional(draft), [draft]);
  const professionalRole = businessProfile?.specialties?.[0] ?? "Professional";

  const address =
    shop?.addressLabel ??
    shop?.municipalityLabel ??
    businessProfile?.fixedLocation?.formattedAddress ??
    fallbackAddress;

  const dateTimeLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    const datePart = Number.isNaN(dt.getTime())
      ? draft.selectedDateISO
      : dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const timePart = draft.selectedTime ? ` (${draft.selectedTime})` : "";
    return `Booked on ${datePart}${timePart}`;
  }, [draft?.selectedDateISO, draft?.selectedTime]);

  const headerName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim() ||
    user?.email ||
    "";

  const policySections =
    businessProfile?.policySections?.length ? businessProfile.policySections : fallbackPolicySections;

  const handleConfirmCancel = () => {
    markCheckoutBookingCancelled(bookingRef);
    try {
      const activeId = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
      if (activeId) markClientBookingCancelled(activeId);
    } catch {
      // ignore
    }
    setIsCancelled(true);
  };

  const handleDeleteBooking = () => {
    try {
      const activeId = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
      if (activeId) removeClientBookingById(activeId);
      window.localStorage.removeItem("mollure:booking_draft");
      clearCheckoutBookingCancelled(bookingRef);
      window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
      window.sessionStorage.removeItem(ACTIVE_BOOKING_ID_KEY);
    } catch {
      // ignore
    }
    router.push("/clients/booking?tab=upcoming");
  };

  const headerStatusLabel = isCancelled
    ? "Cancelled"
    : isPrepaid
      ? "Prepayment required"
      : isAwaitingApproval
        ? "Awaiting approval"
        : "Confirmed";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB" }}>
      <MollureMarketingHeader navItems={[]} isAuthed userLabel={user?.email ?? ""} userName={headerName} homeHref="/clients/listing" />

      <ClientPageTabsBar activeLabel="Booking" />
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 0, pt: 1 }}>
        <AppPillTabs
          tabs={bookingPillTabs}
          active="upcoming"
          alignStart
          onChange={(tab) => router.push(`/clients/booking?tab=${parseBookingListTab(tab)}`)}
        />
      </Container>

      <Container maxWidth="lg" sx={{ pb: 4, pt: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <ClientBookingDetailsHeader
            bookingRef={bookingRef}
            dateTimeLabel={dateTimeLabel}
            statusLabel={headerStatusLabel}
            isCancelled={isCancelled}
            onDeleteBooking={() => setDeleteDialogOpen(true)}
          />

          <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
            <ClientBookingInfoBar
              professionalName={professional.name}
              professionalRole={professionalRole}
              address={address}
              locationMode={locationMode}
              phone={phone}
            />

            <ClientBookingPaymentDetailsCard
              draft={draft}
              requesterName={requesterName}
              requesterAvatarUrl={requesterAvatarUrl}
              showPrepaidBreakdown={isPrepaid}
              prepaymentPercent={prepaymentPercent}
            />

            <Box sx={{ mt: 2 }}>
              <ClientBookingPoliciesAccordion
                sections={policySections}
                showCancelAction={!isCancelled}
                onCancelBooking={() => setCancelDialogOpen(true)}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      <ClientBookingCancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
      />
      <ClientBookingDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBooking}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
