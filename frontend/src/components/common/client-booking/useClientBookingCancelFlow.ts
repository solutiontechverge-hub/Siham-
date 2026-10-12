"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { BookingListTab } from "../../../app/clients/booking/clientBookingRecords";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import {
  clearActiveBookingSession,
  getActiveBookingSession,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useSnackbar } from "../AppSnackbar";
import {
  clearEbrSuggestionsFromNotes,
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../calendar/bookingEventDetails";
import {
  checkoutPaymentMethodApiValue,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";
import { clearBookingEditRequest } from "./bookingEditRequest";
import { setBookingCancellationReason } from "./bookingCancellationReason";
import {
  settleCancellationFee,
  type CancellationFeeSettlement,
} from "./settleCancellationFee";

type EditRequestApi = { refresh: () => void };

export function useClientBookingCancelFlow(input: {
  bookingTotal: number;
  feePercent: number;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  appointmentStartMs: number | null;
  prepaidPaid: number;
  isPrepaymentPaid: boolean;
  bookingRef: string;
  apiBookingId: string | null;
  bookingStatus: ClientBookingStatus;
  listTab: BookingListTab;
  activeBookingNotes?: string | null;
  selectedPaymentMethod: CheckoutPaymentMethodId;
  editRequest: EditRequestApi;
  refreshActiveBooking: () => Promise<unknown> | unknown;
  // RTK mutation triggers — keep loose so callers pass hooks unchanged.
  updateMyBooking: (payload: {
    id: string;
    status?: string;
    notes?: string | null;
  }) => { unwrap: () => Promise<unknown> };
  syncFinanceFromBooking: (payload: {
    bookingRef: string;
    paymentPhase: "full";
    paymentMethod: string;
    status: "Voided" | "Paid";
    amount?: number;
  }) => unknown;
  setEbrAction: (value: null) => void;
}): {
  cancelDialogOpen: boolean;
  setCancelDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cancelFeeDialogOpen: boolean;
  setCancelFeeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cancelFeeStripeOpen: boolean;
  setCancelFeeStripeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCancelProcessing: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  discardDialogOpen: boolean;
  setDiscardDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cancellationSettlement: CancellationFeeSettlement;
  handleKeepBookingFromFeeDialog: () => void;
  handlePayCancellationFee: () => Promise<void>;
  handleConfirmCancelBooking: (reason: string) => void;
  handleCancellationFeeStripeSuccess: () => Promise<void>;
  handleDeleteBooking: () => Promise<void>;
  handleDiscardBookingRequest: () => Promise<void>;
} {
  const {
    bookingTotal,
    feePercent,
    noticeHours,
    noticeMinutes,
    appointmentStartMs,
    prepaidPaid,
    isPrepaymentPaid,
    bookingRef,
    apiBookingId,
    bookingStatus,
    listTab,
    activeBookingNotes,
    selectedPaymentMethod,
    editRequest,
    refreshActiveBooking,
    updateMyBooking,
    syncFinanceFromBooking,
    setEbrAction,
  } = input;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelFeeDialogOpen, setCancelFeeDialogOpen] = React.useState(false);
  const [cancelFeeStripeOpen, setCancelFeeStripeOpen] = React.useState(false);
  const [pendingCancelReason, setPendingCancelReason] = React.useState("");
  const [isCancelProcessing, setIsCancelProcessing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);

  const cancellationSettlement = React.useMemo(
    () =>
      settleCancellationFee({
        bookingTotal,
        feePercent,
        prepaidPaid,
        appointmentStartMs,
        noticeHours,
        noticeMinutes,
      }),
    [
      appointmentStartMs,
      bookingTotal,
      feePercent,
      noticeHours,
      noticeMinutes,
      prepaidPaid,
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

      const chargedLateFee =
        cancellationSettlement.isLateCancellation &&
        cancellationSettlement.cancellationFee > 0;
      const clearedNotes = clearEbrSuggestionsFromNotes(activeBookingNotes, {
        cancellationReason: pendingCancelReason.trim() || undefined,
        ...(chargedLateFee
          ? {
              showLateCancellation: true,
              lateCancellationFeePercent: String(
                cancellationSettlement.feePercent,
              ),
              cancellationFeeAt: new Date().toISOString(),
              exceededCancellationWindow: true,
            }
          : {}),
      });

      await updateMyBooking({
        id: apiBookingId,
        status: "cancelled",
        notes: clearedNotes ?? undefined,
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

      // Late fee paid (Stripe and/or prepaid) → Paid LCF invoice. Else void open service sale.
      void syncFinanceFromBooking(
        chargedLateFee
          ? {
              bookingRef,
              paymentPhase: "full",
              paymentMethod: checkoutPaymentMethodApiValue(selectedPaymentMethod),
              status: "Paid",
              amount: cancellationSettlement.cancellationFee,
            }
          : {
              bookingRef,
              paymentPhase: "full",
              paymentMethod: checkoutPaymentMethodApiValue(selectedPaymentMethod),
              status: "Voided",
            },
      );

      await refreshActiveBooking();
      editRequest.refresh();
      setEbrAction(null);
      setCancelFeeDialogOpen(false);
      setCancelFeeStripeOpen(false);
      setPendingCancelReason("");
    },
    [
      activeBookingNotes,
      apiBookingId,
      bookingRef,
      cancellationSettlement.cancellationFee,
      cancellationSettlement.feePercent,
      cancellationSettlement.isLateCancellation,
      clearActiveBookingSessionLocal,
      editRequest,
      listTab,
      pendingCancelReason,
      refreshActiveBooking,
      router,
      selectedPaymentMethod,
      setEbrAction,
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
      const currentNotes = activeBookingNotes ?? null;
      const details = {
        ...(parseCalendarEntryNotes(currentNotes) ?? {}),
        hiddenForCustomer: true,
        hiddenForProfessional: true,
      };
      const nextNotes = serializeCalendarEntryNotes(
        details.internalNote ?? "",
        details,
        parseStoredEbrFromNotes(currentNotes),
        parseStoredErFromNotes(currentNotes),
      );
      await updateMyBooking({
        id: apiBookingId,
        notes: nextNotes ?? undefined,
      }).unwrap();
      clearActiveBookingSessionLocal();
      showSnackbar({
        severity: "success",
        message: "Booking removed from your list",
      });
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

  return {
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
  };
}
