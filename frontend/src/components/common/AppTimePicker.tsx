"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Box, Button, ButtonBase, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme, type SxProps, type Theme } from "@mui/material/styles";

export type AppTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
};

export type AppTimePanelProps = {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
  compact?: boolean;
};

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

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

export function AppTimePanel({ value, onChange, onDone, compact = false }: AppTimePanelProps) {
  const m = useTheme().palette.mollure;
  const parsed = parseTimeValue(value);
  const [hour, setHour] = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(parsed.minute);

  React.useEffect(() => {
    const next = parseTimeValue(value);
    setHour(next.hour);
    setMinute(next.minute);
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const cellH = compact ? 30 : 34;

  const applyTime = (nextHour: number, nextMinute: number) => {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange(toTimeValue(nextHour, nextMinute));
  };

  return (
    <Box sx={{ width: compact ? "100%" : 300, bgcolor: "#fff" }}>
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
        <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
          {formatTimeDisplay(toTimeValue(hour, minute)) || "Select time"}
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.45), mb: 0.75 }}>
          Hour
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 0.5,
            mb: 1.25,
            maxHeight: 168,
            overflowY: "auto",
          }}
        >
          {hours.map((h) => {
            const active = hour === h;
            return (
              <ButtonBase
                key={h}
                onClick={() => applyTime(h, minute)}
                sx={{
                  height: cellH,
                  borderRadius: "8px",
                  fontSize: compact ? 11.5 : 12,
                  fontWeight: active ? 900 : 700,
                  color: active ? "#fff" : alpha(m.navy, 0.72),
                  bgcolor: active ? m.teal : alpha(m.navy, 0.04),
                  border: `1px solid ${active ? m.teal : alpha(m.navy, 0.08)}`,
                  "&:hover": { bgcolor: active ? m.tealDark : alpha(m.teal, 0.1) },
                }}
              >
                {String(h).padStart(2, "0")}
              </ButtonBase>
            );
          })}
        </Box>

        <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.45), mb: 0.75 }}>
          Minute
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
          {MINUTE_OPTIONS.map((min) => {
            const active = minute === min;
            return (
              <ButtonBase
                key={min}
                onClick={() => applyTime(hour, min)}
                sx={{
                  height: cellH,
                  borderRadius: "8px",
                  fontSize: compact ? 11.5 : 12,
                  fontWeight: active ? 900 : 700,
                  color: active ? "#fff" : alpha(m.navy, 0.72),
                  bgcolor: active ? m.teal : alpha(m.navy, 0.04),
                  border: `1px solid ${active ? m.teal : alpha(m.navy, 0.08)}`,
                  "&:hover": { bgcolor: active ? m.tealDark : alpha(m.teal, 0.1) },
                }}
              >
                {String(min).padStart(2, "0")}
              </ButtonBase>
            );
          })}
        </Box>

        {onDone ? (
          <Button
            fullWidth
            disableElevation
            onClick={onDone}
            sx={{
              mt: 1.25,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: m.teal,
              color: "#fff",
              "&:hover": { bgcolor: m.tealDark },
            }}
          >
            Done
          </Button>
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
          "&:focus-visible": { outline: `2px solid ${m.teal}`, outlineOffset: 2 },
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
        />
      </Popover>
    </>
  );
}
