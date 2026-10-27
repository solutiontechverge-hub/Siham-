import * as React from "react";
import type { BookingCheckoutResult } from "../BookingCheckoutFlow";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { extractBookingId } from "../calendar.utils";
import {
  buildSplitBillNotesPatch,
  buildSplitPaymentAmounts,
  markSplitPayersPaid,
  parseSplitBillState,
  resolveSalesPayerShares,
} from "../salesSplitBill";
import { upsertSalesCardMeta } from "../salesOverview.storage";
import type { SalesCheckoutPaymentMethod } from "../salesOverview.types";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  isProtectiveFeeLineDescription,
  LATE_CANCELLATION_BOOKING_FEE,
  LATE_RESCHEDULING_FEE,
} from "../../finance-documents/protectiveFeeInvoice";
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

/** Payload clientType for finance create — must not map Mollure IC → nonMollure via "individual". */
export function resolveCheckoutFinanceClientType(
  selectedClient?: {
    clientKind?: "individual" | "company" | null;
    isMollure?: boolean;
    mollureUserId?: string | null;
  } | null,
): "mollure" | "nonMollure" | "business" {
  if (selectedClient?.clientKind === "company") return "business";
  if (selectedClient?.isMollure || selectedClient?.mollureUserId) return "mollure";
  return "nonMollure";
}

function resolveCheckoutEntryLabel(input: {
  mode: string;
  payerLabel?: string;
  status?: string | null;
  lines: Array<{ id?: string; label?: string }>;
}): string {
  if (input.mode === "split" && input.payerLabel) return input.payerLabel;
  const lines = input.lines ?? [];
  if (!lines.length) return "After treatment";
  const allFee = lines.every((line) => {
    const ref = String(line.id ?? "");
    return (
      ref.startsWith("late-cancellation") ||
      ref.startsWith("late-reschedule") ||
      ref.startsWith("no-show") ||
      isProtectiveFeeLineDescription(line.label)
    );
  });
  if (!allFee) return "After treatment";
  const status = String(input.status ?? "").toLowerCase();
  if (
    status === "cancelled" ||
    status === "canceled" ||
    lines.some((line) => String(line.id ?? "").startsWith("late-cancellation"))
  ) {
    return LATE_CANCELLATION_BOOKING_FEE;
  }
  if (lines.some((line) => String(line.id ?? "").startsWith("late-reschedule"))) {
    return LATE_RESCHEDULING_FEE;
  }
  if (status === "no show" || status === "no_show") return "No-show fee";
  return LATE_CANCELLATION_BOOKING_FEE;
}

