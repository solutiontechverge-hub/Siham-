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
  /** Atomic hours+minutes update (used when enforcing minTotalMinutes). */
  onDurationChange?: (hours: string, minutes: string) => void;
  helperText?: string;
  disabled?: boolean;
  hoursUnit?: string;
  minutesUnit?: string;
  /** Pad to 2 digits on every keystroke (settings panel). */
  pad?: boolean;
  /** Floor total duration on blur (e.g. DL interval min 5). */
  minTotalMinutes?: number;
};

export function CalendarDurationInput({
  label,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  onDurationChange,
  helperText,
  disabled,
  hoursUnit = "h",
  minutesUnit = "min",
  pad = false,
  minTotalMinutes,
}: CalendarDurationInputProps) {
  const m = useTheme().palette.mollure;
  const hoursRef = React.useRef(hours);
  const minutesRef = React.useRef(minutes);
  hoursRef.current = hours;
  minutesRef.current = minutes;

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const sanitize = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    return pad ? digits.padStart(2, "0") : digits;
  };

  const handleBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef.current?.contains(next)) return;
    if (minTotalMinutes == null || minTotalMinutes <= 0) return;
    const h = Number.parseInt(String(hoursRef.current ?? ""), 10);
    const min = Number.parseInt(String(minutesRef.current ?? ""), 10);
    const total =
      (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(min) ? min : 0);
    if (total >= minTotalMinutes) return;
    const nextHours = String(Math.floor(minTotalMinutes / 60));
    const nextMinutes = String(minTotalMinutes % 60);
    hoursRef.current = nextHours;
    minutesRef.current = nextMinutes;
    if (onDurationChange) {
      onDurationChange(nextHours, nextMinutes);
      return;
    }
    onHoursChange(nextHours);
    onMinutesChange(nextMinutes);
  };

  return (
    <Box ref={rootRef}>
      <BodyText sx={{ ...mollureBodySx(m.navy), mb: 0.85 }}>{label}</BodyText>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <AppTextField
          value={hours}
          onChange={(e) => {
            const next = sanitize(e.target.value);
            hoursRef.current = next;
            onHoursChange(next);
          }}
          onBlur={handleBlur}
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
          onChange={(e) => {
            const next = sanitize(e.target.value);
            minutesRef.current = next;
            onMinutesChange(next);
          }}
          onBlur={handleBlur}
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
