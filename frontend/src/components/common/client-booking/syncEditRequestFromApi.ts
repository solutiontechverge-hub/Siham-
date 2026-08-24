import type { BookingEditRequestPayload } from "../../../store/services/businessApi";
import type { BookingEditRequestRecord } from "./bookingEditRequest";
import { syncBookingEditRequestFromRemote } from "./bookingEditRequest";

/** Map API `bookings.edit_request` → local UI cache shape. */
export function mapApiEditRequestToRecord(
  editRequest: BookingEditRequestPayload | null | undefined,
): BookingEditRequestRecord | null {
  if (!editRequest?.status) return null;
  const raw = editRequest as BookingEditRequestPayload & {
    initiatedBy?: "client" | "professional";
    editGrantActive?: boolean;
    requestedAt?: string | null;
    respondedAt?: string | null;
  };
  const initiatedBy = raw.initiated_by ?? raw.initiatedBy ?? "client";
  return {
    status: editRequest.status,
    note: editRequest.note,
    initiatedBy,
    requestedAt: raw.requested_at ?? raw.requestedAt ?? undefined,
    approvedAt:
      editRequest.status === "approved"
        ? (raw.responded_at ?? raw.respondedAt ?? undefined)
        : undefined,
    rejectedAt:
      editRequest.status === "rejected"
        ? (raw.responded_at ?? raw.respondedAt ?? undefined)
        : undefined,
    editGrantActive: Boolean(raw.edit_grant_active ?? raw.editGrantActive),
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
