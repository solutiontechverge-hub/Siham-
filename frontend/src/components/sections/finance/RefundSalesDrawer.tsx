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
  refundItemsFromTransactions,
  type RefundSalesItem,
} from "./refundSales.data";
import RefundSalesSelectField from "./RefundSalesSelectField";

export type RefundSalesDrawerProps = {
  open: boolean;
  onClose: () => void;
  transactions: readonly TransactionRow[];
  onSave?: () => void;
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
  const [openSelectId, setOpenSelectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const nextItems = refundItemsFromTransactions(transactions);
    setTab("item");
    setItems(nextItems);
    setSelectedItemIds(nextItems.length ? [nextItems[0].id] : []);
    setItemReason("");
    setRefundMethod("");
    setRefundAmount("");
    setAmountReason("");
    setCustomReason("");
    setOpenSelectId(null);
  }, [open, transactions]);

  const allItemsSelected =
    items.length > 0 && selectedItemIds.length === items.length;
  const someItemsSelected = selectedItemIds.length > 0 && !allItemsSelected;
  const showWriteReason = amountReason === "write-reason";

  const toggleSelectAll = () => {
    setSelectedItemIds(allItemsSelected ? [] : items.map((item) => item.id));
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Refund Sales"
      contentVariant="muted"
      footer={
        <FinanceDrawerActionsFooter
          onCancel={onClose}
          primaryLabel="Save"
          onPrimary={() => {
            onSave?.();
            onClose();
          }}
        />
      }
    >
      <Stack spacing={2}>
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
            <RefundSalesSelectField
              selectId="refund-method"
              openSelectId={openSelectId}
              onOpenSelectIdChange={setOpenSelectId}
              label="Refund Method"
              placeholder="Select Refund"
              value={refundMethod}
              options={[...REFUND_METHOD_OPTIONS]}
              onChange={setRefundMethod}
              optionStyle="radio"
            />

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
    </AppDrawer>
  );
}
