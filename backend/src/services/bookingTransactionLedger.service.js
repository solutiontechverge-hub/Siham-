/**
 * Append-only booking transaction ledger (DB access).
 * Does not mutate finance_transactions or booking status columns — callers
 * opt in to dual-write and to apply deriveStatusesFromFinancials().
 */
import { query } from "../db/index.js";
import { logSettledBookingPaymentActivity } from "./bookingActivity.service.js";
import { parseMoney, roundMoney, serviceLineList, serviceLineNet } from "../utils/money.js";
import {
  LEDGER_TYPES,
  computeBookingFinancials,
  deriveStatusesFromFinancials,
  selectBurstDedupedAddonRows,
} from "../utils/bookingFinancialLedger.js";
import {
  clampPaymentAmount,
  clampRefundAmount,
  withFinancialAuditMetadata,
} from "../utils/bookingFinancialGuards.js";

const VALID_TYPES = new Set(LEDGER_TYPES);

async function withPaymentActivity(row) {
  await logSettledBookingPaymentActivity(row);
  return row;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking_id: row.booking_id,
    client_id: row.client_id,
    professional_profile_id: row.professional_profile_id,
    finance_transaction_id: row.finance_transaction_id,
    type: row.type,
    amount: roundMoney(parseMoney(row.amount)),
    status: row.status,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    created_at: row.created_at,
  };
}

/**
 * Insert one immutable ledger event.
 * Guardrails: clamp REFUND ≤ paid−refunded; clamp PAYMENT/PREPAYMENT ≤ outstanding
 * (unless metadata.storeCredit); stamp performed_by_user_id + performed_at; honor
 * idempotency_key / finance_transaction_id uniqueness.
 * @param {{
 *   bookingId?: string|null,
 *   clientId?: string|null,
 *   professionalProfileId?: string|null,
 *   financeTransactionId?: string|null,
 *   type: string,
 *   amount: number|string,
 *   status?: string,
 *   metadata?: object,
 *   performedByUserId?: string|null,
 *   actor?: string|null,
 *   skipBalanceGuards?: boolean,
 * }} input
 */
