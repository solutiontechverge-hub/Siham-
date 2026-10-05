import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

// Read-only reconciliation audit. A card is considered mismatched when the
// persisted card metadata line count/references differ from its linked finance
// document snapshot. This script never invents or writes line items.
const client = await getClient();

try {
  const columnCheck = await client.query(`
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'sales_card_metadata'
       AND column_name = 'finance_transaction_id'
  `);
  const hasLinkColumn = columnCheck.rowCount > 0;
  const result = await client.query(`
    SELECT scm.card_id,
           scm.booking_id,
           scm.card_kind,
           ${hasLinkColumn ? "scm.finance_transaction_id" : "NULL::uuid AS finance_transaction_id"},
           scm.metadata,
           ft.id AS transaction_id,
           ft.document
      FROM sales_card_metadata scm
      LEFT JOIN finance_transactions ft
        ON ${hasLinkColumn ? "ft.id = scm.finance_transaction_id" : "ft.booking_id = scm.booking_id"}
     ORDER BY scm.updated_at DESC
  `);

  const mismatches = [];
  for (const row of result.rows) {
    const cardLines = Array.isArray(row.metadata?.lineItems)
      ? row.metadata.lineItems
      : Array.isArray(row.metadata?.lines)
        ? row.metadata.lines
        : [];
    const financeLines = Array.isArray(row.document?.lineItems)
      ? row.document.lineItems
      : [];
    const refs = (items) => items.map((item) => String(item?.sourceReference ?? "").trim()).filter(Boolean).sort();
    const cardRefs = refs(cardLines);
    const financeRefs = refs(financeLines);
    if (cardLines.length !== financeLines.length || JSON.stringify(cardRefs) !== JSON.stringify(financeRefs)) {
      mismatches.push({
        cardId: row.card_id,
        bookingId: row.booking_id,
        cardKind: row.card_kind,
        transactionId: row.transaction_id ?? null,
        cardLineCount: cardLines.length,
        financeLineCount: financeLines.length,
        cardReferences: cardRefs,
        financeReferences: financeRefs,
      });
    }
  }

  console.log(JSON.stringify({ audited: result.rowCount, mismatches }, null, 2));
} finally {
  await client.end();
}
