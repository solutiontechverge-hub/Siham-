"use client";

import * as React from "react";
import type { BusinessSetupListing, CreateBookingRequest } from "../../../store/services/businessApi";
import type { ClientBookingRecord, ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { submitClientBookingRequest } from "../../../app/clients/booking/submitClientBookingRequest";
import { resolveCreateBookingStatus } from "../../../app/clients/booking/resolveCreateBookingStatus";
import {
  getActiveBookingSession,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useSnackbar } from "../AppSnackbar";
import { markNotesPrepaymentPaid } from "../calendar/bookingEventDetails";
import {
  checkoutPaymentMethodApiValue,
  checkoutPaymentMethodSupportsPayNow,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";
import type { UpdateMyBookingRequest } from "../../../store/services/businessApi";

type CreateBookingTrigger = (
  payload: CreateBookingRequest,
) => { unwrap: () => Promise<{ data?: { id?: string | number; unique_code?: string | null } | null }> };

export function useClientBookingPrepaySubmit(input: {
  isDraft: boolean;
  activeBooking: ClientBookingRecord | null;
  locationMode: "fixed" | "desired" | string;
  bookingSetup: BusinessSetupListing | null | undefined;
  createBooking: CreateBookingTrigger;
  refreshActiveBooking: () => Promise<unknown> | unknown;
  apiBookingId: string | null;
  bookingRef: string;
  bookingStatus: ClientBookingStatus;
  selectedPaymentMethod: CheckoutPaymentMethodId;
  prepaidAmount: number;
  isPrepaymentPaid: boolean;
  updateMyBooking: (payload: UpdateMyBookingRequest) => unknown;
  persistBookingPatch: (payload: UpdateMyBookingRequest) => Promise<unknown>;
  syncFinanceFromBooking: (payload: {
    bookingRef: string;
    paymentPhase: "prepay";
    paymentMethod: string;
    amount: number;
    status: string;
  }) => unknown;
  pendingAcceptBrAfterPrepay: React.MutableRefObject<boolean>;
  setStripeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    isDraft,
    activeBooking,
    locationMode,
    bookingSetup,
    createBooking,
    refreshActiveBooking,
    apiBookingId,
    bookingRef,
    bookingStatus,
    selectedPaymentMethod,
    prepaidAmount,
    isPrepaymentPaid,
    updateMyBooking,
    persistBookingPatch,
    syncFinanceFromBooking,
    pendingAcceptBrAfterPrepay,
    setStripeDialogOpen,
  } = input;

  const { showSnackbar } = useSnackbar();
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);

  const submitDraftBookingRequest =
    React.useCallback(async (): Promise<boolean> => {
      if (!isDraft || !activeBooking) return true;
      if (activeBooking.bookingRequestSent) return true;

      setIsSubmittingRequest(true);
      try {
        const result = await submitClientBookingRequest({
          record: activeBooking,
          locationMode: locationMode === "desired" ? "desired" : "fixed",
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
      // Fixed settles on prepay. Desired BR stays requested so the professional can Accept.
      const statusBeforePay =
        sessionRecord?.status ?? activeBooking?.status ?? null;
      const confirmAfterPay =
        pendingAcceptBrAfterPrepay.current ||
        locationMode === "fixed" ||
        statusBeforePay === "br_accepted" ||
        statusBeforePay === "draft";
      pendingAcceptBrAfterPrepay.current = false;
      const paymentMethodValue = checkoutPaymentMethodApiValue(
        selectedPaymentMethod,
      );
      const paidNotes = markNotesPrepaymentPaid(
        sessionRecord?.notes ?? activeBooking?.notes,
        paymentMethodValue,
      );
      await (updateMyBooking({
        id: bookingId,
        prepayment_status: "paid",
        ...(confirmAfterPay ? { status: "confirmed" as const } : {}),
        ...(paidNotes ? { notes: paidNotes } : {}),
      }) as { unwrap: () => Promise<unknown> }).unwrap();

      const paidBase = sessionRecord ?? activeBooking;
      if (paidBase) {
        setActiveBookingSession({
          ...paidBase,
          prepaid: true,
          requiresPrepayment: true,
          ...(confirmAfterPay ? { status: "confirmed" as const } : {}),
          ...(paidNotes ? { notes: paidNotes } : {}),
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
          : confirmAfterPay
            ? "Prepayment received. Your booking is confirmed."
            : "Prepayment received.",
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
    pendingAcceptBrAfterPrepay,
    prepaidAmount,
    refreshActiveBooking,
    selectedPaymentMethod,
    setStripeDialogOpen,
    showSnackbar,
    submitDraftBookingRequest,
    syncFinanceFromBooking,
    updateMyBooking,
  ]);

  // Heal: Fixed / BR Accepted left on unpaid path after prepaid was recorded.
  // Desired requested stays requested so the professional can Accept.
  const prepaidConfirmHealKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!apiBookingId || String(apiBookingId).startsWith("bk_draft_")) return;
    if (!isPrepaymentPaid) return;
    if (locationMode === "desired" && bookingStatus === "requested") return;
    if (bookingStatus !== "requested" && bookingStatus !== "br_accepted") return;
    const healKey = `${apiBookingId}:prepaid→confirmed`;
    if (prepaidConfirmHealKeyRef.current === healKey) return;
    prepaidConfirmHealKeyRef.current = healKey;
    let cancelled = false;
    void (async () => {
      try {
        await persistBookingPatch({
          id: apiBookingId,
          status: "confirmed",
        });
        if (cancelled) return;
        if (activeBooking) {
          setActiveBookingSession({
            ...activeBooking,
            status: "confirmed",
            prepaid: true,
          });
        }
        await refreshActiveBooking();
      } catch {
        prepaidConfirmHealKeyRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeBooking,
    apiBookingId,
    bookingStatus,
    isPrepaymentPaid,
    locationMode,
    persistBookingPatch,
    refreshActiveBooking,
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
      await (updateMyBooking({
        id: apiBookingId,
        status: "requested",
      }) as { unwrap: () => Promise<unknown> }).unwrap();
      const session = getActiveBookingSession();
      if (session) {
        const resolved = resolveCreateBookingStatus({
          locationMode: locationMode === "desired" ? "desired" : "fixed",
        });
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

  const payNowLabel = checkoutPaymentMethodSupportsPayNow(selectedPaymentMethod)
    ? "Pay Now"
    : "Request Invoice";

  return {
    isSubmittingRequest,
    submitDraftBookingRequest,
    completePrepayment,
    handlePayNow,
    handleSendBookingRequest,
    payNowLabel,
  };
}
