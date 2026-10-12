"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "../../../../../components/common/AppSnackbar";
import {
  useFinanceInvoiceSettings,
  type FinanceInvoiceSettings,
} from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import {
  removeFinanceProduct,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
} from "../../../../../components/sections/finance/financeCatalogPersist";
import { useGetProfileQuery } from "../../../../../store/services/profileApi";
import { useProfessionalStripeStatus } from "../useProfessionalStripeStatus";
import { useFinanceTransactionOptions } from "../../../../../components/common/finance-documents/useFinanceTransactionOptions";
import {
  buildCatalogProductFromUniqueItemDraft,
  buildUniqueItemDraftFromProduct,
  getUniqueItemDraftErrors,
} from "../../../../../data/bookingUniqueItem.data";
import {
  DEFAULT_PRODUCT_DRAFT,
  DEFAULT_SERVICE_DRAFT,
} from "./setting.data";
import type {
  ProductDraft,
  ServiceDraft,
  SettingsTab,
} from "./setting.types";
import { PROFILE_IMAGE_INVALID_MESSAGE } from "../../../../../lib/profileImageUpload";

export function useFinanceSettingPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [tab, setTab] = React.useState<SettingsTab>("stripe");

  return {
    theme,
    m,
    tab,
    setTab,
  };
}

export function useStripeSettingsSection() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const {
    hydrated,
    subscriptionActive,
    paymentsConnected,
    connectStatus,
    autoPay,
    subscriptionRenewsAt,
    activateSubscription,
    deactivateSubscription,
    setAutoPay,
    confirmManualPayment,
    markPaymentsConnected,
    isUpdating,
  } = useProfessionalStripeStatus();

  const handleSubscriptionClick = async () => {
    try {
      if (subscriptionActive) {
        const result = await deactivateSubscription();
        showSnackbar({
          severity: "error",
          message: result?.message ?? "Mollure subscription deactivated.",
        });
        return;
      }
      const result = await activateSubscription();
      showSnackbar({
        severity: "success",
        message:
          result?.message ??
          "Mollure subscription activated — new billing period started.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message:
          "Could not activate subscription. Check your card or try again.",
      });
    }
  };

  const handleAutoPayToggle = async () => {
    try {
      const next = !autoPay;
      await setAutoPay(next);
      showSnackbar({
        severity: "success",
        message: next
          ? "Auto-pay on — card will be charged on your renewal date."
          : "Auto-pay off — pay manually before the renewal date or your subscription deactivates.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not update auto-pay. Please try again.",
      });
    }
  };

  const handleManualPaymentClick = async () => {
    try {
      await confirmManualPayment();
      showSnackbar({
        severity: "success",
        message: "Payment recorded. Renewal date extended one month.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message:
          "Manual payment failed. Activate your subscription first, then pay before the renewal date.",
      });
    }
  };

  const handlePaymentsClick = async () => {
    if (!subscriptionActive) {
      showSnackbar({
        severity: "warning",
        message:
          "Activate your Mollure subscription before connecting Stripe payments.",
      });
      return;
    }
    // Already connected → dashboard only; never restart onboarding.
    if (paymentsConnected) {
      window.open(
        "https://dashboard.stripe.com/",
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    try {
      const result = await markPaymentsConnected();
      if (result.redirected) return;
      if ("alreadyConnected" in result && result.alreadyConnected) {
        showSnackbar({
          severity: "success",
          message: "Stripe account already connected.",
        });
        return;
      }
      const next = result.stripeConnectStatus ?? connectStatus;
      showSnackbar({
        severity: next === "connected" ? "success" : "info",
        message:
          next === "connected"
            ? "Stripe account connected."
            : "Stripe onboarding started. Complete the steps to accept online payments.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not start Stripe onboarding. Please try again.",
      });
    }
  };

  // Banners derive from persisted GET /settings fields only. Never when connected.
  const showOnboardingBanner =
    connectStatus !== "connected" &&
    (connectStatus === "onboarding" ||
      (subscriptionActive && connectStatus === "not_connected"));
  const showDisconnectedBanner =
    !subscriptionActive && connectStatus === "not_connected";

  return {
    m,
    hydrated,
    subscriptionActive,
    paymentsConnected,
    connectStatus,
    autoPay,
    subscriptionRenewsAt,
    showOnboardingBanner,
    showDisconnectedBanner,
    handleSubscriptionClick,
    handleAutoPayToggle,
    handleManualPaymentClick,
    handlePaymentsClick,
    isUpdating,
  };
}

export function useTransactionOptionsSettingsSection() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { options, setOptions, hydrated } = useFinanceTransactionOptions();

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(options);

  React.useEffect(() => {
    if (hydrated) setDraft(options);
  }, [hydrated, options]);

  const handleEditToggle = () => {
    if (editing) {
      setOptions(draft);
      showSnackbar({
        severity: "success",
        message: "Transaction options saved.",
      });
    }
    setEditing((v) => !v);
  };

  return {
    m,
    editing,
    draft,
    setDraft,
    handleEditToggle,
  };
}

