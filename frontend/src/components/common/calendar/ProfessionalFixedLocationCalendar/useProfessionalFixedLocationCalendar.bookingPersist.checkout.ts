import * as React from "react";
import type { BookingCheckoutResult } from "../BookingCheckoutFlow";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../bookingEventDetails";
import { extractBookingId } from "../calendar.utils";
import { manualLinesFromBookingEvent } from "../bookingCheckoutItems";
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
import { getApiErrorMessage } from "../../../../lib/api-error";
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
      // Full services+products+unique (not snapshot services only) so split notes match checkout.
      const seededLines = manualLinesFromBookingEvent(current).map((line) => ({
        id: line.id,
        label:
          line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
        amount:
          Math.round(
            (line.quantity * line.unitPrice + Number.EPSILON) * 100,
          ) / 100,
      }));
      const allLines = seededLines.length ? seededLines : result.lines;
      const shares = buildSplitPaymentAmounts({
        shares: resolveSalesPayerShares({
          event: current,
          allLines,
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
      // Non-direct: payers stay unpaid (invoice); booking still Completes with due date.
      const nextSplit = isDirect
        ? markSplitPayersPaid(splitBase, result.payerKeys, result.paymentMethod)
        : splitBase;
      const stillUnpaid = nextSplit.payers.filter(
        (payer) => !payer.paid && payer.paymentAmount > 0,
      ).length;
      const allSettled = stillUnpaid === 0 && isDirect;
      const invoiceIssued = !isDirect && Boolean(result.dueDate);
      // Protective-fee checkout on Cancelled / No Show must keep that status.
      const statusLower = String(current.status ?? "").toLowerCase();
      const isProtectiveFeeCheckout =
        statusLower === "cancelled" ||
        statusLower === "canceled" ||
        statusLower === "no show" ||
        statusLower === "no_show";
      const nextStatus: CalendarEvent["status"] = isProtectiveFeeCheckout
        ? current.status
        : allSettled || invoiceIssued
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
      try {
        await persistEventStatus(editingEventId, nextStatus, {
          notes: nextNotes,
        });
      } catch (error) {
        // Toast only — return false so BookingCheckoutFlow stays on summary (no Next overlay).
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to complete checkout."),
        });
        return false;
      }
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
      const mainShare = shares.find((share) => share.role === "main_client");
      const financePayerKey =
        result.mode === "single"
          ? mainShare?.key || result.payerKey || "main-client"
          : result.payerKey || "main-client";
      const financePayerRole =
        shares.find((share) => share.key === financePayerKey)?.role ||
        (financePayerKey === mainShare?.key ? "main_client" : "guest");
      const discountAmount = result.lines
        .filter((line) => line.amount < 0)
        .reduce((sum, line) => sum + Math.abs(line.amount), 0);
      const chargeLines = result.lines.filter((line) => line.amount >= 0);

      const persistCardMeta = (financeTransactionId?: string) =>
        Promise.all(
          cardIds.map((cardId) =>
            Promise.resolve(
              upsertSalesCardMeta({
                bookingId,
                cardKind: "after_treatment",
                cardId,
                ...(financeTransactionId ? { financeTransactionId } : {}),
                paymentMethod: metaMethod,
                dueDate: result.dueDate,
                paid: isDirect,
                paidAt: isDirect ? paidAt : null,
                totalPrice: result.amount,
                ...(discountAmount > 0 ? { discountAmount } : {}),
              }),
            ),
          ),
        );

      // Await PUT so Sales meta survives refresh even if finance create fails.
      try {
        await persistCardMeta();
      } catch {
        // Booking notes already saved; finance create may still write sales_card_metadata.
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
        const created = await createFinanceTransaction({
          clientName: result.payerName || selectedClient?.name || "Client",
          clientEmail: result.clientEmail || selectedClient?.email || "",
          clientType: resolveCheckoutFinanceClientType(selectedClient),
          paymentMethod: result.paymentMethod,
          totalPrice: result.amount,
          dueDate: result.dueDate ?? undefined,
          ...(prepaidApplied > 0 ? { prepaymentAmount: prepaidApplied } : {}),
          ...(discountAmount > 0 ? { discountAmount } : {}),
          lines: chargeLines.map((line) => {
            const parts = String(line.id).split("::");
            const sourceReference = parts[0];
            const assigneeKey = parts.length >= 2 ? parts[1] : "";
            const ownerShare =
              shares.find((share) => share.key === assigneeKey) ||
              (!assigneeKey
                ? shares.find((share) => share.role === "main_client")
                : undefined);
            const sourceType =
              productIds.has(sourceReference)
                ? "productId"
                : serviceIds.has(sourceReference)
                  ? "serviceId"
                  : sourceReference.startsWith("unique-") ||
                      sourceReference === "kilometer-allowance" ||
                      sourceReference.startsWith("late-reschedule") ||
                      sourceReference.startsWith("late-cancellation") ||
                      sourceReference.startsWith("no-show")
                    ? "uniqueItemCode"
                    : "serviceId";
            // Unique catalog ids are product-shaped in booking bags — prefer uniqueItemCode.
            const resolvedType =
              sourceReference.startsWith("unique-") ||
              sourceReference === "kilometer-allowance"
                ? "uniqueItemCode"
                : sourceType;
            return {
              name: line.label,
              quantity: 1,
              unitPrice: line.amount,
              sourceReference,
              sourceType: resolvedType,
              ...(assigneeKey ? { assigneeKey } : {}),
              partyRole: ownerShare?.role ?? financePayerRole,
              partyName:
                ownerShare?.displayName ||
                ownerShare?.label ||
                result.payerName ||
                selectedClient?.name ||
                "Client",
            };
          }),
          bookingId,
          bookingRef: current.bookingCode,
          paymentPhase: "full",
          payerKey: financePayerKey,
          payerRole: financePayerRole,
          entryType: String(result.paymentMethod).startsWith("offline")
            ? "offlineBooking"
            : "onlineBooking",
          entryLabel: resolveCheckoutEntryLabel({
            mode: result.mode,
            payerLabel: result.payerLabel,
            status: current.status,
            lines: result.lines,
          }),
        }).unwrap();
        const financeTransactionId = created?.data?.id;
        if (financeTransactionId) {
          try {
            await persistCardMeta(financeTransactionId);
          } catch {
            // Backend createFinanceTransaction already ensureSalesCardMetadataForFinanceRow.
          }
        }
      } catch {
        showSnackbar({
          severity: "warning",
          message: "Payment saved on the booking, but finance sync failed.",
        });
      }

      if (allSettled || invoiceIssued) {
        showSnackbar({
          severity: "success",
          message: invoiceIssued ? "Invoice issued." : "Checkout complete.",
        });
      }
      return true;
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
