/**
 * Confirmed Edit Request (ER) helpers for bookings.edit_request JSONB.
 */

export const EDIT_REQUEST_STATUSES = Object.freeze([
  "pending",
  "approved",
  "rejected",
]);

export const EDIT_REQUEST_INITIATORS = Object.freeze(["client", "professional"]);

export function parseEditRequest(raw) {
  if (!raw || typeof raw !== "object") return null;
  const status = String(raw.status ?? "").trim().toLowerCase();
  if (!EDIT_REQUEST_STATUSES.includes(status)) return null;
  const initiatedBy = String(raw.initiated_by ?? raw.initiatedBy ?? "")
    .trim()
    .toLowerCase();
  if (!EDIT_REQUEST_INITIATORS.includes(initiatedBy)) return null;
  return {
    status,
    note: String(raw.note ?? "").trim() || undefined,
    initiated_by: initiatedBy,
    requested_at: raw.requested_at ?? raw.requestedAt ?? null,
    responded_at: raw.responded_at ?? raw.respondedAt ?? null,
    edit_grant_active: Boolean(raw.edit_grant_active ?? raw.editGrantActive),
  };
}

export function isEditRequestPending(editRequest) {
  const er = parseEditRequest(editRequest);
  return Boolean(er && er.status === "pending");
}

export function isEditGrantActiveFor(editRequest, initiator) {
  const er = parseEditRequest(editRequest);
  if (!er || er.status !== "approved" || !er.edit_grant_active) return false;
  if (initiator && er.initiated_by !== initiator) return false;
  return true;
}

export function buildPendingEditRequest({ note, initiatedBy }) {
  const trimmed = String(note ?? "").trim();
  const by = String(initiatedBy ?? "").trim().toLowerCase();
  if (!trimmed) {
    return { error: "Edit request note is required." };
  }
  if (!EDIT_REQUEST_INITIATORS.includes(by)) {
    return { error: "initiated_by must be client or professional." };
  }
  return {
    value: {
      status: "pending",
      note: trimmed,
      initiated_by: by,
      requested_at: new Date().toISOString(),
      responded_at: null,
      edit_grant_active: false,
    },
  };
}

export function buildApprovedEditRequest(existing) {
  const er = parseEditRequest(existing);
  if (!er || er.status !== "pending") {
    return { error: "No pending edit request to accept." };
  }
  return {
    value: {
      ...er,
      status: "approved",
      responded_at: new Date().toISOString(),
      edit_grant_active: true,
    },
  };
}

/**
 * Reject keeps booking Confirmed and marks ER rejected (UI: ER + cross).
 * A new ER send supersedes any existing pending (no queue).
 */
export function buildRejectedEditRequest(existing) {
  const er = parseEditRequest(existing);
  if (!er || er.status !== "pending") {
    return { error: "No pending edit request to reject." };
  }
  return {
    value: {
      ...er,
      status: "rejected",
      responded_at: new Date().toISOString(),
      edit_grant_active: false,
    },
  };
}

/** @deprecated Prefer buildRejectedEditRequest — kept for any legacy callers. */
export function buildRejectedClear() {
  return { value: null };
}

/** After one successful save by the requester, clear ER entirely. */
export function consumeEditGrant(existing, actor) {
  const er = parseEditRequest(existing);
  if (!er || er.status !== "approved" || !er.edit_grant_active) {
    return { consumed: false, value: existing ?? null };
  }
  if (actor && er.initiated_by !== actor) {
    return { consumed: false, value: er };
  }
  return { consumed: true, value: null };
}
