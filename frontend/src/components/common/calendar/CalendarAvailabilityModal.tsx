"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
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

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                minWidth: 110,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={onApply}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                minWidth: 110,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <AppDropdown
            label="Team Member"
            value={draft.teamIds}
            multiple
            placeholder="Select Team Member"
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

          <AppDropdown
            label="Location"
            value={draft.locations}
            multiple
            placeholder="Select Location"
            renderValue={(selected) => {
              const locs = selected as readonly string[];
              if (!locs.length) return "Select Location";
              if (locs.length === availableLocations.length) return "All";
              return locs.join(", ");
            }}
            onChange={(val) => {
              const next = val as CalendarBookingLocation[];
              setDraft((p) => ({
                ...p,
                locations: next.length ? next : [...availableLocations],
              }));
            }}
            options={availableLocations.map((location) => ({
              label: location,
              value: location,
            }))}
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDatePicker
                label="Date (from)"
                value={draft.dateFrom}
                onChange={(val) => setDraft((p) => ({ ...p, dateFrom: val }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDatePicker
                label="Date (To)"
                value={draft.dateTo}
                onChange={(val) => setDraft((p) => ({ ...p, dateTo: val }))}
                min={draft.dateFrom || undefined}
                fullWidth
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDropdown
                label="Day (From)"
                value={draft.dayFrom}
                onChange={(val) =>
                  setDraft((p) => ({ ...p, dayFrom: String(val) as AvailabilityDraft["dayFrom"] }))
                }
                options={dayOptions}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDropdown
                label="Day (To)"
                value={draft.dayTo}
                onChange={(val) =>
                  setDraft((p) => ({ ...p, dayTo: String(val) as AvailabilityDraft["dayTo"] }))
                }
                options={dayOptions}
                fullWidth
              />
            </Box>
          </Stack>

          {draft.shifts.map((shift, index) => (
            <Stack key={`shift-${index}`} direction="row" spacing={1.25} alignItems="flex-end">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTimePicker
                  label="Start Time"
                  value={shift.start}
                  onChange={(val) =>
                    setDraft((p) => ({
                      ...p,
                      shifts: p.shifts.map((item, i) => (i === index ? { ...item, start: val } : item)),
                    }))
                  }
                  fullWidth
                  sx={{ minHeight: 40, py: 0.5 }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTimePicker
                  label="End Time"
                  value={shift.end}
                  onChange={(val) =>
                    setDraft((p) => ({
                      ...p,
                      shifts: p.shifts.map((item, i) => (i === index ? { ...item, end: val } : item)),
                    }))
                  }
                  fullWidth
                  sx={{ minHeight: 40, py: 0.5 }}
                />
              </Box>
              {draft.shifts.length > 1 ? (
                <IconButton
                  size="small"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      shifts: p.shifts.filter((_, i) => i !== index),
                    }))
                  }
                  sx={{ mb: 0.5, color: alpha(m.navy, 0.45) }}
                  aria-label="Remove shift"
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
          ))}

          <Button
            onClick={() =>
              setDraft((p) => ({
                ...p,
                shifts: [...p.shifts, { start: "09:00", end: "17:00" }],
              }))
            }
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13.5,
              color: m.slate,
              px: 0,
              minWidth: 0,
              gap: 1,
              "&:hover": {
                bgcolor: "transparent",
                color: alpha(m.navy, 0.78),
                "& .add-shift-icon": {
                  bgcolor: m.addSoftBgHover,
                },
              },
            }}
          >
            <Box
              className="add-shift-icon"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                bgcolor: m.addSoftBg,
                color: m.addSoftFg,
                display: "grid",
                placeItems: "center",
                transition: "background-color 0.15s ease",
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            Add Shift
          </Button>
        </Stack>
      </Box>
    </AppModal>
  );
}
