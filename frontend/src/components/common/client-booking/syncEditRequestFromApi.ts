import type { BookingEditRequestPayload } from "../../../store/services/businessApi";
import type { BookingEditRequestRecord } from "./bookingEditRequest";
import { syncBookingEditRequestFromRemote } from "./bookingEditRequest";

/** Map API `bookings.edit_request` → local UI cache shape. */
export function mapApiEditRequestToRecord(
  editRequest: BookingEditRequestPayload | null | undefined,
): BookingEditRequestRecord | null {
  if (!editRequest?.status) return null;
  return {
    status: editRequest.status,
    note: editRequest.note,
    initiatedBy: editRequest.initiated_by,
    requestedAt: editRequest.requested_at ?? undefined,
    approvedAt:
      editRequest.status === "approved"
        ? (editRequest.responded_at ?? undefined)
        : undefined,
    rejectedAt:
      editRequest.status === "rejected"
        ? (editRequest.responded_at ?? undefined)
        : undefined,
    editGrantActive: Boolean(editRequest.edit_grant_active),
  };
}

/** Hydrate local ER cache from booking API payload (source of truth). */
export function syncEditRequestFromBookingApi(
  bookingRef: string,
  editRequest: BookingEditRequestPayload | null | undefined,
): void {
  if (!bookingRef) return;
  if (!editRequest) {
    syncBookingEditRequestFromRemote(bookingRef, {
      status: "none",
      editGrantActive: false,
    });
    return;
  }
  const mapped = mapApiEditRequestToRecord(editRequest);
  if (mapped) syncBookingEditRequestFromRemote(bookingRef, mapped);
}
