"use client";

import * as React from "react";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppDatePicker from "../../common/AppDatePicker";
import AppModal from "../../common/AppModal";
import { ModalCancelApplyFooter } from "../../common/FinanceDrawerFooter";
import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";

type TransactionDateModalProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  initialDate?: string | null;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (transactionDate: string) => void;
};

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function TransactionDateModal({
  open,
  title = "Transaction date",
  subtitle = "Enter the date this offline payment was received.",
  initialDate = null,
  confirmLabel = "Save",
  onClose,
  onConfirm,
}: TransactionDateModalProps) {
  const m = useTheme().palette.mollure;
  const [date, setDate] = React.useState(todayIso());

  React.useEffect(() => {
    if (!open) return;
    setDate(
      initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
        ? initialDate
        : todayIso(),
    );
  }, [initialDate, open]);

  const canConfirm = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(date);
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      onFormSubmit={handleConfirm}
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={handleConfirm}
          primaryLabel={confirmLabel}
          primaryDisabled={!canConfirm}
          primaryType="submit"
        />
      }
    >
      <Typography sx={{ ...mollureBodyMutedSx(m.navy), mb: 1.5 }}>
        {subtitle}
      </Typography>
      <AppDatePicker
        label="Transaction date"
        value={date}
        onChange={setDate}
        fullWidth
      />
    </AppModal>
  );
}
