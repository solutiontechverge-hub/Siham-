/**
 * Link sales_card_metadata ↔ finance_transactions via finance_transaction_id.
 * Resolves booking UUID ↔ unique_code (sync stores code; cards store UUID).
 *
 * Dry-run:  node src/scripts/reconcile-sales-card-finance-rows.js
 * Apply:    node src/scripts/reconcile-sales-card-finance-rows.js --apply
 */
import "../bootstrap-env.js";
import { getClient } from "../db/index.js";
import {
  resolveSalesCardId,
  salesCardKindForPaymentPhase,
} from "../services/finance-sync.service.js";

const apply = process.argv.includes("--apply");
const client = await getClient();

function bookingKeys(row) {
  const keys = new Set();
  if (row.booking_id) keys.add(String(row.booking_id));
  if (row.booking_uuid) keys.add(String(row.booking_uuid));
  if (row.booking_code) keys.add(String(row.booking_code));
  return keys;
}

function sameBooking(a, b) {
  const ak = bookingKeys(a);
  for (const k of bookingKeys(b)) if (ak.has(k)) return true;
  return false;
}

function phaseMatchesCard(cardKind, paymentPhase, cardId = "") {
  const phase = String(paymentPhase ?? "");
  if (cardKind === "prepayment") return phase === "prepay";
  if (cardKind === "addon") return phase === "addon";
  if (cardKind === "after_treatment") return phase === "full" || phase === "";
  if (cardKind === "reissued_invoice") {
    if (String(cardId).includes("-prepayment")) return phase === "prepay";
    return phase === "full" || phase === "";
  }
  return false;
}

try {
  await client.query("BEGIN");

  const cards = await client.query(`
    SELECT scm.*,
           b.id::text AS booking_uuid,
           b.unique_code AS booking_code
      FROM sales_card_metadata scm
      LEFT JOIN bookings b
        ON b.id::text = scm.booking_id OR b.unique_code = scm.booking_id
     ORDER BY scm.updated_at DESC
  `);
  const rows = await client.query(`
    SELECT ft.*,
           b.id::text AS booking_uuid,
           b.unique_code AS booking_code
      FROM finance_transactions ft
      LEFT JOIN bookings b
        ON b.id::text = ft.booking_id OR b.unique_code = ft.booking_id
     WHERE NULLIF(ft.booking_id, '') IS NOT NULL
       AND ft.document IS NOT NULL
     ORDER BY ft.updated_at DESC NULLS LAST
  `);

  const used = new Set(
    cards.rows
      .filter((card) => card.finance_transaction_id)
      .map((card) => String(card.finance_transaction_id)),
  );
  const report = {
    apply,
    cards: cards.rowCount,
    financeRows: rows.rowCount,
    linked: 0,
    created: 0,
    unmatchedCards: [],
    unmatchedRows: [],
  };

  for (const card of cards.rows) {
    if (card.finance_transaction_id) continue;
    const candidate = rows.rows.find((row) => {
      if (used.has(String(row.id))) return false;
      if (!sameBooking(card, row)) return false;
      return phaseMatchesCard(card.card_kind, row.document?.paymentPhase, card.card_id);
    });
    if (!candidate) {
      report.unmatchedCards.push({
        cardId: card.card_id,
        bookingId: card.booking_id,
        cardKind: card.card_kind,
      });
      continue;
    }
    used.add(String(candidate.id));
    report.linked += 1;
    if (apply) {
      await client.query(
        `UPDATE sales_card_metadata
            SET finance_transaction_id = $1, updated_at = NOW()
          WHERE id = $2`,
        [candidate.id, card.id],
      );
    }
  }

  for (const row of rows.rows) {
    if (used.has(String(row.id))) continue;
    const paymentPhase = row.document?.paymentPhase;
    const cardKind = salesCardKindForPaymentPhase(paymentPhase);
    if (!cardKind || cardKind === "addon") {
      report.unmatchedRows.push({
        transactionId: row.id,
        bookingId: row.booking_id,
        reason: cardKind === "addon" ? "addon skipped" : "missing payment phase",
      });
      continue;
    }
    const bookingId = row.booking_uuid || row.booking_id;
    if (!bookingId || !row.professional_profile_id) {
      report.unmatchedRows.push({
        transactionId: row.id,
        bookingId: row.booking_id,
        reason: "missing booking or profile",
      });
      continue;
    }
    const payerKey = String(row.document?.payerKey ?? "main-client");
    const payerRole = String(row.document?.payerRole ?? "main_client");
    const entryLabel = String(row.entry_label ?? "");
    const cardId = resolveSalesCardId({
      bookingId,
      paymentPhase,
      payerKey,
      payerRole,
      entryLabel,
    });
    if (!cardId) {
      report.unmatchedRows.push({
        transactionId: row.id,
        bookingId: row.booking_id,
        reason: "unresolvable card id",
      });
      continue;
    }
    report.created += 1;
    used.add(String(row.id));
    if (apply) {
      // ensureSalesCardMetadata uses pool query(), not this transaction client —
      // keep writes on the same client for atomic dry-run/apply.
      await client.query(
        `INSERT INTO sales_card_metadata (
           professional_profile_id, card_id, booking_id, card_kind, metadata, finance_transaction_id
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (professional_profile_id, card_id) DO UPDATE
           SET booking_id = EXCLUDED.booking_id,
               card_kind = EXCLUDED.card_kind,
               metadata = sales_card_metadata.metadata || EXCLUDED.metadata,
               finance_transaction_id = COALESCE(
                 sales_card_metadata.finance_transaction_id,
                 EXCLUDED.finance_transaction_id
               ),
               updated_at = NOW()`,
        [
          row.professional_profile_id,
          cardId,
          String(bookingId),
          cardKind,
          JSON.stringify({
            paymentPhase: paymentPhase || null,
            payerKey,
          }),
          row.id,
        ],
      );
    }
  }

  if (apply) await client.query("COMMIT");
  else await client.query("ROLLBACK");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