export async function appendLedgerTransaction(input) {
  const type = String(input.type ?? "").toUpperCase();
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Invalid ledger type: ${input.type}`);
  }
  let amount = roundMoney(Math.max(0, parseMoney(input.amount)));
  const status = String(input.status ?? "completed").toLowerCase();
  const bookingId = input.bookingId ?? input.booking_id ?? null;
  const clientId = input.clientId ?? input.client_id ?? null;
  if (!bookingId && !clientId) {
    throw new Error("appendLedgerTransaction requires bookingId or clientId");
  }

  const financeTransactionId =
    input.financeTransactionId ?? input.finance_transaction_id ?? null;
  const metadata = withFinancialAuditMetadata(input.metadata ?? {}, {
    performedByUserId: input.performedByUserId,
    actor: input.actor,
    idempotencyKey: input.metadata?.idempotency_key ?? input.idempotencyKey,
  });

  // Concurrent double-submit: reuse existing row for same finance tx + type.
  if (financeTransactionId && status !== "voided") {
    const existing = await query(
      `SELECT * FROM transactions
        WHERE finance_transaction_id = $1 AND type = $2 AND status <> 'voided'
        LIMIT 1`,
      [financeTransactionId, type],
    );
    if (existing.rows[0]) return withPaymentActivity(mapRow(existing.rows[0]));
  }
  if (metadata.idempotency_key) {
    const byKey = await query(
      `SELECT * FROM transactions
        WHERE metadata->>'idempotency_key' = $1 AND status <> 'voided'
        LIMIT 1`,
      [String(metadata.idempotency_key)],
    );
    if (byKey.rows[0]) return withPaymentActivity(mapRow(byKey.rows[0]));
  }

  // Balance clamps (skip for fee/discount/add-on charge lines and explicit bypass).
  if (
    !input.skipBalanceGuards &&
    bookingId &&
    status === "completed" &&
    (type === "REFUND" || type === "PAYMENT" || type === "PREPAYMENT")
  ) {
    const rows = await listLedgerByBookingId(bookingId);
    let basePrice = input.basePrice != null ? parseMoney(input.basePrice) : null;
    if (basePrice == null || !Number.isFinite(basePrice)) {
      const bookingRes = await query(
        `SELECT total_price, notes FROM bookings WHERE id = $1 LIMIT 1`,
        [bookingId],
      );
      const booking = bookingRes.rows[0];
      const { meta } = splitBookingNotes(booking?.notes);
      basePrice = snapshotServiceBasePrice(meta, booking);
    }
    const financials = computeBookingFinancials(rows, { basePrice });
    if (type === "REFUND") {
      const clamped = clampRefundAmount(amount, financials);
      if (clamped.capped) {
        metadata.guardrail = {
          ...(metadata.guardrail || {}),
          over_refund_clamped: true,
          requested: clamped.requested,
          max_refundable: clamped.maxRefundable,
        };
      }
      amount = clamped.amount;
      if (amount <= 0) {
        throw new Error("Refund rejected: nothing left to refund (would over-refund).");
      }
    } else {
      const allowStoreCredit = Boolean(metadata.storeCredit || metadata.store_credit);
      const clamped = clampPaymentAmount(amount, financials, { allowStoreCredit });
      if (clamped.capped) {
        metadata.guardrail = {
          ...(metadata.guardrail || {}),
          over_payment_clamped: true,
          requested: clamped.requested,
          max_payable: clamped.maxPayable,
        };
      }
      amount = clamped.amount;
      if (amount <= 0 && !allowStoreCredit) {
        throw new Error("Payment rejected: outstanding balance is already settled.");
      }
    }
  }

  try {
    const result = await query(
      `INSERT INTO transactions (
         booking_id, client_id, professional_profile_id, finance_transaction_id,
         type, amount, status, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING *`,
      [
        bookingId,
        clientId,
        input.professionalProfileId ?? input.professional_profile_id ?? null,
        financeTransactionId,
        type,
        amount,
        status,
        JSON.stringify(metadata),
      ],
    );
    return withPaymentActivity(mapRow(result.rows[0]));
  } catch (err) {
    // Unique index race: return the winner row instead of 500.
    const code = err?.code;
    if (code === "23505" && financeTransactionId) {
      const raced = await query(
        `SELECT * FROM transactions
          WHERE finance_transaction_id = $1 AND type = $2 AND status <> 'voided'
          LIMIT 1`,
        [financeTransactionId, type],
      );
      if (raced.rows[0]) return withPaymentActivity(mapRow(raced.rows[0]));
    }
    if (code === "23505" && metadata.idempotency_key) {
      const raced = await query(
        `SELECT * FROM transactions
          WHERE metadata->>'idempotency_key' = $1 AND status <> 'voided'
          LIMIT 1`,
        [String(metadata.idempotency_key)],
      );
      if (raced.rows[0]) return withPaymentActivity(mapRow(raced.rows[0]));
    }
    throw err;
  }
}

/** Soft-void: only allowed mutation on the ledger. */
export async function voidLedgerTransaction(id) {
  const result = await query(
    `UPDATE transactions SET status = 'voided' WHERE id = $1 AND status <> 'voided' RETURNING *`,
    [id],
  );
  return mapRow(result.rows[0] ?? null);
}

/** Void every ledger event linked to a finance_transactions row. */
export async function voidLedgerForFinanceTransaction(financeTransactionId) {
  if (!financeTransactionId) return 0;
  const result = await query(
    `UPDATE transactions SET status = 'voided'
      WHERE finance_transaction_id = $1 AND status <> 'voided'`,
    [financeTransactionId],
  );
  return result.rowCount ?? 0;
}

function resolveLedgerTypeFromFinance({ paymentPhase, entryLabel }) {
  const label = String(entryLabel ?? "").toLowerCase();
  const phase = String(paymentPhase ?? "").toLowerCase();
  if (label.includes("late cancellation") || label.includes("no-show") || label.includes("no show")) {
    return "CANCELLATION_FEE";
  }
  if (label.includes("late reschedul")) return "CANCELLATION_FEE";
  if (phase === "prepay" || label === "prepayment") return "PREPAYMENT";
  if (phase === "addon" || label.includes("add-on") || label.includes("addon")) return "ADD_ON";
  return "PAYMENT";
}

async function resolveBookingUuid(bookingRef) {
  if (!bookingRef) return null;
  const raw = String(bookingRef);
  const byId = await query(`SELECT id FROM bookings WHERE id::text = $1 LIMIT 1`, [raw]);
  if (byId.rows[0]?.id) return byId.rows[0].id;
  const byCode = await query(`SELECT id FROM bookings WHERE unique_code = $1 LIMIT 1`, [raw]);
  return byCode.rows[0]?.id ?? null;
}

/**
 * Dual-write: mirror a settled finance row into an immutable ledger event.
 * Skips if a non-voided event already exists for this finance_transaction_id + type.
 */
export async function mirrorSettledFinanceToLedger({
  bookingId,
  bookingRef,
  clientId = null,
  professionalProfileId = null,
  financeTransactionId,
  paymentPhase = null,
  entryLabel = null,
  status,
  amount,
  metadata = {},
}) {
  if (!isSettledLike(status)) return null;
  const bookingUuid = bookingId ?? (await resolveBookingUuid(bookingRef));
  if (!bookingUuid && !clientId) return null;

  const type = resolveLedgerTypeFromFinance({ paymentPhase, entryLabel });
  const money = roundMoney(Math.max(0, parseMoney(amount)));
  if (money <= 0) return null;

  const existing = await query(
    `SELECT * FROM transactions
      WHERE finance_transaction_id = $1 AND type = $2 AND status <> 'voided'
      LIMIT 1`,
    [financeTransactionId, type],
  );
  if (existing.rows[0]) return withPaymentActivity(mapRow(existing.rows[0]));

  const meta = {
    ...metadata,
    paymentPhase: paymentPhase ?? null,
    entryLabel: entryLabel ?? null,
    source: "finance_transactions",
  };
  const row = await appendLedgerTransaction({
    bookingId: bookingUuid,
    clientId,
    professionalProfileId,
    financeTransactionId,
    type,
    amount: money,
    status: "completed",
    performedByUserId: metadata.performed_by_user_id ?? null,
    actor: metadata.actor ?? null,
    metadata: {
      ...meta,
      idempotency_key: financeTransactionId
        ? `settle:${financeTransactionId}:${type}`
        : meta.idempotency_key,
    },
  });

  // Settled add-on: charge (ADD_ON) + cash-in (PAYMENT) so outstanding nets correctly.
  if (type === "ADD_ON") {
    const payExisting = await query(
      `SELECT id FROM transactions
        WHERE finance_transaction_id = $1 AND type = 'PAYMENT' AND status <> 'voided'
        LIMIT 1`,
      [financeTransactionId],
    );
    if (!payExisting.rows[0]) {
      await appendLedgerTransaction({
        bookingId: bookingUuid,
        clientId,
        professionalProfileId,
        financeTransactionId,
        type: "PAYMENT",
        amount: money,
        status: "completed",
        performedByUserId: metadata.performed_by_user_id ?? null,
        actor: metadata.actor ?? null,
        metadata: {
          ...meta,
          settlesAddon: true,
          idempotency_key: financeTransactionId
            ? `settle:${financeTransactionId}:PAYMENT`
            : undefined,
        },
      });
    }
  }

  return row;
}

/** Append a REFUND ledger event for an in-place finance refund. */
export async function mirrorRefundToLedger({
  bookingId,
  bookingRef,
  clientId = null,
  professionalProfileId = null,
  financeTransactionId,
  refundAmount,
  metadata = {},
  performedByUserId = null,
  actor = null,
}) {
  const bookingUuid = bookingId ?? (await resolveBookingUuid(bookingRef));
  if (!bookingUuid && !clientId) return null;
  const money = roundMoney(Math.max(0, parseMoney(refundAmount)));
  if (money <= 0) return null;

  const existing = await query(
    `SELECT id FROM transactions
      WHERE finance_transaction_id = $1 AND type = 'REFUND' AND status <> 'voided'
      LIMIT 1`,
    [financeTransactionId],
  );
  if (existing.rows[0]) return mapRow(existing.rows[0]);

  const row = await appendLedgerTransaction({
    bookingId: bookingUuid,
    clientId,
    professionalProfileId,
    financeTransactionId,
    type: "REFUND",
    amount: money,
    status: "completed",
    performedByUserId,
    actor: actor ?? "professional",
    metadata: {
      ...metadata,
      source: "finance_transactions",
      idempotency_key: financeTransactionId
        ? `refund:${financeTransactionId}`
        : metadata.idempotency_key,
    },
  });

  return row;
}

/**
 * After a booking PATCH sets client-supplied total_price, re-derive money from the
 * ledger when ledger events exist (single calculation pipeline).
 */
export async function reconcileBookingTotalFromLedger(bookingId) {
  const bookingUuid = await resolveBookingUuid(bookingId);
  if (!bookingUuid) return null;
  const count = await query(
    `SELECT COUNT(*)::int AS n FROM transactions
      WHERE booking_id = $1 AND status = 'completed'`,
    [bookingUuid],
  );
  if ((count.rows[0]?.n ?? 0) <= 0) return null;
  return recalculateBookingFinancials(bookingUuid);
}

function isSettledLike(status) {
  const s = String(status ?? "");
  return s === "Paid" || s === "Prepaid";
}

export async function listLedgerByBookingId(bookingId) {
  const result = await query(
    `SELECT * FROM transactions WHERE booking_id = $1 ORDER BY created_at ASC, id ASC`,
    [bookingId],
  );
  return result.rows.map(mapRow);
}

export async function listLedgerByClientId(clientId) {
  const result = await query(
    `SELECT * FROM transactions WHERE client_id = $1 ORDER BY created_at ASC, id ASC`,
    [clientId],
  );
  return result.rows.map(mapRow);
}

/**
 * Load ledger + compute aggregates. Pass basePrice from booking services /
 * total_price when ADD_ON rows alone do not include the base service price.
 */
export async function getBookingFinancialSnapshot(bookingId, opts = {}) {
  const rows = await listLedgerByBookingId(bookingId);
  const financials = computeBookingFinancials(rows, {
    basePrice: opts.basePrice,
    baseTax: opts.baseTax,
  });
  const statuses = deriveStatusesFromFinancials(financials, {
    hasPendingPrepayment: opts.hasPendingPrepayment,
    hasFailedPayment: opts.hasFailedPayment,
    prepaymentAmount: opts.prepaymentAmount,
    appointmentCompleted: opts.appointmentCompleted,
  });

  return { rows, financials, statuses };
}

const NOTES_META_PREFIX = "---mollure-meta---";

function parseBookingNotesMeta(notes) {
  if (!notes || typeof notes !== "string") return {};
  const markerIndex = notes.indexOf(NOTES_META_PREFIX);
  const raw =
    markerIndex === -1
      ? notes.trim()
      : notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  if (!raw.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function joinBookingNotes(human, meta) {
  const prefix = human?.trim() ? `${human.trim()}\n` : "";
  return `${prefix}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
}

function splitBookingNotes(raw) {
  const text = String(raw ?? "");
  const markerIndex = text.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) {
    return { human: text.trim(), meta: parseBookingNotesMeta(text) };
  }
  return {
    human: text.slice(0, markerIndex).trim(),
    meta: parseBookingNotesMeta(text),
  };
}

