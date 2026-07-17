"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";
import type { CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ScheduleShift } from "./calendar-settings.types";

export type EditAvailabilityDraft = {
  resourceId: string;
  date: string;
  locations: CalendarBookingLocation[];
  shifts: ScheduleShift[];
};

type CalendarEditAvailabilityModalProps = {
  availableLocations: readonly CalendarBookingLocation[];
  draft: EditAvailabilityDraft;
  onApply: () => void;
  onClose: () => void;
  open: boolean;
  resource?: CalendarResource;
  setDraft: React.Dispatch<React.SetStateAction<EditAvailabilityDraft>>;
};

export default function CalendarEditAvailabilityModal({
  availableLocations,
  draft,
  onApply,
  onClose,
  open,
  resource,
  setDraft,
}: CalendarEditAvailabilityModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const toggleLocation = (location: CalendarBookingLocation) => {
    setDraft((prev) => {
      const has = prev.locations.includes(location);
      const next = has ? prev.locations.filter((item) => item !== location) : [...prev.locations, location];
      return { ...prev, locations: next.length ? next : [...availableLocations] };
    });
  };

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title="Edit Availability"
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <Button variant="outlined" onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 800, height: 38 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={onApply}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 800, height: 38, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
            >
              Save
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
            {resource?.name ?? "Team member"} · {draft.date}
          </BodyText>

          <Stack direction="row" spacing={1}>
            {availableLocations.map((location) => {
              const active = draft.locations.includes(location);
              return (
                <Button
                  key={location}
                  variant={active ? "contained" : "outlined"}
                  onClick={() => toggleLocation(location)}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: active ? m.teal : "#fff",
                    "&:hover": { bgcolor: active ? m.tealDark : alpha(m.teal, 0.04) },
                  }}
                >
                  {location}
                </Button>
              );
            })}
          </Stack>

          {draft.shifts.map((shift, index) => (
            <Stack key={`shift-${index}`} direction="row" spacing={1.25} alignItems="center">
              <AppTextField label="Start" type="time" value={shift.start} onChange={(e) => setDraft((p) => ({ ...p, shifts: p.shifts.map((item, i) => (i === index ? { ...item, start: e.target.value } : item)) }))} fullWidth InputLabelProps={{ shrink: true }} />
              <AppTextField label="End" type="time" value={shift.end} onChange={(e) => setDraft((p) => ({ ...p, shifts: p.shifts.map((item, i) => (i === index ? { ...item, end: e.target.value } : item)) }))} fullWidth InputLabelProps={{ shrink: true }} />
              <IconButton
                size="small"
                disabled={draft.shifts.length === 1}
                onClick={() => setDraft((p) => ({ ...p, shifts: p.shifts.filter((_, i) => i !== index) }))}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setDraft((p) => ({ ...p, shifts: [...p.shifts, { start: "09:00", end: "17:00" }] }))}
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, color: m.teal }}
          >
            Add shift
          </Button>
        </Stack>
      </Box>
    </MollureModal>
  );
}
