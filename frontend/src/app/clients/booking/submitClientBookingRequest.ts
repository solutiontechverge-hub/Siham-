import { getApiErrorMessage } from "../../../lib/api-error";
import type { BusinessSetupListing, CreateBookingRequest } from "../../../store/services/businessApi";
import { parseTimeLabelToMinutes } from "./booking-time";
import { buildClientBookingApiPayload } from "./clientBookingApi.mapper";
import type { ClientBookingRecord } from "./clientBookingRecords";
import { upsertRequestedBooking } from "./clientBookingRecords";
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

  const bookingDate = draft.selectedDateISO;
  const startMinutes = parseTimeLabelToMinutes(draft.selectedTime ?? "12:00 AM");
  const endMinutes =
    startMinutes + (draft.services ?? []).reduce((sum, service) => sum + service.durationMins, 0);
  const bookingRef = record.bookingRef ?? createBookingRef();
  const startDate = new Date(`${bookingDate}T00:00:00`);
  startDate.setMinutes(startDate.getMinutes() + startMinutes);
  const endDate = new Date(`${bookingDate}T00:00:00`);
  endDate.setMinutes(endDate.getMinutes() + endMinutes);

  return {
    booking_date: bookingDate,
    business_setup_id: shopId,
    service_id: UUID_PATTERN.test(primaryService.id) ? primaryService.id : null,
    team_member_id:
      primaryService.teamMemberId && UUID_PATTERN.test(primaryService.teamMemberId)
        ? primaryService.teamMemberId
        : null,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    location_type: locationMode === "desired" ? "desired" : "fixed",
    status: "requested",
    booking_type: locationMode === "desired" ? "project" : "request",
    unique_code: bookingRef,
    total_price: draft.total,
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

  if (setup && draft && shopId) {
    const payload = buildClientBookingApiPayload({
      setup,
      shopId,
      locationMode,
      draft,
      status: "requested",
      bookingRef,
      total: draft.total ?? 0,
      asBookingRequest: true,
    });
    if (payload) return payload;
  }

  return buildFallbackCreateBookingPayload(record, locationMode);
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
      bookingRef: savedBookingRef,
      apiBookingId: created.data?.id != null ? String(created.data.id) : params.record.apiBookingId,
      status,
      bookingRequestSent: true,
      ...(bookingRequestDirection ? { bookingRequestDirection } : {}),
    };
    upsertRequestedBooking(updated);
    return { ok: true, record: updated };
  } catch (error) {
    return {
      ok: false,
      message: getApiErrorMessage(error, "Unable to send booking request. Please try again."),
    };
  }
}