function snapshotServiceBasePrice(meta, booking) {
  const services = Array.isArray(meta?.clientSnapshot?.services)
    ? meta.clientSnapshot.services
    : [];
  const lineDiscount = services.some(
    (row) => serviceLineNet(row) + 0.001 < serviceLineList(row),
  );
  // Stamped basePrice is the undiscounted service sum. Recompute when a line discount exists.
  if (!lineDiscount && meta?.financials?.basePrice != null) {
    return roundMoney(Math.max(0, parseMoney(meta.financials.basePrice)));
  }
  if (services.length) {
    return roundMoney(services.reduce((sum, row) => sum + serviceLineNet(row), 0));
  }
  const guests = Array.isArray(meta?.guests) ? meta.guests : [];
  let guestTotal = 0;
  for (const guest of guests) {
    for (const service of guest.services ?? []) guestTotal += Number(service.price) || 0;
    for (const product of guest.products ?? []) guestTotal += Number(product.price) || 0;
  }
  if (guestTotal > 0) return roundMoney(guestTotal);
  // First recalculate: total_price is the service base (before add-ons were folded in).
  return roundMoney(Math.max(0, parseMoney(booking?.total_price)));
}

/**
 * Central recalculation for any financial event.
 * Persists aggregates on booking notes + total_price = net_total so clients see atomic state.
 */
