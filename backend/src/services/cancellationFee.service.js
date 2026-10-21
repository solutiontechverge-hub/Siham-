/**
 * Apply Fresha-style cancellation fee + prepaid offset on booking cancel.
 * Appends immutable ledger events; does not delete PREPAYMENT rows.
 */
import { query } from "../db/index.js";
import { parseMoney, roundMoney } from "../utils/money.js";
import { evaluateCancellationFeePolicy } from "../utils/cancellationFeePolicy.js";
import {
  appendLedgerTransaction,
  listLedgerByBookingId,
  recalculateBookingFinancials,
} from "./bookingTransactionLedger.service.js";

const NOTES_META_PREFIX = "---mollure-meta---";

function parseNotesMeta(notes) {
  if (!notes || typeof notes !== "string") return {};
  const idx = notes.indexOf(NOTES_META_PREFIX);
  const raw =
    idx === -1 ? notes.trim() : notes.slice(idx + NOTES_META_PREFIX.length).trim();
  if (!raw.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function joinNotes(human, meta) {
  const prefix = human?.trim() ? `${human.trim()}\n` : "";
  return `${prefix}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
}

function splitNotes(raw) {
  const text = String(raw ?? "");
  const idx = text.indexOf(NOTES_META_PREFIX);
  if (idx === -1) return { human: text.trim(), meta: parseNotesMeta(text) };
  return { human: text.slice(0, idx).trim(), meta: parseNotesMeta(text) };
}

function snapshotBasePrice(meta, booking) {
  if (meta?.financials?.basePrice != null) {
    return roundMoney(Math.max(0, parseMoney(meta.financials.basePrice)));
  }
  const services = Array.isArray(meta?.clientSnapshot?.services)
    ? meta.clientSnapshot.services
    : [];
  if (services.length) {
    return roundMoney(services.reduce((s, row) => s + (Number(row.price) || 0), 0));
  }
  return roundMoney(Math.max(0, parseMoney(booking.total_price)));
}

async function loadCancelContext(bookingId) {
  const result = await query(
    `SELECT b.*,
            bs.late_cancellation_fee_percentage,
            bs.cancellation_before_hours,
            bs.professional_profile_id
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
      WHERE b.id = $1 OR b.unique_code = $1
      LIMIT 1`,
    [bookingId],
  );
  return result.rows[0] ?? null;
}

/**
 * @param {string} bookingId UUID or unique_code
 * @param {{ cancelledAt?: number|Date|string, actor?: string }} [opts]
 */
export async function applyCancellationFinancialsOnCancel(bookingId, opts = {}) {
  const booking = await loadCancelContext(bookingId);
  if (!booking) {
    throw new Error(`applyCancellationFinancialsOnCancel: booking not found (${bookingId})`);
  }

  const cancelledAtMs = (() => {
    if (opts.cancelledAt == null) return Date.now();
    if (typeof opts.cancelledAt === "number") return opts.cancelledAt;
    const ms = new Date(opts.cancelledAt).getTime();
    return Number.isFinite(ms) ? ms : Date.now();
  })();

  const startMs = booking.start_time
    ? new Date(booking.start_time).getTime()
    : null;

  const { human, meta } = splitNotes(booking.notes);
  const showLate = meta.showLateCancellation !== false;
  const feePercent = showLate
    ? Number(
        meta.lateCancellationFeePercent ??
          booking.late_cancellation_fee_percentage ??
          0,
      ) || 0
    : 0;
  const flatFeeAmount = Number(meta.lateCancellationFlatFee ?? 0) || 0;
  const noticeHours =
    Number(meta.cancellationNoticeHours ?? booking.cancellation_before_hours ?? 0) ||
    0;
  const noticeMinutes = Number(meta.cancellationNoticeMinutes ?? 0) || 0;
  const basePrice = snapshotBasePrice(meta, booking);

  const ledgerRows = await listLedgerByBookingId(booking.id);
  const prepaidPaid = roundMoney(
    ledgerRows
      .filter(
        (r) =>
          String(r.status).toLowerCase() === "completed" &&
          String(r.type).toUpperCase() === "PREPAYMENT",
      )
      .reduce((s, r) => s + parseMoney(r.amount), 0),
  );

  const outstandingRescheduleFee = (() => {
    const stamped = Number(meta.outstandingRescheduleFee ?? 0) || 0;
    if (stamped > 0) return roundMoney(stamped);
    if (!meta?.showLateRescheduling) return 0;
    let pct = Number(meta.lateRescheduleFeePercent) || 0;
    const ceiling = Number(meta.lateRescheduleFeePercentCeiling);
    if (Number.isFinite(ceiling) && ceiling >= 0) pct = Math.min(pct, ceiling);
    if (pct <= 0) return 0;
    return roundMoney((basePrice * pct) / 100);
  })();

  const evaluation = evaluateCancellationFeePolicy({
    appointmentStartMs: startMs,
    noticeHours,
    noticeMinutes,
    nowMs: cancelledAtMs,
    bookingTotal: basePrice,
    feePercent,
    flatFeeAmount,
    prepaidPaid,
    outstandingRescheduleFee,
  });

  // Idempotent: void prior cancel-fee / cancel-refund tagged events, then rewrite.
  await query(
    `UPDATE transactions SET status = 'voided'
      WHERE booking_id = $1
        AND status <> 'voided'
        AND (
          (type = 'CANCELLATION_FEE' AND COALESCE(metadata->>'reason','') = 'late_cancellation')
          OR (type = 'REFUND' AND COALESCE(metadata->>'reason','') = 'cancellation_prepaid_remainder')
        )`,
    [booking.id],
  );

  if (evaluation.cancellationFee > 0) {
    await appendLedgerTransaction({
      bookingId: booking.id,
      clientId: booking.customer_id ?? null,
      professionalProfileId: booking.professional_profile_id ?? null,
      type: "CANCELLATION_FEE",
      amount: evaluation.cancellationFee,
      performedByUserId: opts.performedByUserId ?? null,
      actor: opts.actor ?? null,
      metadata: {
        reason: "late_cancellation",
        feePercent: evaluation.feePercent,
        flatFeeAmount: evaluation.flatFeeAmount,
        hoursUntilAppointment: evaluation.hoursUntilAppointment,
        appliedFromPrepaid: evaluation.appliedFromPrepaid,
        actor: opts.actor ?? null,
        idempotency_key: `cancel-fee:${booking.id}:${cancelledAtMs}`,
      },
    });
  }

  // Free cancel or prepaid > fee: refund remainder. Never delete PREPAYMENT rows.
  if (evaluation.refundAmount > 0) {
    await appendLedgerTransaction({
      bookingId: booking.id,
      clientId: booking.customer_id ?? null,
      professionalProfileId: booking.professional_profile_id ?? null,
      type: "REFUND",
      amount: evaluation.refundAmount,
      performedByUserId: opts.performedByUserId ?? null,
      actor: opts.actor ?? null,
      metadata: {
        reason: "cancellation_prepaid_remainder",
        paymentStatus: evaluation.paymentStatus,
        actor: opts.actor ?? null,
        idempotency_key: `cancel-refund:${booking.id}:${cancelledAtMs}`,
      },
    });
  }

  const nextMeta = {
    ...meta,
    showLateCancellation: evaluation.isLateCancellation && evaluation.cancellationFee > 0,
    lateCancellationFeePercent: evaluation.feePercent,
    cancellationFeeAt: new Date(cancelledAtMs).toISOString(),
    exceededCancellationWindow: evaluation.isLateCancellation,
    cancellationPaymentStatus: evaluation.paymentStatus,
    cancellationSettlement: {
      feeTotal: evaluation.feeTotal,
      prepaidApplied: evaluation.appliedFromPrepaid,
      amountDue: evaluation.amountDueNow,
      refundAmount: evaluation.refundAmount,
      paymentStatus: evaluation.paymentStatus,
    },
    // Service obligation is released on cancel — net = fee only (Fresha-style).
    financials: {
      ...(meta.financials ?? {}),
      originalBasePrice: basePrice,
      basePrice: 0,
    },
  };

  await query(
    `UPDATE bookings
        SET status = 'cancelled',
            notes = $2,
            updated_at = NOW()
      WHERE id = $1`,
    [booking.id, joinNotes(human, nextMeta)],
  );

  const snapshot = await recalculateBookingFinancials(booking.id);

  // Stamp cancellation payment status onto persisted financials for clients.
  const { human: h2, meta: m2 } = splitNotes(
    (
      await query(`SELECT notes FROM bookings WHERE id = $1`, [booking.id])
    ).rows[0]?.notes,
  );
  const stamped = {
    ...m2,
    financials: {
      ...(m2.financials ?? {}),
      ...(snapshot.financials ?? {}),
      payment_status: evaluation.paymentStatus,
      cancellation_payment_status: evaluation.paymentStatus,
      updatedAt: new Date().toISOString(),
    },
    cancellationPaymentStatus: evaluation.paymentStatus,
  };
  await query(`UPDATE bookings SET notes = $2, updated_at = NOW() WHERE id = $1`, [
    booking.id,
    joinNotes(h2, stamped),
  ]);

  // Keep finance UI in sync for late fee / void unpaid prepay links.
  try {
    const { syncBookingToFinanceTransaction } = await import(
      "./finance-sync.service.js"
    );
    if (evaluation.feeTotal > 0) {
      // LCF amount only — sync also writes LRF from notes when stamped.
      await syncBookingToFinanceTransaction(booking.id, {
        paymentPhase: "full",
        paymentMethod:
          booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        amountOverride:
          evaluation.cancellationFee > 0 ? evaluation.cancellationFee : null,
        statusOverride:
          evaluation.paymentStatus === "PENDING_FEE"
            ? "Payment due"
            : evaluation.appliedFromPrepaid > 0 ||
                evaluation.paymentStatus === "REFUNDED" ||
                evaluation.paymentStatus === "PARTIALLY_REFUNDED" ||
                evaluation.paymentStatus === "NO_FEE"
              ? "Paid"
              : "Payment due",
      });
    }
  } catch {
    /* best-effort finance document sync */
  }

  return {
    bookingId: booking.id,
    uniqueCode: booking.unique_code,
    evaluation,
    financials: snapshot.financials,
    statuses: {
      booking_status: "cancelled",
      payment_status: evaluation.paymentStatus,
      prepayment_status: snapshot.statuses?.prepayment_status ?? null,
    },
  };
}
