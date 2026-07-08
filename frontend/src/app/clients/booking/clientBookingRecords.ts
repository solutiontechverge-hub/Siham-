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
  prepaymentPercent?: number;
  requiresPrepayment?: boolean;
  contactPhone?: string;
};

export type BookingListTab = "past" | "outgoing" | "upcoming";

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

function isPresentBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return true;
  return d.getTime() >= today.getTime();
}

function normalizeStatus(record: ClientBookingRecord): ClientBookingStatus {
  if (record.status === "cancelled") return "cancelled";
  if (record.status === "no_show") return "no_show";
  if (record.status === "draft") return "confirmed";
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

export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const today = startOfDay(new Date());
  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b);
    if (tab === "past") {
      return status === "completed" || status === "cancelled" || status === "no_show";
    }
    if (tab === "outgoing") return status === "confirmed" && isPresentBooking(b, today);
    return status === "requested" || status === "draft" || (status === "confirmed" && isPresentBooking(b, today));
  });
  return filtered.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export { bookingStatusLabel as statusChipLabel } from "./clientBookingStatus";