export async function recalculateBookingFinancials(bookingId) {
  const bookingUuid = await resolveBookingUuid(bookingId);
  if (!bookingUuid) {
    throw new Error(`recalculateBookingFinancials: booking not found (${bookingId})`);
  }

  const bookingResult = await query(
    `SELECT id, unique_code, status, prepayment_status, total_price, notes, customer_id
       FROM bookings WHERE id = $1 LIMIT 1`,
    [bookingUuid],
  );
  const booking = bookingResult.rows[0];
  if (!booking) {
    throw new Error(`recalculateBookingFinancials: booking not found (${bookingId})`);
  }

  const { human, meta } = splitBookingNotes(booking.notes);
  // Persist-void burst-duplicate ADD_ON rows (multi-save storm) before aggregates.
  await voidBurstDuplicateAddonLedgerRows(bookingUuid);
  // Drop PAYMENT/PREPAYMENT mirrors whose finance row is not actually Paid/Prepaid.
  await voidLedgerPaymentsForUnsettledFinance(
    bookingUuid,
    booking.unique_code,
  );
  const rows = await listLedgerByBookingId(bookingUuid);
  const basePrice = snapshotServiceBasePrice(meta, booking);

  const prepayLedger = roundMoney(
    rows
      .filter((r) => isValidCompleted(r) && r.type === "PREPAYMENT")
      .reduce((s, r) => s + parseMoney(r.amount), 0),
  );

  const snapshot = await getBookingFinancialSnapshot(bookingUuid, {
    basePrice,
    hasPendingPrepayment: ["pending", "required"].includes(
      String(booking.prepayment_status ?? "").toLowerCase(),
    ),
    hasFailedPayment: String(booking.prepayment_status ?? "").toLowerCase() === "failed",
    prepaymentAmount: prepayLedger,
    appointmentCompleted: String(booking.status ?? "").toLowerCase() === "completed",
    runId: "recalculate",
  });

  const paymentTotal = roundMoney(
    rows
      .filter((r) => isValidCompleted(r) && r.type === "PAYMENT")
      .reduce((s, r) => s + parseMoney(r.amount), 0),
  );
  const financials = {
    ...snapshot.financials,
    basePrice,
    prepayment_total: prepayLedger,
    payment_total: paymentTotal,
    prepaid_refunded: snapshot.financials.prepaid_refunded ?? 0,
    net_prepayment_credit: snapshot.financials.net_prepayment_credit ?? 0,
    updatedAt: new Date().toISOString(),
  };
  const nextMeta = {
    ...meta,
    financials: {
      subtotal: financials.subtotal,
      total_tax: financials.total_tax,
      cancellation_fee: financials.cancellation_fee,
      total_paid: financials.total_paid,
      total_refunded: financials.total_refunded,
      net_total: financials.net_total,
      outstanding_balance: financials.outstanding_balance,
      net_revenue: financials.net_revenue,
      prepayment_total: prepayLedger,
      payment_total: paymentTotal,
      prepaid_refunded: financials.prepaid_refunded,
      net_prepayment_credit: financials.net_prepayment_credit,
      add_ons: financials.addOns,
      basePrice,
      payment_status: snapshot.statuses.payment_status,
      updatedAt: financials.updatedAt,
    },
  };

  const derivedPrepay = snapshot.statuses.prepayment_status;
  await query(
    `UPDATE bookings
        SET total_price = $2,
            notes = $3,
            prepayment_status = CASE
              WHEN $4::text IS NOT NULL THEN $4
              ELSE prepayment_status
            END,
            updated_at = NOW()
      WHERE id = $1`,
    [
      bookingUuid,
      financials.net_total,
      joinBookingNotes(human, nextMeta),
      derivedPrepay,
    ],
  );

  try {
    const { healDiscountedServiceDocumentLines } = await import(
      "./finance-sync.service.js"
    );
    await healDiscountedServiceDocumentLines(booking, meta);
  } catch {
    /* document line heal is best-effort */
  }

  return {
    bookingId: bookingUuid,
    uniqueCode: booking.unique_code,
    rows: snapshot.rows,
    financials,
    statuses: snapshot.statuses,
  };
}

