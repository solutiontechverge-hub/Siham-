"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import AppSegmentTabs from "../../common/AppSegmentTabs";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import MollureFormField from "../../common/MollureFormField";
import { mollureWhiteFieldInputSx } from "../../common/mollureFormSx";
import { BodyText } from "../../ui/typography";
import {
  REFUND_METHOD_OPTIONS,
  REFUND_REASON_OPTIONS_AMOUNT,
  REFUND_REASON_OPTIONS_ITEM,
  isOnlineRefundMethod,
  isOriginalOnlineCharge,
  mergeRefundSalesItems,
  refundItemsFromTransactions,
  resolvePreferredRefundMethod,
  type RefundSalesItem,
  type RefundSalesSavePayload,
} from "./refundSales.data";
import RefundSalesSelectField from "./RefundSalesSelectField";

export type RefundSalesDrawerProps = {
  open: boolean;
  onClose: () => void;
  transactions: readonly TransactionRow[];
  /** True while Sales is still fetching finance rows for this booking. */
  transactionsLoading?: boolean;
  fallbackItems?: RefundSalesItem[];
  /** Sales-card paymentMethod when finance rows are still hydrating. */
  originalPaymentMethod?: string | null;
  onSave?: (payload: RefundSalesSavePayload) => void | Promise<void>;
};

type RefundTab = "item" | "amount";

const fieldSx = mollureWhiteFieldInputSx;

function RefundItemRow({
  item,
  checked,
  onToggle,
}: {
  item: RefundSalesItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 1.75,
        py: 1.35,
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        cursor: "pointer",
      }}
    >
      <Box>
        <Typography
          sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.86) }}
        >
          {item.name}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: alpha(m.navy, 0.5),
            mt: 0.25,
          }}
        >
          {item.meta}
        </Typography>
      </Box>
      <Checkbox
        checked={checked}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        sx={{
          p: 0.5,
          color: alpha(m.navy, 0.25),
          "&.Mui-checked": { color: m.teal },
        }}
      />
    </Box>
  );
}

