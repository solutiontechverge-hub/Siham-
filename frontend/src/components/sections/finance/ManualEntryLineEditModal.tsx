"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import MollureFormField from "../../common/MollureFormField";
import AppModal from "../../common/AppModal";
import { ModalCancelApplyFooter } from "../../common/FinanceDrawerFooter";
import type { ManualEntryLine } from "./manualEntry.data";

type ManualEntryLineEditModalProps = {
  open: boolean;
  line: ManualEntryLine | null;
  onClose: () => void;
  onSave: (next: ManualEntryLine) => void;
};

export default function ManualEntryLineEditModal({
  open,
  line,
  onClose,
  onSave,
}: ManualEntryLineEditModalProps) {
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [unitPrice, setUnitPrice] = React.useState("0");

  React.useEffect(() => {
    if (!line) return;
    setName(line.name);
    setQuantity(String(line.quantity));
    setUnitPrice(String(line.unitPrice));
  }, [line]);

  const handleSave = () => {
    if (!line) return;
    const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const price = Math.max(
      0,
      Number.parseFloat(unitPrice.replace(",", ".")) || 0,
    );
    onSave({
      ...line,
      name: name.trim() || line.name,
      quantity: qty,
      unitPrice: price,
    });
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={line?.kind === "product" ? "Edit Product" : "Edit Item"}
      maxWidth="xs"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={handleSave}
          primaryLabel="Save"
          buttonSx={{}}
        />
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <MollureFormField
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          inputProps={{ min: 1 }}
          fullWidth
        />
        <MollureFormField
          label="Unit price (€)"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          fullWidth
        />
      </Stack>
    </AppModal>
  );
}
