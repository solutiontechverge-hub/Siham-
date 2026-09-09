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

function hasPendingNegotiation(status, meta) {
  if (String(status).toLowerCase() === "requested") return true;
  if (String(status).toLowerCase() !== "confirmed") return false;
  const erStatus = String(meta?.er?.status ?? "").toLowerCase();
  return erStatus === "pending" || erStatus === "suggested";
}

/**
 * Stamp / clear responseStatus=overdue_response from the live business-template
 * window (flat 30-minute default when unset). Template edits apply immediately
 * to open BR/EBR/ER negotiations.
 */
export async function processOverdueResponseStatusUpdates() {
  const result = await query(
    `SELECT
       b.id,
       b.status,
       b.notes,
       b.created_at,
       b.updated_at,
       b.unique_code,
       b.customer_id,
       b.business_setup_id,
       bs.response_time_hours,
       bs.response_time_minutes
     FROM bookings b
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     WHERE LOWER(COALESCE(b.status, '')) IN ('requested', 'confirmed')
       AND COALESCE(b.notes, '') <> ''`,
  );

  const now = Date.now();
  let flipped = 0;

  for (const row of result.rows) {
    const { human, meta } = splitNotes(row.notes);
    if (!hasPendingNegotiation(row.status, meta)) continue;
    if (!hasNotesResponseDeadline(meta)) continue;

    const windowMinutes = resolveResponseWindowMinutes(
      row.response_time_hours,
      row.response_time_minutes,
    );
    const dueMs = resolveEffectiveRespondByMs(meta, windowMinutes);
    if (dueMs == null) continue;

    const isOverdue = now > dueMs;
    const wasOverdue = meta.responseStatus === "overdue_response";

    if (isOverdue && wasOverdue) {
      // Keep snapshot fields aligned with the live window.
      if (
        Number(meta.responseWindowMinutes) === windowMinutes &&
        meta.respondBy === new Date(dueMs).toISOString()
      ) {
        continue;
      }
    } else if (!isOverdue && !wasOverdue) {
      continue;
    }

    const startedAt =
      meta.responseStartedAt ||
      new Date(dueMs - windowMinutes * 60_000).toISOString();
    const nextMeta = {
      ...meta,
      responseStartedAt: startedAt,
      respondBy: new Date(dueMs).toISOString(),
      responseWindowMinutes: windowMinutes,
    };
    if (isOverdue) {
      nextMeta.responseStatus = "overdue_response";
    } else {
      delete nextMeta.responseStatus;
    }

    const nextNotes = joinNotes(human, nextMeta);

    const updated = await query(
      `UPDATE bookings
       SET notes = $1,
           updated_at = NOW()
       WHERE id = $2
         AND LOWER(COALESCE(status, '')) IN ('requested', 'confirmed')
       RETURNING *`,
      [nextNotes, row.id],
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
