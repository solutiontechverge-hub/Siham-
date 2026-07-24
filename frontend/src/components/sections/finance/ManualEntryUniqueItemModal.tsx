"use client";

import AppButton from "../../common/AppButton";
import * as React from "react";
import { Stack } from "@mui/material";
import MollureFormField from "../../common/MollureFormField";
import AppModal from "../../common/AppModal";
import type { ManualEntryLine } from "./manualEntry.data";

type ManualEntryUniqueItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (line: ManualEntryLine) => void;
};

export default function ManualEntryUniqueItemModal({
  open,
  onClose,
  onSave,
}: ManualEntryUniqueItemModalProps) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("0");
  const [vat, setVat] = React.useState("21");
  const [quantity, setQuantity] = React.useState("1");

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setPrice("0");
    setVat("21");
    setQuantity("1");
  }, [open]);

  const handleSave = () => {
    const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const unitPrice = Math.max(
      0,
      Number.parseFloat(price.replace(",", ".")) || 0,
    );
    const label = name.trim() || "Unique item";
    onSave({
      id: `unique-${Date.now()}`,
      kind: "item",
      name: `${label} (VAT ${vat}%)`,
      quantity: qty,
      unitPrice,
    });
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add unique item"
      maxWidth="xs"
      footer={
        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ px: 2.5, py: 2 }}
        >
          <AppButton tone="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton tone="primary" onClick={handleSave}>
            Add item
          </AppButton>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Product / item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <MollureFormField
          label="Price (€)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
        />
        <MollureFormField
          label="VAT (%)"
          value={vat}
          onChange={(e) => setVat(e.target.value)}
          fullWidth
        />
        <MollureFormField
          label="Number of units"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          inputProps={{ min: 1 }}
          fullWidth
        />
      </Stack>
    </AppModal>
  );
}
