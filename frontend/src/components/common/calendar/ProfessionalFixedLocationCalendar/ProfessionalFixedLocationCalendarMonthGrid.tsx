"use client";

import * as React from "react";
import { Box, ButtonBase, Chip, Paper, Stack, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import { isTeamSharedBooking } from "../teamMemberBookings";
import { statusAccentColor } from "../bookingStatus";
import { extractBookingId } from "../calendar.utils";
import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarMonthGridProps = Pick<
  Vm,
  | "m"
  | "monthCells"
  | "hasScheduleAvailabilityOnDate"
  | "resourceNameById"
  | "setActiveDateIso"
  | "resetToDefaultTeamMember"
  | "setViewMode"
>;

export default function ProfessionalFixedLocationCalendarMonthGrid({
  m,
  monthCells,
  hasScheduleAvailabilityOnDate,
  resourceNameById,
  setActiveDateIso,
  resetToDefaultTeamMember,
  setViewMode,
}: ProfessionalFixedLocationCalendarMonthGridProps) {
  return (
<Paper
  elevation={0}
  sx={{
    borderRadius: "6px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    overflowX: "auto",
  }}
>
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "repeat(7, minmax(0, 1fr))",
        sm: "repeat(7, minmax(80px, 1fr))",
        md: "repeat(7, minmax(118px, 1fr))",
      },
      borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
      bgcolor: alpha(m.navy, 0.02),
    }}
  >
    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day) => (
        <Box
          key={day}
          sx={{
            px: { xs: 0.5, md: 1.25 },
            py: { xs: 0.75, md: 1 },
            borderLeft:
              day !== "Mon"
                ? `1px solid ${alpha(m.navy, 0.07)}`
                : undefined,
          }}
        >
          <BodyText
            sx={{
              fontSize: 11,
              fontWeight: 900,
              color: alpha(m.navy, 0.58),
              lineHeight: 1,
            }}
          >
            {day}
          </BodyText>
        </Box>
      ),
    )}
  </Box>

  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "repeat(7, minmax(0, 1fr))",
        sm: "repeat(7, minmax(80px, 1fr))",
        md: "repeat(7, minmax(118px, 1fr))",
      },
    }}
  >
    {monthCells.map((cell, idx) => {
      const hasBookings = cell.dayEvents.length > 0;
      const showClosed =
        !cell.isPast &&
        !hasScheduleAvailabilityOnDate(cell.iso);
      const closedNote = showClosed
        ? "No schedule availability"
        : null;

      return (
        <Tooltip
          key={cell.iso}
          title={closedNote || ""}
          disableHoverListener={!closedNote}
          arrow
          placement="top"
        >
        <ButtonBase
          onClick={() => {
            setActiveDateIso(cell.iso);
            resetToDefaultTeamMember();
            setViewMode("day");
          }}
          sx={{
            minHeight: 132,
            alignItems: "stretch",
            justifyContent: "stretch",
            textAlign: "left",
            borderLeft:
              idx % 7 === 0
                ? undefined
                : `1px solid ${alpha(m.navy, 0.07)}`,
            borderTop:
              idx < 7
                ? undefined
                : `1px solid ${alpha(m.navy, 0.07)}`,
            bgcolor: showClosed
              ? m.blockedTimeBg
              : cell.isSelected
                ? alpha(m.teal, 0.055)
                : cell.inMonth
                  ? "#fff"
                  : alpha(m.navy, 0.018),
            opacity: cell.isPast ? 0.66 : cell.inMonth ? 1 : 0.72,
            cursor: "pointer",
            "&:hover": {
              bgcolor: showClosed
                ? alpha(m.blockedTimeFg, 0.16)
                : hasBookings
                  ? alpha(m.teal, 0.045)
                  : alpha(m.navy, 0.025),
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              p: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "999px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 900,
                  color: showClosed
                    ? m.blockedTimeFg
                    : cell.isToday
                      ? "#fff"
                      : alpha(m.navy, cell.inMonth ? 0.82 : 0.42),
                  bgcolor: showClosed
                    ? alpha(m.blockedTimeFg, 0.12)
                    : cell.isToday
                      ? m.teal
                      : "transparent",
                  border:
                    cell.isSelected &&
                    !cell.isToday &&
                    !showClosed
                      ? `1px solid ${alpha(m.teal, 0.45)}`
                      : "1px solid transparent",
                }}
              >
                {cell.dateNumber}
              </Box>
              {hasBookings ? (
                <Chip
                  size="small"
                  label={`${cell.dayEvents.length} booking${cell.dayEvents.length === 1 ? "" : "s"}`}
                  sx={{
                    height: 20,
                    borderRadius: "999px",
                    fontSize: 9.5,
                    fontWeight: 900,
                    color: m.tealDark,
                    bgcolor: alpha(m.teal, 0.1),
                    border: `1px solid ${alpha(m.teal, 0.18)}`,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
              ) : null}
            </Stack>

            <Stack spacing={0.45} sx={{ minWidth: 0 }}>
              {cell.dayEvents.slice(0, 3).map((event) => {
                const resourceName =
                  resourceNameById.get(event.resourceId) ??
                  "Team member";
                const eventAccent = statusAccentColor(
                  event.status,
                );
                const eventIsShared = isTeamSharedBooking(event);

                return (
                  <Box
                    key={event.id}
                    sx={{
                      minWidth: 0,
                      borderRadius: "4px",
                      border: `1px solid ${alpha(eventAccent, 0.2)}`,
                      borderLeft: `3px solid ${eventAccent}`,
                      bgcolor: alpha(eventAccent, 0.055),
                      px: 0.75,
                      py: 0.55,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <BodyText
                        sx={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.78),
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.start}
                      </BodyText>
                      <Chip
                        size="small"
                        label={event.location}
                        sx={{
                          height: 15,
                          borderRadius: "4px",
                          fontSize: 8,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.65),
                          bgcolor: alpha("#fff", 0.72),
                          border: `1px solid ${alpha(m.navy, 0.1)}`,
                          "& .MuiChip-label": { px: 0.55 },
                        }}
                      />
                      {eventIsShared ? (
                        <Chip
                          size="small"
                          label="Shared"
                          sx={{
                            height: 15,
                            borderRadius: "4px",
                            fontSize: 8,
                            fontWeight: 900,
                            color: m.teal,
                            bgcolor: alpha(m.teal, 0.12),
                            border: `1px solid ${alpha(m.teal, 0.35)}`,
                            "& .MuiChip-label": { px: 0.55 },
                          }}
                        />
                      ) : null}
                    </Stack>
                    <BodyText
                      sx={{
                        mt: 0.25,
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.8),
                        lineHeight: 1.15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </BodyText>
                    <BodyText
                      sx={{
                        mt: 0.2,
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.54),
                        lineHeight: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {resourceName} - ID:{" "}
                      {extractBookingId(event.id)}
                    </BodyText>
                  </Box>
                );
              })}
              {cell.hiddenCount > 0 ? (
                <BodyText
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    color: alpha(m.tealDark, 0.9),
                    px: 0.3,
                  }}
                >
                  +{cell.hiddenCount} more
                </BodyText>
              ) : null}
            </Stack>
          </Box>
        </ButtonBase>
        </Tooltip>
      );
    })}
  </Box>
</Paper>
  );
}
