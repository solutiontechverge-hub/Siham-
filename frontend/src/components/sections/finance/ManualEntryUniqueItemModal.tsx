"use client";

import * as React from "react";
import { Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import MollureModal from "../../common/MollureModal";
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
  const m = useTheme().palette.mollure;
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
    const unitPrice = Math.max(0, Number.parseFloat(price.replace(",", ".")) || 0);
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
    <MollureModal
      open={open}
      onClose={onClose}
      title="Add unique item"
      maxWidth="xs"
      footer={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSave}
            sx={{ textTransform: "none", fontWeight: 900, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
          >
            Add item
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField label="Product / item name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <MollureFormField label="Price (€)" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
        <MollureFormField label="VAT (%)" value={vat} onChange={(e) => setVat(e.target.value)} fullWidth />
        <MollureFormField
          label="Number of units"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          inputProps={{ min: 1 }}
          fullWidth
        />
      </Stack>
    </MollureModal>
  );
}
