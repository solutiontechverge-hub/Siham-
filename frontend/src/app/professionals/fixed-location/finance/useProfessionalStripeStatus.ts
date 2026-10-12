"use client";

import * as React from "react";
import {
  useGetFinanceSettingsQuery,
  useUpdateFinanceStripeStatusMutation,
  useCreateStripeConnectLinkMutation,
  type FinanceStripeConnectStatus,
  type FinanceSubscriptionStatus,
} from "../../../../store/services/financeApi";

export type StripeSubscriptionStatus = FinanceSubscriptionStatus;
export type StripeConnectStatus = FinanceStripeConnectStatus;

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
  const [updateStripeStatus, { isLoading: isUpdating }] =
    useUpdateFinanceStripeStatusMutation();
  const [createConnectLink, { isLoading: isConnecting }] =
    useCreateStripeConnectLinkMutation();

  React.useEffect(() => {
    purgeLegacyFinanceLocalStorage();
  }, []);

  const settings = settingsResponse?.data;
  const subscriptionStatus: StripeSubscriptionStatus =
    settings?.subscriptionStatus ?? "inactive";
  const connectStatus: StripeConnectStatus =
    settings?.stripeConnectStatus ?? "not_connected";
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
    const result = await createConnectLink({}).unwrap();
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

  return {
    hydrated: !isLoading,
    refreshing: isFetching,
    subscriptionActive,
    paymentsConnected,
    subscriptionStatus,
    connectStatus,
    autoPay,
    subscriptionRenewsAt,
    subscriptionActivatedAt,
    activateSubscription,
    deactivateSubscription,
    setAutoPay,
    confirmManualPayment,
    markPaymentsConnected,
    isUpdating: isUpdating || isConnecting,
  };
}
