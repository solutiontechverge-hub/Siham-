"use client";

import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";
import * as React from "react";
import { InputAdornment, MenuItem, Stack } from "@mui/material";
import MollureFormField from "../MollureFormField";
import AppModal from "../AppModal";
import type { BookingServicePriceType } from "../../../data/bookingServiceEdit.data";
import { BOOKING_CATALOG_PRICE_TYPE_OPTIONS } from "../../../data/bookingUniqueItem.data";
import { sanitizeDecimalInput } from "../../../lib/field-input";

export type BookingServicePriceValue = {
  priceType: BookingServicePriceType;
  amount: number;
};

type BookingServicePriceModalProps = {
  open: boolean;
  initialValue: BookingServicePriceValue | null;
  onClose: () => void;
  onApply: (price: BookingServicePriceValue) => void;
};

export default function BookingServicePriceModal({
  open,
  initialValue,
  onClose,
  onApply,
}: BookingServicePriceModalProps) {
  const [priceType, setPriceType] =
    React.useState<BookingServicePriceType>("fixed");
  const [amount, setAmount] = React.useState("0");

  React.useEffect(() => {
    if (!open) return;
    setPriceType(initialValue?.priceType ?? "fixed");
    setAmount(String(initialValue?.amount ?? 0));
  }, [initialValue, open]);

  const handleApply = () => {
    const parsed = Math.max(
      0,
      Number.parseFloat(amount.replace(",", ".")) || 0,
    );
    onApply({ priceType, amount: parsed });
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Price"
      maxWidth="xs"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={handleApply}
          buttonSx={{}}
          spacing={1}
        />
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Price type"
          select
          value={priceType}
          onChange={(e) =>
            setPriceType(e.target.value as BookingServicePriceType)
          }
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
        >
          {BOOKING_CATALOG_PRICE_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </MollureFormField>

        <MollureFormField
          label="Price"
          value={amount}
          onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">€</InputAdornment>
            ),
            endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
            inputMode: "decimal",
          }}
        />
      </Stack>
    </AppModal>
  );
}
