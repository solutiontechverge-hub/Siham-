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
          sx={{
            width: 24,
            height: 24,
            border: `1px solid ${alpha(m.teal, 0.45)}`,
            color: m.teal,
            ...(isPastDay(addMonths(selectedDate, -1))
              ? {
                  opacity: 0.45,
                  borderColor: alpha(m.navy, 0.1),
                  color: alpha(m.navy, 0.35),
                }
              : null),
          }}
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
              fontWeight: 900,
              fontSize: 13,
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
          sx={{
            width: 24,
            height: 24,
            border: `1px solid ${alpha(m.teal, 0.45)}`,
            color: m.teal,
          }}
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
          sx={{
            width: 24,
            height: 24,
            border: `1px solid ${alpha(m.teal, 0.35)}`,
            color: m.teal,
            flexShrink: 0,
            ...(isPastDay(addDays(selectedDate, -7))
              ? {
                  opacity: 0.45,
                  borderColor: alpha(m.navy, 0.1),
                  color: alpha(m.navy, 0.35),
                }
              : null),
          }}
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
                        past
                          ? alpha(m.navy, 0.08)
                          : blocked
                            ? alpha(m.blockedTimeFg, 0.45)
                            : active
                              ? m.teal
                              : m.cardBorder
                      }`,
                      bgcolor: past
                        ? alpha(m.navy, 0.015)
                        : blocked
                          ? m.blockedTimeBg
                          : active
                            ? m.teal
                            : m.white,
                      py: 0.9,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.35,
                      pointerEvents: disabled ? "none" : "auto",
                      "&.Mui-disabled": {
                        opacity: past ? 0.45 : 1,
                      },
                      ...(past
                        ? {
                            opacity: 0.45,
                            cursor: "not-allowed",
                          }
                        : null),
                      ...(blocked
                        ? {
                            cursor: "not-allowed",
                          }
                        : null),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: past
                          ? alpha(m.navy, 0.55)
                          : blocked
                            ? m.blockedTimeFg
                            : active
                              ? m.white
                              : m.headingText,
                      }}
                    >
                      {d.dow}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: past
                          ? alpha(m.navy, 0.76)
                          : blocked
                            ? m.blockedTimeFg
                            : active
                              ? m.white
                              : m.headingText,
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
          sx={{
            width: 24,
            height: 24,
            border: `1px solid ${alpha(m.teal, 0.35)}`,
            color: m.teal,
            flexShrink: 0,
          }}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
