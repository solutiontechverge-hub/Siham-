import { getBookingEditRequest } from "../client-booking/bookingEditRequest";
import { getBookingCancellationReason } from "../client-booking/bookingCancellationReason";
import { parseCalendarEntryNotes } from "./bookingEventDetails";
import type { BookingActivityBuildInput, BookingActivityItem, BookingActivityKind } from "./bookingActivity.types";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTimeLabel(d: Date): string {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toLowerCase()
    .replace(/am|pm/, (m) => m);
}

function moneyLabel(amount: string | number | null | undefined): string | undefined {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `Online Direct (${n.toFixed(2)} EUR)`;
}

function normalizeStatus(status: string): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function matchesClient(
  booking: BookingActivityBuildInput["bookings"][number],
  clientEmail?: string | null,
  clientName?: string | null,
): boolean {
  const email = clientEmail?.trim().toLowerCase();
  const name = clientName?.trim().toLowerCase();
  const bookingEmail = (booking.customer_email ?? "").trim().toLowerCase();
  const bookingName = (booking.customer_name || booking.client_name || "").trim().toLowerCase();

  if (email && bookingEmail && email === bookingEmail) return true;
  if (name && bookingName && name === bookingName) return true;
  return false;
}

function isSalesKind(kind: BookingActivityKind): boolean {
  return (
    kind === "booking_prepaid" ||
    kind === "post_booking_paid" ||
    kind === "fee_paid" ||
    kind === "addon_paid"
  );
}

function pushItem(items: BookingActivityItem[], item: Omit<BookingActivityItem, "dateLabel" | "timeLabel">) {
  const d = parseDate(item.occurredAt) ?? new Date();
  items.push({
    ...item,
    dateLabel: formatDateLabel(d),
    timeLabel: formatTimeLabel(d),
  });
}

