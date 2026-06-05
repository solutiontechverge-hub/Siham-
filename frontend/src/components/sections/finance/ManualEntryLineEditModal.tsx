"use client";

import * as React from "react";
import { Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import MollureModal from "../../common/MollureModal";
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
  const m = useTheme().palette.mollure;
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
    const price = Math.max(0, Number.parseFloat(unitPrice.replace(",", ".")) || 0);
    onSave({ ...line, name: name.trim() || line.name, quantity: qty, unitPrice: price });
    onClose();
  };

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={line?.kind === "product" ? "Edit Product" : "Edit Item"}
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
            onClick={handleSave}
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
            Save
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
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
    </MollureModal>
  );
}
