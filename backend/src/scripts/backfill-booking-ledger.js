/**
 * One-shot: mirror existing finance_transactions into the immutable transactions ledger.
 * Run: node src/scripts/backfill-booking-ledger.js
 */
import "../bootstrap-env.js";
import { getClient } from "../db/index.js";
import {
  mirrorRefundToLedger,
  mirrorSettledFinanceToLedger,
} from "../services/bookingTransactionLedger.service.js";
import { parseMoney, roundMoney } from "../utils/money.js";

const client = await getClient();
try {
  const rows = await client.query(`
    SELECT ft.id, ft.booking_id, ft.status, ft.entry_label, ft.gross_amount,
           ft.paid_amount, ft.prepayment_amount, ft.refund_amount, ft.discount_amount,
           ft.professional_profile_id,
           COALESCE(ft.document->>'paymentPhase', '') AS payment_phase,
           b.id AS booking_uuid,
           b.customer_id
      FROM finance_transactions ft
      LEFT JOIN bookings b
        ON b.id::text = ft.booking_id OR b.unique_code = ft.booking_id
     WHERE ft.status <> 'Voided'
     ORDER BY ft.created_at ASC NULLS LAST
  `);

  let mirrored = 0;
  let refunds = 0;
  let skipped = 0;

  for (const row of rows.rows) {
    if (!row.booking_uuid && !row.booking_id) {
      skipped += 1;
      continue;
    }

    const phase = row.payment_phase || null;
    const settledAmount =
      String(row.status) === "Prepaid"
        ? roundMoney(parseMoney(row.prepayment_amount) || parseMoney(row.gross_amount))
        : roundMoney(
            parseMoney(row.paid_amount) ||
              parseMoney(row.gross_amount) ||
              parseMoney(row.prepayment_amount),
          );

    if (row.status === "Paid" || row.status === "Prepaid" || row.status === "Refunded") {
      // Refunded rows still represent a prior settlement — mirror the money-in event.
      const moneyIn =
        settledAmount > 0
          ? settledAmount
          : roundMoney(parseMoney(row.gross_amount));
      if (moneyIn > 0) {
        const statusForMirror = row.status === "Prepaid" ? "Prepaid" : "Paid";
        const out = await mirrorSettledFinanceToLedger({
          bookingId: row.booking_uuid,
          bookingRef: row.booking_id,
          clientId: row.customer_id ?? null,
          professionalProfileId: row.professional_profile_id,
          financeTransactionId: row.id,
          paymentPhase: phase || (row.status === "Prepaid" ? "prepay" : "full"),
          entryLabel: row.entry_label,
          status: statusForMirror,
          amount: moneyIn,
        });
        if (out) mirrored += 1;
      }
    }

    if (row.status === "Refunded") {
      const refundAmt = roundMoney(
        parseMoney(row.refund_amount) || parseMoney(row.gross_amount),
      );
      if (refundAmt > 0) {
        const out = await mirrorRefundToLedger({
          bookingId: row.booking_uuid,
          bookingRef: row.booking_id,
          clientId: row.customer_id ?? null,
          professionalProfileId: row.professional_profile_id,
          financeTransactionId: row.id,
          refundAmount: refundAmt,
        });
        if (out) refunds += 1;
      }
    }

    const discount = roundMoney(parseMoney(row.discount_amount));
    if (discount > 0 && row.booking_uuid) {
      const { appendLedgerTransaction } = await import(
        "../services/bookingTransactionLedger.service.js"
      );
      const existing = await client.query(
        `SELECT id FROM transactions
          WHERE finance_transaction_id = $1 AND type = 'DISCOUNT' AND status <> 'voided'
          LIMIT 1`,
        [row.id],
      );
      if (!existing.rows[0]) {
        await appendLedgerTransaction({
          bookingId: row.booking_uuid,
          clientId: row.customer_id ?? null,
          professionalProfileId: row.professional_profile_id,
          financeTransactionId: row.id,
          type: "DISCOUNT",
          amount: discount,
          metadata: { source: "finance_transactions_backfill" },
        });
        mirrored += 1;
      }
    }
  }

  console.log(
    JSON.stringify({ financeRows: rows.rowCount, mirrored, refunds, skipped }),
  );
} finally {
  client.release();
}