function isValidCompleted(row) {
  return String(row?.status ?? "").toLowerCase() === "completed";
}

/** Void ADD_ON ledger rows that are burst duplicates of an earlier completed row. */
async function voidBurstDuplicateAddonLedgerRows(bookingUuid) {
  const rows = await listLedgerByBookingId(bookingUuid);
  const { drop } = selectBurstDedupedAddonRows(rows);
  if (!drop.length) return 0;
  const ids = drop.map((row) => row.id).filter(Boolean);
  if (!ids.length) return 0;
  await query(
    `UPDATE transactions
        SET status = 'voided'
      WHERE booking_id = $1
        AND id = ANY($2::uuid[])
        AND type = 'ADD_ON'
        AND status <> 'voided'`,
    [bookingUuid, ids],
  );
  return ids.length;
}

/**
 * Online–direct after-treatment rows were historically inserted as Paid by mistake.
 * Heal them to Pending and drop matching PAYMENT ledger mirrors so Payable is correct.
 */
async function healFalselyPaidOnlineDirectAfterTreatment(
  bookingUuid,
  bookingCode,
) {
  const healed = await query(
    `UPDATE finance_transactions
        SET status = 'Pending',
            paid_amount = 0,
            updated_at = NOW()
      WHERE (
          booking_id::text = $1
          OR booking_id::text = $2
        )
        AND status = 'Paid'
        AND LOWER(REPLACE(COALESCE(method_title, ''), '–', '-')) LIKE '%online%direct%'
        AND (
          COALESCE(document->>'paymentPhase', '') = 'full'
          OR LOWER(COALESCE(entry_label, '')) LIKE 'after treatment%'
        )
      RETURNING id`,
    [String(bookingUuid), String(bookingCode ?? "")],
  );
  const ids = healed.rows.map((row) => row.id).filter(Boolean);
  if (!ids.length) return 0;
  await query(
    `UPDATE transactions
        SET status = 'voided'
      WHERE booking_id = $1
        AND finance_transaction_id = ANY($2::uuid[])
        AND type = 'PAYMENT'
        AND status <> 'voided'`,
    [bookingUuid, ids],
  );
  return ids.length;
}

