import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const phaseForCard = (kind) => ({
  prepayment: "prepay",
  after_treatment: "full",
  addon: "addon",
  reissued_invoice: "full",
}[kind] ?? null);

const client = await getClient();
try {
  const cards = await client.query(`SELECT * FROM sales_card_metadata`);
  const rows = await client.query(`
    SELECT id, booking_id, status, gross_amount, document, issued_document
      FROM finance_transactions
     WHERE NULLIF(booking_id, '') IS NOT NULL
  `);
  const usedRows = new Set();
  const breakdown = {
    cards: cards.rowCount,
    financeRows: rows.rowCount,
    matched: 0,
    unmatchedCards: 0,
    unmatchedRows: 0,
    lineItemMismatches: 0,
    amountMismatches: 0,
    statusMismatches: 0,
  };
  const details = [];

  for (const card of cards.rows) {
    const phase = phaseForCard(card.card_kind);
    const match = rows.rows.find((row) => {
      if (usedRows.has(String(row.id)) || String(row.booking_id) !== String(card.booking_id)) return false;
      return !phase || row.document?.paymentPhase === phase;
    });
    if (!match) {
      breakdown.unmatchedCards += 1;
      details.push({ type: "unmatched_card", cardId: card.card_id, bookingId: card.booking_id, cardKind: card.card_kind });
      continue;
    }
    usedRows.add(String(match.id));
    breakdown.matched += 1;
    const financeDocument = match.issued_document ?? match.document ?? {};
    const cardLines = Array.isArray(card.metadata?.lineItems) ? card.metadata.lineItems : [];
    const financeLines = Array.isArray(financeDocument.lineItems) ? financeDocument.lineItems : [];
    if (cardLines.length !== financeLines.length) {
      breakdown.lineItemMismatches += 1;
      details.push({ type: "line_items", cardId: card.card_id, transactionId: match.id, cardCount: cardLines.length, financeCount: financeLines.length });
    }
    const cardAmount = Number(card.metadata?.totalPrice ?? card.metadata?.amount);
    if (Number.isFinite(cardAmount) && Math.round(cardAmount * 100) !== Math.round(Number(match.gross_amount || 0) * 100)) breakdown.amountMismatches += 1;
    if (card.metadata?.status && String(card.metadata.status).toLowerCase() !== String(match.status).toLowerCase()) breakdown.statusMismatches += 1;
  }
  breakdown.unmatchedRows = rows.rows.filter((row) => !usedRows.has(String(row.id))).length;
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), breakdown, details }, null, 2));
} finally {
  await client.end();
}
