"use client";

import * as React from "react";
import { Box, Button, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppTextField from "../AppTextField";
import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingRules } from "./calendar-settings.types";

type CalendarHoursRulesPanelProps = {
  availableLocations: readonly CalendarBookingLocation[];
  bookingRules: BookingRules;
  isSaving?: boolean;
  onBookingRulesChange: (next: BookingRules) => void;
  onOpenDesign: () => void;
  onOpenPublicHours: () => void;
  onOpenServiceOrder: () => void;
  onSaveBookingRules: () => Promise<void>;
};

function IntervalFields({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  label,
}: {
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  label: string;
}) {
  return (
    <Stack spacing={0.75}>
      <BodyText sx={{ fontSize: 12, fontWeight: 800, color: "inherit" }}>{label}</BodyText>
      <Stack direction="row" spacing={1}>
        <AppTextField label="Hours" value={hours} onChange={(e) => onHoursChange(e.target.value)} fullWidth />
        <AppTextField label="Minutes" value={minutes} onChange={(e) => onMinutesChange(e.target.value)} fullWidth />
      </Stack>
    </Stack>
  );
}

export default function CalendarHoursRulesPanel({
  availableLocations,
  bookingRules,
  isSaving = false,
  onBookingRulesChange,
  onOpenDesign,
  onOpenPublicHours,
  onOpenServiceOrder,
  onSaveBookingRules,
}: CalendarHoursRulesPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const showFl = availableLocations.includes("FL");
  const showDl = availableLocations.includes("DL");

  return (
    <Stack spacing={1.5}>
      <Paper elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Box>
            <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>Set Public Hours</BodyText>
            <BodyText sx={{ mt: 0.5, fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Configure fixed or variable public hours for FL and DL.
            </BodyText>
          </Box>
          <Button variant="outlined" onClick={onOpenPublicHours} sx={{ textTransform: "none", fontWeight: 800 }}>
            Open
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82), mb: 1.5 }}>Set Booking Rules</BodyText>
        <Stack spacing={2}>
          {showFl ? (
            <IntervalFields
              label="FL — Interval Between Bookings"
              hours={bookingRules.flIntervalHours}
              minutes={bookingRules.flIntervalMinutes}
              onHoursChange={(value) => onBookingRulesChange({ ...bookingRules, flIntervalHours: value })}
              onMinutesChange={(value) => onBookingRulesChange({ ...bookingRules, flIntervalMinutes: value })}
            />
          ) : null}
          {showDl ? (
            <>
              <IntervalFields
                label="DL — Interval Between Bookings"
                hours={bookingRules.dlIntervalHours}
                minutes={bookingRules.dlIntervalMinutes}
                onHoursChange={(value) => onBookingRulesChange({ ...bookingRules, dlIntervalHours: value })}
                onMinutesChange={(value) => onBookingRulesChange({ ...bookingRules, dlIntervalMinutes: value })}
              />
              <IntervalFields
                label="DL — Minimum Timeslot"
                hours={bookingRules.dlMinTimeslotHours}
                minutes={bookingRules.dlMinTimeslotMinutes}
                onHoursChange={(value) => onBookingRulesChange({ ...bookingRules, dlMinTimeslotHours: value })}
                onMinutesChange={(value) => onBookingRulesChange({ ...bookingRules, dlMinTimeslotMinutes: value })}
              />
            </>
          ) : null}
          <Box>
            <Button
              variant="contained"
              disableElevation
              disabled={isSaving}
              onClick={() => void onSaveBookingRules()}
              sx={{ textTransform: "none", fontWeight: 800, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
            >
              Save Booking Rules
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Box>
            <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>Set Service Order Rules</BodyText>
            <BodyText sx={{ mt: 0.5, fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Drag categories and services to define booking order.
            </BodyText>
          </Box>
          <Button variant="outlined" onClick={onOpenServiceOrder} sx={{ textTransform: "none", fontWeight: 800 }}>
            Open
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Box>
            <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>Set Calendar Appearance</BodyText>
            <BodyText sx={{ mt: 0.5, fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Assign colours by category or service type.
            </BodyText>
          </Box>
          <Button variant="outlined" onClick={onOpenDesign} sx={{ textTransform: "none", fontWeight: 800 }}>
            Open
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
