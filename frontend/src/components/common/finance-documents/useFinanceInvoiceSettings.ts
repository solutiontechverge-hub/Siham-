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
  /** True Business Template service_id (UUID). */
  id: string;
  service_id?: string;
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

/** Merge partial/raw invoice settings onto defaults (shared by read + write paths). */
export function coerceFinanceInvoiceSettings(
  raw: Partial<FinanceInvoiceSettings> | null | undefined,
): FinanceInvoiceSettings {
  const base = raw ?? defaultFinanceInvoiceSettings;
  return {
    ...defaultFinanceInvoiceSettings,
    ...base,
    products: normalizeProducts(base.products),
    uniqueItems: normalizeProducts(base.uniqueItems),
    services: base.services ?? [],
    paymentTerms: {
      ...defaultFinanceInvoiceSettings.paymentTerms,
      ...base.paymentTerms,
    },
    reminders: {
      ...defaultFinanceInvoiceSettings.reminders,
      ...base.reminders,
    },
    logoDataUrl: base.logoDataUrl ?? null,
  };
}

/** Compute next invoice settings for PUT — never rely on a setState updater side effect. */
export function buildNextFinanceInvoiceSettings(
  current: Partial<FinanceInvoiceSettings> | null | undefined,
  updater:
    | FinanceInvoiceSettings
    | ((prev: FinanceInvoiceSettings) => FinanceInvoiceSettings),
): FinanceInvoiceSettings {
  const base = coerceFinanceInvoiceSettings(current);
  const next = typeof updater === "function" ? updater(base) : updater;
  return coerceFinanceInvoiceSettings(next);
}

export function useFinanceInvoiceSettings() {
  const { data: settingsResponse, isLoading } = useGetFinanceSettingsQuery();
  const [updateInvoiceSettings] = useUpdateFinanceInvoiceSettingsMutation();
  const [localDraft, setLocalDraft] = React.useState<FinanceInvoiceSettings | null>(null);
  const localDraftRef = React.useRef(localDraft);
  localDraftRef.current = localDraft;
  const serverSettingsRef = React.useRef(settingsResponse?.data?.invoiceSettings);
  serverSettingsRef.current = settingsResponse?.data?.invoiceSettings;

  const rawSettings =
    localDraft ?? settingsResponse?.data?.invoiceSettings ?? defaultFinanceInvoiceSettings;
  const settings = React.useMemo<FinanceInvoiceSettings>(
    () => coerceFinanceInvoiceSettings(rawSettings),
    [rawSettings],
  );

  const setSettings = React.useCallback(
    (
      updater:
        | FinanceInvoiceSettings
        | ((prev: FinanceInvoiceSettings) => FinanceInvoiceSettings),
    ): Promise<void> => {
      // Compute outside setState — mutating `normalized` inside an updater can PUT
      // defaultFinanceInvoiceSettings (products: []) and wipe the catalog.
      const normalized = buildNextFinanceInvoiceSettings(
        localDraftRef.current ?? serverSettingsRef.current,
        updater,
      );
      localDraftRef.current = normalized;
      setLocalDraft(normalized);
      return updateInvoiceSettings({ invoiceSettings: normalized })
        .unwrap()
        .then(() => undefined);
    },
    [updateInvoiceSettings],
  );

  // Keep draft until server catches up (logo uploads race with refetch).
  React.useEffect(() => {
    const server = settingsResponse?.data?.invoiceSettings;
    if (!server) return;
    setLocalDraft((prev) => {
      if (!prev) return null;
      if (prev.logoDataUrl && !server.logoDataUrl) return prev;
      return null;
    });
  }, [settingsResponse?.data?.invoiceSettings]);

  return {
    settings,
    setSettings,
    isLoading,
  };
}
