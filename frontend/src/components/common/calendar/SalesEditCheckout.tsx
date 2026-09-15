"use client";

import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import AppTextField from "../AppTextField";
import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Box,
  IconButton,
  Popover,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import { clientPlatformTagToneColors } from "../ClientPlatformTag";
import ManualEntryCatalogDrawer, {
  ManualEntryCatalogOpenButton,
} from "../../sections/finance/ManualEntryCatalogDrawer";
import ManualEntryDiscountModal from "../../sections/finance/ManualEntryDiscountModal";
import ManualEntryLineCard from "../../sections/finance/ManualEntryLineCard";
import ManualEntryLineEditModal from "../../sections/finance/ManualEntryLineEditModal";
import ManualEntryUniqueItemModal from "../../sections/finance/ManualEntryUniqueItemModal";
import {
  buildManualEntryCatalogOptions,
  calculateManualEntryDiscountAmount,
  createManualEntryLineFromOption,
  formatEurAmount,
  formatManualEntryDiscountLabel,
  lineTotal,
  type ManualEntryCatalogOption,
  type ManualEntryDiscount,
  type ManualEntryLine,
  type ManualEntryLineKind,
} from "../../sections/finance/manualEntry.data";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import {
  financeProductFromCatalogOption,
  removeFinanceProduct,
  removeFinanceUniqueItem,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "../../sections/finance/financeCatalogPersist";
import { AppCalendarPanel } from "../AppDatePicker";
import { tomorrowIso } from "./calendar.utils";
import type {
  SalesCheckoutPaymentMethod,
  SalesClientKind,
  SalesEditCheckoutPayload,
  SalesOverviewCardData,
} from "./salesOverview.types";

type Step = "items" | "payment" | "summary";

type PersonChip = {
  id: string;
  label: string;
  name: string;
  role: "main_client" | "guest" | "model";
};

type SalesEditCheckoutProps = {
  card: SalesOverviewCardData;
  clientKind?: SalesClientKind;
  onCancel: () => void;
  onSave: (payload: SalesEditCheckoutPayload) => void;
};

function linesFromCard(card: SalesOverviewCardData): ManualEntryLine[] {
  const source = card.highlightedLineIds?.length
    ? card.lines.filter(
        (line) =>
          card.highlightedLineIds!.includes(line.id) && line.amount >= 0,
      )
    : card.lines.filter((line) => line.amount >= 0);

  return source.map((line) => ({
    id: line.id,
    kind: "item" as const,
    name: line.label,
    quantity: 1,
    unitPrice: line.amount,
  }));
}

function collectPeople(card: SalesOverviewCardData): PersonChip[] {
  const people: PersonChip[] = [
    {
      id: card.payerKey || "main",
      label: card.clientKind === "company" ? "BC Client" : "IC Client",
      name: card.clientName,
      role: "main_client",
    },
  ];
  for (const sub of card.subCards ?? []) {
    people.push({
      id: sub.id,
      label: sub.payerLabel,
      name: sub.payerName,
      role: sub.payerRole,
    });
  }
  return people;
}

export default function SalesEditCheckout({
  card,
  clientKind,
  onCancel,
  onSave,
}: SalesEditCheckoutProps) {
  const m = useTheme().palette.mollure;
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const businessSetup = businessSetupResponse?.data ?? null;

  const [step, setStep] = React.useState<Step>("items");
  const [lines, setLines] = React.useState<ManualEntryLine[]>(() =>
    linesFromCard(card),
  );
  const [discount, setDiscount] = React.useState<ManualEntryDiscount | null>(
    null,
  );
  const [discountModalOpen, setDiscountModalOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<SalesCheckoutPaymentMethod>(
      card.paymentMethod || "onlineDirect",
    );
  const [checkoutEmail, setCheckoutEmail] = React.useState(
    () => card.clientEmail?.trim() || "",
  );
  const [dueDate, setDueDate] = React.useState(card.dueDate || tomorrowIso());
  const [dueDateAnchor, setDueDateAnchor] = React.useState<null | HTMLElement>(
    null,
  );
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);

  const people = React.useMemo(() => collectPeople(card), [card]);
  const kindBadge =
    clientKind === "company" || card.clientKind === "company"
      ? "BC Client"
      : "IC Client";

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
    () => lines.filter((l) => l.kind !== "product"),
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
  const needsDueDate =
    paymentMethod === "onlineNonDirect" || paymentMethod === "offlineNonDirect";
  const needsOnlineEmail =
    paymentMethod === "onlineDirect" || paymentMethod === "onlineNonDirect";

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
      if (needsDueDate && !dueDate) return;
      if (needsOnlineEmail && !checkoutEmail.trim()) return;
      setStep("summary");
      return;
    }
    onSave({
      lines,
      discount,
      discountAmount,
      totalPrice,
      paymentMethod,
      dueDate: needsDueDate ? dueDate : null,
      clientEmail: checkoutEmail.trim() || null,
    });
  };

  const paymentOptions: Array<{
    id: SalesCheckoutPaymentMethod;
    label: string;
  }> = [
    { id: "onlineDirect", label: "Online Direct" },
    { id: "offlineDirect", label: "Offline Direct" },
    { id: "onlineNonDirect", label: "Online Non-Direct" },
    { id: "offlineNonDirect", label: "Offline Non-Direct" },
  ];

  const paymentLabel =
    paymentOptions.find((o) => o.id === paymentMethod)?.label ||
    "Online Direct";

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
        <Typography sx={mollureSectionTitleSx(m.navy)}>
          Checkout
        </Typography>
      </Stack>

      {step === "items" ? (
        <Stack spacing={2}>
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Client
            </Typography>
            <Box
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                bgcolor: "#fff",
                px: 1.5,
                py: 1.25,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mb: 0.25 }}
              >
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  {card.clientName}
                </Typography>
                <Box
                  sx={{
                    px: 0.7,
                    py: 0.15,
                    borderRadius: "999px",
                    ...clientPlatformTagToneColors(m, "teal"),
                  }}
                >
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
                    {kindBadge}
                  </Typography>
                </Box>
              </Stack>
          {checkoutEmail.trim() || card.clientEmail ? (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 650,
                color: alpha(m.navy, 0.5),
              }}
            >
              {checkoutEmail.trim() || card.clientEmail}
            </Typography>
          ) : null}
            </Box>

            {people.filter((p) => p.role !== "main_client").length ? (
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {people
                  .filter((p) => p.role !== "main_client")
                  .map((person) => (
                    <Box
                      key={person.id}
                      sx={{
                        borderRadius: "10px",
                        border: `1px dashed ${alpha(m.navy, 0.2)}`,
                        px: 1.25,
                        py: 0.9,
                      }}
                    >
                      <Typography
                        sx={{
                          ...mollureLabelSx(m.navy),
                        }}
                      >
                        {person.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 650,
                          color: alpha(m.navy, 0.5),
                        }}
                      >
                        {person.name}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            ) : null}
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
              Items
            </Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.45),
                mb: 0.6,
              }}
            >
              Service
            </Typography>
            <Stack spacing={0.75} sx={{ mb: 1.25 }}>
              {itemLines.map((line) => (
                <ManualEntryLineCard
                  key={line.id}
                  line={line}
                  onEdit={() => setEditingLine(line)}
                  onDelete={() => removeLine(line.id)}
                />
              ))}
              <ManualEntryCatalogOpenButton
                label="Service"
                onClick={() => setItemDrawerOpen(true)}
              />
            </Stack>

            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.45),
                mb: 0.6,
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
              <AppButton
                variant="outlined"
                onClick={() => setUniqueItemOpen(true)}
                sx={mollureLabelSx(m.navy, { borderRadius: "10px", textTransform: "none", borderColor: alpha(m.teal, 0.35), color: m.teal })}
              >
                + Unique Item
              </AppButton>
            </Stack>
          </Box>

          {hasItems ? (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={mollureSectionTitleSx(m.navy, { color: m.headingText })}>
                  Total Price:
                </Typography>
                <Typography sx={mollurePageTitleSx(m.navy, { color: m.headingText })}>
                  {formatEurAmount(totalPrice)} EUR
                </Typography>
              </Stack>
              {discount && discount.amount > 0 ? (
                <Typography
                  sx={{
                    ...mollureBodyMutedSx(m.navy),
                  }}
                >
                  Discount ({formatManualEntryDiscountLabel(discount)}): -
                  {formatEurAmount(discountAmount)}
                </Typography>
              ) : null}
              <AppButton
                variant="text"
                onClick={() => setDiscountModalOpen(true)}
                sx={mollureLabelSx(m.navy, { alignSelf: "flex-start", p: 0, minWidth: 0, textTransform: "none", color: m.teal })}
              >
                {discount && discount.amount > 0
                  ? "Edit Discount"
                  : "+ Discount"}
              </AppButton>
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
            Checkout
          </Typography>
          <Stack spacing={1}>
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.id;
              const showCalendarIcon =
                option.id === "onlineNonDirect" ||
                option.id === "offlineNonDirect";
              const dueLabel =
                dueDate && selected
                  ? dueDate.split("-").reverse().join("/")
                  : null;
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
                    minHeight: 52,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{ width: "100%", minWidth: 0 }}
                  >
                    <StorefrontOutlinedIcon
                      sx={{
                        fontSize: 20,
                        color: alpha(m.navy, 0.45),
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.25,
                        }}
                      >
                        {option.label}
                      </Typography>
                      {showCalendarIcon && dueLabel ? (
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 650,
                            color: alpha(m.navy, 0.48),
                            mt: 0.15,
                          }}
                        >
                          Due {dueLabel}
                        </Typography>
                      ) : null}
                    </Box>
                    {showCalendarIcon ? (
                      <IconButton
                        size="small"
                        aria-label="Pick due date"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentMethod(option.id);
                          setDueDateAnchor(e.currentTarget);
                        }}
                        sx={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          color: selected ? m.teal : alpha(m.navy, 0.45),
                          border: `1px solid ${
                            selected ? alpha(m.teal, 0.35) : alpha(m.navy, 0.12)
                          }`,
                          borderRadius: "8px",
                          bgcolor: "#fff",
                        }}
                      >
                        <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ) : null}
                    <Radio
                      checked={selected}
                      value={option.id}
                      sx={{
                        flexShrink: 0,
                        p: 0.5,
                        color: alpha(m.navy, 0.3),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {needsOnlineEmail ? (
            <Box sx={{ mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
              {checkoutEmail.trim() && card.clientEmail?.trim() ? (
                <Typography
                  sx={mollureBodyMutedSx(m.navy, { fontWeight: 650 })}
                >
                  Email: {checkoutEmail.trim()}
                </Typography>
              ) : (
                <AppTextField
                  label="Email"
                  placeholder="Email for online payment"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  fullWidth
                  helperText={
                    !checkoutEmail.trim()
                      ? "Required for online payment"
                      : undefined
                  }
                  error={!checkoutEmail.trim()}
                />
              )}
            </Box>
          ) : null}

          <Popover
            open={Boolean(dueDateAnchor)}
            anchorEl={dueDateAnchor}
            onClose={() => setDueDateAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              elevation: 0,
              sx: {
                mt: 0.75,
                borderRadius: "14px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                boxShadow: "0 16px 40px rgba(16, 35, 63, 0.13)",
                overflow: "hidden",
                bgcolor: "#fff",
              },
            }}
          >
            <AppCalendarPanel
              value={dueDate}
              min={tomorrowIso()}
              onChange={(iso) => {
                setDueDate(iso);
              }}
              onDaySelect={() => setDueDateAnchor(null)}
            />
          </Popover>
        </Box>
      ) : null}

      {step === "summary" ? (
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.5,
          }}
        >
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography
              sx={mollureSectionTitleSx(m.navy)}
            >
              {needsDueDate
                ? "Reissued Invoice Summary"
                : "After treatment Summary"}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.3,
                borderRadius: "999px",
                bgcolor: alpha("#F79009", 0.16),
              }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 800, color: "#B54708" }}
              >
                {needsDueDate ? "Payment Due" : "Pending"}
              </Typography>
            </Box>
          </Stack>
          <Typography
            sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}
          >
            {card.clientName}
          </Typography>
          {checkoutEmail.trim() || card.clientEmail ? (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 650,
                color: alpha(m.navy, 0.5),
                mb: 1.25,
              }}
            >
              {checkoutEmail.trim() || card.clientEmail}
            </Typography>
          ) : (
            <Box sx={{ mb: 1.25 }} />
          )}
          <Stack spacing={0.75} sx={{ mb: 1.25 }}>
            {lines.map((line) => (
              <Stack
                key={line.id}
                direction="row"
                justifyContent="space-between"
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
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                  €{lineTotal(line).toFixed(2)}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.75 }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
              Total
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              €{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
              Payment
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              €{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Typography
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: 12,
              fontWeight: 650,
              color: alpha(m.navy, 0.5),
            }}
          >
            {needsDueDate ? (
              <CalendarMonthRoundedIcon
                sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }}
              />
            ) : null}
            {needsDueDate
              ? `${paymentLabel} (Due date ${dueDate.split("-").reverse().join("/")})`
              : paymentLabel}
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
          disabled={
            (step === "items" && !hasItems) ||
            (step === "payment" && needsDueDate && !dueDate)
          }
          onClick={handleNext}
          sx={{
            px: 2.5,
          }}
        >
          Next
        </AppButton>
      </Stack>

      <ManualEntryDiscountModal
        open={discountModalOpen}
        initialValue={discount}
        onClose={() => setDiscountModalOpen(false)}
        onApply={setDiscount}
      />
      <ManualEntryLineEditModal
        open={Boolean(editingLine)}
        line={editingLine}
        onClose={() => setEditingLine(null)}
        onSave={(next) => {
          updateLine(next);
          setEditingLine(null);
        }}
      />
      <ManualEntryCatalogDrawer
        open={productDrawerOpen}
        title="Add product"
        options={productOptions}
        withQuantity
        allowAddProduct
        addScreenTitle="Add Product"
        editScreenTitle="Edit Product"
        onUpdateOption={handleUpdateProductOption}
        onAddOption={handleAddProductOption}
        onDeleteOption={handleDeleteProductOption}
        onClose={() => setProductDrawerOpen(false)}
        onSave={(selected) => {
          addLinesFromCatalog("product", selected);
          setProductDrawerOpen(false);
        }}
      />
      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        title="Add service"
        options={resolvedItemOptions}
        withQuantity
        allowAddProduct
        addProductLabel="Add Item"
        addScreenTitle="Add Service"
        editScreenTitle="Edit Item"
        onUpdateOption={handleUpdateItemOption}
        onAddOption={handleAddItemOption}
        onDeleteOption={handleDeleteItemOption}
        isDeletable={isDeletableItemOption}
        onClose={() => setItemDrawerOpen(false)}
        onSave={(selected) => {
          addLinesFromCatalog("item", selected);
          setItemDrawerOpen(false);
        }}
      />
      <ManualEntryUniqueItemModal
        open={uniqueItemOpen}
        onClose={() => setUniqueItemOpen(false)}
        onSave={(line) => {
          setLines((prev) => [...prev, line]);
          setUniqueItemOpen(false);
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
        }}
      />
    </Box>
  );
}
