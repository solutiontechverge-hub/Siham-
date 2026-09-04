import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { BookingEditRequestRecord } from "../../../components/common/client-booking/bookingEditRequest";
import type { BookingEditRequestPayload } from "../../../store/services/businessApi";

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
  /** Service/product ids marked edited in notes (pro BR update / EBR). */
  editedServiceIds?: string[];
  editedProductIds?: string[];
  /** Incoming EBR from professional, parsed from booking notes. */
  incomingEditRequest?: BookingEditRequestRecord | null;
  /** Soft-delete from client list without changing status. */
  hiddenForCustomer?: boolean;
  /** Counterparty action awaiting client OK acknowledgement. */
  needsOk?: boolean;
  ackRecipient?: "client" | "professional";
  ackScenario?: "BR" | "EBR" | "ER" | "E";
};

export type BookingListTab = "past" | "ongoing" | "upcoming";

function bookingDate(record: ClientBookingRecord): Date | null {
  const iso = record.draft?.selectedDateISO;
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Draft bookings are checkout-only until the client sends a booking request. */
export function isClientListVisibleBooking(record: ClientBookingRecord): boolean {
  return normalizeStatus(record) !== "draft" || Boolean(record.bookingRequestSent);
}

function isWaitingForPrepayment(record: ClientBookingRecord): boolean {
  if (!record.requiresPrepayment || record.prepaid) return false;
  return (
    record.status === "requested" ||
    record.status === "br_accepted" ||
    record.status === "confirmed"
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

/** Past appointment still awaiting settlement (invoice / remaining balance). */
export function isClientBookingPaymentDue(record: ClientBookingRecord): boolean {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "no_show" || status === "invalid") return false;
  if (status !== "completed") return false;
  return record.paid === false;
}

export function listTabForClientBooking(record: ClientBookingRecord): BookingListTab {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "no_show" || status === "completed") return "past";
  if (status === "in_progress") return "ongoing";
  return "upcoming";
}

/**
 * Upcoming = not started (requested / confirmed / invalid / waiting for prepayment).
 * Ongoing  = in progress only.
 * Past     = completed / cancelled / no-show — never requested or confirmed.
 */
export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const filtered = bookings.filter((b) => {
    if (b.hiddenForCustomer) return false;
    const status = normalizeStatus(b);
    if (status === "cancelled" || status === "no_show" || status === "completed") {
      return tab === "past";
    }
    if (status === "in_progress") return tab === "ongoing";
    if (
      status === "requested" ||
      status === "confirmed" ||
      status === "invalid"
    ) {
      return tab === "upcoming";
    }
    return tab === "upcoming";
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
