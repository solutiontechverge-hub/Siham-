"use client";

import * as React from "react";
import {
  useGetPublicInvoiceSettingsQuery,
  useGetPublicTransactionOptionsQuery,
} from "../../../store/services/financeApi";
import {
  defaultFinanceInvoiceSettings,
  type FinanceInvoiceSettings,
} from "./useFinanceInvoiceSettings";
import {
  type FinanceTransactionOptions,
} from "./useFinanceTransactionOptions";

export function usePublicFinanceSettings(businessSetupId: string | undefined) {
  const skip = !businessSetupId;
  const { data: txResponse, isLoading: txLoading } = useGetPublicTransactionOptionsQuery(
    businessSetupId ?? "",
    { skip },
  );
  const { data: invoiceResponse, isLoading: invoiceLoading } = useGetPublicInvoiceSettingsQuery(
    businessSetupId ?? "",
    { skip },
  );

  const transactionOptions = React.useMemo<FinanceTransactionOptions>(
    () =>
      txResponse?.data ?? {
        onlineImmediate: false,
        onlineInvoiceDueDate: false,
        offlineImmediate: false,
        offlineInvoiceDueDate: false,
      },
    [txResponse?.data],
  );

  const invoiceSettings = React.useMemo<FinanceInvoiceSettings>(
    () => invoiceResponse?.data ?? defaultFinanceInvoiceSettings,
    [invoiceResponse?.data],
  );

  return {
    transactionOptions,
    invoiceSettings,
    isLoading: txLoading || invoiceLoading,
  };
}
