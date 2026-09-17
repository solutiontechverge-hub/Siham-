"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
} from "../../../theme/mollureHierarchy";
import { BodyText } from "../../ui/typography";
import AppTextField from "../AppTextField";
import { mollureDenseFieldInputSx } from "../mollureFormSx";

export type CalendarDurationInputProps = {
  label: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  helperText?: string;
  disabled?: boolean;
  hoursUnit?: string;
  minutesUnit?: string;
  /** Pad to 2 digits on every keystroke (settings panel). */
  pad?: boolean;
};

export function CalendarDurationInput({
  label,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  helperText,
  disabled,
  hoursUnit = "h",
  minutesUnit = "min",
  pad = false,
}: CalendarDurationInputProps) {
  const m = useTheme().palette.mollure;

  const sanitize = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    return pad ? digits.padStart(2, "0") : digits;
  };

  return (
    <Box>
      <BodyText sx={{ ...mollureBodySx(m.navy), mb: 0.85 }}>{label}</BodyText>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <AppTextField
          value={hours}
          onChange={(e) => onHoursChange(sanitize(e.target.value))}
          disabled={disabled}
          inputProps={{
            inputMode: "numeric",
            maxLength: 2,
            "aria-label": `${label} hours`,
          }}
          sx={{ ...mollureDenseFieldInputSx, flex: 1, minWidth: 0 }}
        />
        <BodyText sx={mollureBodyMutedSx(m.navy)}>{hoursUnit}</BodyText>
        <AppTextField
          value={minutes}
          onChange={(e) => onMinutesChange(sanitize(e.target.value))}
          disabled={disabled}
          inputProps={{
            inputMode: "numeric",
            maxLength: 2,
            "aria-label": `${label} minutes`,
          }}
          sx={{ ...mollureDenseFieldInputSx, flex: 1, minWidth: 0 }}
        />
        <BodyText sx={mollureBodyMutedSx(m.navy)}>{minutesUnit}</BodyText>
      </Stack>
      {helperText ? (
        <BodyText
          sx={{
            mt: 1,
            fontSize: 11.5,
            color: alpha(m.navy, 0.45),
            lineHeight: 1.45,
          }}
        >
          {helperText}
        </BodyText>
      ) : null}
    </Box>
  );
}

export function CalendarRulesLocationCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 2,
        py: 1.75,
      }}
    >
      <BodyText sx={mollureLabelSx(m.navy, { fontSize: 13.5, mb: 1.5 })}>
        {title}
      </BodyText>
      {children}
    </Box>
  );
}
