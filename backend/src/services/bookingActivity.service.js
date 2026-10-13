import { query } from "../db/index.js";

const KIND = {
  BOOKING_CREATED: "booking_created",
  BOOKING_REQUEST_SENT: "booking_request_sent",
  BOOKING_ACCEPTED: "booking_accepted",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_PREPAID: "booking_prepaid",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_UPDATED: "booking_updated",
  EDIT_REQUEST_SENT: "edit_request_sent",
  EDIT_REQUEST_SUGGEST: "edit_request_suggest",
  EDIT_REQUEST_ACCEPTED: "edit_request_accepted",
  POST_BOOKING_PAID: "post_booking_paid",
  FEE_PAID: "fee_paid",
  ADDON_PAID: "addon_paid",
  REFUND_COMPLETED: "refund_completed",
};

function moneySubtitle(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `Online Direct (${n.toFixed(2)} EUR)`;
}

function parseNotesCancellationReason(notes) {
  const raw = String(notes ?? "");
  const marker = "---mollure-meta---";
  const idx = raw.indexOf(marker);
  if (idx < 0) return null;
  try {
    const meta = JSON.parse(raw.slice(idx + marker.length).trim() || "{}");
    const reason = typeof meta.cancellationReason === "string" ? meta.cancellationReason.trim() : "";
    return reason || null;
  } catch {
    return null;
  }
}

function mapEventRow(row) {
  const actionType = row.action_type || row.kind;
  const actorRole = row.actor_role || row.actor || "system";
  return {
    id: row.id,
    bookingId: row.booking_id ? String(row.booking_id) : null,
    bookingCode: row.booking_code ?? null,
    kind: row.kind,
    action_type: actionType,
    actionType,
    title: row.title,
    action: row.action || row.title,
    actor: actorRole,
    actor_role: actorRole,
    actorRole,
    user_id: row.user_id ? String(row.user_id) : null,
    userId: row.user_id ? String(row.user_id) : null,
    actorLabel: row.actor_label || "System",
    subtitle: row.subtitle ?? null,
    payload: row.payload ?? {},
    occurredAt: row.occurred_at
      ? new Date(row.occurred_at).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Append a booking activity event. Failures are logged but do not throw by default.
 */
export async function appendBookingActivityEvent(input, { throwOnError = false } = {}) {
  try {
    const bookingId = input.bookingId || null;
    const bookingCode = input.bookingCode || null;
    if (!bookingId && !bookingCode) {
      throw new Error("bookingId or bookingCode is required.");
    }
    if (!input.kind || !input.title) {
      throw new Error("kind and title are required.");
    }

    const actionType = input.actionType || input.action_type || input.kind;
    const actorRole = input.actorRole || input.actor_role || input.actor || "system";
    const userId = input.userId || input.user_id || null;

    const result = await query(
      `INSERT INTO booking_activity_events (
         booking_id, booking_code, kind, action_type, title, action,
         actor, actor_role, user_id, actor_label, subtitle, payload, occurred_at
       ) VALUES (
         $1::uuid, $2, $3, $4, $5, $5,
         $6, $6, $7::uuid, $8, $9, $10::jsonb, COALESCE($11::timestamptz, NOW())
       )
       RETURNING *`,
      [
        bookingId,
        bookingCode,
        input.kind,
        actionType,
        input.title,
        actorRole,
        userId,
        input.actorLabel || "System",
        input.subtitle ?? null,
        JSON.stringify(input.payload ?? {}),
        input.occurredAt ?? null,
      ],
    );
    return mapEventRow(result.rows[0]);
  } catch (error) {
    console.error("[booking-activity] Failed to append event:", error.message);
    if (throwOnError) throw error;
    return null;
  }
}

export async function listBookingActivityEvents({ bookingId, bookingCode } = {}) {
  if (!bookingId && !bookingCode) return [];

  const conditions = [];
  const values = [];
  let idx = 1;

  if (bookingId) {
    conditions.push(`booking_id = $${idx}::uuid`);
    values.push(bookingId);
    idx += 1;
  }
  if (bookingCode) {
    conditions.push(`booking_code = $${idx}`);
    values.push(bookingCode);
    idx += 1;
  }

  const where =
    conditions.length === 1
      ? conditions[0]
      : `(${conditions.join(" OR ")})`;

  const result = await query(
    `SELECT *
     FROM booking_activity_events
     WHERE ${where}
     ORDER BY occurred_at DESC, created_at DESC`,
    values,
  );
  return result.rows.map(mapEventRow);
}

/**
 * Log lifecycle events when a booking (or calendar entry) is first created.
 */
export async function logBookingCreatedActivity(booking, { actorLabel, actor, userId } = {}) {
  if (!booking?.id && !booking?.unique_code) return;

  const bookingId = booking.id ?? null;
  const bookingCode = booking.unique_code ?? null;
  const status = String(booking.status ?? "").toLowerCase();
  const bookingType = String(booking.booking_type ?? "").toLowerCase();
  const prepay = String(booking.prepayment_status ?? "").toLowerCase();
  const isOffline =
    bookingType === "offline" ||
    String(bookingCode || "")
      .toLowerCase()
      .startsWith("of");
  const isRequestFlow = status === "requested";
  const clientLabel = actorLabel || "Client";
  const occurredAt = booking.created_at
    ? new Date(booking.created_at).toISOString()
    : new Date().toISOString();
  const priceSub = moneySubtitle(booking.total_price);
  const actorRole = actor || (isOffline ? "professional" : "client");

  if (isRequestFlow && !isOffline) {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_REQUEST_SENT,
      title: "Booking Request sent",
      actor: actorRole,
      actorRole,
      userId: userId || null,
      actorLabel: clientLabel,
      occurredAt,
    });
    return;
  }

  await appendBookingActivityEvent({
    bookingId,
    bookingCode,
    kind: KIND.BOOKING_CREATED,
    title: prepay === "paid" ? "Booking created and prepaid" : "Booking created",
    actor: actorRole,
    actorRole,
    userId: userId || null,
    actorLabel: isOffline ? actorLabel || "Professional" : clientLabel,
    subtitle: prepay === "paid" ? priceSub : null,
    occurredAt,
  });

  if (status === "confirmed" || status === "completed") {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_CONFIRMED,
      title: "Confirmed",
      actor: "professional",
      actorRole: "professional",
      userId: userId || null,
      actorLabel: "Professional",
      occurredAt,
    });
  }

  if (prepay === "paid") {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_PREPAID,
      title: "Booking prepaid",
      actor: "client",
      actorRole: "client",
      userId: userId || null,
      actorLabel: clientLabel,
      subtitle: priceSub,
      occurredAt,
    });
  }
}

