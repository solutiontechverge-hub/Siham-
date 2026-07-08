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

export const BOOKINGS_CHANGED_EVENT = "mollure:client_bookings_changed";

export type BookingListTab = "past" | "ongoing" | "upcoming";

const STORAGE_KEY = "mollure:client_bookings";

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
    return isPastBooking(record) ? "completed" : "confirmed";
  }
  if (isPastBooking(record)) return "completed";
  return "confirmed";
}

export function loadClientBookings(): ClientBookingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return seedDemoBookings();
    const normalized = parsed.map((b) => {
      const row = b as ClientBookingRecord;
      return { ...row, status: normalizeStatus(row) };
    });
    return normalized.length ? normalized : seedDemoBookings();
  } catch {
    return seedDemoBookings();
  }
}

export function saveClientBookings(bookings: ClientBookingRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
}

export function loadClientBookingsForList(): ClientBookingRecord[] {
  const all = loadClientBookings();
  const hasUserBooking = all.some((b) => !b.id.startsWith("demo-"));
  if (hasUserBooking) return all.filter((b) => !b.id.startsWith("demo-"));
  // Demo-only storage: refresh once when the past trio seed is missing.
  if (!all.some((b) => b.id === "demo-completed-1" && (b.draft?.total ?? 0) >= 600)) {
    const seeded = seedDemoBookings();
    saveClientBookings(seeded);
    return seeded;
  }
  return all;
}

export function upsertRequestedBooking(record: ClientBookingRecord) {
  let all = loadClientBookings();
  const idx = all.findIndex((b) => b.id === record.id);
  if (idx >= 0) {
    all = [...all];
    all[idx] = { ...all[idx], ...record };
  } else {
    all = [record, ...all];
  }
  if (!record.id.startsWith("demo-")) {
    all = all.filter((b) => !b.id.startsWith("demo-"));
  }
  saveClientBookings(all);
}

export function findClientBookingById(id: string): ClientBookingRecord | undefined {
  return loadClientBookings().find((b) => b.id === id);
}

export function removeClientBookingById(id: string) {
  const next = loadClientBookings().filter((b) => b.id !== id);
  saveClientBookings(next.length ? next : []);
}

export function markClientBookingCancelled(id: string) {
  const all = loadClientBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], status: "cancelled" };
  saveClientBookings(next);
}

export function markClientBookingPrepaid(id: string) {
  const all = loadClientBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], prepaid: true };
  saveClientBookings(next);
}

export function markClientBookingPaid(id: string) {
  const all = loadClientBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], paid: true };
  saveClientBookings(next);
}

/** Past appointment still awaiting settlement (invoice / remaining balance). */
export function isClientBookingPaymentDue(record: ClientBookingRecord): boolean {
  const status = normalizeStatus(record);
  if (status === "cancelled" || status === "no_show") return false;
  if (status !== "completed") return false;
  // Only explicitly unpaid bookings show Payment Due (not every unset `paid` flag).
  return record.paid === false;
}

export function updateClientBookingStatus(id: string, status: ClientBookingStatus) {
  const all = loadClientBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], status };
  saveClientBookings(next);
}

export function updateClientBookingStatusByRef(bookingRef: string, status: ClientBookingStatus) {
  const normalizedRef = bookingRef.replace(/^#/, "").trim();
  const all = loadClientBookings();
  const idx = all.findIndex(
    (b) => b.bookingRef === normalizedRef || b.bookingRef === bookingRef || b.id === normalizedRef,
  );
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], status };
  saveClientBookings(next);
}

