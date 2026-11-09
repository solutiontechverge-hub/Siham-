"use client";

import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import AppTextField from "../AppTextField";
import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Avatar,
  Box,
  Checkbox,
  IconButton,
  Popover,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { AppCalendarPanel } from "../AppDatePicker";
import { clientPlatformTagToneColors } from "../ClientPlatformTag";
import { formatCompactEuro } from "../booking-finance/formatBookingFinance";
import { tomorrowIso } from "./calendar.utils";
import {
  resolveCheckoutLateRescheduleFee,
  resolveSalesCheckoutPaymentOptions,
} from "./bookingCheckout";
import BookingCheckoutItemsStep, {
  BookingCheckoutTotalsBar,
} from "./BookingCheckoutItemsStep";
import {
  buildCheckoutItemParties,
  filterLinesForParty,
  manualLinesFromBookingEvent,
  salesLinesFromPartyCheckout,
} from "./bookingCheckoutItems";
import type {
  SalesCheckoutPaymentMethod,
  SalesClientKind,
  SalesLineItem,
} from "./salesOverview.types";
import {
  buildSplitPaymentAmounts,
  collapseSharesOntoPayer,
  parseSplitBillState,
  resolveSalesPayerShares,
  unpaidSplitPayers,
  type BookingSplitBillMode,
  type SalesPayerShare,
} from "./salesSplitBill";
import ManualEntryDiscountModal from "../../sections/finance/ManualEntryDiscountModal";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
  type ManualEntryLine,
} from "../../sections/finance/manualEntry.data";

type Step = "items" | "split" | "payer" | "payment" | "summary" | "completed";

type CheckoutNavFrame = { step: Step; partyIndex: number };

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
  /** company → 4 payment methods; otherwise Online/Offline Direct only. */
  clientKind?: SalesClientKind | null;
  clientPhotoSrc?: string | null;
  prepaidAmount?: number;
  onCancel: () => void;
  /** Return `false` on failure so the UI stays on summary (no throw → no Next overlay). */
  onSave: (result: BookingCheckoutResult) => boolean | void | Promise<boolean | void>;
};

type BookingCheckoutFlowPropsWithBack = BookingCheckoutFlowProps & {
  /** Header back arrow — same as footer Back (stack pop / booking). */
  onBackHandlerChange?: (goBack: (() => void) | null) => void;
};

