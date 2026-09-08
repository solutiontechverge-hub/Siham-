"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppButton,
  AppDrawer,
  AppPillTabs,
  ClientPageTabsBar,
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
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
import { recalculateServiceStartEndTimes } from "../../../data/bookingServiceEdit.data";
import {
  clearActiveBookingSession,
  getActiveBookingSession,
  setActiveBookingSession,
  unlockEbrDraft,
} from "../../../app/clients/booking/clientBookingSession";
import { markBookingUpdateSeen } from "../calendar/bookingUpdateSeen";
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
import BookingActivityOverview from "../calendar/BookingActivityOverview";
import { buildBookingActivityTimeline } from "../calendar/buildBookingActivityTimeline";
import {
  ACTIVITY_COMPARISON_SIGNPOST,
  findActivityComparisonItem,
} from "../calendar/buildActivityComparison";
import type { BookingActivityItem } from "../calendar/bookingActivity.types";
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
import InlineTimedSnackbar from "../InlineTimedSnackbar";
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
  markClientEbrAcceptedInNotes,
} from "../calendar/bookingEventDetails";
import {
  detectEditedServiceIds,
  detectServiceLineChanges,
  detectProductLineChanges,
  isSilentSafeBookingChange,
} from "../calendar/bookingRequestNegotiation";
import { splitContactPhone } from "../../../lib/phone-validation";
import type { CalendarBookingGuestItem } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { isResponseWindowOverdue } from "../calendar/bookingResponseDeadline";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
  buildProfessionalBusinessOverride,
} from "../finance-documents";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import type { ClientBookingDraft } from "./types";
import { summarizeClientBookingPrice } from "../calendar/bookingTotal";
import {
  useCreateBookingMutation,
  useDispatchBookingNotificationMutation,
  useGetAllBusinessSetupsQuery,
  useGetBookingActivityQuery,
  useManageBookingEditRequestMutation,
  useUpdateMyBookingMutation,
} from "../../../store/services/businessApi";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
import { prepareBookingMessagingOpen } from "../messaging/openBookingMessaging";
import { useOpenMessagingForBookingMutation } from "../../../store/services/messagingApi";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useBookingRealtimeSync } from "../../../hooks/useBookingRealtimeSync";
import { useSnackbar } from "../AppSnackbar";
import StripePrepaymentDialog from "./StripePrepaymentDialog";
import ClientBookingPaymentMethodSelector from "./ClientBookingPaymentMethodSelector";
import {
  checkoutPaymentMethodApiValue,
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodSupportsPayNow,
  checkoutPaymentMethodTitle,
  isOfflinePaymentMethod,
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

function guestsFromPeopleAndServices(
  people:
    | readonly {
        id: string;
        name: string;
        isRequester?: boolean;
        participantType?: CalendarBookingGuestItem["participantType"];
      }[]
    | undefined,
  services: readonly {
    id: string;
    name: string;
    price: number;
    durationMins: number;
    startTime?: string;
    endTime?: string;
    guestId?: string | null;
    teamMemberId?: string | null;
  }[],
  fallbackGuests?: readonly CalendarBookingGuestItem[],
): CalendarBookingGuestItem[] {
  const fallbackById = new Map((fallbackGuests ?? []).map((guest) => [guest.id, guest]));
  const fromPeople = (people ?? [])
    .filter((person) => !person.isRequester)
    .map((person) => {
      const fallback = fallbackById.get(person.id);
      return {
        id: person.id,
        name: person.name,
        email: fallback?.email ?? "",
        phoneCode: fallback?.phoneCode,
        phoneNumber: fallback?.phoneNumber,
        participantType: person.participantType ?? fallback?.participantType,
        services: services.filter((service) => service.guestId === person.id),
        products: fallback?.products ?? [],
      };
    });
  if (fromPeople.length) return fromPeople;
  return [...(fallbackGuests ?? [])];
}

function usableAddressLabel(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (
    lower === "location not specified" ||
    lower === "studio location" ||
    lower === "enter visit address" ||
    lower === "service at your location"
  ) {
    return "";
  }
  return trimmed;
}

export default function ClientBookingDetailsView({
  variant,
}: {
  variant: ClientBookingDetailsVariant;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listTab: BookingListTab = parseBookingListTab(searchParams?.get("tab"));
  const ebrRespondParam = searchParams?.get("ebr");
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
  const { requesterName, requesterAvatarUrl, requesterUserType, requesterVat, requesterCoc, requesterAddress } =
    useClientRequesterProfile();

  const isPrepaid = variant === "prepaid";
  const locationMode = shop?.locationMode ?? "fixed";
  const checkoutBookingRef = useCheckoutBookingRef();
  const { record: activeBooking, apiBookings, refresh: refreshActiveBooking } =
    useActiveClientBooking();
  const bookingRef = activeBooking?.bookingRef ?? checkoutBookingRef;
  React.useEffect(() => {
    setResponseActionsDismissed(false);
    setActionFeedback(null);
  }, [bookingRef]);
  const editRequest = useBookingEditRequest(bookingRef);
  const bookingStatus: ClientBookingStatus = activeBooking?.status ?? "draft";
  const isDraft = bookingStatus === "draft";
  const isCompleted = bookingStatus === "completed";
  const isBookingRequestSent = Boolean(activeBooking?.bookingRequestSent);
  const isPaymentDue = Boolean(
    activeBooking && isClientBookingPaymentDue(activeBooking),
  );
  const storedPaymentMethod = parseCalendarEntryNotes(
    activeBooking?.notes,
  )?.paymentMethod;
  const isPrepaymentPaid =
    Boolean(activeBooking?.prepaid) &&
    !isOfflinePaymentMethod(storedPaymentMethod);
  const prepaymentState = isPrepaymentPaid
    ? ("paid" as const)
    : requiresPrepayment
      ? ("required" as const)
      : ("none" as const);
  const apiBookingId = activeBooking?.apiBookingId ?? activeBooking?.id ?? null;

  const { data: bookingActivityResponse } = useGetBookingActivityQuery(
    {
      bookingId: apiBookingId,
      bookingCode: bookingRef,
    },
    {
      skip: !apiBookingId && !bookingRef,
    },
  );

  // Activity timeline is built after bookingNotesMeta / displayDraft below.
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelFeeDialogOpen, setCancelFeeDialogOpen] = React.useState(false);
  const [cancelFeeStripeOpen, setCancelFeeStripeOpen] = React.useState(false);
  const [pendingCancelReason, setPendingCancelReason] = React.useState("");
  const [isCancelProcessing, setIsCancelProcessing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [activityDetailItem, setActivityDetailItem] =
    React.useState<BookingActivityItem | null>(null);
  const [ebrSuggestDrawerOpen, setEbrSuggestDrawerOpen] = React.useState(false);
  const [ebrAction, setEbrAction] = React.useState<ClientEbrActionKind | null>(
    null,
  );
  const [responseActionsDismissed, setResponseActionsDismissed] =
    React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const messagingWidget = useMessagingWidgetOptional();
  const isCancelled = bookingStatus === "cancelled";
  /** Accept / Suggest / Reject when professional sent an EBR (API notes). */
  const isEbrIncoming =
    activeBooking?.incomingEditRequest?.status === "suggested";
  const apiEditRequest = activeBooking?.editRequest;
  const apiErInitiatedBy =
    apiEditRequest?.initiated_by ??
    (apiEditRequest as { initiatedBy?: "client" | "professional" } | null | undefined)
      ?.initiatedBy;
  const hasApiPendingEr =
    String(apiEditRequest?.status ?? "").toLowerCase() === "pending";
  /** Professional-sent booking request awaiting client response. */
  const isIncomingBr =
    bookingStatus === "requested" &&
    activeBooking?.bookingRequestDirection === "incoming" &&
    !isEbrIncoming;
  const isIncomingConfirmedEr =
    bookingStatus === "confirmed" &&
    hasApiPendingEr &&
    apiErInitiatedBy === "professional";
  const incomingProfessionalNote = (
    isIncomingConfirmedEr
      ? apiEditRequest?.note || editRequest.note
      : isEbrIncoming
        ? activeBooking?.incomingEditRequest?.professionalNote ||
          editRequest.professionalNote
        : ""
  )?.trim();
  const showRequestResponseActions =
    !responseActionsDismissed &&
    (isEbrIncoming || isIncomingBr || isIncomingConfirmedEr);
  const { invoiceSettings: financeSettings, transactionOptions } =
    usePublicFinanceSettings(shop?.shopId);
  const [activeDocument, setActiveDocument] = React.useState<
    "invoice" | "receipt" | null
  >(null);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const pendingAcceptBrAfterPrepay = React.useRef(false);
  const [createBooking] = useCreateBookingMutation();
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const checkoutPaymentOptions = React.useMemo(
    () =>
      resolveCheckoutPaymentOptions(
        transactionOptions,
        locationMode,
        parseCalendarEntryNotes(activeBooking?.notes)?.paymentMethod,
      ),
    [activeBooking?.notes, locationMode, transactionOptions],
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState<CheckoutPaymentMethodId>("onlineDirect");
  React.useEffect(() => {
    const first = checkoutPaymentOptions[0]?.id;
    if (!first) return;
    setSelectedPaymentMethod((prev) =>
      checkoutPaymentOptions.some((option) => option.id === prev) ? prev : first,
    );
  }, [checkoutPaymentOptions]);
  const isOfflinePay = isOfflinePaymentMethod(selectedPaymentMethod);
  const canActOnPayment =
    !isCompleted &&
    !isCancelled &&
    prepaymentState === "required" &&
    !isOfflinePay;
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

  // Hydrate Confirmed ER from backend edit_request only (ignore stale notes/local cache).
  React.useEffect(() => {
    if (!bookingRef) return;
    syncEditRequestFromBookingApi(bookingRef, activeBooking?.editRequest ?? null);
    editRequest.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking?.editRequest, bookingRef]);

  // Opening the booking clears the list/calendar "Updated" tag — no approval click.
  React.useEffect(() => {
    if (!bookingRef) return;
    markBookingUpdateSeen("client", bookingRef, activeBooking?.updatedAt);
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
  const shopDisplayName = (
    shop?.shopName?.trim() ||
    businessProfile?.shopName?.trim() ||
    businessProfile?.fixedLocation?.salonName?.trim() ||
    professional.name
  );
  const professionalRole = businessProfile?.specialties?.[0]?.trim() || "";
  const professionalPhone = (
    businessProfile?.phone?.trim() ||
    bookingSetup?.phone?.trim() ||
    ""
  );

  const address = React.useMemo(() => {
    const visit = draft?.desiredLocation;
    if (locationMode === "desired" && visit) {
      const visitLabel = [
        visit.street,
        visit.number,
        visit.postalCode,
        visit.municipality,
      ]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");
      if (visitLabel) return visitLabel;
    }
    const fromProfile = usableAddressLabel(
      businessProfile?.fixedLocation?.formattedAddress,
    );
    if (fromProfile) return fromProfile;
    const fromShop = usableAddressLabel(
      shop?.addressLabel || shop?.municipalityLabel,
    );
    if (fromShop) return fromShop;
    return "";
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

  const appointmentStartMs = React.useMemo(() => {
    if (!draft?.selectedDateISO) return null;
    const iso = buildWallClockDateTimeIso(
      draft.selectedDateISO,
      parseTimeLabelToMinutes(draft.selectedTime ?? ""),
    );
    const ms = new Date(iso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [draft?.selectedDateISO, draft?.selectedTime]);

  const cancellationSettlement = React.useMemo(
    () =>
      settleCancellationFee({
        bookingTotal: draft?.total ?? 0,
        feePercent: Number(businessProfile?.cancellationFeePercent) || 0,
        prepaidPaid: isPrepaymentPaid ? prepaidAmount : 0,
        appointmentStartMs,
        noticeHours: businessProfile?.cancellationNoticeHours,
        noticeMinutes: businessProfile?.cancellationNoticeMinutes,
      }),
    [
      appointmentStartMs,
      businessProfile?.cancellationFeePercent,
      businessProfile?.cancellationNoticeHours,
      businessProfile?.cancellationNoticeMinutes,
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
      const skipFeeDialog =
        (bookingStatus === "requested" && !isPrepaymentPaid) ||
        (!cancellationSettlement.isLateCancellation &&
          cancellationSettlement.amountDueNow < 0.5 &&
          cancellationSettlement.refundAmount <= 0);
      // Unpaid requests, or cancels outside the notice window with nothing to settle.
      if (skipFeeDialog) {
        void (async () => {
          setIsCancelProcessing(true);
          try {
            await finalizeBookingCancellation(
              cancellationSettlement.refundAmount,
            );
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
      cancellationSettlement,
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
      const currentNotes = activeBooking?.notes ?? null;
      const details = {
        ...(parseCalendarEntryNotes(currentNotes) ?? {}),
        hiddenForCustomer: true,
      };
      const nextNotes = serializeCalendarEntryNotes(
        details.internalNote ?? "",
        details,
        parseStoredEbrFromNotes(currentNotes),
        parseStoredErFromNotes(currentNotes),
      );
      await updateMyBooking({ id: apiBookingId, notes: nextNotes }).unwrap();
      clearActiveBookingSessionLocal();
      showSnackbar({ severity: "success", message: "Booking removed from your list" });
      router.push("/clients/booking?tab=upcoming");
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to remove booking."),
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

  const professionalBusinessOverride = React.useMemo(
    () =>
      buildProfessionalBusinessOverride({
        listing: bookingSetup,
        shopName: shopDisplayName,
        phone: professionalPhone || businessProfile?.phone,
        address:
          businessProfile?.fixedLocation?.formattedAddress ||
          shop?.addressLabel ||
          shop?.municipalityLabel,
        vatNumber: businessProfile?.vatNumber,
        cocNumber: businessProfile?.cocNumber,
      }),
    [
      bookingSetup,
      businessProfile,
      professionalPhone,
      shop?.addressLabel,
      shop?.municipalityLabel,
      shopDisplayName,
    ],
  );

  const bookingInvoiceType =
    requesterUserType === "company" ? "company" : "individual";

  const bookingTransactionRow = React.useMemo(() => {
    if (!draft?.services?.length) return null;
    return buildClientBookingTransactionRow({
      bookingRef,
      draft,
      requesterName,
      requesterEmail: user?.email,
      financeSettings,
      methodTitle: checkoutPaymentMethodTitle(selectedPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(selectedPaymentMethod),
      prepaymentAmount:
        (requiresPrepayment || isPrepaymentPaid) && prepaidAmount > 0
          ? prepaidAmount
          : undefined,
      clientParty: {
        legalName: requesterName,
        email: user?.email,
        address: requesterAddress || undefined,
        vatNumber: requesterVat || undefined,
        cocNumber: requesterCoc || undefined,
      },
    });
  }, [
    bookingRef,
    draft,
    financeSettings,
    isPrepaymentPaid,
    prepaidAmount,
    requesterAddress,
    requesterCoc,
    requesterName,
    requesterVat,
    requiresPrepayment,
    selectedPaymentMethod,
    user?.email,
  ]);

  const prepaymentReceiptRow = React.useMemo(() => {
    if (!draft?.services?.length) return null;
    if (!isPrepaymentPaid && !isOfflinePay) return null;
    if (!(prepaidAmount > 0)) return null;
    return buildClientBookingTransactionRow({
      bookingRef: `${bookingRef}-prepay`,
      draft,
      requesterName,
      requesterEmail: user?.email,
      financeSettings,
      documentAmount: prepaidAmount,
      prepaymentAmount: prepaidAmount,
      asPrepaymentReceipt: true,
      methodTitle: checkoutPaymentMethodTitle(selectedPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(selectedPaymentMethod),
      clientParty: {
        legalName: requesterName,
        email: user?.email,
        address: requesterAddress || undefined,
        vatNumber: requesterVat || undefined,
        cocNumber: requesterCoc || undefined,
      },
    });
  }, [
    bookingRef,
    draft,
    financeSettings,
    isOfflinePay,
    isPrepaymentPaid,
    prepaidAmount,
    requesterAddress,
    requesterCoc,
    requesterName,
    requesterVat,
    selectedPaymentMethod,
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
      const confirmAfterPay =
        pendingAcceptBrAfterPrepay.current || locationMode === "fixed";
      pendingAcceptBrAfterPrepay.current = false;
      await updateMyBooking({
        id: bookingId,
        prepayment_status: "paid",
        ...(confirmAfterPay ? { status: "confirmed" as const } : {}),
      }).unwrap();

      const paidBase = sessionRecord ?? activeBooking;
      if (paidBase) {
        setActiveBookingSession({
          ...paidBase,
          prepaid: true,
          requiresPrepayment: true,
          ...(confirmAfterPay ? { status: "confirmed" as const } : {}),
        });
      }

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
    activeBooking,
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
    if (prepaidAmount <= 0) {
      showSnackbar({ severity: "error", message: "No prepayment amount due." });
      return;
    }
    await completePrepayment();
  }, [completePrepayment, prepaidAmount, showSnackbar]);

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
        mode === "accept_br" &&
        prepayPct > 0 &&
        !alreadyPaid &&
        !isOfflinePay;

      if (apiBookingId) {
        try {
          if (mode === "accept_suggested") {
            const ebr = parseStoredEbrFromNotes(activeBooking?.notes);
            const priorNotes = parseCalendarEntryNotes(activeBooking?.notes);
            const suggestedServices =
              ebr?.suggestedServices?.length
                ? ebr.suggestedServices
                : editRequest.suggestedServices?.map((service) => ({
                    id: service.id,
                    name: service.name,
                    durationMins: service.durationMins,
                    price: service.price,
                    startTime: service.startTime,
                    endTime: service.endTime,
                    guestId: service.guestId ?? null,
                    teamMemberId: service.teamMemberId ?? null,
                  }));
            const suggestedProducts =
              ebr?.suggestedProducts?.length
                ? ebr.suggestedProducts
                : editRequest.suggestedProducts?.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: product.quantity || 1,
                    unitPrice: product.price,
                  }));
            const suggestedStart = ebr?.suggestedStart;
            const suggestedEnd = ebr?.suggestedEnd;
            const suggestedDate = ebr?.suggestedDateISO;
            // Accepted schedule wins: re-sequence the lines from the new start.
            const resolvedServices =
              suggestedStart && suggestedServices?.length
                ? recalculateServiceStartEndTimes(
                    suggestedServices,
                    suggestedStart,
                  )
                : suggestedServices;
            const appliedNotes = markClientEbrAcceptedInNotes(
              activeBooking?.notes,
              {
                internalNote: priorNotes?.internalNote ?? "",
                services: resolvedServices,
                products: suggestedProducts,
                lastEditedBy: ebr?.lastEditedBy ?? "professional",
                editedServiceIds:
                  ebr?.editedServiceIds ?? editRequest.editedServiceIds,
                editedProductIds:
                  ebr?.editedProductIds ?? editRequest.editedProductIds,
                clientSnapshot: {
                  ...(priorNotes?.clientSnapshot ?? {}),
                  ...(resolvedServices?.length
                    ? {
                        services: resolvedServices.map((service) => ({
                          id: service.id,
                          name: service.name,
                          price: service.price,
                          durationMins: service.durationMins,
                          startTime: service.startTime,
                          endTime: service.endTime,
                          guestId: service.guestId ?? null,
                          teamMemberId: service.teamMemberId ?? null,
                        })),
                      }
                    : {}),
                  ...(ebr?.suggestedProjectDetails
                    ? { projectDetails: ebr.suggestedProjectDetails }
                    : {}),
                },
              },
            );
            const suggestedTotal =
              ebr?.suggestedTotalPrice ??
              (suggestedServices ?? []).reduce(
                (sum, service) => sum + (Number(service.price) || 0),
                0,
              ) +
                (suggestedProducts ?? []).reduce(
                  (sum, product) =>
                    sum + (Number(product.price) || 0) * (product.quantity || 1),
                  0,
                );
            await updateMyBooking({
              id: apiBookingId,
              status: "confirmed",
              notes: appliedNotes,
              ...(Number.isFinite(suggestedTotal) && suggestedTotal > 0
                ? { total_price: suggestedTotal }
                : {}),
              ...(suggestedDate &&
              suggestedStart &&
              suggestedEnd &&
              /^\d{2}:\d{2}$/.test(suggestedStart) &&
              /^\d{2}:\d{2}$/.test(suggestedEnd)
                ? {
                    booking_date: suggestedDate,
                    start_time: `${suggestedDate}T${suggestedStart}:00`,
                    end_time: `${suggestedDate}T${suggestedEnd}:00`,
                  }
                : {}),
              ...(shouldRequirePrepay
                ? { prepayment_status: "required" as const }
                : {}),
            }).unwrap();
          } else {
            await updateMyBooking({
              id: apiBookingId,
              status: "confirmed",
              ...(shouldRequirePrepay
                ? { prepayment_status: "required" as const }
                : {}),
            }).unwrap();
          }
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
      activeBooking?.notes,
      activeBooking?.prepaid,
      activeBooking?.prepaymentPercent,
      activeBooking?.requiresPrepayment,
      apiBookingId,
      bookingRef,
      editRequest,
      isPrepaymentPaid,
      listTab,
      isOfflinePay,
      prepaymentPercent,
      refreshActiveBooking,
      router,
      showSnackbar,
      updateMyBooking,
    ],
  );

  const handleConfirmEbrAccept = React.useCallback(async () => {
    if (isIncomingBr) {
      const prepayPct =
        Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
      const needsPrepay = prepayPct > 0 && !isPrepaymentPaid && !isOfflinePay;
      if (needsPrepay) {
        pendingAcceptBrAfterPrepay.current = true;
        setEbrAction(null);
        setResponseActionsDismissed(false);
        setActionFeedback({
          severity: "error",
          message: "Prepayment is required to accept this booking.",
        });
        void handlePayNow();
        return;
      }
    }
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
      } catch (error) {
        setResponseActionsDismissed(false);
        setActionFeedback(null);
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
    activeBooking?.prepaymentPercent,
    apiBookingId,
    bookingRef,
    editRequest,
    handlePayNow,
    isIncomingBr,
    isIncomingConfirmedEr,
    isOfflinePay,
    isPrepaymentPaid,
    manageBookingEditRequest,
    prepaymentPercent,
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
      } catch (error) {
        setResponseActionsDismissed(false);
        setActionFeedback(null);
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
        setResponseActionsDismissed(false);
        setActionFeedback(null);
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
    setEbrSuggestDrawerOpen(false);
    setResponseActionsDismissed(true);
    setActionFeedback({
      severity: "success",
      message: "You can now suggest a change.",
    });
    if (!bookingRef) return;
    try {
      const result = await openMessagingForBooking({ bookingRef }).unwrap();
      messagingWidget?.openMessaging(prepareBookingMessagingOpen(result));
    } catch (error) {
      setResponseActionsDismissed(false);
      setActionFeedback(null);
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to open chat for this booking.",
        ),
      });
    }
  }, [bookingRef, messagingWidget, openMessagingForBooking, showSnackbar]);

  const ebrRespondHandledRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ebrRespondParam || !bookingRef) return;
    const key = `${bookingRef}:${ebrRespondParam}`;
    if (ebrRespondHandledRef.current === key) return;
    ebrRespondHandledRef.current = key;

    if (ebrRespondParam === "suggest") {
      void handleConfirmEbrSuggest();
    } else if (ebrRespondParam === "accept") {
      setEbrAction("accept");
    } else if (ebrRespondParam === "reject") {
      setEbrAction("reject");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ebr");
    const nextQuery = params.toString();
    router.replace(
      nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname,
      { scroll: false },
    );
  }, [
    bookingRef,
    ebrRespondParam,
    handleConfirmEbrSuggest,
    router,
    searchParams,
  ]);

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
      selectedDateISO:
        editRequest.suggestedDateISO || draft.selectedDateISO,
      selectedTime: editRequest.suggestedTime || draft.selectedTime,
      // Preserve people + projectDetails via spread — EBR only updates service lines/totals.
      services,
      teamMembers,
      total: serviceTotal + productTotal,
    };
  }, [
    draft,
    editRequest.isPending,
    editRequest.isSuggested,
    editRequest.suggestedDateISO,
    editRequest.suggestedTime,
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
      unlockEbrDraft();
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
      unlockEbrDraft();
      showSnackbar({
        severity: "error",
        message: "Booking date is missing.",
      });
      return;
    }

    const services = sessionDraft.services ?? [];
    const products = sessionDraft.products ?? [];
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
    let cursor = startMinutes;
    const serviceLines = services.map((s) => {
      const duration = Math.max(15, s.durationMins || 15);
      const startHhmm = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      cursor += duration;
      const endHhmm = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      return {
        id: s.id,
        name: s.name,
        price: s.price,
        durationMins: s.durationMins,
        guestId: s.guestId ?? null,
        teamMemberId: s.teamMemberId ?? null,
        startTime: startHhmm,
        endTime: endHhmm,
      };
    });
    const productLines = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity || 1,
      unitPrice: product.unitPrice ?? product.price,
    }));
    const originalServices =
      priorNotes?.originalServices?.length
        ? priorNotes.originalServices
        : (priorNotes?.services ?? []);
    const lineChanges = detectServiceLineChanges(
      originalServices,
      serviceLines,
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
      services: serviceLines,
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
    const scheduleEdited =
      (sessionDraft.selectedDateISO ?? "") !==
        (activeBooking?.draft?.selectedDateISO ?? "") ||
      (sessionDraft.selectedTime ?? "") !==
        (activeBooking?.draft?.selectedTime ?? "");
    const currentPhone = splitContactPhone(
      sessionRecord?.contactPhone ?? activeBooking?.contactPhone ?? "",
      priorNotes?.phoneCode,
    );
    const comparableServiceLines = services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMins: s.durationMins,
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
    const previousGuests = guestsFromPeopleAndServices(
      priorNotes?.clientSnapshot?.people,
      priorNotes?.services ?? originalServices,
      priorNotes?.guests,
    );
    const currentGuests = guestsFromPeopleAndServices(
      sessionDraft.people,
      comparableServiceLines,
      priorNotes?.guests,
    );
    const silentSafeOnly = isSilentSafeBookingChange({
      previousServices: priorNotes?.services ?? originalServices,
      currentServices: comparableServiceLines,
      previousGuests,
      currentGuests,
      previousPhoneCode: priorNotes?.phoneCode,
      currentPhoneCode: currentPhone.countryCode,
      previousPhoneNumber: priorNotes?.phoneNumber,
      currentPhoneNumber: currentPhone.phone,
      previousProducts: priorNotes?.products ?? [],
      currentProducts: productLines,
      scheduleChanged: scheduleEdited,
    });
    const nextNotes = serializeCalendarEntryNotes(
      priorNotes?.internalNote ?? "",
      silentSafeOnly
        ? {
            ...priorNotes,
            clientSnapshot,
            services: serviceLines,
            products: productLines,
            guests: currentGuests,
            phoneCode: currentPhone.countryCode || priorNotes?.phoneCode,
            phoneNumber: currentPhone.phone || priorNotes?.phoneNumber,
            lastEditedBy: "client",
            silentUpdated: true,
            editedServiceIds: undefined,
            addedServiceIds: undefined,
            cancelledServiceIds: undefined,
            editedProductIds: undefined,
            addedProductIds: undefined,
            cancelledProductIds: undefined,
            scheduleEdited: undefined,
            silentUpdateSnapshot: {
              phoneCode: priorNotes?.phoneCode,
              phoneNumber: priorNotes?.phoneNumber,
              guests: priorNotes?.guests ?? previousGuests,
              services: priorNotes?.services,
              desiredLocation: priorNotes?.desiredLocation,
            },
            originalServices: originalServices.length
              ? originalServices
              : serviceLines,
          }
        : {
            ...priorNotes,
            clientSnapshot,
            services: serviceLines,
            products: productLines,
            guests: currentGuests,
            lastEditedBy: "client",
            silentUpdated: undefined,
            silentUpdateSnapshot: undefined,
            ...(scheduleEdited ? { scheduleEdited: true } : {}),
            originalServices: originalServices.length
              ? originalServices
              : serviceLines,
            editedServiceIds: detectEditedServiceIds(
              originalServices,
              serviceLines,
            ),
            addedServiceIds: lineChanges.added,
            cancelledServiceIds: lineChanges.cancelled,
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
    unlockEbrDraft();
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
    activeBooking?.contactPhone,
    activeBooking?.draft,
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
    setPendingEbrSuggestSend(null);
    void (async () => {
      try {
        await persistConfirmedGrantEdit();
      } catch (error) {
        unlockEbrDraft();
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to update booking."),
        });
      }
    })();
  }, [
    bookingRef,
    pendingEbrSuggestSend,
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
  const bookingNotesMeta = React.useMemo(
    () => parseCalendarEntryNotes(activeBooking?.notes),
    [activeBooking?.notes],
  );

  const activityTimelineItems = React.useMemo(() => {
    const scopedBookings = (apiBookings ?? []).filter((booking) => {
      if (apiBookingId && String(booking.id) === String(apiBookingId)) return true;
      if (bookingRef && booking.unique_code === bookingRef) return true;
      return false;
    });

    return buildBookingActivityTimeline({
      bookings: scopedBookings,
      clientEmail: user?.email ?? null,
      clientName: requesterName,
      currentBookingId: apiBookingId,
      currentBookingCode: bookingRef,
      currentScenario: activeBooking?.incomingEditRequest
        ? "EBR"
        : editRequest.isPending
          ? "ER"
          : bookingStatus === "requested"
            ? "BR"
            : null,
      currentStatus: bookingStatus,
      currentProfessionalName: resolvePrimaryProfessional(draft).name,
      currentBookingType: null,
      currentDetails: {
        originalServices: bookingNotesMeta?.originalServices,
        services: displayDraft?.services,
        products: displayDraft?.products,
        editedServiceIds: bookingNotesMeta?.editedServiceIds,
        editedProductIds: bookingNotesMeta?.editedProductIds,
        addedServiceIds: bookingNotesMeta?.addedServiceIds,
        cancelledServiceIds: bookingNotesMeta?.cancelledServiceIds,
        phoneCode: bookingNotesMeta?.phoneCode,
        phoneNumber: bookingNotesMeta?.phoneNumber,
        guests: bookingNotesMeta?.guests,
        desiredLocation: bookingNotesMeta?.desiredLocation,
        silentUpdated: bookingNotesMeta?.silentUpdated,
        silentUpdateSnapshot: bookingNotesMeta?.silentUpdateSnapshot,
        lastEditedBy: bookingNotesMeta?.lastEditedBy,
      },
      apiEvents: bookingActivityResponse?.data ?? null,
      mode: "activity",
    });
  }, [
    activeBooking?.incomingEditRequest,
    apiBookingId,
    apiBookings,
    bookingActivityResponse?.data,
    bookingNotesMeta,
    bookingRef,
    bookingStatus,
    displayDraft?.products,
    displayDraft?.services,
    draft,
    editRequest.isPending,
    requesterName,
    user?.email,
  ]);

  const openActivityComparison = React.useCallback(
    (mode?: "ebr" | "er" | "silent_updated") => {
      const target = findActivityComparisonItem(activityTimelineItems, {
        bookingRef,
        mode,
      });
      setActivityOpen(true);
      setActivityDetailItem(target);
    },
    [activityTimelineItems, bookingRef],
  );

  /**
   * Line-change tags after EBR accept (client or professional).
   * While a professional-sent edit awaits client approval, each changed line
   * keeps Edited/Added/Cancelled and also shows Pending.
   */
  const clientChangesAwaitingApproval =
    editRequest.isSuggested || isEbrIncoming;

  const pendingServiceChangeSets = React.useMemo(() => {
    if (!clientChangesAwaitingApproval) return null;
    const toComparable = (
      services: readonly {
        id: string;
        name: string;
        price: number;
        durationMins: number;
        startTime?: string;
        endTime?: string;
        teamMemberId?: string | null;
        staffResourceId?: string | null;
      }[],
    ) =>
      services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMins: service.durationMins,
        startTime: service.startTime,
        endTime: service.endTime,
        staffResourceId: service.teamMemberId ?? service.staffResourceId ?? undefined,
      }));
    const original = toComparable(
      bookingNotesMeta?.originalServices ??
        draft?.services ??
        displayDraft?.services ??
        [],
    );
    const current = toComparable(displayDraft?.services ?? draft?.services ?? []);
    return detectServiceLineChanges(original, current);
  }, [
    bookingNotesMeta?.originalServices,
    clientChangesAwaitingApproval,
    displayDraft?.services,
    draft?.services,
  ]);

  const pendingProductChangeSets = React.useMemo(() => {
    if (!clientChangesAwaitingApproval) return null;
    const original = bookingNotesMeta?.products ?? [];
    const current =
      displayDraft?.products ??
      editRequest.suggestedProducts ??
      draft?.products ??
      [];
    if (!original.length && !current.length) return null;
    const changes = detectProductLineChanges(original, current);
    if (
      !changes.added.length &&
      !changes.edited.length &&
      !changes.cancelled.length
    ) {
      return null;
    }
    return changes;
  }, [
    bookingNotesMeta?.products,
    clientChangesAwaitingApproval,
    displayDraft?.products,
    draft?.products,
    editRequest.suggestedProducts,
  ]);

  const clientVisibleEditedServiceIds = React.useMemo(() => {
    if (pendingServiceChangeSets) return pendingServiceChangeSets.edited;
    if (bookingNotesMeta?.silentUpdated) return undefined;
    return (
      bookingNotesMeta?.editedServiceIds ??
      editRequest.editedServiceIds ??
      activeBooking?.editedServiceIds
    );
  }, [
    activeBooking?.editedServiceIds,
    bookingNotesMeta?.editedServiceIds,
    bookingNotesMeta?.silentUpdated,
    editRequest.editedServiceIds,
    pendingServiceChangeSets,
  ]);
  const clientVisibleAddedServiceIds = React.useMemo(
    () =>
      pendingServiceChangeSets?.added ?? bookingNotesMeta?.addedServiceIds,
    [bookingNotesMeta?.addedServiceIds, pendingServiceChangeSets],
  );
  const clientVisibleCancelledServiceIds = React.useMemo(
    () =>
      pendingServiceChangeSets?.cancelled ??
      bookingNotesMeta?.cancelledServiceIds,
    [bookingNotesMeta?.cancelledServiceIds, pendingServiceChangeSets],
  );
  const cancelledServicesForDisplay = React.useMemo(() => {
    const ids = new Set(
      clientVisibleCancelledServiceIds ??
        bookingNotesMeta?.cancelledServiceIds ??
        [],
    );
    const originals = bookingNotesMeta?.originalServices ?? [];
    const currentIds = new Set((displayDraft?.services ?? []).map((s) => s.id));
    if (!ids.size) return [];
    return originals
      .filter((service) => ids.has(service.id) && !currentIds.has(service.id))
      .map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        guestId: service.guestId ?? null,
        teamMemberId: service.teamMemberId ?? service.staffResourceId ?? null,
      }));
  }, [
    bookingNotesMeta?.cancelledServiceIds,
    bookingNotesMeta?.originalServices,
    clientVisibleCancelledServiceIds,
    displayDraft?.services,
  ]);
  const clientVisibleEditedProductIds = React.useMemo(() => {
    if (pendingProductChangeSets) return pendingProductChangeSets.edited;
    if (bookingNotesMeta?.lastEditedBy === "client") return undefined;
    if (editRequest.isPending) return undefined;
    if (isEbrIncoming || editRequest.isSuggested) {
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
    editRequest.isSuggested,
    isEbrIncoming,
    pendingProductChangeSets,
  ]);
  const clientVisibleAddedProductIds = React.useMemo(
    () =>
      pendingProductChangeSets?.added ??
      editRequest.addedProductIds ??
      bookingNotesMeta?.addedProductIds,
    [
      bookingNotesMeta?.addedProductIds,
      editRequest.addedProductIds,
      pendingProductChangeSets,
    ],
  );
  const clientVisibleCancelledProductIds = React.useMemo(
    () =>
      pendingProductChangeSets?.cancelled ??
      editRequest.cancelledProductIds ??
      bookingNotesMeta?.cancelledProductIds,
    [
      bookingNotesMeta?.cancelledProductIds,
      editRequest.cancelledProductIds,
      pendingProductChangeSets,
    ],
  );
  const clientScheduleChangeTags = React.useMemo(() => {
    const scheduleChanged =
      Boolean(bookingNotesMeta?.scheduleEdited) ||
      Boolean(
        editRequest.originalDateISO &&
          editRequest.suggestedDateISO &&
          (editRequest.originalDateISO !== editRequest.suggestedDateISO ||
            (editRequest.originalTime &&
              editRequest.suggestedTime &&
              editRequest.originalTime !== editRequest.suggestedTime)),
      );
    if (!scheduleChanged) return [];
    return clientChangesAwaitingApproval
      ? (["edited", "pending"] as const)
      : (["edited"] as const);
  }, [
    bookingNotesMeta?.scheduleEdited,
    clientChangesAwaitingApproval,
    editRequest.originalDateISO,
    editRequest.originalTime,
    editRequest.suggestedDateISO,
    editRequest.suggestedTime,
  ]);
  const lineTagComparisonMode = React.useMemo(():
    | "ebr"
    | "er"
    | "silent_updated" => {
    if (clientChangesAwaitingApproval) {
      return isEbrIncoming ? "ebr" : "er";
    }
    if (bookingNotesMeta?.silentUpdated) return "silent_updated";
    if (bookingStatus === "requested") return "ebr";
    return "er";
  }, [
    bookingNotesMeta?.silentUpdated,
    bookingStatus,
    clientChangesAwaitingApproval,
    isEbrIncoming,
  ]);
  const kilometerAllowanceAmount = React.useMemo(
    () => resolveKilometerAllowanceAmount(bookingNotesMeta?.kilometerAllowance),
    [bookingNotesMeta?.kilometerAllowance],
  );
  /** Only for desired-location bookings when the professional enabled it. */
  const showKilometerAllowance =
    locationMode === "desired" &&
    Boolean(bookingNotesMeta?.showKilometerAllowance) &&
    kilometerAllowanceAmount > 0;
  /** Prepayment breakdown when the professional has a % set. */
  const effectivePrepayPercent =
    Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
  const paymentCardPrepaymentState =
    effectivePrepayPercent > 0 && !isCancelled
      ? prepaymentState
      : ("none" as const);
  const paymentProducts = React.useMemo(() => {
    if (isEbrIncoming || editRequest.isPending) {
      return editRequest.suggestedProducts ?? [];
    }
    return (
      (displayDraft?.products ?? draft?.products)?.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        originalPrice: product.originalPrice,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
        guestId: product.guestId ?? null,
      })) ?? []
    );
  }, [
    displayDraft?.products,
    draft?.products,
    editRequest.isPending,
    editRequest.suggestedProducts,
    isEbrIncoming,
  ]);
  const detailsPrice = React.useMemo(
    () =>
      summarizeClientBookingPrice({
        services: displayDraft?.services ?? draft?.services,
        people: displayDraft?.people ?? draft?.people,
        products: paymentProducts,
        extrasAmount: showKilometerAllowance ? kilometerAllowanceAmount : 0,
        discount: bookingNotesMeta?.totalDiscount ?? null,
        showLateCancellation: Boolean(bookingNotesMeta?.showLateCancellation),
        lateCancellationFeePercent: bookingNotesMeta?.lateCancellationFeePercent,
        showLateRescheduling: Boolean(bookingNotesMeta?.showLateRescheduling),
        lateRescheduleFeePercent: bookingNotesMeta?.lateRescheduleFeePercent,
        showNoShowFee: Boolean(bookingNotesMeta?.showNoShowFee),
        noShowFeePercent: bookingNotesMeta?.noShowFeePercent,
        showPrepayment:
          paymentCardPrepaymentState !== "none" && effectivePrepayPercent > 0,
        prepaymentPercent: effectivePrepayPercent,
        prepaymentPaid: paymentCardPrepaymentState === "paid",
        prepaymentOffline: isOfflinePay,
      }),
    [
      bookingNotesMeta?.lateCancellationFeePercent,
      bookingNotesMeta?.lateRescheduleFeePercent,
      bookingNotesMeta?.noShowFeePercent,
      bookingNotesMeta?.showLateCancellation,
      bookingNotesMeta?.showLateRescheduling,
      bookingNotesMeta?.showNoShowFee,
      bookingNotesMeta?.totalDiscount,
      displayDraft?.people,
      displayDraft?.services,
      draft?.people,
      draft?.services,
      effectivePrepayPercent,
      isOfflinePay,
      kilometerAllowanceAmount,
      paymentCardPrepaymentState,
      paymentProducts,
      showKilometerAllowance,
    ],
  );
  const displayTotal = detailsPrice.breakdown.bookingTotal;
  const displayPrepaidAmount = detailsPrice.breakdown.prepaymentAmount;

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
        paymentDateIso: draft?.selectedDateISO,
        paymentTime: draft?.selectedTime,
        paymentMethod:
          bookingNotesMeta?.paymentMethod ??
          checkoutPaymentMethodApiValue(selectedPaymentMethod),
        prepaidAmountOverride: displayPrepaidAmount,
        showUnpaidPrepayment: isOfflinePay,
        shopName: shopDisplayName,
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
      selectedPaymentMethod,
      bookingNotesMeta?.paymentMethod,
      displayPrepaidAmount,
      isOfflinePay,
      shopDisplayName,
    ],
  );

  /** After prepayment: show Payment Summary (invoice/receipt). Also on completed / payment due. */
  const visiblePaymentSummarySections = React.useMemo(() => {
    if (!paymentSummarySections.length) return [];
    if (
      (isPrepaymentPaid || isOfflinePay) &&
      !isCompleted &&
      !isPaymentDue
    ) {
      return paymentSummarySections.filter(
        (section) => section.id === "prepayment" || section.title === "Prepayment",
      );
    }
    return paymentSummarySections;
  }, [
    isCompleted,
    isOfflinePay,
    isPaymentDue,
    isPrepaymentPaid,
    paymentSummarySections,
  ]);

  const showPaymentSummary =
    visiblePaymentSummarySections.length > 0 &&
    (isPrepaymentPaid ||
      activeBooking?.paid === true ||
      (isOfflinePay &&
        requiresPrepayment &&
        bookingStatus !== "draft"));

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: pageBackground }}>
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
            scheduleChangeTags={clientScheduleChangeTags}
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
              bookingStatus === "confirmed" &&
              locationMode === "desired" &&
              user?.user_type === "company"
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
            onOpenActivity={() => setActivityOpen(true)}
            showEditScenario={
              bookingStatus === "confirmed" &&
              !editRequest.isPending &&
              !isEbrIncoming &&
              !bookingNotesMeta?.silentUpdated &&
              (Boolean(bookingNotesMeta?.lastEditedBy) ||
                Boolean(activeBooking?.editedServiceIds?.length) ||
                Boolean(activeBooking?.editedProductIds?.length) ||
                isClientChangeAccepted)
            }
            ebrSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onEbrClick={() => openActivityComparison("ebr")}
            erSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onErClick={() => openActivityComparison("er")}
            responseOverdue={isResponseWindowOverdue({
              responseStatus: bookingNotesMeta?.responseStatus,
              responseStartedAt: bookingNotesMeta?.responseStartedAt,
              respondBy: bookingNotesMeta?.respondBy,
              responseWindowMinutes: bookingNotesMeta?.responseWindowMinutes,
            })}
          />

          <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
            <ClientBookingInfoBar
              professionalName={shopDisplayName}
              professionalRole={professionalRole}
              address={address}
              locationMode={locationMode}
              phone={professionalPhone}
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
                  showKilometerAllowance={showKilometerAllowance}
                  kilometerAllowanceAmount={kilometerAllowanceAmount}
                  discount={bookingNotesMeta?.totalDiscount ?? null}
                  showLateCancellation={Boolean(
                    bookingNotesMeta?.showLateCancellation,
                  )}
                  lateCancellationFeePercent={
                    bookingNotesMeta?.lateCancellationFeePercent
                  }
                  showLateRescheduling={Boolean(
                    bookingNotesMeta?.showLateRescheduling,
                  )}
                  lateRescheduleFeePercent={
                    bookingNotesMeta?.lateRescheduleFeePercent
                  }
                  showNoShowFee={Boolean(bookingNotesMeta?.showNoShowFee)}
                  noShowFeePercent={bookingNotesMeta?.noShowFeePercent}
                  editedServiceIds={clientVisibleEditedServiceIds}
                  addedServiceIds={clientVisibleAddedServiceIds}
                  cancelledServiceIds={clientVisibleCancelledServiceIds}
                  cancelledServices={cancelledServicesForDisplay}
                  products={editRequest.suggestedProducts}
                  editedProductIds={clientVisibleEditedProductIds}
                  addedProductIds={clientVisibleAddedProductIds}
                  cancelledProductIds={clientVisibleCancelledProductIds}
                  changesAwaitingApproval={clientChangesAwaitingApproval}
                  scheduleChangeTags={clientScheduleChangeTags}
                  editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                  onEditTagSignpostClick={() =>
                    openActivityComparison(lineTagComparisonMode)
                  }
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
                  prepaymentPercent={effectivePrepayPercent}
                  payNowLabel={payNowLabel}
                  showKilometerAllowance={showKilometerAllowance}
                  kilometerAllowanceAmount={kilometerAllowanceAmount}
                  discount={bookingNotesMeta?.totalDiscount ?? null}
                  showLateCancellation={Boolean(
                    bookingNotesMeta?.showLateCancellation,
                  )}
                  lateCancellationFeePercent={
                    bookingNotesMeta?.lateCancellationFeePercent
                  }
                  showLateRescheduling={Boolean(
                    bookingNotesMeta?.showLateRescheduling,
                  )}
                  lateRescheduleFeePercent={
                    bookingNotesMeta?.lateRescheduleFeePercent
                  }
                  showNoShowFee={Boolean(bookingNotesMeta?.showNoShowFee)}
                  noShowFeePercent={bookingNotesMeta?.noShowFeePercent}
                  rejectedChangesNote={rejectedChangesNote}
                  acceptedChangesNote={acceptedChangesNote}
                  prepaymentOffline={isOfflinePay}
                  editedServiceIds={clientVisibleEditedServiceIds}
                  addedServiceIds={clientVisibleAddedServiceIds}
                  cancelledServiceIds={clientVisibleCancelledServiceIds}
                  cancelledServices={cancelledServicesForDisplay}
                  products={paymentProducts}
                  editedProductIds={clientVisibleEditedProductIds}
                  addedProductIds={clientVisibleAddedProductIds}
                  cancelledProductIds={clientVisibleCancelledProductIds}
                  changesAwaitingApproval={clientChangesAwaitingApproval}
                  scheduleChangeTags={clientScheduleChangeTags}
                  editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                  onEditTagSignpostClick={() =>
                    openActivityComparison(lineTagComparisonMode)
                  }
                  onPayNow={
                    paymentCardPrepaymentState === "required" && canActOnPayment
                      ? handlePayNow
                      : undefined
                  }
                  footer={
                    showPaymentSummary ? (
                      <ClientBookingPaymentSummary
                        sections={visiblePaymentSummarySections}
                        headerTotal={displayTotal}
                        onViewInvoice={
                          bookingTransactionRow ? openInvoice : undefined
                        }
                        onViewReceipt={
                          (prepaymentReceiptRow ?? bookingTransactionRow)
                            ? openReceipt
                            : undefined
                        }
                      />
                    ) : undefined
                  }
                />

                {canActOnPayment ? (
                  <ClientBookingPaymentMethodSelector
                    options={checkoutPaymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                ) : null}

                {incomingProfessionalNote ? (
                  <EditRequestIncomingNote
                    note={incomingProfessionalNote}
                    from="professional"
                  />
                ) : null}

                {showRequestResponseActions ? (
                  <ClientEbrResponseActions
                    onAccept={() => setEbrAction("accept")}
                    onSuggestChange={() => void handleConfirmEbrSuggest()}
                    onReject={() => setEbrAction("reject")}
                  />
                ) : null}

                <InlineTimedSnackbar
                  open={Boolean(actionFeedback)}
                  message={actionFeedback?.message}
                  severity={actionFeedback?.severity}
                  onClose={() => setActionFeedback(null)}
                />

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

      <AppDrawer
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          setActivityDetailItem(null);
        }}
        title={
          activityDetailItem
            ? activityDetailItem.detailType === "cancellation"
              ? "Activity Details"
              : activityDetailItem.detailType === "comparison" ||
                  activityDetailItem.comparison
                ? "Comparison"
                : "Edit request details"
            : "Activity"
        }
        onBack={
          activityDetailItem ? () => setActivityDetailItem(null) : undefined
        }
        panelWidth={420}
      >
        <Box sx={{ px: 2, pb: 2 }}>
          <BookingActivityOverview
            title="Activity Overview"
            items={activityTimelineItems}
            emptyMessage="No activity for this booking yet."
            selectedDetail={activityDetailItem}
            onSelectedDetailChange={setActivityDetailItem}
          />
        </Box>
      </AppDrawer>

      <ClientEbrActionDialog
        open={Boolean(ebrAction)}
        action={ebrAction}
        context={
          isIncomingConfirmedEr ? "er" : isIncomingBr ? "br" : "ebr"
        }
        onClose={() => setEbrAction(null)}
        onConfirm={() => {
          const action = ebrAction;
          const acceptNeedsPrepay =
            action === "accept" &&
            isIncomingBr &&
            (Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) ||
              0) > 0 &&
            !isPrepaymentPaid;
          if (!acceptNeedsPrepay) {
            setResponseActionsDismissed(true);
            setActionFeedback({
              severity: "success",
              message:
                action === "accept"
                  ? isIncomingConfirmedEr
                    ? "Edit request accepted."
                    : isIncomingBr
                      ? "Booking request accepted."
                      : "Changes accepted."
                  : action === "reject"
                    ? isIncomingConfirmedEr
                      ? "Edit request rejected. Booking stays confirmed."
                      : isIncomingBr
                        ? "Booking request rejected."
                        : "Edit request rejected. Booking stays confirmed."
                    : "You can now suggest a change.",
            });
          }
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
        invoiceType={bookingInvoiceType}
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
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
