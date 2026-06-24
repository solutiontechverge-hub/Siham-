"use client";

import * as React from "react";
import { Box, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import CalendarBookingCard from "./CalendarBookingCard";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";

const TICKET_OFFSET_Y = 8;
const TICKET_OFFSET_X = 14;

export type CalendarBookingTicketStackProps = {
  events: readonly CalendarEvent[];
  top: number;
  height: number;
  getServiceColor: (event: CalendarEvent) => string | undefined;
  onOpen: (event: CalendarEvent) => void;
  onOpenCalendar: (event: CalendarEvent) => void;
  onOpenNotes: (event: CalendarEvent) => void;
  onOpenClient: (event: CalendarEvent) => void;
  onOpenMessages: (event: CalendarEvent) => void;
};

export default function CalendarBookingTicketStack({
  events,
  top,
  height,
  getServiceColor,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
}: CalendarBookingTicketStackProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const ticketHeight = Math.max(72, height);
  const stackHeight = ticketHeight + (events.length - 1) * TICKET_OFFSET_Y;

  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left: 6,
        right: 6,
        height: stackHeight,
        minHeight: stackHeight,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <Chip
        label={`${events.length} requests`}
        size="small"
        sx={{
          position: "absolute",
          top: -10,
          right: 0,
          zIndex: events.length + 2,
          height: 20,
          borderRadius: "999px",
          fontSize: 9.5,
          fontWeight: 800,
          bgcolor: m.teal,
          color: "#fff",
          pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(16, 35, 63, 0.14)",
        }}
      />

      {events.map((event, index) => {
        const ticketSx: SxProps<Theme> = {
          position: "absolute",
          top: index * TICKET_OFFSET_Y,
          left: index * TICKET_OFFSET_X,
          right: Math.max(0, (events.length - 1 - index) * 6),
          height: ticketHeight,
          minHeight: ticketHeight,
          zIndex: index + 1,
          pointerEvents: "auto",
        };

        return (
          <CalendarBookingCard
            key={event.id}
            event={event}
            top={0}
            height={ticketHeight}
            left={0}
            right={0}
            variant="ticket"
            positioned={false}
            containerSx={ticketSx}
            serviceColor={getServiceColor(event)}
            onOpen={() => onOpen(event)}
            onOpenCalendar={() => onOpenCalendar(event)}
            onOpenNotes={() => onOpenNotes(event)}
            onOpenClient={() => onOpenClient(event)}
            onOpenMessages={() => onOpenMessages(event)}
          />
        );
      })}
    </Box>
  );
}
