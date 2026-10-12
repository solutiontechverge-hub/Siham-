import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const phaseForCard = (kind, cardId = "") => {
  if (kind === "prepayment") return "prepay";
  if (kind === "addon") return "addon";
  if (kind === "after_treatment") return "full";
  if (kind === "reissued_invoice") {
    return String(cardId).includes("-prepayment") ? "prepay" : "full";
  }
  return null;
};

const client = await getClient();
try {
  const cards = await client.query(`
    SELECT scm.*,
           b.id::text AS booking_uuid,
           b.unique_code AS booking_code
      FROM sales_card_metadata scm
      LEFT JOIN bookings b
        ON b.id::text = scm.booking_id OR b.unique_code = scm.booking_id
  `);
  const rows = await client.query(`
    SELECT ft.id, ft.booking_id, ft.status, ft.gross_amount, ft.document, ft.issued_document,
           b.id::text AS booking_uuid,
           b.unique_code AS booking_code
      FROM finance_transactions ft
      LEFT JOIN bookings b
        ON b.id::text = ft.booking_id OR b.unique_code = ft.booking_id
     WHERE NULLIF(ft.booking_id, '') IS NOT NULL
  `);
  const usedRows = new Set();
  const breakdown = {
    cards: cards.rowCount,
    financeRows: rows.rowCount,
    matchedByFk: 0,
    matchedByBookingPhase: 0,
    unmatchedCards: 0,
    unmatchedRows: 0,
    lineItemMismatches: 0,
    amountMismatches: 0,
    statusMismatches: 0,
  };
  const details = [];

  const sameBooking = (card, row) => {
    const keys = new Set(
      [card.booking_id, card.booking_uuid, card.booking_code]
        .filter(Boolean)
        .map(String),
    );
    return [row.booking_id, row.booking_uuid, row.booking_code]
      .filter(Boolean)
      .some((k) => keys.has(String(k)));
  };

  for (const card of cards.rows) {
    let match = null;
    if (card.finance_transaction_id) {
      match = rows.rows.find((row) => String(row.id) === String(card.finance_transaction_id));
      if (match) breakdown.matchedByFk += 1;
    }
    if (!match) {
      const phase = phaseForCard(card.card_kind, card.card_id);
      match = rows.rows.find((row) => {
        if (usedRows.has(String(row.id)) || !sameBooking(card, row)) return false;
        const rowPhase = row.document?.paymentPhase ?? "full";
        return !phase || rowPhase === phase || (phase === "full" && !row.document?.paymentPhase);
      });
      if (match) breakdown.matchedByBookingPhase += 1;
    }
    if (!match) {
      breakdown.unmatchedCards += 1;
      details.push({
        type: "unmatched_card",
        cardId: card.card_id,
        bookingId: card.booking_id,
        cardKind: card.card_kind,
        financeTransactionId: card.finance_transaction_id,
      });
      continue;
    }
    usedRows.add(String(match.id));
    const financeDocument = match.issued_document ?? match.document ?? {};
    const cardLines = Array.isArray(card.metadata?.lineItems) ? card.metadata.lineItems : [];
    const financeLines = Array.isArray(financeDocument.lineItems) ? financeDocument.lineItems : [];
    if (cardLines.length && cardLines.length !== financeLines.length) {
      breakdown.lineItemMismatches += 1;
      details.push({
        type: "line_items",
        cardId: card.card_id,
        transactionId: match.id,
        cardCount: cardLines.length,
        financeCount: financeLines.length,
      });
    }
    const cardAmount = Number(card.metadata?.totalPrice ?? card.metadata?.amount);
    if (
      Number.isFinite(cardAmount) &&
      Math.round(cardAmount * 100) !== Math.round(Number(match.gross_amount || 0) * 100)
    ) {
      breakdown.amountMismatches += 1;
    }
    if (
      card.metadata?.status &&
      String(card.metadata.status).toLowerCase() !== String(match.status).toLowerCase()
    ) {
      breakdown.statusMismatches += 1;
    }
  }
  breakdown.unmatchedRows = rows.rows.filter((row) => !usedRows.has(String(row.id))).length;
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), breakdown, details }, null, 2));
} finally {
  await client.end();
}
