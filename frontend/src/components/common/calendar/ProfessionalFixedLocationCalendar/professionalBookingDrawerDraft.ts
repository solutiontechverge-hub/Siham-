import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ManualEntryDiscount } from "../../../sections/finance/manualEntry.data";
import type { BookingServiceLineItem } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductLineItem } from "../../../../data/bookingProductCatalog.data";
import type { SelectedSlot } from "../calendar.utils";
import type { GenderOption } from "../../../../lib/gender-options";

/** New Booking drawer in-progress state — survives calendar reload. */
export const PRO_BOOKING_DRAWER_DRAFT_KEY =
  "mollure:pro_booking_drawer_draft_v1";

export type ProfessionalBookingDrawerDraft = {
  selectedSlot: SelectedSlot;
  slotLocation: CalendarBookingLocation;
  slotBookingType: CalendarBookingType;
  slotStatus: CalendarBookingStatus;
  slotClientAdded: boolean;
  allowDrawerTimeSelection: boolean;
  slotCalendarTouched: boolean;
  selectedClient: {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isGuest?: boolean;
    isMollure?: boolean;
  } | null;
  selectedServices: BookingServiceLineItem[];
  selectedProducts: BookingProductLineItem[];
  bookingUniqueItems: BookingProductLineItem[];
  bookingGuests: Array<{
    id: string;
    name: string;
    email?: string;
    phoneCode?: string;
    phoneNumber?: string;
    services: BookingServiceLineItem[];
    products: BookingProductLineItem[];
    participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
    planningActivity?: string;
    planningDuration?: string;
    planningStartTime?: string;
    planningEndTime?: string;
    bufferTeamMemberId?: string;
    bufferStartTime?: string;
    bufferEndTime?: string;
  }>;
  bookingProjectEnabled: boolean;
  bookingProjectDescription: string;
  bookingProjectUploads: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    url?: string;
    mimeType?: string;
    kind?: "image" | "document";
  }>;
  desiredLocationDraft: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  showInternalNote: boolean;
  bookingInternalNote: string;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: { eurPerKm: string; totalKilometer: string };
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  bookingTotalDiscount: ManualEntryDiscount | null;
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  guestDraft: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
  };
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  nonMollureClientType: "" | "individual" | "company";
  nonMollureDraft: {
    firstName: string;
    lastName: string;
    email: string;
    gender: "" | GenderOption;
    dob: string;
    phoneCode: string;
    phoneNumber: string;
    companyName: string;
    legalName: string;
    coc: string;
    vat: string;
    contactFirstName: string;
    contactLastName: string;
    street: string;
    streetNumber: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  selectionTarget: "client" | string;
  addMenuTarget: "client" | string;
  savedAt: string;
};

export function readProfessionalBookingDrawerDraft(): ProfessionalBookingDrawerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PRO_BOOKING_DRAWER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfessionalBookingDrawerDraft;
    if (!parsed?.selectedSlot?.date) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProfessionalBookingDrawerDraft(
  draft: ProfessionalBookingDrawerDraft,
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PRO_BOOKING_DRAWER_DRAFT_KEY,
      JSON.stringify(draft),
    );
  } catch {
    // Ignore quota / private mode.
  }
}

export function clearProfessionalBookingDrawerDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PRO_BOOKING_DRAWER_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function professionalBookingDrawerDraftHasContent(
  draft: ProfessionalBookingDrawerDraft | null,
): boolean {
  if (!draft) return false;
  return Boolean(
    draft.selectedClient ||
      draft.selectedServices.length ||
      draft.selectedProducts.length ||
      draft.bookingGuests.length ||
      draft.bookingUniqueItems.length ||
      draft.bookingProjectEnabled ||
      draft.bookingInternalNote.trim() ||
      draft.desiredLocationDraft.street.trim() ||
      draft.desiredLocationDraft.municipality.trim(),
  );
}
