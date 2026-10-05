import type {
  ClientBookingDraft,
  ClientBookingDraftPerson,
} from "../../../components/common/client-booking/types";
import type {
  CalendarBookingGuestItem,
  CalendarBookingClientSnapshot,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ClientBookingRecord, ClientBookingStatus } from "./clientBookingRecords";
import { fmtMinutesToTimeLabel, parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "./booking-time";
import { wallClockDateFromDateTime, wallClockTimeFromDateTime } from "../../../components/common/calendar/calendar.utils";
import { parseCalendarEntryNotes, parseStoredEbrFromNotes, resolveKilometerAllowanceAmount } from "../../../components/common/calendar/bookingEventDetails";
import { unpaidSplitPayers, parseSplitBillState } from "../../../components/common/calendar/salesSplitBill";
import { summarizeClientBookingPrice } from "../../../components/common/calendar/bookingTotal";
import { buildResponseDeadline } from "../../../components/common/calendar/bookingResponseDeadline";
import { syncEditRequestFromBookingApi } from "../../../components/common/client-booking/syncEditRequestFromApi";
import { mergeBookingTeamMembers } from "../../../components/common/client-booking/buildBookingSummarySections";
import {
  mergeBookingClientSnapshots,
  slimClientSnapshotForLocationDetails,
} from "../../../components/common/calendar/mergeBookingClientSnapshot";
import {
  canonicalParticipantRank,
  dedupePlanningPeople,
  extraBookingParticipantIds,
  dedupeServicesByOwner,
} from "../../../data/bookingChronologicalBlocks";
import { isProjectUploadImage, resolveBookingProjectUploads } from "../../../lib/projectUploadMedia";
import { isUuid } from "../../../lib/uuid";
import type { BusinessSetupListing, CalendarBooking, CreateBookingRequest } from "../../../store/services/businessApi";
import { mapApiBookingStatusToClient, mapClientStatusToApi } from "./clientBookingStatus";
import { effectiveServiceAmount } from "../../../data/bookingLinePricing";

function withClientDiscountFields(service: {
  price: number;
  originalPrice?: number;
  discountPct?: number;
  discount?: { type: "fixed" | "percentage"; amount: number } | null;
}) {
  const net = effectiveServiceAmount(service);
  const original = Number(service.originalPrice ?? service.price) || net;
  return {
    price: net,
    originalPrice: original > net ? original : undefined,
    discountPct:
      service.discount?.type === "percentage"
        ? service.discount.amount
        : service.discountPct,
    discountType: service.discount?.type,
    discountAmount: service.discount?.amount,
  };
}

type SnapshotPerson = NonNullable<CalendarBookingClientSnapshot["people"]>[number];
type StoredGuest = CalendarBookingGuestItem;

function mapDraftPerson(
  person: SnapshotPerson | StoredGuest,
  extras?: Partial<ClientBookingDraftPerson>,
): ClientBookingDraftPerson {
  const snapshot = person as SnapshotPerson;
  const guest = person as StoredGuest;
  return {
    id: person.id,
    name: person.name,
    isRequester: Boolean(snapshot.isRequester),
    participantType: person.participantType,
    planningActivity: person.planningActivity,
    planningDuration: person.planningDuration,
    planningIsLocked: snapshot.planningIsLocked,
    planningStartTime: person.planningStartTime,
    planningEndTime: person.planningEndTime,
    bufferStartTime: person.bufferStartTime ?? guest.bufferStartTime,
    bufferEndTime: person.bufferEndTime ?? guest.bufferEndTime,
    bufferTeamMemberId:
      snapshot.bufferTeamMemberId ?? guest.bufferTeamMemberId,
    ...extras,
  };
}

function mergeDraftPeople(
  snapshotPeople: SnapshotPerson[] | undefined,
  guests: StoredGuest[] | undefined,
): ClientBookingDraftPerson[] | undefined {
  const people = (snapshotPeople ?? [])
    .filter(
      (person) =>
        person.participantType !== "notes" &&
        person.id !== "p-notes",
    )
    .map((person) => mapDraftPerson(person));
  const byId = new Map(people.map((person) => [String(person.id), person]));
  for (const guest of guests ?? []) {
    if (guest.participantType === "notes" || guest.id === "p-notes") {
      continue;
    }
    const existing = byId.get(String(guest.id));
    if (existing) {
      existing.participantType = existing.participantType ?? guest.participantType;
      existing.planningActivity = existing.planningActivity || guest.planningActivity;
      existing.planningDuration = existing.planningDuration || guest.planningDuration;
      existing.planningStartTime = existing.planningStartTime || guest.planningStartTime;
      existing.planningEndTime = existing.planningEndTime || guest.planningEndTime;
      existing.bufferStartTime = existing.bufferStartTime || guest.bufferStartTime;
      existing.bufferEndTime = existing.bufferEndTime || guest.bufferEndTime;
      existing.bufferTeamMemberId =
        existing.bufferTeamMemberId || guest.bufferTeamMemberId;
      if (!existing.name?.trim() && guest.name?.trim()) existing.name = guest.name;
      continue;
    }
    const mapped = mapDraftPerson(guest, { isRequester: false });
    people.push(mapped);
    byId.set(String(mapped.id), mapped);
  }
  const deduped = dedupePlanningPeople(people);
  deduped.sort((a, b) => {
    const aType = a.isRequester ? "requester" : a.participantType;
    const bType = b.isRequester ? "requester" : b.participantType;
    return canonicalParticipantRank(aType) - canonicalParticipantRank(bType);
  });
  return deduped.length ? deduped : undefined;
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
  return mapClientStatusToApi(status) as CreateBookingRequest["status"];
}

export function hasProjectBookingContent(draft: {
  projectDetails?: { description?: string; uploads?: unknown[] } | null;
}): boolean {
  const description = draft.projectDetails?.description?.trim() ?? "";
  const uploads = draft.projectDetails?.uploads?.length ?? 0;
  return Boolean(description || uploads);
}

function mapApiBookingType(
  locationMode: "fixed" | "desired",
  hasProject = false,
): CreateBookingRequest["booking_type"] {
  if (locationMode === "desired") return hasProject ? "project" : "request";
  return "online";
}

function mapClientBookingRequestType(
  locationMode: "fixed" | "desired",
  hasProject = false,
): CreateBookingRequest["booking_type"] {
  if (locationMode === "desired") return hasProject ? "project" : "request";
  return "request";
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
  /** Fixed-location pay-before: persist prepayment requirement on create. */
  requiresPrepayment?: boolean;
  prepaymentPercent?: number;
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

  const projectUploads = input.draft.projectDetails?.uploads ?? [];
  const projectDescription = input.draft.projectDetails?.description?.trim() || "";
  const desiredLocation = input.draft.desiredLocation;
  const hasDesiredVisitAddress =
    input.locationMode === "desired" &&
    Boolean(
      desiredLocation?.street?.trim() ||
        desiredLocation?.number?.trim() ||
        desiredLocation?.postalCode?.trim() ||
        desiredLocation?.province?.trim() ||
        desiredLocation?.municipality?.trim(),
    );

  const imageUrls = projectUploads
    .filter((u) => u.url && isProjectUploadImage(u))
    .map((u) => u.url as string);
  const documentUrls = projectUploads
    .filter((u) => u.url && !isProjectUploadImage(u))
    .map((u) => u.url as string);

  // IC client notes become the professional Internal Note; project/services stay in meta.
  const humanNotes = (input.draft.clientNote ?? "").trim();

  const clientSnapshot = {
    people: (input.draft.people ?? [])
      .filter((p) => p.participantType !== "notes" && p.id !== "p-notes")
      .map((p) => ({
      id: p.id,
      name: p.name,
      isRequester: Boolean(p.isRequester),
      participantType: p.participantType,
      planningActivity: p.planningActivity,
      planningDuration: p.planningDuration,
      planningIsLocked: p.planningIsLocked,
      planningStartTime: p.planningStartTime,
      planningEndTime: p.planningEndTime,
      bufferStartTime: p.bufferStartTime,
      bufferEndTime: p.bufferEndTime,
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMins: s.durationMins,
      startTime: s.startTime,
      endTime: s.endTime,
      guestId: s.guestId ?? null,
      teamMemberId: s.teamMemberId ?? null,
      teamMemberName:
        s.teamMemberName ??
        input.draft.teamMembers?.find((member) => member.id === s.teamMemberId)
          ?.name ??
        null,
      originalPrice: s.originalPrice,
      discountPct: s.discountPct,
      ...(s.discountType && s.discountAmount
        ? {
            discount: {
              type: s.discountType,
              amount: s.discountAmount,
            },
          }
        : {}),
    })),
    // Notes keep description only — uploads live in location_details / images (body limit).
    projectDetails: input.draft.projectDetails
      ? {
          description: input.draft.projectDetails.description ?? "",
          uploads: [],
        }
      : undefined,
    teamMembers: input.draft.teamMembers ?? [],
  };

  const responseDeadline =
    input.asBookingRequest &&
    buildResponseDeadline({
      hours: input.setup.responseTime?.hours,
      minutes: input.setup.responseTime?.minutes,
    });

  const prepaymentPercent = Math.max(0, Number(input.prepaymentPercent) || 0);
  const showPrepayment =
    Boolean(input.requiresPrepayment) && prepaymentPercent > 0;

  const notes = `${humanNotes}${humanNotes ? "\n" : ""}---mollure-meta---\n${JSON.stringify({
    requestDirection: input.asBookingRequest ? "incoming" : undefined,
    ...(humanNotes ? { clientNote: humanNotes } : {}),
    clientSnapshot,
    ...(showPrepayment
      ? {
          showPrepayment: true,
          prepaymentPercent,
        }
      : {}),
    ...(responseDeadline
      ? {
          responseStartedAt: responseDeadline.responseStartedAt,
          respondBy: responseDeadline.respondBy,
          responseWindowMinutes: responseDeadline.responseWindowMinutes,
        }
      : {}),
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
      ? mapClientBookingRequestType(
          input.locationMode,
          hasProjectBookingContent(input.draft),
        )
      : mapApiBookingType(
          input.locationMode,
          hasProjectBookingContent(input.draft),
        ),
    unique_code: input.bookingRef,
    total_price: input.total,
    notes,
    ...(showPrepayment ? { prepayment_status: "required" } : {}),
    ...(hasDesiredVisitAddress && desiredLocation
      ? {
          province: desiredLocation.province.trim() || null,
          municipality: desiredLocation.municipality.trim() || null,
          street_address: desiredLocation.street.trim() || null,
          street_number: desiredLocation.number.trim() || null,
          postal_code: desiredLocation.postalCode.trim() || null,
        }
      : {}),
    // Keep a durable booking snapshot for every request. The booking table
    // only has one service/team-member column, while a client can select many
    // services and assign each one to a different professional.
    ...(clientSnapshot.services.length ||
    input.draft.projectDetails ||
    hasDesiredVisitAddress ||
    (clientSnapshot.people?.length ?? 0) > 1
      ? {
          location_details: {
            // Durable backup: notes meta can truncate; project + people survive here.
            clientSnapshot: slimClientSnapshotForLocationDetails(clientSnapshot),
            ...(input.draft.projectDetails
              ? {
                  projectDescription,
                  uploads: projectUploads.map((upload) => ({
                    id: upload.id,
                    name: upload.name,
                    url: upload.url ?? null,
                    mimeType: upload.mimeType ?? null,
                    kind: upload.kind ?? null,
                  })),
                }
              : {}),
            ...(hasDesiredVisitAddress && desiredLocation
              ? {
                  desiredLocation: {
                    street: desiredLocation.street.trim(),
                    number: desiredLocation.number.trim(),
                    postalCode: desiredLocation.postalCode.trim(),
                    province: desiredLocation.province.trim(),
                    municipality: desiredLocation.municipality.trim(),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(imageUrls.length ? { images: imageUrls } : {}),
    ...(documentUrls.length ? { documents: documentUrls } : {}),
  };
}

function hhmmToTimeLabel(hhmm?: string | null) {
  if (!hhmm) return "";
  const match = String(hhmm).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return fmtMinutesToTimeLabel(Number(match[1]) * 60 + Number(match[2]));
}

function nonEmpty(value: unknown): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
}

function buildAddressLabel(booking: CalendarBooking) {
  if (booking.location_type === "desired") {
    const visitParts = [
      booking.street_address,
      booking.street_number,
      booking.postal_code,
      booking.municipality,
      booking.province,
    ]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean);
    if (visitParts.length) return visitParts.join(", ");
  }
  const parts = [
    booking.fixed_location_street_number,
    booking.fixed_location_address,
    booking.fixed_location_postal_code,
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
  const notesClientSnapshot = notesDetails?.clientSnapshot;
  const bookingCancelled = String(booking.status ?? "").toLowerCase() === "cancelled";
  const bookingRef = booking.unique_code || String(booking.id);
  // Backend edit_request column is the only source of truth for Confirmed ER.
  if (String(booking.status ?? "").toLowerCase() === "confirmed") {
    syncEditRequestFromBookingApi(bookingRef, booking.edit_request ?? null);
  }
  const activeEbr =
    !bookingCancelled && ebr && (ebr.status === "suggested" || ebr.status === "pending") ? ebr : null;
  const incomingEditRequest =
    !bookingCancelled && ebr && ebr.status !== "none"
      ? {
          status: ebr.status,
          suggestedAt: ebr.suggestedAt,
          professionalNote: ebr.professionalNote,
          clientNote: ebr.clientNote,
          editedServiceIds: ebr.editedServiceIds,
          editedProductIds: ebr.editedProductIds,
          addedServiceIds: ebr.addedServiceIds,
          cancelledServiceIds: ebr.cancelledServiceIds,
          addedProductIds: ebr.addedProductIds,
          cancelledProductIds: ebr.cancelledProductIds,
          suggestedServices: ebr.suggestedServices?.map((service) => ({
            id: service.id,
            name: service.name,
            durationMins: service.durationMins,
            price: service.price,
            teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
            teamMemberName: service.teamMemberName || undefined,
            guestId: service.guestId ?? null,
            startTime: service.startTime,
            endTime: service.endTime,
          })),
          suggestedProducts: ebr.suggestedProducts,
          suggestedDateISO: ebr.suggestedDateISO,
          suggestedTime: ebr.suggestedTime,
          originalDateISO: ebr.originalDateISO,
          originalTime: ebr.originalTime,
        }
      : null;
  const serviceNames = parseServiceNamesFromNotes(
    activeEbr?.suggestedServices?.length
      ? `Services: ${activeEbr.suggestedServices.map((s) => s.name).join(", ")}`
      : booking.notes,
  );
  const title =
    activeEbr?.suggestedServices?.[0]?.name ||
    booking.service_title ||
    serviceNames[0] ||
    "";
  const names = activeEbr?.suggestedServices?.length
    ? activeEbr.suggestedServices.map((s) => s.name)
    : notesDetails?.services?.length
      ? notesDetails.services.map((s) => s.name)
      : serviceNames.length
        ? serviceNames
        : title
          ? [title]
          : [];
  const total = String(booking.status ?? "").toLowerCase() === "no_show" && Number(booking.no_show_fee_due) > 0
    ? Number(booking.no_show_fee_due)
    : activeEbr?.suggestedServices?.length
    ? activeEbr.suggestedServices.reduce(
        (sum, s) => sum + effectiveServiceAmount(s),
        0,
      ) +
      (activeEbr.suggestedProducts ?? []).reduce(
        (sum, p) => sum + (Number(p.price) || 0),
        0,
      )
    : notesDetails?.services?.length
      ? notesDetails.services.reduce(
          (sum, s) => sum + effectiveServiceAmount(s),
          0,
        ) +
        (notesDetails.products ?? []).reduce(
          (sum, p) => sum + (Number(p.price) || 0),
          0,
        )
      : Number(booking.total_price) || 0;
  const durationMins = (() => {
    if (activeEbr?.suggestedServices?.length) {
      return activeEbr.suggestedServices.reduce((sum, s) => sum + (s.durationMins || 0), 0) || 60;
    }
    if (!startHhmm || !endHhmm) return 60;
    const [sh, sm] = startHhmm.split(":").map(Number);
    const [eh, em] = endHhmm.split(":").map(Number);
    return Math.max(15, eh * 60 + em - (sh * 60 + sm));
  })();
  // Notes confirmed covers column lag right after Pay Now (same write as markNotesPrepaymentPaid).
  const prepaid =
    String(booking.prepayment_status ?? "").toLowerCase() === "paid" ||
    notesDetails?.prepaymentStatus === "confirmed";
  const paymentPending =
    Boolean(notesDetails?.waitingForPayment) ||
    unpaidSplitPayers(parseSplitBillState(notesDetails?.splitBill)).length > 0;
  // Explicit false only while post-booking settlement is open (drives payment-due UI).
  const paid =
    status === "no_show"
      ? false
      : status === "completed" || status === "in_progress"
      ? paymentPending
        ? false
        : status === "completed"
          ? true
          : undefined
      : undefined;
  const isEbrIncoming = incomingEditRequest?.status === "suggested";
  const notesRequestDirection = notesDetails?.requestDirection;
  // Notes requestDirection is from the professional's perspective:
  // outgoing = pro sent BR → client sees incoming; incoming = client sent → outgoing.
  const bookingRequestDirection = isEbrIncoming
    ? "incoming"
    : status === "requested"
      ? notesRequestDirection === "outgoing"
        ? "incoming"
        : "outgoing"
      : undefined;

  const locationDetails =
    booking.location_details && typeof booking.location_details === "object"
      ? (booking.location_details as {
          projectDescription?: string;
          clientSnapshot?: CalendarBookingClientSnapshot;
          desiredLocation?: {
            street?: string;
            number?: string;
            postalCode?: string;
            province?: string;
            municipality?: string;
          };
          uploads?: Array<{
            id?: string;
            name?: string;
            url?: string | null;
            mimeType?: string | null;
            kind?: "image" | "document" | null;
          }>;
        })
      : null;
  const clientSnapshot = mergeBookingClientSnapshots(
    notesClientSnapshot,
    locationDetails?.clientSnapshot,
  );
  const projectUploads = resolveBookingProjectUploads({
    locationUploads: Array.isArray(locationDetails?.uploads) ? locationDetails.uploads : [],
    images: booking.images,
    documents: booking.documents,
  });
  const projectDescription =
    typeof locationDetails?.projectDescription === "string"
      ? locationDetails.projectDescription
      : clientSnapshot?.projectDetails?.description?.trim() || "";

  const desiredLocationFromColumns =
    booking.location_type === "desired" &&
    (booking.street_address ||
      booking.street_number ||
      booking.postal_code ||
      booking.province ||
      booking.municipality)
      ? {
          street: String(booking.street_address ?? "").trim(),
          number: String(booking.street_number ?? "").trim(),
          postalCode: String(booking.postal_code ?? "").trim(),
          province: String(booking.province ?? "").trim(),
          municipality: String(booking.municipality ?? "").trim(),
        }
      : null;
  const desiredLocationFromDetails = locationDetails?.desiredLocation
    ? {
        street: String(locationDetails.desiredLocation.street ?? "").trim(),
        number: String(locationDetails.desiredLocation.number ?? "").trim(),
        postalCode: String(locationDetails.desiredLocation.postalCode ?? "").trim(),
        province: String(locationDetails.desiredLocation.province ?? "").trim(),
        municipality: String(locationDetails.desiredLocation.municipality ?? "").trim(),
      }
    : null;
  const desiredLocation = desiredLocationFromColumns ?? desiredLocationFromDetails;

  const snapshotServices = clientSnapshot?.services ?? [];
  const cancelledServiceIdSet = new Set([
    ...(notesDetails?.cancelledServiceIds ?? []),
    ...(!bookingCancelled && ebr && ebr.status !== "rejected"
      ? (ebr.cancelledServiceIds ?? [])
      : []),
  ]);
  const cancelledProductIdSet = new Set([
    ...(notesDetails?.cancelledProductIds ?? []),
    ...(!bookingCancelled && ebr && ebr.status !== "rejected"
      ? (ebr.cancelledProductIds ?? [])
      : []),
  ]);
  const extraParticipantIds = extraBookingParticipantIds([
    ...(clientSnapshot?.people ?? []),
    ...(notesDetails?.guests ?? []),
  ]);
  /** Missing / non-extra guestId is the main client — never infer from another catalog row. */
  const resolveGuestId = (fallback: string | null | undefined) => {
    if (fallback == null) return null;
    const trimmed = String(fallback).trim();
    if (!trimmed) return null;
    if (!extraParticipantIds.has(trimmed)) return null;
    return trimmed;
  };

  const guestNestedServices = (notesDetails?.guests ?? []).flatMap((guest) =>
    (guest.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      durationMins: service.durationMins,
      ...withClientDiscountFields(service),
      startTime: service.startTime,
      endTime: service.endTime,
      guestId: resolveGuestId(service.guestId ?? guest.id),
      teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
      teamMemberName: service.teamMemberName ?? null,
    })),
  );

  const draftServices = ((): ClientBookingDraft["services"] => {
    const noteServices = notesDetails?.services ?? [];
    const merged: ClientBookingDraft["services"] = [];
    const pushUnique = (row: {
      id: string;
      name: string;
      durationMins: number;
      price: number;
      guestId?: string | null;
      teamMemberId?: string | null;
      teamMemberName?: string | null;
      startTime?: string;
      endTime?: string;
      originalPrice?: number;
      discountPct?: number;
      discountType?: "fixed" | "percentage";
      discountAmount?: number;
      discount?: { type: "fixed" | "percentage"; amount: number } | null;
    }) => {
      if (cancelledServiceIdSet.has(row.id)) return;
      merged.push({
        id: row.id,
        name: row.name,
        durationMins: row.durationMins,
        ...withClientDiscountFields(row),
        startTime: row.startTime,
        endTime: row.endTime,
        guestId: row.guestId ?? null,
        teamMemberId: row.teamMemberId ?? booking.team_member_id,
        teamMemberName: row.teamMemberName ?? null,
      });
    };

    if (activeEbr?.suggestedServices?.length) {
      for (const service of activeEbr.suggestedServices) {
        pushUnique({
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: service.price,
          guestId: resolveGuestId(service.guestId),
          teamMemberId: service.staffResourceId ?? booking.team_member_id,
          teamMemberName: service.teamMemberName ?? null,
          startTime: service.startTime,
          endTime: service.endTime,
          originalPrice: service.originalPrice,
          discount: service.discount,
          discountPct: service.discountPct,
        });
      }
    }
    if (!activeEbr?.suggestedServices?.length) {
      for (const service of noteServices) {
        pushUnique({
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: service.price,
          guestId: resolveGuestId(service.guestId),
          teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
          teamMemberName: service.teamMemberName ?? null,
          startTime: service.startTime,
          endTime: service.endTime,
          originalPrice: service.originalPrice,
          discount: service.discount,
          discountPct: service.discountPct,
        });
      }
    }
    for (const service of snapshotServices) {
      pushUnique({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        guestId: resolveGuestId(service.guestId ?? null),
        teamMemberId: service.teamMemberId ?? null,
        teamMemberName: service.teamMemberName ?? null,
        startTime: service.startTime,
        endTime: service.endTime,
        originalPrice: service.originalPrice,
        discount: service.discount,
        discountPct: service.discountPct,
      });
    }
    for (const service of guestNestedServices) {
      pushUnique(service);
    }

    const unique = dedupeServicesByOwner(merged, extraParticipantIds);
    if (unique.length) return unique;

    // Do not manufacture service rows from a booking total. A missing service
    // must stay visibly missing until the API provides a real stored service.
    return [];
  })();

  const draftProducts: ClientBookingDraft["products"] = (() => {
    if (activeEbr?.suggestedProducts?.length) {
      return activeEbr.suggestedProducts
        .filter((product) => !cancelledProductIdSet.has(product.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          unitPrice: product.unitPrice ?? product.price,
          originalPrice: product.originalPrice,
          discountType: product.discount?.type,
          discountAmount: product.discount?.amount,
          guestId: product.guestId ?? null,
        }));
    }
    const noteProducts = notesDetails?.products ?? [];
    const guestProducts = (notesDetails?.guests ?? []).flatMap((guest) =>
      (guest.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        unitPrice: product.unitPrice ?? product.price,
        guestId: guest.id,
        originalPrice: product.originalPrice,
        discountType: product.discount?.type,
        discountAmount: product.discount?.amount,
      })),
    );
    const mergedProducts = [...noteProducts];
    for (const product of guestProducts) {
      const guestId = product.guestId ?? null;
      if (
        mergedProducts.some(
          (item) =>
            item.id === product.id &&
            String(item.guestId ?? "") === String(guestId ?? ""),
        )
      ) {
        continue;
      }
      mergedProducts.push(product);
    }
    if (mergedProducts.length) {
      return mergedProducts
        .filter((product) => !cancelledProductIdSet.has(product.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          unitPrice: product.unitPrice ?? product.price,
          originalPrice: product.originalPrice,
          discountType: product.discount?.type,
          discountAmount: product.discount?.amount,
          guestId: product.guestId ?? null,
        }));
    }
    return [];
  })();

  const kilometerAllowanceAmount =
    booking.location_type === "desired"
      ? resolveKilometerAllowanceAmount(notesDetails?.kilometerAllowance)
      : 0;
  const extrasAmount =
    booking.location_type === "desired" && kilometerAllowanceAmount > 0
      ? kilometerAllowanceAmount
      : 0;
  const mappedPrepaymentPercent = Number(notesDetails?.prepaymentPercent) || 0;
  const draftPrice = summarizeClientBookingPrice({
    services: draftServices,
    people: mergeDraftPeople(clientSnapshot?.people, notesDetails?.guests),
    products: draftProducts,
    extrasAmount,
    discount: notesDetails?.totalDiscount ?? null,
    showLateCancellation: Boolean(notesDetails?.showLateCancellation),
    lateCancellationFeePercent: notesDetails?.lateCancellationFeePercent,
    showLateRescheduling: Boolean(notesDetails?.showLateRescheduling),
    lateRescheduleFeePercent: notesDetails?.lateRescheduleFeePercent,
    showNoShowFee: Boolean(notesDetails?.showNoShowFee),
    noShowFeePercent: notesDetails?.noShowFeePercent,
    showPrepayment:
      Boolean(notesDetails?.showPrepayment) && mappedPrepaymentPercent > 0,
    prepaymentPercent: mappedPrepaymentPercent,
  });
  const draftTotal =
    draftPrice.breakdown.bookingTotal > 0
      ? draftPrice.breakdown.bookingTotal
      : Number(booking.total_price) || 0;

  const draftTeamMembers = mergeBookingTeamMembers(
    clientSnapshot?.teamMembers,
    booking.team_member_id
      ? [
          {
            id: booking.team_member_id,
            name: booking.team_member_name || "Team member",
          },
        ]
      : [],
    draftServices.map((service) => ({
      id: service.teamMemberId,
      name: service.teamMemberName,
    })),
  );
  const teamNameById = new Map(
    draftTeamMembers.map((member) => [member.id, member.name]),
  );
  const servicesWithTeamNames = draftServices.map((service) => {
    const id = String(service.teamMemberId ?? "").trim();
    const name =
      service.teamMemberName?.trim() || (id ? teamNameById.get(id) : undefined);
    return name ? { ...service, teamMemberName: name } : service;
  });

  return {
    id: booking.id,
    apiBookingId: booking.id,
    bookingRef: booking.unique_code ?? undefined,
    status,
    bookingRequestSent: status === "requested",
    bookingRequestDirection,
    shop: {
      shopId: String(booking.business_setup_id ?? ""),
      shopName: nonEmpty(booking.business_name) ?? "Salon",
      addressLabel: buildAddressLabel(booking) ?? undefined,
      // Empty DB strings must not become "" — that blocks UI fallbacks (`??` only skips null/undefined).
      municipalityLabel: nonEmpty(booking.fixed_location_municipality),
      locationMode: booking.location_type === "desired" ? "desired" : "fixed",
    },
    draft: {
      selectedDateISO: activeEbr?.suggestedDateISO || dateIso,
      selectedTime:
        activeEbr?.suggestedTime ||
        hhmmToTimeLabel(activeEbr?.suggestedStart) ||
        startLabel,
      combineServices: names.length > 1,
      people: mergeDraftPeople(clientSnapshot?.people, notesDetails?.guests),
      services: servicesWithTeamNames,
      products: draftProducts,
      teamMembers: draftTeamMembers.length ? draftTeamMembers : undefined,
      projectDetails:
        projectDescription || projectUploads.length
          ? {
              description: projectDescription || clientSnapshot?.projectDetails?.description || "",
              uploads: projectUploads.length
                ? projectUploads
                : (clientSnapshot?.projectDetails?.uploads ?? []),
            }
          : clientSnapshot?.projectDetails
            ? {
                description: clientSnapshot.projectDetails.description ?? "",
                uploads: clientSnapshot.projectDetails.uploads ?? [],
              }
            : undefined,
      ...(desiredLocation &&
      (desiredLocation.street ||
        desiredLocation.number ||
        desiredLocation.postalCode ||
        desiredLocation.province ||
        desiredLocation.municipality)
        ? { desiredLocation }
        : {}),
      ...(notesDetails?.clientNote?.trim()
        ? { clientNote: notesDetails.clientNote.trim() }
        : notesDetails?.internalNote?.trim()
          ? { clientNote: notesDetails.internalNote.trim() }
          : {}),
    total: draftTotal,
    },
    createdAt: booking.created_at ?? undefined,
    prepaid,
    paid,
    requiresPrepayment:
      prepaid ||
      ["required", "pending"].includes(
        String(booking.prepayment_status ?? "").toLowerCase(),
      ) ||
      Boolean(notesDetails?.showPrepayment),
    prepaymentPercent: Number(notesDetails?.prepaymentPercent) || 0,
    contactPhone: booking.contact_number ?? undefined,
    notes: booking.notes ?? null,
    editRequest: booking.edit_request ?? null,
    updatedAt: booking.updated_at ?? booking.created_at ?? null,
    lastEditedBy: (() => {
      // Pending ER already has its own ER badge — do not invent lastEditedBy
      // for it or the client list shows a redundant "Updated" chip.
      if (activeEbr?.lastEditedBy === "professional" || activeEbr?.professionalNote) {
        return "professional" as const;
      }
      if (activeEbr?.lastEditedBy === "client" || activeEbr?.clientNote) {
        return "client" as const;
      }
      if (notesDetails?.lastEditedBy) return notesDetails.lastEditedBy;
      // First-time BR is not an "update".
      return null;
    })(),
    silentUpdated: Boolean(notesDetails?.silentUpdated),
    editedServiceIds: notesDetails?.silentUpdated
      ? undefined
      : notesDetails?.editedServiceIds?.length
        ? notesDetails.editedServiceIds
        : ebr?.editedServiceIds?.length
          ? ebr.editedServiceIds
          : undefined,
    editedProductIds: notesDetails?.silentUpdated
      ? undefined
      : notesDetails?.editedProductIds?.length
        ? notesDetails.editedProductIds
        : ebr?.editedProductIds?.length
          ? ebr.editedProductIds
          : undefined,
    incomingEditRequest,
    hiddenForCustomer: Boolean(notesDetails?.hiddenForCustomer),
    needsOk: notesDetails?.needsOk,
    ackRecipient: notesDetails?.ackRecipient,
    ackScenario: notesDetails?.ackScenario,
  };
}
