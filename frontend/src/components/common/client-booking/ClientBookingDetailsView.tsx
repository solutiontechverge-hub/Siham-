"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import { Box, Container, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppPillTabs, ClientPageTabsBar, MarketingSiteFooter, MollureMarketingHeader } from "..";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { useAppSelector } from "../../../store/hooks";
import ClientBookingCancelDialog from "./ClientBookingCancelDialog";
import ClientBookingDeleteDialog from "./ClientBookingDeleteDialog";
import ClientBookingDiscardDialog from "./ClientBookingDiscardDialog";
import ClientBookingDetailsHeader from "./ClientBookingDetailsHeader";
import ClientBookingInfoBar from "./ClientBookingInfoBar";
import ClientBookingPaymentDetailsCard from "./ClientBookingPaymentDetailsCard";
import ClientBookingPoliciesAccordion from "./ClientBookingPoliciesAccordion";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useCheckoutBookingRef } from "./useCheckoutBookingRef";
import { ACTIVE_BOOKING_ID_KEY, CHECKOUT_REF_KEY } from "../../../app/clients/booking/clientBookingSession";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import ClientBookingChangeResponsePanel from "./ClientBookingChangeResponsePanel";
import {
  clientAcceptSuggestedChanges,
  clientAcknowledgeRejectedEdit,
} from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
} from "../finance-documents";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import type { ClientBookingDraft } from "./types";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
import { useUpdateMyBookingMutation } from "../../../store/services/businessApi";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useBookingRealtimeSync } from "../../../hooks/useBookingRealtimeSync";
import { useSnackbar } from "../AppSnackbar";
import StripePrepaymentDialog from "./StripePrepaymentDialog";
import ClientBookingPaymentMethodSelector from "./ClientBookingPaymentMethodSelector";
import {
  checkoutPaymentMethodApiValue,
  checkoutPaymentMethodSupportsPayNow,
  resolveCheckoutPaymentOptions,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";

const bookingPillTabs = [
  { label: "Past", value: "past" },
  { label: "Outgoing", value: "outgoing" },
  { label: "Upcoming", value: "upcoming" },
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
  useBookingRealtimeSync();
  const user = useAppSelector((s) => s.auth.user);
  const { draft, shop, businessProfile, prepaymentPercent, requiresPrepayment } = useClientBookingDraft();
  const { requesterName, requesterAvatarUrl, requesterPhone } = useClientRequesterProfile();

  const isPrepaid = variant === "prepaid";
  const locationMode = shop?.locationMode ?? "fixed";
  const bookingRef = useCheckoutBookingRef();
  const { record: activeBooking, refresh: refreshActiveBooking } = useActiveClientBooking();
  const editRequest = useBookingEditRequest(bookingRef);
  const bookingStatus: ClientBookingStatus = activeBooking?.status ?? "requested";
  const isPrepaymentPaid = Boolean(activeBooking?.prepaid);
  const prepaymentState = !requiresPrepayment
    ? ("none" as const)
    : isPrepaymentPaid
      ? ("paid" as const)
      : ("required" as const);
  const apiBookingId = activeBooking?.apiBookingId ?? activeBooking?.id ?? null;

  const [phone, setPhone] = React.useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const isCancelled = bookingStatus === "cancelled";
  const { invoiceSettings: financeSettings, transactionOptions } = usePublicFinanceSettings(shop?.shopId);
  const [activeDocument, setActiveDocument] = React.useState<"invoice" | "receipt" | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const checkoutPaymentOptions = React.useMemo(
    () => resolveCheckoutPaymentOptions(transactionOptions, locationMode),
    [locationMode, transactionOptions],
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<CheckoutPaymentMethodId>("onlineDirect");
  const { showSnackbar } = useSnackbar();
  const [syncFinanceFromBooking] = useSyncFinanceTransactionFromBookingMutation();
  const [updateMyBooking] = useUpdateMyBookingMutation();

  React.useEffect(() => {
    if (!checkoutPaymentOptions.length) return;
    setSelectedPaymentMethod((prev) =>
      checkoutPaymentOptions.some((option) => option.id === prev) ? prev : checkoutPaymentOptions[0].id,
    );
  }, [checkoutPaymentOptions]);

  React.useEffect(() => {
    if (requesterPhone && !phone) setPhone(requesterPhone);
  }, [phone, requesterPhone]);

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
    "";

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

  const policySections = businessProfile?.policySections ?? [];

  const clearActiveBookingSession = React.useCallback(() => {
    try {
      window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
      window.sessionStorage.removeItem(ACTIVE_BOOKING_ID_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleConfirmCancel = async () => {
    if (!apiBookingId) {
      showSnackbar({ severity: "error", message: "Booking not found on server." });
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      await refreshActiveBooking();
      showSnackbar({ severity: "success", message: "Booking cancelled" });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to cancel booking."),
      });
    }
  };

  const handleDeleteBooking = async () => {
    if (!apiBookingId) {
      clearActiveBookingSession();
      router.push("/clients/booking?tab=upcoming");
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      clearActiveBookingSession();
      showSnackbar({ severity: "success", message: "Booking cancelled" });
      router.push("/clients/booking?tab=upcoming");
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to cancel booking."),
      });
    }
  };

  const handleDiscardBookingRequest = async () => {
    if (!apiBookingId) {
      clearActiveBookingSession();
      router.push("/clients/booking?tab=upcoming");
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      clearActiveBookingSession();
      showSnackbar({ severity: "success", message: "Booking request discarded" });
      router.push("/clients/booking?tab=upcoming");
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to discard booking request."),
      });
    }
  };

  const prepaidAmount = React.useMemo(() => {
    const total = draft?.total ?? 0;
    return Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  }, [draft?.total, prepaymentPercent]);

  const professionalBusinessOverride = React.useMemo(() => {
    const fixed = businessProfile?.fixedLocation;
    return {
      legalName: fixed?.salonName ?? businessProfile?.shopName ?? shop?.shopName ?? professional.name,
      address:
        shop?.addressLabel ??
        shop?.municipalityLabel ??
        fixed?.formattedAddress ??
        address,
    };
  }, [address, businessProfile, professional.name, shop]);

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

  const completePrepayment = React.useCallback(async () => {
    if (!apiBookingId) {
      showSnackbar({ severity: "error", message: "Booking not found on server." });
      return;
    }
    try {
      await updateMyBooking({
        id: apiBookingId,
        prepayment_status: "paid",
        ...(locationMode === "fixed" ? { status: "confirmed" as const } : {}),
      }).unwrap();
      await refreshActiveBooking();
      void syncFinanceFromBooking({
        bookingRef,
        paymentPhase: "prepay",
        paymentMethod: checkoutPaymentMethodApiValue(selectedPaymentMethod),
        amount: prepaidAmount,
        status: selectedPaymentMethod.includes("Invoice") ? "Payment due" : "Prepaid",
      });
      setStripeDialogOpen(false);
      showSnackbar({
        severity: "success",
        message: selectedPaymentMethod.includes("Invoice")
          ? "Invoice requested. You will receive payment details before the due date."
          : "Prepayment received. Your booking is confirmed.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to record prepayment."),
      });
    }
  }, [
    apiBookingId,
    bookingRef,
    locationMode,
    prepaidAmount,
    refreshActiveBooking,
    selectedPaymentMethod,
    showSnackbar,
    syncFinanceFromBooking,
    updateMyBooking,
  ]);

  const handlePayNow = React.useCallback(() => {
    if (!checkoutPaymentMethodSupportsPayNow(selectedPaymentMethod)) {
      void completePrepayment();
      return;
    }
    if (prepaidAmount <= 0) {
      showSnackbar({ severity: "error", message: "No prepayment amount due." });
      return;
    }
    setStripeDialogOpen(true);
  }, [completePrepayment, prepaidAmount, selectedPaymentMethod, showSnackbar]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    void completePrepayment();
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [completePrepayment]);

  const refreshFinanceSettings = React.useCallback(() => {
    // Public settings are loaded via RTK Query and stay current automatically.
  }, []);

  const payNowLabel = checkoutPaymentMethodSupportsPayNow(selectedPaymentMethod) ? "Pay Now" : "Request Invoice";

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
    async (mode: "accept_suggested" | "acknowledge_rejected") => {
      if (mode === "accept_suggested") {
        clientAcceptSuggestedChanges(bookingRef);
      } else {
        clientAcknowledgeRejectedEdit(bookingRef);
      }

      if (apiBookingId) {
        try {
          await updateMyBooking({ id: apiBookingId, status: "confirmed" }).unwrap();
          await refreshActiveBooking();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to confirm booking changes."),
          });
          return;
        }
      }

      editRequest.refresh();
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
    [apiBookingId, bookingRef, editRequest, refreshActiveBooking, showSnackbar, updateMyBooking],
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
      <MollureMarketingHeader navItems={[]} isAuthed userLabel={user?.email ?? ""} userName={headerName} homeHref="/" />

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
            bookingRequestDirection={activeBooking?.bookingRequestDirection}
            locationMode={locationMode}
            isCancelled={isCancelled}
            requiresPrepayment={requiresPrepayment}
            onDeleteBooking={() => setDeleteDialogOpen(true)}
            onDiscardBookingRequest={() => setDiscardDialogOpen(true)}
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
              <>
                <ClientBookingPaymentDetailsCard
                  key={detailsContentKey}
                  draft={draft}
                  requesterName={requesterName}
                  requesterAvatarUrl={requesterAvatarUrl}
                  prepaymentState={isPrepaid ? prepaymentState : "none"}
                  prepaymentPercent={prepaymentPercent}
                  payNowLabel={payNowLabel}
                  onPayNow={prepaymentState === "required" ? handlePayNow : undefined}
                  onViewInvoice={prepaymentState === "paid" && bookingTransactionRow ? openInvoice : undefined}
                  onViewReceipt={
                    prepaymentState === "paid" && (prepaymentReceiptRow ?? bookingTransactionRow)
                      ? openReceipt
                      : undefined
                  }
                />

                {isPrepaid && prepaymentState === "required" ? (
                  <ClientBookingPaymentMethodSelector
                    options={checkoutPaymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                ) : null}
              </>
            )}

            <Box sx={{ mt: 2 }}>
              <ClientBookingPoliciesAccordion
                sections={policySections}
                showCancelAction={!isCancelled && bookingStatus === "confirmed"}
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
      <ClientBookingDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={handleDiscardBookingRequest}
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
