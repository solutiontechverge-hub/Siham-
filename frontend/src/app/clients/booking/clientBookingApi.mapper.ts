import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { ClientBookingStatus } from "./clientBookingRecords";
import { parseTimeLabelToMinutes } from "./booking-time";
import type { BusinessSetupListing, CreateBookingRequest } from "../../../store/services/businessApi";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function resolveSubcategoryServiceId(
  setup: BusinessSetupListing,
  catalogServiceId: string,
  serviceName?: string,
): string | null {
  const normalizedName = serviceName?.trim().toLowerCase();

  for (const detail of setup.serviceDetails ?? []) {
    const detailId = detail.id != null ? String(detail.id) : "";
    const subcategoryId = detail.serviceId != null ? String(detail.serviceId) : "";
    if (detailId && detailId === catalogServiceId && isUuid(subcategoryId)) return subcategoryId;
    if (subcategoryId && subcategoryId === catalogServiceId) return subcategoryId;
    if (
      normalizedName &&
      detail.serviceTitle?.trim().toLowerCase() === normalizedName &&
      isUuid(subcategoryId)
    ) {
      return subcategoryId;
    }
  }

  for (const entry of setup.serviceCategories ?? []) {
    const subcategoryId = String(entry.service_id ?? entry.serviceId ?? "").trim();
    const title = String(
      (entry as { service_title?: string; serviceTitle?: string }).service_title ??
        (entry as { service_title?: string; serviceTitle?: string }).serviceTitle ??
        "",
    ).trim();
    if (subcategoryId && subcategoryId === catalogServiceId) return subcategoryId;
    if (normalizedName && title.toLowerCase() === normalizedName && isUuid(subcategoryId)) {
      return subcategoryId;
    }
  }

  return isUuid(catalogServiceId) ? catalogServiceId : null;
}

export function resolveTeamMemberId(setup: BusinessSetupListing, teamMemberId: string | null | undefined): string | null {
  if (!teamMemberId) return null;
  if (isUuid(teamMemberId)) return teamMemberId;
  const member = setup.teamMembers?.find((row) => String(row.id) === teamMemberId);
  return member?.id && isUuid(String(member.id)) ? String(member.id) : null;
}

function buildDateTimeIso(dateIso: string, minutesFromMidnight: number) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setMinutes(date.getMinutes() + minutesFromMidnight);
  return date.toISOString();
}

function mapApiStatus(status: ClientBookingStatus): CreateBookingRequest["status"] {
  if (status === "confirmed") return "confirmed";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  return "requested";
}

function mapApiBookingType(locationMode: "fixed" | "desired"): CreateBookingRequest["booking_type"] {
  return locationMode === "desired" ? "project" : "online";
}

export function buildClientBookingApiPayload(input: {
  setup: BusinessSetupListing;
  shopId: string;
  locationMode: "fixed" | "desired";
  draft: ClientBookingDraft;
  status: ClientBookingStatus;
  bookingRef: string;
  total: number;
}): CreateBookingRequest | null {
  const dateIso = input.draft.selectedDateISO;
  const startMinutes = parseTimeLabelToMinutes(input.draft.selectedTime ?? "");
  const services = input.draft.services ?? [];
  if (!dateIso || !services.length) return null;

  const durationMinutes = services.reduce((sum, service) => sum + (service.durationMins ?? 0), 0);
  const firstService = services[0];
  const serviceId = resolveSubcategoryServiceId(input.setup, firstService.id, firstService.name);
  const teamMemberId = resolveTeamMemberId(
    input.setup,
    firstService.teamMemberId ?? input.draft.teamMembers?.[0]?.id ?? null,
  );

  const serviceNames = services.map((service) => service.name).filter(Boolean);
  const notes = serviceNames.length > 1 ? `Services: ${serviceNames.join(", ")}` : null;

  return {
    booking_date: dateIso,
    business_setup_id: input.shopId,
    service_id: serviceId,
    team_member_id: teamMemberId,
    start_time: buildDateTimeIso(dateIso, startMinutes),
    end_time: buildDateTimeIso(dateIso, startMinutes + Math.max(durationMinutes, 15)),
    location_type: input.locationMode === "desired" ? "desired" : "fixed",
    status: mapApiStatus(input.status),
    booking_type: mapApiBookingType(input.locationMode),
    unique_code: input.bookingRef,
    total_price: input.total,
    notes,
  };
}
