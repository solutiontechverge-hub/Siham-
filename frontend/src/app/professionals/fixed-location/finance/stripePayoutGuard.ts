import type { StripeOnboardingState } from "../../../../store/services/financeApi";

/** Entry point 1 — Stripe settings screen (all 3 onboarding states). */
export const STRIPE_SETTINGS_PATH = "/professionals/finance/setting";

/** sessionStorage key for return-after-onboarding (entry point 2). */
export const STRIPE_RETURN_PATH_KEY = "mollure:stripe:returnPath";

export type StripePayoutGuardDecision =
  | { action: "proceed" }
  | { action: "intercept"; incomplete: boolean };

/** CONNECTED → continue payout; otherwise intercept toward Stripe settings. */
export function stripePayoutGuardDecision(
  onboardingState: StripeOnboardingState,
): StripePayoutGuardDecision {
  if (onboardingState === "CONNECTED") return { action: "proceed" };
  return {
    action: "intercept",
    incomplete: onboardingState === "INCOMPLETE",
  };
}

export function isStripePayoutReady(
  onboardingState: StripeOnboardingState,
): boolean {
  return stripePayoutGuardDecision(onboardingState).action === "proceed";
}

export function rememberStripeReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STRIPE_RETURN_PATH_KEY, path);
  } catch {
    // ignore private mode / quota
  }
}

export function peekStripeReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STRIPE_RETURN_PATH_KEY);
  } catch {
    return null;
  }
}

export function consumeStripeReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(STRIPE_RETURN_PATH_KEY);
    if (value) window.sessionStorage.removeItem(STRIPE_RETURN_PATH_KEY);
    return value;
  } catch {
    return null;
  }
}

/** Dialog copy for NOT_CONNECTED / INCOMPLETE intercept. */
export function stripePayoutInterceptCopy(incomplete: boolean): {
  title: string;
  body: string;
  confirmLabel: string;
} {
  if (incomplete) {
    return {
      title: "Complete Stripe onboarding",
      body: "Finish connecting your Stripe account to manage payouts. You will return here after onboarding.",
      confirmLabel: "Continue onboarding",
    };
  }
  return {
    title: "Connect Stripe for payouts",
    body: "Connect a Stripe payout method before managing payouts. You will return here after onboarding.",
    confirmLabel: "Go to Stripe settings",
  };
}
