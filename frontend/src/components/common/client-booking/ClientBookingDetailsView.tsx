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
import {
  markClientBookingCancelled,
  markClientBookingPrepaid,
  removeClientBookingById,
  updateClientBookingStatus,
  type ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import ClientBookingChangeResponsePanel from "./ClientBookingChangeResponsePanel";
import {
  clientAcceptSuggestedChanges,
  clientAcknowledgeRejectedEdit,
} from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
  readFinanceInvoiceSettings,
} from "../finance-documents";
import type { ClientBookingDraft } from "./types";
import type { BusinessPublicProfilePolicySection } from "../../../data/businessPublicProfile.data";
import { getBusinessPublicProfileByShopId } from "../../../data/businessPublicProfile.data";
import { useSnackbar } from "../AppSnackbar";
import StripePrepaymentDialog from "./StripePrepaymentDialog";

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
  const { record: activeBooking, refresh: refreshActiveBooking } = useActiveClientBooking();
  const editRequest = useBookingEditRequest(bookingRef);
  const bookingStatus: ClientBookingStatus = activeBooking?.status ?? "confirmed";
  const isPrepaymentPaid = Boolean(activeBooking?.prepaid);
  const prepaymentState = !requiresPrepayment
    ? ("none" as const)
    : isPrepaymentPaid
      ? ("paid" as const)
      : ("required" as const);

  const [phone, setPhone] = React.useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isCancelled, setIsCancelled] = React.useState(false);
  const [financeSettings, setFinanceSettings] = React.useState(() => readFinanceInvoiceSettings());
  const [activeDocument, setActiveDocument] = React.useState<"invoice" | "receipt" | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const { showSnackbar } = useSnackbar();

  React.useEffect(() => {
    setFinanceSettings(readFinanceInvoiceSettings());
  }, []);

  React.useEffect(() => {
    if (requesterPhone && !phone) setPhone(requesterPhone);
  }, [phone, requesterPhone]);

  React.useEffect(() => {
    setIsCancelled(isCheckoutBookingCancelled(bookingRef) || bookingStatus === "cancelled");
  }, [bookingRef, bookingStatus]);

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

  const prepaidAmount = React.useMemo(() => {
    const total = draft?.total ?? 0;
    return Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  }, [draft?.total, prepaymentPercent]);

  const professionalBusinessOverride = React.useMemo(() => {
    const profile = shop?.shopId ? getBusinessPublicProfileByShopId(shop.shopId) : null;
    const fixed = profile?.fixedLocation;
    return {
      legalName: fixed?.salonName ?? profile?.shopName ?? shop?.shopName ?? professional.name,
      address:
        shop?.addressLabel ??
        shop?.municipalityLabel ??
        fixed?.formattedAddress ??
        address,
    };
  }, [address, professional.name, shop]);

  const bookingTransactionRow = React.useMemo(() => {
    if (!draft?.services?.length) return null;
    return buildClientBookingTransactionRow({
      bookingRef,
      draft,
      requesterName,
      requesterEmail: user?.email,
      financeSettings,
    });
  }, [bookingRef, draft, financeSettings, requesterName, user?.email]);

  const prepaymentReceiptRow = React.useMemo(() => {
    if (!draft?.services?.length || prepaymentState !== "paid") return null;
    return buildClientBookingTransactionRow({
      bookingRef: `${bookingRef}-prepay`,
      draft,
      requesterName,
      requesterEmail: user?.email,
      financeSettings,
      documentAmount: prepaidAmount,
    });
  }, [bookingRef, draft, financeSettings, prepaymentState, prepaidAmount, requesterName, user?.email]);

  const completePrepayment = React.useCallback(() => {
    try {
      const activeId = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
      if (activeId) markClientBookingPrepaid(activeId);
    } catch {
      // ignore
    }
    setStripeDialogOpen(false);
    showSnackbar({ severity: "success", message: "Prepayment received. Thank you!" });
  }, [showSnackbar]);

  const handlePayNow = React.useCallback(() => {
    if (prepaidAmount <= 0) {
      showSnackbar({ severity: "error", message: "No prepayment amount due." });
      return;
    }
    setStripeDialogOpen(true);
  }, [prepaidAmount, showSnackbar]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    completePrepayment();
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [completePrepayment]);

  const refreshFinanceSettings = React.useCallback(() => {
    setFinanceSettings(readFinanceInvoiceSettings());
  }, []);

  const openInvoice = React.useCallback(() => {
    if (!bookingTransactionRow) return;
    refreshFinanceSettings();
    setActiveDocument("invoice");
  }, [bookingTransactionRow, refreshFinanceSettings]);

  const openReceipt = React.useCallback(() => {
    if (!(prepaymentReceiptRow ?? bookingTransactionRow)) return;
    refreshFinanceSettings();
    setActiveDocument("receipt");
  }, [bookingTransactionRow, prepaymentReceiptRow, refreshFinanceSettings]);

  const returnToBookingDetailsStart = React.useCallback(
    (mode: "accept_suggested" | "acknowledge_rejected") => {
      if (mode === "accept_suggested") {
        clientAcceptSuggestedChanges(bookingRef);
      } else {
        clientAcknowledgeRejectedEdit(bookingRef);
      }

      try {
        const activeId = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
        if (activeId) updateClientBookingStatus(activeId, "confirmed");
      } catch {
        // ignore
      }

      editRequest.refresh();
      refreshActiveBooking();
      setActiveDocument(null);
      setStripeDialogOpen(false);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      showSnackbar({
        severity: "success",
        message:
          mode === "accept_suggested"
            ? "Changes accepted. Your booking is confirmed."
            : "Booking details updated.",
      });
    },
    [bookingRef, editRequest, refreshActiveBooking, showSnackbar],
  );

  const handleOkSuggestedChanges = React.useCallback(() => {
    returnToBookingDetailsStart("accept_suggested");
  }, [returnToBookingDetailsStart]);

  const handleSuggestChange = React.useCallback(() => {
    router.push("/clients/booking?mode=create");
  }, [router]);

  const handleAcknowledgeRejected = React.useCallback(() => {
    returnToBookingDetailsStart("acknowledge_rejected");
  }, [returnToBookingDetailsStart]);

  const showChangeResponsePanel = editRequest.isSuggested || editRequest.isRejected;
  const detailsContentKey = `${bookingRef}-${editRequest.status ?? "none"}-${bookingStatus}`;

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
            bookingStatus={bookingStatus}
            isCancelled={isCancelled}
            requiresPrepayment={requiresPrepayment}
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

            {showChangeResponsePanel ? (
              <ClientBookingChangeResponsePanel
                variant={editRequest.isRejected ? "rejected" : "suggested"}
                total={draft?.total ?? 0}
                prepaidAmount={prepaidAmount}
                prepaymentPaid={prepaymentState === "paid"}
                onOk={editRequest.isRejected ? handleAcknowledgeRejected : handleOkSuggestedChanges}
                onSuggestChange={handleSuggestChange}
                onViewInvoice={bookingTransactionRow ? openInvoice : undefined}
                onViewReceipt={(prepaymentReceiptRow ?? bookingTransactionRow) ? openReceipt : undefined}
              />
            ) : (
              <ClientBookingPaymentDetailsCard
                key={detailsContentKey}
                draft={draft}
                requesterName={requesterName}
                requesterAvatarUrl={requesterAvatarUrl}
                prepaymentState={isPrepaid ? prepaymentState : "none"}
                prepaymentPercent={prepaymentPercent}
                onPayNow={prepaymentState === "required" ? handlePayNow : undefined}
                onViewInvoice={prepaymentState === "paid" && bookingTransactionRow ? openInvoice : undefined}
                onViewReceipt={
                  prepaymentState === "paid" && (prepaymentReceiptRow ?? bookingTransactionRow) ? openReceipt : undefined
                }
              />
            )}

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

      <StripePrepaymentDialog
        open={stripeDialogOpen}
        amount={prepaidAmount}
        bookingRef={bookingRef}
        onClose={() => setStripeDialogOpen(false)}
        onSuccess={completePrepayment}
      />

      <FinanceDocumentPreviewDrawer
        open={Boolean(activeDocument)}
        onClose={() => setActiveDocument(null)}
        documentType={activeDocument ?? "invoice"}
        invoiceType={financeSettings.defaultInvoiceType}
        settings={financeSettings}
        row={
          activeDocument === "receipt"
            ? (prepaymentReceiptRow ?? bookingTransactionRow)
            : bookingTransactionRow
        }
        professionalBusinessOverride={professionalBusinessOverride}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
