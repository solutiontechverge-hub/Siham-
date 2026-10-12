import { query } from "../db/index.js";

/** 15 EUR/month — override via env without code change. */
export const SUBSCRIPTION_AMOUNT_CENTS = Number(
  process.env.MOLLURE_SUBSCRIPTION_AMOUNT_CENTS || 1500,
);
export const SUBSCRIPTION_CURRENCY = (
  process.env.MOLLURE_SUBSCRIPTION_CURRENCY || "eur"
).toLowerCase();

/**
 * Payout destination for Mollure subscription fees (owner/admin Stripe account).
 * Set MOLLURE_STRIPE_PLATFORM_ACCOUNT in env/deploy secrets — never hardcode live acct_ ids.
 */
export const getPlatformStripeAccount = () => {
  const id = (process.env.MOLLURE_STRIPE_PLATFORM_ACCOUNT || "").trim();
  if (!id || id.includes("REPLACE") || id === "acct_placeholder") return null;
  return id;
};

/** Same calendar day next month (UTC); clamp to last day (Jan 31 → Feb 28/29). */
export const addOneCalendarMonth = (from = new Date()) => {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const day = from.getUTCDate();
  const targetMonth = m + 1;
  const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
  const clamped = Math.min(day, lastDay);
  return new Date(
    Date.UTC(
      y,
      targetMonth,
      clamped,
      from.getUTCHours(),
      from.getUTCMinutes(),
      from.getUTCSeconds(),
      from.getUTCMilliseconds(),
    ),
  );
};

export const isPastRenewal = (renewsAt, now = new Date()) => {
  if (!renewsAt) return false;
  return new Date(renewsAt).getTime() <= now.getTime();
};

/** True when a new paid period is required: no renews_at, or renews_at <= now. */
export const needsNewPeriodCharge = (renewsAt, now = new Date()) => {
  if (!renewsAt) return true;
  return isPastRenewal(renewsAt, now);
};

/**
 * ponytail: no Customer+PaymentMethod / Checkout Session yet — returns stub success when
 * Stripe keys missing or Billing not wired. Upgrade path: Stripe Checkout/Subscription +
 * invoice.paid / payment_intent.succeeded webhooks writing last_payment_at + renews_at.
 */
export const attemptSubscriptionCharge = async ({
  professionalProfileId,
  reason = "renewal",
}) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const platformAccount = getPlatformStripeAccount();

  if (!stripeKey || !platformAccount) {
    // Dev / missing config: do not invent a real charge; caller decides stub vs fail.
    return {
      ok: false,
      stub: true,
      reason: !stripeKey ? "missing_stripe_key" : "missing_platform_account",
    };
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // ponytail: PaymentIntent without saved PM will fail until Checkout collects a card.
    // Wire customer + default_payment_method from onboarding/Checkout, then retry.
    const intent = await stripe.paymentIntents.create({
      amount: SUBSCRIPTION_AMOUNT_CENTS,
      currency: SUBSCRIPTION_CURRENCY,
      confirm: false,
      metadata: {
        mollure_professional_profile_id: professionalProfileId,
        mollure_subscription_reason: reason,
        mollure_platform_account: platformAccount,
      },
      // Destination / transfer for Connect platform receiving fees — adjust when Billing live.
      // transfer_data: { destination: platformAccount },
    });

    if (intent.status === "succeeded") {
      return { ok: true, stub: false, paymentIntentId: intent.id };
    }
    return {
      ok: false,
      stub: false,
      reason: `intent_${intent.status}`,
      paymentIntentId: intent.id,
    };
  } catch (error) {
    return {
      ok: false,
      stub: false,
      reason: error?.code || error?.message || "charge_failed",
    };
  }
};

/**
 * @param clearRenewsAt — true for missed-renewal / failed charge (period ends).
 *   false for voluntary mid-period deactivate so reactivate can keep the paid window.
 */
const deactivateRow = async (professionalProfileId, { clearRenewsAt = true } = {}) => {
  const result = await query(
    clearRenewsAt
      ? `UPDATE professional_finance_settings
         SET subscription_status = 'inactive',
             subscription_renews_at = NULL,
             updated_at = NOW()
         WHERE professional_profile_id = $1
         RETURNING *`
      : `UPDATE professional_finance_settings
         SET subscription_status = 'inactive',
             updated_at = NOW()
         WHERE professional_profile_id = $1
         RETURNING *`,
    [professionalProfileId],
  );
  return result.rows[0];
};

const extendRenewal = async (professionalProfileId, fromDate = new Date()) => {
  const renewsAt = addOneCalendarMonth(fromDate);
  const result = await query(
    `UPDATE professional_finance_settings
     SET subscription_status = 'active',
         subscription_renews_at = $2,
         subscription_last_payment_at = NOW(),
         updated_at = NOW()
     WHERE professional_profile_id = $1
     RETURNING *`,
    [professionalProfileId, renewsAt.toISOString()],
  );
  return result.rows[0];
};

/**
 * Activate / reactivate Mollure subscription (15 EUR/month).
 *
 * Money is taken only when starting a NEW paid period:
 * - first activate (renews_at null), or
 * - activate after renews_at has already passed.
 *
 * Mid-period: deactivate then activate while now < renews_at → NO charge;
 * keep the same renews_at and subscription_activated_at (anniversary).
 */
