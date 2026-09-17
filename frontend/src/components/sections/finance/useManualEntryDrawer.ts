"use client";

import * as React from "react";
import {
  useGetBusinessSetupQuery,
  useGetMollureClientDirectoryQuery,
  useGetProfessionalClientsQuery,
} from "../../../store/services/businessApi";
import { mapApiProfessionalClientToRecord } from "../../../app/professionals/fixed-location/client/mapApiProfessionalClient";
import type {
  ClientRecord,
  MollureDirectoryRow,
} from "../../../app/professionals/fixed-location/client/data/clientList";
import { useFinanceInvoiceSettings } from "./useFinanceInvoiceSettings";
import {
  STEPS,
  buildManualEntryCatalogOptions,
  calculateManualEntryDiscountAmount,
  createManualEntryLineFromOption,
  lineTotal,
  selectionLabel,
  type ManualEntryCatalogOption,
  type ManualEntryClientMode,
  type ManualEntryClientSelection,
  type ManualEntryDiscount,
  type ManualEntryLine,
  type ManualEntryLineKind,
  type ManualEntryPaymentMethod,
  type ManualEntrySavePayload,
} from "./manualEntry.data";
import {
  INPUT_LIMITS,
  parseEmail,
  parseText,
  rejectInvalid,
} from "../../../lib/inputSchema";
import {
  financeProductFromCatalogOption,
  removeFinanceProduct,
  removeFinanceUniqueItem,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "./financeCatalogPersist";

export type ManualEntryStep = (typeof STEPS)[number];

export type ManualEntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSave?: (payload: ManualEntrySavePayload) => void;
};

