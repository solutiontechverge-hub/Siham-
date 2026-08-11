"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppButton,
  AppPillTabs,
  ClientPageTabsBar,
  MarketingSiteFooter,
  MollureMarketingHeader,
} from "..";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { useAppSelector } from "../../../store/hooks";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import type { BookingListTab } from "../../../app/clients/booking/clientBookingRecords";
import {
  isClientBookingPaymentDue,
  type ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import { submitClientBookingRequest } from "../../../app/clients/booking/submitClientBookingRequest";
import { resolveCreateBookingStatus } from "../../../app/clients/booking/resolveCreateBookingStatus";
import { parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "../../../app/clients/booking/booking-time";
import {
  clearActiveBookingSession,
  getActiveBookingSession,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import {
  hasUnseenBookingUpdate,
  markBookingUpdateSeen,
} from "../calendar/bookingUpdateSeen";
import { enrichClientBookingRecord } from "../../../app/clients/booking/clientBookingDraftCache";
import { clearPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import ClientBookingCancelDialog from "./ClientBookingCancelDialog";
import ClientBookingCancelFeeDialog from "./ClientBookingCancelFeeDialog";
import ClientBookingDeleteDialog from "./ClientBookingDeleteDialog";
import ClientBookingDiscardDialog from "./ClientBookingDiscardDialog";
import ClientEbrSuggestDrawer from "./ClientEbrSuggestDrawer";
import { setBookingCancellationReason } from "./bookingCancellationReason";
import { settleCancellationFee } from "./settleCancellationFee";
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
import EditRequestIncomingNote from "./EditRequestIncomingNote";
import ClientEbrActionDialog, {
  type ClientEbrActionKind,
} from "./ClientEbrActionDialog";
import { buildClientEbrOutcomeNote } from "./buildClientEbrOutcomeNote";
import { useMessagingWidgetOptional } from "../messaging";
import {
  clientAcceptSuggestedChanges,
  clientAcknowledgeRejectedEdit,
  clientRejectSuggestedChanges,
  clientSuggestEbrChanges,
  clearBookingEditRequest,
  consumeConfirmedEditGrant,
  getBookingEditRequest,
  professionalRejectEditRequest,
  professionalSuggestBookingChanges,
  professionalAcceptClientEditRequest,
} from "./bookingEditRequest";
import { syncEditRequestFromBookingApi } from "./syncEditRequestFromApi";
import { useBookingEditRequest } from "./useBookingEditRequest";
import {
  clearEbrSuggestionsFromNotes,
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  resolveKilometerAllowanceAmount,
  serializeCalendarEntryNotes,
} from "../calendar/bookingEventDetails";
import { isResponseWindowOverdue } from "../calendar/bookingResponseDeadline";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
} from "../finance-documents";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import type { ClientBookingDraft } from "./types";
import {
  useCreateBookingMutation,
  useDispatchBookingNotificationMutation,
  useGetAllBusinessSetupsQuery,
  useManageBookingEditRequestMutation,
  useUpdateMyBookingMutation,
} from "../../../store/services/businessApi";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
import { useOpenMessagingForBookingMutation } from "../../../store/services/messagingApi";
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
  const primary =
    teamMembers.find((tm) => tm.id === primaryId) ?? teamMembers[0];
  return { name: primary?.name ?? "Professional", id: primary?.id ?? "" };
}

export default function ClientBookingDetailsView({
  variant,
}: {
  variant: ClientBookingDetailsVariant;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listTab: BookingListTab = parseBookingListTab(searchParams?.get("tab"));
  const m = useTheme().palette.mollure;
  useBookingRealtimeSync();
  const user = useAppSelector((s) => s.auth.user);
  const {
    draft,
    shop,
    businessProfile,
    prepaymentPercent,
    requiresPrepayment,
  } = useClientBookingDraft();
  const { data: businessSetupsData } = useGetAllBusinessSetupsQuery();
  const bookingSetup = React.useMemo(
    () =>
      businessSetupsData?.data?.find((row) => row.id === shop?.shopId) ?? null,
    [businessSetupsData?.data, shop?.shopId],
  );
  const { requesterName, requesterAvatarUrl, requesterPhone } =
    useClientRequesterProfile();

  const isPrepaid = variant === "prepaid";
  const locationMode = shop?.locationMode ?? "fixed";
  const checkoutBookingRef = useCheckoutBookingRef();
  const { record: activeBooking, refresh: refreshActiveBooking } =
    useActiveClientBooking();
  const bookingRef = activeBooking?.bookingRef ?? checkoutBookingRef;
  const editRequest = useBookingEditRequest(bookingRef);
  const bookingStatus: ClientBookingStatus = activeBooking?.status ?? "draft";
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const isBookingRequestSent = Boolean(activeBooking?.bookingRequestSent);
  const isPaymentDue = Boolean(
    activeBooking && isClientBookingPaymentDue(activeBooking),
  );
  const isPrepaymentPaid = Boolean(activeBooking?.prepaid);
  const prepaymentState = !requiresPrepayment
    ? ("none" as const)
    : isPrepaymentPaid
      ? ("paid" as const)
      : ("required" as const);
  const apiBookingId = activeBooking?.apiBookingId ?? activeBooking?.id ?? null;

  const [phone, setPhone] = React.useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelFeeDialogOpen, setCancelFeeDialogOpen] = React.useState(false);
  const [cancelFeeStripeOpen, setCancelFeeStripeOpen] = React.useState(false);
  const [pendingCancelReason, setPendingCancelReason] = React.useState("");
  const [isCancelProcessing, setIsCancelProcessing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const [ebrSuggestDrawerOpen, setEbrSuggestDrawerOpen] = React.useState(false);
  const [ebrAction, setEbrAction] = React.useState<ClientEbrActionKind | null>(
    null,
  );
  const messagingWidget = useMessagingWidgetOptional();
  const isCancelled = bookingStatus === "cancelled";
  /** Accept / Suggest / Reject when professional sent an EBR (API notes). */
  const isEbrIncoming =
    activeBooking?.incomingEditRequest?.status === "suggested";
  /** Professional-sent booking request awaiting client response. */
  const isIncomingBr =
    bookingStatus === "requested" &&
    activeBooking?.bookingRequestDirection === "incoming" &&
    !isEbrIncoming;
  const isIncomingConfirmedEr =
    bookingStatus === "confirmed" &&
    editRequest.isPending &&
    editRequest.initiatedBy === "professional";
  const showRequestResponseActions =
    isEbrIncoming || isIncomingBr || isIncomingConfirmedEr;
  const canActOnPayment =
    !isCompleted && !isCancelled && prepaymentState === "required";
  const { invoiceSettings: financeSettings, transactionOptions } =
    usePublicFinanceSettings(shop?.shopId);
  const [activeDocument, setActiveDocument] = React.useState<
    "invoice" | "receipt" | null
  >(null);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const [createBooking] = useCreateBookingMutation();
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const checkoutPaymentOptions = React.useMemo(
    () => resolveCheckoutPaymentOptions(transactionOptions, locationMode),
    [locationMode, transactionOptions],
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState<CheckoutPaymentMethodId>("onlineDirect");
  const { showSnackbar } = useSnackbar();
  const [syncFinanceFromBooking] =
    useSyncFinanceTransactionFromBookingMutation();
  const [updateMyBooking] = useUpdateMyBookingMutation();
  const [manageBookingEditRequest] = useManageBookingEditRequestMutation();
  const [dispatchBookingNotification] =
    useDispatchBookingNotificationMutation();
  const [openMessagingForBooking] = useOpenMessagingForBookingMutation();

  const dispatchClientBookingNotification = React.useCallback(
    async (
      event:
        | "edit_request_outgoing"
        | "booking_date_changed"
        | "time_changed"
        | "service_edited"
        | "unique_item_edited",
    ) => {
      if (!apiBookingId) return;
      try {
        await dispatchBookingNotification({
          id: apiBookingId,
          event,
          initiated_by: "client",
        }).unwrap();
      } catch {
        // best-effort — local edit-request state still updates
      }
    },
    [apiBookingId, dispatchBookingNotification],
  );

  React.useEffect(() => {
    if (!checkoutPaymentOptions.length) return;
    setSelectedPaymentMethod((prev) =>
      checkoutPaymentOptions.some((option) => option.id === prev)
        ? prev
        : checkoutPaymentOptions[0].id,
    );
  }, [checkoutPaymentOptions]);

  React.useEffect(() => {
    if (requesterPhone && !phone) setPhone(requesterPhone);
  }, [phone, requesterPhone]);

  // Hydrate Confirmed ER from backend edit_request (fallback: notes.er).
  React.useEffect(() => {
    if (!bookingRef) return;
    if (activeBooking?.editRequest) {
      syncEditRequestFromBookingApi(bookingRef, activeBooking.editRequest);
      editRequest.refresh();
      return;
    }
    if (!activeBooking?.notes) return;
    const er = parseStoredErFromNotes(activeBooking.notes);
    if (!er || er.status === "none") return;
    syncEditRequestFromBookingApi(bookingRef, {
      status: er.status as "pending" | "approved" | "rejected",
      note: er.note,
      initiated_by: (er.initiatedBy ?? "client") as "client" | "professional",
      requested_at: er.requestedAt ?? null,
      responded_at: er.approvedAt ?? er.rejectedAt ?? null,
      edit_grant_active: Boolean(er.editGrantActive),
    });
    editRequest.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking?.editRequest, activeBooking?.notes, bookingRef]);

  // Pin Updated for this visit so it stays visible on the Confirmed status row.
  // Clear from localStorage when leaving the page.
  const [showStatusUpdated, setShowStatusUpdated] = React.useState(false);
  React.useEffect(() => {
    setShowStatusUpdated(false);
  }, [bookingRef]);
  React.useEffect(() => {
    if (!bookingRef) return;
    if (
      isEbrIncoming ||
      editRequest.isPending ||
      (bookingStatus !== "confirmed" &&
        bookingStatus !== "waiting_for_prepayment")
    ) {
      return;
    }
    if (
      hasUnseenBookingUpdate({
        viewer: "client",
        bookingRef,
        updatedAt: activeBooking?.updatedAt,
        lastEditedBy: activeBooking?.lastEditedBy ?? null,
      })
    ) {
      setShowStatusUpdated(true);
    }
  }, [
    bookingRef,
    bookingStatus,
    isEbrIncoming,
    editRequest.isPending,
    activeBooking?.updatedAt,
    activeBooking?.lastEditedBy,
  ]);
  React.useEffect(() => {
    if (!bookingRef) return;
    return () => {
      markBookingUpdateSeen("client", bookingRef, activeBooking?.updatedAt);
    };
  }, [bookingRef, activeBooking?.updatedAt]);

  // After editing services for an EBR suggestion, auto-send once booking session is ready.
  const [pendingEbrSuggestSend, setPendingEbrSuggestSend] = React.useState<{
    note: string;
    editedIds: string[];
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("mollure:ebr_suggest_return") !== "1")
      return;
    window.sessionStorage.removeItem("mollure:ebr_suggest_return");

    const note =
      window.sessionStorage.getItem("mollure:ebr_suggest_note") ?? "";
    window.sessionStorage.removeItem("mollure:ebr_suggest_note");

    let editedIds: string[] = [];
    try {
      editedIds = JSON.parse(
        window.sessionStorage.getItem("mollure:ebr_suggest_edited_ids") ?? "[]",
      ) as string[];
    } catch {
      editedIds = [];
    }
    window.sessionStorage.removeItem("mollure:ebr_suggest_edited_ids");
    setPendingEbrSuggestSend({ note, editedIds });
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
    if (incoming?.status === "rejected") {
      const current = getBookingEditRequest(bookingRef);
      if (current.status !== "rejected") {
        professionalRejectEditRequest(bookingRef, {
          clientNote: incoming.clientNote,
          editedServiceIds: incoming.editedServiceIds,
          editedProductIds: incoming.editedProductIds,
          suggestedServices: incoming.suggestedServices,
          suggestedProducts: incoming.suggestedProducts,
          suggestedDateISO: incoming.suggestedDateISO,
          suggestedTime: incoming.suggestedTime,
          originalDateISO: (incoming as { originalDateISO?: string })
            .originalDateISO,
          originalTime: (incoming as { originalTime?: string }).originalTime,
        });
        editRequest.refresh();
      }
      return;
    }
    if (incoming?.status === "accepted") {
      const current = getBookingEditRequest(bookingRef);
      if (current.status !== "accepted") {
        professionalAcceptClientEditRequest(bookingRef, {
          clientNote: incoming.clientNote,
          editedServiceIds: incoming.editedServiceIds,
          editedProductIds: incoming.editedProductIds,
          suggestedServices: incoming.suggestedServices,
          suggestedProducts: incoming.suggestedProducts,
          suggestedDateISO: incoming.suggestedDateISO,
          suggestedTime: incoming.suggestedTime,
          originalDateISO: (incoming as { originalDateISO?: string })
            .originalDateISO,
          originalTime: (incoming as { originalTime?: string }).originalTime,
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

  const professional = React.useMemo(
    () => resolvePrimaryProfessional(draft),
    [draft],
  );
  const professionalRole = businessProfile?.specialties?.[0] ?? "Professional";

  const address = React.useMemo(() => {
    const visit = draft?.desiredLocation;
    if (locationMode === "desired" && visit) {
      const visitLabel = [
        visit.street,
        visit.number,
        visit.postalCode,
        visit.municipality,
        visit.province,
      ]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");
      if (visitLabel) return visitLabel;
    }
    // Use || so empty strings from API/session do not block profile fallback.
    const fromShop =
      shop?.addressLabel?.trim() || shop?.municipalityLabel?.trim() || "";
    // Ignore create-flow placeholder if it ever leaked into session shop.
    if (
      fromShop &&
      fromShop.toLowerCase() !== "enter visit address"
    ) {
      return fromShop;
    }
    if (locationMode === "desired") return "Service at your location";
    return (
      businessProfile?.fixedLocation?.formattedAddress?.trim() ||
      "Studio location"
    );
  }, [
    businessProfile?.fixedLocation?.formattedAddress,
    draft?.desiredLocation,
    locationMode,
    shop?.addressLabel,
    shop?.municipalityLabel,
  ]);

  const bookedDateLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    return Number.isNaN(dt.getTime())
      ? draft.selectedDateISO
      : dt.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  }, [draft?.selectedDateISO]);

  const bookedTimeLabel = draft?.selectedTime ?? "";

  const headerName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim() ||
    user?.email ||
    "";

  const policySections = businessProfile?.policySections ?? [];

  const prepaidAmount = React.useMemo(() => {
    const total = draft?.total ?? 0;
    return (
      Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) /
      100
    );
  }, [draft?.total, prepaymentPercent]);

  const cancellationSettlement = React.useMemo(
    () =>
      settleCancellationFee({
        bookingTotal: draft?.total ?? 0,
        feePercent: Number(businessProfile?.cancellationFeePercent) || 0,
        prepaidPaid: isPrepaymentPaid ? prepaidAmount : 0,
      }),
    [
      businessProfile?.cancellationFeePercent,
      draft?.total,
      isPrepaymentPaid,
      prepaidAmount,
    ],
  );

  const clearActiveBookingSessionLocal = React.useCallback(() => {
    clearActiveBookingSession();
  }, []);

  const handleKeepBookingFromFeeDialog = () => {
    setCancelFeeDialogOpen(false);
    setPendingCancelReason("");
  };

  const finalizeBookingCancellation = React.useCallback(
    async (settlementRefundAmount: number) => {
      const reasonKey = bookingRef || apiBookingId || "";
      if (pendingCancelReason && reasonKey) {
        setBookingCancellationReason(reasonKey, pendingCancelReason);
      }

      // Drop any pending/incoming EBR so client UI and professional calendar stay in sync.
      if (bookingRef) {
        clearBookingEditRequest(bookingRef);
        editRequest.refresh();
      }

      if (!apiBookingId) {
        clearActiveBookingSessionLocal();
        showSnackbar({ severity: "success", message: "Booking cancelled" });
        setCancelFeeDialogOpen(false);
        setCancelFeeStripeOpen(false);
        setPendingCancelReason("");
        router.push(`/clients/booking?tab=${listTab}`);
        return;
      }

      const clearedNotes = clearEbrSuggestionsFromNotes(activeBooking?.notes, {
        cancellationReason: pendingCancelReason.trim() || undefined,
      });

      await updateMyBooking({
        id: apiBookingId,
        status: "cancelled",
        notes: clearedNotes,
      }).unwrap();

      const session = getActiveBookingSession();
      if (session) {
        setActiveBookingSession({
          ...session,
          status: "cancelled",
          notes: clearedNotes,
          incomingEditRequest: null,
        });
      }

      if (settlementRefundAmount > 0) {
        try {
          const res = await fetch("/api/stripe/refund-prepayment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingRef,
              amount: settlementRefundAmount,
            }),
          });
          const data = (await res.json()) as {
            error?: string;
            amount?: number;
          };
          if (!res.ok) {
            showSnackbar({
              severity: "warning",
              message:
                data.error ??
                `Booking cancelled. Refund of €${settlementRefundAmount.toFixed(2)} could not be processed automatically.`,
            });
          } else {
            showSnackbar({
              severity: "success",
              message: `Booking cancelled. €${(data.amount ?? settlementRefundAmount).toFixed(2)} refunded to you.`,
            });
          }
        } catch {
          showSnackbar({
            severity: "warning",
            message: `Booking cancelled. Refund of €${settlementRefundAmount.toFixed(2)} could not be processed automatically.`,
          });
        }
      } else {
        showSnackbar({ severity: "success", message: "Booking cancelled" });
      }

      void syncFinanceFromBooking({
        bookingRef,
        paymentPhase: "full",
        paymentMethod: checkoutPaymentMethodApiValue(selectedPaymentMethod),
        status: "Voided",
      });

      await refreshActiveBooking();
      editRequest.refresh();
      setEbrAction(null);
      setCancelFeeDialogOpen(false);
      setCancelFeeStripeOpen(false);
      setPendingCancelReason("");
    },
    [
      activeBooking?.notes,
      apiBookingId,
      bookingRef,
      clearActiveBookingSessionLocal,
      editRequest,
      listTab,
      pendingCancelReason,
      refreshActiveBooking,
      router,
      selectedPaymentMethod,
      showSnackbar,
      syncFinanceFromBooking,
      updateMyBooking,
    ],
  );

  const handlePayCancellationFee = React.useCallback(async () => {
    setIsCancelProcessing(true);
    try {
      // Stripe minimum charge is €0.50 — tiny remainders are absorbed on cancel.
      if (cancellationSettlement.amountDueNow >= 0.5) {
        setCancelFeeDialogOpen(false);
        setCancelFeeStripeOpen(true);
        return;
      }
      await finalizeBookingCancellation(cancellationSettlement.refundAmount);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to cancel booking."),
      });
    } finally {
      setIsCancelProcessing(false);
    }
  }, [cancellationSettlement, finalizeBookingCancellation, showSnackbar]);

  const handleConfirmCancelBooking = React.useCallback(
    (reason: string) => {
      setPendingCancelReason(reason);
      setCancelDialogOpen(false);
      // Unpaid booking requests — no cancellation fee / prepayment charges.
      if (bookingStatus === "requested" && !isPrepaymentPaid) {
        void (async () => {
          setIsCancelProcessing(true);
          try {
            await finalizeBookingCancellation(0);
          } catch (error) {
            showSnackbar({
              severity: "error",
              message: getApiErrorMessage(error, "Unable to cancel booking."),
            });
          } finally {
            setIsCancelProcessing(false);
          }
        })();
        return;
      }
      setCancelFeeDialogOpen(true);
    },
    [
      bookingStatus,
      finalizeBookingCancellation,
      isPrepaymentPaid,
      showSnackbar,
    ],
  );

  const handleCancellationFeeStripeSuccess = React.useCallback(async () => {
    setIsCancelProcessing(true);
    try {
      await finalizeBookingCancellation(cancellationSettlement.refundAmount);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to cancel booking after payment.",
        ),
      });
    } finally {
      setIsCancelProcessing(false);
    }
  }, [
    cancellationSettlement.refundAmount,
    finalizeBookingCancellation,
    showSnackbar,
  ]);

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
      await updateMyBooking({ id: apiBookingId, status: "invalid" }).unwrap();
      clearActiveBookingSessionLocal();
      showSnackbar({
        severity: "success",
        message: "Booking request discarded",
      });
      router.push(`/clients/booking?tab=${listTab}`);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to discard booking request.",
        ),
      });
    }
  };

  const professionalBusinessOverride = React.useMemo(() => {
    const fixed = businessProfile?.fixedLocation;
    return {
      legalName:
        fixed?.salonName ??
        businessProfile?.shopName ??
        shop?.shopName ??
        professional.name,
      address:
        shop?.addressLabel?.trim() ||
        shop?.municipalityLabel?.trim() ||
        fixed?.formattedAddress?.trim() ||
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
  }, [
    bookingRef,
    draft,
    financeSettings,
    prepaymentState,
    prepaidAmount,
    requesterName,
    user?.email,
  ]);

  const submitDraftBookingRequest =
    React.useCallback(async (): Promise<boolean> => {
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
    }, [
      activeBooking,
      bookingSetup,
      createBooking,
      isDraft,
      locationMode,
      refreshActiveBooking,
      showSnackbar,
    ]);

  const completePrepayment = React.useCallback(async () => {
    const submitted = await submitDraftBookingRequest();
    if (!submitted) return;

    const sessionRecord = getActiveBookingSession();
    const bookingId =
      sessionRecord?.apiBookingId ??
      (sessionRecord?.id && !String(sessionRecord.id).startsWith("bk_draft_")
        ? sessionRecord.id
        : null) ??
      apiBookingId;
    if (!bookingId || String(bookingId).startsWith("bk_draft_")) {
      showSnackbar({
        severity: "error",
        message: "Booking not found on server.",
      });
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
        status: selectedPaymentMethod.includes("Invoice")
          ? "Payment due"
          : "Prepaid",
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
  }, [
    completePrepayment,
    prepaidAmount,
    selectedPaymentMethod,
    showSnackbar,
    submitDraftBookingRequest,
  ]);

  const handleSendBookingRequest = React.useCallback(async () => {
    if (isDraft) {
      const submitted = await submitDraftBookingRequest();
      if (!submitted) return;
      showSnackbar({ severity: "success", message: "Booking request sent" });
      return;
    }

    if (bookingStatus !== "confirmed" || !apiBookingId) {
      showSnackbar({
        severity: "error",
        message: "Unable to send booking request.",
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await updateMyBooking({ id: apiBookingId, status: "requested" }).unwrap();
      const session = getActiveBookingSession();
      if (session) {
        const resolved = resolveCreateBookingStatus({ locationMode });
        setActiveBookingSession({
          ...session,
          status: resolved.status,
          bookingRequestSent: true,
          ...(resolved.bookingRequestDirection
            ? { bookingRequestDirection: resolved.bookingRequestDirection }
            : {}),
        });
      }
      await refreshActiveBooking();
      showSnackbar({ severity: "success", message: "Booking request sent" });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to send booking request."),
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [
    apiBookingId,
    bookingStatus,
    isDraft,
    locationMode,
    refreshActiveBooking,
    showSnackbar,
    submitDraftBookingRequest,
    updateMyBooking,
  ]);

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

  const payNowLabel = checkoutPaymentMethodSupportsPayNow(selectedPaymentMethod)
    ? "Pay Now"
    : "Request Invoice";

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
    async (mode: "accept_suggested" | "acknowledge_rejected" | "accept_br") => {
      if (mode === "accept_suggested") {
        clientAcceptSuggestedChanges(bookingRef);
      } else if (mode === "acknowledge_rejected") {
        clientAcknowledgeRejectedEdit(bookingRef);
      }

      const prepayPct =
        Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
      const alreadyPaid = Boolean(activeBooking?.prepaid) || isPrepaymentPaid;
      const shouldRequirePrepay =
        mode === "accept_br" && prepayPct > 0 && !alreadyPaid;

      if (apiBookingId) {
        try {
          await updateMyBooking({
            id: apiBookingId,
            status: "confirmed",
            ...(shouldRequirePrepay
              ? { prepayment_status: "required" as const }
              : {}),
          }).unwrap();
          await refreshActiveBooking();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              mode === "accept_br"
                ? "Unable to accept booking request."
                : "Unable to confirm booking changes.",
            ),
          });
          return;
        }
      }

      editRequest.refresh();
      setActiveDocument(null);
      setStripeDialogOpen(false);

      showSnackbar({
        severity: "success",
        message:
          mode === "accept_br"
            ? "Booking request accepted."
            : mode === "accept_suggested"
              ? "Changes accepted. Your booking is confirmed."
              : "Booking details updated.",
      });

      if (mode === "accept_br" && shouldRequirePrepay) {
        router.push(`/clients/booking/checkout/prepaid?tab=${listTab}`);
        return;
      }

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      activeBooking?.prepaid,
      activeBooking?.prepaymentPercent,
      activeBooking?.requiresPrepayment,
      apiBookingId,
      bookingRef,
      editRequest,
      isPrepaymentPaid,
      listTab,
      prepaymentPercent,
      refreshActiveBooking,
      router,
      showSnackbar,
      updateMyBooking,
    ],
  );

  const handleConfirmEbrAccept = React.useCallback(async () => {
    if (isIncomingConfirmedEr) {
      if (!apiBookingId || !bookingRef) return;
      try {
        const result = await manageBookingEditRequest({
          id: apiBookingId,
          action: "accept",
        }).unwrap();
        syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
        await refreshActiveBooking();
        editRequest.refresh();
        showSnackbar({
          severity: "success",
          message: "Edit request accepted.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to accept edit request.",
          ),
        });
      }
      return;
    }
    void returnToBookingDetailsStart(
      isIncomingBr ? "accept_br" : "accept_suggested",
    );
  }, [
    apiBookingId,
    bookingRef,
    editRequest,
    isIncomingBr,
    isIncomingConfirmedEr,
    manageBookingEditRequest,
    refreshActiveBooking,
    returnToBookingDetailsStart,
    showSnackbar,
  ]);

  const handleConfirmEbrReject = React.useCallback(async () => {
    if (!bookingRef) return;

    if (isIncomingConfirmedEr) {
      if (!apiBookingId) return;
      try {
        const result = await manageBookingEditRequest({
          id: apiBookingId,
          action: "reject",
        }).unwrap();
        syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
        await refreshActiveBooking();
        editRequest.refresh();
        showSnackbar({
          severity: "success",
          message: "Edit request rejected. Booking stays confirmed.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to reject edit request.",
          ),
        });
      }
      return;
    }

    if (!isIncomingBr) {
      clientRejectSuggestedChanges(bookingRef);
    }
    if (apiBookingId) {
      try {
        const clearedNotes = clearEbrSuggestionsFromNotes(activeBooking?.notes);
        await updateMyBooking({
          id: apiBookingId,
          status: "invalid",
          notes: clearedNotes,
        }).unwrap();
        await refreshActiveBooking();
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            isIncomingBr
              ? "Unable to reject booking request."
              : "Unable to reject edited booking request.",
          ),
        });
        return;
      }
    }
    clearBookingEditRequest(bookingRef);
    editRequest.refresh();
    showSnackbar({
      severity: "success",
      message: isIncomingBr
        ? "Booking request rejected."
        : "Edited booking request rejected.",
    });
  }, [
    activeBooking?.notes,
    apiBookingId,
    bookingRef,
    editRequest,
    isIncomingBr,
    isIncomingConfirmedEr,
    manageBookingEditRequest,
    refreshActiveBooking,
    showSnackbar,
    updateMyBooking,
  ]);

  const handleConfirmEbrSuggest = React.useCallback(async () => {
    setEbrAction(null);
    setEbrSuggestDrawerOpen(true);
  }, []);

  const handleAcknowledgeRejected = React.useCallback(() => {
    returnToBookingDetailsStart("acknowledge_rejected");
  }, [returnToBookingDetailsStart]);

  /** Professional rejected client's post-confirm EBR — keep confirmed booking + show rejected note. */
  const isClientChangeRejected =
    editRequest.isRejected &&
    bookingStatus === "confirmed" &&
    Boolean(
      editRequest.suggestedServices?.length ||
      editRequest.suggestedDateISO ||
      activeBooking?.incomingEditRequest?.status === "rejected",
    );

  const isClientChangeAccepted =
    (editRequest.isAccepted ||
      activeBooking?.incomingEditRequest?.status === "accepted") &&
    bookingStatus === "confirmed";

  /** ER rejection acknowledgment panel — not used after client-EBR reject (booking stays confirmed). */
  const showRejectedResponsePanel =
    editRequest.isRejected && !isCancelled && !isClientChangeRejected;

  const outcomeSource = React.useMemo(() => {
    const incoming = activeBooking?.incomingEditRequest;
    if (incoming?.status === "rejected" || incoming?.status === "accepted")
      return incoming;
    if (editRequest.status === "rejected" || editRequest.status === "accepted")
      return editRequest;
    return null;
  }, [activeBooking?.incomingEditRequest, editRequest]);

  const rejectedChangesNote = React.useMemo(() => {
    if (!isClientChangeRejected || !outcomeSource) return null;
    return buildClientEbrOutcomeNote({
      suggestedDateISO:
        outcomeSource.suggestedDateISO || editRequest.suggestedDateISO,
      suggestedTime: outcomeSource.suggestedTime || editRequest.suggestedTime,
      suggestedServices:
        outcomeSource.suggestedServices || editRequest.suggestedServices,
      suggestedProducts:
        outcomeSource.suggestedProducts || editRequest.suggestedProducts,
      editedServiceIds:
        outcomeSource.editedServiceIds || editRequest.editedServiceIds,
      editedProductIds:
        outcomeSource.editedProductIds || editRequest.editedProductIds,
      originalDateISO: outcomeSource.originalDateISO || draft?.selectedDateISO,
      originalTime: outcomeSource.originalTime || draft?.selectedTime,
      originalServices: draft?.services,
    });
  }, [
    draft?.selectedDateISO,
    draft?.selectedTime,
    draft?.services,
    editRequest,
    isClientChangeRejected,
    outcomeSource,
  ]);

  const acceptedChangesNote = React.useMemo(() => {
    if (
      !isClientChangeAccepted ||
      !outcomeSource ||
      outcomeSource.status !== "accepted"
    )
      return null;
    return buildClientEbrOutcomeNote({
      suggestedDateISO:
        outcomeSource.suggestedDateISO || editRequest.suggestedDateISO,
      suggestedTime: outcomeSource.suggestedTime || editRequest.suggestedTime,
      suggestedServices:
        outcomeSource.suggestedServices || editRequest.suggestedServices,
      suggestedProducts:
        outcomeSource.suggestedProducts || editRequest.suggestedProducts,
      editedServiceIds:
        outcomeSource.editedServiceIds || editRequest.editedServiceIds,
      editedProductIds:
        outcomeSource.editedProductIds || editRequest.editedProductIds,
      originalDateISO: outcomeSource.originalDateISO,
      originalTime: outcomeSource.originalTime,
      originalServices: [],
    });
  }, [editRequest, isClientChangeAccepted, outcomeSource]);

  const displayDraft = React.useMemo(() => {
    if (!draft) return null;

    // After Save & return the session draft already has the client's edited services — prefer it.
    const suggested = editRequest.suggestedServices;
    const sessionDiffersFromSuggested =
      Boolean(suggested?.length) &&
      (draft.services.length !== suggested!.length ||
        draft.services.some((service) => {
          const match = suggested!.find((row) => row.id === service.id);
          return (
            !match ||
            match.name !== service.name ||
            match.price !== service.price ||
            match.durationMins !== service.durationMins
          );
        }));

    if (sessionDiffersFromSuggested) return draft;

    const useSuggested =
      (editRequest.isSuggested || editRequest.isPending) &&
      Boolean(suggested?.length);
    if (!useSuggested || !suggested?.length) return draft;

    const teamMembers = [...(draft.teamMembers ?? [])];
    for (const service of suggested) {
      if (!service.teamMemberId || !service.teamMemberName) continue;
      if (teamMembers.some((member) => member.id === service.teamMemberId))
        continue;
      teamMembers.push({
        id: service.teamMemberId,
        name: service.teamMemberName,
      });
    }

    const services = suggested.map((service) => {
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
    const productTotal = (editRequest.suggestedProducts ?? []).reduce(
      (sum, product) => sum + product.price,
      0,
    );
    const serviceTotal = services.reduce(
      (sum, service) => sum + service.price,
      0,
    );

    return {
      ...draft,
      // Preserve people + projectDetails via spread — EBR only updates service lines/totals.
      services,
      teamMembers,
      total: serviceTotal + productTotal,
    };
  }, [
    draft,
    editRequest.isPending,
    editRequest.isSuggested,
    editRequest.suggestedProducts,
    editRequest.suggestedServices,
  ]);

  const persistClientEbrSuggestion = React.useCallback(
    async (note: string, editedServiceIdsOverride?: string[]) => {
      if (!bookingRef) return;
      // Prefer the live session draft (includes services added in the editor).
      const sessionRecord = getActiveBookingSession();
      const sessionDraft = sessionRecord?.draft;
      const servicesSource =
        sessionDraft?.services ??
        displayDraft?.services ??
        draft?.services ??
        [];
      const services = servicesSource.map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        staffResourceId: service.teamMemberId ?? undefined,
        guestId: service.guestId ?? null,
        teamMemberId: service.teamMemberId ?? null,
      }));
      const total =
        sessionDraft?.total ??
        displayDraft?.total ??
        draft?.total ??
        services.reduce((sum, service) => sum + service.price, 0);
      const editedServiceIds = editedServiceIdsOverride?.length
        ? editedServiceIdsOverride
        : (editRequest.editedServiceIds ?? []);
      const dateLabel = sessionDraft?.selectedDateISO || "";
      const timeLabel = sessionDraft?.selectedTime || "";
      const durationMins = services.reduce(
        (sum, service) => sum + (service.durationMins || 0),
        0,
      );
      const startMinutes =
        dateLabel && timeLabel ? parseTimeLabelToMinutes(timeLabel) : null;
      const suggestedStart =
        startMinutes != null
          ? `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`
          : undefined;
      const endMinutes =
        startMinutes != null ? startMinutes + Math.max(durationMins, 15) : null;
      const suggestedEnd =
        endMinutes != null
          ? `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
          : undefined;

      // Schedule/project diffs are shown via suggested* meta + Edited tag on schedule row.
      // Service-line Edited tags come from editedServiceIdsOverride / service field diffs only.

      const humanNote = note.trim();

      let baselineSchedule = { dateISO: "", time: "" };
      if (typeof window !== "undefined") {
        try {
          const raw = window.sessionStorage.getItem(
            "mollure:ebr_baseline_schedule",
          );
          if (raw) {
            const parsed = JSON.parse(raw) as {
              dateISO?: string;
              time?: string;
            };
            baselineSchedule = {
              dateISO: parsed.dateISO ?? "",
              time: parsed.time ?? "",
            };
          }
        } catch {
          // ignore
        }
      }

      // Keep people/services/project snapshot so Desired Edit can rehydrate models/guests.
      const priorNotes = parseCalendarEntryNotes(
        sessionRecord?.notes ?? activeBooking?.notes,
      );
      const clientSnapshot = {
        people: (
          sessionDraft?.people ??
          draft?.people ??
          priorNotes?.clientSnapshot?.people ??
          []
        ).map((p) => ({
          id: p.id,
          name: p.name,
          isRequester: Boolean(p.isRequester),
          participantType: p.participantType,
          planningActivity: p.planningActivity,
          planningDuration: p.planningDuration,
          planningIsLocked: p.planningIsLocked,
        })),
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          durationMins: s.durationMins,
          guestId: s.guestId ?? null,
          teamMemberId: s.teamMemberId ?? null,
        })),
        projectDetails: sessionDraft?.projectDetails
          ? {
              description: sessionDraft.projectDetails.description ?? "",
              uploads: (sessionDraft.projectDetails.uploads ?? []).map((u) => ({
                id: u.id,
                name: u.name,
                previewUrl: u.previewUrl,
              })),
            }
          : priorNotes?.clientSnapshot?.projectDetails,
        teamMembers:
          sessionDraft?.teamMembers ??
          draft?.teamMembers ??
          priorNotes?.clientSnapshot?.teamMembers ??
          [],
      };

      const persistedNotes = serializeCalendarEntryNotes(
        humanNote,
        {
          showInternalNote:
            Boolean(priorNotes?.showInternalNote) || Boolean(humanNote.trim()),
          showLateRescheduling: priorNotes?.showLateRescheduling,
          lateRescheduleFeePercent: priorNotes?.lateRescheduleFeePercent,
          showLateCancellation: priorNotes?.showLateCancellation,
          lateCancellationFeePercent: priorNotes?.lateCancellationFeePercent,
          showPrepayment: priorNotes?.showPrepayment,
          prepaymentPercent: priorNotes?.prepaymentPercent,
          paymentMethod: priorNotes?.paymentMethod,
          showKilometerAllowance: priorNotes?.showKilometerAllowance,
          kilometerAllowance: priorNotes?.kilometerAllowance,
          cancellationReason: priorNotes?.cancellationReason,
          requestDirection: "incoming",
          clientSnapshot,
        },
        {
          status: "pending",
          suggestedAt: new Date().toISOString(),
          clientNote: note.trim() || undefined,
          professionalNote: editRequest.professionalNote,
          editedServiceIds: [...new Set(editedServiceIds)],
          clientEditedServiceIds: [...new Set(editedServiceIds)],
          editedProductIds: editRequest.editedProductIds,
          suggestedServices: services,
          suggestedProducts: editRequest.suggestedProducts?.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            unitPrice: product.price,
          })),
          suggestedDateISO: dateLabel || undefined,
          suggestedTime: timeLabel || undefined,
          suggestedStart,
          suggestedEnd,
          ...(baselineSchedule.dateISO || baselineSchedule.time
            ? {
                originalDateISO: baselineSchedule.dateISO || undefined,
                originalTime: baselineSchedule.time || undefined,
              }
            : {}),
          suggestedTotalPrice: total,
          suggestedProjectDetails: sessionDraft?.projectDetails
            ? {
                description: sessionDraft.projectDetails.description ?? "",
                uploads: sessionDraft.projectDetails.uploads ?? [],
              }
            : undefined,
          responseStatus: "suggestion_for_change",
          requestDirection: "incoming",
          lastEditedBy: "client",
        },
      );

      clientSuggestEbrChanges(bookingRef, {
        clientNote: note,
        editedServiceIds: [...new Set(editedServiceIds)],
        editedProductIds: editRequest.editedProductIds,
        suggestedServices: services.map((service) => ({
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: service.price,
          teamMemberId: service.teamMemberId,
          guestId: service.guestId,
        })),
        suggestedProducts: editRequest.suggestedProducts,
      });
      if (apiBookingId) {
        // Keep original booking_date / start / end / total until the professional Accepts.
        await updateMyBooking({
          id: apiBookingId,
          status: "requested",
          notes: persistedNotes,
        }).unwrap();

        const resolved = resolveCreateBookingStatus({ locationMode });
        if (sessionRecord) {
          setActiveBookingSession({
            ...sessionRecord,
            status: resolved.status,
            bookingRequestSent: true,
            notes: persistedNotes,
            ...(resolved.bookingRequestDirection
              ? { bookingRequestDirection: resolved.bookingRequestDirection }
              : {}),
            draft: sessionDraft ?? sessionRecord.draft,
          });
        }
        await refreshActiveBooking();
      }
      editRequest.refresh();
      showSnackbar({
        severity: "success",
        message: "EBR sent to the professional.",
      });
    },
    [
      activeBooking?.notes,
      apiBookingId,
      bookingRef,
      displayDraft?.services,
      displayDraft?.total,
      draft?.people,
      draft?.projectDetails?.description,
      draft?.selectedDateISO,
      draft?.selectedTime,
      draft?.services,
      draft?.teamMembers,
      draft?.total,
      editRequest,
      locationMode,
      refreshActiveBooking,
      showSnackbar,
      updateMyBooking,
    ],
  );

  const handleEbrSuggestEditServices = React.useCallback(
    (note: string) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("mollure:ebr_suggest_note", note);
      }
      setEbrSuggestDrawerOpen(false);
      if (activeBooking) {
        setActiveBookingSession(enrichClientBookingRecord(activeBooking));
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mollure:ebr_baseline_schedule",
            JSON.stringify({
              dateISO: activeBooking.draft?.selectedDateISO ?? "",
              time: activeBooking.draft?.selectedTime ?? "",
            }),
          );
        }
      }
      clearPublicProfileBookingSelection();
      router.push("/clients/booking?mode=create&ebrSuggest=1&ebrFocus=services");
    },
    [activeBooking, router],
  );

  const handleEbrSuggestSend = React.useCallback(
    async (note: string) => {
      try {
        await persistClientEbrSuggestion(note);
        setEbrSuggestDrawerOpen(false);
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to send suggested changes.",
          ),
        });
      }
    },
    [persistClientEbrSuggestion, showSnackbar],
  );

  /** After Confirmed ER Accept: apply client edits directly (one save), then clear grant. */
  const persistConfirmedGrantEdit = React.useCallback(async () => {
    if (!bookingRef || !apiBookingId) return;
    const sessionRecord = getActiveBookingSession();
    const sessionDraft = sessionRecord?.draft;
    if (!sessionDraft?.selectedDateISO) {
      showSnackbar({
        severity: "error",
        message: "Booking date is missing.",
      });
      return;
    }

    const services = sessionDraft.services ?? [];
    const durationMins = services.reduce(
      (sum, service) => sum + (service.durationMins || 0),
      0,
    );
    const startMinutes = parseTimeLabelToMinutes(
      sessionDraft.selectedTime ?? "12:00 AM",
    );
    const endMinutes = startMinutes + Math.max(durationMins, 15);
    const priorNotes = parseCalendarEntryNotes(
      sessionRecord?.notes ?? activeBooking?.notes,
    );
    const clientSnapshot = {
      people: (sessionDraft.people ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        isRequester: Boolean(p.isRequester),
        participantType: p.participantType,
        planningActivity: p.planningActivity,
        planningDuration: p.planningDuration,
        planningIsLocked: p.planningIsLocked,
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        durationMins: s.durationMins,
        guestId: s.guestId ?? null,
        teamMemberId: s.teamMemberId ?? null,
      })),
      projectDetails: sessionDraft.projectDetails
        ? {
            description: sessionDraft.projectDetails.description ?? "",
            uploads: (sessionDraft.projectDetails.uploads ?? []).map((u) => ({
              id: u.id,
              name: u.name,
              previewUrl: u.previewUrl,
            })),
          }
        : priorNotes?.clientSnapshot?.projectDetails,
      teamMembers: sessionDraft.teamMembers ?? [],
    };
    const nextNotes = serializeCalendarEntryNotes(
      priorNotes?.internalNote ?? "",
      {
        ...priorNotes,
        clientSnapshot,
        lastEditedBy: "client",
        requestDirection: priorNotes?.requestDirection,
      },
      null,
      null,
    );

    await updateMyBooking({
      id: apiBookingId,
      status: "confirmed",
      notes: nextNotes,
      total_price: sessionDraft.total,
      booking_date: sessionDraft.selectedDateISO,
      start_time: buildWallClockDateTimeIso(
        sessionDraft.selectedDateISO,
        startMinutes,
      ),
      end_time: buildWallClockDateTimeIso(
        sessionDraft.selectedDateISO,
        endMinutes,
      ),
    }).unwrap();

    consumeConfirmedEditGrant(bookingRef);
    if (sessionRecord) {
      setActiveBookingSession({
        ...sessionRecord,
        status: "confirmed",
        notes: nextNotes,
        draft: sessionDraft,
      });
    }
    await refreshActiveBooking();
    editRequest.refresh();
    showSnackbar({
      severity: "success",
      message: "Booking updated.",
    });
  }, [
    activeBooking?.notes,
    apiBookingId,
    bookingRef,
    editRequest,
    refreshActiveBooking,
    showSnackbar,
    updateMyBooking,
  ]);

  React.useEffect(() => {
    if (!pendingEbrSuggestSend || !bookingRef) return;
    const { note, editedIds } = pendingEbrSuggestSend;
    setPendingEbrSuggestSend(null);
    void (async () => {
      try {
        if (editRequest.isEditGrantActive) {
          await persistConfirmedGrantEdit();
          return;
        }
        await persistClientEbrSuggestion(note, editedIds);
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            editRequest.isEditGrantActive
              ? "Unable to update booking."
              : "Unable to send EBR to the professional.",
          ),
        });
      }
    })();
  }, [
    bookingRef,
    editRequest.isEditGrantActive,
    pendingEbrSuggestSend,
    persistClientEbrSuggestion,
    persistConfirmedGrantEdit,
    showSnackbar,
  ]);

  const openConfirmedEbrEditor = React.useCallback(
    (focus: "datetime" | "services" | "project") => {
      if (activeBooking) {
        // Enrich from local draft snapshot so Desired Model/Planning/Project data survives reopen.
        setActiveBookingSession(enrichClientBookingRecord(activeBooking));
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mollure:ebr_baseline_schedule",
            JSON.stringify({
              dateISO: activeBooking.draft?.selectedDateISO ?? "",
              time: activeBooking.draft?.selectedTime ?? "",
            }),
          );
        }
      }
      // Prevent leftover public-profile catalog from wiping the booking draft on Edit.
      clearPublicProfileBookingSelection();
      router.push(
        `/clients/booking?mode=create&ebrSuggest=1&ebrFocus=${focus}`,
      );
    },
    [activeBooking, router],
  );

  const detailsContentKey = `${bookingRef}-${editRequest.status ?? "none"}-${bookingStatus}`;
  const isFullyCompleted =
    isCompleted && activeBooking?.paid === true && !isPaymentDue;
  const pageBackground = isFullyCompleted ? "#EAECF0" : m.pageBg;
  const displayTotal = displayDraft?.total ?? draft?.total ?? 0;
  const displayPrepaidAmount =
    Math.round(
      ((displayTotal * prepaymentPercent) / 100 + Number.EPSILON) * 100,
    ) / 100;
  const bookingNotesMeta = React.useMemo(
    () => parseCalendarEntryNotes(activeBooking?.notes),
    [activeBooking?.notes],
  );
  /**
   * Client UI: Edited tags only for professional-originated line changes.
   * Hide when the client last edited (own pending/returned suggestion).
   */
  const clientVisibleEditedServiceIds = React.useMemo(() => {
    if (bookingNotesMeta?.lastEditedBy === "client") return undefined;
    if (editRequest.isPending) return undefined;
    if (isEbrIncoming) {
      return editRequest.editedServiceIds ?? activeBooking?.editedServiceIds;
    }
    if (bookingNotesMeta?.lastEditedBy === "professional") {
      return activeBooking?.editedServiceIds ?? editRequest.editedServiceIds;
    }
    // Legacy / confirmed booking pro updates without lastEditedBy
    if (!editRequest.isRejected && !editRequest.isAccepted) {
      return activeBooking?.editedServiceIds;
    }
    return undefined;
  }, [
    activeBooking?.editedServiceIds,
    bookingNotesMeta?.lastEditedBy,
    editRequest.editedServiceIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isRejected,
    isEbrIncoming,
  ]);
  const clientVisibleEditedProductIds = React.useMemo(() => {
    if (bookingNotesMeta?.lastEditedBy === "client") return undefined;
    if (editRequest.isPending) return undefined;
    if (isEbrIncoming) {
      return editRequest.editedProductIds ?? activeBooking?.editedProductIds;
    }
    if (bookingNotesMeta?.lastEditedBy === "professional") {
      return activeBooking?.editedProductIds ?? editRequest.editedProductIds;
    }
    if (!editRequest.isRejected && !editRequest.isAccepted) {
      return activeBooking?.editedProductIds;
    }
    return undefined;
  }, [
    activeBooking?.editedProductIds,
    bookingNotesMeta?.lastEditedBy,
    editRequest.editedProductIds,
    editRequest.isAccepted,
    editRequest.isPending,
    editRequest.isRejected,
    isEbrIncoming,
  ]);
  const kilometerAllowanceAmount = React.useMemo(
    () => resolveKilometerAllowanceAmount(bookingNotesMeta?.kilometerAllowance),
    [bookingNotesMeta?.kilometerAllowance],
  );
  /** Only for desired-location bookings when a kilometer amount was set. */
  const showKilometerAllowance =
    locationMode === "desired" && kilometerAllowanceAmount > 0;
  /** Prepayment breakdown only when pro set % > 0 (hide at 0%). */
  const effectivePrepayPercent =
    Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
  const paymentCardPrepaymentState =
    effectivePrepayPercent > 0 && !isCancelled && !isIncomingBr
      ? prepaymentState
      : ("none" as const);

  const paymentSummarySections = React.useMemo(
    () =>
      buildClientBookingPaymentSummary({
        draft: displayDraft ?? draft,
        requesterName,
        prepaid: isPrepaymentPaid,
        paid: activeBooking?.paid === true,
        requiresPrepayment: Boolean(
          activeBooking?.requiresPrepayment ?? requiresPrepayment,
        ),
        prepaymentPercent:
          activeBooking?.prepaymentPercent ?? prepaymentPercent,
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
      return paymentSummarySections.filter(
        (section) => section.title === "Prepayment",
      );
    }
    return paymentSummarySections;
  }, [isCompleted, isPaymentDue, isPrepaymentPaid, paymentSummarySections]);

  const showPaymentSummary =
    visiblePaymentSummarySections.length > 0 &&
    (prepaymentState === "paid" || isCompleted || isPaymentDue);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBackground }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={headerName}
        homeHref="/"
      />

      <ClientPageTabsBar activeLabel="Booking" />
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 0, pt: 1 }}
      >
        <AppPillTabs
          tabs={bookingPillTabs}
          active={listTab}
          alignStart
          onChange={(tab) =>
            router.push(`/clients/booking?tab=${parseBookingListTab(tab)}`)
          }
        />
      </Container>

      <Container maxWidth="lg" sx={{ pb: 4, pt: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: isCancelled ? m.cancelledSurface : m.white,
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <ClientBookingDetailsHeader
            bookingRef={bookingRef}
            apiBookingId={activeBooking?.apiBookingId}
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
            onEditDateTime={
              bookingStatus === "confirmed"
                ? () => openConfirmedEbrEditor("datetime")
                : undefined
            }
            onEditBookingDetails={
              bookingStatus === "confirmed"
                ? () => openConfirmedEbrEditor("services")
                : undefined
            }
            onEditProject={
              bookingStatus === "confirmed" && locationMode === "desired"
                ? () => openConfirmedEbrEditor("project")
                : undefined
            }
            onSendBookingRequest={
              isDraft && !isBookingRequestSent
                ? handleSendBookingRequest
                : undefined
            }
            onDeleteBooking={() => setDeleteDialogOpen(true)}
            onDiscardBookingRequest={() => setDiscardDialogOpen(true)}
            onDispatchBookingNotification={dispatchClientBookingNotification}
            onSendConfirmedEditRequest={async (note) => {
              if (!apiBookingId || !bookingRef) {
                throw new Error("Booking id missing");
              }
              const result = await manageBookingEditRequest({
                id: apiBookingId,
                action: "send",
                note,
              }).unwrap();
              syncEditRequestFromBookingApi(
                bookingRef,
                result.data?.edit_request,
              );
              await refreshActiveBooking();
              editRequest.refresh();
            }}
            showUpdated={showStatusUpdated}
            responseOverdue={isResponseWindowOverdue({
              responseStatus: bookingNotesMeta?.responseStatus,
              responseStartedAt: bookingNotesMeta?.responseStartedAt,
              respondBy: bookingNotesMeta?.respondBy,
              responseWindowMinutes: bookingNotesMeta?.responseWindowMinutes,
            })}
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
                  editedServiceIds={clientVisibleEditedServiceIds}
                  products={editRequest.suggestedProducts}
                  editedProductIds={clientVisibleEditedProductIds}
                />
                <ClientBookingChangeResponsePanel
                  variant="rejected"
                  total={displayTotal}
                  prepaidAmount={displayPrepaidAmount}
                  prepaymentPaid={prepaymentState === "paid"}
                  onOk={handleAcknowledgeRejected}
                  onViewInvoice={
                    bookingTransactionRow ? openInvoice : undefined
                  }
                  onViewReceipt={
                    (prepaymentReceiptRow ?? bookingTransactionRow)
                      ? openReceipt
                      : undefined
                  }
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
                  rejectedChangesNote={rejectedChangesNote}
                  acceptedChangesNote={acceptedChangesNote}
                  editedServiceIds={clientVisibleEditedServiceIds}
                  products={
                    isEbrIncoming || editRequest.isPending
                      ? editRequest.suggestedProducts
                      : (displayDraft?.products ?? draft?.products)?.map(
                          (product) => ({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: product.quantity || 1,
                          }),
                        )
                  }
                  editedProductIds={clientVisibleEditedProductIds}
                  onPayNow={
                    paymentCardPrepaymentState === "required" && canActOnPayment
                      ? handlePayNow
                      : undefined
                  }
                />

                {showPaymentSummary ? (
                  <ClientBookingPaymentSummary
                    sections={visiblePaymentSummarySections}
                    onViewInvoice={
                      bookingTransactionRow ? openInvoice : undefined
                    }
                    onViewReceipt={
                      (prepaymentReceiptRow ?? bookingTransactionRow)
                        ? openReceipt
                        : undefined
                    }
                  />
                ) : null}

                {canActOnPayment && (isPrepaid || isEbrIncoming) ? (
                  <ClientBookingPaymentMethodSelector
                    options={checkoutPaymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                ) : null}

                {isIncomingConfirmedEr && editRequest.note ? (
                  <EditRequestIncomingNote
                    note={editRequest.note}
                    from="professional"
                  />
                ) : null}

                {showRequestResponseActions ? (
                  <ClientEbrResponseActions
                    onAccept={() => setEbrAction("accept")}
                    onSuggestChange={() => setEbrAction("suggest")}
                    onReject={() => setEbrAction("reject")}
                  />
                ) : null}

                {isDraft &&
                !isPrepaid &&
                !isBookingRequestSent &&
                !isEbrIncoming ? (
                  <AppButton
                    tone="primary"
                    fullWidth
                    isLoading={isSubmittingRequest}
                    onClick={handleSendBookingRequest}
                    sx={{
                      mt: 2,
                      height: 40,
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
                showCancelAction={bookingStatus === "confirmed"}
                onCancelBooking={() => setCancelDialogOpen(true)}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      <ClientBookingCancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancelBooking}
      />
      <ClientBookingCancelFeeDialog
        open={cancelFeeDialogOpen}
        onClose={handleKeepBookingFromFeeDialog}
        onKeepBooking={handleKeepBookingFromFeeDialog}
        onPayNow={() => {
          void handlePayCancellationFee();
        }}
        settlement={cancellationSettlement}
        policySections={policySections}
        policyInstruction={businessProfile?.cancellationPolicyInstruction}
        isProcessing={isCancelProcessing}
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
        context={
          isIncomingConfirmedEr ? "er" : isIncomingBr ? "br" : "ebr"
        }
        onClose={() => setEbrAction(null)}
        onConfirm={() => {
          if (ebrAction === "accept") handleConfirmEbrAccept();
          else if (ebrAction === "reject") void handleConfirmEbrReject();
          else if (ebrAction === "suggest") void handleConfirmEbrSuggest();
        }}
      />

      <ClientEbrSuggestDrawer
        open={ebrSuggestDrawerOpen}
        draft={draft}
        onClose={() => setEbrSuggestDrawerOpen(false)}
        onEditServices={handleEbrSuggestEditServices}
        onSend={handleEbrSuggestSend}
      />

      <StripePrepaymentDialog
        open={stripeDialogOpen}
        amount={prepaidAmount}
        bookingRef={bookingRef}
        onClose={() => setStripeDialogOpen(false)}
        onSuccess={completePrepayment}
      />
      <StripePrepaymentDialog
        open={cancelFeeStripeOpen}
        amount={cancellationSettlement.amountDueNow}
        bookingRef={bookingRef}
        title="Pay cancellation fee"
        subtitlePrefix="Cancellation fee for booking"
        paymentType="booking_cancellation_fee"
        onClose={() => {
          setCancelFeeStripeOpen(false);
          setCancelFeeDialogOpen(true);
        }}
        onSuccess={() => {
          void handleCancellationFeeStripeSuccess();
        }}
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
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
