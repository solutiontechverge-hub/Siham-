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

export function useFinanceTransactionOptions() {
  const { data: settingsResponse, isLoading: isQueryLoading } = useGetFinanceSettingsQuery();
  const [updateOptions, { isLoading: isSaving }] = useUpdateFinanceTransactionOptionsMutation();
  const [localDraft, setLocalDraft] = React.useState<FinanceTransactionOptions | null>(null);

  const options =
    localDraft ?? settingsResponse?.data?.transactionOptions ?? defaultFinanceTransactionOptions;

  const setOptions = React.useCallback(
    (
      updater:
        | FinanceTransactionOptions
        | ((prev: FinanceTransactionOptions) => FinanceTransactionOptions),
    ) => {
      setLocalDraft((prev) => {
        const base = prev ?? settingsResponse?.data?.transactionOptions ?? defaultFinanceTransactionOptions;
        const next = typeof updater === "function" ? updater(base) : updater;
        const locked = { ...next, onlineImmediate: true };
        void updateOptions(locked);
        return locked;
      });
    },
    [settingsResponse?.data?.transactionOptions, updateOptions],
  );

  React.useEffect(() => {
    if (settingsResponse?.data?.transactionOptions) {
      setLocalDraft({ ...settingsResponse.data.transactionOptions, onlineImmediate: true });
    }
  }, [settingsResponse?.data?.transactionOptions]);

  return {
    options,
    setOptions,
    hydrated: !isQueryLoading,
    isSaving,
  };
}
