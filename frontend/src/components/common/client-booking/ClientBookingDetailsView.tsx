"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppPillTabs, ClientPageTabsBar, MarketingSiteFooter, MollureMarketingHeader } from "..";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { useAppSelector } from "../../../store/hooks";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import type { BookingListTab } from "../../../app/clients/booking/clientBookingRecords";
import {
  isClientBookingPaymentDue,
  type ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import { submitClientBookingRequest } from "../../../app/clients/booking/submitClientBookingRequest";
import {
  clearActiveBookingSession,
  getActiveBookingSession,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import ClientBookingCancelDialog from "./ClientBookingCancelDialog";
import ClientBookingDeleteDialog from "./ClientBookingDeleteDialog";
import ClientBookingDiscardDialog from "./ClientBookingDiscardDialog";
import { setBookingCancellationReason } from "./bookingCancellationReason";
import ClientBookingDetailsHeader from "./ClientBookingDetailsHeader";
import ClientBookingInfoBar from "./ClientBookingInfoBar";
import ClientBookingPaymentDetailsCard from "./ClientBookingPaymentDetailsCard";
import ClientBookingPaymentSummary from "./ClientBookingPaymentSummary";
import ClientBookingPoliciesAccordion from "./ClientBookingPoliciesAccordion";
import { buildClientBookingPaymentSummary } from "./buildClientBookingPaymentSummary";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useCheckoutBookingRef } from "./useCheckoutBookingRef";
import ClientBookingChangeResponsePanel from "./ClientBookingChangeResponsePanel";
import ClientEbrResponseActions from "./ClientEbrResponseActions";
import ClientEbrActionDialog, { type ClientEbrActionKind } from "./ClientEbrActionDialog";
import ClientEbrSuggestDrawer from "./ClientEbrSuggestDrawer";
import {
  clientAcceptSuggestedChanges,
  clientAcknowledgeRejectedEdit,
  clientRejectSuggestedChanges,
  clientSuggestEbrChanges,
  clearBookingEditRequest,
  getBookingEditRequest,
  professionalSuggestBookingChanges,
} from "./bookingEditRequest";
import { useBookingEditRequest } from "./useBookingEditRequest";
import {
  parseCalendarEntryNotes,
  resolveKilometerAllowanceAmount,
  serializeCalendarEntryNotes,
} from "../calendar/bookingEventDetails";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
} from "../finance-documents";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import type { ClientBookingDraft } from "./types";
import { useCreateBookingMutation, useGetAllBusinessSetupsQuery, useUpdateMyBookingMutation } from "../../../store/services/businessApi";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
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
  { label: "Ongoing", value: "ongoing" },
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
  const searchParams = useSearchParams();
  const listTab: BookingListTab = parseBookingListTab(searchParams?.get("tab"));
  const m = useTheme().palette.mollure;
  useBookingRealtimeSync();
  const user = useAppSelector((s) => s.auth.user);
  const { draft, shop, businessProfile, prepaymentPercent, requiresPrepayment } = useClientBookingDraft();
  const { data: businessSetupsData } = useGetAllBusinessSetupsQuery();
  const bookingSetup = React.useMemo(
    () => businessSetupsData?.data?.find((row) => row.id === shop?.shopId) ?? null,
    [businessSetupsData?.data, shop?.shopId],
  );
  const { requesterName, requesterAvatarUrl, requesterPhone } = useClientRequesterProfile();

  const isPrepaid = variant === "prepaid";
  const locationMode = shop?.locationMode ?? "fixed";
  const checkoutBookingRef = useCheckoutBookingRef();
  const { record: activeBooking, refresh: refreshActiveBooking } = useActiveClientBooking();
  const bookingRef = activeBooking?.bookingRef ?? checkoutBookingRef;
  const editRequest = useBookingEditRequest(bookingRef);
  const bookingStatus: ClientBookingStatus = activeBooking?.status ?? "draft";
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const isBookingRequestSent = Boolean(activeBooking?.bookingRequestSent);
  const isPaymentDue = Boolean(activeBooking && isClientBookingPaymentDue(activeBooking));
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
  const [ebrAction, setEbrAction] = React.useState<ClientEbrActionKind | null>(null);
  const [suggestDrawerOpen, setSuggestDrawerOpen] = React.useState(false);
  const isCancelled = bookingStatus === "cancelled";
  /** Accept / Suggest / Reject only when professional sent an EBR (API notes). */
  const isEbrIncoming = activeBooking?.incomingEditRequest?.status === "suggested";
  const canActOnPayment = !isCompleted && !isCancelled && prepaymentState === "required";
  const { invoiceSettings: financeSettings, transactionOptions } = usePublicFinanceSettings(shop?.shopId);
  const [activeDocument, setActiveDocument] = React.useState<"invoice" | "receipt" | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const [createBooking] = useCreateBookingMutation();
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
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

  // After editing services for an EBR suggestion, reopen the suggest drawer.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("mollure:ebr_suggest_return") !== "1") return;
    window.sessionStorage.removeItem("mollure:ebr_suggest_return");
    setSuggestDrawerOpen(true);
  }, []);

  // Hydrate local EBR state from API notes so client UI works across browsers/sessions.
  // Accept / Suggest / Reject only when professional sent EBR — clear stale local suggested state.
  React.useEffect(() => {
    if (!bookingRef) return;
    const incoming = activeBooking?.incomingEditRequest;
    if (incoming?.status === "suggested") {
      const current = getBookingEditRequest(bookingRef);
      if (current.status !== "suggested") {
        professionalSuggestBookingChanges(bookingRef, {
          professionalNote: incoming.professionalNote,
          editedServiceIds: incoming.editedServiceIds,
          editedProductIds: incoming.editedProductIds,
          suggestedServices: incoming.suggestedServices,
          suggestedProducts: incoming.suggestedProducts,
        });
        editRequest.refresh();
      }
      return;
    }
    if (getBookingEditRequest(bookingRef).status === "suggested") {
      clearBookingEditRequest(bookingRef);
      editRequest.refresh();
    }
    // Only re-run when the API-sourced EBR payload changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking?.incomingEditRequest, bookingRef]);

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

  const bookedDateLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    return Number.isNaN(dt.getTime())
      ? draft.selectedDateISO
      : dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  }, [draft?.selectedDateISO]);

  const bookedTimeLabel = draft?.selectedTime ?? "";

  const headerName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim() ||
    user?.email ||
    "";

  const policySections = businessProfile?.policySections ?? [];

  const clearActiveBookingSessionLocal = React.useCallback(() => {
    clearActiveBookingSession();
  }, []);

  const handleConfirmCancel = async (reason: string) => {
    if (!apiBookingId) {
      showSnackbar({ severity: "error", message: "Booking not found on server." });
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      if (reason) {
        setBookingCancellationReason(bookingRef || apiBookingId, reason);
      }
      await refreshActiveBooking();
      showSnackbar({ severity: "success", message: "Booking cancelled" });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to cancel booking."),
      });
    }
    setCancelDialogOpen(false);
  };

  const handleDeleteBooking = async () => {
    if (!apiBookingId) {
      clearActiveBookingSessionLocal();
      router.push("/clients/booking?tab=upcoming");
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      clearActiveBookingSessionLocal();
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
      clearActiveBookingSessionLocal();
      router.push("/clients/booking?tab=upcoming");
      return;
    }
    try {
      await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
      clearActiveBookingSessionLocal();
      showSnackbar({ severity: "success", message: "Booking request discarded" });
      router.push(`/clients/booking?tab=${listTab}`);
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

  const submitDraftBookingRequest = React.useCallback(async (): Promise<boolean> => {
    if (!isDraft || !activeBooking) return true;
    if (activeBooking.bookingRequestSent) return true;

    setIsSubmittingRequest(true);
    try {
      const result = await submitClientBookingRequest({
        record: activeBooking,
        locationMode,
        setup: bookingSetup,
        createBooking,
      });
      if (!result.ok) {
        showSnackbar({ severity: "error", message: result.message });
        return false;
      }
      setActiveBookingSession(result.record);
      await refreshActiveBooking();
      return true;
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [activeBooking, bookingSetup, createBooking, isDraft, locationMode, refreshActiveBooking, showSnackbar]);

  const completePrepayment = React.useCallback(async () => {
    const submitted = await submitDraftBookingRequest();
    if (!submitted) return;

    const sessionRecord = getActiveBookingSession();
    const bookingId =
      sessionRecord?.apiBookingId ??
      (sessionRecord?.id && !String(sessionRecord.id).startsWith("bk_draft_") ? sessionRecord.id : null) ??
      apiBookingId;
    if (!bookingId || String(bookingId).startsWith("bk_draft_")) {
      showSnackbar({ severity: "error", message: "Booking not found on server." });
      return;
    }

    try {
      await updateMyBooking({
        id: bookingId,
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
    submitDraftBookingRequest,
    syncFinanceFromBooking,
    updateMyBooking,
  ]);

  const handlePayNow = React.useCallback(async () => {
    const submitted = await submitDraftBookingRequest();
    if (!submitted) return;

    if (!checkoutPaymentMethodSupportsPayNow(selectedPaymentMethod)) {
      await completePrepayment();
      return;
    }
    if (prepaidAmount <= 0) {
      showSnackbar({ severity: "error", message: "No prepayment amount due." });
      return;
    }
    setStripeDialogOpen(true);
  }, [completePrepayment, prepaidAmount, selectedPaymentMethod, showSnackbar, submitDraftBookingRequest]);

  const handleSendBookingRequest = React.useCallback(async () => {
    const submitted = await submitDraftBookingRequest();
    if (!submitted) return;
    showSnackbar({ severity: "success", message: "Booking request sent" });
  }, [showSnackbar, submitDraftBookingRequest]);

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

  const handleConfirmEbrAccept = React.useCallback(() => {
    void returnToBookingDetailsStart("accept_suggested");
  }, [returnToBookingDetailsStart]);

  const handleConfirmEbrReject = React.useCallback(async () => {
    if (!bookingRef) return;
    clientRejectSuggestedChanges(bookingRef);
    if (apiBookingId) {
      try {
        await updateMyBooking({ id: apiBookingId, status: "cancelled" }).unwrap();
        await refreshActiveBooking();
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to reject edited booking request."),
        });
        return;
      }
    }
    editRequest.refresh();
    showSnackbar({ severity: "success", message: "Edited booking request rejected." });
  }, [apiBookingId, bookingRef, editRequest, refreshActiveBooking, showSnackbar, updateMyBooking]);

  const handleConfirmEbrSuggest = React.useCallback(() => {
    setSuggestDrawerOpen(true);
  }, []);

  const handleAcknowledgeRejected = React.useCallback(() => {
    returnToBookingDetailsStart("acknowledge_rejected");
  }, [returnToBookingDetailsStart]);

  /** ER rejection acknowledgment panel — not used after EBR reject (booking already Invalid). */
  const showRejectedResponsePanel = editRequest.isRejected && !isCancelled;

  const displayDraft = React.useMemo(() => {
    if (!draft) return null;
    if (!editRequest.isSuggested || !editRequest.suggestedServices?.length) return draft;

    const teamMembers = [...(draft.teamMembers ?? [])];
    for (const service of editRequest.suggestedServices) {
      if (!service.teamMemberId || !service.teamMemberName) continue;
      if (teamMembers.some((member) => member.id === service.teamMemberId)) continue;
      teamMembers.push({ id: service.teamMemberId, name: service.teamMemberName });
    }

    const services = editRequest.suggestedServices.map((service) => {
      const original =
        draft.services.find((row) => row.id === service.id) ??
        draft.services.find((row) => row.name === service.name);
      return {
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        // Keep Model/Guest assignment from original draft when EBR omits guestId.
        guestId: service.guestId ?? original?.guestId ?? null,
        teamMemberId: service.teamMemberId ?? original?.teamMemberId ?? null,
      };
    });
    const productTotal = (editRequest.suggestedProducts ?? []).reduce((sum, product) => sum + product.price, 0);
    const serviceTotal = services.reduce((sum, service) => sum + service.price, 0);

    return {
      ...draft,
      // Preserve people + projectDetails via spread — EBR only updates service lines/totals.
      services,
      teamMembers,
      total: serviceTotal + productTotal,
    };
  }, [draft, editRequest.isSuggested, editRequest.suggestedProducts, editRequest.suggestedServices]);

  const persistClientEbrSuggestion = React.useCallback(
    async (note: string) => {
      if (!bookingRef) return;
      const services = (displayDraft?.services ?? draft?.services ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        staffResourceId: service.teamMemberId ?? undefined,
      }));
      const total = displayDraft?.total ?? draft?.total ?? 0;
      const serviceNames = services.map((service) => service.name).filter(Boolean);
      const humanNote = [note.trim(), serviceNames.length ? `Services: ${serviceNames.join(", ")}` : ""]
        .filter(Boolean)
        .join("\n");
      const persistedNotes = serializeCalendarEntryNotes(humanNote, undefined, {
        status: "pending",
        suggestedAt: new Date().toISOString(),
        clientNote: note.trim() || undefined,
        professionalNote: editRequest.professionalNote,
        editedServiceIds: editRequest.editedServiceIds,
        editedProductIds: editRequest.editedProductIds,
        suggestedServices: services,
        suggestedProducts: editRequest.suggestedProducts?.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unitPrice: product.price,
        })),
        responseStatus: "suggestion_for_change",
        requestDirection: "incoming",
        lastEditedBy: "client",
      });

      clientSuggestEbrChanges(bookingRef, note);
      if (apiBookingId) {
        await updateMyBooking({
          id: apiBookingId,
          notes: persistedNotes,
          total_price: total,
        }).unwrap();
        await refreshActiveBooking();
      }
      editRequest.refresh();
      showSnackbar({
        severity: "success",
        message: "Suggested changes sent to the professional.",
      });
    },
    [
      apiBookingId,
      bookingRef,
      displayDraft?.services,
      displayDraft?.total,
      draft?.services,
      draft?.total,
      editRequest,
      refreshActiveBooking,
      showSnackbar,
      updateMyBooking,
    ],
  );

  const handleSubmitSuggestFromDrawer = React.useCallback(
    async (note: string) => {
      try {
        await persistClientEbrSuggestion(note);
        setSuggestDrawerOpen(false);
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to send suggested changes."),
        });
      }
    },
    [persistClientEbrSuggestion, showSnackbar],
  );

  const handleEditServicesFromSuggest = React.useCallback(
    (note: string) => {
      if (typeof window !== "undefined" && note) {
        window.sessionStorage.setItem("mollure:ebr_suggest_note", note);
      }
      setSuggestDrawerOpen(false);
      router.push("/clients/booking?mode=create&ebrSuggest=1");
    },
    [router],
  );

  const detailsContentKey = `${bookingRef}-${editRequest.status ?? "none"}-${bookingStatus}`;
  const isFullyCompleted = isCompleted && activeBooking?.paid === true && !isPaymentDue;
  const pageBackground = isFullyCompleted ? "#EAECF0" : "#EAF9FB";
  const displayTotal = displayDraft?.total ?? draft?.total ?? 0;
  const displayPrepaidAmount = Math.round(((displayTotal * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  const bookingNotesMeta = React.useMemo(
    () => parseCalendarEntryNotes(activeBooking?.notes),
    [activeBooking?.notes],
  );
  const kilometerAllowanceAmount = React.useMemo(
    () => resolveKilometerAllowanceAmount(bookingNotesMeta?.kilometerAllowance),
    [bookingNotesMeta?.kilometerAllowance],
  );
  /** Only for desired-location bookings when a kilometer amount was set. */
  const showKilometerAllowance = locationMode === "desired" && kilometerAllowanceAmount > 0;
  /** Prepayment breakdown only when the professional requires prepayment. */
  const paymentCardPrepaymentState =
    requiresPrepayment && !isCancelled ? prepaymentState : ("none" as const);

  const paymentSummarySections = React.useMemo(
    () =>
      buildClientBookingPaymentSummary({
        draft: displayDraft ?? draft,
        requesterName,
        prepaid: isPrepaymentPaid,
        paid: activeBooking?.paid === true,
        requiresPrepayment: Boolean(activeBooking?.requiresPrepayment ?? requiresPrepayment),
        prepaymentPercent: activeBooking?.prepaymentPercent ?? prepaymentPercent,
        paymentDue: isPaymentDue,
        hasEditPrepayment: editRequest.isSuggested,
      }),
    [
      activeBooking?.paid,
      activeBooking?.prepaymentPercent,
      activeBooking?.requiresPrepayment,
      displayDraft,
      draft,
      editRequest.isSuggested,
      isPaymentDue,
      isPrepaymentPaid,
      prepaymentPercent,
      requesterName,
      requiresPrepayment,
    ],
  );

  /** After prepayment: show Payment Summary (invoice/receipt). Also on completed / payment due. */
  const visiblePaymentSummarySections = React.useMemo(() => {
    if (!paymentSummarySections.length) return [];
    if (isPrepaymentPaid && !isCompleted && !isPaymentDue) {
      return paymentSummarySections.filter((section) => section.title === "Prepayment");
    }
    return paymentSummarySections;
  }, [isCompleted, isPaymentDue, isPrepaymentPaid, paymentSummarySections]);

  const showPaymentSummary =
    visiblePaymentSummarySections.length > 0 &&
    (prepaymentState === "paid" || isCompleted || isPaymentDue);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBackground }}>
      <MollureMarketingHeader navItems={[]} isAuthed userLabel={user?.email ?? ""} userName={headerName} homeHref="/" />

      <ClientPageTabsBar activeLabel="Booking" />
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 0, pt: 1 }}>
        <AppPillTabs
          tabs={bookingPillTabs}
          active={listTab}
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
            bookedDateLabel={bookedDateLabel}
            bookedTimeLabel={bookedTimeLabel}
            bookingStatus={bookingStatus}
            bookingRequestSent={isBookingRequestSent}
            bookingRequestDirection={activeBooking?.bookingRequestDirection}
            locationMode={locationMode}
            isCancelled={isCancelled}
            requiresPrepayment={requiresPrepayment}
            prepaymentPaid={isPrepaymentPaid}
            paymentDue={isPaymentDue}
            onSendBookingRequest={isDraft && !isBookingRequestSent ? handleSendBookingRequest : undefined}
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

            {showRejectedResponsePanel ? (
              <>
                <ClientBookingPaymentDetailsCard
                  key={detailsContentKey}
                  draft={displayDraft}
                  requesterName={requesterName}
                  requesterEmail={user?.email}
                  requesterAvatarUrl={requesterAvatarUrl}
                  prepaymentState="none"
                  editedServiceIds={editRequest.editedServiceIds}
                  products={editRequest.suggestedProducts}
                  editedProductIds={editRequest.editedProductIds}
                />
                <ClientBookingChangeResponsePanel
                  variant="rejected"
                  total={displayTotal}
                  prepaidAmount={displayPrepaidAmount}
                  prepaymentPaid={prepaymentState === "paid"}
                  onOk={handleAcknowledgeRejected}
                  onViewInvoice={bookingTransactionRow ? openInvoice : undefined}
                  onViewReceipt={(prepaymentReceiptRow ?? bookingTransactionRow) ? openReceipt : undefined}
                />
              </>
            ) : (
              <>
                <ClientBookingPaymentDetailsCard
                  key={detailsContentKey}
                  draft={displayDraft}
                  requesterName={requesterName}
                  requesterEmail={user?.email}
                  requesterAvatarUrl={requesterAvatarUrl}
                  prepaymentState={paymentCardPrepaymentState}
                  prepaymentPercent={prepaymentPercent}
                  payNowLabel={payNowLabel}
                  showKilometerAllowance={showKilometerAllowance}
                  kilometerAllowanceAmount={kilometerAllowanceAmount}
                  editedServiceIds={isEbrIncoming ? editRequest.editedServiceIds : undefined}
                  products={isEbrIncoming ? editRequest.suggestedProducts : undefined}
                  editedProductIds={isEbrIncoming ? editRequest.editedProductIds : undefined}
                  onPayNow={prepaymentState === "required" && canActOnPayment ? handlePayNow : undefined}
                />

                {showPaymentSummary ? (
                  <ClientBookingPaymentSummary
                    sections={visiblePaymentSummarySections}
                    onViewInvoice={bookingTransactionRow ? openInvoice : undefined}
                    onViewReceipt={(prepaymentReceiptRow ?? bookingTransactionRow) ? openReceipt : undefined}
                  />
                ) : null}

                {canActOnPayment && (isPrepaid || isEbrIncoming) ? (
                  <ClientBookingPaymentMethodSelector
                    options={checkoutPaymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                ) : null}

                {isEbrIncoming ? (
                  <ClientEbrResponseActions
                    onAccept={() => setEbrAction("accept")}
                    onSuggestChange={() => setEbrAction("suggest")}
                    onReject={() => setEbrAction("reject")}
                  />
                ) : null}

                {isDraft && !isPrepaid && !isBookingRequestSent && !isEbrIncoming ? (
                  <AppButton
                    fullWidth
                    variant="contained"
                    disableElevation
                    isLoading={isSubmittingRequest}
                    onClick={handleSendBookingRequest}
                    sx={{
                      mt: 2,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 900,
                      height: 40,
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.tealDark },
                    }}
                  >
                    Send booking request
                  </AppButton>
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
        variant={bookingStatus === "completed" ? "completed" : "cancelled"}
      />
      <ClientBookingDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={handleDiscardBookingRequest}
      />

      <ClientEbrActionDialog
        open={Boolean(ebrAction)}
        action={ebrAction}
        onClose={() => setEbrAction(null)}
        onConfirm={() => {
          if (ebrAction === "accept") handleConfirmEbrAccept();
          else if (ebrAction === "reject") void handleConfirmEbrReject();
          else if (ebrAction === "suggest") handleConfirmEbrSuggest();
        }}
      />

      <ClientEbrSuggestDrawer
        open={suggestDrawerOpen}
        draft={displayDraft}
        onClose={() => setSuggestDrawerOpen(false)}
        onEditServices={handleEditServicesFromSuggest}
        onSend={handleSubmitSuggestFromDrawer}
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