/**
 * Log status / payment transitions (confirm, cancel, pay, complete).
 */
export async function logBookingStatusActivity(
  booking,
  {
    previousStatus,
    previousPrepayment,
    actorLabel,
    actor,
    userId,
    cancellationReason,
  } = {},
) {
  if (!booking?.id && !booking?.unique_code) return;

  const bookingId = booking.id ?? null;
  const bookingCode = booking.unique_code ?? null;
  const status = String(booking.status ?? "").toLowerCase();
  const prev = String(previousStatus ?? "").toLowerCase();
  const prepay = String(booking.prepayment_status ?? "").toLowerCase();
  const prevPrepay = String(previousPrepayment ?? "").toLowerCase();
  const bookingType = String(booking.booking_type ?? "").toLowerCase();
  const isOffline =
    bookingType === "offline" ||
    String(bookingCode || "")
      .toLowerCase()
      .startsWith("of");
  // "Booking Request Accepted" only for online request flows — never offline calendar.
  const canLogRequestAccepted = !isOffline;
  const actorRole = actor || "client";
  const clientLabel = actorLabel || (actorRole === "professional" ? "Professional" : "Client");
  const priceSub = moneySubtitle(booking.total_price);
  const now = new Date().toISOString();
  const cancelReason =
    cancellationReason || parseNotesCancellationReason(booking.notes) || null;

  if (status !== prev) {
    if (status === "br_accepted" && prev === "requested") {
      if (canLogRequestAccepted) {
        await appendBookingActivityEvent({
          bookingId,
          bookingCode,
          kind: KIND.BOOKING_ACCEPTED,
          title: "Booking Request Accepted",
          actor: "professional",
          actorRole: "professional",
          userId: userId || null,
          actorLabel: "Professional",
          occurredAt: now,
        });
      }
    } else if (status === "confirmed" && prev === "requested") {
      if (canLogRequestAccepted) {
        await appendBookingActivityEvent({
          bookingId,
          bookingCode,
          kind: KIND.BOOKING_ACCEPTED,
          title: "Booking Request Accepted",
          actor: "professional",
          actorRole: "professional",
          userId: userId || null,
          actorLabel: "Professional",
          occurredAt: now,
        });
      }
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_CONFIRMED,
        title: "Confirmed",
        actor: "professional",
        actorRole: "professional",
        userId: userId || null,
        actorLabel: "Professional",
        occurredAt: now,
      });
    } else if (status === "confirmed" && prev === "br_accepted") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_CONFIRMED,
        title: "Confirmed",
        actor: prepay === "paid" ? "client" : "professional",
        actorRole: prepay === "paid" ? "client" : "professional",
        userId: userId || null,
        actorLabel: prepay === "paid" ? clientLabel : "Professional",
        occurredAt: now,
      });
    } else if (status === "confirmed" && prev !== "confirmed" && prev !== "requested" && prev !== "br_accepted") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_CONFIRMED,
        title: "Confirmed",
        actor: "professional",
        actorRole: "professional",
        userId: userId || null,
        actorLabel: "Professional",
        occurredAt: now,
      });
    }

    if (status === "cancelled" || status === "canceled") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_CANCELLED,
        title: "Booking Cancelled",
        actor: actorRole,
        actorRole,
        userId: userId || null,
        actorLabel: clientLabel,
        occurredAt: now,
        payload: cancelReason ? { cancellationReason: cancelReason } : {},
      });
    }

    // ponytail: do not invent "Post Booking Paid" on complete+prepaid —
    // that is not a payment transition. Wire when a real post-pay completes.
  }

  if (prepay === "paid" && prevPrepay !== "paid") {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_PREPAID,
      title: "Booking prepaid",
      actor: "client",
      actorRole: "client",
      userId: userId || null,
      actorLabel: clientLabel,
      subtitle: priceSub,
      occurredAt: now,
    });
  }
}

