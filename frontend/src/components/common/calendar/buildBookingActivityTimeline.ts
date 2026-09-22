import { getBookingEditRequest } from "../client-booking/bookingEditRequest";
import { getBookingCancellationReason } from "../client-booking/bookingCancellationReason";
import type {
  CalendarBookingGuestItem,
  CalendarBookingServiceItem,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
} from "./bookingEventDetails";
import {
  detectServiceLineChanges,
  flattenBookingServices,
  resolveIdentityGuests,
} from "./bookingRequestNegotiation";
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

type ActivityGuestLike = {
  id?: string;
  name?: string | null;
  participantType?: CalendarBookingGuestItem["participantType"];
  services?: Array<{
    id: string;
    name: string;
    price: number;
    durationMins?: number;
    startTime?: string;
    endTime?: string;
    guestId?: string | null;
  }> | null;
};

type ActivityServiceLike = {
  id: string;
  name: string;
  price: number;
  durationMins?: number;
  startTime?: string;
  endTime?: string;
  teamMemberName?: string | null;
  staffResourceId?: string | null;
  guestId?: string | null;
};

type ActivityPersonLike = {
  id?: string;
  name?: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  isRequester?: boolean;
  participantType?: CalendarBookingGuestItem["participantType"];
};

function asGuestItems(
  guests?: readonly ActivityGuestLike[] | null,
): CalendarBookingGuestItem[] {
  return (guests ?? []).map((guest) => ({
    id: String(guest.id ?? "").trim() || (guest.name ?? "").trim(),
    name: (guest.name ?? "").trim(),
    participantType: guest.participantType,
    services: (guest.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMins: service.durationMins ?? 0,
      startTime: service.startTime,
      endTime: service.endTime,
      guestId: service.guestId ?? guest.id ?? null,
    })),
    products: [],
  }));
}

function asServiceLines(
  services?: readonly ActivityServiceLike[] | null,
): CalendarBookingServiceItem[] {
  return (services ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    durationMins: service.durationMins ?? 0,
    startTime: service.startTime,
    endTime: service.endTime,
    teamMemberName: service.teamMemberName,
    staffResourceId: service.staffResourceId ?? undefined,
    guestId: service.guestId ?? null,
  }));
}

function identityGuestNameList(
  guests?: readonly ActivityGuestLike[] | null,
  people?: readonly ActivityPersonLike[] | null,
): string[] {
  return resolveIdentityGuests(asGuestItems(guests), people ?? undefined)
    .map((guest) => guest.name.trim())
    .filter(Boolean);
}

function namesKey(names: readonly string[]) {
  return [...names].map((name) => name.trim()).filter(Boolean).join("\0");
}

function firstGuestList(
  ...lists: Array<readonly ActivityGuestLike[] | null | undefined>
): ActivityGuestLike[] {
  for (const list of lists) {
    if (list && list.length) return [...list];
  }
  return [];
}

