import { roundMoney } from "./money.js";

/** Fallback when Stripe balance_transaction fee is unavailable. */
export const STRIPE_FEE_RATE = 0.029;
/** Platform take; overridden by application_fee when present on the PaymentIntent. */
export const MOLLURE_FEE_RATE = 0.01;

export function estimateOnlineFees(gross) {
  const g = roundMoney(gross);
  const stripeFee = roundMoney(g * STRIPE_FEE_RATE);
  const mollureFee = roundMoney(g * MOLLURE_FEE_RATE);
  return {
    stripeFee,
    mollureFee,
    net: roundMoney(g - stripeFee - mollureFee),
    source: "estimate",
  };
}

/**
 * gross − Stripe fee − Mollure fee = net.
 * Pass live stripeFee / mollureFee (major units) from Stripe when available;
 * missing live legs fall back to percentage estimates for online rows.
 */
export function computeFinanceFees(
  gross,
  { isOnline = false, stripeFee = null, mollureFee = null } = {},
) {
  const g = roundMoney(gross);
  if (!isOnline) {
    return { stripeFee: null, mollureFee: null, net: g, source: "offline" };
  }

  const hasLiveStripe = stripeFee != null && Number.isFinite(Number(stripeFee));
  const hasLiveMollure = mollureFee != null && Number.isFinite(Number(mollureFee));
  if (!hasLiveStripe && !hasLiveMollure) return estimateOnlineFees(g);

  const est = estimateOnlineFees(g);
  const sf = hasLiveStripe ? roundMoney(stripeFee) : est.stripeFee;
  const mf = hasLiveMollure ? roundMoney(mollureFee) : est.mollureFee;
  return {
    stripeFee: sf,
    mollureFee: mf,
    net: roundMoney(g - sf - mf),
    source: "live",
  };
}

/**
 * Convert balance_transaction.fee (minor units, balance currency) into charge-currency major units.
 */
export function feeMajorFromBalanceTransaction(bt, chargeCurrency = "eur") {
  if (!bt || typeof bt.fee !== "number" || !Number.isFinite(bt.fee)) return null;
  const chargeCur = String(chargeCurrency || "eur").toLowerCase();
  const btCur = String(bt.currency || "").toLowerCase();
  if (btCur === chargeCur) return roundMoney(bt.fee / 100);
  if (bt.exchange_rate && Number(bt.exchange_rate) > 0) {
    return roundMoney(bt.fee / Number(bt.exchange_rate) / 100);
  }
  return null;
}
