import type { ClientBookingDraft } from "../../../components/common/client-booking/types";

export type ClientBookingStatus =
  | "draft"
  | "requested"
  | "confirmed"
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

function isPastBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() < today.getTime();
}

function isTodayBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() === today.getTime();
}

function isFutureBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() > today.getTime();
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
  if (record.status === "confirmed") {
    const d = bookingDate(record);
    if (d && d.getTime() < startOfDay(new Date()).getTime()) return "completed";
    return "confirmed";
  }
  const d = bookingDate(record);
  if (d && d.getTime() < startOfDay(new Date()).getTime()) return "completed";
  return "confirmed";
}

/** Past appointment still awaiting settlement (invoice / remaining balance). */
export function isClientBookingPaymentDue(record: ClientBookingRecord): boolean {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "no_show") return false;
  if (status !== "completed") return false;
  return record.paid === false;
}

export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const today = startOfDay(new Date());
  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b);
    if (status === "cancelled" || status === "no_show") return tab === "past";
    if (tab === "past") return isPastBooking(b, today);
    if (tab === "ongoing") return isTodayBooking(b, today);
    return isFutureBooking(b, today);
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
