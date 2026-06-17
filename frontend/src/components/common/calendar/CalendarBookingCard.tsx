"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BookingTimelineCard from "../BookingTimelineCard";
import { useProfessionalMessagingUnread } from "../messaging/useProfessionalMessagingUnread";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extractBookingId, statusChipSx } from "./calendar.utils";
import { getBookingScenarioIndicators, statusCardAccent } from "./bookingStatus";
import { resolveBookingResponseIndicators } from "./bookingResponseStatus";
import { resolveCalendarPrepaymentStatus, toPrepaymentIconVariant } from "./prepaymentStatus";

export type CalendarBookingCardProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  left: string | number;
  right: string | number;
  serviceColor?: string;
  onOpen: () => void;
  onOpenCalendar: () => void;
  onOpenNotes: () => void;
  onOpenClient: () => void;
  onOpenMessages: () => void;
};

function scenarioBadgeResponseIndicators(
  label: ReturnType<typeof getBookingScenarioIndicators>[number],
  responseIndicators: ReturnType<typeof resolveBookingResponseIndicators>,
) {
  if (label === "BR" || label === "EBR") return responseIndicators;
  if (label === "ER" || label === "E") {
    return responseIndicators.filter((indicator) => indicator === "overdue_response");
  }
  return [];
}

export default function CalendarBookingCard({
  event,
  top,
  height,
  left,
  right,
  serviceColor,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
}: CalendarBookingCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const bookingRef = event.bookingCode ?? extractBookingId(event.id);
  const unreadCount = useProfessionalMessagingUnread(bookingRef);
  const accent = statusCardAccent(event.status);
  const scenarioIndicators = getBookingScenarioIndicators(event);
  const responseIndicators = resolveBookingResponseIndicators(event);
  const prepaymentStatus = resolveCalendarPrepaymentStatus(event);
  const prepaymentIconVariant = prepaymentStatus ? toPrepaymentIconVariant(prepaymentStatus) : undefined;
  const isDesiredLocation = event.location === "DL";
  const accentColor = serviceColor ?? accent.color;
  const backgroundColor = serviceColor ? alpha(serviceColor, isDesiredLocation ? 0.08 : 0.075) : accent.bg;
  const borderColor = serviceColor ? alpha(serviceColor, 0.34) : accent.border;

  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left,
        right,
        height: Math.max(78, height),
        minHeight: 78,
        zIndex: 4,
      }}
    >
      <BookingTimelineCard
        idLabel={`ID: ${event.bookingCode ?? extractBookingId(event.id)}`}
        title={event.title}
        timeLabel={`(${event.start} to ${event.end})`}
        locationLabel={event.location}
        status={{
          label: event.status,
          sx: statusChipSx(event.status, m),
        }}
        accentColor={accentColor}
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        pattern={isDesiredLocation ? "dots" : "lines"}
        scenarioBadges={scenarioIndicators.map((label) => ({
          label,
          responseIndicators: scenarioBadgeResponseIndicators(label, responseIndicators),
          prepaymentStatus:
            label === "BR" || label === "EBR"
              ? prepaymentIconVariant === "pending"
                ? undefined
                : prepaymentIconVariant
              : undefined,
          showExternalLink: label === "ER",
        }))}
        prepaymentStatus={prepaymentIconVariant}
        responseIndicators={scenarioIndicators.length ? undefined : responseIndicators}
        titleLineClamp={1}
        calendarAction={{
          show: true,
          tooltip: "Open calendar",
          onClick: onOpenCalendar,
        }}
        notesAction={{
          show: true,
          tooltip: "Open notes",
          onClick: onOpenNotes,
        }}
        profileAction={{
          show: true,
          name: event.showClientName ?? "Client",
          tooltip: `Open profile: ${event.showClientName ?? "Client"}`,
          onClick: onOpenClient,
        }}
        messageAction={{
          show: true,
          count: unreadCount > 0 ? unreadCount : undefined,
          tooltip: `Messages: ${event.showClientName ?? "Client"}`,
          onClick: onOpenMessages,
        }}
        onClick={onOpen}
        sx={{ width: "100%" }}
      />
    </Box>
  );
}
