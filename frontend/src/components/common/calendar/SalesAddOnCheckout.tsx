"use client";

import AppButton from "../AppButton";
import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import { Box, IconButton, Radio, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import ManualEntryCatalogDrawer, {
  ManualEntryCatalogOpenButton,
} from "../../sections/finance/ManualEntryCatalogDrawer";
import ManualEntryDiscountModal from "../../sections/finance/ManualEntryDiscountModal";
import ManualEntryLineCard from "../../sections/finance/ManualEntryLineCard";
import ManualEntryLineEditModal from "../../sections/finance/ManualEntryLineEditModal";
import ManualEntryUniqueItemModal from "../../sections/finance/ManualEntryUniqueItemModal";
import {
  calculateManualEntryDiscountAmount,
  createManualEntryLineFromOption,
  formatEurAmount,
  formatManualEntryDiscountLabel,
  lineTotal,
  parseFinancePrice,
  type ManualEntryCatalogOption,
  type ManualEntryDiscount,
  type ManualEntryLine,
  type ManualEntryLineKind,
  type ManualEntryPaymentMethod,
} from "../../sections/finance/manualEntry.data";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import MollureFormField from "../MollureFormField";
import type { SalesAddOnCheckoutPayload } from "./salesOverview.types";

type Step = "items" | "payment" | "summary";

type SalesAddOnCheckoutProps = {
  clientName: string;
  clientEmail?: string;
  onCancel: () => void;
  onSave: (payload: SalesAddOnCheckoutPayload) => void;
};

export default function SalesAddOnCheckout({
  clientName,
  clientEmail,
  onCancel,
  onSave,
}: SalesAddOnCheckoutProps) {
  const m = useTheme().palette.mollure;
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const businessSetup = businessSetupResponse?.data ?? null;

  const [step, setStep] = React.useState<Step>("items");
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
  const [guestEmail, setGuestEmail] = React.useState(clientEmail ?? "");
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);

  const productOptions = React.useMemo<ManualEntryCatalogOption[]>(
    () =>
      settings.products.map((product) => ({
        id: product.id,
        label: product.name,
        unitPrice: parseFinancePrice(product.price),
        vat: product.vat,
      })),
    [settings.products],
  );

  const itemOptions = React.useMemo<ManualEntryCatalogOption[]>(() => {
    const setupServices = businessSetup?.service_details ?? [];
    if (setupServices.length > 0) {
      return setupServices.map((service) => ({
        id: service.id,
        label: service.service_title || service.category_title || "Service",
        unitPrice: parseFinancePrice(String(service.price ?? "")),
      }));
    }
    return settings.services.map((service) => ({
      id: service.id,
      label: service.service
        ? `${service.category} - ${service.service}`
        : service.category,
      unitPrice: 0,
      vat: service.vat,
    }));
  }, [businessSetup?.service_details, settings.services]);

  const [itemCatalogOverrides, setItemCatalogOverrides] = React.useState<
    Record<string, ManualEntryCatalogOption>
  >({});

  const resolvedItemOptions = React.useMemo(
    () =>
      itemOptions.map((option) => itemCatalogOverrides[option.id] ?? option),
    [itemCatalogOverrides, itemOptions],
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

  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (next: ManualEntryLine) =>
    setLines((prev) => prev.map((l) => (l.id === next.id ? next : l)));

  const handleBack = () => {
    if (step === "items") {
      onCancel();
      return;
    }
    if (step === "payment") setStep("items");
    else setStep("payment");
  };

  const handleNext = () => {
    if (step === "items") {
      if (!hasItems) return;
      setStep("payment");
      return;
    }
    if (step === "payment") {
      setStep("summary");
      return;
    }
    onSave({
      lines,
      discount,
      discountAmount,
      totalPrice,
      paymentMethod,
    });
  };

  const paymentLabel =
    paymentMethod === "onlineDirect" ? "Online Direct" : "Offline Direct";

  return (
    <Box sx={{ pt: 0.5 }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
        <IconButton
          size="small"
          onClick={handleBack}
          aria-label="Back"
          sx={{ color: alpha(m.navy, 0.7), width: 32, height: 32 }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography
          sx={{ fontSize: 16, fontWeight: 900, color: alpha(m.navy, 0.88) }}
        >
          Checkout
        </Typography>
      </Stack>

      {step === "items" ? (
        <Stack spacing={2}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}
          >
            Add services or items
          </Typography>

          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Product
            </Typography>
            <Stack spacing={0.75}>
              {productLines.map((line) => (
                <ManualEntryLineCard
                  key={line.id}
                  line={line}
                  onEdit={() => setEditingLine(line)}
                  onDelete={() => removeLine(line.id)}
                />
              ))}
              <ManualEntryCatalogOpenButton
                label="Product"
                onClick={() => setProductDrawerOpen(true)}
              />
            </Stack>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Service / Item
            </Typography>
            <Stack spacing={0.75}>
              {itemLines.map((line) => (
                <ManualEntryLineCard
                  key={line.id}
                  line={line}
                  onEdit={() => setEditingLine(line)}
                  onDelete={() => removeLine(line.id)}
                />
              ))}
              <ManualEntryCatalogOpenButton
                label="Item"
                onClick={() => setItemDrawerOpen(true)}
              />
              <AppButton
                tone="secondary"
                onClick={() => setUniqueItemOpen(true)}
                sx={{
                  fontSize: 12.5,
                  color: m.teal,
                }}
              >
                + Unique item
              </AppButton>
            </Stack>
          </Box>

          {hasItems ? (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                  }}
                >
                  Subtotal
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {formatEurAmount(subtotal)}
                </Typography>
              </Stack>

              {discount && discount.amount > 0 ? (
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    Discount ({formatManualEntryDiscountLabel(discount)})
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.78),
                    }}
                  >
                    -{formatEurAmount(discountAmount)}
                  </Typography>
                </Stack>
              ) : null}

              <AppButton
                variant="text"
                onClick={() => setDiscountModalOpen(true)}
                sx={{
                  alignSelf: "flex-start",
                  p: 0,
                  minWidth: 0,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 12.5,
                  color: m.teal,
                  textDecoration: "underline",
                  "&:hover": {
                    bgcolor: "transparent",
                    textDecoration: "underline",
                  },
                }}
              >
                {discount && discount.amount > 0
                  ? "Edit Discount"
                  : "+ Discount"}
              </AppButton>

              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ pt: 0.25 }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                  }}
                >
                  Final Price
                </Typography>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.88),
                  }}
                >
                  {formatEurAmount(totalPrice)}
                </Typography>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {step === "payment" ? (
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color: alpha(m.navy, 0.86),
              mb: 1.25,
            }}
          >
            Payment Method
          </Typography>
          <Stack spacing={1}>
            {(
              [
                { id: "onlineDirect", label: "Online Direct", showEmail: true },
                {
                  id: "offlineDirect",
                  label: "Offline Direct",
                  showEmail: false,
                },
              ] as const
            ).map((option) => {
              const selected = paymentMethod === option.id;
              return (
                <Box
                  key={option.id}
                  onClick={() => setPaymentMethod(option.id)}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${selected ? m.teal : alpha(m.navy, 0.1)}`,
                    bgcolor: selected ? alpha(m.navy, 0.03) : "#fff",
                    px: 1.5,
                    py: 1.25,
                    cursor: "pointer",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <CreditCardRoundedIcon
                      sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        {option.label}
                      </Typography>
                      {option.showEmail && selected ? (
                        <Box
                          sx={{ mt: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MollureFormField
                            label="Guest email"
                            placeholder="Email for Guest"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </Box>
                      ) : null}
                    </Box>
                    <Radio
                      checked={selected}
                      value={option.id}
                      sx={{
                        color: alpha(m.navy, 0.3),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : null}

      {step === "summary" ? (
        <Box
          sx={{
            borderRadius: "12px",
            bgcolor: alpha(m.navy, 0.03),
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            px: 1.75,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 900,
              color: alpha(m.navy, 0.86),
              mb: 1.25,
            }}
          >
            Summary
          </Typography>
          <Typography
            sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}
          >
            {clientName}
          </Typography>
          {guestEmail || clientEmail ? (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 650,
                color: alpha(m.navy, 0.5),
                mb: 1.5,
              }}
            >
              {guestEmail || clientEmail}
            </Typography>
          ) : (
            <Box sx={{ mb: 1.5 }} />
          )}

          <Stack spacing={0.85} sx={{ mb: 1.5 }}>
            {lines.map((line) => (
              <Stack
                key={line.id}
                direction="row"
                justifyContent="space-between"
                spacing={1.5}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  {line.quantity > 1
                    ? `${line.name} ×${line.quantity}`
                    : line.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  €{lineTotal(line).toFixed(2)}
                </Typography>
              </Stack>
            ))}
            {discountAmount > 0 ? (
              <Stack
                direction="row"
                justifyContent="space-between"
                spacing={1.5}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  Discount
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  -€{discountAmount.toFixed(2)}
                </Typography>
              </Stack>
            ) : null}
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 1 }}
          >
            <Typography
              sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}
            >
              Total Price
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              €{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Typography
            sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.48) }}
          >
            {paymentLabel}
          </Typography>
        </Box>
      ) : null}

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        sx={{ mt: 2.5 }}
      >
        <AppButton tone="secondary" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton
          tone="primary"
          disabled={step === "items" && !hasItems}
          onClick={handleNext}
          sx={{
            px: 2.5,
          }}
        >
          Next
        </AppButton>
      </Stack>

      <ManualEntryCatalogDrawer
        open={productDrawerOpen}
        onClose={() => setProductDrawerOpen(false)}
        title="Select products"
        options={productOptions}
        emptyLabel="No products configured yet."
        withQuantity
        allowAddProduct
        addScreenTitle="Add Product"
        editScreenTitle="Edit Product"
        onUpdateOption={handleUpdateProductOption}
        onSave={(selected) => addLinesFromCatalog("product", selected)}
      />
      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        onClose={() => setItemDrawerOpen(false)}
        title="Select items"
        options={resolvedItemOptions}
        emptyLabel="No services configured yet."
        withQuantity
        allowAddProduct
        addProductLabel="Add Item"
        addScreenTitle="Add Unique Item"
        editScreenTitle="Edit Item"
        onUpdateOption={handleUpdateItemOption}
        onSave={(selected) => addLinesFromCatalog("item", selected)}
      />
      <ManualEntryUniqueItemModal
        open={uniqueItemOpen}
        onClose={() => setUniqueItemOpen(false)}
        onSave={(line) => setLines((prev) => [...prev, line])}
      />
      <ManualEntryLineEditModal
        open={Boolean(editingLine)}
        line={editingLine}
        onClose={() => setEditingLine(null)}
        onSave={updateLine}
      />
      <ManualEntryDiscountModal
        open={discountModalOpen}
        initialValue={discount}
        onClose={() => setDiscountModalOpen(false)}
        onApply={setDiscount}
      />
    </Box>
  );
}
