"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import BookingTimelineCard from "../BookingTimelineCard";
import { useProfessionalMessagingUnread } from "../messaging/useProfessionalMessagingUnread";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extractBookingId, statusChipSx } from "./calendar.utils";
import { getBookingScenarioIndicators, statusCardAccent, isBookingRequestAccepted, isBookingRequestRejected } from "./bookingStatus";
import { resolveBookingResponseIndicators } from "./bookingResponseStatus";
import { resolveCalendarPrepaymentStatus, toPrepaymentIconVariant } from "./prepaymentStatus";

export type CalendarBookingCardProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  left: string | number;
  right: string | number;
  serviceColor?: string;
  variant?: "default" | "ticket";
  positioned?: boolean;
  containerSx?: SxProps<Theme>;
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
  variant = "default",
  positioned = true,
  containerSx,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
}: CalendarBookingCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isTicket = variant === "ticket";
  const cardHeight = Math.max(isTicket ? 72 : 78, height);
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
      sx={[
        positioned
          ? {
              position: "absolute",
              top,
              left,
              right,
              height: cardHeight,
              minHeight: cardHeight,
              zIndex: 4,
            }
          : {
              position: "relative",
              width: "100%",
              height: cardHeight,
              minHeight: cardHeight,
            },
        isTicket
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 18,
                height: 7,
                borderRadius: "0 0 10px 10px",
                bgcolor: alpha(m.navy, 0.08),
                zIndex: 2,
                pointerEvents: "none",
              },
            }
          : undefined,
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
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
          showRequestSentIcon: label === "BR",
          requestAccepted: label === "BR" && isBookingRequestAccepted(event),
          requestRejected: label === "BR" && isBookingRequestRejected(event),
          responseIndicators: label === "EBR" ? scenarioBadgeResponseIndicators(label, responseIndicators) : [],
          prepaymentStatus:
            label === "EBR"
              ? prepaymentIconVariant === "pending"
                ? undefined
                : prepaymentIconVariant
              : undefined,
          showExternalLink: label === "ER",
        }))}
        prepaymentStatus={prepaymentIconVariant}
        responseIndicators={
          scenarioIndicators.includes("BR")
            ? responseIndicators
            : scenarioIndicators.length
              ? undefined
              : responseIndicators
        }
        titleLineClamp={1}
        calendarAction={{
          show: !isTicket,
          tooltip: "Open calendar",
          onClick: onOpenCalendar,
        }}
        notesAction={{
          show: !isTicket,
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
        sx={{
          width: "100%",
          height: cardHeight,
          minHeight: cardHeight,
          borderRadius: isTicket ? "8px" : "4px",
          boxShadow: isTicket ? "0 8px 20px rgba(16, 35, 63, 0.12)" : undefined,
        }}
        contentSx={isTicket ? { pt: "8px", pb: "5px", pl: "7px", pr: "6px" } : undefined}
        actionRailSx={isTicket ? { width: 52 } : undefined}
      />
    </Box>
  );
}