export const activateSubscription = async (professionalProfileId, { autoPay } = {}) => {
  const now = new Date();
  const existing = await query(
    `SELECT * FROM professional_finance_settings WHERE professional_profile_id = $1`,
    [professionalProfileId],
  );
  const prev = existing.rows[0];

  // Still inside a paid window → free reactivate; do not touch renews_at / activated_at.
  if (prev && !needsNewPeriodCharge(prev.subscription_renews_at, now)) {
    const result = await query(
      `UPDATE professional_finance_settings
       SET subscription_status = 'active',
           auto_pay = COALESCE($2, auto_pay),
           updated_at = NOW()
       WHERE professional_profile_id = $1
       RETURNING *`,
      [professionalProfileId, typeof autoPay === "boolean" ? autoPay : null],
    );
    return {
      row: result.rows[0],
      charge: null,
      activated: true,
      billed: false,
      mode: "reactivate_within_period",
    };
  }

  // New period: charge (or stub), then set renews_at = now + 1 calendar month.
  const renewsAt = addOneCalendarMonth(now);
  const charge = await attemptSubscriptionCharge({
    professionalProfileId,
    reason: "activate",
  });

  // Real Stripe configured but charge failed (declined / no PM) → stay inactive.
  if (!charge.stub && !charge.ok) {
    const result = await query(
      `UPDATE professional_finance_settings
       SET subscription_status = 'inactive',
           updated_at = NOW()
       WHERE professional_profile_id = $1
       RETURNING *`,
      [professionalProfileId],
    );
    return {
      row: result.rows[0],
      charge,
      activated: false,
      billed: false,
      mode: "new_period",
    };
  }

  const result = await query(
    `UPDATE professional_finance_settings
     SET subscription_status = 'active',
         subscription_activated_at = $2,
         subscription_renews_at = $3,
         subscription_last_payment_at = NOW(),
         auto_pay = COALESCE($4, auto_pay),
         updated_at = NOW()
     WHERE professional_profile_id = $1
     RETURNING *`,
    [
      professionalProfileId,
      now.toISOString(),
      renewsAt.toISOString(),
      typeof autoPay === "boolean" ? autoPay : null,
    ],
  );
  return {
    row: result.rows[0],
    charge,
    activated: true,
    billed: true,
    mode: "new_period",
  };
};

/** Voluntary mid-period off: keep renews_at so re-Activate before expiry stays free. */
export const deactivateSubscription = async (professionalProfileId) => {
  const row = await deactivateRow(professionalProfileId, { clearRenewsAt: false });
  return { row };
};

export const setAutoPay = async (professionalProfileId, autoPay) => {
  const result = await query(
    `UPDATE professional_finance_settings
     SET auto_pay = $2, updated_at = NOW()
     WHERE professional_profile_id = $1
     RETURNING *`,
    [professionalProfileId, Boolean(autoPay)],
  );
  return result.rows[0];
};

/**
 * Manual path when auto_pay is off: record a successful payment and push anniversary +1 month.
 * Requires currently active (or reactivates only via activate_subscription).
 */
export const confirmManualPayment = async (professionalProfileId) => {
  const existing = await query(
    `SELECT * FROM professional_finance_settings WHERE professional_profile_id = $1`,
    [professionalProfileId],
  );
  const row = existing.rows[0];
  if (!row || row.subscription_status !== "active") {
    return { row: row ?? null, ok: false, reason: "not_active" };
  }

  // Anchor from renews_at if still in future (early pay), else from now.
  const renews = row.subscription_renews_at
    ? new Date(row.subscription_renews_at)
    : new Date();
  const base = renews.getTime() > Date.now() ? renews : new Date();
  const next = await extendRenewal(professionalProfileId, base);
  return { row: next, ok: true };
};

/**
 * If renews_at is past due:
 * - auto_pay ON → attempt charge; success extends period, failure deactivates
 * - auto_pay OFF → deactivate (manual pay missed anniversary)
 */
export const applyRenewalIfDue = async (row, now = new Date()) => {
  if (!row || row.subscription_status !== "active") return row;
  if (!isPastRenewal(row.subscription_renews_at, now)) return row;

  const professionalProfileId = row.professional_profile_id;

  if (!row.auto_pay) {
    return deactivateRow(professionalProfileId);
  }

  const charge = await attemptSubscriptionCharge({
    professionalProfileId,
    reason: "renewal",
  });

  // Stub (no keys): treat as failed renewal so lifecycle stays honest without fake paid months.
  // Ops can set STRIPE keys + platform account, or use confirm_manual_payment in dev.
  if (charge.stub || !charge.ok) {
    return deactivateRow(professionalProfileId);
  }

  return extendRenewal(professionalProfileId, now);
};

/** Batch for cron: all active rows past renews_at. */
export const processDueSubscriptionRenewals = async (now = new Date()) => {
  const due = await query(
    `SELECT * FROM professional_finance_settings
     WHERE subscription_status = 'active'
       AND subscription_renews_at IS NOT NULL
       AND subscription_renews_at <= $1`,
    [now.toISOString()],
  );

  const outcomes = [];
  for (const row of due.rows) {
    const next = await applyRenewalIfDue(row, now);
    outcomes.push({
      professionalProfileId: row.professional_profile_id,
      previousStatus: row.subscription_status,
      nextStatus: next?.subscription_status,
      autoPay: row.auto_pay,
    });
  }
  return outcomes;
};