function resolveGuestNameSides(input: {
  mode: ActivityComparisonMode;
  originalGuests?: readonly ActivityGuestLike[] | null;
  snapshotGuests?: readonly ActivityGuestLike[] | null;
  snapshotPeople?: readonly ActivityPersonLike[] | null;
  liveGuests?: readonly ActivityGuestLike[] | null;
  livePeople?: readonly ActivityPersonLike[] | null;
}): { original: string[]; next: string[] } {
  const persistedOriginal = identityGuestNameList(
    input.originalGuests,
    undefined,
  );
  const snapshotNames = identityGuestNameList(
    input.snapshotGuests,
    input.snapshotPeople,
  );
  const liveGuestNames = identityGuestNameList(input.liveGuests, undefined);
  const livePeopleNames = identityGuestNameList(undefined, input.livePeople);
  const liveNames = identityGuestNameList(input.liveGuests, input.livePeople);

  if (input.mode === "silent_updated") {
    return {
      original: snapshotNames.length ? snapshotNames : persistedOriginal,
      next: liveNames,
    };
  }

  if (persistedOriginal.length) {
    return { original: persistedOriginal, next: liveNames };
  }

  if (snapshotNames.length) {
    return { original: snapshotNames, next: liveNames };
  }

  // FL guests vs DL people: one side may still hold the pre-edit names.
  if (
    liveGuestNames.length &&
    livePeopleNames.length &&
    namesKey(liveGuestNames) !== namesKey(livePeopleNames)
  ) {
    return { original: livePeopleNames, next: liveGuestNames };
  }

  return { original: snapshotNames, next: liveNames };
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

  const liveGuests = details?.guests ?? notesDetails?.guests;
  const livePeople =
    details?.clientSnapshot?.people ?? notesDetails?.clientSnapshot?.people;
  const originalGuests = firstGuestList(
    details?.originalGuests,
    notesDetails?.originalGuests,
    snapshot?.guests,
  );
  const liveServices = flattenBookingServices({
    services: asServiceLines(details?.services ?? notesDetails?.services),
    guests: asGuestItems(liveGuests),
  });
  const snapshotServices = flattenBookingServices({
    services: asServiceLines(snapshot?.services),
    guests: asGuestItems(snapshot?.guests),
  });
  const baselineServices = asServiceLines(
    details?.originalServices?.length
      ? details.originalServices
      : notesDetails?.originalServices?.length
        ? notesDetails.originalServices
        : snapshot?.services,
  );
  const originalServices =
    mode === "silent_updated"
      ? snapshotServices.length
        ? snapshotServices
        : liveServices
      : flattenBookingServices({
          services: baselineServices,
          guests: asGuestItems(originalGuests),
        });

  const proposedServices = asServiceLines(
    suggestedServices?.length
      ? suggestedServices
      : details?.services?.length
        ? details.services
        : notesDetails?.services,
  );
  const currentServices =
    mode === "silent_updated"
      ? liveServices
      : flattenBookingServices({
          services: proposedServices,
          guests: asGuestItems(liveGuests),
        });

  const guestNames = resolveGuestNameSides({
    mode,
    originalGuests,
    snapshotGuests: snapshot?.guests,
    snapshotPeople: snapshot?.people,
    liveGuests,
    livePeople,
  });

  return buildActivityComparison({
    mode,
    originalServices,
    currentServices,
    editedServiceIds:
      details?.editedServiceIds ??
      details?.clientEditedServiceIds ??
      ebr?.editedServiceIds ??
      ebr?.clientEditedServiceIds ??
      editReq.editedServiceIds ??
      notesDetails?.editedServiceIds ??
      notesDetails?.clientEditedServiceIds,
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
    originalProducts: snapshot?.products,
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
    originalGuestNames: guestNames.original,
    newGuestNames: guestNames.next,
    originalDesiredLocation: snapshot?.desiredLocation,
    newDesiredLocation:
      details?.desiredLocation ?? notesDetails?.desiredLocation,
  });
}

/**
 * Attach before/after comparison payloads to edit/update activity rows.
 */
function sortActivityNewestFirst(items: BookingActivityItem[]) {
  return items.sort((a, b) => {
    const at = parseDate(a.occurredAt)?.getTime() ?? 0;
    const bt = parseDate(b.occurredAt)?.getTime() ?? 0;
    return bt - at;
  });
}

function hasComparisonMode(
  items: readonly BookingActivityItem[],
  mode: ActivityComparisonMode,
) {
  return items.some(
    (item) =>
      item.comparison?.mode === mode && (item.comparison.rows.length ?? 0) > 0,
  );
}

/** True only with a concrete post-create edit payload — never scenario / lastEditedBy / silent alone. */
function hasRealEditActivitySignal(input: {
  editReqStatus?: string | null;
  storedEbrStatus?: string | null;
  storedErStatus?: string | null;
  hasPersistedLineEdits: boolean;
}): boolean {
  if (input.editReqStatus && input.editReqStatus !== "none") return true;
  if (input.storedEbrStatus && input.storedEbrStatus !== "none") return true;
  if (input.storedErStatus && input.storedErStatus !== "none") return true;
  // Line-change ids / scheduleEdited from a real edit/save — not silent Updated.
  return input.hasPersistedLineEdits;
}

