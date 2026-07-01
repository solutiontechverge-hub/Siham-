"use client";

import * as React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import CalendarBookingCard from "./CalendarBookingCard";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";

const TICKET_GAP = 4;
const TICKET_ROW_HEIGHT = 72;

export type CalendarBookingTicketStackProps = {
  events: readonly CalendarEvent[];
  top: number;
  height: number;
  getServiceColor: (event: CalendarEvent) => string | undefined;
  getStatusColor?: (event: CalendarEvent) => string | undefined;
  onOpen: (event: CalendarEvent) => void;
  onOpenCalendar: (event: CalendarEvent) => void;
  onOpenNotes: (event: CalendarEvent) => void;
  onOpenClient: (event: CalendarEvent) => void;
  onOpenMessages: (event: CalendarEvent) => void;
};

export default function CalendarBookingTicketStack({
  events,
  top,
  height: _slotHeight,
  getServiceColor,
  getStatusColor,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
}: CalendarBookingTicketStackProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const ticketHeight = TICKET_ROW_HEIGHT;
  const stackHeight = events.length * ticketHeight + Math.max(0, events.length - 1) * TICKET_GAP;

  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left: 6,
        right: 6,
        height: stackHeight,
        minHeight: stackHeight,
        zIndex: 8,
        overflow: "visible",
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

      <Stack spacing={`${TICKET_GAP}px`} sx={{ width: "100%", overflow: "visible" }}>
        {events.map((event, index) => {
          const ticketSx: SxProps<Theme> = {
            flexShrink: 0,
            width: "100%",
            height: ticketHeight,
            minHeight: ticketHeight,
            zIndex: index + 1,
            position: "relative",
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
              statusColor={getStatusColor?.(event)}
              onOpen={() => onOpen(event)}
              onOpenCalendar={() => onOpenCalendar(event)}
              onOpenNotes={() => onOpenNotes(event)}
              onOpenClient={() => onOpenClient(event)}
              onOpenMessages={() => onOpenMessages(event)}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
