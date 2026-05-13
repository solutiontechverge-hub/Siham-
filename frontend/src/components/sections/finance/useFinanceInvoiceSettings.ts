"use client";

import * as React from "react";

export type FinanceInvoiceTemplateType = "individual" | "company";

export type FinanceInvoiceProduct = {
  id: string;
  name: string;
  price: string;
  vat: string;
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
  services: FinanceInvoiceService[];
  paymentTerms: FinanceInvoicePaymentTerms;
  reminders: FinanceInvoiceReminders;
};

const STORAGE_KEY = "mollure:finance_invoice_settings";

export const defaultFinanceInvoiceSettings: FinanceInvoiceSettings = {
  logoDataUrl: null,
  defaultInvoiceType: "individual",
  products: [
    { id: "p1", name: "Shampoo", price: "30EUR", vat: "30%" },
    { id: "p2", name: "Eye Lashes", price: "50EUR", vat: "10%" },
  ],
  services: [
    { id: "s1", category: "Hair", service: "Dye", vat: "20%" },
    { id: "s2", category: "Makeup", service: "Eye Makeup", vat: "10%" },
  ],
  paymentTerms: {
    originalDueValue: "2",
    originalDueUnit: "Weeks",
    originalPenaltyValue: "10",
    originalPenaltyUnit: "%",
    firstReissueTrigger: "Automatic",
    firstReissueDueValue: "2",
    firstReissueDueUnit: "Weeks",
    firstReissuePenaltyValue: "20EUR",
    firstReissuePenaltyUnit: "%",
    secondReissueTrigger: "Automatic",
    secondReissueDueValue: "2",
    secondReissueDueUnit: "Weeks",
    secondReissuePenaltyValue: "20EUR",
    secondReissuePenaltyUnit: "%",
  },
  reminders: {
    reminder1Value: "2",
    reminder1Unit: "Weeks",
    reminder2Value: "2",
    reminder2Unit: "Weeks",
  },
};

function mergeFinanceInvoiceSettings(raw: unknown): FinanceInvoiceSettings {
  if (!raw || typeof raw !== "object") {
    return defaultFinanceInvoiceSettings;
  }

  const candidate = raw as Partial<FinanceInvoiceSettings>;

  return {
    logoDataUrl: typeof candidate.logoDataUrl === "string" || candidate.logoDataUrl === null
      ? candidate.logoDataUrl
      : defaultFinanceInvoiceSettings.logoDataUrl,
    defaultInvoiceType: candidate.defaultInvoiceType === "company" ? "company" : "individual",
    products: Array.isArray(candidate.products)
      ? candidate.products.filter(Boolean).map((item, index) => {
          const product = item as Partial<FinanceInvoiceProduct>;
          return {
            id: product.id || `product-${index}`,
            name: product.name || "",
            price: product.price || "0EUR",
            vat: product.vat || "0%",
          };
        })
      : defaultFinanceInvoiceSettings.products,
    services: Array.isArray(candidate.services)
      ? candidate.services.filter(Boolean).map((item, index) => {
          const service = item as Partial<FinanceInvoiceService>;
          return {
            id: service.id || `service-${index}`,
            category: service.category || "Other",
            service: service.service || "",
            vat: service.vat || "0%",
          };
        })
      : defaultFinanceInvoiceSettings.services,
    paymentTerms: {
      ...defaultFinanceInvoiceSettings.paymentTerms,
      ...(candidate.paymentTerms ?? {}),
    },
    reminders: {
      ...defaultFinanceInvoiceSettings.reminders,
      ...(candidate.reminders ?? {}),
    },
  };
}

export function readFinanceInvoiceSettings(): FinanceInvoiceSettings {
  if (typeof window === "undefined") {
    return defaultFinanceInvoiceSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultFinanceInvoiceSettings;
    }

    return mergeFinanceInvoiceSettings(JSON.parse(raw));
  } catch {
    return defaultFinanceInvoiceSettings;
  }
}

export function useFinanceInvoiceSettings() {
  const [settings, setSettings] = React.useState<FinanceInvoiceSettings>(defaultFinanceInvoiceSettings);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    setSettings(readFinanceInvoiceSettings());
    setHasLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!hasLoaded || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hasLoaded, settings]);

  return {
    settings,
    setSettings,
  };
}
