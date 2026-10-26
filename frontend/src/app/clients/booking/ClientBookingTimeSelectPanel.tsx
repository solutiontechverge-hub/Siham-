"use client";

import * as React from "react";
import { Box, Divider, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AppButton from "../../../components/common/AppButton";
import { CLIENT_BOOKING_MIN_LEAD_ERROR } from "./booking-time";

export type ClientBookingTimeSelectPanelProps = {
  times: string[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  isTimeUnavailable: (time: string) => boolean;
  timeScrollRef: React.RefObject<HTMLDivElement | null>;
  scrollTimeSlots: (direction: "left" | "right") => void;
  timeValidationError: string | null;
  setTimeValidationError: (error: string | null) => void;
  selectedTimeTooSoon: boolean;
  selectedDayClosedNote: string | null;
};

export default function ClientBookingTimeSelectPanel({
  times,
  selectedTime,
  setSelectedTime,
  isTimeUnavailable,
  timeScrollRef,
  scrollTimeSlots,
  timeValidationError,
  setTimeValidationError,
  selectedTimeTooSoon,
  selectedDayClosedNote,
}: ClientBookingTimeSelectPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const tealCircleScrollSx = {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: "50%",
    bgcolor: m.teal,
    color: m.white,
    "&:hover": { bgcolor: m.tealDark },
  } as const;

  return (
    <Box sx={{ p: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${m.cardBorder}`,
          bgcolor: m.white,
          px: 1.25,
          py: 1.1,
        }}
      >
        <Typography
          sx={mollureLabelSx(m.navy, {
            fontWeight: 800,
            fontSize: 13,
          })}
        >
          Select Time
        </Typography>
        <Divider
          sx={{
            mt: 1,
            mb: 1.25,
            borderColor: alpha(m.navy, 0.12),
          }}
        />

        <Stack direction="row" alignItems="center" spacing={0.75}>
          <IconButton
            size="small"
            onClick={() => scrollTimeSlots("left")}
            sx={tealCircleScrollSx}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box
            ref={timeScrollRef}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              py: 0.25,
            }}
          >
            {times.map((t) => {
              const active = t === selectedTime;
              const unavailable = isTimeUnavailable(t);
              return (
                <AppButton
                  tone="secondary"
                  key={t}
                  data-time-slot={t}
                  variant="outlined"
                  onClick={() => {
                    if (unavailable) {
                      setTimeValidationError(CLIENT_BOOKING_MIN_LEAD_ERROR);
                      return;
                    }
                    setTimeValidationError(null);
                    setSelectedTime(t);
                  }}
                  disabled={unavailable}
                  sx={{
                    flexShrink: 0,
                    minWidth: 76,
                    px: 1.25,
                    height: 32,
                    borderRadius: "8px",
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    bgcolor: active ? m.teal : m.white,
                    color: active ? m.white : m.headingText,
                    borderColor: active ? m.teal : m.cardBorder,
                    "&:hover": {
                      bgcolor: active ? m.teal : m.white,
                      color: active ? m.white : m.headingText,
                      borderColor: active ? m.teal : m.cardBorder,
                    },
                    "&.Mui-disabled": {
                      bgcolor: m.white,
                      borderColor: alpha(m.navy, 0.1),
                      color: alpha(m.navy, 0.32),
                    },
                    ...(unavailable
                      ? {
                          bgcolor: m.white,
                          borderColor: alpha(m.navy, 0.1),
                          color: alpha(m.navy, 0.32),
                          "&:hover": {
                            bgcolor: m.white,
                            borderColor: alpha(m.navy, 0.1),
                            color: alpha(m.navy, 0.32),
                          },
                        }
                      : {}),
                  }}
                >
                  {t}
                </AppButton>
              );
            })}
          </Box>

          <IconButton
            size="small"
            onClick={() => scrollTimeSlots("right")}
            sx={tealCircleScrollSx}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        {(timeValidationError || selectedTimeTooSoon) && (
          <Typography
            sx={{
              mt: 0.9,
              px: 0.25,
              fontSize: 11.5,
              fontWeight: 800,
              color: "#C62828",
              lineHeight: 1.35,
            }}
          >
            {timeValidationError || CLIENT_BOOKING_MIN_LEAD_ERROR}
          </Typography>
        )}

        {/* Same predicate as chips — never contradict a selectable/selected slot. */}
        {times.every((t) => isTimeUnavailable(t)) && (
          <Typography
            sx={{
              mt: 0.9,
              px: 0.25,
              fontSize: 11.5,
              fontWeight: 800,
              color: m.blockedTimeFg,
              lineHeight: 1.35,
            }}
          >
            {selectedDayClosedNote ||
              "No schedule availability for this day."}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
