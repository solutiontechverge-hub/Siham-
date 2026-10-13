"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import ModalActionConfirmDialog from "../../../../components/common/ModalActionConfirmDialog";
import { useProfessionalStripeStatus } from "./useProfessionalStripeStatus";
import {
  STRIPE_SETTINGS_PATH,
  rememberStripeReturnPath,
  stripePayoutGuardDecision,
  stripePayoutInterceptCopy,
} from "./stripePayoutGuard";

/**
 * Shared entry-point-2 guard: CONNECTED → run payout action;
 * NOT_CONNECTED / INCOMPLETE → prompt → Stripe settings (return path in sessionStorage).
 */
export function useStripePayoutGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    hydrated,
    onboardingState,
    openStripeDashboard,
    isUpdating,
  } = useProfessionalStripeStatus();
  const [promptOpen, setPromptOpen] = React.useState(false);

  const decision = stripePayoutGuardDecision(onboardingState);
  const copy = stripePayoutInterceptCopy(
    decision.action === "intercept" ? decision.incomplete : false,
  );

  const goToStripeSettings = React.useCallback(() => {
    const returnPath =
      pathname && pathname !== STRIPE_SETTINGS_PATH
        ? pathname
        : "/professionals/finance/overview";
    rememberStripeReturnPath(returnPath);
    router.push(STRIPE_SETTINGS_PATH);
  }, [pathname, router]);

  /** Gate a payout action. Default CONNECTED action opens Stripe dashboard. */
  const runPayoutAction = React.useCallback(
    (onReady?: () => void | Promise<void>) => {
      if (stripePayoutGuardDecision(onboardingState).action === "proceed") {
        void (onReady ?? (() => openStripeDashboard()))();
        return;
      }
      setPromptOpen(true);
    },
    [onboardingState, openStripeDashboard],
  );

  const payoutGuardDialog = (
    <ModalActionConfirmDialog
      open={promptOpen}
      onClose={() => setPromptOpen(false)}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      onConfirm={goToStripeSettings}
    />
  );

  return {
    hydrated,
    onboardingState,
    isUpdating,
    runPayoutAction,
    payoutGuardDialog,
  };
}
