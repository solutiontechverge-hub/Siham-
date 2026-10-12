import { matchFinanceHint } from "./buildSalesOverviewCards.format";
import {
  financeStatusToSalesPaymentState,
  type SalesFinanceHint,
  type SalesOverviewCardData,
} from "./salesOverview.types";

export type SalesCardFinanceReconcileStats = {
  cards: number;
  matchedByFk: number;
  matchedByPhase: number;
  unmatched: number;
  financeRows: number;
  statusMismatches: number;
};

/** Count Sales cards vs finance hints after calendar + finance hydrate (dev audit). */
export function auditSalesCardFinanceReconcile(
  cards: readonly SalesOverviewCardData[],
  financeHints: readonly SalesFinanceHint[],
): SalesCardFinanceReconcileStats {
  const hints = financeHints as SalesFinanceHint[];
  let matchedByFk = 0;
  let matchedByPhase = 0;
  let unmatched = 0;
  let statusMismatches = 0;

  for (const card of cards) {
    const hint = matchFinanceHint(card, hints);
    if (!hint) {
      unmatched += 1;
      continue;
    }
    const byFk =
      Boolean(card.financeTransactionId) &&
      Boolean(hint.transactionId) &&
      String(card.financeTransactionId) === String(hint.transactionId);
    if (byFk) matchedByFk += 1;
    else matchedByPhase += 1;

    const expected = financeStatusToSalesPaymentState(hint.status, card.kind);
    if (
      expected != null &&
      card.paymentState != null &&
      expected !== card.paymentState
    ) {
      statusMismatches += 1;
    }
  }

  return {
    cards: cards.length,
    matchedByFk,
    matchedByPhase,
    unmatched,
    financeRows: financeHints.length,
    statusMismatches,
  };
}

export function logSalesCardFinanceReconcile(
  cards: readonly SalesOverviewCardData[],
  financeHints: readonly SalesFinanceHint[],
): SalesCardFinanceReconcileStats {
  const stats = auditSalesCardFinanceReconcile(cards, financeHints);
  console.info(
    `[SalesOverview reconcile] cards=${stats.cards} matchedByFk=${stats.matchedByFk} matchedByPhase=${stats.matchedByPhase} unmatched=${stats.unmatched} financeRows=${stats.financeRows} statusMismatches=${stats.statusMismatches}`,
  );
  return stats;
}
