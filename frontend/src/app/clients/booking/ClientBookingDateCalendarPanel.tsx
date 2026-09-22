"use client";

import * as React from "react";
import AppButton from "../../../components/common/AppButton";
import {
  Box,
  ButtonBase,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export type ClientBookingDateCalendarPanelProps = {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  addMonths: (date: Date, months: number) => Date;
  addDays: (date: Date, days: number) => Date;
  isPastDay: (date: Date) => boolean;
  today0: Date;
  toISO: (date: Date) => string;
  monthPickerAnchor: HTMLElement | null;
  setMonthPickerAnchor: React.Dispatch<
    React.SetStateAction<HTMLElement | null>
  >;
  monthLabel: string;
  monthPickerYear: number;
  monthPickerMonth: number;
  setMonthYear: (year: number, month0: number) => void;
  weekDays: Array<{
    date: Date;
    key: string;
    dow: string;
    day: number;
  }>;
  isDayNotAvailable: (date: Date) => boolean;
  isDayUnselectable: (date: Date) => boolean;
  getDayClosedNote: (date: Date) => string | null;
};

export default function ClientBookingDateCalendarPanel({
  selectedDate,
  setSelectedDate,
  addMonths,
  addDays,
  isPastDay,
  today0,
  toISO,
  monthPickerAnchor,
  setMonthPickerAnchor,
  monthLabel,
  monthPickerYear,
  monthPickerMonth,
  setMonthYear,
  weekDays,
  isDayNotAvailable,
  isDayUnselectable,
  getDayClosedNote,
}: ClientBookingDateCalendarPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const tealCircleNavSx = {
    width: 26,
    height: 26,
    borderRadius: "50%",
    bgcolor: m.teal,
    color: m.white,
    "&:hover": { bgcolor: m.tealDark },
    "&.Mui-disabled": {
      bgcolor: alpha(m.teal, 0.35),
      color: m.white,
    },
  } as const;
  const tealCircleScrollSx = {
    ...tealCircleNavSx,
    width: 28,
    height: 28,
    flexShrink: 0,
  } as const;

  return (
    <Box id="booking-calendar-section" sx={{ p: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        justifyContent="center"
        sx={{ mb: 1.25 }}
      >
        <IconButton
          size="small"
          onClick={() =>
            setSelectedDate((d) => {
              const next = addMonths(d, -1);
              return isPastDay(next) ? today0 : next;
            })
          }
          disabled={(() => {
            const prevMonth = addMonths(selectedDate, -1);
            return isPastDay(prevMonth);
          })()}
          sx={tealCircleNavSx}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <ButtonBase
          onClick={(e) => setMonthPickerAnchor(e.currentTarget)}
          sx={{
            borderRadius: "10px",
            px: 1.1,
            py: 0.45,
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            "&:hover": { bgcolor: alpha(m.navy, 0.03) },
          }}
        >
          <Typography
            sx={mollureLabelSx(m.navy, {
              fontWeight: 800,
              fontSize: 14,
            })}
          >
            {monthLabel}
          </Typography>
          <KeyboardArrowDownRoundedIcon
            sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }}
          />
        </ButtonBase>
        <IconButton
          size="small"
          onClick={() => setSelectedDate((d) => addMonths(d, 1))}
          sx={tealCircleNavSx}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {/* Month/Year picker */}
      <Box
        component="div"
        sx={{
          position: "relative",
        }}
      />
      {monthPickerAnchor ? (
        <Box
          component="div"
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
          }}
          onClick={() => setMonthPickerAnchor(null)}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              left: monthPickerAnchor.getBoundingClientRect().left,
              top: monthPickerAnchor.getBoundingClientRect().bottom + 6,
              width: 260,
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: "#fff",
              boxShadow: "0 18px 44px rgba(16,35,63,0.18)",
              p: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <IconButton
                size="small"
                onClick={() => {
                  const y = monthPickerYear - 1;
                  const m0 = monthPickerMonth;
                  const probe = new Date(selectedDate);
                  probe.setFullYear(y, m0, 1);
                  if (isPastDay(probe)) {
                    setSelectedDate(today0);
                    setMonthPickerAnchor(null);
                    return;
                  }
                  setMonthYear(y, m0);
                }}
                disabled={(() => {
                  const probe = new Date(selectedDate);
                  probe.setFullYear(
                    monthPickerYear - 1,
                    monthPickerMonth,
                    1,
                  );
                  return isPastDay(probe);
                })()}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                }}
              >
                <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.8),
                }}
              >
                {monthPickerYear}
              </Typography>
              <IconButton
                size="small"
                onClick={() =>
                  setMonthYear(monthPickerYear + 1, monthPickerMonth)
                }
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                }}
              >
                <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            <Grid container spacing={1}>
              {Array.from({ length: 12 }, (_, i) => {
                const label = new Date(monthPickerYear, i, 1).toLocaleDateString(
                  "en-US",
                  { month: "short" },
                );
                const active = i === monthPickerMonth;
                // Disable only when the whole month is already past.
                const lastOfMonth = new Date(monthPickerYear, i + 1, 0);
                const disabled = isPastDay(lastOfMonth);
                return (
                  <Grid item xs={4} key={i}>
                    <AppButton
                      tone="primary"
                      fullWidth
                      variant={active ? "contained" : "outlined"}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setMonthYear(monthPickerYear, i);
                        setMonthPickerAnchor(null);
                      }}
                      sx={{
                        fontSize: 11.5,
                        height: 34,
                        ...(!active
                          ? {
                              borderColor: alpha(m.navy, 0.1),
                              color: alpha(m.navy, 0.68),
                            }
                          : {}),
                        ...(disabled ? { opacity: 0.45 } : null),
                      }}
                    >
                      {label}
                    </AppButton>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          size="small"
          onClick={() =>
            setSelectedDate((d) => {
              const next = addDays(d, -7);
              return isPastDay(next) ? today0 : next;
            })
          }
          disabled={isPastDay(addDays(selectedDate, -7))}
          sx={tealCircleScrollSx}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Stack
          direction="row"
          spacing={0.9}
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {weekDays.map((d) => {
            const active = toISO(selectedDate) === d.key;
            const past = isPastDay(d.date);
            const closed = isDayNotAvailable(d.date) && !past;
            const noSlots = !past && !closed && isDayUnselectable(d.date);
            const closedNote = closed
              ? getDayClosedNote(d.date)
              : noSlots
                ? "No schedule availability for this day."
                : null;
            const disabled = past || closed || noSlots;
            const blocked = closed || noSlots;
            const faded = past || blocked;
            return (
              <Tooltip
                key={d.key}
                title={closedNote || ""}
                disableHoverListener={!closedNote}
                arrow
                placement="top"
              >
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                  }}
                >
                  <ButtonBase
                    onClick={() => {
                      if (disabled) return;
                      setSelectedDate(d.date);
                    }}
                    disabled={disabled}
                    aria-disabled={disabled}
                    sx={{
                      flex: 1,
                      width: "100%",
                      minWidth: 0,
                      borderRadius: "8px",
                      border: `1px solid ${
                        faded
                          ? alpha(m.navy, 0.1)
                          : active
                            ? m.teal
                            : m.cardBorder
                      }`,
                      bgcolor: active && !faded ? m.teal : m.white,
                      py: 0.9,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.35,
                      pointerEvents: disabled ? "none" : "auto",
                      "&.Mui-disabled": { opacity: 1 },
                      ...(faded
                        ? {
                            cursor: "not-allowed",
                          }
                        : null),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: faded
                          ? alpha(m.navy, 0.38)
                          : active
                            ? m.white
                            : m.headingText,
                      }}
                    >
                      {d.dow}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: faded
                          ? alpha(m.navy, 0.38)
                          : active
                            ? m.white
                            : m.headingText,
                        textDecoration: faded ? "line-through" : "none",
                      }}
                    >
                      {d.day}
                    </Typography>
                  </ButtonBase>
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
        <IconButton
          size="small"
          onClick={() => setSelectedDate((d) => addDays(d, 7))}
          sx={tealCircleScrollSx}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