function seedDemoBookings(): ClientBookingRecord[] {
  const today = new Date();
  const pastCompleted = new Date(today);
  pastCompleted.setDate(pastCompleted.getDate() - 14);
  const pastPaymentDue = new Date(today);
  pastPaymentDue.setDate(pastPaymentDue.getDate() - 5);
  const pastCancelled = new Date(today);
  pastCancelled.setDate(pastCancelled.getDate() - 3);
  const future = new Date(today);
  future.setDate(future.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return [
    // Past: exactly one completed, one payment due, one cancelled.
    {
      id: "demo-completed-1",
      status: "completed",
      paid: true,
      requiresPrepayment: true,
      prepaid: true,
      prepaymentPercent: 50,
      shop: { shopName: "Craig Martha Salon", addressLabel: "Marina-Park 50, Den Helder" },
      draft: {
        selectedDateISO: fmt(pastCompleted),
        selectedTime: "10:00 AM",
        combineServices: false,
        people: [
          { id: "p-main", name: "Sara Johnson", isRequester: true },
          { id: "p-guest", name: "Emily", participantType: "guest" },
        ],
        teamMembers: [
          { id: "tm-1", name: "Craig Martha" },
          { id: "tm-2", name: "Ryan Harris" },
        ],
        services: [
          {
            id: "s1",
            name: "Buzz Cut",
            durationMins: 45,
            price: 200,
            guestId: "p-main",
            teamMemberId: "tm-1",
          },
          {
            id: "s2",
            name: "Blow Dry",
            durationMins: 30,
            price: 200,
            guestId: "p-guest",
            teamMemberId: "tm-2",
          },
          {
            id: "s3",
            name: "Hair Treatment Add-on",
            durationMins: 20,
            price: 200,
            guestId: "p-main",
            teamMemberId: "tm-1",
            isAddOn: true,
          },
        ],
        total: 600,
      },
      createdAt: pastCompleted.toISOString(),
    },
    {
      id: "demo-payment-due-1",
      status: "completed",
      paid: false,
      shop: {
        shopName: "Ryan Harris Salon",
        addressLabel: "50, Marina-Park, 1784 AA, Den Helder, Noord-Holland",
      },
      draft: {
        selectedDateISO: fmt(pastPaymentDue),
        selectedTime: "10:20 AM",
        combineServices: false,
        services: [{ id: "s-kid", name: "kid hair", durationMins: 5, price: 50, guestId: null, teamMemberId: "tm-2" }],
        total: 50,
      },
      createdAt: pastPaymentDue.toISOString(),
    },
    {
      id: "demo-cancelled-1",
      status: "cancelled",
      shop: { shopName: "Elly Beauty", municipalityLabel: "Amsterdam" },
      draft: {
        selectedDateISO: fmt(pastCancelled),
        selectedTime: "3:30 PM",
        combineServices: false,
        services: [{ id: "s-cancel", name: "Blow Dry", durationMins: 30, price: 40, guestId: null, teamMemberId: "tm-2" }],
        total: 40,
      },
      createdAt: pastCancelled.toISOString(),
    },
    // Ongoing: confirmed for today.
    {
      id: "demo-ongoing-1",
      status: "confirmed",
      paid: true,
      shop: { shopName: "Marina Cuts", addressLabel: "Marina-Park 12, Den Helder" },
      draft: {
        selectedDateISO: fmt(today),
        selectedTime: "1:00 PM",
        combineServices: false,
        services: [{ id: "s-today", name: "Haircut", durationMins: 45, price: 35, guestId: null, teamMemberId: "tm-1" }],
        total: 35,
      },
      createdAt: today.toISOString(),
    },
    // Upcoming: near-future confirmed + pending request.
    {
      id: "demo-confirmed-1",
      status: "confirmed",
      shop: { shopName: "Elly Beauty", municipalityLabel: "Amsterdam" },
      draft: {
        selectedDateISO: fmt(future),
        selectedTime: "2:00 PM",
        combineServices: false,
        services: [{ id: "s2", name: "Make-up Basic", durationMins: 60, price: 80, guestId: null, teamMemberId: "tm-2" }],
        total: 80,
      },
      createdAt: today.toISOString(),
    },
    {
      id: "demo-requested-1",
      status: "requested",
      bookingRequestDirection: "outgoing",
      requiresPrepayment: true,
      prepaid: false,
      prepaymentPercent: 20,
      shop: {
        shopName: "Ryan Harris Salon",
        addressLabel: "Marina-Park 50, Den Helder",
      },
      draft: {
        selectedDateISO: fmt(future),
        selectedTime: "11:15 AM",
        combineServices: false,
        people: [{ id: "p-requester", name: "Guest", isRequester: true }],
        teamMembers: [{ id: "tm-2", name: "Ryan Harris" }],
        services: [
          {
            id: "s3",
            name: "Make-up Basic",
            durationMins: 60,
            price: 80,
            guestId: "p-requester",
            teamMemberId: "tm-2",
          },
          {
            id: "s4",
            name: "Lash Lift",
            durationMins: 50,
            price: 55,
            guestId: "p-requester",
            teamMemberId: "tm-2",
          },
        ],
        total: 135,
      },
      createdAt: today.toISOString(),
    },
  ];
}

export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const today = startOfDay(new Date());
  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b);
    // Cancelled / no-show always belong in Past, even if the original date is today/future.
    if (status === "cancelled" || status === "no_show") return tab === "past";
    // Past date (completed, payment due, or any other status once the day has passed).
    if (tab === "past") return isPastBooking(b, today);
    // Today's appointments only.
    if (tab === "ongoing") return isTodayBooking(b, today);
    // Near-future bookings (confirmed, requested, etc.).
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