function isEditRequestActivityKind(kind: BookingActivityKind): boolean {
  return (
    kind === "edit_request_sent" ||
    kind === "edit_request_suggest" ||
    kind === "edit_request_accepted"
  );
}

function injectMissingComparisonItem(
  items: BookingActivityItem[],
  comparison: ActivityComparison | null,
  input: {
    bookingId: string;
    bookingCode: string;
    occurredAt: string;
    lastEditedBy?: "professional" | "client" | null;
    clientName?: string | null;
  },
) {
  if (!comparison?.rows.length) return items;
  if (hasComparisonMode(items, comparison.mode)) return items;

  const actor =
    input.lastEditedBy === "client" ? "client" : "professional";
  const isSilent = comparison.mode === "silent_updated";
  const next = [...items];
  pushItem(next, {
    id: `${input.bookingId}-${comparison.mode}-comparison`,
    bookingId: String(input.bookingId),
    bookingCode: input.bookingCode || undefined,
    kind: isSilent ? "booking_updated" : "edit_request_sent",
    actor,
    actorLabel:
      actor === "client" ? input.clientName?.trim() || "Client" : "Professional",
    title:
      comparison.mode === "ebr"
        ? "Edited Booking Request sent"
        : comparison.mode === "er"
          ? "Edit Request sent"
          : "Updated",
    subtitle: isSilent
      ? comparison.rows.map((row) => row.label).join(", ")
      : undefined,
    occurredAt: input.occurredAt,
    hasDetailArrow: true,
    detailType: "comparison",
    comparison,
  });
  return sortActivityNewestFirst(next);
}

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
  const storedEr = parseStoredErFromNotes(booking?.notes ?? null);
  const editReq = getBookingEditRequest(String(code));
  const scenario = input.currentScenario;
  const effectiveStatus = input.currentStatus
    ? normalizeStatus(input.currentStatus)
    : normalizeStatus(booking?.status ?? "");
  const lastEditedBy =
    input.currentDetails?.lastEditedBy ?? notesDetails?.lastEditedBy ?? null;
  const scheduleEdited = Boolean(
    input.currentDetails?.scheduleEdited || notesDetails?.scheduleEdited,
  );
  const silentUpdated = Boolean(
    input.currentDetails?.silentUpdated || notesDetails?.silentUpdated,
  );
  const originalForHeal = flattenBookingServices({
    services: asServiceLines(
      input.currentDetails?.originalServices?.length
        ? input.currentDetails.originalServices
        : notesDetails?.originalServices?.length
          ? notesDetails.originalServices
          : [],
    ),
    guests: asGuestItems(
      input.currentDetails?.originalGuests ??
        notesDetails?.originalGuests ??
        notesDetails?.guests,
    ),
  });
  const currentForHeal = flattenBookingServices({
    services: asServiceLines(
      input.currentDetails?.services?.length
        ? input.currentDetails.services
        : notesDetails?.services?.length
          ? notesDetails.services
          : [],
    ),
    guests: asGuestItems(input.currentDetails?.guests ?? notesDetails?.guests),
  });
  const healedLineChanges =
    originalForHeal.length > 0
      ? detectServiceLineChanges(originalForHeal, currentForHeal)
      : { added: [] as string[], edited: [] as string[], cancelled: [] as string[] };
  const hasPersistedLineIds = Boolean(
    input.currentDetails?.editedServiceIds?.length ||
      input.currentDetails?.addedServiceIds?.length ||
      input.currentDetails?.cancelledServiceIds?.length ||
      input.currentDetails?.editedProductIds?.length ||
      notesDetails?.editedServiceIds?.length ||
      notesDetails?.addedServiceIds?.length ||
      notesDetails?.cancelledServiceIds?.length,
  );
  const hasPersistedLineEdits = hasPersistedLineIds || scheduleEdited;
  // Heal wiped IDs only from real ER/EBR / persisted line ids — never silent/
  // schedule-alone (create originalServices vs guest lines looks like Adds).
  const allowHealLineDiffs =
    hasPersistedLineIds ||
    Boolean(storedEbr && storedEbr.status !== "none") ||
    Boolean(storedEr && storedEr.status !== "none") ||
    Boolean(editReq.status && editReq.status !== "none");
  const hasHealedLineEdits =
    allowHealLineDiffs &&
    Boolean(
      healedLineChanges.edited.length ||
        healedLineChanges.added.length ||
        healedLineChanges.cancelled.length,
    );
  const hasPersistedOrHealedLineEdits =
    hasPersistedLineEdits || hasHealedLineEdits;
  const hasProfessionalLineEdits =
    lastEditedBy === "professional" && hasPersistedOrHealedLineEdits;

  const allowEditActivity = hasRealEditActivitySignal({
    editReqStatus: editReq.status,
    storedEbrStatus: storedEbr?.status,
    storedErStatus: storedEr?.status,
    hasPersistedLineEdits: hasPersistedOrHealedLineEdits,
  });

  const comparisonMode: ActivityComparisonMode =
    scenario === "ER" ||
    (effectiveStatus === "confirmed" &&
      (editReq.status === "pending" ||
        editReq.status === "suggested" ||
        editReq.status === "approved" ||
        editReq.status === "rejected" ||
        hasProfessionalLineEdits ||
        (hasPersistedOrHealedLineEdits && scenario !== "EBR")) &&
      scenario !== "EBR")
      ? "er"
      : "ebr";

  const editComparison = allowEditActivity
    ? resolveComparisonForBooking({
        mode: comparisonMode,
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

  let next = allowEditActivity
    ? items
    : items.filter((item) => !isEditRequestActivityKind(item.kind));

  next = next.map((item) => {
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

  const bookingId =
    next[0]?.bookingId ||
    input.currentBookingId ||
    (booking ? String(booking.id) : "booking");
  const occurredAt =
    parseDate(booking?.updated_at)?.toISOString() || new Date().toISOString();
  const injectInput = {
    bookingId: String(bookingId),
    bookingCode: String(code),
    occurredAt,
    lastEditedBy,
    clientName: input.clientName,
  };
  // Only invent edit-request activity when a real ER/EBR signal exists.
  if (allowEditActivity) {
    next = injectMissingComparisonItem(next, editComparison, injectInput);
  }
  next = injectMissingComparisonItem(next, silentComparison, injectInput);

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

/** Collapse identical persisted rows (same kind/title/time/subtitle). */
function dedupeActivityItems(items: BookingActivityItem[]): BookingActivityItem[] {
  const seen = new Set<string>();
  const out: BookingActivityItem[] = [];
  for (const item of items) {
    const key = `${item.kind}|${item.title}|${item.occurredAt}|${item.subtitle ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
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

    // Prepaid only when prepayment_status is actually paid — never pending/required.
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
      // Accepted only for online request flows (BR / requested) — never invent for offline.
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
    const storedEbr = parseStoredEbrFromNotes(booking.notes);
    // Do not invent EBR activity from scenario alone (fresh create can look like EBR).
    const hasEbr =
      editReq.status === "pending" ||
      editReq.status === "suggested" ||
      editReq.status === "approved" ||
      editReq.status === "rejected" ||
      Boolean(storedEbr && storedEbr.status !== "none");

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
    const mapped = dedupeActivityItems(mapApiEventsToItems(apiEvents, fallbackId));
    const filtered =
      input.mode === "sales" ? mapped.filter((item) => isSalesKind(item.kind)) : mapped;
    const sorted = filtered.sort((a, b) => {
      const at = parseDate(a.occurredAt)?.getTime() ?? 0;
      const bt = parseDate(b.occurredAt)?.getTime() ?? 0;
      return bt - at;
    });
    return enrichItemsWithComparison(sorted, input);
  }

  return enrichItemsWithComparison(
    dedupeActivityItems(synthesizeBookingActivity(input)),
    input,
  );
}
