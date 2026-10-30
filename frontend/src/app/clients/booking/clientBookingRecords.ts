import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { BookingEditRequestRecord } from "../../../components/common/client-booking/bookingEditRequest";
import { parseCalendarEntryNotes } from "../../../components/common/calendar/bookingEventDetails";
import {
  parseSplitBillState,
  unpaidSplitPayers,
} from "../../../components/common/calendar/salesSplitBill";
import type { BookingEditRequestPayload } from "../../../store/services/businessApi";
import { parseTimeLabelToMinutes } from "./booking-time";

export type ClientBookingStatus =
  | "draft"
  | "requested"
  | "br_accepted"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "invalid";

export type BookingRequestDirection = "outgoing" | "incoming";

export type ClientBookingRecord = {
  id: string;
  bookingRef?: string;
  apiBookingId?: string;
  status: ClientBookingStatus;
  /** True after the client sends a booking request while checkout is still draft. */
  bookingRequestSent?: boolean;
  /** BR/EBR direction from the client's perspective. */
  bookingRequestDirection?: BookingRequestDirection;
  shop?: {
    shopId?: string;
    shopName?: string;
    addressLabel?: string;
    municipalityLabel?: string;
    locationMode?: "fixed" | "desired";
  } | null;
  draft?: ClientBookingDraft | null;
  createdAt?: string;
  prepaid?: boolean;
  /** True when the booking balance / invoice has been settled. */
  paid?: boolean;
  prepaymentPercent?: number;
  requiresPrepayment?: boolean;
  contactPhone?: string;
  /** Raw booking notes (may include EBR meta). */
  notes?: string | null;
  /** Confirmed Edit Request from backend. */
  editRequest?: BookingEditRequestPayload | null;
  /** Server updated_at for unseen-update indicators. */
  updatedAt?: string | null;
  /** Who last changed the booking (for Updated pill). */
  lastEditedBy?: "client" | "professional" | null;
  /** Contact / guest name / service-order change — client shows Updated, not Edited. */
  silentUpdated?: boolean;
  /** Service/product ids marked edited in notes (pro BR update / EBR). */
  editedServiceIds?: string[];
  editedProductIds?: string[];
  /** Incoming EBR from professional, parsed from booking notes. */
  incomingEditRequest?: BookingEditRequestRecord | null;
  /** Participant ids marked no-show in notes meta (pro modal). */
  noShowParticipantIds?: string[];
  /** Soft-delete from client list without changing status. */
  hiddenForCustomer?: boolean;
  /** Counterparty action awaiting client OK acknowledgement. */
  needsOk?: boolean;
  ackRecipient?: "client" | "professional";
  ackScenario?: "BR" | "EBR" | "ER" | "E";
};

export type BookingListTab = "past" | "ongoing" | "upcoming";

