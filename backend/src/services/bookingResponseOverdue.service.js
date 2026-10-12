import { query } from "../db/index.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";
import {
  resolveEffectiveRespondByMs,
  resolveResponseWindowMinutes,
} from "../utils/bookingResponseWindow.js";

const NOTES_META_PREFIX = "---mollure-meta---";

function splitNotes(raw) {
  const text = String(raw ?? "");
  const markerIndex = text.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) {
    return { human: text.trim(), meta: {} };
  }
  const human = text.slice(0, markerIndex).trim();
  const metaRaw = text.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw || "{}");
    return { human, meta: meta && typeof meta === "object" ? meta : {} };
  } catch {
    return { human, meta: {} };
  }
}

function joinNotes(human, meta) {
  const prefix = human?.trim() ? `${human.trim()}\n` : "";
  return `${prefix}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
}

function hasNotesResponseDeadline(meta) {
  if (!meta || typeof meta !== "object") return false;
  if (meta.respondBy) return true;
  if (meta.responseStartedAt) return true;
  if (Number(meta.responseWindowMinutes) > 0) return true;
  return false;
}

function hasPendingNegotiation(status, meta, prepaymentStatus) {
  const normalized = String(status).toLowerCase();
  if (normalized === "requested") return true;
  // BR Accepted waiting on client prepayment — same response clock / orange path.
  if (normalized === "br_accepted") {
    const prepay = String(
      prepaymentStatus ?? meta?.prepaymentStatus ?? "",
    ).toLowerCase();
    if (prepay === "paid" || prepay === "confirmed") return false;
    return (
      Boolean(meta?.showPrepayment) ||
      prepay === "pending" ||
      prepay === "required" ||
      prepay === ""
    );
  }
  if (normalized !== "confirmed") return false;
  const erStatus = String(meta?.er?.status ?? "").toLowerCase();
  return erStatus === "pending" || erStatus === "suggested";
}

/**
 * Stamp / clear responseStatus=overdue_response from the frozen deadline
 * (response_deadline_at, else notes respondBy). Never rewrites the clock.
 */
export async function processOverdueResponseStatusUpdates() {
  const result = await query(
    `SELECT
       b.id,
       b.status,
       b.notes,
       b.created_at,
       b.updated_at,
       b.response_deadline_at,
       b.prepayment_status,
       b.unique_code,
       b.customer_id,
       b.business_setup_id,
       bs.response_time_hours,
       bs.response_time_minutes
     FROM bookings b
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     WHERE LOWER(COALESCE(b.status, '')) IN ('requested', 'confirmed', 'br_accepted')
       AND COALESCE(b.notes, '') <> ''`,
  );

  const now = Date.now();
  let flipped = 0;

  for (const row of result.rows) {
    const { human, meta } = splitNotes(row.notes);
    if (!hasPendingNegotiation(row.status, meta, row.prepayment_status)) continue;
    if (!hasNotesResponseDeadline(meta) && !row.response_deadline_at) continue;

    const windowMinutes = resolveResponseWindowMinutes(
      row.response_time_hours,
      row.response_time_minutes,
      meta.responseWindowMinutes,
    );
    const dueMs = row.response_deadline_at
      ? new Date(row.response_deadline_at).getTime()
      : resolveEffectiveRespondByMs(meta, windowMinutes);
    if (dueMs == null) continue;

    const isOverdue = now > dueMs;
    const wasOverdue = meta.responseStatus === "overdue_response";
    if (isOverdue === wasOverdue) continue;

    const nextMeta = { ...meta };
    if (isOverdue) {
      nextMeta.responseStatus = "overdue_response";
    } else {
      delete nextMeta.responseStatus;
    }

    const nextNotes = joinNotes(human, nextMeta);

    const updated = await query(
      `UPDATE bookings
       SET notes = $1,
           response_deadline_at = COALESCE(response_deadline_at, $3::timestamptz),
           updated_at = NOW()
       WHERE id = $2
         AND LOWER(COALESCE(status, '')) IN ('requested', 'confirmed', 'br_accepted')
       RETURNING *`,
      [nextNotes, row.id, new Date(dueMs).toISOString()],
    );

    const booking = updated.rows[0];
    if (!booking) continue;
    flipped += 1;
    try {
      emitBookingChanged(booking, "updated");
    } catch {
      // best-effort socket fanout
    }
  }

  return flipped;
}
