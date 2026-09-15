"use client";

import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";
import * as React from "react";
import { InputAdornment, MenuItem, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import MollureFormField from "../MollureFormField";
import AppModal from "../AppModal";
import { tomorrowIso } from "./calendar.utils";
import { BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS } from "../../../data/bookingUniqueItem.data";
import {
  mollureBodyMutedSx,
  mollureBodySx,
} from "../../../theme/mollureHierarchy";

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
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={() =>
            onConfirm({
              penaltyType,
              penaltyValue: parsed,
              penaltyAmount,
              dueDate,
            })
          }
          primaryLabel="Reissue"
          primaryDisabled={!dueDate}
          buttonSx={{}}
          spacing={1}
        />
      }
    >
      <Stack spacing={1.5} sx={{ pt: 0.5 }}>
        <Typography sx={mollureBodyMutedSx(m.navy)}>
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
          {BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
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
        <Typography sx={mollureBodySx(m.navy)}>
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
