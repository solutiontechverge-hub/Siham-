import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { BookingEditRequestRecord } from "../../../components/common/client-booking/bookingEditRequest";
import { parseTimeLabelToMinutes } from "./booking-time";

export type ClientBookingStatus =
  | "draft"
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

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
  /** Service/product ids marked edited in notes (pro BR update / EBR). */
  editedServiceIds?: string[];
  editedProductIds?: string[];
  /** Incoming EBR from professional, parsed from booking notes. */
  incomingEditRequest?: BookingEditRequestRecord | null;
};

export type BookingListTab = "past" | "ongoing" | "upcoming";

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function bookingDate(record: ClientBookingRecord): Date | null {
  const iso = record.draft?.selectedDateISO;
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function totalServiceDurationMins(record: ClientBookingRecord): number {
  const services = record.draft?.services ?? [];
  return services.reduce(
    (sum, service) => sum + (Number.isFinite(service.durationMins) ? service.durationMins : 0),
    0,
  );
}

/**
 * Booking end as a local Date (selected start time + total service duration).
 * Returns null when the start time or duration is unknown, so callers can fall
 * back to a date-only comparison.
 */
function bookingEndDateTime(record: ClientBookingRecord): Date | null {
  const iso = record.draft?.selectedDateISO;
  const timeLabel = record.draft?.selectedTime;
  if (!iso || !timeLabel) return null;
  const duration = totalServiceDurationMins(record);
  if (duration <= 0) return null;
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setMinutes(base.getMinutes() + parseTimeLabelToMinutes(timeLabel) + duration);
  return base;
}

/**
 * A booking is "ended" once its service window has passed. When the exact end
 * time cannot be computed, fall back to date-only (ended once the booking date
 * is before today).
 */
function hasBookingEnded(record: ClientBookingRecord, now = new Date()): boolean {
  const end = bookingEndDateTime(record);
  if (end) return now.getTime() >= end.getTime();
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() < startOfDay(now).getTime();
}

function isPastBooking(record: ClientBookingRecord, now = new Date()): boolean {
  return hasBookingEnded(record, now);
}

function isTodayBooking(record: ClientBookingRecord, now = new Date()): boolean {
  if (hasBookingEnded(record, now)) return false;
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() === startOfDay(now).getTime();
}

function isFutureBooking(record: ClientBookingRecord, now = new Date()): boolean {
  if (hasBookingEnded(record, now)) return false;
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() > startOfDay(now).getTime();
}

/** Draft bookings are checkout-only until the client sends a booking request. */
export function isClientListVisibleBooking(record: ClientBookingRecord): boolean {
  return normalizeStatus(record) !== "draft" || Boolean(record.bookingRequestSent);
}

function normalizeStatus(record: ClientBookingRecord): ClientBookingStatus {
  if (record.status === "cancelled") return "cancelled";
  if (record.status === "no_show") return "no_show";
  if (record.status === "draft") return "draft";
  if (record.status === "requested") return "requested";
  if (record.status === "completed") return "completed";
  if (record.status === "in_progress") {
    return hasBookingEnded(record) ? "completed" : "in_progress";
  }
  if (record.status === "confirmed") {
    return hasBookingEnded(record) ? "completed" : "confirmed";
  }
  return hasBookingEnded(record) ? "completed" : "confirmed";
}

/** Past appointment still awaiting settlement (invoice / remaining balance). */
export function isClientBookingPaymentDue(record: ClientBookingRecord): boolean {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "no_show") return false;
  if (status !== "completed") return false;
  return record.paid === false;
}

export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const now = new Date();
  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b);
    if (status === "cancelled" || status === "no_show" || status === "completed") return tab === "past";
    if (tab === "past") return isPastBooking(b, now);
    if (tab === "ongoing") return isTodayBooking(b, now);
    return isFutureBooking(b, now);
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
