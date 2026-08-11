import { getApiErrorMessage } from "../../../lib/api-error";
import type { BusinessSetupListing, CreateBookingRequest } from "../../../store/services/businessApi";
import { parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "./booking-time";
import { buildClientBookingApiPayload, extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import type { ClientBookingRecord } from "./clientBookingRecords";
import { createBookingRef } from "./clientBookingSession";
import { resolveCreateBookingStatus } from "./resolveCreateBookingStatus";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    (catalogServiceId && UUID_PATTERN.test(catalogServiceId) ? catalogServiceId : null) ??
    extractUuidFromSyntheticId(catalogServiceId);

  return {
    booking_date: bookingDate,
    business_setup_id: shopId,
    service_id: resolvedServiceId,
    team_member_id:
      primaryService.teamMemberId && UUID_PATTERN.test(primaryService.teamMemberId)
        ? primaryService.teamMemberId
        : extractUuidFromSyntheticId(primaryService.teamMemberId),
    start_time: buildWallClockDateTimeIso(bookingDate, startMinutes),
    end_time: buildWallClockDateTimeIso(bookingDate, endMinutes),
    location_type: locationMode === "desired" ? "desired" : "fixed",
    status,
    booking_type: locationMode === "desired" ? "project" : asBookingRequest ? "request" : "online",
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
          notes: draft.projectDetails?.description
            ? `Project: ${draft.projectDetails.description}`
            : null,
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
    return {
      ok: false,
      message: getApiErrorMessage(error, "Unable to send booking request. Please try again."),
    };
  }
}
