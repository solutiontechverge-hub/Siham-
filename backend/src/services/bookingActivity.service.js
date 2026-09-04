import { query } from "../db/index.js";

const KIND = {
  BOOKING_CREATED: "booking_created",
  BOOKING_REQUEST_SENT: "booking_request_sent",
  BOOKING_ACCEPTED: "booking_accepted",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_PREPAID: "booking_prepaid",
  BOOKING_CANCELLED: "booking_cancelled",
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

function mapEventRow(row) {
  return {
    id: row.id,
    bookingId: row.booking_id ? String(row.booking_id) : null,
    bookingCode: row.booking_code ?? null,
    kind: row.kind,
    title: row.title,
    actor: row.actor || "system",
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

    const result = await query(
      `INSERT INTO booking_activity_events (
         booking_id, booking_code, kind, title, actor, actor_label, subtitle, payload, occurred_at
       ) VALUES (
         $1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb, COALESCE($9::timestamptz, NOW())
       )
       RETURNING *`,
      [
        bookingId,
        bookingCode,
        input.kind,
        input.title,
        input.actor || "system",
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
export async function logBookingCreatedActivity(booking, { actorLabel, actor } = {}) {
  if (!booking?.id && !booking?.unique_code) return;

  const bookingId = booking.id ?? null;
  const bookingCode = booking.unique_code ?? null;
  const status = String(booking.status ?? "").toLowerCase();
  const bookingType = String(booking.booking_type ?? "").toLowerCase();
  const prepay = String(booking.prepayment_status ?? "").toLowerCase();
  const isOffline = bookingType === "offline" || String(bookingCode || "").startsWith("OF");
  const isRequestFlow = status === "requested";
  const clientLabel = actorLabel || "Client";
  const occurredAt = booking.created_at
    ? new Date(booking.created_at).toISOString()
    : new Date().toISOString();
  const priceSub = moneySubtitle(booking.total_price);

  if (isRequestFlow && !isOffline) {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_REQUEST_SENT,
      title: "Booking Request sent",
      actor: actor || "client",
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
    actor: actor || (isOffline ? "professional" : "client"),
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
  { previousStatus, previousPrepayment, actorLabel, cancellationReason } = {},
) {
  if (!booking?.id && !booking?.unique_code) return;

  const bookingId = booking.id ?? null;
  const bookingCode = booking.unique_code ?? null;
  const status = String(booking.status ?? "").toLowerCase();
  const prev = String(previousStatus ?? "").toLowerCase();
  const prepay = String(booking.prepayment_status ?? "").toLowerCase();
  const prevPrepay = String(previousPrepayment ?? "").toLowerCase();
  const clientLabel = actorLabel || "Client";
  const priceSub = moneySubtitle(booking.total_price);
  const now = new Date().toISOString();

  if (status !== prev) {
    if (status === "br_accepted" && prev === "requested") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_ACCEPTED,
        title: "Booking Request Accepted",
        actor: "professional",
        actorLabel: "Professional",
        occurredAt: now,
      });
    } else if (status === "confirmed" && prev === "requested") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_ACCEPTED,
        title: "Booking Request Accepted",
        actor: "professional",
        actorLabel: "Professional",
        occurredAt: now,
      });
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.BOOKING_CONFIRMED,
        title: "Confirmed",
        actor: "professional",
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
        actor: "client",
        actorLabel: clientLabel,
        occurredAt: now,
        payload: cancellationReason ? { cancellationReason } : {},
      });
    }

    if (status === "completed" && prev !== "completed" && prepay === "paid") {
      await appendBookingActivityEvent({
        bookingId,
        bookingCode,
        kind: KIND.POST_BOOKING_PAID,
        title: "Post Booking Paid",
        actor: "client",
        actorLabel: clientLabel,
        subtitle: priceSub,
        occurredAt: now,
      });
    }
  }

  if (prepay === "paid" && prevPrepay !== "paid") {
    await appendBookingActivityEvent({
      bookingId,
      bookingCode,
      kind: KIND.BOOKING_PREPAID,
      title: "Booking prepaid",
      actor: "client",
      actorLabel: clientLabel,
      subtitle: priceSub,
      occurredAt: now,
    });
  }
}

export async function logAddonPaidActivity({
  bookingId,
  bookingCode,
  amount,
  actorLabel,
  addonId,
}) {
  return appendBookingActivityEvent({
    bookingId,
    bookingCode,
    kind: KIND.ADDON_PAID,
    title: "Add-ons paid",
    actor: "client",
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
}) {
  return appendBookingActivityEvent({
    bookingId,
    bookingCode,
    kind: KIND.REFUND_COMPLETED,
    title: "Refund completed",
    actor: "professional",
    actorLabel: actorLabel || "Professional",
    occurredAt: new Date().toISOString(),
  });
}

export { KIND as BOOKING_ACTIVITY_KIND };
