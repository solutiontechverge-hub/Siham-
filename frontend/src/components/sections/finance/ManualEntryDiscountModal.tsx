"use client";

import * as React from "react";
import { Button, InputAdornment, MenuItem, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import MollureModal from "../../common/MollureModal";
import type { ManualEntryDiscount, ManualEntryDiscountType } from "./manualEntry.data";

type ManualEntryDiscountModalProps = {
  open: boolean;
  initialValue: ManualEntryDiscount | null;
  onClose: () => void;
  onApply: (discount: ManualEntryDiscount) => void;
};

const DISCOUNT_TYPE_OPTIONS: Array<{ value: ManualEntryDiscountType; label: string }> = [
  { value: "fixed", label: "Fixed discount" },
  { value: "percentage", label: "Percentage discount" },
];

export default function ManualEntryDiscountModal({
  open,
  initialValue,
  onClose,
  onApply,
}: ManualEntryDiscountModalProps) {
  const m = useTheme().palette.mollure;
  const [discountType, setDiscountType] = React.useState<ManualEntryDiscountType>("fixed");
  const [amount, setAmount] = React.useState("0");

  React.useEffect(() => {
    if (!open) return;
    setDiscountType(initialValue?.type ?? "fixed");
    setAmount(String(initialValue?.amount ?? 0));
  }, [initialValue, open]);

  const handleApply = () => {
    const parsed = Math.max(0, Number.parseFloat(amount.replace(",", ".")) || 0);
    onApply({ type: discountType, amount: parsed });
    onClose();
  };

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title="Add Discount"
      maxWidth="xs"
      footer={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
              bgcolor: "#fff",
              height: 36,
              px: 2.25,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleApply}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 900,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
              height: 36,
              px: 2.25,
            }}
          >
            Apply
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Discount type"
          select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as ManualEntryDiscountType)}
          fullWidth
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
        >
          {DISCOUNT_TYPE_OPTIONS.map((option) => (
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
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
          InputProps={
            discountType === "fixed"
              ? {
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
                  inputMode: "decimal",
                }
              : {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputMode: "decimal",
                }
          }
        />
      </Stack>
    </MollureModal>
  );
}
