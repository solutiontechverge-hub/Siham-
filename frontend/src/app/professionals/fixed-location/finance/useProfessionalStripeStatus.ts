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

export function useProfessionalStripeStatus() {
  const { data: settingsResponse, isLoading } = useGetFinanceSettingsQuery();
  const [updateStripeStatus, { isLoading: isUpdating }] = useUpdateFinanceStripeStatusMutation();
  const [createConnectLink] = useCreateStripeConnectLinkMutation();

  const subscriptionStatus: StripeSubscriptionStatus =
    settingsResponse?.data?.subscriptionStatus ?? "inactive";
  const connectStatus: StripeConnectStatus =
    settingsResponse?.data?.stripeConnectStatus ?? "not_connected";

  const subscriptionActive = subscriptionStatus === "active";
  const paymentsConnected = connectStatus === "connected";

  const activateSubscription = React.useCallback(() => {
    void updateStripeStatus({ action: "activate_subscription" });
  }, [updateStripeStatus]);

  const deactivateSubscription = React.useCallback(() => {
    void updateStripeStatus({ action: "deactivate_subscription" });
  }, [updateStripeStatus]);

  const markPaymentsConnected = React.useCallback(async () => {
    try {
      const result = await createConnectLink({}).unwrap();
      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }
      void updateStripeStatus({ action: "connect_payments" });
    } catch {
      void updateStripeStatus({ action: "connect_payments" });
    }
  }, [createConnectLink, updateStripeStatus]);

  return {
    hydrated: !isLoading,
    subscriptionActive,
    paymentsConnected,
    subscriptionStatus,
    connectStatus,
    activateSubscription,
    deactivateSubscription,
    markPaymentsConnected,
    isUpdating,
  };
}
