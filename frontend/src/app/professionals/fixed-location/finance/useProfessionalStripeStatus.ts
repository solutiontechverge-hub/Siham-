"use client";

import * as React from "react";
import { useGetProfileQuery } from "../../../../store/services/profileApi";

const SUBSCRIPTION_KEY_PREFIX = "mollure:stripe:subscription:";
const CONNECT_KEY_PREFIX = "mollure:stripe:connect:";

/** Set to false when wiring real Stripe Billing subscription status from the API. */
const STRIPE_SETTINGS_PREVIEW_ACTIVE = false;

export type StripeSubscriptionStatus = "inactive" | "active";

export type StripeConnectStatus = "not_connected" | "connected";

function readStoredStatus(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredStatus(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function useProfessionalStripeStatus() {
  const { data: profileResponse } = useGetProfileQuery();
  const userId = profileResponse?.data?.id ?? "anonymous";

  const subscriptionStorageKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
  const connectStorageKey = `${CONNECT_KEY_PREFIX}${userId}`;

  const DEV_DEFAULT_SUBSCRIPTION: StripeSubscriptionStatus = "inactive";
  const DEV_DEFAULT_CONNECT: StripeConnectStatus = "not_connected";

  const [subscriptionStatus, setSubscriptionStatus] = React.useState<StripeSubscriptionStatus>(DEV_DEFAULT_SUBSCRIPTION);
  const [connectStatus, setConnectStatus] = React.useState<StripeConnectStatus>(DEV_DEFAULT_CONNECT);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!STRIPE_SETTINGS_PREVIEW_ACTIVE) {
      writeStoredStatus(subscriptionStorageKey, null);
      writeStoredStatus(connectStorageKey, null);
      setSubscriptionStatus("inactive");
      setConnectStatus("not_connected");
      setHydrated(true);
      return;
    }

    const storedSub = readStoredStatus(subscriptionStorageKey);
    const storedConnect = readStoredStatus(connectStorageKey);
    setSubscriptionStatus(
      storedSub === null ? DEV_DEFAULT_SUBSCRIPTION : storedSub === "active" ? "active" : "inactive",
    );
    setConnectStatus(
      storedConnect === null ? DEV_DEFAULT_CONNECT : storedConnect === "connected" ? "connected" : "not_connected",
    );
    setHydrated(true);
  }, [subscriptionStorageKey, connectStorageKey]);

  const subscriptionActive = STRIPE_SETTINGS_PREVIEW_ACTIVE || subscriptionStatus === "active";
  const paymentsConnected = STRIPE_SETTINGS_PREVIEW_ACTIVE || connectStatus === "connected";

  const activateSubscription = React.useCallback(() => {
    writeStoredStatus(subscriptionStorageKey, "active");
    setSubscriptionStatus("active");
  }, [subscriptionStorageKey]);

  const deactivateSubscription = React.useCallback(() => {
    writeStoredStatus(subscriptionStorageKey, null);
    writeStoredStatus(connectStorageKey, null);
    setSubscriptionStatus("inactive");
    setConnectStatus("not_connected");
  }, [subscriptionStorageKey, connectStorageKey]);

  const markPaymentsConnected = React.useCallback(() => {
    writeStoredStatus(connectStorageKey, "connected");
    setConnectStatus("connected");
  }, [connectStorageKey]);

  return {
    hydrated,
    subscriptionActive,
    paymentsConnected,
    activateSubscription,
    deactivateSubscription,
    markPaymentsConnected,
  };
}
