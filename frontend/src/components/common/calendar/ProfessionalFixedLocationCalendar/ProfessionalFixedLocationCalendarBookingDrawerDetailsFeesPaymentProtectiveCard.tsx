"use client";

import type { ReactNode } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import AppTextField from "../../AppTextField";
import { mollureLabelSx } from "../../../../theme/mollureHierarchy";
import {
  clampProtectiveFeePercent,
  parsePolicyPercentCeiling,
} from "../bookingGroupAddOns";
import { sanitizeDecimalInput } from "../../../../lib/field-input";

type Props = {
  m: { navy: string; teal: string };
  title: string;
  notice: ReactNode;
  removeAriaLabel: string;
  canMutateDrawerContents: boolean;
  beginExistingBookingEdit: () => void;
  percent: string;
  percentCeiling: string;
  percentDefault: string | undefined;
  amount: string | number;
  onRemove: () => void;
  onPercentChange: (next: string) => void;
};

/** Shared late-cancel / late-reschedule / no-show fee card shell. */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtectiveCard({
  m,
  title,
  notice,
  removeAriaLabel,
  canMutateDrawerContents,
  beginExistingBookingEdit,
  percent,
  percentCeiling,
  percentDefault,
  amount,
  onRemove,
  onPercentChange,
}: Props) {
  const ceiling = percentCeiling || percentDefault;
  return (
    <Box
      sx={{
        borderRadius: "12px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
        p: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <BodyText
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: 900,
            color: alpha(m.navy, 0.82),
          }}
        >
          {title}
        </BodyText>
        {canMutateDrawerContents ? (
          <IconButton
            size="small"
            onClick={() => {
              beginExistingBookingEdit();
              onRemove();
            }}
            sx={{ color: alpha(m.navy, 0.35) }}
            aria-label={removeAriaLabel}
          >
            <CloseRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        ) : null}
      </Stack>

      <BodyText
        sx={{
          mt: 0.5,
          fontSize: 11.5,
          fontWeight: 700,
          color: alpha(m.navy, 0.48),
          lineHeight: 1.35,
        }}
      >
        {notice}
      </BodyText>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ mt: 1.25 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ minWidth: 52 }}
        >
          <BodyText
            sx={mollureLabelSx(m.navy, {
              fontWeight: 850,
              color: alpha(m.navy, 0.62),
            })}
          >
            Fee
          </BodyText>
          <InfoOutlinedIcon sx={{ fontSize: 15, color: m.teal }} />
        </Stack>
        <AppTextField
          placeholder="%"
          value={percent}
          disabled={!canMutateDrawerContents}
          onChange={(e) => {
            beginExistingBookingEdit();
            onPercentChange(
              clampProtectiveFeePercent(
                sanitizeDecimalInput(e.target.value),
                ceiling,
              ),
            );
          }}
          inputProps={{
            inputMode: "decimal",
            max: parsePolicyPercentCeiling(ceiling),
          }}
          sx={{ width: 72, flexShrink: 0 }}
        />
        <BodyText
          sx={{
            flex: 1,
            textAlign: "right",
            fontSize: 16,
            fontWeight: 950,
            color: alpha(m.navy, 0.85),
          }}
        >
          €{amount}
        </BodyText>
      </Stack>
    </Box>
  );
}
