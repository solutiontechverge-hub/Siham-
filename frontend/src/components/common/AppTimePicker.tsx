"use client";

import AppButton from "./AppButton";
import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Box, ButtonBase, Popover, Stack, Typography } from "@mui/material";
import {
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material/styles";

export type AppTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minuteStep?: number;
  sx?: SxProps<Theme>;
};

export type AppTimePanelProps = {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
  compact?: boolean;
  minuteStep?: number;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);

function buildMinuteOptions(step = 1): number[] {
  const safeStep = Math.min(60, Math.max(1, Math.floor(step)));
  const values: number[] = [];
  for (let minute = 0; minute < 60; minute += safeStep) {
    values.push(minute);
  }
  return values;
}

export function formatTimeDisplay(value: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseTimeValue(value: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour: 9, minute: 0 };
  }
  const [hour, minute] = value.split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 9,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

function toTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function nearestMinuteOption(minute: number, options: readonly number[]) {
  return options.reduce((closest, current) =>
    Math.abs(current - minute) < Math.abs(closest - minute) ? current : closest,
  );
}

function TimeWheelColumn({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const m = useTheme().palette.mollure;
  const itemH = 36;
  const listRef = React.useRef<HTMLDivElement>(null);
  const scrollFrameRef = React.useRef<number | null>(null);

  const scrollToValue = React.useCallback(
    (value: number, behavior: ScrollBehavior = "auto") => {
      const el = listRef.current;
      if (!el) return;
      const index = values.indexOf(value);
      if (index < 0) return;
      el.scrollTo({ top: index * itemH, behavior });
    },
    [itemH, values],
  );

  React.useEffect(() => {
    scrollToValue(selected);
  }, [selected, scrollToValue]);

  const handleScroll = () => {
    if (scrollFrameRef.current != null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      const index = Math.min(
        values.length - 1,
        Math.max(0, Math.round(el.scrollTop / itemH)),
      );
      const next = values[index];
      if (next != null && next !== selected) {
        onSelect(next);
      }
    });
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          color: alpha(m.navy, 0.45),
          mb: 0.75,
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          position: "relative",
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "50%",
            height: itemH,
            transform: "translateY(-50%)",
            borderRadius: "8px",
            bgcolor: alpha(m.teal, 0.1),
            border: `1px solid ${alpha(m.teal, 0.18)}`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <Box
          ref={listRef}
          onScroll={handleScroll}
          sx={{
            height: itemH * 5,
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            position: "relative",
            zIndex: 2,
            "&::-webkit-scrollbar": { width: 4 },
          }}
        >
          <Box sx={{ height: itemH * 2 }} />
          {values.map((value) => {
            const active = selected === value;
            return (
              <Box
                key={value}
                onClick={() => {
                  onSelect(value);
                  scrollToValue(value, "smooth");
                }}
                sx={{
                  height: itemH,
                  scrollSnapAlign: "center",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  color: active ? m.teal : alpha(m.navy, 0.55),
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {String(value).padStart(2, "0")}
              </Box>
            );
          })}
          <Box sx={{ height: itemH * 2 }} />
        </Box>
      </Box>
    </Box>
  );
}

export function AppTimePanel({
  value,
  onChange,
  onDone,
  compact = false,
  minuteStep = 1,
}: AppTimePanelProps) {
  const m = useTheme().palette.mollure;
  const parsed = parseTimeValue(value);
  const minuteOptions = React.useMemo(
    () => buildMinuteOptions(minuteStep),
    [minuteStep],
  );
  const [hour, setHour] = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(() =>
    nearestMinuteOption(parsed.minute, minuteOptions),
  );

  React.useEffect(() => {
    const next = parseTimeValue(value);
    setHour(next.hour);
    setMinute(nearestMinuteOption(next.minute, minuteOptions));
  }, [minuteOptions, value]);

  const applyTime = (nextHour: number, nextMinute: number) => {
    const safeMinute = nearestMinuteOption(nextMinute, minuteOptions);
    setHour(nextHour);
    setMinute(safeMinute);
    onChange(toTimeValue(nextHour, safeMinute));
  };

  return (
    <Box sx={{ width: compact ? "100%" : 280, bgcolor: "#fff" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.75,
          py: 1.25,
          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
          bgcolor: alpha(m.teal, 0.04),
          gap: 0.75,
        }}
      >
        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
        <Typography
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: 800,
            color: alpha(m.navy, 0.82),
          }}
        >
          {formatTimeDisplay(toTimeValue(hour, minute)) || "Select time"}
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Stack direction="row" spacing={1}>
          <TimeWheelColumn
            label="Hour"
            values={HOUR_OPTIONS}
            selected={hour}
            onSelect={(nextHour) => applyTime(nextHour, minute)}
          />
          <TimeWheelColumn
            label="Minute"
            values={minuteOptions}
            selected={minute}
            onSelect={(nextMinute) => applyTime(hour, nextMinute)}
          />
        </Stack>

        {onDone ? (
          <AppButton
            tone="primary"
            fullWidth
            onClick={onDone}
            sx={{
              mt: 1.25,
            }}
          >
            Done
          </AppButton>
        ) : null}
      </Box>
    </Box>
  );
}

export default function AppTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select time",
  disabled = false,
  fullWidth = true,
  minuteStep = 1,
  sx,
}: AppTimePickerProps) {
  const m = useTheme().palette.mollure;
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const closePicker = () => setAnchor(null);

  return (
    <>
      {label ? (
        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: alpha(m.navy, 0.9),
            lineHeight: 1.25,
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      ) : null}
      <ButtonBase
        disabled={disabled}
        onClick={(e) => !disabled && setAnchor(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: fullWidth ? "100%" : "auto",
          minHeight: 44,
          px: 1.5,
          py: 1.1,
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.14)}`,
          bgcolor: disabled ? alpha(m.navy, 0.04) : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "border-color 0.15s",
          "&:hover": { borderColor: disabled ? alpha(m.navy, 0.14) : m.teal },
          "&:focus-visible": {
            outline: `2px solid ${m.teal}`,
            outlineOffset: 2,
          },
          ...sx,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: value ? 700 : 500,
            color: value ? alpha(m.navy, 0.78) : alpha(m.navy, 0.42),
            userSelect: "none",
          }}
        >
          {value ? formatTimeDisplay(value) : placeholder}
        </Typography>
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={closePicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 0.75,
            borderRadius: "14px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 16px 40px rgba(16, 35, 63, 0.13)",
            overflow: "hidden",
            bgcolor: "#fff",
          },
        }}
      >
        <AppTimePanel
          compact
          value={value}
          onChange={onChange}
          onDone={closePicker}
          minuteStep={minuteStep}
        />
      </Popover>
    </>
  );
}
