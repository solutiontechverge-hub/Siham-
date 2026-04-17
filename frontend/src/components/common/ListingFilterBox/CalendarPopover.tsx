"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDisplay(value: Date | null) {
  if (!value) return "";
  const y = value.getFullYear();
  const m = pad2(value.getMonth() + 1);
  const d = pad2(value.getDate());
  const hh = pad2(value.getHours());
  const mm = pad2(value.getMinutes());
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export type CalendarPopoverValue = Date | null;

type CalendarPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  value: CalendarPopoverValue;
  onChange: (next: CalendarPopoverValue) => void;
};

export default function CalendarPopover({
  anchorEl,
  open,
  onClose,
  value,
  onChange,
}: CalendarPopoverProps) {
  const tokens = useTheme().palette.mollure;
  const [viewDate, setViewDate] = React.useState<Date>(() => startOfMonth(value ?? new Date()));

  React.useEffect(() => {
    if (open) setViewDate(startOfMonth(value ?? new Date()));
  }, [open, value]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const firstWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();

  const selected = value;
  const selectedDay = selected ? new Date(selected) : null;
  const selectedHour = selected ? selected.getHours() : 9;
  const selectedMinute = selected ? selected.getMinutes() : 0;

  const dayCells: Array<Date | null> = [];
  for (let i = 0; i < firstWeekday; i++) dayCells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    dayCells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }
  while (dayCells.length % 7 !== 0) dayCells.push(null);

  const setDay = (day: Date) => {
    const next = new Date(day);
    next.setHours(clamp(selectedHour, 0, 23));
    next.setMinutes(clamp(selectedMinute, 0, 59));
    next.setSeconds(0);
    next.setMilliseconds(0);
    onChange(next);
  };

  const setTime = (hour: number, minute: number) => {
    const base = value ? new Date(value) : new Date();
    base.setHours(clamp(hour, 0, 23));
    base.setMinutes(clamp(minute, 0, 59));
    base.setSeconds(0);
    base.setMilliseconds(0);
    onChange(base);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          width: 320,
          borderRadius: 3,
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 18px 45px rgba(16, 24, 40, 0.14)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <EventRoundedIcon sx={{ color: tokens.teal, fontSize: 18 }} />
            <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 13 }}>
              {monthStart.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: tokens.border }} />

      <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <Typography
              key={d}
              sx={{
                width: 36,
                textAlign: "center",
                fontSize: 11,
                fontWeight: 800,
                color: tokens.slate,
              }}
            >
              {d}
            </Typography>
          ))}
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.75,
          }}
        >
          {dayCells.map((cell, idx) => {
            const isSelected = cell && selectedDay ? isSameDay(cell, selectedDay) : false;
            return (
              <ButtonBase
                key={idx}
                disabled={!cell}
                onClick={() => cell && setDay(cell)}
                sx={{
                  width: 36,
                  height: 34,
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 700,
                  color: isSelected ? "#fff" : tokens.navy,
                  bgcolor: isSelected ? tokens.teal : "transparent",
                  border: `1px solid ${isSelected ? tokens.teal : "transparent"}`,
                  "&:hover": cell
                    ? {
                        bgcolor: isSelected ? tokens.tealDark : "rgba(33, 184, 191, 0.10)",
                      }
                    : undefined,
                }}
              >
                {cell ? cell.getDate() : ""}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ borderColor: tokens.border }} />

      <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff" }}>
        <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1 }}>
          <AccessTimeRoundedIcon sx={{ color: tokens.teal, fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 13 }}>
            Time
          </Typography>
          <Typography sx={{ ml: "auto", fontSize: 12, color: tokens.slate }}>
            {formatDisplay(value)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: tokens.slate, mb: 0.75 }}>
              Hour
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 0.75,
              }}
            >
              {hours.map((h) => {
                const active = selectedHour === h;
                return (
                  <ButtonBase
                    key={h}
                    onClick={() => setTime(h, selectedMinute)}
                    sx={{
                      height: 30,
                      borderRadius: 2,
                      fontSize: 12,
                      fontWeight: 800,
                      color: active ? "#fff" : tokens.navy,
                      bgcolor: active ? tokens.teal : "rgba(52, 74, 102, 0.04)",
                      border: `1px solid ${active ? tokens.teal : "rgba(52, 74, 102, 0.06)"}`,
                      "&:hover": { bgcolor: active ? tokens.tealDark : "rgba(33, 184, 191, 0.10)" },
                    }}
                  >
                    {pad2(h)}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ width: 92 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: tokens.slate, mb: 0.75 }}>
              Min
            </Typography>
            <Stack spacing={0.75}>
              {minutes.map((m) => {
                const active = selectedMinute === m;
                return (
                  <ButtonBase
                    key={m}
                    onClick={() => setTime(selectedHour, m)}
                    sx={{
                      height: 30,
                      borderRadius: 2,
                      fontSize: 12,
                      fontWeight: 800,
                      color: active ? "#fff" : tokens.navy,
                      bgcolor: active ? tokens.teal : "rgba(52, 74, 102, 0.04)",
                      border: `1px solid ${active ? tokens.teal : "rgba(52, 74, 102, 0.06)"}`,
                      "&:hover": { bgcolor: active ? tokens.tealDark : "rgba(33, 184, 191, 0.10)" },
                    }}
                  >
                    {pad2(m)}
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            onClick={() => {
              onChange(null);
              onClose();
            }}
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              borderColor: tokens.border,
              color: tokens.navy,
              "&:hover": { borderColor: tokens.inputBorderHover, bgcolor: "rgba(52, 74, 102, 0.03)" },
            }}
          >
            Clear
          </Button>
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: tokens.teal,
              "&:hover": { bgcolor: tokens.tealDark },
            }}
          >
            Done
          </Button>
        </Stack>
      </Box>
    </Popover>
  );
}