/**
 * PAYMENT/PREPAYMENT ledger rows must track real cash-in. If the linked
 * finance_transactions row is still Pending / Payment due / etc., void the mirror
 * so Payable Summary does not treat unpaid after-treatment invoices as paid.
 */
async function voidLedgerPaymentsForUnsettledFinance(bookingUuid, bookingCode) {
  await healFalselyPaidOnlineDirectAfterTreatment(bookingUuid, bookingCode);
  // Only PAYMENT (not PREPAYMENT): Refunded prepay still needs the PREPAYMENT row + REFUND.
  const result = await query(
    `UPDATE transactions t
        SET status = 'voided'
      WHERE t.booking_id = $1
        AND t.status <> 'voided'
        AND t.type = 'PAYMENT'
        AND t.finance_transaction_id IS NOT NULL
        AND EXISTS (
          SELECT 1
            FROM finance_transactions ft
           WHERE ft.id = t.finance_transaction_id
             AND ft.status IS DISTINCT FROM 'Paid'
             AND ft.status IS DISTINCT FROM 'Prepaid'
        )
      RETURNING t.id, t.type, t.amount, t.finance_transaction_id`,
    [bookingUuid],
  );
  return result.rowCount ?? 0;
}

/**
 * Sync add-on charge (+ optional payment / refund) into the ledger, then recalculate.
 * Idempotent per addonId: voids prior ADD_ON/DISCOUNT/PAYMENT tagged with that id.
 */
