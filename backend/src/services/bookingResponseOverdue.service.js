import { query } from "../db/index.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";

const NOTES_META_PREFIX = "---mollure-meta---";
const DEFAULT_WINDOW_MINUTES = Number(process.env.BOOKING_RESPOND_REMINDER_HOURS || 24) * 60;

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

function resolveWindowMinutes(meta, setupHours, setupMinutes) {
  const fromMeta = Number(meta?.responseWindowMinutes);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;

  const hours = Number(setupHours);
  const minutes = Number(setupMinutes);
  const total =
    (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
    (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  return total > 0 ? total : DEFAULT_WINDOW_MINUTES;
}

function resolveRespondByMs(meta, createdAt, updatedAt, windowMinutes) {
  if (meta?.respondBy) {
    const due = Date.parse(meta.respondBy);
    if (Number.isFinite(due)) return due;
  }

  if (meta?.responseStartedAt) {
    const start = Date.parse(meta.responseStartedAt);
    if (Number.isFinite(start)) return start + windowMinutes * 60_000;
  }

  // Prefer updated_at when notes already have negotiation meta (EBR/ER rounds).
  const hasNegotiation =
    Boolean(meta?.ebr) ||
    Boolean(meta?.er) ||
    meta?.responseStatus === "suggestion_for_change" ||
    meta?.requestDirection;
  const anchor = hasNegotiation ? updatedAt || createdAt : createdAt;
  const start = Date.parse(anchor);
  if (Number.isFinite(start)) return start + windowMinutes * 60_000;
  return null;
}

function hasPendingNegotiation(status, meta) {
  if (String(status).toLowerCase() === "requested") return true;
  if (String(status).toLowerCase() !== "confirmed") return false;
  const erStatus = String(meta?.er?.status ?? "").toLowerCase();
  return erStatus === "pending" || erStatus === "suggested";
}

/**
 * Permanently stamp responseStatus=overdue_response on pending BR/EBR/ER
 * once the response window elapses. Uses notes deadlines when present,
 * otherwise business_setup response_time_* / env fallback.
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
    if (meta.responseStatus === "overdue_response") continue;

    const windowMinutes = resolveWindowMinutes(
      meta,
      row.response_time_hours,
      row.response_time_minutes,
    );
    const dueMs = resolveRespondByMs(
      meta,
      row.created_at,
      row.updated_at,
      windowMinutes,
    );
    if (!dueMs || now <= dueMs) continue;

    const startedAt =
      meta.responseStartedAt ||
      new Date(dueMs - windowMinutes * 60_000).toISOString();
    const nextMeta = {
      ...meta,
      responseStatus: "overdue_response",
      responseStartedAt: startedAt,
      respondBy: meta.respondBy || new Date(dueMs).toISOString(),
      responseWindowMinutes: windowMinutes,
    };
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
