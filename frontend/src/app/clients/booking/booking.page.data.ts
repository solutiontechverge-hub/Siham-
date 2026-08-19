import type {
  CompanyProfile,
  IndividualProfile,
  ProfessionalProfile,
  ProfileResponse,
} from "../../../store/services/profileApi";
import type { BookingPerson } from "./booking.page.types";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FIXED_LOCATION_MAX_GUESTS = 1;

export const NOTES_PERSON_ID = "p-notes";

/** Appended to booking notes when the client leaves team member unselected. */
export const TEAM_MEMBER_PROVIDED_BY_PRO_NOTE =
  "Team member will be provided by professional";

export function servicesMissingTeamMember(
  services: Array<{ teamMemberId?: string | null } | null | undefined>,
): boolean {
  return services.some((s) => !String(s?.teamMemberId ?? "").trim());
}

/** Ensure the professional-facing note is present exactly once. */
export function withTeamMemberProvidedByProNote(
  description: string | null | undefined,
): string {
  const trimmed = String(description ?? "").trim();
  if (trimmed.includes(TEAM_MEMBER_PROVIDED_BY_PRO_NOTE)) return trimmed;
  return trimmed
    ? `${trimmed}\n${TEAM_MEMBER_PROVIDED_BY_PRO_NOTE}`
    : TEAM_MEMBER_PROVIDED_BY_PRO_NOTE;
}

export function resolveNameFromProfileResponse(
  profile: ProfileResponse | null | undefined,
): string {
  if (!profile) return "";
  if (profile.user_type === "company") {
    const companyProfile = profile.profile as CompanyProfile | null;
    return companyProfile?.legal_name?.trim() || `${companyProfile?.contact_first_name ?? ""} ${companyProfile?.contact_last_name ?? ""}`.trim() || "";
  }
  if (profile.user_type === "professional") {
    const professionalProfile = profile.profile as ProfessionalProfile | null;
    return `${professionalProfile?.contact_first_name ?? ""} ${professionalProfile?.contact_last_name ?? ""}`.trim() || professionalProfile?.legal_name?.trim() || "";
  }
  const individualProfile = profile.profile as IndividualProfile | null;
  return individualProfile?.display_name?.trim() || `${individualProfile?.first_name ?? ""} ${individualProfile?.last_name ?? ""}`.trim() || "";
}

export function resolveRequesterDisplayName(
  user: unknown,
  profileResponse?: ProfileResponse | null,
): string {
  const fromApi = resolveNameFromProfileResponse(profileResponse);
  if (fromApi) return fromApi;
  const u = user as { display_name?: string; first_name?: string; last_name?: string } | null;
  return u?.display_name?.trim() || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Guest";
}

export function isAdditionalGuest(p: BookingPerson): boolean {
  return !p.isRequester && p.participantType === "guest";
}

export function isNotesPerson(p: Pick<BookingPerson, "id" | "name" | "participantType">): boolean {
  return (
    p.participantType === "notes" ||
    p.id === NOTES_PERSON_ID ||
    p.name.trim().toLowerCase() === "notes"
  );
}

export function createNotesPerson(): BookingPerson {
  return {
    id: NOTES_PERSON_ID,
    name: "Notes",
    isRequester: false,
    participantType: "notes",
  };
}

export function resolveProfileCatalogService(
  opt: { value: string; label: string },
  locationCatalog: Array<{
    id: string;
    name: string;
    durationMins: number;
    priceValue: number;
  }>,
): (typeof locationCatalog)[number] | undefined {
  const value = String(opt.value ?? "").trim();
  const labelKey = String(opt.label ?? "").trim().toLowerCase();

  if (value) {
    const exact = locationCatalog.find((service) => String(service.id) === value);
    if (exact) return exact;
  }

  if (labelKey) {
    const byName = locationCatalog.find(
      (service) => service.name.trim().toLowerCase() === labelKey,
    );
    if (byName) return byName;
  }

  if (value) {
    return locationCatalog.find(
      (service) =>
        String(service.id).endsWith(value) || value.endsWith(String(service.id)),
    );
  }

  return undefined;
}

/** Modal list: same prices as profile (`serviceDetails`), optionally filtered by team member. */
export function buildAddServiceCatalog(
  locationCatalog: Array<{
    id: string;
    name: string;
    durationMins: number;
    price: number;
    originalPrice?: number;
    discountPct?: number;
  }>,
  memberItems?: Array<{ id: string; name: string }>,
): Array<{
  id: string;
  name: string;
  durationMins: number;
  price: number;
  originalPrice?: number;
  discountPct?: number;
}> {
  if (!locationCatalog.length) return [];
  if (!memberItems?.length) return locationCatalog;

  const byId = new Map(locationCatalog.map((service) => [service.id, service]));
  const byName = new Map(
    locationCatalog.map((service) => [service.name.trim().toLowerCase(), service]),
  );

  const matched: typeof locationCatalog = [];
  const seen = new Set<string>();

  for (const item of memberItems) {
    const catalogEntry =
      byId.get(item.id) ??
      byName.get(item.name.trim().toLowerCase()) ??
      locationCatalog.find(
        (service) =>
          String(service.id) === String(item.id) ||
          String(service.id).endsWith(String(item.id)) ||
          String(item.id).endsWith(String(service.id)),
      );
    if (!catalogEntry || seen.has(catalogEntry.id)) continue;
    seen.add(catalogEntry.id);
    matched.push(catalogEntry);
  }

  // Stale assignedServices (e.g. old "Color") with no catalog match → show full shop list.
  return matched.length > 0 ? matched : locationCatalog;
}