export function buildBookingActivityTimeline(input: BookingActivityBuildInput): BookingActivityItem[] {
  const {
    bookings,
    clientEmail,
    clientName,
    currentBookingId,
    currentBookingCode,
    currentScenario,
    currentStatus,
    currentCancellationReason,
    currentProfessionalName,
    mode,
  } = input;

  const items: BookingActivityItem[] = [];
  const clientLabel = clientName?.trim() || "Client";

  const relevant = bookings.filter((booking) => {
    const id = String(booking.id);
    if (currentBookingId && (id === currentBookingId || `b-${id}` === currentBookingId)) return true;
    if (currentBookingCode && booking.unique_code && booking.unique_code === currentBookingCode) return true;
    return matchesClient(booking, clientEmail, clientName);
  });

  // Prefer newest first
  const sorted = [...relevant].sort((a, b) => {
    const at = parseDate(a.updated_at || a.created_at || a.start_time)?.getTime() ?? 0;
    const bt = parseDate(b.updated_at || b.created_at || b.start_time)?.getTime() ?? 0;
    return bt - at;
  });

  for (const booking of sorted) {
    const bookingId = String(booking.id);
    const code = booking.unique_code || bookingId;
    const created = parseDate(booking.created_at || booking.start_time || booking.booking_date) ?? new Date();
    const updated = parseDate(booking.updated_at) ?? created;
    const status = normalizeStatus(booking.status);
    const prepay = String(booking.prepayment_status ?? "").toLowerCase();
    const priceSub = moneyLabel(booking.total_price);
    const isCurrent =
      (currentBookingId && (bookingId === currentBookingId || `b-${bookingId}` === currentBookingId)) ||
      (currentBookingCode && booking.unique_code === currentBookingCode);

    const scenario = isCurrent ? currentScenario : undefined;
    const effectiveStatus = isCurrent && currentStatus ? normalizeStatus(currentStatus) : status;

    // Request / create
    pushItem(items, {
      id: `${bookingId}-request`,
      bookingId,
      bookingCode: code,
      kind: "booking_request_sent",
      actor: "client",
      actorLabel: clientLabel,
      title: prepay === "paid" ? "Booking created and prepaid" : "Booking Request sent",
      subtitle: prepay === "paid" ? priceSub : undefined,
      occurredAt: created.toISOString(),
      hasDetailArrow: false,
    });

    if (prepay === "paid" || prepay === "required") {
      pushItem(items, {
        id: `${bookingId}-prepaid`,
        bookingId,
        bookingCode: code,
        kind: "booking_prepaid",
        actor: "client",
        actorLabel: clientLabel,
        title: "Booking Request Prepaid",
        subtitle: priceSub,
        occurredAt: created.toISOString(),
        hasDetailArrow: false,
      });
    }

    if (effectiveStatus === "confirmed" || effectiveStatus === "completed") {
      pushItem(items, {
        id: `${bookingId}-accepted`,
        bookingId,
        bookingCode: code,
        kind: "booking_accepted",
        actor: "professional",
        actorLabel: "Professional",
        title: "Booking Request Accepted",
        occurredAt: updated.toISOString(),
        hasDetailArrow: false,
      });
    }

    // EBR from scenario or local edit-request store
    const editReq = getBookingEditRequest(code);
    const hasEbr =
      scenario === "EBR" ||
      scenario === "ER" ||
      editReq.status === "pending" ||
      editReq.status === "suggested" ||
      editReq.status === "approved" ||
      editReq.status === "rejected";

    if (hasEbr) {
      const ebrAt =
        parseDate(editReq.requestedAt || editReq.suggestedAt || editReq.approvedAt) ?? updated;
      const ebrLines = [
        { label: "Booking code", value: code.startsWith("#") ? code : `#${code}` },
        { label: "Service", value: booking.service_title || "—" },
        { label: "Status", value: editReq.status === "none" ? "Edit request" : editReq.status },
      ];
      if (editReq.professionalNote) {
        ebrLines.push({ label: "Note", value: editReq.professionalNote });
      }
      if (editReq.clientNote) {
        ebrLines.push({ label: "Client note", value: editReq.clientNote });
      }
      if (editReq.suggestedServices?.length) {
        ebrLines.push({
          label: "Suggested services",
          value: editReq.suggestedServices.map((s) => s.name).join(", "),
        });
      }

      // Arrow only on the EBR "sent" entry (not suggest/accepted), matching product mock.
      pushItem(items, {
        id: `${bookingId}-ebr-sent`,
        bookingId,
        bookingCode: code,
        kind: "edit_request_sent",
        actor: editReq.status === "suggested" ? "professional" : "client",
        actorLabel: editReq.status === "suggested" ? "Professional" : clientLabel,
        title: "Edit Request sent",
        occurredAt: ebrAt.toISOString(),
        hasDetailArrow: true,
        detailType: "ebr",
        detailLines: ebrLines,
      });

      if (editReq.status === "suggested") {
        pushItem(items, {
          id: `${bookingId}-ebr-suggest`,
          bookingId,
          bookingCode: code,
          kind: "edit_request_suggest",
          actor: "professional",
          actorLabel: "Professional",
          title: "Edit Request Suggest Change",
          occurredAt: (parseDate(editReq.suggestedAt) ?? ebrAt).toISOString(),
          hasDetailArrow: false,
          detailType: "ebr",
          detailLines: ebrLines,
        });
      }

      if (editReq.status === "pending" && editReq.clientNote) {
        pushItem(items, {
          id: `${bookingId}-ebr-client-suggest`,
          bookingId,
          bookingCode: code,
          kind: "edit_request_suggest",
          actor: "client",
          actorLabel: clientLabel,
          title: "Client Suggested Change",
          occurredAt: (parseDate(editReq.requestedAt) ?? ebrAt).toISOString(),
          hasDetailArrow: false,
          detailType: "ebr",
          detailLines: ebrLines,
        });
      }

      if (editReq.status === "approved") {
        pushItem(items, {
          id: `${bookingId}-ebr-accepted`,
          bookingId,
          bookingCode: code,
          kind: "edit_request_accepted",
          actor: "client",
          actorLabel: clientLabel,
          title: "Edit Request Accepted",
          occurredAt: (parseDate(editReq.approvedAt) ?? ebrAt).toISOString(),
          hasDetailArrow: false,
          detailType: "ebr",
          detailLines: ebrLines,
        });
      }
    }

    if (effectiveStatus === "cancelled" || effectiveStatus === "canceled") {
      const notesDetails = parseCalendarEntryNotes(booking.notes);
      const storedReason = getBookingCancellationReason(code);
      const reason =
        (isCurrent ? currentCancellationReason?.trim() : "") ||
        notesDetails?.cancellationReason?.trim() ||
        storedReason?.reason ||
        "";
      const professionalName =
        (isCurrent ? currentProfessionalName?.trim() : "") ||
        booking.team_member_name?.trim() ||
        booking.business_name?.trim() ||
        "Professional";
      const hasReason = Boolean(reason);

      pushItem(items, {
        id: `${bookingId}-cancelled`,
        bookingId,
        bookingCode: code,
        kind: "booking_cancelled",
        actor: "client",
        actorLabel: clientLabel,
        title: "Booking Cancelled",
        occurredAt: (storedReason?.cancelledAt ? parseDate(storedReason.cancelledAt) : null)?.toISOString()
          ?? updated.toISOString(),
        hasDetailArrow: hasReason,
        detailType: hasReason ? "cancellation" : undefined,
        cancellationReason: hasReason ? reason : undefined,
        professionalName,
        detailLines: hasReason
          ? [
              { label: "Booking code", value: code.startsWith("#") ? code : `#${code}` },
              { label: "Client", value: booking.customer_name || booking.client_name || clientLabel },
              { label: "Service", value: booking.service_title || "—" },
              { label: "Status", value: "Cancelled" },
              { label: "Reason", value: reason },
            ]
          : undefined,
      });
    }

    if (effectiveStatus === "completed" || prepay === "paid") {
      const notesDetails = parseCalendarEntryNotes(booking.notes);
      if (notesDetails?.refunded) {
        pushItem(items, {
          id: `${bookingId}-refunded`,
          bookingId,
          bookingCode: code,
          kind: "post_booking_paid",
          actor: "professional",
          actorLabel: "Professional",
          title: "Refund completed",
          occurredAt: updated.toISOString(),
          hasDetailArrow: false,
        });
      }
      if (notesDetails?.waitingForPayment) {
        pushItem(items, {
          id: `${bookingId}-waiting-payment`,
          bookingId,
          bookingCode: code,
          kind: "fee_paid",
          actor: "system",
          actorLabel: "System",
          title: notesDetails.invoiceDueDate
            ? `Invoice due ${notesDetails.invoiceDueDate}`
            : "Waiting for payment",
          occurredAt: updated.toISOString(),
          hasDetailArrow: false,
        });
      }
      pushItem(items, {
        id: `${bookingId}-paid`,
        bookingId,
        bookingCode: code,
        kind: "post_booking_paid",
        actor: "client",
        actorLabel: clientLabel,
        title: effectiveStatus === "completed" ? "Post Booking Paid" : "Fee paid",
        subtitle: priceSub,
        occurredAt: updated.toISOString(),
        hasDetailArrow: false,
      });
    }
  }

  const filtered = mode === "sales" ? items.filter((item) => isSalesKind(item.kind)) : items;

  return filtered.sort((a, b) => {
    const at = parseDate(a.occurredAt)?.getTime() ?? 0;
    const bt = parseDate(b.occurredAt)?.getTime() ?? 0;
    return bt - at;
  });
}
