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
import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";

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
        (service) => ({
          id: service.id,
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
      const nextStatus: CalendarEvent["status"] = allSettled
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

      if (isDirect) {
        try {
          await createFinanceTransaction({
            clientName: result.payerName || selectedClient?.name || "Client",
            clientEmail:
              result.clientEmail || selectedClient?.email || "",
            clientType:
              selectedClient?.clientKind === "company" ? "company" : "individual",
            paymentMethod: result.paymentMethod as "onlineDirect" | "offlineDirect",
            totalPrice: result.amount,
            lines: result.lines.map((line) => ({
              name: line.label,
              quantity: 1,
              unitPrice: line.amount,
            })),
            bookingId,
            bookingRef: current.bookingCode,
            paymentPhase: "full",
            entryLabel: result.mode === "split" ? result.payerLabel : "After treatment",
          }).unwrap();
        } catch {
          showSnackbar({
            severity: "warning",
            message: "Payment saved on the booking, but finance sync failed.",
          });
        }
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
