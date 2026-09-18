"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "../../../../../components/common/AppSnackbar";
import {
  useFinanceInvoiceSettings,
  type FinanceInvoiceSettings,
} from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import { useGetProfileQuery } from "../../../../../store/services/profileApi";
import { useProfessionalStripeStatus } from "../useProfessionalStripeStatus";
import { useFinanceTransactionOptions } from "../../../../../components/common/finance-documents/useFinanceTransactionOptions";
import {
  DEFAULT_PRODUCT_DRAFT,
  DEFAULT_SERVICE_DRAFT,
  SERVICE_OPTIONS,
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
    activateSubscription,
    deactivateSubscription,
    markPaymentsConnected,
  } = useProfessionalStripeStatus();

  const handleSubscriptionClick = () => {
    if (subscriptionActive) {
      deactivateSubscription();
      showSnackbar({
        severity: "info",
        message: "Mollure subscription deactivated.",
      });
      return;
    }
    activateSubscription();
    showSnackbar({
      severity: "success",
      message: "Mollure subscription is now active.",
    });
  };

  const handlePaymentsClick = () => {
    if (!subscriptionActive) {
      showSnackbar({
        severity: "warning",
        message:
          "Activate your Mollure subscription before connecting Stripe payments.",
      });
      return;
    }
    if (paymentsConnected) {
      window.open(
        "https://dashboard.stripe.com/",
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    markPaymentsConnected();
    showSnackbar({
      severity: "success",
      message: "Stripe account connected.",
    });
  };

  const showOnboardingBanner = subscriptionActive && !paymentsConnected;
  const showDisconnectedBanner = !subscriptionActive && !paymentsConnected;

  return {
    m,
    hydrated,
    subscriptionActive,
    paymentsConnected,
    showOnboardingBanner,
    showDisconnectedBanner,
    handleSubscriptionClick,
    handlePaymentsClick,
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
  const [addServiceOpen, setAddServiceOpen] = React.useState(false);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(
    null,
  );
  const [addServiceDraft, setAddServiceDraft] =
    React.useState<ServiceDraft>(DEFAULT_SERVICE_DRAFT);

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = React.useState(false);

  const handleDeleteProduct = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
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

  const handleAddProductSaveOrUpdate = () => {
    const name = addProductDraft.productName.trim();
    if (!name) return;
    const vat = addProductDraft.vat.trim() || "0%";
    const priceRaw = addProductDraft.price.trim();
    const price = priceRaw ? `${priceRaw}EUR` : "0EUR";

    if (editingProductId) {
      setSettings((prev) => ({
        ...prev,
        products: prev.products.map((product) =>
          product.id === editingProductId
            ? { ...product, name, price, vat }
            : product,
        ),
      }));
      showSnackbar({
        severity: "success",
        message: "Product updated successfully.",
      });
    } else {
      setSettings((prev) => ({
        ...prev,
        products: [
          { id: `p-${Date.now()}`, name, price, vat },
          ...prev.products,
        ],
      }));
      showSnackbar({
        severity: "success",
        message: "Successfully added product.",
      });
    }

    setAddProductOpen(false);
    setEditingProductId(null);
  };

  const handleAddServiceSaveOrUpdate = () => {
    const service = addServiceDraft.service.trim();
    if (!service) return;
    const vat = addServiceDraft.vat.trim() || "0%";
    const match = SERVICE_OPTIONS.find((s) => s.label === service);
    const category = match?.category ?? "Other";

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
    setAddProductOpen(true);
  };

  const openEditProduct = (id: string) => {
    const p = settings.products.find((x) => x.id === id);
    if (!p) return;
    setEditingProductId(id);
    setAddProductDraft({
      productName: p.name,
      vat: p.vat,
      price: p.price.replace(/EUR$/i, ""),
    });
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
