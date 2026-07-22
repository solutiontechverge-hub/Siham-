"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardDoubleArrowLeftRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import { Box, ButtonBase, IconButton, Popover } from "@mui/material";
import { alpha, useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

export type AppDatePickerProps = {
  value: string; // YYYY-MM-DD or ""
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  fullWidth?: boolean;
  name?: string;
  sx?: SxProps<Theme>;
};

export type AppCalendarPanelProps = {
  value: string;
  onChange: (isoDate: string) => void;
  min?: string;
  max?: string;
  /** Called after a day is picked (e.g. close parent popover) */
  onDaySelect?: () => void;
  compact?: boolean;
  daySx?: (iso: string) => Record<string, unknown> | undefined;
};

type PanelView = "days" | "months" | "years";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const YEARS_PER_PAGE = 12;

export function normalizeDateToIso(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(raw.trim());
  if (slash) {
    const mm = Number(slash[1]);
    const dd = Number(slash[2]);
    const yy = Number(slash[3]);
    const yyyy = yy < 100 ? 2000 + yy : yy;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return "";
}

function formatDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function monthFromValue(value: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, mo] = value.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  }
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

export function AppCalendarPanel({ value, onChange, min, max, onDaySelect, compact = false, daySx }: AppCalendarPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [displayMonth, setDisplayMonth] = React.useState<Date>(() => monthFromValue(value));
  const [panelView, setPanelView] = React.useState<PanelView>("days");
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const y = monthFromValue(value).getFullYear();
    return Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  });

  React.useEffect(() => {
    if (value) {
      const next = monthFromValue(value);
      setDisplayMonth(next);
      setYearPageStart(Math.floor(next.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE);
    }
  }, [value]);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const { firstDay, daysInMonth } = buildCalendarCells(year, month);
  const monthName = displayMonth.toLocaleDateString("en-US", { month: "long" });

  function isoOf(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isDayDisabled(day: number) {
    const iso = isoOf(day);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function isMonthDisabled(monthIndex: number) {
    const startIso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const endDay = new Date(year, monthIndex + 1, 0).getDate();
    const endIso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    if (min && endIso < min) return true;
    if (max && startIso > max) return true;
    return false;
  }

  function isYearDisabled(yearValue: number) {
    const startIso = `${yearValue}-01-01`;
    const endIso = `${yearValue}-12-31`;
    if (min && endIso < min) return true;
    if (max && startIso > max) return true;
    return false;
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const yearOptions = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i);
  const yearPageEnd = yearPageStart + YEARS_PER_PAGE - 1;
  const dayCellH = compact ? 30 : 36;
  const monthCellH = compact ? 34 : 40;

  const headerBtnSx = {
    p: 0,
    border: 0,
    bgcolor: "transparent",
    cursor: "pointer",
    borderRadius: "6px",
    px: 0.4,
    "&:hover": { bgcolor: alpha(m.teal, 0.08) },
  } as const;

  return (
    <Box sx={{ width: compact ? "100%" : 310, bgcolor: "#fff" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.75,
          py: 1.35,
          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
          bgcolor: alpha(m.navy, 0.025),
          gap: 0.5,
        }}
      >
        <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: m.teal, flexShrink: 0 }} />

        {panelView === "days" && (
          <>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.35, minWidth: 0 }}>
              <BodyText
                component="button"
                type="button"
                onClick={() => setPanelView("months")}
                sx={{ ...headerBtnSx, fontSize: compact ? 13 : 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}
              >
                {monthName}
              </BodyText>
              <BodyText
                component="button"
                type="button"
                onClick={() => {
                  setYearPageStart(Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
                  setPanelView("years");
                }}
                sx={{ ...headerBtnSx, fontSize: compact ? 13 : 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}
              >
                {year}
              </BodyText>
            </Box>
            <IconButton
              size="small"
              onClick={() => setDisplayMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
              sx={{ width: 28, height: 28, borderRadius: "8px", color: alpha(m.navy, 0.6) }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setDisplayMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
              sx={{ width: 28, height: 28, borderRadius: "8px", color: alpha(m.navy, 0.6) }}
            >
              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}

        {panelView === "months" && (
          <>
            <BodyText sx={{ flex: 1, fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>Select month</BodyText>
            <BodyText
              component="button"
              type="button"
              onClick={() => setPanelView("days")}
              sx={{ ...headerBtnSx, fontSize: 12, fontWeight: 800, color: m.teal, textDecoration: "underline" }}
            >
              Back
            </BodyText>
          </>
        )}

        {panelView === "years" && (
          <>
            <BodyText sx={{ flex: 1, fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
              {yearPageStart} – {yearPageEnd}
            </BodyText>
            <IconButton
              size="small"
              onClick={() => setYearPageStart((p) => p - YEARS_PER_PAGE)}
              sx={{ width: 28, height: 28, borderRadius: "8px", color: alpha(m.navy, 0.6) }}
            >
              <KeyboardDoubleArrowLeftRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setYearPageStart((p) => p + YEARS_PER_PAGE)}
              sx={{ width: 28, height: 28, borderRadius: "8px", color: alpha(m.navy, 0.6) }}
            >
              <KeyboardDoubleArrowRightRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}
      </Box>

      <Box sx={{ px: 1.5, pt: 1.25, pb: 1.5 }}>
        {panelView === "days" && (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 0.5 }}>
              {DAY_LABELS.map((d, i) => (
                <BodyText
                  key={`${d}-${i}`}
                  sx={{ fontSize: compact ? 10.5 : 11.5, fontWeight: 900, color: alpha(m.navy, 0.45), textAlign: "center", py: 0.5 }}
                >
                  {d}
                </BodyText>
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
              {cells.map((day, idx) => {
                if (day === null) return <Box key={`pad-${idx}`} sx={{ height: dayCellH }} />;
                const iso = isoOf(day);
                const selected = iso === value;
                const off = isDayDisabled(day);
                const todayIso = new Date().toISOString().slice(0, 10);
                const isToday = iso === todayIso;
                const isPast = !off && iso < todayIso;
                const extraDaySx = daySx?.(iso) ?? {};
                return (
                  <ButtonBase
                    key={iso}
                    disabled={off}
                    onClick={() => {
                      onChange(iso);
                      onDaySelect?.();
                    }}
                    sx={{
                      height: dayCellH,
                      borderRadius: compact ? "999px" : "9px",
                      display: "grid",
                      placeItems: "center",
                      fontSize: compact ? 11.5 : 12.5,
                      fontWeight: selected ? 900 : isToday ? 900 : 700,
                      color: off
                        ? alpha(m.navy, 0.22)
                        : selected
                          ? "#fff"
                          : isPast
                            ? alpha(m.navy, 0.32)
                            : isToday
                              ? m.teal
                              : alpha(m.navy, 0.72),
                      bgcolor: selected ? m.teal : "transparent",
                      border: isToday && !selected ? `1.5px solid ${alpha(m.teal, 0.4)}` : "none",
                      cursor: off ? "not-allowed" : "pointer",
                      "&.Mui-disabled": { pointerEvents: "auto" },
                      "&:hover": { bgcolor: off ? "transparent" : selected ? m.tealDark : alpha(m.teal, 0.09) },
                      ...extraDaySx,
                    }}
                  >
                    {day}
                  </ButtonBase>
                );
              })}
            </Box>
          </>
        )}

        {panelView === "months" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
            {MONTH_LABELS.map((label, idx) => {
              const selected = idx === month;
              const off = isMonthDisabled(idx);
              return (
                <ButtonBase
                  key={label}
                  disabled={off}
                  onClick={() => {
                    setDisplayMonth(new Date(year, idx, 1));
                    setPanelView("days");
                  }}
                  sx={{
                    height: monthCellH,
                    borderRadius: "9px",
                    fontSize: 12.5,
                    fontWeight: selected ? 900 : 700,
                    color: off ? alpha(m.navy, 0.22) : selected ? "#fff" : alpha(m.navy, 0.72),
                    bgcolor: selected ? m.teal : "transparent",
                    border: `1px solid ${selected ? alpha(m.teal, 0.2) : alpha(m.navy, 0.08)}`,
                    "&:hover": { bgcolor: off ? "transparent" : selected ? m.tealDark : alpha(m.teal, 0.09) },
                  }}
                >
                  {label}
                </ButtonBase>
              );
            })}
          </Box>
        )}

        {panelView === "years" && (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
              {yearOptions.map((yearValue) => {
                const selected = yearValue === year;
                const off = isYearDisabled(yearValue);
                return (
                  <ButtonBase
                    key={yearValue}
                    disabled={off}
                    onClick={() => {
                      setDisplayMonth(new Date(yearValue, month, 1));
                      setPanelView("days");
                    }}
                    sx={{
                      height: monthCellH,
                      borderRadius: "9px",
                      fontSize: 12.5,
                      fontWeight: selected ? 900 : 700,
                      color: off ? alpha(m.navy, 0.22) : selected ? "#fff" : alpha(m.navy, 0.72),
                      bgcolor: selected ? m.teal : "transparent",
                      border: `1px solid ${selected ? alpha(m.teal, 0.2) : alpha(m.navy, 0.08)}`,
                      "&:hover": { bgcolor: off ? "transparent" : selected ? m.tealDark : alpha(m.teal, 0.09) },
                    }}
                  >
                    {yearValue}
                  </ButtonBase>
                );
              })}
            </Box>
            <BodyText
              component="button"
              type="button"
              onClick={() => setPanelView("days")}
              sx={{
                mt: 1.25,
                p: 0,
                border: 0,
                bgcolor: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                color: m.teal,
                textDecoration: "underline",
                display: "block",
                mx: "auto",
                "&:hover": { color: m.tealDark },
              }}
            >
              Back to calendar
            </BodyText>
          </>
        )}
      </Box>
    </Box>
  );
}

export default function AppDatePicker({
  value,
  onChange,
  label,
  placeholder = "DD/MM/YYYY",
  min,
  max,
  disabled = false,
  fullWidth = false,
  name,
  sx,
}: AppDatePickerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  function closePicker() {
    setAnchor(null);
  }

  return (
    <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
      {label ? (
        <BodyText
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
        </BodyText>
      ) : null}
      <ButtonBase
        disabled={disabled}
        onClick={(e) => !disabled && setAnchor(e.currentTarget)}
        name={name}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: fullWidth ? "100%" : "auto",
          minWidth: 160,
          height: 44,
          px: 1.5,
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.18)}`,
          bgcolor: disabled ? alpha(m.navy, 0.04) : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s",
          "&:hover": { borderColor: disabled ? alpha(m.navy, 0.18) : m.teal },
          "&:focus-visible": { outline: `2px solid ${m.teal}`, outlineOffset: 2 },
          ...sx,
        }}
      >
        <BodyText
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: value ? alpha(m.navy, 0.75) : alpha(m.navy, 0.35),
            userSelect: "none",
            flex: 1,
            textAlign: "left",
          }}
        >
          {value ? formatDisplay(value) : placeholder}
        </BodyText>
        <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: open ? m.teal : alpha(m.navy, 0.4), ml: 1, flexShrink: 0 }} />
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
        <AppCalendarPanel value={value} onChange={onChange} min={min} max={max} onDaySelect={closePicker} />
      </Popover>
    </Box>
  );
}
