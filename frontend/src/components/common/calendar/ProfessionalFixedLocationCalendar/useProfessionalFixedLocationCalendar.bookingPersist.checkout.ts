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
      const isOfflineDirect = result.paymentMethod === "offlineDirect";
      const isOnlineDirect = result.paymentMethod === "onlineDirect";
      const isDirect = isOfflineDirect || isOnlineDirect;
      // Offline Direct settles at checkout; Online Direct stays unpaid until client Pay Now.
      // Non-direct: invoice unpaid + due date.
      const nextSplit = isOfflineDirect
        ? markSplitPayersPaid(splitBase, result.payerKeys, result.paymentMethod)
        : splitBase;
      const stillUnpaid = nextSplit.payers.filter(
        (payer) => !payer.paid && payer.paymentAmount > 0,
      ).length;
      const allSettled = stillUnpaid === 0 && isOfflineDirect;
      const invoiceIssued = !isDirect && Boolean(result.dueDate);
      // Protective-fee checkout on Cancelled / No Show must keep that status.
      const statusLower = String(current.status ?? "").toLowerCase();
      const isProtectiveFeeCheckout =
        statusLower === "cancelled" ||
        statusLower === "canceled" ||
        statusLower === "no show" ||
        statusLower === "no_show";
      // After-treatment checkout Completes the service side; unpaid Online Direct
      // stays on waitingForPayment / splitBill.paid — not In Progress (that hid
      // client After Treatment Summary while prepaid was already paid).
      const nextStatus: CalendarEvent["status"] = isProtectiveFeeCheckout
        ? current.status
        : "Completed";
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
      const mainShare = shares.find((share) => share.role === "main_client");
      const discountAmount = result.lines
        .filter((line) => line.amount < 0)
        .reduce((sum, line) => sum + Math.abs(line.amount), 0);

      const cardIdForPayer = (payerKey: string) =>
        payerKey === mainShare?.key || result.mode === "single"
          ? `${bookingId}-after-treatment`
          : `${bookingId}-after-treatment-sub-${payerKey}`;

      const persistCardMeta = (
        payerKey: string,
        totalPrice: number,
        financeTransactionId?: string,
      ) =>
        Promise.resolve(
          upsertSalesCardMeta({
            bookingId,
            cardKind: "after_treatment",
            cardId: cardIdForPayer(payerKey),
            ...(financeTransactionId ? { financeTransactionId } : {}),
            paymentMethod: metaMethod,
            dueDate: result.dueDate,
            paid: isOfflineDirect,
            paidAt: isOfflineDirect ? paidAt : null,
            totalPrice,
            ...(discountAmount > 0 &&
            (payerKey === mainShare?.key || result.mode === "single")
              ? { discountAmount }
              : {}),
          }),
        );

      // Await PUT so Sales meta survives refresh even if finance create fails.
      try {
        await Promise.all(
          (result.mode === "split" ? result.payerKeys : [result.payerKey]).map(
            (key) => {
              const share = shares.find((s) => s.key === key);
              return persistCardMeta(
                key,
                share?.paymentAmount ?? result.amount,
              );
            },
          ),
        );
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

        const mapChargeLines = (
          lines: typeof result.lines,
          fallbackRole: string,
          fallbackName: string,
        ) =>
          lines
            .filter((line) => line.amount >= 0)
            .map((line) => {
              const parts = String(line.id).split("::");
              const sourceReference = parts[0];
              const assigneeKey = parts.length >= 2 ? parts[1] : "";
              const ownerShare =
                shares.find((share) => share.key === assigneeKey) ||
                (!assigneeKey
                  ? shares.find((share) => share.role === "main_client")
                  : undefined);
              const sourceType = productIds.has(sourceReference)
                ? ("productId" as const)
                : serviceIds.has(sourceReference)
                  ? ("serviceId" as const)
                  : sourceReference.startsWith("unique-") ||
                      sourceReference === "kilometer-allowance" ||
                      sourceReference.startsWith("late-reschedule") ||
                      sourceReference.startsWith("late-cancellation") ||
                      sourceReference.startsWith("no-show")
                    ? ("uniqueItemCode" as const)
                    : ("serviceId" as const);
              const resolvedType =
                sourceReference.startsWith("unique-") ||
                sourceReference === "kilometer-allowance"
                  ? ("uniqueItemCode" as const)
                  : sourceType;
              return {
                name: line.label,
                quantity: 1,
                unitPrice: line.amount,
                sourceReference,
                sourceType: resolvedType,
                ...(assigneeKey ? { assigneeKey } : {}),
                partyRole: ownerShare?.role ?? fallbackRole,
                partyName:
                  ownerShare?.displayName ||
                  ownerShare?.label ||
                  fallbackName,
              };
            });

        // Split: one finance invoice/receipt per covered payer (not one merged doc).
        const financeJobs =
          result.mode === "split"
            ? result.payerKeys.map((key) => {
                const share = shares.find((s) => s.key === key);
                // Split: only this payer's lines — never the full bill (that merges guest onto main).
                const shareLines = share?.lines?.length ? share.lines : [];
                return {
                  payerKey: key,
                  payerRole: share?.role ?? "guest",
                  clientName:
                    share?.displayName ||
                    share?.label ||
                    result.payerName ||
                    selectedClient?.name ||
                    "Client",
                  clientEmail:
                    share?.email ||
                    result.clientEmail ||
                    selectedClient?.email ||
                    "",
                  amount: share?.paymentAmount ?? result.amount,
                  lines: shareLines,
                  prepaid:
                    share?.role === "main_client" && prepaidApplied > 0
                      ? prepaidApplied
                      : 0,
                };
              })
            : [
                {
                  payerKey:
                    mainShare?.key || result.payerKey || "main-client",
                  payerRole: mainShare?.role || "main_client",
                  clientName:
                    result.payerName || selectedClient?.name || "Client",
                  clientEmail:
                    result.clientEmail || selectedClient?.email || "",
                  amount: result.amount,
                  lines: result.lines,
                  prepaid: prepaidApplied > 0 ? prepaidApplied : 0,
                },
              ];

        for (const job of financeJobs) {
          const created = await createFinanceTransaction({
            clientName: job.clientName,
            clientEmail: job.clientEmail,
            clientType: resolveCheckoutFinanceClientType(selectedClient),
            paymentMethod: result.paymentMethod,
            totalPrice: job.amount,
            dueDate: result.dueDate ?? undefined,
            ...(job.prepaid > 0 ? { prepaymentAmount: job.prepaid } : {}),
            ...(discountAmount > 0 && job.payerRole === "main_client"
              ? { discountAmount }
              : {}),
            lines: mapChargeLines(
              job.lines,
              job.payerRole,
              job.clientName,
            ),
            bookingId,
            bookingRef: current.bookingCode,
            paymentPhase: "full",
            payerKey: job.payerKey,
            payerRole: job.payerRole,
            entryType: String(result.paymentMethod).startsWith("offline")
              ? "offlineBooking"
              : "onlineBooking",
            entryLabel: resolveCheckoutEntryLabel({
              mode: result.mode,
              payerLabel:
                shares.find((s) => s.key === job.payerKey)?.label ||
                result.payerLabel,
              status: current.status,
              lines: job.lines,
            }),
          }).unwrap();
          const financeTransactionId = created?.data?.id;
          if (financeTransactionId) {
            try {
              await persistCardMeta(
                job.payerKey,
                job.amount,
                financeTransactionId,
              );
            } catch {
              // Backend createFinanceTransaction already ensureSalesCardMetadataForFinanceRow.
            }
          }
        }
      } catch {
        showSnackbar({
          severity: "warning",
          message: "Payment saved on the booking, but finance sync failed.",
        });
      }

      showSnackbar({
        severity: "success",
        message: invoiceIssued
          ? "Invoice issued."
          : allSettled
            ? "Checkout complete."
            : "Checkout saved — awaiting online payment.",
      });
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
