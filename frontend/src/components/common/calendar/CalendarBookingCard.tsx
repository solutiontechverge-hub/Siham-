"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BookingTimelineCard from "../BookingTimelineCard";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extractBookingId, statusChipSx } from "./calendar.utils";

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
};

function statusAccent(status: CalendarEvent["status"]) {
  switch (status) {
    case "Requested":
      return { color: "#FBB500", bg: "rgba(253, 246, 239, 0.6)", border: "#FBB500" };
    case "Cancelled":
      return { color: "#EF4444", bg: "#FFF1F1", border: "#F4A3A3" };
    case "Confirmed":
      return { color: "#22B573", bg: "#ECFFF4", border: "#75D9A6" };
    case "Completed":
      return { color: "#74839A", bg: "#F7F9FC", border: "#B6C0CE" };
    case "No Show":
    default:
      return { color: "#8B98AA", bg: "#F4F6F9", border: "#BFC8D4" };
  }
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
}: CalendarBookingCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accent = statusAccent(event.status);
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
        requestBadge={event.status === "Requested"}
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
          count: event.status === "Requested" ? 1 : undefined,
          tooltip: `Messages: ${event.showClientName ?? "Client"}`,
          onClick: onOpenClient,
        }}
        onClick={onOpen}
        sx={{ width: "100%" }}
      />
    </Box>
  );
}
