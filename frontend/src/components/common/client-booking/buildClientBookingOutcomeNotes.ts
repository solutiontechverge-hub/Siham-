import { buildClientEbrOutcomeNote } from "./buildClientEbrOutcomeNote";
import type { ClientEbrOutcomeNote } from "./buildClientEbrOutcomeNote";
import type { BookingEditRequestRecord } from "./bookingEditRequest";
import type { ClientBookingDraft } from "./types";

export type ClientBookingOutcomeSource = {
  status?: string | null;
  suggestedDateISO?: string | null;
  suggestedTime?: string | null;
  suggestedServices?: BookingEditRequestRecord["suggestedServices"];
  suggestedProducts?: BookingEditRequestRecord["suggestedProducts"];
  editedServiceIds?: string[] | null;
  editedProductIds?: string[] | null;
  originalDateISO?: string | null;
  originalTime?: string | null;
};

function orUndef<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/** Prefer API incoming EBR outcome; fall back to local edit-request record. */
export function resolveClientBookingOutcomeSource(
  incoming: ClientBookingOutcomeSource | null | undefined,
  editRequest: ClientBookingOutcomeSource,
): ClientBookingOutcomeSource | null {
  if (incoming?.status === "rejected" || incoming?.status === "accepted")
    return incoming;
  if (editRequest.status === "rejected" || editRequest.status === "accepted")
    return editRequest;
  return null;
}

export function buildRejectedChangesNote(input: {
  isClientChangeRejected: boolean;
  outcomeSource: ClientBookingOutcomeSource | null;
  editRequest: ClientBookingOutcomeSource;
  draft: ClientBookingDraft | null;
}): ClientEbrOutcomeNote | null {
  const { isClientChangeRejected, outcomeSource, editRequest, draft } = input;
  if (!isClientChangeRejected || !outcomeSource) return null;
  return buildClientEbrOutcomeNote({
    suggestedDateISO: orUndef(
      outcomeSource.suggestedDateISO || editRequest.suggestedDateISO,
    ),
    suggestedTime: orUndef(
      outcomeSource.suggestedTime || editRequest.suggestedTime,
    ),
    suggestedServices:
      outcomeSource.suggestedServices || editRequest.suggestedServices,
    suggestedProducts:
      outcomeSource.suggestedProducts || editRequest.suggestedProducts,
    editedServiceIds: orUndef(
      outcomeSource.editedServiceIds || editRequest.editedServiceIds,
    ),
    editedProductIds: orUndef(
      outcomeSource.editedProductIds || editRequest.editedProductIds,
    ),
    originalDateISO: orUndef(
      outcomeSource.originalDateISO || draft?.selectedDateISO,
    ),
    originalTime: orUndef(outcomeSource.originalTime || draft?.selectedTime),
    originalServices: draft?.services,
  });
}

export function buildAcceptedChangesNote(input: {
  isClientChangeAccepted: boolean;
  outcomeSource: ClientBookingOutcomeSource | null;
  editRequest: ClientBookingOutcomeSource;
}): ClientEbrOutcomeNote | null {
  const { isClientChangeAccepted, outcomeSource, editRequest } = input;
  if (
    !isClientChangeAccepted ||
    !outcomeSource ||
    outcomeSource.status !== "accepted"
  )
    return null;
  return buildClientEbrOutcomeNote({
    suggestedDateISO: orUndef(
      outcomeSource.suggestedDateISO || editRequest.suggestedDateISO,
    ),
    suggestedTime: orUndef(
      outcomeSource.suggestedTime || editRequest.suggestedTime,
    ),
    suggestedServices:
      outcomeSource.suggestedServices || editRequest.suggestedServices,
    suggestedProducts:
      outcomeSource.suggestedProducts || editRequest.suggestedProducts,
    editedServiceIds: orUndef(
      outcomeSource.editedServiceIds || editRequest.editedServiceIds,
    ),
    editedProductIds: orUndef(
      outcomeSource.editedProductIds || editRequest.editedProductIds,
    ),
    originalDateISO: orUndef(outcomeSource.originalDateISO),
    originalTime: orUndef(outcomeSource.originalTime),
    originalServices: [],
  });
}
