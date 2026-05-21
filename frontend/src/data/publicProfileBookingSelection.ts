import type { BusinessPublicProfileBookCombo, BusinessPublicProfileData, BusinessPublicProfileService } from "./businessPublicProfile.data";
import { getServicesForLocationMode, getTeamForLocationMode } from "./businessPublicProfile.data";

export const PROFILE_BOOKING_SELECTION_KEY = "mollure:profile_booking_selection";

export type ProfileBookingServiceRow = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  teamMemberId: string | null;
};

export type ProfileBookingTeamMember = {
  id: string;
  name: string;
  locationModes: Array<"fixed" | "desired">;
};

export type PublicProfileBookingSelection = {
  shopId: string;
  shopName?: string;
  locationMode: "fixed" | "desired";
  projectEnabled: boolean;
  projectInstructions: string;
  generalNote: string;
  teamMembers: ProfileBookingTeamMember[];
  services: ProfileBookingServiceRow[];
  savedAt: string;
};

export function mergeTeamAssignmentsForExport(
  committed: Record<string, readonly string[]>,
  draft: Record<string, readonly string[]>,
): Record<string, readonly string[]> {
  const keyToMember = new Map<string, string>();

  for (const [memberId, keys] of Object.entries(committed)) {
    for (const key of keys) keyToMember.set(key, memberId);
  }
  for (const [memberId, keys] of Object.entries(draft)) {
    for (const key of keys) {
      if (!keyToMember.has(key)) keyToMember.set(key, memberId);
    }
  }

  const byMember: Record<string, string[]> = {};
  for (const [key, memberId] of keyToMember) {
    if (!byMember[memberId]) byMember[memberId] = [];
    byMember[memberId].push(key);
  }
  return byMember;
}

function findTeamMemberForAssignmentKey(
  assignments: Record<string, readonly string[]>,
  key: string,
): string | undefined {
  for (const [memberId, keys] of Object.entries(assignments)) {
    if (keys.includes(key)) return memberId;
  }
  return undefined;
}

function appendServiceRows(
  rows: ProfileBookingServiceRow[],
  service: BusinessPublicProfileService,
  quantity: number,
  teamMemberId: string | null,
) {
  const count = Math.max(1, quantity);
  for (let index = 0; index < count; index += 1) {
    rows.push({
      id: `profile-svc-${service.id}-${index}`,
      name: service.name,
      durationMins: service.durationMins,
      price: service.priceValue,
      teamMemberId,
    });
  }
}

function appendComboRow(
  rows: ProfileBookingServiceRow[],
  combo: BusinessPublicProfileBookCombo,
  teamMemberId: string | null,
) {
  rows.push({
    id: `profile-combo-${combo.id}`,
    name: `${combo.categoryLabel} + ${combo.serviceLabel}`,
    durationMins: combo.durationMins,
    price: combo.priceValue,
    teamMemberId,
  });
}

export function buildPublicProfileBookingSelection(input: {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  selectedServiceIds: Record<string, boolean>;
  serviceQty: Record<string, number>;
  selectedComboIds: Record<string, boolean>;
  teamAssignments: Record<string, readonly string[]>;
  teamDraftAssignments?: Record<string, readonly string[]>;
  projectEnabled: boolean;
}): PublicProfileBookingSelection {
  const {
    data,
    locationMode,
    selectedServiceIds,
    serviceQty,
    selectedComboIds,
    teamAssignments,
    teamDraftAssignments = {},
    projectEnabled,
  } = input;

  const effectiveTeamAssignments = mergeTeamAssignmentsForExport(teamAssignments, teamDraftAssignments);

  const catalogServices = getServicesForLocationMode(data, locationMode);
  const selectedServices = catalogServices.filter((service) => selectedServiceIds[service.id]);
  const selectedCombos = data.bookCombos.filter((combo) => selectedComboIds[combo.id]);
  const teamMembers = getTeamForLocationMode(data, locationMode).map((member) => ({
    id: member.id,
    name: member.name,
    locationModes: [...member.locationModes],
  }));

  const services: ProfileBookingServiceRow[] = [];

  for (const service of selectedServices) {
    const key = `svc:${service.id}`;
    const teamMemberId = findTeamMemberForAssignmentKey(effectiveTeamAssignments, key) ?? null;
    appendServiceRows(services, service, serviceQty[service.id] ?? 1, teamMemberId);
  }

  for (const combo of selectedCombos) {
    const key = `combo:${combo.id}`;
    const teamMemberId = findTeamMemberForAssignmentKey(effectiveTeamAssignments, key) ?? null;
    appendComboRow(services, combo, teamMemberId);
  }

  return {
    shopId: data.shopId,
    shopName: data.shopName,
    locationMode,
    projectEnabled,
    projectInstructions: data.projectInstructions || data.projectPlaceholder || "",
    generalNote: data.generalNote,
    teamMembers,
    services,
    savedAt: new Date().toISOString(),
  };
}

export function savePublicProfileBookingSelection(selection: PublicProfileBookingSelection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_BOOKING_SELECTION_KEY, JSON.stringify(selection));
}

export function loadPublicProfileBookingSelection(): PublicProfileBookingSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_BOOKING_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicProfileBookingSelection;
    if (!parsed?.shopId || !Array.isArray(parsed.services)) return null;
    return {
      ...parsed,
      savedAt: parsed.savedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function clearPublicProfileBookingSelection() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_BOOKING_SELECTION_KEY);
}
