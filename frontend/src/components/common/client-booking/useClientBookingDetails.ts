"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "../../../store/hooks";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import type { BookingListTab } from "../../../app/clients/booking/clientBookingRecords";
import {
  isClientBookingPaymentDue,
  isWaitingForPrepayment,
  type ClientBookingStatus,
} from "../../../app/clients/booking/clientBookingRecords";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useCheckoutBookingRef } from "./useCheckoutBookingRef";
import type { ClientEbrActionKind } from "./ClientEbrActionDialog";
import { useBookingEditRequest } from "./useBookingEditRequest";
import { parseCalendarEntryNotes } from "../calendar/bookingEventDetails";
import { clientShouldAck } from "../calendar/bookingAcknowledgment";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import {
  useCreateBookingMutation,
  useGetAllBusinessSetupsQuery,
  useGetBookingActivityQuery,
  useManageBookingEditRequestMutation,
  useUpdateBookingStatusMutation,
  useUpdateMyBookingMutation,
  type UpdateMyBookingRequest,
} from "../../../store/services/businessApi";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
import { useOpenMessagingForBookingMutation } from "../../../store/services/messagingApi";
import { useBookingRealtimeSync } from "../../../hooks/useBookingRealtimeSync";
import {
  isOfflinePaymentMethod,
  resolveCheckoutPaymentOptions,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";

import { bookingPillTabs } from "./clientBookingDetails.data";
import type {
  ClientBookingDetailsActionFeedback,
  ClientBookingDetailsPendingEbrSuggestSend,
} from "./clientBookingDetails.helpers";
import { buildClientBookingDisplayDraft } from "./buildClientBookingDisplayDraft";
import { useClientBookingSilentUpdatedStatus } from "./useClientBookingSilentUpdatedStatus";
import { useClientBookingLineChangeTags } from "./useClientBookingLineChangeTags";
import { useClientBookingActivityTimeline } from "./useClientBookingActivityTimeline";
import { useClientBookingPaymentDisplay } from "./useClientBookingPaymentDisplay";
import { useClientBookingCancelFlow } from "./useClientBookingCancelFlow";
import { useClientBookingPrepaySubmit } from "./useClientBookingPrepaySubmit";
import { useClientBookingEbrResponses } from "./useClientBookingEbrResponses";
import { useClientBookingEbrSuggestFlow } from "./useClientBookingEbrSuggestFlow";
import { useClientBookingInvoiceDocs } from "./useClientBookingInvoiceDocs";
import { useClientBookingIncomingEbrSync } from "./useClientBookingIncomingEbrSync";
import { useClientBookingDetailsMeta } from "./useClientBookingDetailsMeta";
import { useClientBookingOutcomeNotes } from "./useClientBookingOutcomeNotes";

export type {
  ClientBookingDetailsActionFeedback,
  ClientBookingDetailsActiveDocument,
  ClientBookingDetailsPendingEbrSuggestSend,
} from "./clientBookingDetails.helpers";

export function useClientBookingDetails({
  variant,
}: {
  variant: "standard" | "prepaid";
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
  const showClientAckOk =
    clientShouldAck({
      needsOk: activeBooking?.needsOk,
      ackRecipient: activeBooking?.ackRecipient,
    }) && !(activeBooking && isWaitingForPrepayment(activeBooking));

  const { data: bookingActivityResponse } = useGetBookingActivityQuery(
    {
      bookingId: apiBookingId,
      bookingCode: bookingRef,
    },
    {
      skip: !apiBookingId && !bookingRef,
    },
  );

  const [ebrSuggestDrawerOpen, setEbrSuggestDrawerOpen] = React.useState(false);
  const [ebrAction, setEbrAction] = React.useState<ClientEbrActionKind | null>(
    null,
  );
  const [responseActionsDismissed, setResponseActionsDismissed] =
    React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<
    ClientBookingDetailsActionFeedback | null
  >(null);
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
    (hasApiPendingEr
      ? apiErInitiatedBy === "professional"
      : editRequest.isPending && editRequest.initiatedBy === "professional");
  /** Client-sent Confirmed ER awaiting professional accept — show Withdraw ER. */
  const showWithdrawEr =
    bookingStatus === "confirmed" &&
    (hasApiPendingEr
      ? apiErInitiatedBy === "client"
      : editRequest.isPending && editRequest.initiatedBy === "client");
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
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const pendingAcceptBrAfterPrepay = React.useRef(false);
  const [createBooking] = useCreateBookingMutation();
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
  const [syncFinanceFromBooking] =
    useSyncFinanceTransactionFromBookingMutation();
  const [updateMyBooking] = useUpdateMyBookingMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const persistBookingPatch = React.useCallback(
    async (payload: UpdateMyBookingRequest) => {
      if (user?.user_type === "professional") {
        if (!payload.status) {
          throw new Error(
            "Professionals must use the status endpoint for booking updates.",
          );
        }
        return updateBookingStatus({
          id: payload.id,
          status: payload.status,
          notes: typeof payload.notes === "string" ? payload.notes : undefined,
          total_price: payload.total_price,
          booking_date: payload.booking_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
        }).unwrap();
      }
      return updateMyBooking(payload).unwrap();
    },
    [updateBookingStatus, updateMyBooking, user?.user_type],
  );
  const [manageBookingEditRequest] = useManageBookingEditRequestMutation();
  const [openMessagingForBooking] = useOpenMessagingForBookingMutation();

  const [pendingEbrSuggestSend, setPendingEbrSuggestSend] = React.useState<
    ClientBookingDetailsPendingEbrSuggestSend | null
  >(null);

  useClientBookingIncomingEbrSync({
    bookingRef,
    editRequest,
    apiEditRequest: activeBooking?.editRequest ?? null,
    incomingEditRequest: activeBooking?.incomingEditRequest ?? null,
    setPendingEbrSuggestSend,
  });

  const showStatusUpdated = useClientBookingSilentUpdatedStatus({
    bookingRef,
    bookingStatus,
    isEbrIncoming,
    editRequestIsPending: editRequest.isPending,
    activeBooking,
  });

  React.useEffect(() => {
    if (!isPrepaid || !shop?.shopId) return;
    if (!requiresPrepayment) router.replace("/clients/booking/checkout");
  }, [isPrepaid, requiresPrepayment, router, shop?.shopId]);

  const {
    professional,
    shopDisplayName,
    professionalRole,
    professionalPhone,
    address,
    bookedDateLabel,
    bookedTimeLabel,
    bookedEndTimeLabel,
    headerName,
    policySections,
    prepaidAmount,
    appointmentStartMs,
    pageBackground,
  } = useClientBookingDetailsMeta({
    draft,
    shop,
    businessProfile,
    bookingSetup,
    locationMode,
    prepaymentPercent,
    user: user as never,
    isCompleted,
    isPaymentDue,
    activeBookingPaid: activeBooking?.paid,
    pageBg: m.pageBg,
  });

  const {
    cancelDialogOpen,
    setCancelDialogOpen,
    cancelFeeDialogOpen,
    setCancelFeeDialogOpen,
    cancelFeeStripeOpen,
    setCancelFeeStripeOpen,
    isCancelProcessing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    discardDialogOpen,
    setDiscardDialogOpen,
    cancellationSettlement,
    handleKeepBookingFromFeeDialog,
    handlePayCancellationFee,
    handleConfirmCancelBooking,
    handleCancellationFeeStripeSuccess,
    handleDeleteBooking,
    handleDiscardBookingRequest,
  } = useClientBookingCancelFlow({
    bookingTotal: draft?.total ?? 0,
    feePercent: Number(businessProfile?.cancellationFeePercent) || 0,
    noticeHours: businessProfile?.cancellationNoticeHours,
    noticeMinutes: businessProfile?.cancellationNoticeMinutes,
    appointmentStartMs,
    prepaidPaid: isPrepaymentPaid ? prepaidAmount : 0,
    isPrepaymentPaid,
    bookingRef,
    apiBookingId,
    bookingStatus,
    listTab,
    activeBookingNotes: activeBooking?.notes,
    selectedPaymentMethod,
    editRequest,
    refreshActiveBooking,
    updateMyBooking: updateMyBooking as never,
    syncFinanceFromBooking,
    setEbrAction,
  });

  const {
    activeDocument,
    setActiveDocument,
    professionalBusinessOverride,
    bookingInvoiceType,
    bookingTransactionRow,
    prepaymentReceiptRow,
    hasAnyDocument,
    financeRows,
    openInvoice,
    openReceipt,
  } = useClientBookingInvoiceDocs({
    bookingSetup,
    shopDisplayName,
    professionalPhone,
    businessProfile,
    shop,
    requesterUserType,
    draft,
    bookingRef,
    bookingId: apiBookingId,
    requesterName,
    requesterEmail: user?.email,
    requesterAddress,
    requesterVat,
    requesterCoc,
    financeSettings,
    selectedPaymentMethod,
    requiresPrepayment,
    isPrepaymentPaid,
    prepaidAmount,
    isOfflinePay,
  });

  const paidProtectiveFees = React.useMemo(
    () =>
      (financeRows ?? [])
        .filter((row) => {
          const status = String(row.status ?? "").toLowerCase();
          if (status !== "paid" && status !== "prepaid") return false;
          const label = String(row.entryLabel ?? "");
          return (
            label === "Late Cancellation Booking Fee" ||
            label === "Late Rescheduling Fee" ||
            label.toLowerCase() === "no-show fee"
          );
        })
        .map((row) => ({
          entryLabel: row.entryLabel,
          amount: Number(row.grossAmount ?? row.netAmount ?? 0),
          dateLabel: row.date
            ? new Date(`${row.date}T12:00:00`).toLocaleDateString("en-GB")
            : undefined,
          methodLabel: row.methodTitle || undefined,
        }))
        .filter((fee) => fee.amount > 0),
    [financeRows],
  );

  const {
    isSubmittingRequest,
    completePrepayment,
    handlePayNow,
    handleSendBookingRequest,
    payNowLabel,
  } = useClientBookingPrepaySubmit({
    isDraft,
    activeBooking,
    locationMode,
    bookingSetup,
    createBooking: createBooking as never,
    refreshActiveBooking,
    apiBookingId,
    bookingRef,
    bookingStatus,
    selectedPaymentMethod,
    prepaidAmount,
    isPrepaymentPaid,
    updateMyBooking: updateMyBooking as never,
    persistBookingPatch,
    syncFinanceFromBooking,
    pendingAcceptBrAfterPrepay,
    setStripeDialogOpen,
  });

  const {
    handleConfirmEbrAccept,
    handleConfirmEbrReject,
    handleConfirmEbrSuggest,
    handleAcknowledgeRejected,
    handleAcknowledgeCounterpartyAction,
    handleWithdrawEr,
    isWithdrawingEr,
  } = useClientBookingEbrResponses({
    bookingRef,
    apiBookingId,
    activeBooking,
    prepaymentPercent,
    isPrepaymentPaid,
    isOfflinePay,
    isIncomingBr,
    isIncomingConfirmedEr,
    listTab,
    ebrRespondParam,
    searchParams,
    editRequest,
    persistBookingPatch,
    refreshActiveBooking,
    updateMyBooking: updateMyBooking as never,
    manageBookingEditRequest: manageBookingEditRequest as never,
    openMessagingForBooking: openMessagingForBooking as never,
    handlePayNow,
    pendingAcceptBrAfterPrepay,
    setEbrAction,
    setEbrSuggestDrawerOpen,
    setResponseActionsDismissed,
    setActionFeedback,
    setActiveDocument,
    setStripeDialogOpen,
  });

  const {
    isClientChangeAccepted,
    showRejectedResponsePanel,
    rejectedChangesNote,
    acceptedChangesNote,
  } = useClientBookingOutcomeNotes({
    editRequest: editRequest as never,
    bookingStatus,
    activeBooking,
    draft,
    isCancelled,
  });

  const displayDraft = React.useMemo(
    () => buildClientBookingDisplayDraft(draft, editRequest),
    [
      draft,
      editRequest.isPending,
      editRequest.isSuggested,
      editRequest.suggestedDateISO,
      editRequest.suggestedTime,
      editRequest.suggestedProducts,
      editRequest.suggestedServices,
    ],
  );

  const {
    handleEbrSuggestEditServices,
    handleEbrSuggestSend,
    openConfirmedEbrEditor,
  } = useClientBookingEbrSuggestFlow({
    bookingRef,
    apiBookingId,
    activeBooking,
    displayDraft,
    draft,
    editRequest,
    locationMode,
    pendingEbrSuggestSend,
    setPendingEbrSuggestSend,
    setEbrSuggestDrawerOpen,
    persistBookingPatch,
    refreshActiveBooking,
    updateMyBooking: updateMyBooking as never,
  });

  const detailsContentKey = `${bookingRef}-${editRequest.status ?? "none"}-${bookingStatus}`;
  const bookingNotesMeta = React.useMemo(
    () => parseCalendarEntryNotes(activeBooking?.notes),
    [activeBooking?.notes],
  );

  const {
    activityOpen,
    setActivityOpen,
    activityDetailItem,
    setActivityDetailItem,
    activityTimelineItems,
    silentFieldUpdates,
    openActivityComparison,
  } = useClientBookingActivityTimeline({
    apiBookings,
    apiBookingId,
    bookingRef,
    bookingStatus,
    userEmail: user?.email,
    requesterName,
    hasIncomingEditRequest: Boolean(activeBooking?.incomingEditRequest),
    editRequestIsPending: editRequest.isPending,
    draft,
    bookingNotesMeta,
    displayDraft,
    // Always server-driven when viewing a booking — never synthesize from browser state.
    apiEvents:
      apiBookingId || bookingRef
        ? (bookingActivityResponse?.data ?? [])
        : null,
    showStatusUpdated,
  });

  const {
    hasProfessionalSuggestedEdits,
    clientChangesAwaitingApproval,
    cancelledServicesForDisplay,
    clientVisibleEditedServiceIds,
    clientVisibleAddedServiceIds,
    clientVisibleCancelledServiceIds,
    clientVisibleEditedProductIds,
    clientVisibleAddedProductIds,
    clientVisibleCancelledProductIds,
    clientScheduleChangeTags,
    lineTagComparisonMode,
  } = useClientBookingLineChangeTags({
    isCancelled,
    isEbrIncoming,
    isIncomingConfirmedEr,
    bookingStatus,
    bookingNotesMeta,
    draft,
    displayDraft,
    editRequest,
    activeBooking,
  });

  const {
    kilometerAllowanceAmount,
    showKilometerAllowance,
    effectivePrepayPercent,
    paymentCardPrepaymentState,
    paymentProducts,
    displayTotal,
    displayPrepaidAmount,
    visiblePaymentSummarySections,
    showPaymentSummary,
  } = useClientBookingPaymentDisplay({
    locationMode,
    bookingNotesMeta,
    activeBooking,
    prepaymentPercent,
    isCancelled,
    prepaymentState,
    isEbrIncoming,
    editRequestIsPending: editRequest.isPending,
    editRequestIsSuggested: editRequest.isSuggested,
    suggestedProducts: editRequest.suggestedProducts,
    displayDraft,
    draft,
    isOfflinePay,
    isPrepaymentPaid,
    isCompleted,
    isPaymentDue,
    requiresPrepayment,
    bookingStatus,
    requesterName,
    selectedPaymentMethod,
    shopDisplayName,
    paidProtectiveFees,
  });

  return {
    acceptedChangesNote,
    actionFeedback,
    activeBooking,
    activeDocument,
    activityDetailItem,
    activityOpen,
    activityTimelineItems,
    address,
    apiBookingId,
    bookedDateLabel,
    bookedTimeLabel,
    bookedEndTimeLabel,
    bookingStatus,
    bookingInvoiceType,
    bookingNotesMeta,
    bookingRef,
    bookingSetup,
    bookingTransactionRow,
    businessProfile,
    canActOnPayment,
    cancelDialogOpen,
    cancelFeeDialogOpen,
    cancelFeeStripeOpen,
    cancellationSettlement,
    cancelledServicesForDisplay,
    checkoutPaymentOptions,
    clientChangesAwaitingApproval,
    clientScheduleChangeTags,
    clientVisibleAddedProductIds,
    clientVisibleAddedServiceIds,
    clientVisibleCancelledProductIds,
    clientVisibleCancelledServiceIds,
    clientVisibleEditedProductIds,
    clientVisibleEditedServiceIds,
    completePrepayment,
    deleteDialogOpen,
    detailsContentKey,
    discardDialogOpen,
    displayDraft,
    displayPrepaidAmount,
    displayTotal,
    draft,
    ebrAction,
    ebrSuggestDrawerOpen,
    editRequest,
    effectivePrepayPercent,
    financeSettings,
    handleAcknowledgeCounterpartyAction,
    handleAcknowledgeRejected,
    handleCancellationFeeStripeSuccess,
    handleConfirmCancelBooking,
    handleConfirmEbrAccept,
    handleConfirmEbrReject,
    handleConfirmEbrSuggest,
    handleDeleteBooking,
    handleDiscardBookingRequest,
    handleEbrSuggestEditServices,
    handleEbrSuggestSend,
    handleKeepBookingFromFeeDialog,
    handlePayCancellationFee,
    handlePayNow,
    handleSendBookingRequest,
    handleWithdrawEr,
    hasProfessionalSuggestedEdits,
    headerName,
    incomingProfessionalNote,
    isBookingRequestSent,
    isCancelled,
    isCancelProcessing,
    isClientChangeAccepted,
    isDraft,
    isEbrIncoming,
    isIncomingBr,
    isIncomingConfirmedEr,
    isOfflinePay,
    isPaymentDue,
    isPrepaid,
    isPrepaymentPaid,
    isSubmittingRequest,
    isWithdrawingEr,
    kilometerAllowanceAmount,
    lineTagComparisonMode,
    listTab,
    locationMode,
    m,
    openActivityComparison,
    openConfirmedEbrEditor,
    openInvoice,
    openReceipt,
    pageBackground,
    paymentCardPrepaymentState,
    paymentProducts,
    payNowLabel,
    policySections,
    prepaidAmount,
    prepaymentPercent,
    prepaymentReceiptRow,
    hasAnyDocument,
    prepaymentState,
    professional,
    professionalBusinessOverride,
    professionalPhone,
    professionalRole,
    rejectedChangesNote,
    requesterAvatarUrl,
    requesterName,
    requiresPrepayment,
    router,
    selectedPaymentMethod,
    setActionFeedback,
    setActiveDocument,
    setActivityDetailItem,
    setActivityOpen,
    setCancelDialogOpen,
    setCancelFeeDialogOpen,
    setCancelFeeStripeOpen,
    setDeleteDialogOpen,
    setDiscardDialogOpen,
    setEbrAction,
    setEbrSuggestDrawerOpen,
    setResponseActionsDismissed,
    setSelectedPaymentMethod,
    setStripeDialogOpen,
    shopDisplayName,
    showClientAckOk,
    showKilometerAllowance,
    showPaymentSummary,
    showRejectedResponsePanel,
    showRequestResponseActions,
    showStatusUpdated,
    showWithdrawEr,
    silentFieldUpdates,
    stripeDialogOpen,
    user,
    visiblePaymentSummarySections,
    bookingPillTabs,
  };
}
