import { getBookingEditRequest } from "../client-booking/bookingEditRequest";
import { getBookingCancellationReason } from "../client-booking/bookingCancellationReason";
import {
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
} from "./bookingEventDetails";
import {
  buildActivityComparison,
  type ActivityComparison,
  type ActivityComparisonMode,
} from "./buildActivityComparison";
import type {
  BookingActivityApiEvent,
  BookingActivityBuildInput,
  BookingActivityItem,
  BookingActivityKind,
} from "./bookingActivity.types";

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

function isSalesKind(kind: BookingActivityKind): boolean {
  return (
    kind === "booking_prepaid" ||
    kind === "post_booking_paid" ||
    kind === "fee_paid" ||
    kind === "addon_paid" ||
    kind === "refund_completed"
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

function isOfflineBooking(booking: {
  booking_type?: string | null;
  unique_code?: string | null;
}): boolean {
  const type = String(booking.booking_type ?? "").toLowerCase();
  if (type === "offline") return true;
  return String(booking.unique_code ?? "")
    .toLowerCase()
    .startsWith("of");
}

function isRequestFlowBooking(booking: {
  status: string;
  booking_type?: string | null;
  unique_code?: string | null;
}, scenario?: string | null): boolean {
  if (isOfflineBooking(booking)) return false;
  if (scenario === "BR") return true;
  const status = normalizeStatus(booking.status);
  return status === "requested";
}

function mapApiKind(kind: string): BookingActivityKind {
  const k = String(kind || "").toLowerCase();
  const allowed: BookingActivityKind[] = [
    "booking_created",
    "booking_request_sent",
    "booking_accepted",
    "booking_confirmed",
    "booking_prepaid",
    "edit_request_sent",
    "edit_request_suggest",
    "edit_request_accepted",
    "booking_cancelled",
    "booking_updated",
    "post_booking_paid",
    "fee_paid",
    "addon_paid",
    "refund_completed",
  ];
  if ((allowed as string[]).includes(k)) return k as BookingActivityKind;
  return "booking_created";
}

function guestNames(
  guests?: Array<{ name?: string | null }> | null,
): string[] {
  return (guests ?? [])
    .map((guest) => (guest.name ?? "").trim())
    .filter(Boolean);
}

function flattenServices(
  services?: Array<{
    id: string;
    name: string;
    price: number;
    durationMins?: number;
    startTime?: string;
    endTime?: string;
    guestId?: string | null;
  }> | null,
  guests?: Array<{
    id?: string;
    services?: Array<{
      id: string;
      name: string;
      price: number;
      durationMins?: number;
      startTime?: string;
      endTime?: string;
      guestId?: string | null;
    }> | null;
  }> | null,
) {
  const client = [...(services ?? [])];
  const fromGuests = (guests ?? []).flatMap((guest) =>
    (guest.services ?? []).map((service) => ({
      ...service,
      guestId: service.guestId ?? guest.id ?? null,
    })),
  );
  return [...client, ...fromGuests];
}

function resolveComparisonForBooking(input: {
  mode: ActivityComparisonMode;
  notesDetails: ReturnType<typeof parseCalendarEntryNotes>;
  ebr: ReturnType<typeof parseStoredEbrFromNotes>;
  editReq: ReturnType<typeof getBookingEditRequest>;
  currentDetails?: BookingActivityBuildInput["currentDetails"];
  currentDateISO?: string | null;
  currentStart?: string | null;
  bookingDate?: string | null;
  bookingStart?: string | null;
}): ActivityComparison | null {
  const {
    mode,
    notesDetails,
    ebr,
    editReq,
    currentDetails,
    currentDateISO,
    currentStart,
    bookingDate,
    bookingStart,
  } = input;

  const details = currentDetails ?? null;
  const snapshot =
    details?.silentUpdateSnapshot ?? notesDetails?.silentUpdateSnapshot;
  const suggestedServices =
    ebr?.suggestedServices?.length
      ? ebr.suggestedServices
      : editReq.suggestedServices?.length
        ? editReq.suggestedServices
        : null;

  const liveServices = flattenServices(
    details?.services ?? notesDetails?.services,
    details?.guests ?? notesDetails?.guests,
  );
  const snapshotServices = flattenServices(
    snapshot?.services,
    snapshot?.guests,
  );
  const originalServices =
    mode === "silent_updated"
      ? snapshotServices.length
        ? snapshotServices
        : liveServices
      : details?.originalServices?.length
        ? details.originalServices
        : notesDetails?.originalServices?.length
          ? notesDetails.originalServices
          : null;

  const currentServices =
    mode === "silent_updated"
      ? liveServices
      : suggestedServices?.length
        ? suggestedServices
        : details?.services?.length
          ? details.services
          : notesDetails?.services?.length
            ? notesDetails.services
            : null;

  return buildActivityComparison({
    mode,
    originalServices,
    currentServices,
    editedServiceIds:
      details?.editedServiceIds ??
      ebr?.editedServiceIds ??
      editReq.editedServiceIds ??
      notesDetails?.editedServiceIds,
    addedServiceIds:
      details?.addedServiceIds ??
      ebr?.addedServiceIds ??
      editReq.addedServiceIds ??
      notesDetails?.addedServiceIds,
    cancelledServiceIds:
      details?.cancelledServiceIds ??
      ebr?.cancelledServiceIds ??
      editReq.cancelledServiceIds ??
      notesDetails?.cancelledServiceIds,
    originalProducts: notesDetails?.products,
    currentProducts:
      ebr?.suggestedProducts ??
      editReq.suggestedProducts ??
      details?.products ??
      notesDetails?.products,
    editedProductIds:
      details?.editedProductIds ??
      ebr?.editedProductIds ??
      editReq.editedProductIds ??
      notesDetails?.editedProductIds,
    originalDateISO:
      ebr?.originalDateISO ||
      editReq.originalDateISO ||
      (mode === "silent_updated" ? null : bookingDate) ||
      null,
    originalTime:
      ebr?.originalTime ||
      editReq.originalTime ||
      (mode === "silent_updated" ? null : bookingStart) ||
      null,
    newDateISO:
      ebr?.suggestedDateISO ||
      editReq.suggestedDateISO ||
      currentDateISO ||
      bookingDate ||
      null,
    newTime:
      ebr?.suggestedTime ||
      editReq.suggestedTime ||
      currentStart ||
      bookingStart ||
      null,
    originalPhoneCode: snapshot?.phoneCode,
    originalPhoneNumber: snapshot?.phoneNumber,
    newPhoneCode: details?.phoneCode ?? notesDetails?.phoneCode,
    newPhoneNumber: details?.phoneNumber ?? notesDetails?.phoneNumber,
    originalGuestNames: guestNames(snapshot?.guests),
    newGuestNames: guestNames(details?.guests ?? notesDetails?.guests),
    originalDesiredLocation: snapshot?.desiredLocation,
    newDesiredLocation:
      details?.desiredLocation ?? notesDetails?.desiredLocation,
  });
}

/**
 * Attach before/after comparison payloads to edit/update activity rows.
 */
function enrichItemsWithComparison(
  items: BookingActivityItem[],
  input: BookingActivityBuildInput,
): BookingActivityItem[] {
  const booking =
    input.bookings.find((row) => {
      const id = String(row.id);
      if (input.currentBookingId && id === String(input.currentBookingId)) {
        return true;
      }
      if (
        input.currentBookingCode &&
        row.unique_code &&
        row.unique_code === input.currentBookingCode
      ) {
        return true;
      }
      return false;
    }) ?? input.bookings[0];

  if (!booking && !input.currentDetails) return items;

  const code =
    input.currentBookingCode ||
    booking?.unique_code ||
    input.currentBookingId ||
    "";
  const notesDetails = parseCalendarEntryNotes(booking?.notes ?? null);
  const storedEbr = parseStoredEbrFromNotes(booking?.notes ?? null);
  const editReq = getBookingEditRequest(String(code));
  const scenario = input.currentScenario;
  const effectiveStatus = input.currentStatus
    ? normalizeStatus(input.currentStatus)
    : normalizeStatus(booking?.status ?? "");

  const comparisonMode: ActivityComparisonMode =
    scenario === "ER" ||
    (effectiveStatus === "confirmed" &&
      (editReq.status === "pending" ||
        editReq.status === "suggested" ||
        editReq.status === "approved" ||
        editReq.status === "rejected") &&
      scenario !== "EBR")
      ? "er"
      : "ebr";

  const editComparison = resolveComparisonForBooking({
    mode: comparisonMode,
    notesDetails,
    ebr: storedEbr,
    editReq,
    currentDetails: input.currentDetails,
    currentDateISO: input.currentDateISO,
    currentStart: input.currentStart,
    bookingDate: booking?.booking_date,
    bookingStart: booking?.start_time,
  });

  const silentComparison =
    input.currentDetails?.silentUpdated || notesDetails?.silentUpdated
      ? resolveComparisonForBooking({
          mode: "silent_updated",
          notesDetails,
          ebr: storedEbr,
          editReq,
          currentDetails: input.currentDetails,
          currentDateISO: input.currentDateISO,
          currentStart: input.currentStart,
          bookingDate: booking?.booking_date,
          bookingStart: booking?.start_time,
        })
      : null;

  let next = items.map((item) => {
    if (
      item.kind === "edit_request_sent" ||
      item.kind === "edit_request_suggest" ||
      item.kind === "edit_request_accepted"
    ) {
      if (!editComparison) return item;
      return {
        ...item,
        title:
          item.kind === "edit_request_sent"
            ? comparisonMode === "ebr"
              ? "Edited Booking Request sent"
              : "Edit Request sent"
            : item.title,
        hasDetailArrow: item.kind === "edit_request_sent" ? true : item.hasDetailArrow,
        detailType: "comparison" as const,
        comparison: editComparison,
      };
    }
    if (item.kind === "booking_updated" && silentComparison) {
      return {
        ...item,
        hasDetailArrow: true,
        detailType: "comparison" as const,
        comparison: silentComparison,
        subtitle:
          item.subtitle ||
          silentComparison.rows.map((row) => row.label).join(", "),
      };
    }
    return item;
  });

  const hasSilentItem = next.some((item) => item.kind === "booking_updated");
  if (
    silentComparison &&
    !hasSilentItem &&
    scenario !== "EBR" &&
    scenario !== "ER"
  ) {
    const bookingId =
      input.currentBookingId ||
      (booking ? String(booking.id) : "booking");
    const actor =
      input.currentDetails?.lastEditedBy === "client" ? "client" : "professional";
    const occurredAt =
      parseDate(booking?.updated_at)?.toISOString() || new Date().toISOString();
    pushItem(next, {
      id: `${bookingId}-updated`,
      bookingId: String(bookingId),
      bookingCode: code || undefined,
      kind: "booking_updated",
      actor,
      actorLabel:
        actor === "client" ? input.clientName?.trim() || "Client" : "Professional",
      title: "Updated",
      subtitle: silentComparison.rows.map((row) => row.label).join(", "),
      occurredAt,
      hasDetailArrow: true,
      detailType: "comparison",
      comparison: silentComparison,
      detailLines: [
        {
          label: "Booking code",
          value: String(code).startsWith("#") ? String(code) : `#${code}`,
        },
        { label: "Status", value: "Updated" },
      ],
    });
    next = next.sort((a, b) => {
      const at = parseDate(a.occurredAt)?.getTime() ?? 0;
      const bt = parseDate(b.occurredAt)?.getTime() ?? 0;
      return bt - at;
    });
  }

  return next;
}

function mapApiEventsToItems(
  events: BookingActivityApiEvent[],
  fallbackBookingId: string,
): BookingActivityItem[] {
  const items: BookingActivityItem[] = [];
  for (const event of events) {
    const kind = mapApiKind(event.kind);
    const payload = event.payload ?? {};
    const cancellationReason =
      typeof payload.cancellationReason === "string" ? payload.cancellationReason : undefined;
    pushItem(items, {
      id: event.id,
      bookingId: event.bookingId ? String(event.bookingId) : fallbackBookingId,
      bookingCode: event.bookingCode ?? undefined,
      kind,
      actor: (event.actor as BookingActivityItem["actor"]) || "system",
      actorLabel: event.actorLabel || "System",
      title: event.title,
      subtitle: event.subtitle ?? undefined,
      occurredAt: event.occurredAt,
      hasDetailArrow:
        Boolean(cancellationReason) ||
        kind === "edit_request_sent" ||
        kind === "booking_updated",
      detailType: cancellationReason
        ? "cancellation"
        : kind === "edit_request_sent" || kind === "booking_updated"
          ? "ebr"
          : undefined,
      cancellationReason,
    });
  }
  return items;
}

/**
 * Legacy fallback when no persisted activity events exist.
 * Booking-scoped only; channel-aware; never fabricates unpaid payment rows.
 */
function synthesizeBookingActivity(
  input: BookingActivityBuildInput,
): BookingActivityItem[] {
  const {
    bookings,
    currentBookingId,
    currentBookingCode,
    currentScenario,
    currentStatus,
    currentCancellationReason,
    currentProfessionalName,
    currentBookingType,
    mode,
  } = input;

  const items: BookingActivityItem[] = [];
  const clientLabel = input.clientName?.trim() || "Client";

  const relevant = bookings.filter((booking) => {
    const id = String(booking.id);
    if (currentBookingId && (id === currentBookingId || `b-${id}` === currentBookingId)) {
      return true;
    }
    if (currentBookingCode && booking.unique_code && booking.unique_code === currentBookingCode) {
      return true;
    }
    // Booking-scoped: do not merge sibling client bookings.
    return false;
  });

  for (const booking of relevant) {
    const bookingId = String(booking.id);
    const code = booking.unique_code || bookingId;
    const created = parseDate(booking.created_at || booking.start_time || booking.booking_date) ?? new Date();
    const updated = parseDate(booking.updated_at) ?? created;
    const status = normalizeStatus(booking.status);
    const prepay = String(booking.prepayment_status ?? "").toLowerCase();
    const priceSub = moneyLabel(booking.total_price);
    const effectiveStatus = currentStatus ? normalizeStatus(currentStatus) : status;
    const bookingType = currentBookingType || booking.booking_type;
    const offline = isOfflineBooking({ ...booking, booking_type: bookingType });
    const requestFlow =
      isRequestFlowBooking({ ...booking, booking_type: bookingType, status: effectiveStatus }, currentScenario) ||
      currentScenario === "BR";

    if (requestFlow && !offline) {
      pushItem(items, {
        id: `${bookingId}-request`,
        bookingId,
        bookingCode: code,
        kind: "booking_request_sent",
        actor: "client",
        actorLabel: clientLabel,
        title: "Booking Request sent",
        occurredAt: created.toISOString(),
        hasDetailArrow: false,
      });
    } else {
      pushItem(items, {
        id: `${bookingId}-created`,
        bookingId,
        bookingCode: code,
        kind: "booking_created",
        actor: offline ? "professional" : "client",
        actorLabel: offline ? "Professional" : clientLabel,
        title: prepay === "paid" ? "Booking created and prepaid" : "Booking created",
        subtitle: prepay === "paid" ? priceSub : undefined,
        occurredAt: created.toISOString(),
        hasDetailArrow: false,
      });
    }

    if (prepay === "paid") {
      pushItem(items, {
        id: `${bookingId}-prepaid`,
        bookingId,
        bookingCode: code,
        kind: "booking_prepaid",
        actor: "client",
        actorLabel: clientLabel,
        title: "Booking prepaid",
        subtitle: priceSub,
        occurredAt: created.toISOString(),
        hasDetailArrow: false,
      });
    }

    if (effectiveStatus === "confirmed" || effectiveStatus === "completed") {
      if (requestFlow && !offline) {
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
      pushItem(items, {
        id: `${bookingId}-confirmed`,
        bookingId,
        bookingCode: code,
        kind: "booking_confirmed",
        actor: "professional",
        actorLabel: "Professional",
        title: "Confirmed",
        occurredAt: created.toISOString(),
        hasDetailArrow: false,
      });
    }

    const editReq = getBookingEditRequest(code);
    const hasEbr =
      currentScenario === "EBR" ||
      currentScenario === "ER" ||
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
        currentCancellationReason?.trim() ||
        notesDetails?.cancellationReason?.trim() ||
        storedReason?.reason ||
        "";
      const professionalName =
        currentProfessionalName?.trim() ||
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

    const notesDetails = parseCalendarEntryNotes(booking.notes);
    if (notesDetails?.refunded) {
      pushItem(items, {
        id: `${bookingId}-refunded`,
        bookingId,
        bookingCode: code,
        kind: "refund_completed",
        actor: "professional",
        actorLabel: "Professional",
        title: "Refund completed",
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

export function buildBookingActivityTimeline(input: BookingActivityBuildInput): BookingActivityItem[] {
  const apiEvents = input.apiEvents;
  if (apiEvents && apiEvents.length > 0) {
    const fallbackId = input.currentBookingId || input.currentBookingCode || "booking";
    const mapped = mapApiEventsToItems(apiEvents, fallbackId);
    const filtered =
      input.mode === "sales" ? mapped.filter((item) => isSalesKind(item.kind)) : mapped;
    const sorted = filtered.sort((a, b) => {
      const at = parseDate(a.occurredAt)?.getTime() ?? 0;
      const bt = parseDate(b.occurredAt)?.getTime() ?? 0;
      return bt - at;
    });
    return enrichItemsWithComparison(sorted, input);
  }

  return enrichItemsWithComparison(synthesizeBookingActivity(input), input);
}
