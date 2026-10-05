import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const apply = process.argv.includes("--apply");
const client = await getClient();

function cardKindFor(document) {
  switch (document?.paymentPhase) {
    case "prepay": return "prepayment";
    case "addon": return "addon";
    case "full": return document?.payerRole === "main_client" ? "after_treatment" : "after_treatment";
    default: return null;
  }
}

try {
  await client.query("BEGIN");
  const cards = await client.query(`SELECT * FROM sales_card_metadata ORDER BY updated_at DESC`);
  const rows = await client.query(`
    SELECT * FROM finance_transactions
     WHERE NULLIF(booking_id, '') IS NOT NULL
       AND document IS NOT NULL
     ORDER BY updated_at DESC
  `);

  const used = new Set(
    cards.rows.filter((card) => card.finance_transaction_id).map((card) => String(card.finance_transaction_id)),
  );
  const report = { apply, cards: cards.rowCount, financeRows: rows.rowCount, linked: 0, created: 0, unmatchedCards: [], unmatchedRows: [] };

  for (const card of cards.rows) {
    if (card.finance_transaction_id) continue;
    const candidate = rows.rows.find((row) => {
      if (used.has(String(row.id)) || String(row.booking_id) !== String(card.booking_id)) return false;
      const kind = cardKindFor(row.document);
      return kind === card.card_kind || (card.card_kind === "addon" && row.document?.addonId);
    });
    if (!candidate) {
      report.unmatchedCards.push({ cardId: card.card_id, bookingId: card.booking_id, cardKind: card.card_kind });
      continue;
    }
    used.add(String(candidate.id));
    report.linked += 1;
    if (apply) await client.query(`UPDATE sales_card_metadata SET finance_transaction_id = $1, updated_at = NOW() WHERE id = $2`, [candidate.id, card.id]);
  }

  for (const row of rows.rows) {
    if (used.has(String(row.id))) continue;
    const cardKind = cardKindFor(row.document);
    if (!cardKind) {
      report.unmatchedRows.push({ transactionId: row.id, bookingId: row.booking_id, reason: "missing payment phase" });
      continue;
    }
    const payer = String(row.document?.payerKey ?? "main-client");
    const cardId = `${row.booking_id}-${cardKind}-${payer}`;
    report.created += 1;
    if (apply) {
      await client.query(
        `INSERT INTO sales_card_metadata (professional_profile_id, card_id, booking_id, card_kind, metadata, finance_transaction_id)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (professional_profile_id, card_id) DO UPDATE
           SET finance_transaction_id = COALESCE(sales_card_metadata.finance_transaction_id, EXCLUDED.finance_transaction_id),
               updated_at = NOW()`,
        [row.professional_profile_id, cardId, row.booking_id, cardKind, JSON.stringify({ paymentPhase: row.document?.paymentPhase, payerKey: payer }), row.id],
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
