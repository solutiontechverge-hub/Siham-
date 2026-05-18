import type { ClientBookingDraft } from "../../../components/common/client-booking/types";

export type ClientBookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export type ClientBookingRecord = {
  id: string;
  bookingRef?: string;
  status: ClientBookingStatus;
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

export const BOOKINGS_CHANGED_EVENT = "mollure:client_bookings_changed";

export type BookingListTab = "past" | "outgoing" | "upcoming";

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

function isPresentBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return true;
  return d.getTime() >= today.getTime();
}

function isPastBooking(record: ClientBookingRecord, today = startOfDay(new Date())): boolean {
  const d = bookingDate(record);
  if (!d) return false;
  return d.getTime() < today.getTime();
}

function normalizeStatus(record: ClientBookingRecord): ClientBookingStatus {
  if (record.status === "cancelled") return "cancelled";
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
  if (!hasUserBooking) return all;
  return all.filter((b) => !b.id.startsWith("demo-"));
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

function seedDemoBookings(): ClientBookingRecord[] {
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 14);
  const future = new Date(today);
  future.setDate(future.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return [
    {
      id: "demo-completed-1",
      status: "completed",
      shop: { shopName: "Craig Martha Salon", addressLabel: "Marina-Park 50, Den Helder" },
      draft: {
        selectedDateISO: fmt(past),
        selectedTime: "10:00 AM",
        combineServices: false,
        services: [{ id: "s1", name: "Buzz Cut", durationMins: 45, price: 25, guestId: null, teamMemberId: "tm-1" }],
        total: 25,
      },
      createdAt: past.toISOString(),
    },
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
      shop: { shopName: "Nina Studio", addressLabel: "Rotterdam Centrum" },
      draft: {
        selectedDateISO: fmt(future),
        selectedTime: "4:30 PM",
        combineServices: false,
        services: [{ id: "s3", name: "Hair Coloring", durationMins: 90, price: 120, guestId: null, teamMemberId: null }],
        total: 120,
      },
      createdAt: today.toISOString(),
    },
  ];
}

export function filterBookingsByTab(bookings: ClientBookingRecord[], tab: BookingListTab): ClientBookingRecord[] {
  const today = startOfDay(new Date());
  const filtered = bookings.filter((b) => {
    const status = normalizeStatus(b);
    if (tab === "past") return status === "completed";
    if (tab === "outgoing") return status === "confirmed" && isPresentBooking(b, today);
    return status === "requested";
  });
  return filtered.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function statusChipLabel(status: ClientBookingStatus, requiresPrepayment?: boolean): string {
  if (status === "completed") return "Completed";
  if (status === "confirmed") return "Confirmed";
  if (requiresPrepayment) return "Prepayment required";
  return "Awaiting approval";
}
