import { getApiErrorMessage, isApiRequestAborted } from "../../../lib/api-error";
import { INPUT_LIMITS, parseText } from "../../../lib/inputSchema";
import { UUID_RE } from "../../../lib/uuid";
import type { BusinessSetupListing, CreateBookingRequest } from "../../../store/services/businessApi";
import { parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "./booking-time";
import { buildClientBookingApiPayload, extractUuidFromSyntheticId, hasProjectBookingContent } from "./clientBookingApi.mapper";
import type { ClientBookingRecord } from "./clientBookingRecords";
import { createBookingRef } from "./clientBookingSession";
import { resolveCreateBookingStatus } from "./resolveCreateBookingStatus";

function validateBookingPayloadFields(
  payload: CreateBookingRequest,
  contactPhone?: string | null,
): string | null {
  if (contactPhone != null && contactPhone.trim()) {
    const phone = parseText(contactPhone, {
      required: false,
      label: "Contact number",
      max: 32,
    });
    if (!phone.ok) return phone.error;
  }
  if (payload.notes != null && String(payload.notes).trim()) {
    const notes = parseText(String(payload.notes), {
      required: false,
      label: "Notes",
      min: 0,
      max: null,
    });
    if (!notes.ok) return notes.error;
  }
  for (const [field, label, max] of [
    ["province", "Province", INPUT_LIMITS.textShort],
    ["municipality", "Municipality", INPUT_LIMITS.textShort],
    ["street_address", "Street", INPUT_LIMITS.textShort],
    ["street_number", "Street number", INPUT_LIMITS.streetNumber],
    ["postal_code", "Postal code", INPUT_LIMITS.postalCode],
  ] as const) {
    const raw = payload[field];
    if (raw == null || !String(raw).trim()) continue;
    const parsed = parseText(String(raw), { required: false, label, max });
    if (!parsed.ok) return parsed.error;
  }
  return null;
}

type CreateBookingResult = { data?: { id?: string | number; unique_code?: string | null } | null };

type CreateBookingTrigger = (
  payload: CreateBookingRequest,
) => { unwrap: () => Promise<CreateBookingResult> };

function buildFallbackCreateBookingPayload(
  record: ClientBookingRecord,
  locationMode: "fixed" | "desired",
): CreateBookingRequest | null {
  const draft = record.draft;
  const shopId = record.shop?.shopId;
  const primaryService = draft?.services?.[0];
  if (!draft?.selectedDateISO || !shopId || !primaryService) return null;

  const { status } = resolveCreateBookingStatus({ locationMode });
  const asBookingRequest = locationMode === "desired";
  const bookingDate = draft.selectedDateISO;
  const startMinutes = parseTimeLabelToMinutes(draft.selectedTime ?? "12:00 AM");
  const endMinutes =
    startMinutes + (draft.services ?? []).reduce((sum, service) => sum + service.durationMins, 0);
  const bookingRef = record.bookingRef ?? createBookingRef();
  const catalogServiceId =
    (primaryService as { catalogServiceId?: string | null }).catalogServiceId ?? primaryService.id;
  const resolvedServiceId =
    (catalogServiceId && UUID_RE.test(catalogServiceId) ? catalogServiceId : null) ??
    extractUuidFromSyntheticId(catalogServiceId);

  return {
    booking_date: bookingDate,
    business_setup_id: shopId,
    service_id: resolvedServiceId,
    team_member_id:
      primaryService.teamMemberId && UUID_RE.test(primaryService.teamMemberId)
        ? primaryService.teamMemberId
        : extractUuidFromSyntheticId(primaryService.teamMemberId),
    start_time: buildWallClockDateTimeIso(bookingDate, startMinutes),
    end_time: buildWallClockDateTimeIso(bookingDate, endMinutes),
    location_type: locationMode === "desired" ? "desired" : "fixed",
    status,
    booking_type:
      locationMode === "desired"
        ? hasProjectBookingContent(draft)
          ? "project"
          : "request"
        : asBookingRequest
          ? "request"
          : "online",
    unique_code: bookingRef,
    total_price: draft.total,
    ...(locationMode === "desired" && draft.desiredLocation
      ? {
          province: draft.desiredLocation.province.trim() || null,
          municipality: draft.desiredLocation.municipality.trim() || null,
          street_address: draft.desiredLocation.street.trim() || null,
          street_number: draft.desiredLocation.number.trim() || null,
          postal_code: draft.desiredLocation.postalCode.trim() || null,
        }
      : {}),
    ...(draft.projectDetails || (locationMode === "desired" && draft.desiredLocation)
      ? {
          location_details: {
            ...(draft.people?.length
              ? {
                  clientSnapshot: {
                    people: draft.people
                      .filter(
                        (p) =>
                          p.participantType !== "notes" && p.id !== "p-notes",
                      )
                      .map((p) => ({
                        id: p.id,
                        name: p.name,
                        isRequester: Boolean(p.isRequester),
                        participantType: p.participantType,
                        planningActivity: p.planningActivity,
                        planningDuration: p.planningDuration,
                        planningStartTime: p.planningStartTime,
                        planningEndTime: p.planningEndTime,
                        bufferStartTime: p.bufferStartTime,
                        bufferEndTime: p.bufferEndTime,
                      })),
                    services: (draft.services ?? []).map((s) => ({
                      id: s.id,
                      name: s.name,
                      price: s.price,
                      durationMins: s.durationMins,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      guestId: s.guestId ?? null,
                      teamMemberId: s.teamMemberId ?? null,
                    })),
                    teamMembers: draft.teamMembers ?? [],
                    ...(draft.projectDetails?.description?.trim()
                      ? {
                          projectDetails: {
                            description: draft.projectDetails.description,
                            uploads: [],
                          },
                        }
                      : {}),
                  },
                }
              : {}),
            ...(draft.projectDetails
              ? {
                  projectDescription: draft.projectDetails.description ?? "",
                  uploads: draft.projectDetails.uploads ?? [],
                }
              : {}),
            ...(locationMode === "desired" && draft.desiredLocation
              ? { desiredLocation: draft.desiredLocation }
              : {}),
          },
          notes: (() => {
            const human = draft.clientNote?.trim()
              ? draft.clientNote.trim()
              : draft.projectDetails?.description
                ? `Project: ${draft.projectDetails.description}`
                : "";
            if (!draft.people?.length) return human || null;
            return `${human}${human ? "\n" : ""}---mollure-meta---\n${JSON.stringify({
              requestDirection: asBookingRequest ? "incoming" : undefined,
              ...(human ? { clientNote: human } : {}),
              clientSnapshot: {
                people: draft.people
                  .filter(
                    (p) =>
                      p.participantType !== "notes" && p.id !== "p-notes",
                  )
                  .map((p) => ({
                    id: p.id,
                    name: p.name,
                    isRequester: Boolean(p.isRequester),
                    participantType: p.participantType,
                    planningActivity: p.planningActivity,
                    planningDuration: p.planningDuration,
                    planningStartTime: p.planningStartTime,
                    planningEndTime: p.planningEndTime,
                  })),
                services: (draft.services ?? []).map((s) => ({
                  id: s.id,
                  name: s.name,
                  price: s.price,
                  durationMins: s.durationMins,
                  guestId: s.guestId ?? null,
                  teamMemberId: s.teamMemberId ?? null,
                })),
                teamMembers: draft.teamMembers ?? [],
                ...(draft.projectDetails?.description?.trim()
                  ? {
                      projectDetails: {
                        description: draft.projectDetails.description,
                        uploads: [],
                      },
                    }
                  : {}),
              },
            })}`;
          })(),
          images: (draft.projectDetails?.uploads ?? [])
            .filter((u) => u.url && (u.kind === "image" || !u.kind))
            .map((u) => u.url as string),
          documents: (draft.projectDetails?.uploads ?? [])
            .filter((u) => u.url && u.kind === "document")
            .map((u) => u.url as string),
        }
      : {}),
  };
}

export function buildCreateBookingPayload(
  record: ClientBookingRecord,
  locationMode: "fixed" | "desired",
  setup?: BusinessSetupListing | null,
): CreateBookingRequest | null {
  const draft = record.draft;
  const shopId = record.shop?.shopId;
  const bookingRef = record.bookingRef ?? createBookingRef();

  const { status } = resolveCreateBookingStatus({ locationMode });
  const asBookingRequest = locationMode === "desired";
  const requiresPrepayment = Boolean(record.requiresPrepayment);
  const prepaymentPercent = Number(record.prepaymentPercent) || 0;

  if (setup && draft && shopId) {
    const payload = buildClientBookingApiPayload({
      setup,
      shopId,
      locationMode,
      draft,
      status,
      bookingRef,
      total: draft.total ?? 0,
      asBookingRequest,
      requiresPrepayment,
      prepaymentPercent,
    });
    if (payload) {
      return {
        ...payload,
        ...(record.contactPhone?.trim()
          ? { contact_number: record.contactPhone.trim() }
          : {}),
      };
    }
  }

  const fallback = buildFallbackCreateBookingPayload(record, locationMode);
  if (!fallback) return null;
  return {
    ...fallback,
    ...(requiresPrepayment && prepaymentPercent > 0
      ? { prepayment_status: "required" }
      : {}),
    ...(record.contactPhone?.trim()
      ? { contact_number: record.contactPhone.trim() }
      : {}),
  };
}

export async function submitClientBookingRequest(params: {
  record: ClientBookingRecord;
  locationMode: "fixed" | "desired";
  setup?: BusinessSetupListing | null;
  createBooking: CreateBookingTrigger;
}): Promise<{ ok: true; record: ClientBookingRecord } | { ok: false; message: string }> {
  const payload = buildCreateBookingPayload(params.record, params.locationMode, params.setup);
  if (!payload) {
    return { ok: false, message: "Booking details are incomplete." };
  }

  const schemaError = validateBookingPayloadFields(
    payload,
    params.record.contactPhone,
  );
  if (schemaError) {
    return { ok: false, message: schemaError };
  }

  try {
    const created = await params.createBooking(payload).unwrap();
    const savedBookingRef = created.data?.unique_code ?? payload.unique_code ?? createBookingRef();
    const { status, bookingRequestDirection } = resolveCreateBookingStatus({
      locationMode: params.locationMode,
    });

    const updated: ClientBookingRecord = {
      ...params.record,
      id: created.data?.id != null ? String(created.data.id) : params.record.id,
      bookingRef: savedBookingRef,
      apiBookingId: created.data?.id != null ? String(created.data.id) : params.record.apiBookingId,
      status,
      bookingRequestSent: true,
      ...(bookingRequestDirection ? { bookingRequestDirection } : {}),
    };
    return { ok: true, record: updated };
  } catch (error) {
    if (isApiRequestAborted(error)) {
      return { ok: false, message: "" };
    }
    return {
      ok: false,
      message: getApiErrorMessage(
        error,
        "Unable to send booking request. Please try again.",
      ),
    };
  }
}