export default function BookingCheckoutFlow({
  event,
  clientName,
  clientEmail,
  clientPhone,
  clientKind,
  clientPhotoSrc,
  prepaidAmount = 0,
  onCancel,
  onSave,
  onBackHandlerChange,
}: BookingCheckoutFlowPropsWithBack) {
  const m = useTheme().palette.mollure;
  const existingSplit = React.useMemo(
    () => parseSplitBillState(event.details?.splitBill),
    [event.details?.splitBill],
  );

  const [checkoutLines, setCheckoutLines] = React.useState<ManualEntryLine[]>(
    () => manualLinesFromBookingEvent(event),
  );
  const [discountByParty, setDiscountByParty] = React.useState<
    Record<string, ManualEntryDiscount | null>
  >({});
  // Explicit stack so header/footer Back always pops one screen (no jump-to-booking).
  const [navStack, setNavStack] = React.useState<CheckoutNavFrame[]>([
    { step: "items", partyIndex: 0 },
  ]);
  const step = navStack[navStack.length - 1]?.step ?? "items";
  const partyIndex = navStack[navStack.length - 1]?.partyIndex ?? 0;
  const pushNav = React.useCallback((frame: CheckoutNavFrame) => {
    setNavStack((prev) => [...prev, frame]);
  }, []);

  const seedShares = React.useMemo(() => {
    const allLines: SalesLineItem[] = manualLinesFromBookingEvent(event).map(
      (line) => ({
        id: line.id,
              label:
          line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
        amount:
          Math.round(
            (line.quantity * line.unitPrice + Number.EPSILON) * 100,
          ) / 100,
      }),
    );
    return resolveSalesPayerShares({
      event,
      allLines: allLines.filter((line) => line.amount >= 0),
      mainClientName: clientName,
      mainClientEmail: clientEmail,
      mainClientPhone: clientPhone,
    });
  }, [clientEmail, clientName, clientPhone, event]);

  const itemParties = React.useMemo(
    () =>
      buildCheckoutItemParties({
        event,
        shares: seedShares,
        clientName,
        clientEmail,
        clientKind,
      }),
    [clientEmail, clientKind, clientName, event, seedShares],
  );

  const activeParty = itemParties[Math.min(partyIndex, itemParties.length - 1)];

  const editedSalesLines = React.useMemo(
    () => salesLinesFromPartyCheckout(checkoutLines, itemParties, discountByParty),
    [checkoutLines, discountByParty, itemParties],
  );

  const allShares = React.useMemo(() => {
    const shares = resolveSalesPayerShares({
      event,
      allLines: editedSalesLines.filter((line) => line.amount !== 0),
      mainClientName: clientName,
      mainClientEmail: clientEmail,
      mainClientPhone: clientPhone,
    });
    return buildSplitPaymentAmounts({ shares, prepaidAmount });
  }, [
    clientEmail,
    clientName,
    clientPhone,
    editedSalesLines,
    event,
    prepaidAmount,
  ]);

  const unpaidShares = React.useMemo(() => {
    if (!existingSplit) return allShares.filter((share) => share.paymentAmount > 0);
    const unpaidKeys = new Set(unpaidSplitPayers(existingSplit).map((row) => row.key));
    if (!unpaidKeys.size) return allShares.filter((share) => share.paymentAmount > 0);
    return allShares.filter((share) => unpaidKeys.has(share.key));
  }, [allShares, existingSplit]);

  // Split Bill only when a guest/model is on the booking (not shares>1 alone).
  const hasGuestOrModelParty = React.useMemo(
    () =>
      allShares.some(
        (share) => share.role === "guest" || share.role === "model",
      ),
    [allShares],
  );
  const canSplit = hasGuestOrModelParty && unpaidShares.length > 1;
  const initialMode: BookingSplitBillMode =
    existingSplit?.mode === "split" && hasGuestOrModelParty
      ? "split"
      : existingSplit?.mode === "single"
        ? "single"
        : canSplit
          ? "split"
          : "single";

  const [mode, setMode] = React.useState<BookingSplitBillMode>(initialMode);
  const [payerKey, setPayerKey] = React.useState(
    () => unpaidShares[0]?.key ?? allShares[0]?.key ?? "main-client",
  );
  const [forWhoKeys, setForWhoKeys] = React.useState<string[]>(() =>
    (unpaidShares.length ? unpaidShares : allShares).map((share) => share.key),
  );
  const mainParty = itemParties.find((party) => party.variant === "main") ?? itemParties[0];
  const selectedPayerRole =
    unpaidShares.find((share) => share.key === payerKey)?.role ??
    allShares.find((share) => share.key === payerKey)?.role;
  const paymentOptions = React.useMemo(
    () =>
      resolveSalesCheckoutPaymentOptions(
        selectedPayerRole === "guest" || selectedPayerRole === "model"
          ? "individual"
          : clientKind,
      ),
    [clientKind, selectedPayerRole],
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<SalesCheckoutPaymentMethod>(
      () => paymentOptions[0]?.id ?? "offlineDirect",
    );
  React.useEffect(() => {
    if (!paymentOptions.some((option) => option.id === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.id ?? "offlineDirect");
    }
  }, [paymentMethod, paymentOptions]);
  // Guest/model online pay: guest email only (never seed IC/BC client email).
  const [checkoutEmail, setCheckoutEmail] = React.useState("");
  const [dueDate, setDueDate] = React.useState(tomorrowIso());
  const [dueDateAnchor, setDueDateAnchor] = React.useState<null | HTMLElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [completed, setCompleted] = React.useState<BookingCheckoutResult | null>(null);

  // Brief success beat, then back to booking details (footer Checkout disables when settled).
  const onCancelRef = React.useRef(onCancel);
  onCancelRef.current = onCancel;
  React.useEffect(() => {
    if (step !== "completed") return;
    const timer = window.setTimeout(() => onCancelRef.current(), 1400);
    return () => window.clearTimeout(timer);
  }, [step]);

  const sharePool = unpaidShares.length ? unpaidShares : allShares;

  const activeShares = React.useMemo(() => {
    if (mode === "single") {
      return collapseSharesOntoPayer(sharePool, payerKey);
    }
    const coveredKeys = forWhoKeys.length ? forWhoKeys : [payerKey];
    const covered = sharePool.filter((share) => coveredKeys.includes(share.key));
    return collapseSharesOntoPayer(
      covered.length ? covered : sharePool.slice(0, 1),
      payerKey,
      sharePool,
    );
  }, [forWhoKeys, mode, payerKey, sharePool]);

  const activeShare = activeShares[0];
  const lines = activeShare?.lines ?? [];
  const summarySubtotal = activeShare?.subtotal ?? 0;
  // Late fee uses drawer SSOT (`computeBookingPrice`); only on main / single bill.
  const lateRescheduleFee =
    activeShare &&
    (activeShare.role === "main_client" || mode === "single")
      ? resolveCheckoutLateRescheduleFee({
          event,
          baseAmount: summarySubtotal,
        })
      : null;
  const lateFeeAmount = lateRescheduleFee?.amount ?? 0;
  // Charge amount = collapsed share due (prepaid already deducted) + late fee when applicable.
  const amount = Math.round(
    (((activeShare?.paymentAmount ?? 0) + lateFeeAmount + Number.EPSILON) *
      100) /
      100,
  );
  const needsDueDate =
    paymentMethod === "onlineNonDirect" || paymentMethod === "offlineNonDirect";
  // Guest/model only — IC/BC already have email on file (Case B/C).
  const isGuestPayer =
    activeShare?.role === "guest" || activeShare?.role === "model";
  const needsOnlineEmail =
    isGuestPayer &&
    (paymentMethod === "onlineDirect" || paymentMethod === "onlineNonDirect");
  const paymentLabel =
    paymentOptions.find((option) => option.id === paymentMethod)?.label ??
    "Offline Direct";

  React.useEffect(() => {
    if (!isGuestPayer) return;
    setCheckoutEmail(activeShare?.email?.trim() ?? "");
  }, [activeShare?.email, activeShare?.key, isGuestPayer]);

  const remainingAfterThis = React.useMemo(() => {
    if (mode === "single") return 0;
    const covered = new Set(forWhoKeys);
    return Math.max(0, unpaidShares.filter((share) => !covered.has(share.key)).length);
  }, [forWhoKeys, mode, unpaidShares]);

  const fullBillGross = React.useMemo(
    () => sharePool.reduce((sum, share) => sum + share.subtotal, 0),
    [sharePool],
  );
  const fullBillTotal = React.useMemo(
    () => sharePool.reduce((sum, share) => sum + share.paymentAmount, 0),
    [sharePool],
  );

  // Split step: items + totals follow "For Who?" (rest stay payment due).
  const splitCoveredShares = React.useMemo(() => {
    if (mode !== "split") return sharePool;
    const keys = forWhoKeys.length ? forWhoKeys : [payerKey];
    const covered = sharePool.filter((share) => keys.includes(share.key));
    return covered.length ? covered : sharePool.slice(0, 1);
  }, [forWhoKeys, mode, payerKey, sharePool]);
  const splitCoveredGross = React.useMemo(
    () => splitCoveredShares.reduce((sum, share) => sum + share.subtotal, 0),
    [splitCoveredShares],
  );
  const splitCoveredDue = React.useMemo(
    () =>
      splitCoveredShares.reduce((sum, share) => sum + share.paymentAmount, 0),
    [splitCoveredShares],
  );
  const splitVisibleParties = React.useMemo(() => {
    if (mode !== "split") return itemParties;
    const keys = new Set(splitCoveredShares.map((share) => share.key));
    const matched = itemParties.filter((party) => keys.has(party.key));
    if (matched.length) return matched;
    return splitCoveredShares.map((share) => ({
      key: share.key,
      role: share.role,
      name: share.displayName || share.label,
      email: share.email,
      variant:
        share.role === "main_client"
          ? ("main" as const)
          : ("guest" as const),
      clientBadge: null as "IC Client" | "BC Client" | null,
    }));
  }, [itemParties, mode, splitCoveredShares]);
  const splitItemsParty =
    splitVisibleParties.find((party) => party.variant === "main") ??
    splitVisibleParties[0] ??
    mainParty;
  const splitVisibleLineIds = React.useMemo(() => {
    if (mode !== "split") return undefined;
    return new Set(
      splitCoveredShares.flatMap((share) =>
        share.lines
          .map((line) => line.id)
          .filter((id) => !String(id).startsWith("discount")),
      ),
    );
  }, [mode, splitCoveredShares]);

  const [stickyDiscountOpen, setStickyDiscountOpen] = React.useState(false);
  const stickyTotals = React.useMemo(() => {
    if (step === "split") {
      const total =
        mode === "single" ? fullBillGross : splitCoveredGross;
      const due = mode === "single" ? fullBillTotal : splitCoveredDue;
      const partyKey = splitItemsParty?.key;
      const disc = partyKey ? discountByParty[partyKey] ?? null : null;
      return {
        show: true,
        displayedTotal: total,
        amountDue: due,
        prepaidApplied: Math.max(0, total - due),
        // Share totals already net discount — only drive Edit/+ Discount label.
        discount: disc,
        discountAmount: 0,
        partyKey,
      };
    }
    if (step === "items" && activeParty) {
      const partyLines = filterLinesForParty(checkoutLines, activeParty);
      if (!partyLines.length) {
        return {
          show: false,
          displayedTotal: 0,
          amountDue: 0,
          prepaidApplied: 0,
          discount: null as ManualEntryDiscount | null,
          discountAmount: 0,
          partyKey: activeParty.key,
        };
      }
      const sub = partyLines.reduce((sum, line) => sum + lineTotal(line), 0);
      const disc = discountByParty[activeParty.key] ?? null;
      const discAmt = calculateManualEntryDiscountAmount(sub, disc);
      const total = Math.max(0, sub - discAmt);
      const prepaid =
        activeParty.variant === "main"
          ? Math.min(Math.max(0, prepaidAmount), total)
          : 0;
      return {
        show: true,
        displayedTotal: total,
        amountDue: Math.max(0, total - prepaid),
        prepaidApplied: prepaid,
        discount: disc,
        discountAmount: discAmt,
        partyKey: activeParty.key,
      };
    }
    return {
      show: false,
      displayedTotal: 0,
      amountDue: 0,
      prepaidApplied: 0,
      discount: null as ManualEntryDiscount | null,
      discountAmount: 0,
      partyKey: undefined as string | undefined,
    };
  }, [
    activeParty,
    checkoutLines,
    discountByParty,
    fullBillGross,
    fullBillTotal,
    mode,
    prepaidAmount,
    splitCoveredDue,
    splitCoveredGross,
    splitItemsParty?.key,
    step,
  ]);

  const personRoleLabel = (share: SalesPayerShare) => {
    if (share.role === "main_client") {
      return mainParty?.clientBadge ?? "IC Client";
    }
    if (share.role === "model") return "Model";
    return "Guest User";
  };

  const personPrimaryName = (share: SalesPayerShare) =>
    share.displayName?.trim() || share.label;

  // Split summary: one panel per covered share (before collapse). Charge still uses activeShare.
  const summaryShares = React.useMemo(() => {
    if (mode === "single") return activeShare ? [activeShare] : [];
    const keys = forWhoKeys.length ? forWhoKeys : payerKey ? [payerKey] : [];
    const covered = sharePool.filter((share) => keys.includes(share.key));
    return covered.length ? covered : activeShare ? [activeShare] : [];
  }, [activeShare, forWhoKeys, mode, payerKey, sharePool]);

  const goAfterItems = () => {
      if (canSplit && !existingSplit) {
      setForWhoKeys(sharePool.map((share) => share.key));
      pushNav({ step: "split", partyIndex });
        return;
      }
    if (existingSplit?.mode === "split" && unpaidShares.length > 1) {
      const nextKey = unpaidShares[0]?.key ?? payerKey;
      setPayerKey(nextKey);
      setForWhoKeys([nextKey]);
      pushNav({ step: "payer", partyIndex });
      return;
    }
    if (canSplit) {
      const nextKey = unpaidShares[0]?.key ?? payerKey;
      setPayerKey(nextKey);
      setForWhoKeys([nextKey]);
      pushNav({ step: "payer", partyIndex });
        return;
      }
    pushNav({ step: "payment", partyIndex });
  };

  const handleBack = React.useCallback(() => {
    if (step === "completed") {
      onCancel();
      return;
    }
    if (navStack.length <= 1) {
    onCancel();
      return;
    }
    setNavStack((prev) => prev.slice(0, -1));
  }, [navStack.length, onCancel, step]);

  React.useEffect(() => {
    if (!onBackHandlerChange) return;
    onBackHandlerChange(handleBack);
    return () => onBackHandlerChange(null);
  }, [handleBack, onBackHandlerChange]);

  const handleNext = async () => {
    if (step === "items") {
      if (partyIndex < itemParties.length - 1) {
        pushNav({ step: "items", partyIndex: partyIndex + 1 });
        return;
      }
      goAfterItems();
      return;
    }
    if (step === "split") {
      // Who pays? (+ For Who? when split) live on this step — skip separate payer step.
      pushNav({ step: "payment", partyIndex });
      return;
    }
    if (step === "payer") {
      pushNav({ step: "payment", partyIndex });
      return;
    }
    if (step === "payment") {
      if (needsDueDate && !dueDate) return;
      if (needsOnlineEmail && !checkoutEmail.trim()) return;
      pushNav({ step: "summary", partyIndex });
      return;
    }
    if (!activeShare || saving) return;
    const saveLines =
      lateFeeAmount > 0 && lateRescheduleFee
        ? [
            ...lines,
            {
              id: `late-reschedule-${activeShare.key}`,
              label: lateRescheduleFee.label,
              amount: lateFeeAmount,
            },
          ]
        : lines;
    const result: BookingCheckoutResult = {
      mode,
      payerKey: activeShare.key,
      payerKeys:
        mode === "single"
          ? sharePool.map((share) => share.key)
          : forWhoKeys.length
            ? forWhoKeys
          : [activeShare.key],
      paymentMethod,
      dueDate: needsDueDate ? dueDate : null,
      clientEmail: checkoutEmail.trim() || null,
      amount,
      lines: saveLines,
      remainingUnpaidCount: remainingAfterThis,
      payerLabel: activeShare.label,
      payerName: activeShare.displayName,
    };
    setSaving(true);
    try {
      const ok = await onSave(result);
      if (ok === false) return;
      setCompleted(result);
      pushNav({ step: "completed", partyIndex });
    } catch {
      // Legacy throw path — toast already shown; stay on summary.
    } finally {
      setSaving(false);
    }
  };

  const nextDisabled =
    (step === "payment" && needsDueDate && !dueDate) ||
    (step === "payment" && needsOnlineEmail && !checkoutEmail.trim()) ||
    (step === "payer" && !payerKey) ||
    (step === "split" && !payerKey) ||
    (step === "split" && mode === "split" && forWhoKeys.length === 0) ||
    saving;

  const nextLabel =
    step === "summary" && saving ? "Saving…" : "Next";

  const footerSecondaryIsCancel =
    (step === "items" && partyIndex === 0) || step === "summary";

  const renderPayerRadioRow = (
    share: SalesPayerShare & { paymentAmount: number },
    opts?: { showAmount?: boolean },
  ) => {
    const selected = payerKey === share.key;
    return (
      <Box
        key={`payer-${share.key}`}
        onClick={() => {
          setPayerKey(share.key);
          // Resume path: one share at a time (For Who? only on first split step).
          if (mode === "split" && step === "payer") {
            setForWhoKeys([share.key]);
          }
        }}
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
              {personPrimaryName(share)} ({personRoleLabel(share)})
            </Typography>
          </Box>
          {opts?.showAmount ? (
            <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
              {formatCompactEuro(share.paymentAmount)}
            </Typography>
          ) : null}
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

  const renderForWhoCheckboxRow = (
    share: SalesPayerShare & { paymentAmount: number },
  ) => {
    const selected = forWhoKeys.includes(share.key);
    return (
      <Box
        key={`for-who-${share.key}`}
        onClick={() => {
          setForWhoKeys((prev) => {
            if (prev.includes(share.key)) {
              if (prev.length <= 1) return prev;
              return prev.filter((key) => key !== share.key);
            }
            return [...prev, share.key];
          });
        }}
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
              {personPrimaryName(share)} ({personRoleLabel(share)})
              </Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
            {formatCompactEuro(share.paymentAmount)}
          </Typography>
          <Checkbox
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
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2.5}
        sx={{ minHeight: 360, px: 0.25, textAlign: "center" }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "999px",
            border: `1.5px solid ${m.teal}`,
            bgcolor: alpha(m.teal, 0.06),
            display: "grid",
            placeItems: "center",
          }}
        >
          <CheckRoundedIcon sx={{ fontSize: 36, color: m.teal, fontWeight: 900 }} />
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: m.navy }}>
          Payment Completed
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        pt: 0.5,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ flex: "1 0 auto" }}>
      {step === "items" && activeParty ? (
        <BookingCheckoutItemsStep
          party={activeParty}
          clientPhotoSrc={clientPhotoSrc}
          lines={checkoutLines}
          onChangeLines={setCheckoutLines}
          discount={discountByParty[activeParty.key] ?? null}
          onChangeDiscount={(next) =>
            setDiscountByParty((prev) => ({
              ...prev,
              [activeParty.key]: next,
            }))
          }
          prepaidAmount={
            activeParty.variant === "main" ? prepaidAmount : 0
          }
          hideTotals
        />
      ) : null}

      {step === "split" ? (
        <Stack spacing={1.5}>
          {mainParty ? (
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
                  bgcolor: alpha(m.navy, 0.03),
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.15}>
                  <Avatar
                    src={clientPhotoSrc || undefined}
                    sx={{ width: 40, height: 40, fontSize: 14, fontWeight: 800 }}
                  >
                    {(mainParty.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("") || "C")}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ mb: 0.15, flexWrap: "wrap" }}
                    >
          <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        {mainParty.name}
          </Typography>
                      {mainParty.clientBadge ? (
                        <Box
                          sx={{
                            px: 0.7,
                            py: 0.15,
                            borderRadius: "999px",
                            ...clientPlatformTagToneColors(m, "teal"),
                          }}
                        >
                          <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
                            {mainParty.clientBadge}
                          </Typography>
      </Box>
                      ) : null}
                    </Stack>
                    {mainParty.email ? (
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 650,
                          color: alpha(m.navy, 0.5),
                        }}
                      >
                        {mainParty.email}
        </Typography>
                    ) : null}
                  </Box>
      </Stack>
              </Box>
            </Box>
          ) : null}

          <Stack spacing={1}>
          {(
            [
              {
                id: "single" as const,
                  title: "Pay Full Bill",
                  trailing: (
                    <Typography
                      sx={{ fontSize: 13.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}
                    >
                      {formatCompactEuro(fullBillTotal)}
                    </Typography>
                  ),
              },
              {
                id: "split" as const,
                  title: "Split Bill",
                  trailing: (
                    <GroupsOutlinedIcon
                      sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }}
                    />
                  ),
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
                      setPayerKey(sharePool[0]?.key ?? payerKey);
                      setForWhoKeys(sharePool.map((share) => share.key));
                    } else {
                      setForWhoKeys(sharePool.map((share) => share.key));
                  }
                }}
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
                    <Checkbox
                    checked={selected}
                    sx={{
                      p: 0.5,
                      color: alpha(m.navy, 0.3),
                      "&.Mui-checked": { color: m.teal },
                    }}
                  />
                    <Typography
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      {option.title}
                    </Typography>
                    {option.trailing}
                </Stack>
              </Box>
            );
          })}
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
              Who pays?
            </Typography>
            {sharePool.map((share) => renderPayerRadioRow(share))}
          </Stack>

          {mode === "split" ? (
            <Stack spacing={1}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                For Who?
              </Typography>
              {sharePool.map((share) => renderForWhoCheckboxRow(share))}
            </Stack>
          ) : null}

          {splitItemsParty ? (
            <BookingCheckoutItemsStep
              party={splitItemsParty}
              hideClient
              showAllLines={mode === "single"}
              filterParties={
                mode === "split" ? splitVisibleParties : undefined
              }
              visibleLineIds={splitVisibleLineIds}
              clientPhotoSrc={clientPhotoSrc}
              lines={checkoutLines}
              onChangeLines={setCheckoutLines}
              discount={discountByParty[splitItemsParty.key] ?? null}
              onChangeDiscount={(next) =>
                setDiscountByParty((prev) => ({
                  ...prev,
                  [splitItemsParty.key]: next,
                }))
              }
              prepaidAmount={
                splitCoveredShares.some(
                  (share) => share.role === "main_client",
                )
                  ? prepaidAmount
                  : 0
              }
              totalPriceOverride={
                mode === "single" ? fullBillGross : splitCoveredGross
              }
              amountDueOverride={
                mode === "single" ? fullBillTotal : splitCoveredDue
              }
              hideTotals
            />
          ) : null}
        </Stack>
      ) : null}

      {step === "payer" ? (
        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
            Who pays?
          </Typography>
          {unpaidShares.map((share) =>
            renderPayerRadioRow(share, { showAmount: true }),
          )}
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
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.id;
              const showCalendar =
                option.id === "onlineNonDirect" || option.id === "offlineNonDirect";
              const showGuestEmail =
                selected &&
                isGuestPayer &&
                (option.id === "onlineDirect" || option.id === "onlineNonDirect");
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
                      {showGuestEmail ? (
                        <Box
                          sx={{ mt: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppTextField
                            label="Email for Guest"
                            placeholder="guest@email.com"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            fullWidth
                            size="small"
                            helperText={
                              !checkoutEmail.trim()
                                ? "Required for online payment"
                                : undefined
                            }
                            error={!checkoutEmail.trim()}
                          />
                        </Box>
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
                          alignSelf: "flex-start",
                          mt: 0.25,
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
                        alignSelf: showGuestEmail ? "flex-start" : "center",
                        mt: showGuestEmail ? 0.25 : 0,
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
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

      {step === "summary" && summaryShares.length ? (
        <Stack spacing={1.5}>
          {summaryShares.map((share) => {
            const isMainOrSingle =
              share.role === "main_client" || mode === "single";
            const panelPrepaid =
              prepaidAmount > 0 && isMainOrSingle ? prepaidAmount : 0;
            const panelLate =
              isMainOrSingle && lateRescheduleFee ? lateRescheduleFee : null;
            const panelLateAmt = panelLate?.amount ?? 0;
            const panelPay = Math.round(
              ((share.paymentAmount + panelLateAmt + Number.EPSILON) * 100) / 100,
            );
            const panelBreakdown = panelPrepaid > 0 || panelLateAmt > 0;
            const panelName =
              share.role === "main_client"
                ? personPrimaryName(share)
                : share.label || personPrimaryName(share);
            const panelBadge =
              share.role === "main_client" ? personRoleLabel(share) : null;
            const panelEmail =
              share.role === "main_client"
                ? checkoutEmail.trim() ||
                  share.email?.trim() ||
                  mainParty?.email?.trim() ||
                  ""
                : "";
            const panelInitials =
              panelName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("") || "C";
            return (
              <Box
                key={share.key}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.5,
          }}
        >
                <Typography sx={mollureSectionTitleSx(m.navy, { mb: 1.25 })}>
                  Summary
            </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.15}
                  sx={{ mb: 1.5 }}
                >
                  <Avatar
                    src={
                      share.role === "main_client"
                        ? clientPhotoSrc || undefined
                        : undefined
                    }
                    sx={{ width: 40, height: 40, fontSize: 14, fontWeight: 800 }}
                  >
                    {panelInitials}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ mb: 0.15, flexWrap: "wrap" }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        {panelName}
                      </Typography>
                      {panelBadge ? (
            <Box
              sx={{
                            px: 0.7,
                            py: 0.15,
                borderRadius: "999px",
                            ...clientPlatformTagToneColors(m, "teal"),
              }}
            >
                          <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
                            {panelBadge}
              </Typography>
            </Box>
                      ) : null}
          </Stack>
                    {panelEmail ? (
            <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 650,
                          color: alpha(m.navy, 0.5),
                        }}
                      >
                        {panelEmail}
            </Typography>
                    ) : null}
                  </Box>
                </Stack>
                <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                  {share.lines.map((line) => {
                    const muted =
                      line.amount < 0 ||
                      String(line.id).startsWith("kilometer-allowance") ||
                      /kilometer|allowance/i.test(line.label);
                    return (
                      <Stack
                        key={line.id}
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: muted ? 650 : 700,
                            color: alpha(m.navy, muted ? 0.45 : 0.72),
                          }}
                        >
                  {line.label}
                </Typography>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: muted ? 700 : 800,
                            color: alpha(m.navy, muted ? 0.45 : 0.88),
                          }}
                        >
                  {formatCompactEuro(line.amount)}
                </Typography>
              </Stack>
                    );
                  })}
          </Stack>
                {panelBreakdown ? (
                  <Stack spacing={0.55} sx={{ mb: 0.85 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="baseline"
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                        Total
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                        }}
                      >
                        {formatCompactEuro(share.subtotal)}
            </Typography>
          </Stack>
                    {panelPrepaid > 0 ? (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                      >
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          Prepaid
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          {formatCompactEuro(panelPrepaid)}
                        </Typography>
                      </Stack>
                    ) : null}
                    {panelLate ? (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                      >
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          {panelLate.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          {formatCompactEuro(panelLate.amount)}
                        </Typography>
                      </Stack>
                    ) : null}
                    <Box sx={{ mt: 0.15 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                          mb: 0.2,
                        }}
                      >
                        Payment
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: m.teal,
                          lineHeight: 1.1,
                        }}
                      >
                        {formatCompactEuro(panelPay)}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Stack spacing={0.55} sx={{ mb: 0.75 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="baseline"
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                        Total
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                        }}
                      >
                        {formatCompactEuro(share.subtotal)}
                      </Typography>
                    </Stack>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                          mb: 0.2,
                        }}
                      >
                        Payment
                      </Typography>
                      <Typography
                        sx={{ fontSize: 22, fontWeight: 900, color: m.teal }}
                      >
                        {formatCompactEuro(panelPay)}
                      </Typography>
                    </Box>
                  </Stack>
                )}
                <Typography
                  sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}
                >
            {needsDueDate
              ? `${paymentLabel} (Due date ${dueDate.split("-").reverse().join("/")})`
              : paymentLabel}
          </Typography>
        </Box>
            );
          })}
        </Stack>
      ) : null}

      </Box>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          flexShrink: 0,
          mt: 2,
          pt: 1.5,
          pb: 0.5,
          bgcolor: "#fff",
          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 -8px 20px rgba(16, 35, 63, 0.06)",
        }}
      >
        {stickyTotals.show ? (
          <Box sx={{ mb: 1.5 }}>
            <BookingCheckoutTotalsBar
              displayedTotal={stickyTotals.displayedTotal}
              amountDue={stickyTotals.amountDue}
              prepaidApplied={stickyTotals.prepaidApplied}
              discount={stickyTotals.discount}
              discountAmount={stickyTotals.discountAmount}
              onDiscountClick={() => setStickyDiscountOpen(true)}
            />
            <ManualEntryDiscountModal
              open={stickyDiscountOpen}
              initialValue={stickyTotals.discount}
              onClose={() => setStickyDiscountOpen(false)}
              onApply={(next) => {
                if (!stickyTotals.partyKey) return;
                setDiscountByParty((prev) => ({
                  ...prev,
                  [stickyTotals.partyKey!]: next,
                }));
              }}
            />
          </Box>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <AppButton
            tone="secondary"
            onClick={footerSecondaryIsCancel ? onCancel : handleBack}
          >
            {footerSecondaryIsCancel ? "Cancel" : "Back"}
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
    </Box>
  );
}
