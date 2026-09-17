"use client";

import {
  mollureBodyMutedSx,
  mollurePageSubtitleSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import AppTextField from "../AppTextField";
import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { AppCalendarPanel } from "../AppDatePicker";
import { formatCompactEuro } from "../booking-finance/formatBookingFinance";
import { tomorrowIso } from "./calendar.utils";
import type { SalesCheckoutPaymentMethod, SalesLineItem } from "./salesOverview.types";
import {
  buildSplitPaymentAmounts,
  collapseSharesOntoPayer,
  parseSplitBillState,
  resolveSalesPayerShares,
  unpaidSplitPayers,
  type BookingSplitBillMode,
  type SalesPayerShare,
} from "./salesSplitBill";

type Step = "split" | "payer" | "payment" | "summary" | "completed";

export type BookingCheckoutResult = {
  mode: BookingSplitBillMode;
  payerKey: string;
  payerKeys: string[];
  paymentMethod: SalesCheckoutPaymentMethod;
  dueDate: string | null;
  clientEmail: string | null;
  amount: number;
  lines: SalesLineItem[];
  remainingUnpaidCount: number;
  payerLabel: string;
  payerName: string;
};

type BookingCheckoutFlowProps = {
  event: CalendarEvent;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  prepaidAmount?: number;
  onCancel: () => void;
  onSave: (result: BookingCheckoutResult) => void | Promise<void>;
};

const PAYMENT_OPTIONS: Array<{ id: SalesCheckoutPaymentMethod; label: string }> = [
  { id: "onlineDirect", label: "Online Direct" },
  { id: "offlineDirect", label: "Offline Direct" },
  { id: "onlineNonDirect", label: "Online Non-Direct" },
  { id: "offlineNonDirect", label: "Offline Non-Direct" },
];

export default function BookingCheckoutFlow({
  event,
  clientName,
  clientEmail,
  clientPhone,
  prepaidAmount = 0,
  onCancel,
  onSave,
}: BookingCheckoutFlowProps) {
  const m = useTheme().palette.mollure;
  const existingSplit = React.useMemo(
    () => parseSplitBillState(event.details?.splitBill),
    [event.details?.splitBill],
  );

  const allShares = React.useMemo(() => {
    const snapshotServices = event.details?.clientSnapshot?.services ?? [];
    const allLines: SalesLineItem[] = snapshotServices.length
      ? snapshotServices.map((service) => ({
          id: service.id,
          label: service.name,
          amount: Math.round((service.price + Number.EPSILON) * 100) / 100,
        }))
      : [
          ...(event.details?.services ?? []).map((service) => ({
            id: service.id,
            label: service.name,
            amount: Math.round((service.price + Number.EPSILON) * 100) / 100,
          })),
          ...(event.details?.products ?? []).map((product) => ({
            id: product.id,
            label:
              product.quantity > 1
                ? `${product.name} ×${product.quantity}`
                : product.name,
            amount: Math.round((product.price + Number.EPSILON) * 100) / 100,
          })),
        ];
    const shares = resolveSalesPayerShares({
      event,
      allLines: allLines.filter((line) => line.amount >= 0),
      mainClientName: clientName,
      mainClientEmail: clientEmail,
      mainClientPhone: clientPhone,
    });
    return buildSplitPaymentAmounts({ shares, prepaidAmount });
  }, [clientEmail, clientName, clientPhone, event, prepaidAmount]);

  const unpaidShares = React.useMemo(() => {
    if (!existingSplit) return allShares.filter((share) => share.paymentAmount > 0);
    const unpaidKeys = new Set(unpaidSplitPayers(existingSplit).map((row) => row.key));
    if (!unpaidKeys.size) return allShares.filter((share) => share.paymentAmount > 0);
    return allShares.filter((share) => unpaidKeys.has(share.key));
  }, [allShares, existingSplit]);

  const canSplit = unpaidShares.length > 1;
  const initialMode: BookingSplitBillMode =
    existingSplit?.mode ?? (canSplit ? "split" : "single");

  const [step, setStep] = React.useState<Step>(() => {
    if (existingSplit?.mode === "split" && unpaidShares.length) return "payer";
    if (canSplit) return "split";
    return "payment";
  });
  const [mode, setMode] = React.useState<BookingSplitBillMode>(initialMode);
  const [payerKey, setPayerKey] = React.useState(
    () => unpaidShares[0]?.key ?? allShares[0]?.key ?? "main-client",
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<SalesCheckoutPaymentMethod>("offlineDirect");
  const [checkoutEmail, setCheckoutEmail] = React.useState(clientEmail?.trim() ?? "");
  const [dueDate, setDueDate] = React.useState(tomorrowIso());
  const [dueDateAnchor, setDueDateAnchor] = React.useState<null | HTMLElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [completed, setCompleted] = React.useState<BookingCheckoutResult | null>(null);

  const activeShares = React.useMemo(() => {
    if (mode === "single") {
      return collapseSharesOntoPayer(unpaidShares.length ? unpaidShares : allShares, payerKey);
    }
    const chosen = unpaidShares.find((share) => share.key === payerKey);
    return chosen ? [chosen] : unpaidShares.slice(0, 1);
  }, [allShares, mode, payerKey, unpaidShares]);

  const activeShare = activeShares[0];
  const amount = activeShare?.paymentAmount ?? 0;
  const lines = activeShare?.lines ?? [];
  const needsDueDate =
    paymentMethod === "onlineNonDirect" || paymentMethod === "offlineNonDirect";
  const needsOnlineEmail =
    paymentMethod === "onlineDirect" || paymentMethod === "onlineNonDirect";
  const paymentLabel =
    PAYMENT_OPTIONS.find((option) => option.id === paymentMethod)?.label ?? "Offline Direct";

  const remainingAfterThis = React.useMemo(() => {
    if (mode === "single") return 0;
    return Math.max(0, unpaidShares.length - 1);
  }, [mode, unpaidShares.length]);

  const handleBack = () => {
    if (step === "completed") {
      onCancel();
      return;
    }
    if (step === "summary") {
      setStep("payment");
      return;
    }
    if (step === "payment") {
      if (mode === "split" && unpaidShares.length > 1) {
        setStep("payer");
        return;
      }
      if (canSplit && !existingSplit) {
        setStep("split");
        return;
      }
      onCancel();
      return;
    }
    if (step === "payer") {
      if (canSplit && !existingSplit) {
        setStep("split");
        return;
      }
      onCancel();
      return;
    }
    onCancel();
  };

  const handleNext = async () => {
    if (step === "split") {
      if (mode === "split") setStep("payer");
      else setStep(unpaidShares.length > 1 ? "payer" : "payment");
      return;
    }
    if (step === "payer") {
      setStep("payment");
      return;
    }
    if (step === "payment") {
      if (needsDueDate && !dueDate) return;
      if (needsOnlineEmail && !checkoutEmail.trim()) return;
      setStep("summary");
      return;
    }
    if (!activeShare || saving) return;
    const result: BookingCheckoutResult = {
      mode,
      payerKey: activeShare.key,
      payerKeys:
        mode === "single"
          ? (unpaidShares.length ? unpaidShares : allShares).map((share) => share.key)
          : [activeShare.key],
      paymentMethod,
      dueDate: needsDueDate ? dueDate : null,
      clientEmail: checkoutEmail.trim() || null,
      amount,
      lines,
      remainingUnpaidCount: remainingAfterThis,
      payerLabel: activeShare.label,
      payerName: activeShare.displayName,
    };
    setSaving(true);
    try {
      await onSave(result);
      setCompleted(result);
      setStep("completed");
    } finally {
      setSaving(false);
    }
  };

  const nextDisabled =
    (step === "payment" && needsDueDate && !dueDate) ||
    (step === "payment" && needsOnlineEmail && !checkoutEmail.trim()) ||
    (step === "payer" && !payerKey) ||
    saving;

  const nextLabel =
    step === "summary" ? (saving ? "Saving…" : "Confirm") : "Next";

  const renderPersonRow = (share: SalesPayerShare & { paymentAmount: number }) => {
    const selected = payerKey === share.key;
    return (
      <Box
        key={share.key}
        onClick={() => setPayerKey(share.key)}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${selected ? m.teal : alpha(m.navy, 0.1)}`,
          bgcolor: selected ? alpha(m.navy, 0.03) : "#fff",
          px: 1.5,
          py: 1.2,
          cursor: "pointer",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}
            >
              {share.label}
            </Typography>
            {share.displayName && share.displayName !== share.label ? (
              <Typography
                sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}
              >
                {share.displayName}
              </Typography>
            ) : null}
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
            {formatCompactEuro(share.paymentAmount)}
          </Typography>
          <Radio
            checked={selected}
            sx={{
              p: 0.5,
              color: alpha(m.navy, 0.3),
              "&.Mui-checked": { color: m.teal },
            }}
          />
        </Stack>
      </Box>
    );
  };

  if (step === "completed" && completed) {
    return (
      <Box sx={{ pt: 2, px: 0.25, textAlign: "center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "999px",
            bgcolor: alpha(m.teal, 0.12),
            display: "grid",
            placeItems: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: 42, color: m.teal }} />
        </Box>
        <Typography sx={mollurePageTitleSx(m.navy, { mb: 0.75 })}>
          Payment Completed
        </Typography>
        <Typography sx={mollurePageSubtitleSx(m.navy, { mb: 2 })}>
          {completed.payerLabel}
          {completed.payerName && completed.payerName !== completed.payerLabel
            ? ` · ${completed.payerName}`
            : ""}
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 900, color: m.teal, mb: 1.5 }}>
          {formatCompactEuro(completed.amount)}
        </Typography>
        {completed.remainingUnpaidCount > 0 ? (
          <Typography
            sx={mollureBodyMutedSx(m.navy, { mb: 2  })}
          >
            {completed.remainingUnpaidCount === 1
              ? "One guest payment remaining. Checkout stays available on this booking."
              : `${completed.remainingUnpaidCount} guest payments remaining. Checkout stays available on this booking.`}
          </Typography>
        ) : (
          <Typography
            sx={mollureBodyMutedSx(m.navy, { mb: 2  })}
          >
            This booking checkout is complete.
          </Typography>
        )}
        <AppButton tone="primary" onClick={onCancel} sx={{ minWidth: 140, height: 40 }}>
          Done
        </AppButton>
      </Box>
    );
  }

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

      {step === "split" ? (
        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
            How should this bill be paid?
          </Typography>
          {(
            [
              {
                id: "single" as const,
                title: "One person pays the full bill",
                detail: `Charge ${formatCompactEuro(
                  unpaidShares.reduce((sum, share) => sum + share.paymentAmount, 0),
                )} to a single guest.`,
              },
              {
                id: "split" as const,
                title: "Split between guests",
                detail: `${unpaidShares.length} people on this booking. Checkout each share separately.`,
              },
            ] as const
          ).map((option) => {
            const selected = mode === option.id;
            return (
              <Box
                key={option.id}
                onClick={() => {
                  setMode(option.id);
                  if (option.id === "split") {
                    setPayerKey(unpaidShares[0]?.key ?? payerKey);
                  }
                }}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${selected ? m.teal : alpha(m.navy, 0.1)}`,
                  bgcolor: selected ? alpha(m.navy, 0.03) : "#fff",
                  px: 1.5,
                  py: 1.35,
                  cursor: "pointer",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}
                    >
                      {option.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5), mt: 0.25 }}
                    >
                      {option.detail}
                    </Typography>
                  </Box>
                  <Radio
                    checked={selected}
                    sx={{
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
      ) : null}

      {step === "payer" ? (
        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
            {mode === "single" ? "Who is paying the full bill?" : "Whose share are you checking out?"}
          </Typography>
          {(mode === "single" ? unpaidShares : unpaidShares).map(renderPersonRow)}
        </Stack>
      ) : null}

      {step === "payment" ? (
        <Box>
          {activeShare ? (
            <Box
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                bgcolor: "#fff",
                px: 1.5,
                py: 1.2,
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
                {activeShare.label}
              </Typography>
              {activeShare.displayName !== activeShare.label ? (
                <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}>
                  {activeShare.displayName}
                </Typography>
              ) : null}
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: m.headingText, mt: 0.5 }}>
                {formatCompactEuro(amount)}
              </Typography>
            </Box>
          ) : null}
          <Typography
            sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86), mb: 1.25 }}
          >
            Payment method
          </Typography>
          <Stack spacing={1}>
            {PAYMENT_OPTIONS.map((option) => {
              const selected = paymentMethod === option.id;
              const showCalendar =
                option.id === "onlineNonDirect" || option.id === "offlineNonDirect";
              const dueLabel =
                dueDate && selected ? dueDate.split("-").reverse().join("/") : null;
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
                      sx={{ fontSize: 20, color: alpha(m.navy, 0.45), flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}
                      >
                        {option.label}
                      </Typography>
                      {showCalendar && dueLabel ? (
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
                    {showCalendar ? (
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
            <Box sx={{ mt: 1.5 }}>
              <AppTextField
                label="Email"
                placeholder="Email for online payment"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                fullWidth
                helperText={!checkoutEmail.trim() ? "Required for online payment" : undefined}
                error={!checkoutEmail.trim()}
              />
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
              onChange={(iso) => setDueDate(iso)}
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
            <Typography sx={mollureSectionTitleSx(m.navy)}>
              {mode === "split" ? "Guest payment" : "After treatment Summary"}
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
            {activeShare?.label}
          </Typography>
          {checkoutEmail.trim() ? (
            <Typography
              sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5), mb: 1.25 }}
            >
              {checkoutEmail.trim()}
            </Typography>
          ) : (
            <Box sx={{ mb: 1.25 }} />
          )}
          <Stack spacing={0.75} sx={{ mb: 1.25 }}>
            {lines.map((line) => (
              <Stack key={line.id} direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                  {line.label}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                  {formatCompactEuro(line.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Payment</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}>
              {formatCompactEuro(amount)}
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
        <AppButton tone="secondary" onClick={step === "split" ? onCancel : handleBack}>
          {step === "split" ? "Cancel" : "Back"}
        </AppButton>
        <AppButton
          tone="primary"
          disabled={nextDisabled}
          onClick={() => void handleNext()}
          sx={{ px: 2.5 }}
        >
          {nextLabel}
        </AppButton>
      </Stack>
    </Box>
  );
}
