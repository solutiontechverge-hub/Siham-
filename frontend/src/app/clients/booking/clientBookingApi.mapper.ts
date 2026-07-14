import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord, ClientBookingStatus } from "./clientBookingRecords";
import { fmtMinutesToTimeLabel, parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "./booking-time";
import { wallClockDateFromDateTime, wallClockTimeFromDateTime } from "../../../components/common/calendar/calendar.utils";
import { parseCalendarEntryNotes, parseStoredEbrFromNotes } from "../../../components/common/calendar/bookingEventDetails";
import type { BusinessSetupListing, CalendarBooking, CreateBookingRequest } from "../../../store/services/businessApi";
import { mapApiBookingStatusToClient } from "./clientBookingStatus";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

/** Pull a UUID out of synthetic cart ids like `profile-svc-<uuid>-0`. */
export function extractUuidFromSyntheticId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isUuid(value)) return value;
  const match = String(value).match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i,
  );
  return match && isUuid(match[1]) ? match[1] : null;
}

export function resolveSubcategoryServiceId(
  setup: BusinessSetupListing,
  catalogServiceId: string,
  serviceName?: string,
): string | null {
  const normalizedName = serviceName?.trim().toLowerCase();
  const embeddedUuid = extractUuidFromSyntheticId(catalogServiceId);
  const candidates = [catalogServiceId, embeddedUuid].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    for (const detail of setup.serviceDetails ?? []) {
      const detailId = detail.id != null ? String(detail.id) : "";
      const subcategoryId = detail.serviceId != null ? String(detail.serviceId) : "";
      if (detailId && detailId === candidate && isUuid(subcategoryId)) return subcategoryId;
      if (subcategoryId && subcategoryId === candidate) return subcategoryId;
      if (detailId && detailId === candidate && isUuid(detailId)) return detailId;
    }

    for (const entry of setup.serviceCategories ?? []) {
      const subcategoryId = String(entry.service_id ?? entry.serviceId ?? "").trim();
      if (subcategoryId && subcategoryId === candidate) return subcategoryId;
    }
  }

  for (const detail of setup.serviceDetails ?? []) {
    const subcategoryId = detail.serviceId != null ? String(detail.serviceId) : "";
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
    if (normalizedName && title.toLowerCase() === normalizedName && isUuid(subcategoryId)) {
      return subcategoryId;
    }
  }

  if (embeddedUuid) return embeddedUuid;
  return isUuid(catalogServiceId) ? catalogServiceId : null;
}

export function resolveTeamMemberId(setup: BusinessSetupListing, teamMemberId: string | null | undefined): string | null {
  if (!teamMemberId) return null;
  if (isUuid(teamMemberId)) return teamMemberId;
  const member = setup.teamMembers?.find((row) => String(row.id) === teamMemberId);
  return member?.id && isUuid(String(member.id)) ? String(member.id) : null;
}

function buildDateTimeIso(dateIso: string, minutesFromMidnight: number) {
  return buildWallClockDateTimeIso(dateIso, minutesFromMidnight);
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

function mapClientBookingRequestType(locationMode: "fixed" | "desired"): CreateBookingRequest["booking_type"] {
  return locationMode === "desired" ? "project" : "request";
}

export function buildClientBookingApiPayload(input: {
  setup: BusinessSetupListing;
  shopId: string;
  locationMode: "fixed" | "desired";
  draft: ClientBookingDraft;
  status: ClientBookingStatus;
  bookingRef: string;
  total: number;
  /** When true, creates an incoming BR for the professional (not a direct online booking). */
  asBookingRequest?: boolean;
}): CreateBookingRequest | null {
  const dateIso = input.draft.selectedDateISO;
  const startMinutes = parseTimeLabelToMinutes(input.draft.selectedTime ?? "");
  const services = input.draft.services ?? [];
  if (!dateIso || !services.length) return null;

  const durationMinutes = services.reduce((sum, service) => sum + (service.durationMins ?? 0), 0);
  const firstService = services[0] as (typeof services)[number] & { catalogServiceId?: string | null };
  const catalogId = firstService.catalogServiceId || firstService.id;
  const serviceId = resolveSubcategoryServiceId(input.setup, catalogId, firstService.name);
  const teamMemberId = resolveTeamMemberId(
    input.setup,
    firstService.teamMemberId ?? input.draft.teamMembers?.[0]?.id ?? null,
  );

  const serviceNames = services.map((service) => service.name).filter(Boolean);
  const humanNotes = serviceNames.length > 1 ? `Services: ${serviceNames.join(", ")}` : "";

  const clientSnapshot = {
    people: (input.draft.people ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isRequester: Boolean(p.isRequester),
      participantType: p.participantType,
      planningActivity: p.planningActivity,
      planningDuration: p.planningDuration,
      planningIsLocked: p.planningIsLocked,
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMins: s.durationMins,
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
    })),
    projectDetails: input.draft.projectDetails
      ? {
          description: input.draft.projectDetails.description ?? "",
          uploads: (input.draft.projectDetails.uploads ?? []).map((u) => ({
            id: u.id,
            name: u.name,
          })),
        }
      : undefined,
    teamMembers: input.draft.teamMembers ?? [],
  };

  const notes = `${humanNotes}${humanNotes ? "\n" : ""}---mollure-meta---\n${JSON.stringify({
    requestDirection: input.asBookingRequest ? "incoming" : undefined,
    clientSnapshot,
  })}`;

  return {
    booking_date: dateIso,
    business_setup_id: input.shopId,
    service_id: serviceId,
    team_member_id: teamMemberId,
    start_time: buildDateTimeIso(dateIso, startMinutes),
    end_time: buildDateTimeIso(dateIso, startMinutes + Math.max(durationMinutes, 15)),
    location_type: input.locationMode === "desired" ? "desired" : "fixed",
    status: mapApiStatus(input.status),
    booking_type: input.asBookingRequest
      ? mapClientBookingRequestType(input.locationMode)
      : mapApiBookingType(input.locationMode),
    unique_code: input.bookingRef,
    total_price: input.total,
    notes,
  };
}

