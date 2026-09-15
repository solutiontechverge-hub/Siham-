"use client";

import {
  mollureBodySx,
} from "../../../../theme/mollureHierarchy";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  Box,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import BookingResponseExpiryBanner from "../BookingResponseExpiryBanner";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlertsBag = Pick<
  Vm,
  | "handleBookingActionSelect"
  | "handleRestartResponseTime"
  | "m"
  | "showExpiredResponseBanner"
  | "viewingBookingOverlapsBlockTime"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlertsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlerts({
  bag,
}: Props) {
  const {
    handleBookingActionSelect,
    handleRestartResponseTime,
    m,
    showExpiredResponseBanner,
    viewingBookingOverlapsBlockTime,
  } = bag;

  return (
    <>
      {showExpiredResponseBanner ? (
        <BookingResponseExpiryBanner
          onRestart={() => void handleRestartResponseTime()}
          onDiscard={() => void handleBookingActionSelect("discard")}
        />
      ) : null}
      {viewingBookingOverlapsBlockTime ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            px: 1.25,
            py: 1.15,
            borderRadius: "10px",
            bgcolor: m.statusOrangeBg,
            border: `1px solid ${alpha(m.statusOrangeFg, 0.28)}`,
          }}
        >
          <WarningAmberRoundedIcon
            sx={{
              fontSize: 18,
              color: m.statusOrangeFg,
              mt: "1px",
              flexShrink: 0,
            }}
          />
          <BodyText
            sx={mollureBodySx(m.navy, {
              color: alpha(m.navy, 0.82),
              lineHeight: 1.45,
            })}
          >
            This booking overlaps Block Time. Reschedule or
            cancel and notify the client.
          </BodyText>
        </Box>
      ) : null}
    </>
  );
}
