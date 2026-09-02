"use client";

import * as React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarBookingCard from "./CalendarBookingCard";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";

const COLUMN_GAP = 4;

/** Same start time → bookings sit side-by-side in one calendar row. */
export function computeSameTimeRowLayout(rowPx: number) {
  return { slotHeight: Math.max(72, rowPx - 6) };
}

export type CalendarBookingTicketStackProps = {
  events: readonly CalendarEvent[];
  top: number;
  rowPx: number;
  slotHeight?: number;
  getServiceColor: (event: CalendarEvent) => string | undefined;
  getStatusColor?: (event: CalendarEvent) => string | undefined;
  onOpen: (event: CalendarEvent) => void;
  onOpenCalendar: (event: CalendarEvent) => void;
  onOpenNotes: (event: CalendarEvent) => void;
  onOpenClient: (event: CalendarEvent, anchorEl: HTMLElement) => void;
  onOpenMessages: (event: CalendarEvent) => void;
};

export default function CalendarBookingTicketStack({
  events,
  top,
  rowPx,
  slotHeight,
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
  const { slotHeight: defaultSlotHeight } = React.useMemo(
    () => computeSameTimeRowLayout(rowPx),
    [rowPx],
  );
  const cardHeight = slotHeight ?? defaultSlotHeight;
  const isDense = events.length > 1;

  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left: 6,
        right: 6,
        height: cardHeight,
        minHeight: cardHeight,
        zIndex: 10,
        overflow: "visible",
      }}
    >
      {events.length > 1 ? (
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
      ) : null}

      <Stack
        direction="row"
        spacing={`${COLUMN_GAP}px`}
        sx={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {events.map((event) => (
          <Box key={event.id} sx={{ flex: 1, minWidth: 0, height: "100%" }}>
            <CalendarBookingCard
              event={event}
              top={0}
              height={cardHeight}
              left={0}
              right={0}
              variant={isDense ? "default" : "ticket"}
              positioned={false}
              dense={isDense}
              serviceColor={getServiceColor(event)}
              statusColor={getStatusColor?.(event)}
              onOpen={() => onOpen(event)}
              onOpenCalendar={() => onOpenCalendar(event)}
              onOpenNotes={() => onOpenNotes(event)}
              onOpenClient={(anchorEl) => onOpenClient(event, anchorEl)}
              onOpenMessages={() => onOpenMessages(event)}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
