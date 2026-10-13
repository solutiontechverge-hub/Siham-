import type { StripeOnboardingState } from "../../../../../store/services/financeApi";

export type StripeSettingsPanel = "expectations" | "connected";

export type StripeSettingsOnboardingView = {
  ctaLabel: "Start onboarding" | "Complete onboarding" | "Stripe dashboard";
  /** expectations = What To Expect; connected = Payout then Account management */
  panel: StripeSettingsPanel;
  statusLabel: string;
  paymentsConnected: boolean;
};

/** Pure UI controller for the 3-state Stripe Connect machine. */
export function stripeSettingsOnboardingView(
  onboardingState: StripeOnboardingState,
): StripeSettingsOnboardingView {
  if (onboardingState === "CONNECTED") {
    return {
      ctaLabel: "Stripe dashboard",
      panel: "connected",
      statusLabel: "Connected",
      paymentsConnected: true,
    };
  }
  if (onboardingState === "INCOMPLETE") {
    return {
      ctaLabel: "Complete onboarding",
      panel: "expectations",
      statusLabel: "Started — incomplete",
      paymentsConnected: false,
    };
  }
  return {
    ctaLabel: "Start onboarding",
    panel: "expectations",
    statusLabel: "Not connected",
    paymentsConnected: false,
  };
}