export function useManualEntryDrawer({
  open,
  onSave,
}: Pick<ManualEntryDrawerProps, "open" | "onSave">) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const [clientOpen, setClientOpen] = React.useState(false);
  const [clientMode, setClientMode] =
    React.useState<ManualEntryClientMode | null>(null);
  const [clientQuery, setClientQuery] = React.useState("");
  const [clientSelection, setClientSelection] =
    React.useState<ManualEntryClientSelection | null>(null);
  const [lines, setLines] = React.useState<ManualEntryLine[]>([]);
  const [discount, setDiscount] = React.useState<ManualEntryDiscount | null>(
    null,
  );
  const [discountModalOpen, setDiscountModalOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<ManualEntryPaymentMethod>("offlineDirect");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [step, setStep] = React.useState(0);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [guestContactError, setGuestContactError] = React.useState(false);

  const { data: businessSetupResponse } = useGetBusinessSetupQuery(
    { includeDraft: false },
    {
      skip: !open,
    },
  );
  const businessSetup = businessSetupResponse?.data ?? null;
  const { data: professionalClientsResponse } = useGetProfessionalClientsQuery(
    undefined,
    { skip: !open },
  );
  const { data: mollureDirectoryResponse } = useGetMollureClientDirectoryQuery(
    { q: clientQuery },
    { skip: !open || clientMode !== "platform" },
  );

  const hasGuestContact = Boolean(guestName.trim() || guestEmail.trim());
  const isGuestClientStepValid =
    clientSelection?.type !== "guest" || hasGuestContact;

  React.useEffect(() => {
    if (!open) return;
    setClientOpen(false);
    setClientMode(null);
    setClientQuery("");
    setClientSelection(null);
    setLines([]);
    setDiscount(null);
    setDiscountModalOpen(false);
    setEditingLine(null);
    setPaymentMethod("offlineDirect");
    setGuestEmail("");
    setGuestName("");
    setStep(0);
    setUniqueItemOpen(false);
    setProductDrawerOpen(false);
    setItemDrawerOpen(false);
    setGuestContactError(false);
  }, [open]);

  const { productOptions, itemOptions, uniqueItemOptions } = React.useMemo(
    () =>
      buildManualEntryCatalogOptions({
        products: settings.products,
        services: settings.services,
        uniqueItems: settings.uniqueItems,
        setupServices: businessSetup?.service_details,
      }),
    [
      businessSetup?.service_details,
      settings.products,
      settings.services,
      settings.uniqueItems,
    ],
  );

  const [itemCatalogOverrides, setItemCatalogOverrides] = React.useState<
    Record<string, ManualEntryCatalogOption>
  >({});

  const resolvedItemOptions = React.useMemo(() => {
    const base = itemOptions.map(
      (option) => itemCatalogOverrides[option.id] ?? option,
    );
    const extras = uniqueItemOptions.filter(
      (option) => !base.some((item) => item.id === option.id),
    );
    return [...base, ...extras];
  }, [itemCatalogOverrides, itemOptions, uniqueItemOptions]);

  const handleAddProductOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setSettings((prev) =>
        upsertFinanceProduct(prev, financeProductFromCatalogOption(option)),
      );
    },
    [setSettings],
  );

  const handleDeleteProductOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setSettings((prev) => removeFinanceProduct(prev, option.id));
    },
    [setSettings],
  );

  const handleAddItemOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setSettings((prev) =>
        upsertFinanceUniqueItem(prev, financeProductFromCatalogOption(option)),
      );
    },
    [setSettings],
  );

  const handleDeleteItemOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setSettings((prev) => removeFinanceUniqueItem(prev, option.id));
    },
    [setSettings],
  );

  const isDeletableItemOption = React.useCallback(
    (option: ManualEntryCatalogOption) =>
      option.id.startsWith("unique-") ||
      (settings.uniqueItems ?? []).some((item) => item.id === option.id),
    [settings.uniqueItems],
  );

  const handleUpdateProductOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setSettings((prev) => ({
        ...prev,
        products: prev.products.map((product) =>
          product.id === option.id
            ? {
                ...product,
                name: option.label,
                price: `${option.unitPrice}EUR`,
                vat: option.vat?.trim() || product.vat,
                unit: option.unit,
                discountType: option.discountType,
                discountAmount: option.discountAmount,
              }
            : product,
        ),
      }));
    },
    [setSettings],
  );

  const handleUpdateItemOption = React.useCallback(
    (option: ManualEntryCatalogOption) => {
      setItemCatalogOverrides((prev) => ({ ...prev, [option.id]: option }));
      setSettings((prev) => {
        const hasService = prev.services.some((s) => s.id === option.id);
        if (!hasService) return prev;
        return {
          ...prev,
          services: prev.services.map((service) =>
            service.id === option.id
              ? {
                  ...service,
                  service: option.label,
                  vat: option.vat?.trim() || service.vat,
                }
              : service,
          ),
        };
      });
    },
    [setSettings],
  );

  const productLines = React.useMemo(
    () => lines.filter((l) => l.kind === "product"),
    [lines],
  );
  const itemLines = React.useMemo(
    () => lines.filter((l) => l.kind === "item"),
    [lines],
  );
  const subtotal = React.useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line), 0),
    [lines],
  );
  const discountAmount = React.useMemo(
    () => calculateManualEntryDiscountAmount(subtotal, discount),
    [discount, subtotal],
  );
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const hasItems = lines.length > 0;

  React.useEffect(() => {
    if (!clientOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node))
        setClientOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [clientOpen]);

  const listResults = React.useMemo(() => {
    if (clientMode !== "list") return [] as ClientRecord[];
    const records = (professionalClientsResponse?.data ?? []).map(
      mapApiProfessionalClientToRecord,
    );
    const q = clientQuery.trim().toLowerCase();
    if (!q) return records.slice(0, 5);
    return records
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clientMode, clientQuery, professionalClientsResponse?.data]);

  const platformResults = React.useMemo(() => {
    if (clientMode !== "platform") return [] as MollureDirectoryRow[];
    return (mollureDirectoryResponse?.data ?? [])
      .filter((row) => row.has_eligible_booking !== false)
      .map(
        (row): MollureDirectoryRow => ({
          id: row.id,
          name: row.name,
          email: row.email,
          hasEligibleBooking: row.has_eligible_booking,
          tags: ["Mollure"],
        }),
      );
  }, [clientMode, mollureDirectoryResponse?.data]);

  const displayClient = selectionLabel(clientSelection) || "Search Client";

  const pickGuest = () => {
    setClientMode("guest");
    setClientSelection({ type: "guest", name: guestName || undefined });
    setClientOpen(false);
  };

  const canNext =
    (step === 0 && Boolean(clientSelection) && isGuestClientStepValid) ||
    (step === 1 && hasItems) ||
    step === 2;

  const handlePrimary = () => {
    if (step === 0 && clientSelection?.type === "guest" && !hasGuestContact) {
      setGuestContactError(true);
      return;
    }
    if (step < 3) {
      if (canNext) setStep((s) => s + 1);
      return;
    }
    if (!clientSelection || !hasItems) return;
    if (clientSelection.type === "guest") {
      const guestParsed = rejectInvalid({
        name: parseText(guestName, {
          required: false,
          label: "Guest name",
          max: INPUT_LIMITS.personName,
        }),
        email: parseEmail(guestEmail, { required: false }),
      });
      if (!guestParsed.ok) {
        setGuestContactError(true);
        return;
      }
      if (!guestParsed.values.name && !guestParsed.values.email) {
        setGuestContactError(true);
        return;
      }
    }
    onSave?.({
      clientSelection:
        clientSelection.type === "guest"
          ? { type: "guest", name: guestName.trim() || clientSelection.name }
          : clientSelection,
      lines,
      totalPrice,
      discount,
      discountAmount,
      paymentMethod,
      guestEmail: clientSelection?.type === "guest" ? guestEmail : undefined,
      guestName: clientSelection?.type === "guest" ? guestName : undefined,
    });
  };

  const pickListClient = (client: (typeof listResults)[number]) => {
    setGuestEmail("");
    setGuestName("");
    setClientSelection({ type: "list", client });
    setClientOpen(false);
  };

  const pickPlatformClient = (client: (typeof platformResults)[number]) => {
    setGuestEmail("");
    setGuestName("");
    setClientSelection({ type: "platform", client });
    setClientOpen(false);
    setClientQuery("");
  };

  const addLinesFromCatalog = (
    kind: ManualEntryLineKind,
    options: Array<ManualEntryCatalogOption & { quantity?: number }>,
  ) => {
    setLines((prev) => [
      ...prev,
      ...options.map((option) =>
        createManualEntryLineFromOption(kind, option, option.quantity ?? 1),
      ),
    ]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (next: ManualEntryLine) => {
    setLines((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  };

  const handleGuestNameChange = (value: string) => {
    setGuestName(value);
    setGuestContactError(false);
    setClientSelection({ type: "guest", name: value });
  };

  const handleGuestEmailChange = (value: string) => {
    setGuestEmail(value);
    setGuestContactError(false);
  };

  const handleUniqueItemSave = (line: ManualEntryLine) => {
    setLines((prev) => [...prev, line]);
    setSettings((prev) =>
      upsertFinanceUniqueItem(
        prev,
        toFinanceCatalogProduct({
          id: line.id,
          name: line.name,
          price: line.unitPrice,
        }),
      ),
    );
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return {
    rootRef,
    step,
    setStep,
    goBack,
    clientOpen,
    setClientOpen,
    clientMode,
    setClientMode,
    clientQuery,
    setClientQuery,
    clientSelection,
    lines,
    discount,
    setDiscount,
    discountModalOpen,
    setDiscountModalOpen,
    editingLine,
    setEditingLine,
    paymentMethod,
    setPaymentMethod,
    guestEmail,
    guestName,
    uniqueItemOpen,
    setUniqueItemOpen,
    productDrawerOpen,
    setProductDrawerOpen,
    itemDrawerOpen,
    setItemDrawerOpen,
    guestContactError,
    productOptions,
    resolvedItemOptions,
    handleAddProductOption,
    handleDeleteProductOption,
    handleAddItemOption,
    handleDeleteItemOption,
    isDeletableItemOption,
    handleUpdateProductOption,
    handleUpdateItemOption,
    productLines,
    itemLines,
    subtotal,
    discountAmount,
    totalPrice,
    hasItems,
    listResults,
    platformResults,
    displayClient,
    pickGuest,
    canNext,
    handlePrimary,
    pickListClient,
    pickPlatformClient,
    addLinesFromCatalog,
    removeLine,
    updateLine,
    handleGuestNameChange,
    handleGuestEmailChange,
    handleUniqueItemSave,
  };
}
