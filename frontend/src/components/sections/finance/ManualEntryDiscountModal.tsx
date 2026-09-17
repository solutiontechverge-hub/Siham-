"use client";

import * as React from "react";
import { InputAdornment, MenuItem, Stack } from "@mui/material";
import MollureFormField from "../../common/MollureFormField";
import AppModal from "../../common/AppModal";
import { ModalCancelApplyFooter } from "../../common/FinanceDrawerFooter";
import { BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS } from "../../../data/bookingUniqueItem.data";
import type {
  ManualEntryDiscount,
  ManualEntryDiscountType,
} from "./manualEntry.data";

type ManualEntryDiscountModalProps = {
  open: boolean;
  initialValue: ManualEntryDiscount | null;
  onClose: () => void;
  onApply: (discount: ManualEntryDiscount) => void;
};

export default function ManualEntryDiscountModal({
  open,
  initialValue,
  onClose,
  onApply,
}: ManualEntryDiscountModalProps) {
  const [discountType, setDiscountType] =
    React.useState<ManualEntryDiscountType>("fixed");
  const [amount, setAmount] = React.useState("0");

  React.useEffect(() => {
    if (!open) return;
    setDiscountType(initialValue?.type ?? "fixed");
    setAmount(String(initialValue?.amount ?? 0));
  }, [initialValue, open]);

  const handleApply = () => {
    const parsed = Math.max(
      0,
      Number.parseFloat(amount.replace(",", ".")) || 0,
    );
    onApply({ type: discountType, amount: parsed });
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Discount"
      maxWidth="xs"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={handleApply}
          primaryLabel="Apply"
          buttonSx={{}}
        />
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Discount type"
          select
          value={discountType}
          onChange={(e) =>
            setDiscountType(e.target.value as ManualEntryDiscountType)
          }
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
        >
          {BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </MollureFormField>

        <MollureFormField
          label="Discount Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
          InputProps={
            discountType === "fixed"
              ? {
                  startAdornment: (
                    <InputAdornment position="start">€</InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">EUR</InputAdornment>
                  ),
                  inputMode: "decimal",
                }
              : {
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                  inputMode: "decimal",
                }
          }
        />
      </Stack>
    </AppModal>
  );
}
