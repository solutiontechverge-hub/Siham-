import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const client = await getClient();
const kindFor = (phase) => ({ prepay: "prepayment", full: "after_treatment", addon: "addon" }[phase] ?? null);

try {
  const result = await client.query(`
    SELECT scm.card_id, scm.booking_id, scm.card_kind, scm.metadata AS card_metadata,
           ft.id AS transaction_id, ft.status, ft.gross_amount,
           ft.document, ft.issued_document
      FROM sales_card_metadata scm
      LEFT JOIN finance_transactions ft
        ON ft.booking_id = scm.booking_id
       AND (ft.document->>'paymentPhase' = CASE scm.card_kind
          WHEN 'prepayment' THEN 'prepay'
          WHEN 'after_treatment' THEN 'full'
          WHEN 'addon' THEN 'addon'
          ELSE ft.document->>'paymentPhase' END)
     ORDER BY scm.updated_at DESC, ft.updated_at DESC
  `);
  const audits = result.rows.map((row) => {
    const document = row.issued_document ?? row.document ?? {};
    const lines = Array.isArray(document.lineItems) ? document.lineItems : [];
    const cardLines = Array.isArray(row.card_metadata?.lineItems)
      ? row.card_metadata.lineItems : Array.isArray(row.card_metadata?.lines)
        ? row.card_metadata.lines : [];
    const issues = [];
    if (!row.transaction_id) issues.push("no_finance_transaction_match");
    if (row.transaction_id && !document.documentNumber) issues.push("missing_document_number");
    if (row.transaction_id && !document.client?.legalName) issues.push("missing_client_snapshot");
    if (row.transaction_id && !lines.length && Number(row.gross_amount || 0) !== 0) issues.push("missing_line_items_for_nonzero_transaction");
    if (row.transaction_id && cardLines.length !== lines.length) issues.push("card_finance_line_count_mismatch");
    return {
      cardId: row.card_id,
      bookingId: row.booking_id,
      cardKind: row.card_kind,
      transactionId: row.transaction_id,
      status: row.status,
      issues,
      cardLineCount: cardLines.length,
      financeLineCount: lines.length,
      documentNumber: document.documentNumber ?? null,
    };
  }).filter((audit) => audit.issues.length);
  console.log(JSON.stringify({ auditedPairs: result.rowCount, failures: audits.length, audits }, null, 2));
} finally {
  await client.end();
}