export default function RefundSalesDrawer({
  open,
  onClose,
  transactions,
  transactionsLoading = false,
  fallbackItems = [],
  originalPaymentMethod = null,
  onSave,
}: RefundSalesDrawerProps) {
  const m = useTheme().palette.mollure;
  const [tab, setTab] = React.useState<RefundTab>("item");
  const [items, setItems] = React.useState<RefundSalesItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [itemReason, setItemReason] = React.useState("");
  const [refundMethod, setRefundMethod] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [amountReason, setAmountReason] = React.useState("");
  const [customReason, setCustomReason] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState("");
  const [iban, setIban] = React.useState("");
  const [openSelectId, setOpenSelectId] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const preferredMethod = resolvePreferredRefundMethod(
    transactions,
    originalPaymentMethod,
  );
  const originalOnline = isOriginalOnlineCharge(
    transactions,
    originalPaymentMethod,
  );
  const methodLocked = originalOnline && Boolean(preferredMethod);
  const showBankDetails =
    !originalOnline && isOnlineRefundMethod(refundMethod);

  // Form fields reset only on open — not when finance rows / fallback lines
  // hydrate mid-session (that was snapping "Refund by Amount" back to Item).
  React.useEffect(() => {
    if (!open) return;
    setTab("item");
    setItemReason("");
    setRefundMethod(preferredMethod);
    setRefundAmount("");
    setAmountReason("");
    setCustomReason("");
    setAccountHolder("");
    setIban("");
    setOpenSelectId(null);
    setCompleted(false);
    setSubmitting(false);
    // preferredMethod intentionally omitted — hydrate effect below applies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset once per open
  }, [open]);

  // Finance rows first (non-fee sorted ahead of LCF), then Sales card lines
  // fill any booking services/products missing from documents.
  React.useEffect(() => {
    if (!open) return;
    const resolvedItems = mergeRefundSalesItems(
      refundItemsFromTransactions(transactions),
      fallbackItems,
    );
    setItems(resolvedItems);
    setSelectedItemIds((prev) => {
      const still = prev.filter((id) =>
        resolvedItems.some((item) => item.id === id),
      );
      if (
        still.length === prev.length &&
        still.every((id, i) => id === prev[i])
      ) {
        return prev;
      }
      if (still.length) return still;
      return resolvedItems.length ? [resolvedItems[0].id] : [];
    });
    if (preferredMethod) {
      setRefundMethod((prev) =>
        methodLocked || !prev ? preferredMethod : prev,
      );
    }
    // Prefill full net when a single refundable row is present (amount tab).
    const refundableNets = transactions
      .filter((row) =>
        ["Paid", "Prepaid"].includes(String(row.status)),
      )
      .map((row) => Number(row.netAmount) || 0)
      .filter((n) => n > 0);
    if (refundableNets.length === 1) {
      setRefundAmount((prev) => prev || refundableNets[0].toFixed(2));
    }
  }, [fallbackItems, methodLocked, open, preferredMethod, transactions]);

  const allItemsSelected =
    items.length > 0 && selectedItemIds.length === items.length;
  const someItemsSelected = selectedItemIds.length > 0 && !allItemsSelected;
  const showWriteReason = amountReason === "write-reason";
  const amountValue = Number(refundAmount);
  const bankDetailsOk =
    !showBankDetails ||
    (accountHolder.trim().length > 1 && iban.trim().length >= 8);
  // Finance overview never gates on loading. Only block while hydrate has nothing
  // selectable yet — seeded/fallback lines must keep Refund clickable.
  const selectionOk =
    tab === "amount"
      ? Number.isFinite(amountValue) && amountValue > 0
      : selectedItemIds.length > 0;
  const canRefund =
    selectionOk &&
    bankDetailsOk &&
    !(transactionsLoading && items.length === 0);

  const toggleSelectAll = () => {
    setSelectedItemIds(allItemsSelected ? [] : items.map((item) => item.id));
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handlePrimary = async () => {
    if (completed) {
      onClose();
      return;
    }
    if (!canRefund || submitting) return;
    if (!onSave) return;
    const amount =
      tab === "amount"
        ? amountValue
        : selectedItemIds.reduce(
            (sum, id) =>
              sum + Number(items.find((item) => item.id === id)?.amount ?? 0),
            0,
          );
    const reason =
      tab === "amount"
        ? showWriteReason
          ? customReason
          : amountReason
        : itemReason;
    setSubmitting(true);
    try {
      await onSave({
        mode: tab,
        itemIds: selectedItemIds,
        items,
        amount,
        method: refundMethod || preferredMethod || undefined,
        reason: reason || undefined,
        ...(showBankDetails
          ? {
              bankDetails: {
                accountHolder: accountHolder.trim(),
                iban: iban.trim().replace(/\s+/g, "").toUpperCase(),
              },
            }
          : {}),
      });
      setCompleted(true);
    } catch {
      // Parent shows snackbar; do not mark completed or surface [object Object].
    } finally {
      setSubmitting(false);
    }
  };

  const refundMethodField = (
    <Stack spacing={1}>
      <RefundSalesSelectField
        selectId="refund-method"
        openSelectId={methodLocked ? null : openSelectId}
        onOpenSelectIdChange={(id) => {
          if (methodLocked) return;
          setOpenSelectId(id);
        }}
        label="Refund Method"
        placeholder="Select Refund"
        value={refundMethod}
        options={[...REFUND_METHOD_OPTIONS]}
        onChange={(value) => {
          if (methodLocked) return;
          setRefundMethod(value);
        }}
        optionStyle="radio"
      />
      {methodLocked ? (
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
          Refund returns to the original online payment account.
        </Typography>
      ) : null}
      {showBankDetails ? (
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
            Bank details for online refund
          </Typography>
          <Box>
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Account holder
            </BodyText>
            <MollureFormField
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Full name"
              fullWidth
              sx={fieldSx}
            />
          </Box>
          <Box>
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              IBAN
            </BodyText>
            <MollureFormField
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="NL00 BANK 0123 4567 89"
              fullWidth
              sx={fieldSx}
            />
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Refund Sales"
      contentVariant="muted"
      // Nested under booking drawer — avoid parent focus trap swallowing footer clicks.
      disableEnforceFocus
      disableAutoFocus
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      footer={
        <FinanceDrawerActionsFooter
          onCancel={onClose}
          primaryLabel={completed ? "Close" : "Refund"}
          primaryDisabled={!completed && (!canRefund || submitting)}
          onPrimary={() => {
            void handlePrimary();
          }}
        />
      }
    >
      {completed ? (
        <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 420 }}>
          <Typography sx={{ fontSize: 28, color: m.teal }}>✓</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: m.navy }}>
            Refund Completed
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {transactionsLoading ? (
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Loading finance transactions…
            </Typography>
          ) : null}
          {!transactionsLoading && !transactions.length ? (
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              {items.length
                ? "No finance transactions found for this booking yet. Refund will map selected sale lines when Paid/Prepaid rows are available."
                : "No finance transactions found. Open Finance overview or wait for Paid/Prepaid rows, then try again."}
            </Typography>
          ) : null}

          <AppSegmentTabs
            tabs={[
              { id: "item", label: "Refund by Item" },
              { id: "amount", label: "Refund by Amount" },
            ]}
            value={tab}
            onChange={(id) => setTab(id as RefundTab)}
          />

          {tab === "item" ? (
            <Stack spacing={2}>
              <Box
                onClick={toggleSelectAll}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.86),
                  }}
                >
                  Select All Item
                </Typography>
                <Checkbox
                  checked={allItemsSelected}
                  indeterminate={someItemsSelected}
                  onChange={toggleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    p: 0.5,
                    color: alpha(m.navy, 0.25),
                    "&.Mui-checked": { color: m.teal },
                    "&.MuiCheckbox-indeterminate": { color: m.teal },
                  }}
                />
              </Box>

              <Stack spacing={1}>
                {items.map((item) => (
                  <RefundItemRow
                    key={item.id}
                    item={item}
                    checked={selectedItemIds.includes(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                  €
                  {items
                    .filter((item) => selectedItemIds.includes(item.id))
                    .reduce((sum, item) => sum + (item.amount ?? 0), 0)
                    .toFixed(2)}
                </Typography>
              </Stack>

              {refundMethodField}

              <RefundSalesSelectField
                label="Reason"
                placeholder="Select Reason"
                value={itemReason}
                options={[...REFUND_REASON_OPTIONS_ITEM]}
                onChange={setItemReason}
                optionStyle="checkbox"
                checkboxAlign="right"
                highlightBorderWhenValue
              />
            </Stack>
          ) : (
            <Stack spacing={2}>
              {refundMethodField}

              <Box>
                <BodyText
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    mb: 0.75,
                  }}
                >
                  Price
                </BodyText>
                <MollureFormField
                  value={refundAmount}
                  onChange={(e) =>
                    setRefundAmount(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="0"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          EUR
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <RefundSalesSelectField
                selectId="amount-reason"
                openSelectId={openSelectId}
                onOpenSelectIdChange={setOpenSelectId}
                label="Reason"
                placeholder="Select Reason"
                value={amountReason}
                options={[...REFUND_REASON_OPTIONS_AMOUNT]}
                onChange={setAmountReason}
                optionStyle="checkbox"
                checkboxAlign="left"
                highlightBorderWhenValue
              />
              {showWriteReason ? (
                <MollureFormField
                  multiline
                  minRows={3}
                  placeholder="Write your reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  fullWidth
                  sx={{ ...fieldSx, mt: 1 }}
                />
              ) : null}
            </Stack>
          )}
        </Stack>
      )}
    </AppDrawer>
  );
}
