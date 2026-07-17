"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";
import type { CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BlockTimeDraft } from "./calendar.utils";
import type { ScheduleShift } from "./calendar-settings.types";

export type AvailabilityDraft = {
  teamIds: string[];
  locations: CalendarBookingLocation[];
  dateFrom: string;
  dateTo: string;
  dayFrom: BlockTimeDraft["dayFrom"];
  dayTo: BlockTimeDraft["dayTo"];
  shifts: ScheduleShift[];
};

type CalendarAvailabilityModalProps = {
  availableLocations: readonly CalendarBookingLocation[];
  draft: AvailabilityDraft;
  onApply: () => void;
  onClose: () => void;
  open: boolean;
  resources: readonly CalendarResource[];
  setDraft: React.Dispatch<React.SetStateAction<AvailabilityDraft>>;
  teamLabelById: ReadonlyMap<string, string>;
  title?: string;
};

const dayOptions = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

export default function CalendarAvailabilityModal({
  availableLocations,
  draft,
  onApply,
  onClose,
  open,
  resources,
  setDraft,
  teamLabelById,
  title = "Add Availability",
}: CalendarAvailabilityModalProps) {
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
      title={title}
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
          <AppDropdown
            label="Team Member(s)"
            value={draft.teamIds}
            multiple
            renderValue={(selected) => {
              const ids = selected as readonly string[];
              if (!ids.length) return "Select Team Member";
              if (ids.length === resources.length) return "All";
              return ids.map((id) => teamLabelById.get(id) ?? id).join(", ");
            }}
            onChange={(val) => setDraft((p) => ({ ...p, teamIds: val as string[] }))}
            options={resources.map((resource) => ({
              label: teamLabelById.get(resource.id) ?? resource.name,
              value: resource.id,
            }))}
            fullWidth
          />

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

          <Stack direction="row" spacing={1.25}>
            <AppDatePicker label="Date from" value={draft.dateFrom} onChange={(val) => setDraft((p) => ({ ...p, dateFrom: val }))} fullWidth />
            <AppDatePicker label="Date to" value={draft.dateTo} onChange={(val) => setDraft((p) => ({ ...p, dateTo: val }))} fullWidth />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppDropdown label="Day from" value={draft.dayFrom} onChange={(val) => setDraft((p) => ({ ...p, dayFrom: String(val) as AvailabilityDraft["dayFrom"] }))} options={dayOptions} fullWidth />
            <AppDropdown label="Day to" value={draft.dayTo} onChange={(val) => setDraft((p) => ({ ...p, dayTo: String(val) as AvailabilityDraft["dayTo"] }))} options={dayOptions} fullWidth />
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
