"use client";

import * as React from "react";
import {
  useGetFinanceSettingsQuery,
  useUpdateFinanceTransactionOptionsMutation,
} from "../../../store/services/financeApi";

export type FinanceTransactionOptions = {
  onlineImmediate: boolean;
  onlineInvoiceDueDate: boolean;
  offlineImmediate: boolean;
  offlineInvoiceDueDate: boolean;
};

export const defaultFinanceTransactionOptions: FinanceTransactionOptions = {
  onlineImmediate: true,
  onlineInvoiceDueDate: true,
  offlineImmediate: true,
  offlineInvoiceDueDate: false,
};

/** Online immediate is mandatory for post-booking checkout — never persist/expose false. */
export function lockOnlineImmediate(
  options: FinanceTransactionOptions,
): FinanceTransactionOptions {
  // Keep referential identity when already locked — callers sync draft via useEffect([options]).
  return options.onlineImmediate === true
    ? options
    : { ...options, onlineImmediate: true };
}

export function useFinanceTransactionOptions() {
  const { data: settingsResponse, isLoading: isQueryLoading } = useGetFinanceSettingsQuery();
  const [updateOptions, { isLoading: isSaving }] = useUpdateFinanceTransactionOptionsMutation();
  const [localDraft, setLocalDraft] = React.useState<FinanceTransactionOptions | null>(null);

  const options = React.useMemo(
    () =>
      lockOnlineImmediate(
        localDraft ??
          settingsResponse?.data?.transactionOptions ??
          defaultFinanceTransactionOptions,
      ),
    [localDraft, settingsResponse?.data?.transactionOptions],
  );

  const setOptions = React.useCallback(
    (
      updater:
        | FinanceTransactionOptions
        | ((prev: FinanceTransactionOptions) => FinanceTransactionOptions),
    ) => {
      setLocalDraft((prev) => {
        const base = prev ?? settingsResponse?.data?.transactionOptions ?? defaultFinanceTransactionOptions;
        const next = typeof updater === "function" ? updater(base) : updater;
        const locked = lockOnlineImmediate(next);
        void updateOptions(locked);
        return locked;
      });
    },
    [settingsResponse?.data?.transactionOptions, updateOptions],
  );

  React.useEffect(() => {
    if (settingsResponse?.data?.transactionOptions) {
      setLocalDraft(lockOnlineImmediate(settingsResponse.data.transactionOptions));
    }
  }, [settingsResponse?.data?.transactionOptions]);

  return {
    options,
    setOptions,
    hydrated: !isQueryLoading,
    isSaving,
  };
}
