"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Box,
  Button,
  IconButton,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
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
} from "../../sections/finance/manualEntry.data";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import AppDatePicker from "../AppDatePicker";
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

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function linesFromCard(card: SalesOverviewCardData): ManualEntryLine[] {
  const source =
    card.highlightedLineIds?.length
      ? card.lines.filter((line) => card.highlightedLineIds!.includes(line.id) && line.amount >= 0)
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
      label: card.clientKind === "company" ? "CC Client" : "IC Client",
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
  const { settings } = useFinanceInvoiceSettings();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery();
  const businessSetup = businessSetupResponse?.data ?? null;

  const [step, setStep] = React.useState<Step>("items");
  const [lines, setLines] = React.useState<ManualEntryLine[]>(() => linesFromCard(card));
  const [discount, setDiscount] = React.useState<ManualEntryDiscount | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(null);
  const [paymentMethod, setPaymentMethod] =
    React.useState<SalesCheckoutPaymentMethod>(card.paymentMethod || "onlineDirect");
  const [dueDate, setDueDate] = React.useState(card.dueDate || tomorrowIso());
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);

  const people = React.useMemo(() => collectPeople(card), [card]);
  const kindBadge =
    clientKind === "company" || card.clientKind === "company"
      ? "CC Client"
      : "IC Client";

  const productOptions = React.useMemo<ManualEntryCatalogOption[]>(
    () =>
      settings.products.map((product) => ({
        id: product.id,
        label: product.name,
        unitPrice: parseFinancePrice(product.price),
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
      label: service.service ? `${service.category} - ${service.service}` : service.category,
      unitPrice: 0,
    }));
  }, [businessSetup?.service_details, settings.services]);

  const productLines = React.useMemo(() => lines.filter((l) => l.kind === "product"), [lines]);
  const itemLines = React.useMemo(() => lines.filter((l) => l.kind !== "product"), [lines]);
  const subtotal = React.useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const discountAmount = React.useMemo(
    () => calculateManualEntryDiscountAmount(subtotal, discount),
    [discount, subtotal],
  );
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const hasItems = lines.length > 0;
  const needsDueDate = paymentMethod === "onlineNonDirect" || paymentMethod === "offlineNonDirect";

  const addLinesFromCatalog = (kind: ManualEntryLineKind, options: ManualEntryCatalogOption[]) => {
    setLines((prev) => [...prev, ...options.map((option) => createManualEntryLineFromOption(kind, option))]);
  };
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
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
    });
  };

  const paymentOptions: Array<{ id: SalesCheckoutPaymentMethod; label: string }> = [
    { id: "onlineDirect", label: "Online Direct" },
    { id: "offlineDirect", label: "Offline Direct" },
    { id: "onlineNonDirect", label: "Online Non-Direct" },
    { id: "offlineNonDirect", label: "Offline Non-Direct" },
  ];

  const paymentLabel = paymentOptions.find((o) => o.id === paymentMethod)?.label || "Online Direct";

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
        <Typography sx={{ fontSize: 16, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          Checkout
        </Typography>
      </Stack>

      {step === "items" ? (
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
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
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
                  {card.clientName}
                </Typography>
                <Box sx={{ px: 0.7, py: 0.15, borderRadius: "999px", bgcolor: alpha(m.teal, 0.12) }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: m.teal }}>
                    {kindBadge}
                  </Typography>
                </Box>
              </Stack>
              {card.clientEmail ? (
                <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}>
                  {card.clientEmail}
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
                      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                        {person.label}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}>
                        {person.name}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            ) : null}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
              Items
            </Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.45), mb: 0.6 }}>
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
              <ManualEntryCatalogOpenButton label="Service" onClick={() => setItemDrawerOpen(true)} />
            </Stack>

            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.45), mb: 0.6 }}>
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
              <ManualEntryCatalogOpenButton label="Product" onClick={() => setProductDrawerOpen(true)} />
              <Button
                variant="outlined"
                onClick={() => setUniqueItemOpen(true)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 12.5,
                  borderColor: alpha(m.teal, 0.35),
                  color: m.teal,
                }}
              >
                + Unique Item
              </Button>
            </Stack>
          </Box>

          {hasItems ? (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                  Total Price:
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
                  {formatEurAmount(totalPrice)} EUR
                </Typography>
              </Stack>
              {discount && discount.amount > 0 ? (
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                  Discount ({formatManualEntryDiscountLabel(discount)}): -{formatEurAmount(discountAmount)}
                </Typography>
              ) : null}
              <Button
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
                }}
              >
                {discount && discount.amount > 0 ? "Edit Discount" : "+ Discount"}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {step === "payment" ? (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86), mb: 1.25 }}>
            Checkout
          </Typography>
          <Stack spacing={1}>
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.id;
              const showDue =
                selected && (option.id === "onlineNonDirect" || option.id === "offlineNonDirect");
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
                    <StorefrontOutlinedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
                        {option.label}
                      </Typography>
                      {showDue ? (
                        <Box sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                          <AppDatePicker
                            label="Due Date"
                            value={dueDate}
                            min={tomorrowIso()}
                            onChange={setDueDate}
                            fullWidth
                          />
                        </Box>
                      ) : null}
                    </Box>
                    <Radio
                      checked={selected}
                      value={option.id}
                      sx={{ color: alpha(m.navy, 0.3), "&.Mui-checked": { color: m.teal } }}
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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.5,
          }}
        >
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.86) }}>
              {needsDueDate ? "Reissued Invoice Summary" : "After treatment Summary"}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.3,
                borderRadius: "999px",
                bgcolor: alpha("#F79009", 0.16),
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#B54708" }}>
                {needsDueDate ? "Payment Due" : "Pending"}
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
            {card.clientName}
          </Typography>
          {card.clientEmail ? (
            <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5), mb: 1.25 }}>
              {card.clientEmail}
            </Typography>
          ) : (
            <Box sx={{ mb: 1.25 }} />
          )}
          <Stack spacing={0.75} sx={{ mb: 1.25 }}>
            {lines.map((line) => (
              <Stack key={line.id} direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                  {line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>€{lineTotal(line).toFixed(2)}</Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Total</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              €{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Payment</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              €{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}>
            {needsDueDate
              ? `${paymentLabel} (Due date ${dueDate.split("-").reverse().join("/")})`
              : paymentLabel}
          </Typography>
        </Box>
      ) : null}

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "8px",
            borderColor: alpha(m.navy, 0.14),
            color: alpha(m.navy, 0.72),
            height: 36,
            px: 2.25,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={(step === "items" && !hasItems) || (step === "payment" && needsDueDate && !dueDate)}
          onClick={handleNext}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "8px",
            bgcolor: m.teal,
            color: "#fff",
            "&:hover": { bgcolor: m.tealDark },
            height: 36,
            px: 2.5,
          }}
        >
          Next
        </Button>
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
        onClose={() => setProductDrawerOpen(false)}
        onConfirm={(selected) => {
          addLinesFromCatalog("product", selected);
          setProductDrawerOpen(false);
        }}
      />
      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        title="Add service"
        options={itemOptions}
        onClose={() => setItemDrawerOpen(false)}
        onConfirm={(selected) => {
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
        }}
      />
    </Box>
  );
}