export function useInvoiceSettingsSection() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const { options: txOptions } = useFinanceTransactionOptions();
  const { data: profileResponse } = useGetProfileQuery();
  const showDueDateSettings =
    txOptions.onlineInvoiceDueDate || txOptions.offlineInvoiceDueDate;
  const [paymentsEditing, setPaymentsEditing] = React.useState(false);
  const [addProductOpen, setAddProductOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null,
  );
  const [addProductDraft, setAddProductDraft] =
    React.useState<ProductDraft>(DEFAULT_PRODUCT_DRAFT);
  const [addProductAttempted, setAddProductAttempted] = React.useState(false);
  const [addServiceOpen, setAddServiceOpen] = React.useState(false);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(
    null,
  );
  const [addServiceDraft, setAddServiceDraft] =
    React.useState<ServiceDraft>(DEFAULT_SERVICE_DRAFT);

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = React.useState(false);

  const handleDeleteProduct = (id: string) => {
    setSettings((prev) => removeFinanceProduct(prev, id));
    showSnackbar({
      severity: "error",
      message: "Product deleted successfully.",
    });
  };

  const handleDeleteService = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id),
    }));
    showSnackbar({
      severity: "error",
      message: "Service deleted successfully.",
    });
  };

  const addProductErrors = addProductAttempted
    ? getUniqueItemDraftErrors(addProductDraft)
    : {};

  const handleAddProductSaveOrUpdate = () => {
    setAddProductAttempted(true);
    const catalog = buildCatalogProductFromUniqueItemDraft(
      addProductDraft,
      editingProductId ?? `p-${Date.now()}`,
    );
    if (!catalog) return;

    // Same upsert path as calendar drawer catalog (`PUT /api/finance/settings/invoice`).
    setSettings((prev) =>
      upsertFinanceProduct(prev, toFinanceCatalogProduct(catalog)),
    );
    showSnackbar({
      severity: "success",
      message: editingProductId
        ? "Product updated successfully."
        : "Successfully added product.",
    });

    setAddProductOpen(false);
    setEditingProductId(null);
    setAddProductAttempted(false);
  };

  const handleAddServiceSaveOrUpdate = () => {
    const service = addServiceDraft.service.trim();
    if (!service) return;
    const vat = addServiceDraft.vat.trim() || "0%";
    const category = settings.services.find((item) => item.service === service)?.category ?? "Other";

    if (editingServiceId) {
      setSettings((prev) => ({
        ...prev,
        services: prev.services.map((item) =>
          item.id === editingServiceId
            ? { ...item, category, service, vat }
            : item,
        ),
      }));
      showSnackbar({
        severity: "success",
        message: "Service updated successfully.",
      });
    } else {
      setSettings((prev) => ({
        ...prev,
        services: [
          { id: `s-${Date.now()}`, category, service, vat },
          ...prev.services,
        ],
      }));
      showSnackbar({
        severity: "success",
        message: "Successfully added service.",
      });
    }

    setAddServiceOpen(false);
    setEditingServiceId(null);
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    setAddProductDraft({ ...DEFAULT_PRODUCT_DRAFT });
    setAddProductAttempted(false);
    setAddProductOpen(true);
  };

  const openEditProduct = (id: string) => {
    const p = settings.products.find((x) => x.id === id);
    if (!p) return;
    setEditingProductId(id);
    setAddProductDraft(
      buildUniqueItemDraftFromProduct({
        name: p.name,
        price: p.price,
        vat: p.vat,
        unit: p.unit,
        discountType: p.discountType,
        discountAmount:
          p.discountAmount == null ? undefined : String(p.discountAmount),
      }),
    );
    setAddProductAttempted(false);
    setAddProductOpen(true);
  };

  const openAddService = () => {
    setEditingServiceId(null);
    setAddServiceDraft({ ...DEFAULT_SERVICE_DRAFT });
    setAddServiceOpen(true);
  };

  const openEditService = (id: string) => {
    const s = settings.services.find((x) => x.id === id);
    if (!s) return;
    setEditingServiceId(id);
    setAddServiceDraft({ service: s.service, vat: s.vat });
    setAddServiceOpen(true);
  };

  const updatePaymentTerm = React.useCallback(
    (key: keyof FinanceInvoiceSettings["paymentTerms"], value: string) => {
      setSettings((prev) => ({
        ...prev,
        paymentTerms: {
          ...prev.paymentTerms,
          [key]: value,
        },
      }));
    },
    [setSettings],
  );

  const updateReminder = React.useCallback(
    (key: keyof FinanceInvoiceSettings["reminders"], value: string) => {
      setSettings((prev) => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          [key]: value,
        },
      }));
    },
    [setSettings],
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    if (
      type === "image/heic" ||
      type === "image/heif" ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    ) {
      showSnackbar({
        severity: "error",
        message: PROFILE_IMAGE_INVALID_MESSAGE,
      });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      setSettings((prev) => ({ ...prev, logoDataUrl: url }));
      showSnackbar({
        severity: "success",
        message: "Logo uploaded successfully.",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const selectIndividualInvoice = () => {
    setSettings((prev) => ({
      ...prev,
      defaultInvoiceType: "individual",
    }));
    setInvoiceDrawerOpen(true);
  };

  const selectCompanyInvoice = () => {
    setSettings((prev) => ({
      ...prev,
      defaultInvoiceType: "company",
    }));
    setInvoiceDrawerOpen(true);
  };

  return {
    m,
    settings,
    profileResponse,
    showDueDateSettings,
    paymentsEditing,
    setPaymentsEditing,
    addProductOpen,
    setAddProductOpen,
    editingProductId,
    setEditingProductId,
    addProductDraft,
    setAddProductDraft,
    addProductErrors,
    addServiceOpen,
    setAddServiceOpen,
    editingServiceId,
    setEditingServiceId,
    addServiceDraft,
    setAddServiceDraft,
    logoInputRef,
    invoiceDrawerOpen,
    setInvoiceDrawerOpen,
    handleDeleteProduct,
    handleDeleteService,
    handleAddProductSaveOrUpdate,
    handleAddServiceSaveOrUpdate,
    openAddProduct,
    openEditProduct,
    openAddService,
    openEditService,
    updatePaymentTerm,
    updateReminder,
    handleLogoChange,
    selectIndividualInvoice,
    selectCompanyInvoice,
  };
}
