"use client";

import * as React from "react";
import {
  useGetFinanceSettingsQuery,
  useGetStripeConnectStatusQuery,
  useUpdateFinanceStripeStatusMutation,
  useCreateStripeConnectLinkMutation,
  useCreateStripeDashboardLinkMutation,
  type FinanceStripeConnectStatus,
  type FinanceSubscriptionStatus,
  type StripeOnboardingState,
} from "../../../../store/services/financeApi";
import {
  STRIPE_SETTINGS_PATH,
  peekStripeReturnPath,
} from "./stripePayoutGuard";

export type StripeSubscriptionStatus = FinanceSubscriptionStatus;
export type StripeConnectStatus = FinanceStripeConnectStatus;
export type { StripeOnboardingState };

/** Drop pre-API stripe/invoice keys so localStorage is never mistaken for source of truth. */
function purgeLegacyFinanceLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const drop: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("mollure:stripe:subscription:") ||
          key.startsWith("mollure:stripe:connect:") ||
          key === "mollure:finance_invoice_settings")
      ) {
        drop.push(key);
      }
    }
    for (const key of drop) window.localStorage.removeItem(key);
  } catch {
    // ignore private mode / quota
  }
}

export function useProfessionalStripeStatus() {
  const { data: settingsResponse, isLoading, isFetching } =
    useGetFinanceSettingsQuery();
  // Real-time Stripe retrieve; falls back to settings row when still loading.
  const { data: stripeStatusResponse, isFetching: isStripeStatusFetching } =
    useGetStripeConnectStatusQuery();
  const [updateStripeStatus, { isLoading: isUpdating }] =
    useUpdateFinanceStripeStatusMutation();
  const [createConnectLink, { isLoading: isConnecting }] =
    useCreateStripeConnectLinkMutation();
  const [createDashboardLink, { isLoading: isOpeningDashboard }] =
    useCreateStripeDashboardLinkMutation();

  React.useEffect(() => {
    purgeLegacyFinanceLocalStorage();
  }, []);

  const settings = settingsResponse?.data;
  const subscriptionStatus: StripeSubscriptionStatus =
    settings?.subscriptionStatus ?? "inactive";
  const connectStatus: StripeConnectStatus =
    stripeStatusResponse?.data?.stripeConnectStatus ??
    settings?.stripeConnectStatus ??
    "not_connected";
  const onboardingState: StripeOnboardingState =
    stripeStatusResponse?.data?.status ??
    (connectStatus === "connected"
      ? "CONNECTED"
      : connectStatus === "onboarding"
        ? "INCOMPLETE"
        : "NOT_CONNECTED");
  const autoPay = settings?.autoPay !== false;
  const subscriptionRenewsAt = settings?.subscriptionRenewsAt ?? null;
  const subscriptionActivatedAt = settings?.subscriptionActivatedAt ?? null;

  const subscriptionActive = subscriptionStatus === "active";
  const paymentsConnected = connectStatus === "connected";

  const activateSubscription = React.useCallback(async () => {
    return updateStripeStatus({ action: "activate_subscription" }).unwrap();
  }, [updateStripeStatus]);

  const deactivateSubscription = React.useCallback(async () => {
    return updateStripeStatus({ action: "deactivate_subscription" }).unwrap();
  }, [updateStripeStatus]);

  const setAutoPay = React.useCallback(
    async (next: boolean) => {
      await updateStripeStatus({ action: "set_auto_pay", autoPay: next }).unwrap();
    },
    [updateStripeStatus],
  );

  /** Manual renew when auto-pay is off — must succeed before anniversary or DB deactivates. */
  const confirmManualPayment = React.useCallback(async () => {
    await updateStripeStatus({ action: "confirm_manual_payment" }).unwrap();
  }, [updateStripeStatus]);

  /** Start/complete Connect onboarding via API (persists DB). Redirects when Stripe returns a URL. */
  const markPaymentsConnected = React.useCallback(async () => {
    // ponytail: entry point 2 return path → settings?stripeReturn=1 so settings can redirect home
    const hasReturn = Boolean(peekStripeReturnPath());
    const settingsUrl = `${window.location.origin}${STRIPE_SETTINGS_PATH}${
      hasReturn ? "?stripeReturn=1" : ""
    }`;
    const result = await createConnectLink(
      hasReturn
        ? { returnUrl: settingsUrl, refreshUrl: settingsUrl }
        : undefined,
    ).unwrap();
    if (result.data?.alreadyConnected || result.data?.stripeConnectStatus === "connected") {
      return {
        redirected: false as const,
        simulated: Boolean(result.data?.simulated),
        alreadyConnected: true as const,
        stripeConnectStatus: "connected" as const,
      };
    }
    if (result.data?.url) {
      window.location.href = result.data.url;
      return { redirected: true as const, simulated: false as const };
    }
    // No URL: backend already wrote honest status (onboarding / test-ladder connected).
    return {
      redirected: false as const,
      simulated: Boolean(result.data?.simulated),
      stripeConnectStatus: result.data?.stripeConnectStatus,
    };
  }, [createConnectLink]);

  /** Express/Custom dashboard login link (CONNECTED only). */
  const openStripeDashboard = React.useCallback(async () => {
    const result = await createDashboardLink().unwrap();
    const url = result.data?.url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return { opened: true as const, simulated: Boolean(result.data?.simulated) };
    }
    // ponytail: no URL — fall back to public Stripe dashboard
    window.open("https://dashboard.stripe.com/", "_blank", "noopener,noreferrer");
    return { opened: true as const, simulated: true as const };
  }, [createDashboardLink]);

  return {
    hydrated: !isLoading,
    refreshing: isFetching || isStripeStatusFetching,
    subscriptionActive,
    paymentsConnected,
    subscriptionStatus,
    connectStatus,
    onboardingState,
    stripeAccountId:
      stripeStatusResponse?.data?.accountId ?? settings?.stripeAccountId ?? null,
    autoPay,
    subscriptionRenewsAt,
    subscriptionActivatedAt,
    activateSubscription,
    deactivateSubscription,
    setAutoPay,
    confirmManualPayment,
    markPaymentsConnected,
    openStripeDashboard,
    isUpdating: isUpdating || isConnecting || isOpeningDashboard,
  };
}
