"use client";

import * as React from "react";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarBookingCard from "./CalendarBookingCard";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolveSameTimeStackChip } from "./calendar-overlap.utils";
import { teamSharedBookingTooltip } from "./teamMemberBookings";

const COLUMN_GAP = 4;

function SharedDividerChip({
  tooltip,
  zIndex,
  teal,
}: {
  tooltip: string;
  zIndex: number;
  teal: string;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        width: COLUMN_GAP,
        flexShrink: 0,
        alignSelf: "stretch",
        zIndex,
        overflow: "visible",
      }}
    >
      <Tooltip title={tooltip} placement="top" enterDelay={150}>
        <Chip
          label="Shared"
          size="small"
          sx={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            height: 20,
            borderRadius: "999px",
            fontSize: 9.5,
            fontWeight: 800,
            bgcolor: "#fff",
            color: teal,
            border: `1px solid ${teal}`,
            cursor: "help",
            boxShadow: "0 4px 12px rgba(16, 35, 63, 0.14)",
            "& .MuiChip-label": { px: 0.9 },
          }}
        />
      </Tooltip>
    </Box>
  );
}

/** Same start time → bookings sit side-by-side in one calendar row. */
export function computeSameTimeRowLayout(rowPx: number) {
  return { slotHeight: Math.max(72, rowPx - 6) };
}

export type CalendarBookingTicketStackProps = {
  events: readonly CalendarEvent[];
  top: number;
  rowPx: number;
  slotHeight?: number;
  teamMemberNameById?: ReadonlyMap<string, string>;
  getServiceColor: (event: CalendarEvent) => string | undefined;
  getStatusColor?: (event: CalendarEvent) => string | undefined;
  onOpen: (event: CalendarEvent) => void;
  onOpenCalendar: (event: CalendarEvent) => void;
  onOpenNotes: (event: CalendarEvent) => void;
  onOpenClient: (event: CalendarEvent, anchorEl: HTMLElement) => void;
  onOpenMessages: (event: CalendarEvent) => void;
  responseTimeConfigured?: boolean;
};

export default function CalendarBookingTicketStack({
  events,
  top,
  rowPx,
  slotHeight,
  teamMemberNameById,
  getServiceColor,
  getStatusColor,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
  responseTimeConfigured,
}: CalendarBookingTicketStackProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { slotHeight: defaultSlotHeight } = React.useMemo(
    () => computeSameTimeRowLayout(rowPx),
    [rowPx],
  );
  const cardHeight = slotHeight ?? defaultSlotHeight;
  const isDense = events.length > 1;
  const stackChip = React.useMemo(
    () => resolveSameTimeStackChip(events),
    [events],
  );
  const sharedTooltip = React.useMemo(() => {
    if (stackChip?.kind !== "shared") return "";
    return teamSharedBookingTooltip(events[0], {
      nameById: teamMemberNameById,
      events,
    });
  }, [events, stackChip, teamMemberNameById]);

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
      {stackChip?.kind === "requests" ? (
        <Tooltip
          title={`${stackChip.count} separate bookings at this time`}
          placement="top"
          enterDelay={150}
        >
          <Chip
            label={`${stackChip.count} requests`}
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
              cursor: "help",
              boxShadow: "0 4px 12px rgba(16, 35, 63, 0.14)",
            }}
          />
        </Tooltip>
      ) : null}

      <Stack
        direction="row"
        sx={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {events.map((event, index) => (
          <React.Fragment key={event.id}>
            <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
              <CalendarBookingCard
                event={event}
                top={0}
                height={cardHeight}
                left={0}
                right={0}
                variant={isDense ? "default" : "ticket"}
                positioned={false}
                dense={isDense}
                teamMemberNameById={teamMemberNameById}
                serviceColor={getServiceColor(event)}
                statusColor={getStatusColor?.(event)}
                onOpen={() => onOpen(event)}
                onOpenCalendar={() => onOpenCalendar(event)}
                onOpenNotes={() => onOpenNotes(event)}
                onOpenClient={(anchorEl) => onOpenClient(event, anchorEl)}
                onOpenMessages={() => onOpenMessages(event)}
                responseTimeConfigured={responseTimeConfigured}
              />
            </Box>
            {index < events.length - 1 ? (
              stackChip?.kind === "shared" ? (
                <SharedDividerChip
                  tooltip={sharedTooltip}
                  zIndex={events.length + 2}
                  teal={m.teal}
                />
              ) : (
                <Box sx={{ width: COLUMN_GAP, flexShrink: 0 }} />
              )
            ) : null}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
}
