"use client";

import * as React from "react";
import {
  useGetFinanceSettingsQuery,
  useUpdateFinanceInvoiceSettingsMutation,
} from "../../../store/services/financeApi";
import { roundMoney } from "../../../utils/money";

export type FinanceInvoiceTemplateType = "individual" | "company";

export type FinanceInvoiceProduct = {
  id: string;
  name: string;
  price: number;
  vat: string;
  unit?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
};

export type FinanceInvoiceService = {
  id: string;
  category: string;
  service: string;
  vat: string;
};

export type FinanceInvoicePaymentTerms = {
  originalDueValue: string;
  originalDueUnit: string;
  originalPenaltyValue: string;
  originalPenaltyUnit: string;
  firstReissueTrigger: string;
  firstReissueDueValue: string;
  firstReissueDueUnit: string;
  firstReissuePenaltyValue: string;
  firstReissuePenaltyUnit: string;
  secondReissueTrigger: string;
  secondReissueDueValue: string;
  secondReissueDueUnit: string;
  secondReissuePenaltyValue: string;
  secondReissuePenaltyUnit: string;
};

export type FinanceInvoiceReminders = {
  reminder1Value: string;
  reminder1Unit: string;
  reminder2Value: string;
  reminder2Unit: string;
};

export type FinanceInvoiceSettings = {
  logoDataUrl: string | null;
  defaultInvoiceType: FinanceInvoiceTemplateType;
  products: FinanceInvoiceProduct[];
  uniqueItems: FinanceInvoiceProduct[];
  services: FinanceInvoiceService[];
  paymentTerms: FinanceInvoicePaymentTerms;
  reminders: FinanceInvoiceReminders;
};

export const defaultFinanceInvoiceSettings: FinanceInvoiceSettings = {
  logoDataUrl: null,
  defaultInvoiceType: "individual",
  products: [],
  uniqueItems: [],
  services: [],
  paymentTerms: {
    originalDueValue: "2",
    originalDueUnit: "Weeks",
    originalPenaltyValue: "10",
    originalPenaltyUnit: "%",
    firstReissueTrigger: "Automatic",
    firstReissueDueValue: "2",
    firstReissueDueUnit: "Weeks",
    firstReissuePenaltyValue: "20",
    firstReissuePenaltyUnit: "%",
    secondReissueTrigger: "Automatic",
    secondReissueDueValue: "2",
    secondReissueDueUnit: "Weeks",
    secondReissuePenaltyValue: "20",
    secondReissuePenaltyUnit: "%",
  },
  reminders: {
    reminder1Value: "1",
    reminder1Unit: "Weeks",
    reminder2Value: "3",
    reminder2Unit: "Days",
  },
};

/** Defaults only — live data comes from `useFinanceInvoiceSettings` → GET /api/finance/settings. */
export function readFinanceInvoiceSettings(): FinanceInvoiceSettings {
  return defaultFinanceInvoiceSettings;
}

function normalizeProducts(products: readonly FinanceInvoiceProduct[] | undefined) {
  return (products ?? []).map((product) => ({
    ...product,
    price: roundMoney(product.price),
    ...(product.discountAmount == null
      ? {}
      : { discountAmount: roundMoney(product.discountAmount) }),
  }));
}

export function useFinanceInvoiceSettings() {
  const { data: settingsResponse, isLoading } = useGetFinanceSettingsQuery();
  const [updateInvoiceSettings] = useUpdateFinanceInvoiceSettingsMutation();
  const [localDraft, setLocalDraft] = React.useState<FinanceInvoiceSettings | null>(null);

  const rawSettings =
    localDraft ?? settingsResponse?.data?.invoiceSettings ?? defaultFinanceInvoiceSettings;
  const settings = React.useMemo<FinanceInvoiceSettings>(
    () => ({
      ...defaultFinanceInvoiceSettings,
      ...rawSettings,
      products: normalizeProducts(rawSettings.products),
      uniqueItems: normalizeProducts(rawSettings.uniqueItems),
      services: rawSettings.services ?? [],
      paymentTerms: {
        ...defaultFinanceInvoiceSettings.paymentTerms,
        ...rawSettings.paymentTerms,
      },
      reminders: {
        ...defaultFinanceInvoiceSettings.reminders,
        ...rawSettings.reminders,
      },
    }),
    [rawSettings],
  );

  const setSettings = React.useCallback(
    (updater: FinanceInvoiceSettings | ((prev: FinanceInvoiceSettings) => FinanceInvoiceSettings)) => {
      setLocalDraft((prev) => {
        const raw = prev ?? settingsResponse?.data?.invoiceSettings ?? defaultFinanceInvoiceSettings;
        const base: FinanceInvoiceSettings = {
          ...defaultFinanceInvoiceSettings,
          ...raw,
          products: normalizeProducts(raw.products),
          uniqueItems: normalizeProducts(raw.uniqueItems),
          services: raw.services ?? [],
          paymentTerms: {
            ...defaultFinanceInvoiceSettings.paymentTerms,
            ...raw.paymentTerms,
          },
          reminders: {
            ...defaultFinanceInvoiceSettings.reminders,
            ...raw.reminders,
          },
        };
        const next = typeof updater === "function" ? updater(base) : updater;
        const normalized: FinanceInvoiceSettings = {
          ...defaultFinanceInvoiceSettings,
          ...next,
          products: normalizeProducts(next.products),
          uniqueItems: normalizeProducts(next.uniqueItems),
          services: next.services ?? [],
        };
        void updateInvoiceSettings({ invoiceSettings: normalized });
        return normalized;
      });
    },
    [settingsResponse?.data?.invoiceSettings, updateInvoiceSettings],
  );

  React.useEffect(() => {
    if (settingsResponse?.data?.invoiceSettings) {
      setLocalDraft(null);
    }
  }, [settingsResponse?.data?.invoiceSettings]);

  return {
    settings,
    setSettings,
    isLoading,
  };
}
