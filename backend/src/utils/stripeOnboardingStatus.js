/**
 * Canonical Stripe Connect onboarding states (data layer).
 * DB persists snake_case: not_connected | onboarding | connected
 * (onboarding ≡ INCOMPLETE — keep CHECK constraint / existing UI).
 */

export const STRIPE_ONBOARDING = Object.freeze({
  NOT_CONNECTED: "NOT_CONNECTED",
  INCOMPLETE: "INCOMPLETE",
  CONNECTED: "CONNECTED",
});

/**
 * Map Stripe account fields → onboarding state.
 * @param {string | null | undefined} accountId
 * @param {{ details_submitted?: boolean, payouts_enabled?: boolean } | null | undefined} account
 *   Stripe Account object from accounts.retrieve (or null when no retrieve yet).
 */
export function resolveStripeOnboardingStatus(accountId, account) {
  if (!accountId) return STRIPE_ONBOARDING.NOT_CONNECTED;
  // Account id exists but retrieve missing/failed → treat as started, not finished.
  if (!account) return STRIPE_ONBOARDING.INCOMPLETE;
  if (account.details_submitted === true && account.payouts_enabled === true) {
    return STRIPE_ONBOARDING.CONNECTED;
  }
  return STRIPE_ONBOARDING.INCOMPLETE;
}

/** Canonical → professional_finance_settings.stripe_connect_status */
export function toDbStripeConnectStatus(state) {
  if (state === STRIPE_ONBOARDING.CONNECTED) return "connected";
  if (state === STRIPE_ONBOARDING.INCOMPLETE) return "onboarding";
  return "not_connected";
}

/** DB snake → canonical */
export function fromDbStripeConnectStatus(dbStatus) {
  if (dbStatus === "connected") return STRIPE_ONBOARDING.CONNECTED;
  if (dbStatus === "onboarding") return STRIPE_ONBOARDING.INCOMPLETE;
  return STRIPE_ONBOARDING.NOT_CONNECTED;
}

/**
 * Real-time status via stripe.accounts.retrieve.
 * @param {{ accounts: { retrieve: (id: string) => Promise<object> } } | null} stripe
 * @param {string | null | undefined} accountId
 */
export async function fetchStripeOnboardingStatus(stripe, accountId) {
  if (!accountId) {
    return {
      status: STRIPE_ONBOARDING.NOT_CONNECTED,
      account: null,
      detailsSubmitted: false,
      payoutsEnabled: false,
      chargesEnabled: false,
    };
  }
  if (!stripe) {
    // ponytail: no client — cannot verify; resume path still uses stored account id.
    return {
      status: STRIPE_ONBOARDING.INCOMPLETE,
      account: null,
      detailsSubmitted: false,
      payoutsEnabled: false,
      chargesEnabled: false,
    };
  }
  let account;
  try {
    account = await stripe.accounts.retrieve(accountId);
  } catch {
    // Deleted/unreachable account → keep resume path (INCOMPLETE), not NOT_CONNECTED.
    return {
      status: STRIPE_ONBOARDING.INCOMPLETE,
      account: null,
      detailsSubmitted: false,
      payoutsEnabled: false,
      chargesEnabled: false,
    };
  }
  const status = resolveStripeOnboardingStatus(accountId, account);
  return {
    status,
    account,
    detailsSubmitted: Boolean(account?.details_submitted),
    payoutsEnabled: Boolean(account?.payouts_enabled),
    chargesEnabled: Boolean(account?.charges_enabled),
  };
}
