import type {
  BookingPerson,
  Service,
  ShopTeamMember,
} from "./booking.page.types";

/** In-progress create-page UI — survives reload until Continue / clear. */
export const CLIENT_BOOKING_CREATE_UI_DRAFT_KEY =
  "mollure:client_booking_create_ui_draft_v1";

export type ClientBookingCreateUiDraft = {
  shopId: string;
  shopName?: string;
  municipalityLabel?: string;
  addressLabel?: string;
  locationMode?: "fixed" | "desired";
  /** Matches `?t=` from Book Now so a new Book Now supersedes an old draft. */
  hydrationToken: string;
  selectedDateISO: string;
  selectedTime: string;
  combineServices: boolean;
  people: BookingPerson[];
  services: Service[];
  shopTeamMembers: ShopTeamMember[];
  selectedPersonId: string;
  selectedTeamMemberId: string;
  serviceTab: "assigned" | "unassigned";
  selectedServiceIds: Record<string, boolean>;
  bookingProjectEnabled: boolean;
  projectDescription: string;
  projectUploads: Array<{
    id: string;
    name: string;
    previewUrl: string;
    url?: string;
    mimeType?: string;
    kind?: "image" | "document";
  }>;
  clientNote: string;
  desiredVisitAddress: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  total: number;
  savedAt: string;
};

export function readClientBookingCreateUiDraft(): ClientBookingCreateUiDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CLIENT_BOOKING_CREATE_UI_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientBookingCreateUiDraft;
    if (!parsed?.shopId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeClientBookingCreateUiDraft(
  draft: ClientBookingCreateUiDraft,
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CLIENT_BOOKING_CREATE_UI_DRAFT_KEY,
      JSON.stringify(draft),
    );
  } catch {
    // Ignore quota / private mode.
  }
}

export function clearClientBookingCreateUiDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CLIENT_BOOKING_CREATE_UI_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function shouldRestoreClientBookingCreateUiDraft(args: {
  draft: ClientBookingCreateUiDraft | null;
  shopId?: string | null;
  fromProfile: boolean;
  hydrationToken: string;
}): boolean {
  const { draft, shopId, fromProfile, hydrationToken } = args;
  if (!draft?.shopId) return false;
  if (shopId && draft.shopId !== shopId) return false;
  if (fromProfile && hydrationToken && draft.hydrationToken !== hydrationToken) {
    return false;
  }
  return (draft.services?.length ?? 0) > 0 || (draft.people?.length ?? 0) > 0;
}
