"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { InputAdornment, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import MollureFormField from "../MollureFormField";
import AppModal from "../AppModal";

type SalesOverdueReissueModalProps = {
  open: boolean;
  unpaidAmount: number;
  onClose: () => void;
  onConfirm: (payload: {
    penaltyType: "fixed" | "percentage";
    penaltyValue: number;
    penaltyAmount: number;
    dueDate: string;
  }) => void;
};

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function SalesOverdueReissueModal({
  open,
  unpaidAmount,
  onClose,
  onConfirm,
}: SalesOverdueReissueModalProps) {
  const m = useTheme().palette.mollure;
  const [penaltyType, setPenaltyType] = React.useState<"fixed" | "percentage">(
    "fixed",
  );
  const [penaltyValue, setPenaltyValue] = React.useState("0");
  const [dueDate, setDueDate] = React.useState(tomorrowIso());

  React.useEffect(() => {
    if (!open) return;
    setPenaltyType("fixed");
    setPenaltyValue("0");
    setDueDate(tomorrowIso());
  }, [open]);

  const parsed = Math.max(
    0,
    Number.parseFloat(penaltyValue.replace(",", ".")) || 0,
  );
  const penaltyAmount =
    penaltyType === "percentage"
      ? Math.round(((unpaidAmount * parsed) / 100 + Number.EPSILON) * 100) / 100
      : Math.round((parsed + Number.EPSILON) * 100) / 100;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Reissue overdue invoice"
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
          <AppButton
            tone="primary"
            disabled={!dueDate}
            onClick={() =>
              onConfirm({
                penaltyType,
                penaltyValue: parsed,
                penaltyAmount,
                dueDate,
              })
            }
          >
            Reissue
          </AppButton>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ pt: 0.5 }}>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 650, color: alpha(m.navy, 0.55) }}
        >
          Unpaid amount: €{unpaidAmount.toFixed(2)}
        </Typography>
        <MollureFormField
          select
          label="Penalty type"
          value={penaltyType}
          onChange={(e) =>
            setPenaltyType(e.target.value as "fixed" | "percentage")
          }
        >
          <MenuItem value="fixed">Fixed amount (€)</MenuItem>
          <MenuItem value="percentage">Percentage (%)</MenuItem>
        </MollureFormField>
        <MollureFormField
          label={penaltyType === "percentage" ? "Penalty %" : "Penalty amount"}
          value={penaltyValue}
          onChange={(e) => setPenaltyValue(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {penaltyType === "percentage" ? "%" : "€"}
              </InputAdornment>
            ),
          }}
        />
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.7) }}
        >
          Penalty total: €{penaltyAmount.toFixed(2)}
        </Typography>
        <AppDatePicker
          label="New due date"
          value={dueDate}
          min={tomorrowIso()}
          onChange={setDueDate}
          fullWidth
        />
      </Stack>
    </AppModal>
  );
}