export async function upsertAddonLedgerAndRecalculate({
  bookingId,
  bookingRef,
  clientId = null,
  professionalProfileId = null,
  financeTransactionId = null,
  addonId,
  amount,
  discountAmount = 0,
  paid = false,
  voided = false,
  refunded = false,
}) {
  const bookingUuid = bookingId ?? (await resolveBookingUuid(bookingRef));
  if (!bookingUuid) {
    throw new Error("upsertAddonLedgerAndRecalculate requires a booking");
  }
  const idKey = String(addonId ?? financeTransactionId ?? "").trim();
  if (!idKey) {
    throw new Error("upsertAddonLedgerAndRecalculate requires addonId");
  }

  await query(
    `UPDATE transactions SET status = 'voided'
      WHERE booking_id = $1
        AND status <> 'voided'
        AND type IN ('ADD_ON', 'DISCOUNT', 'PAYMENT')
        AND (
          metadata->>'addonId' = $2
          OR ($3::uuid IS NOT NULL AND finance_transaction_id = $3)
        )`,
    [bookingUuid, idKey, financeTransactionId],
  );

  const money = roundMoney(Math.max(0, parseMoney(amount)));
  const discount = roundMoney(Math.max(0, parseMoney(discountAmount)));

  if (!voided && money > 0) {
    await appendLedgerTransaction({
      bookingId: bookingUuid,
      clientId,
      professionalProfileId,
      financeTransactionId,
      type: "ADD_ON",
      amount: money,
      metadata: { addonId: idKey, source: "addon" },
    });
    if (discount > 0) {
      await appendLedgerTransaction({
        bookingId: bookingUuid,
        clientId,
        professionalProfileId,
        financeTransactionId,
        type: "DISCOUNT",
        amount: discount,
        metadata: { addonId: idKey, source: "addon" },
      });
    }
    if (paid && !refunded) {
      await appendLedgerTransaction({
        bookingId: bookingUuid,
        clientId,
        professionalProfileId,
        financeTransactionId,
        type: "PAYMENT",
        amount: roundMoney(Math.max(0, money - discount)),
        metadata: { addonId: idKey, settlesAddon: true, source: "addon" },
      });
    }
  }

  if (refunded && money > 0) {
    const existingRefund = await query(
      `SELECT id FROM transactions
        WHERE booking_id = $1 AND type = 'REFUND' AND status <> 'voided'
          AND metadata->>'addonId' = $2
        LIMIT 1`,
      [bookingUuid, idKey],
    );
    if (!existingRefund.rows[0]) {
      await appendLedgerTransaction({
        bookingId: bookingUuid,
        clientId,
        professionalProfileId,
        financeTransactionId,
        type: "REFUND",
        amount: roundMoney(Math.max(0, money - discount)),
        metadata: { addonId: idKey, source: "addon" },
      });
    }
  }

  return recalculateBookingFinancials(bookingUuid);
}