export function useProfessionalFixedLocationCalendarBookingPersistCheckout(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const {
    editingEventId,
    viewingBookingEvent,
    selectedClient,
    bookingPhoneDraft,
    prepaymentAmount,
    isDrawerPrepaymentPaid,
    createFinanceTransaction,
    persistEventStatus,
    showSnackbar,
    setEvents,
    setSlotStatus,
  } = args;

  const handleBookingCheckoutSave = React.useCallback(
    async (result: BookingCheckoutResult) => {
      if (!editingEventId || !viewingBookingEvent) return;
      const current = viewingBookingEvent;
      const prepaidApplied = isDrawerPrepaymentPaid ? prepaymentAmount : 0;
      const allLines = (current.details?.clientSnapshot?.services ?? []).map(
        (service, index) => ({
          id: `${service.id}::${String(service.guestId ?? "")}::${index}`,
          label: service.name,
          amount: Number(service.price) || 0,
        }),
      );
      const shares = buildSplitPaymentAmounts({
        shares: resolveSalesPayerShares({
          event: current,
          allLines: allLines.length
            ? allLines
            : result.lines,
          mainClientName: selectedClient?.name || current.showClientName || "Client",
          mainClientEmail: selectedClient?.email || current.details?.clientEmail,
          mainClientPhone: [
            bookingPhoneDraft.phoneCode,
            bookingPhoneDraft.phoneNumber,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),
        }),
        prepaidAmount: prepaidApplied,
      });
      const existingSplit = parseSplitBillState(current.details?.splitBill);
      const basePatch = buildSplitBillNotesPatch(
        current.details,
        shares,
        prepaidApplied,
        { mode: result.mode, existing: existingSplit },
      );
      const splitBase =
        parseSplitBillState(basePatch.splitBill) ?? {
          mode: result.mode,
          prepaidAmount: prepaidApplied,
          payers: [],
        };
      const isDirect =
        result.paymentMethod === "onlineDirect" ||
        result.paymentMethod === "offlineDirect";
      // Invoice / non-direct leaves payers unpaid — stay In Progress until paid.
      const nextSplit = isDirect
        ? markSplitPayersPaid(splitBase, result.payerKeys, result.paymentMethod)
        : splitBase;
      const stillUnpaid = nextSplit.payers.filter(
        (payer) => !payer.paid && payer.paymentAmount > 0,
      ).length;
      const allSettled = stillUnpaid === 0 && isDirect;
      // Protective-fee checkout on Cancelled / No Show must keep that status.
      const statusLower = String(current.status ?? "").toLowerCase();
      const isProtectiveFeeCheckout =
        statusLower === "cancelled" ||
        statusLower === "canceled" ||
        statusLower === "no show" ||
        statusLower === "no_show";
      const nextStatus: CalendarEvent["status"] = isProtectiveFeeCheckout
        ? current.status
        : allSettled
          ? "Completed"
          : "In Progress";
      const nextDetails = {
        ...(current.details ?? {}),
        ...basePatch,
        splitBill: nextSplit,
        waitingForPayment: stillUnpaid > 0 || !isDirect,
        invoiceDueDate: result.dueDate ?? current.details?.invoiceDueDate,
      };
      const nextNotes = serializeCalendarEntryNotes(
        nextDetails.internalNote ?? "",
        nextDetails,
        parseStoredEbrFromNotes(current.notes),
        parseStoredErFromNotes(current.notes),
      );
      await persistEventStatus(editingEventId, nextStatus, {
        notes: nextNotes,
      });
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: nextStatus,
                notes: nextNotes,
                details: nextDetails,
              }
            : event,
        ),
      );
      setSlotStatus(nextStatus);

      const bookingId =
        parseApiCalendarEventId(current.id)?.id ??
        extractBookingId(current.id) ??
        current.id;
      const paidAt = new Date().toISOString();
      const metaMethod = result.paymentMethod as SalesCheckoutPaymentMethod;
      const cardIds =
        result.mode === "single"
          ? [`${bookingId}-after-treatment`]
          : result.payerKeys.map((key) =>
              key === shares.find((share) => share.role === "main_client")?.key
                ? `${bookingId}-after-treatment`
                : `${bookingId}-after-treatment-sub-${key}`,
            );
      for (const cardId of cardIds) {
        upsertSalesCardMeta({
          bookingId,
          cardKind: "after_treatment",
          cardId,
          paymentMethod: metaMethod,
          dueDate: result.dueDate,
          paid: isDirect,
          paidAt: isDirect ? paidAt : null,
          totalPrice: result.amount,
        });
      }

      try {
        const details = current.details;
        const productIds = new Set([
          ...(details?.products ?? []).map((product) => String(product.id)),
          ...(details?.guests ?? []).flatMap((guest) =>
            (guest.products ?? []).map((product) => String(product.id)),
          ),
        ]);
        const serviceIds = new Set([
          ...(details?.clientSnapshot?.services ?? []).map((service) =>
            String(service.id),
          ),
          ...(details?.services ?? []).map((service) => String(service.id)),
          ...(details?.guests ?? []).flatMap((guest) =>
            (guest.services ?? []).map((service) => String(service.id)),
          ),
        ]);
        await createFinanceTransaction({
          clientName: result.payerName || selectedClient?.name || "Client",
          clientEmail: result.clientEmail || selectedClient?.email || "",
          clientType: resolveCheckoutFinanceClientType(selectedClient),
          paymentMethod: result.paymentMethod,
          totalPrice: result.amount,
          dueDate: result.dueDate,
          lines: result.lines.map((line) => {
            const sourceReference = String(line.id).split("::")[0];
            const sourceType =
              productIds.has(sourceReference)
                ? "productId"
                : serviceIds.has(sourceReference)
                  ? "serviceId"
                  : sourceReference.startsWith("unique-") ||
                      sourceReference === "kilometer-allowance" ||
                      sourceReference.startsWith("late-reschedule") ||
                      sourceReference.startsWith("late-cancellation") ||
                      sourceReference.startsWith("no-show") ||
                      sourceReference === "discount"
                    ? "uniqueItemCode"
                    : "serviceId";
            return {
              name: line.label,
              quantity: 1,
              unitPrice: line.amount,
              sourceReference,
              sourceType,
            };
          }),
          bookingId,
          bookingRef: current.bookingCode,
          paymentPhase: "full",
          entryLabel: resolveCheckoutEntryLabel({
            mode: result.mode,
            payerLabel: result.payerLabel,
            status: current.status,
            lines: result.lines,
          }),
        }).unwrap();
      } catch {
        showSnackbar({
          severity: "warning",
          message: "Payment saved on the booking, but finance sync failed.",
        });
      }

      if (allSettled) {
        showSnackbar({
          severity: "success",
          message: "Checkout complete.",
        });
      }
    },
    [
      bookingPhoneDraft.phoneCode,
      bookingPhoneDraft.phoneNumber,
      createFinanceTransaction,
      editingEventId,
      isDrawerPrepaymentPaid,
      persistEventStatus,
      prepaymentAmount,
      selectedClient?.clientKind,
      selectedClient?.email,
      selectedClient?.name,
      showSnackbar,
      viewingBookingEvent,
    ],
  );

  return {
    handleBookingCheckoutSave,
  };
}