/** Local wall-clock Date from YYYY-MM-DD + minutes (AM/PM-safe via parseTimeLabelToMinutes). */
function wallClockLocal(dateIso: string, minutesFromMidnight: number): Date | null {
  const m = String(dateIso).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const mins =
    ((Math.floor(minutesFromMidnight) % (24 * 60)) + 24 * 60) % (24 * 60);
  const dt = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Math.floor(mins / 60),
    mins % 60,
    0,
    0,
  );
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Start/end ms from draft date + time (+ service duration / endTime). */
export function clientBookingScheduleRangeMs(record: ClientBookingRecord): {
  startMs: number | null;
  endMs: number | null;
} {
  const dateIso = String(record.draft?.selectedDateISO ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return { startMs: null, endMs: null };
  }
  const services = record.draft?.services ?? [];
  const startLabel =
    String(record.draft?.selectedTime ?? "").trim() ||
    String(services[0]?.startTime ?? "").trim();
  const startMins = parseTimeLabelToMinutes(startLabel);
  const durationSum = services.reduce(
    (sum, s) => sum + (Number(s.durationMins) || 0),
    0,
  );
  let endMins = startMins + Math.max(15, durationSum || 60);
  for (const s of services) {
    const endLabel = String(s.endTime ?? "").trim();
    if (!endLabel) continue;
    const em = parseTimeLabelToMinutes(endLabel);
    if (em > endMins) endMins = em;
  }
  const start = wallClockLocal(dateIso, startMins);
  let end = wallClockLocal(dateIso, endMins);
  if (start && end && end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return {
    startMs: start?.getTime() ?? null,
    endMs: end?.getTime() ?? null,
  };
}

function bookingDate(record: ClientBookingRecord): Date | null {
  const iso = record.draft?.selectedDateISO;
  if (!iso) return null;
  return wallClockLocal(iso, 0);
}

/** True when scheduled end is at/before now (time-accurate; falls back to date). */
export function isClientBookingSchedulePast(
  record: ClientBookingRecord,
  now = new Date(),
): boolean {
  const { endMs } = clientBookingScheduleRangeMs(record);
  if (endMs != null) return endMs <= now.getTime();
  const d = bookingDate(record);
  if (!d) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isClientBookingScheduleStarted(
  record: ClientBookingRecord,
  now = new Date(),
): boolean {
  const { startMs } = clientBookingScheduleRangeMs(record);
  if (startMs == null) return false;
  return startMs <= now.getTime();
}

/**
 * Chip/header status from API + wall clock.
 * Confirmed→In Progress when window starts; In Progress→Completed when window ends.
 * BR states stay until Accept; never show Completed for a future start.
 */
export function resolveClientBookingDisplayStatus(
  record: ClientBookingRecord,
  now = new Date(),
): ClientBookingStatus {
  const status = normalizeStatus(record);
  if (
    status === "cancelled" ||
    status === "invalid" ||
    status === "no_show" ||
    status === "draft" ||
    status === "requested" ||
    status === "br_accepted" ||
    status === "completed"
  ) {
    return status;
  }

  const { startMs, endMs } = clientBookingScheduleRangeMs(record);
  if (startMs == null || endMs == null) return status;

  const t = now.getTime();
  if (t < startMs) {
    return status === "in_progress" ? "confirmed" : status;
  }
  if (t < endMs) {
    return "in_progress";
  }
  return status === "in_progress" ? "completed" : status;
}

/** Draft bookings are checkout-only until the client sends a booking request. */
export function isClientListVisibleBooking(record: ClientBookingRecord): boolean {
  return normalizeStatus(record) !== "draft" || Boolean(record.bookingRequestSent);
}

function isWaitingForPrepayment(record: ClientBookingRecord): boolean {
  if (!record.requiresPrepayment || record.prepaid) return false;
  const status = normalizeStatus(record);
  // €+clock while prepayment still owed (BR, accepted, or confirmed).
  return (
    status === "requested" ||
    status === "br_accepted" ||
    status === "confirmed"
  );
}

function normalizeStatus(record: ClientBookingRecord): ClientBookingStatus {
  if (record.status === "cancelled") return "cancelled";
  if (record.status === "no_show") return "no_show";
  if (record.status === "draft") return "draft";
  if (record.status === "invalid") return "invalid";
  if (record.status === "completed") return "completed";
  if (record.status === "in_progress") return "in_progress";
  if (record.status === "requested") return "requested";
  if (record.status === "br_accepted") return "br_accepted";
  if (record.status === "confirmed") return "confirmed";
  return "confirmed";
}

/** Post-booking settlement still open (In Progress payment pending, or Completed unpaid). */
export function isClientBookingPaymentDue(record: ClientBookingRecord): boolean {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "invalid") return false;
  if (status === "no_show") return record.paid === false;
  if (status !== "completed" && status !== "in_progress") return false;
  if (record.paid === false) return true;
  // In Progress after checkout may leave `paid` undefined — use notes.
  const notes = parseCalendarEntryNotes(record.notes);
  if (notes?.waitingForPayment) return true;
  if (unpaidSplitPayers(parseSplitBillState(notes?.splitBill)).length > 0) {
    return true;
  }
  return false;
}

export function listTabForClientBooking(
  record: ClientBookingRecord,
  now = new Date(),
): BookingListTab {
  const status = normalizeStatus(record);
  const display = resolveClientBookingDisplayStatus(record, now);
  const schedulePast = isClientBookingSchedulePast(record, now);
  const started = isClientBookingScheduleStarted(record, now);
  if (
    (display === "in_progress" ||
      (status === "confirmed" && started && !schedulePast)) &&
    !schedulePast
  ) {
    return "ongoing";
  }
  if (
    status === "cancelled" ||
    status === "no_show" ||
    status === "completed" ||
    display === "completed" ||
    schedulePast
  ) {
    return "past";
  }
  return "upcoming";
}

/**
 * Past     = schedule over (any status) or terminal status.
 * Ongoing  = in progress while schedule still active.
 * Upcoming = not started, schedule still ahead.
 */
export function filterBookingsByTab(
  bookings: ClientBookingRecord[],
  tab: BookingListTab,
  now = new Date(),
): ClientBookingRecord[] {
  const filtered = bookings.filter((b) => {
    if (b.hiddenForCustomer) return false;
    return listTabForClientBooking(b, now) === tab;
  });
  return filtered.sort((a, b) => {
    const dateA = bookingDate(a)?.getTime() ?? 0;
    const dateB = bookingDate(b)?.getTime() ?? 0;
    if (tab === "past") return dateB - dateA;
    if (dateA !== dateB) return dateA - dateB;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export { bookingStatusLabel as statusChipLabel } from "./clientBookingStatus";
export { isWaitingForPrepayment };
