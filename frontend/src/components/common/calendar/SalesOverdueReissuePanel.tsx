"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import MollureFormField from "../MollureFormField";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import { addDaysIso, tomorrowIso, toIsoLocalDate } from "./calendar.utils";
import { durationToDays } from "./buildSalesOverviewCards.format";
import type { FinanceInvoicePaymentTerms } from "../finance-documents/useFinanceInvoiceSettings";
import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";
import { SALES_OVERVIEW_COPY } from "./salesOverview.data";

type Props = {
  unpaidAmount: number;
  paymentTerms?: Pick<
    FinanceInvoicePaymentTerms,
    | "firstReissueDueValue"
    | "firstReissueDueUnit"
    | "firstReissuePenaltyValue"
    | "firstReissuePenaltyUnit"
    | "secondReissueDueValue"
    | "secondReissueDueUnit"
    | "secondReissuePenaltyValue"
    | "secondReissuePenaltyUnit"
  >;
  alreadyReissued?: boolean;
  onConfirm: (payload: {
    penaltyType: "fixed" | "percentage";
    penaltyValue: number;
    penaltyAmount: number;
    dueDate: string;
  }) => void;
  onCancel?: () => void;
};

function defaultsFromTerms(
  terms: Props["paymentTerms"],
  alreadyReissued: boolean,
) {
  const unitRaw = String(
    (alreadyReissued
      ? terms?.secondReissuePenaltyUnit
      : terms?.firstReissuePenaltyUnit) ?? "%",
  );
  const penaltyType: "fixed" | "percentage" =
    unitRaw.includes("%") || unitRaw.toLowerCase().includes("percent")
      ? "percentage"
      : "fixed";
  const penaltyValue = String(
    (alreadyReissued
      ? terms?.secondReissuePenaltyValue
      : terms?.firstReissuePenaltyValue) ?? "0",
  );
  const dueDays = durationToDays(
    alreadyReissued ? terms?.secondReissueDueValue : terms?.firstReissueDueValue,
    alreadyReissued ? terms?.secondReissueDueUnit : terms?.firstReissueDueUnit,
  );
  const dueDate = addDaysIso(toIsoLocalDate(new Date()), Math.max(1, dueDays));
  return { penaltyType, penaltyValue, dueDate };
}

/** Inline past-due reissue form (Sales Overview) — matches overdue mock. */
export default function SalesOverdueReissuePanel({
  unpaidAmount,
  paymentTerms,
  alreadyReissued = false,
  onConfirm,
  onCancel,
}: Props) {
  const m = useTheme().palette.mollure;
  const alertColor = "#E85D5D";
  const [alertDismissed, setAlertDismissed] = React.useState(false);
  const seeded = defaultsFromTerms(paymentTerms, alreadyReissued);
  const [penaltyType, setPenaltyType] = React.useState<"fixed" | "percentage">(
    seeded.penaltyType,
  );
  const [penaltyValue, setPenaltyValue] = React.useState(seeded.penaltyValue);
  const [dueDate, setDueDate] = React.useState(seeded.dueDate);

  React.useEffect(() => {
    const next = defaultsFromTerms(paymentTerms, alreadyReissued);
    setPenaltyType(next.penaltyType);
    setPenaltyValue(next.penaltyValue);
    setDueDate(next.dueDate);
    setAlertDismissed(false);
  }, [paymentTerms, alreadyReissued, unpaidAmount]);

  const trimmed = String(penaltyValue ?? "").trim().replace(",", ".");
  const parsed = Number.parseFloat(trimmed);
  const penaltyValid = trimmed !== "" && Number.isFinite(parsed) && parsed >= 0;
  const safeParsed = penaltyValid ? Math.max(0, parsed) : 0;
  const penaltyAmount =
    penaltyType === "percentage"
      ? Math.round(((unpaidAmount * safeParsed) / 100 + Number.EPSILON) * 100) /
        100
      : Math.round((safeParsed + Number.EPSILON) * 100) / 100;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!dueDate || !penaltyValid) return;
    onConfirm({
      penaltyType,
      penaltyValue: safeParsed,
      penaltyAmount,
      dueDate,
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mb: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {!alertDismissed ? (
        <Box
          sx={{
            width: "100%",
            borderRadius: "12px",
            px: 1.35,
            py: 1.05,
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            bgcolor: alpha(alertColor, 0.1),
            border: `1px solid ${alpha(alertColor, 0.28)}`,
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 28,
              height: 28,
              borderRadius: "999px",
              bgcolor: alpha(alertColor, 0.16),
              color: alertColor,
              flexShrink: 0,
              mt: 0.1,
            }}
          >
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              ...mollureLabelSx(m.navy),
              flex: 1,
              minWidth: 0,
              lineHeight: 1.35,
              pt: 0.35,
            }}
          >
            {SALES_OVERVIEW_COPY.pastDueAlert}
          </Typography>
          <IconButton
            type="button"
            size="small"
            aria-label="Dismiss"
            onClick={() => setAlertDismissed(true)}
            sx={{
              width: 28,
              height: 28,
              color: alpha(m.navy, 0.45),
              flexShrink: 0,
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ) : null}

      <Box>
        <Typography sx={{ ...mollureLabelSx(m.navy), mb: 1 }}>
          {SALES_OVERVIEW_COPY.reissueInvoiceTitle}
        </Typography>
        <Typography sx={{ ...mollureLabelSx(alpha(m.navy, 0.7)), mb: 0.75 }}>
          Penalty
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <MollureFormField
            required
            type="number"
            inputProps={{ min: 0, step: "any" }}
            label=""
            placeholder="Percentage"
            value={penaltyValue}
            onChange={(e) => {
              setPenaltyType("percentage");
              setPenaltyValue(e.target.value);
            }}
            error={!penaltyValid}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
          <MollureFormField
            label=""
            placeholder="Auto - Amount"
            value={penaltyAmount ? penaltyAmount.toFixed(2) : ""}
            fullWidth
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha(m.navy, 0.03),
              },
            }}
          />
        </Stack>
        <Box sx={{ mt: 1.25 }}>
          <AppDatePicker
            label="Due Date"
            value={dueDate}
            min={tomorrowIso()}
            onChange={setDueDate}
            fullWidth
          />
        </Box>
      </Box>

      <ModalCancelApplyFooter
        onCancel={() => onCancel?.()}
        onPrimary={() => undefined}
        primaryLabel="Reissue"
        primaryType="submit"
        primaryDisabled={!dueDate || !penaltyValid}
        buttonSx={{}}
        stackSx={{ px: 0, py: 0 }}
        justifyContent="flex-end"
      />
    </Box>
  );
}