/** Log Confirmed Edit Request (ER) send / accept. Reject is notification-only (no timeline row). */
export async function logEditRequestActivity(
  booking,
  { action, actor, userId, actorLabel } = {},
) {
  if (!booking?.id && !booking?.unique_code) return;
  const bookingId = booking.id ?? null;
  const bookingCode = booking.unique_code ?? null;
  const actorRole = actor || "client";
  const label =
    actorLabel || (actorRole === "professional" ? "Professional" : "Client");
  const now = new Date().toISOString();

  if (action === "send") {
    return appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.EDIT_REQUEST_SENT,
      title: "Edit Request sent",
      actor: actorRole,
      actorRole,
      userId: userId || null,
      actorLabel: label,
      occurredAt: now,
    });
  }
  if (action === "accept") {
    return appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.EDIT_REQUEST_ACCEPTED,
      title: "Edit Request accepted",
      actor: actorRole,
      actorRole,
      userId: userId || null,
      actorLabel: label,
      occurredAt: now,
    });
  }
  return null;
}

export async function logAddonPaidActivity({
  bookingId,
  bookingCode,
  amount,
  actorLabel,
  addonId,
  userId,
}) {
  return appendBookingActivityEvent({
    bookingId,
    bookingCode,
    kind: KIND.ADDON_PAID,
    title: "Add-ons paid",
    actor: "client",
    actorRole: "client",
    userId: userId || null,
    actorLabel: actorLabel || "Client",
    subtitle: moneySubtitle(amount),
    payload: addonId ? { addonId } : {},
    occurredAt: new Date().toISOString(),
  });
}

export async function logRefundCompletedActivity({
  bookingId,
  bookingCode,
  actorLabel,
  userId,
}) {
  return appendBookingActivityEvent({
    bookingId,
    bookingCode,
    kind: KIND.REFUND_COMPLETED,
    title: "Refund completed",
    actor: "professional",
    actorRole: "professional",
    userId: userId || null,
    actorLabel: actorLabel || "Professional",
    occurredAt: new Date().toISOString(),
  });
}

export { KIND as BOOKING_ACTIVITY_KIND };