function hhmmToTimeLabel(hhmm?: string | null) {
  if (!hhmm) return "";
  const match = String(hhmm).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return fmtMinutesToTimeLabel(Number(match[1]) * 60 + Number(match[2]));
}

function buildAddressLabel(booking: CalendarBooking) {
  const parts = [
    booking.fixed_location_address,
    booking.fixed_location_street_number,
    booking.fixed_location_municipality,
    booking.fixed_location_province,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.join(", ") || null;
}

function parseServiceNamesFromNotes(notes?: string | null) {
  if (!notes) return [];
  const human = String(notes).split("---mollure-meta---")[0] ?? "";
  const match = human.match(/Services:\s*(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function mapApiBookingToClientRecord(booking: CalendarBooking): ClientBookingRecord {
  const status = mapApiBookingStatusToClient(booking.status) ?? "requested";
  const dateIso =
    wallClockDateFromDateTime(booking.date || booking.booking_date || booking.start_time) ??
    String(booking.booking_date ?? "").slice(0, 10);
  const startHhmm = booking.start || wallClockTimeFromDateTime(booking.start_time);
  const endHhmm = booking.end || wallClockTimeFromDateTime(booking.end_time);
  const startLabel = hhmmToTimeLabel(startHhmm);
  const ebr = parseStoredEbrFromNotes(booking.notes);
  const notesDetails = parseCalendarEntryNotes(booking.notes);
  const clientSnapshot = notesDetails?.clientSnapshot;
  const incomingEditRequest =
    ebr && ebr.status !== "none"
      ? {
          status: ebr.status,
          suggestedAt: ebr.suggestedAt,
          professionalNote: ebr.professionalNote,
          clientNote: ebr.clientNote,
          editedServiceIds: ebr.editedServiceIds,
          editedProductIds: ebr.editedProductIds,
          suggestedServices: ebr.suggestedServices?.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            teamMemberId: service.staffResourceId ?? null,
            guestId: null as string | null,
            startTime: service.startTime,
            endTime: service.endTime,
          })),
          suggestedProducts: ebr.suggestedProducts,
        }
      : null;
  const serviceNames = parseServiceNamesFromNotes(
    incomingEditRequest?.suggestedServices?.length
      ? `Services: ${incomingEditRequest.suggestedServices.map((s) => s.name).join(", ")}`
      : booking.notes,
  );
  const title =
    incomingEditRequest?.suggestedServices?.[0]?.name ||
    booking.service_title ||
    serviceNames[0] ||
    "Booking";
  const names = incomingEditRequest?.suggestedServices?.length
    ? incomingEditRequest.suggestedServices.map((s) => s.name)
    : serviceNames.length
      ? serviceNames
      : [title];
  const total = incomingEditRequest?.suggestedServices?.length
    ? incomingEditRequest.suggestedServices.reduce((sum, s) => sum + (s.price || 0), 0) +
      (incomingEditRequest.suggestedProducts ?? []).reduce((sum, p) => sum + p.price * (p.quantity || 1), 0)
    : Number(booking.total_price) || 0;
  const durationMins = (() => {
    if (incomingEditRequest?.suggestedServices?.length) {
      return incomingEditRequest.suggestedServices.reduce((sum, s) => sum + (s.durationMins || 0), 0) || 60;
    }
    if (!startHhmm || !endHhmm) return 60;
    const [sh, sm] = startHhmm.split(":").map(Number);
    const [eh, em] = endHhmm.split(":").map(Number);
    return Math.max(15, eh * 60 + em - (sh * 60 + sm));
  })();
  const priceEach = names.length > 1 ? Math.round((total / names.length) * 100) / 100 : total;
  const prepaid = String(booking.prepayment_status ?? "").toLowerCase() === "paid";
  const isEbrIncoming = incomingEditRequest?.status === "suggested";

  return {
    id: booking.id,
    apiBookingId: booking.id,
    bookingRef: booking.unique_code ?? undefined,
    status,
    bookingRequestSent: status === "requested",
    bookingRequestDirection: isEbrIncoming
      ? "incoming"
      : status === "requested"
        ? "outgoing"
        : undefined,
    shop: {
      shopId: booking.business_setup_id,
      shopName: booking.business_name ?? "Salon",
      addressLabel: buildAddressLabel(booking) ?? undefined,
      municipalityLabel: booking.fixed_location_municipality ?? undefined,
      locationMode: booking.location_type === "desired" ? "desired" : "fixed",
    },
    draft: {
      selectedDateISO: dateIso,
      selectedTime: startLabel,
      combineServices: names.length > 1,
      people: clientSnapshot?.people?.map((p) => ({
        id: p.id,
        name: p.name,
        isRequester: p.isRequester,
        participantType: p.participantType,
        planningActivity: p.planningActivity,
        planningDuration: p.planningDuration,
        planningIsLocked: p.planningIsLocked,
      })),
      services: (() => {
        const snapshotById = new Map((clientSnapshot?.services ?? []).map((s) => [s.id, s]));
        const snapshotByName = new Map((clientSnapshot?.services ?? []).map((s) => [s.name, s]));
        const resolveGuestId = (id: string, name: string, fallback: string | null | undefined) =>
          fallback ?? snapshotById.get(id)?.guestId ?? snapshotByName.get(name)?.guestId ?? null;

        if (incomingEditRequest?.suggestedServices?.length) {
          return incomingEditRequest.suggestedServices.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: resolveGuestId(service.id, service.name, service.guestId),
            teamMemberId: service.teamMemberId ?? booking.team_member_id,
          }));
        }
        if (clientSnapshot?.services?.length) {
          return clientSnapshot.services.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            guestId: service.guestId ?? null,
            teamMemberId: service.teamMemberId ?? booking.team_member_id,
          }));
        }
        return names.map((name, index) => ({
          id: `${booking.service_id ?? booking.id}-${index}`,
          name,
          durationMins: names.length === 1 ? durationMins : Math.round(durationMins / names.length),
          price: priceEach,
          guestId: null as string | null,
          teamMemberId: booking.team_member_id,
        }));
      })(),
      teamMembers: clientSnapshot?.teamMembers?.length
        ? clientSnapshot.teamMembers
        : booking.team_member_id
          ? [{ id: booking.team_member_id, name: booking.team_member_name || "Team member" }]
          : undefined,
      projectDetails: clientSnapshot?.projectDetails
        ? {
            description: clientSnapshot.projectDetails.description ?? "",
            uploads: clientSnapshot.projectDetails.uploads ?? [],
          }
        : undefined,
      total: incomingEditRequest?.suggestedServices?.length
        ? incomingEditRequest.suggestedServices.reduce((sum, s) => sum + (s.price || 0), 0) +
          (incomingEditRequest.suggestedProducts ?? []).reduce(
            (sum, p) => sum + p.price * (p.quantity || 1),
            0,
          )
        : clientSnapshot?.services?.length
          ? clientSnapshot.services.reduce((sum, s) => sum + (s.price || 0), 0)
          : total,
    },
    createdAt: booking.created_at ?? undefined,
    prepaid,
    requiresPrepayment: prepaid || String(booking.prepayment_status ?? "").toLowerCase() === "required",
    prepaymentPercent: 0,
    contactPhone: booking.contact_number ?? undefined,
    notes: booking.notes ?? null,
    incomingEditRequest,
  };
}
