import type { CalendarBookingGuestItem } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ClientBookingDraft } from "./types";
import { UNSPECIFIED_ADDRESS_LABELS } from "./clientBookingDetails.data";

export type ClientBookingDetailsActionFeedback = {
  message: string;
  severity: "success" | "error";
};

export type ClientBookingDetailsActiveDocument = {
  type: "invoice" | "receipt";
  /** Issued/draft row for this document surface (PRE vs LCF vs booking). */
  row: unknown;
} | null;

export type ClientBookingDetailsPendingEbrSuggestSend = {
  note: string;
  editedIds: string[];
};

export function resolvePrimaryProfessional(draft: ClientBookingDraft | null) {
  const teamMembers = draft?.teamMembers ?? [];
  if (!teamMembers.length) return { name: "Professional", id: "" };
  const countById = new Map<string, number>();
  for (const s of draft?.services ?? []) {
    if (!s.teamMemberId) continue;
    countById.set(s.teamMemberId, (countById.get(s.teamMemberId) ?? 0) + 1);
  }
  let primaryId = teamMembers[0]?.id ?? "";
  let max = -1;
  for (const [id, c] of countById) {
    if (c > max) {
      max = c;
      primaryId = id;
    }
  }
  const primary =
    teamMembers.find((tm) => tm.id === primaryId) ?? teamMembers[0];
  return { name: primary?.name ?? "Professional", id: primary?.id ?? "" };
}

export function guestsFromPeopleAndServices(
  people:
    | readonly {
        id: string;
        name: string;
        isRequester?: boolean;
        participantType?: CalendarBookingGuestItem["participantType"];
      }[]
    | undefined,
  services: readonly {
    id: string;
    name: string;
    price: number;
    durationMins: number;
    startTime?: string;
    endTime?: string;
    guestId?: string | null;
    teamMemberId?: string | null;
  }[],
  fallbackGuests?: readonly CalendarBookingGuestItem[],
): CalendarBookingGuestItem[] {
  const fallbackById = new Map((fallbackGuests ?? []).map((guest) => [guest.id, guest]));
  const fromPeople = (people ?? [])
    .filter((person) => !person.isRequester)
    .map((person) => {
      const fallback = fallbackById.get(person.id);
      return {
        id: person.id,
        name: person.name,
        email: fallback?.email ?? "",
        phoneCode: fallback?.phoneCode,
        phoneNumber: fallback?.phoneNumber,
        participantType: person.participantType ?? fallback?.participantType,
        services: services.filter((service) => service.guestId === person.id),
        products: fallback?.products ?? [],
      };
    });
  if (fromPeople.length) return fromPeople;
  return [...(fallbackGuests ?? [])];
}

export function usableAddressLabel(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if ((UNSPECIFIED_ADDRESS_LABELS as readonly string[]).includes(lower)) {
    return "";
  }
  return trimmed;
}

export function resolveBookingAddressLabel(input: {
  locationMode: string;
  desiredLocation?: ClientBookingDraft["desiredLocation"] | null;
  profileFormattedAddress?: string | null;
  shopAddressLabel?: string | null;
  shopMunicipalityLabel?: string | null;
}) {
  const visit = input.desiredLocation;
  if (input.locationMode === "desired" && visit) {
    const visitLabel = [
      visit.street,
      visit.number,
      visit.postalCode,
      visit.municipality,
    ]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(", ");
    if (visitLabel) return visitLabel;
  }
  const fromProfile = usableAddressLabel(input.profileFormattedAddress);
  if (fromProfile) return fromProfile;
  const fromShop = usableAddressLabel(
    input.shopAddressLabel || input.shopMunicipalityLabel,
  );
  if (fromShop) return fromShop;
  return "";
}

export function formatBookedDateLabel(selectedDateISO?: string | null) {
  if (!selectedDateISO) return "";
  const dt = new Date(`${selectedDateISO}T00:00:00`);
  return Number.isNaN(dt.getTime())
    ? selectedDateISO
    : dt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export function computePrepaidAmount(total: number, prepaymentPercent: number) {
  return (
    Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100
  );
}

/** After prepayment: keep only Prepayment section until completed / payment due. */
export function filterVisiblePaymentSummarySections<
  T extends { id?: string; title?: string },
>(
  paymentSummarySections: readonly T[],
  flags: {
    isPrepaymentPaid: boolean;
    isOfflinePay: boolean;
    isCompleted: boolean;
    isPaymentDue: boolean;
  },
): T[] {
  if (!paymentSummarySections.length) return [];
  if (
    (flags.isPrepaymentPaid || flags.isOfflinePay) &&
    !flags.isCompleted &&
    !flags.isPaymentDue
  ) {
    // Keep Prepayment + paid Fee Summary; hide after-treatment until due/completed.
    return paymentSummarySections.filter(
      (section) =>
        section.id === "prepayment" ||
        section.title === "Prepayment" ||
        section.id === "fee-summary" ||
        section.title === "Fee Summary" ||
        (section as { variant?: string }).variant === "fee",
    );
  }
  return [...paymentSummarySections];
}
