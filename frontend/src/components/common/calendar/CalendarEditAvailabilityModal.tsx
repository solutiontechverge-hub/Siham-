"use client";

import AppButton from "../AppButton";
import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
import type {
  CalendarBookingLocation,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
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
      const next = has
        ? prev.locations.filter((item) => item !== location)
        : [...prev.locations, location];
      return {
        ...prev,
        locations: next.length ? next : [...availableLocations],
      };
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Availability"
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <AppButton tone="secondary" onClick={onClose} sx={{ height: 38 }}>
              Cancel
            </AppButton>
            <AppButton tone="primary" onClick={onApply} sx={{ height: 38 }}>
              Save
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}
          >
            {resource?.name ?? "Team member"} · {draft.date}
          </BodyText>

          <Stack direction="row" spacing={1}>
            {availableLocations.map((location) => {
              const active = draft.locations.includes(location);
              return (
                <AppButton
                  key={location}
                  variant={active ? "contained" : "outlined"}
                  onClick={() => toggleLocation(location)}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: active ? m.teal : "#fff",
                    "&:hover": {
                      bgcolor: active ? m.tealDark : alpha(m.teal, 0.04),
                    },
                  }}
                >
                  {location}
                </AppButton>
              );
            })}
          </Stack>

          {draft.shifts.map((shift, index) => (
            <Stack
              key={`shift-${index}`}
              direction="row"
              spacing={1.25}
              alignItems="flex-end"
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTimePicker
                  variant="wheel"
                  label="Start"
                  value={shift.start}
                  onChange={(val) =>
                    setDraft((p) => ({
                      ...p,
                      shifts: p.shifts.map((item, i) =>
                        i === index ? { ...item, start: val } : item,
                      ),
                    }))
                  }
                  fullWidth
                  sx={{ minHeight: 40, py: 0.5 }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTimePicker
                  variant="wheel"
                  label="End"
                  value={shift.end}
                  onChange={(val) =>
                    setDraft((p) => ({
                      ...p,
                      shifts: p.shifts.map((item, i) =>
                        i === index ? { ...item, end: val } : item,
                      ),
                    }))
                  }
                  fullWidth
                  sx={{ minHeight: 40, py: 0.5 }}
                />
              </Box>
              <IconButton
                size="small"
                disabled={draft.shifts.length === 1}
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    shifts: p.shifts.filter((_, i) => i !== index),
                  }))
                }
                sx={{ mb: 0.5, color: alpha(m.navy, 0.45) }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <AppButton
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
          </AppButton>
        </Stack>
      </Box>
    </AppModal>
  );
}
