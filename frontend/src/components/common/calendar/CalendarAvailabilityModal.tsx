"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";
import { DAY_FULL_OPTIONS, type AvailabilityDraft } from "./schedule.utils";

type CalendarAvailabilityModalProps = {
  open: boolean;
  mode: "add" | "edit";
  draft: AvailabilityDraft;
  resources: readonly CalendarResource[];
  supportedLocations: readonly CalendarBookingLocation[];
  editingTeamMemberName?: string;
  onClose: () => void;
  onApply: () => void;
  setDraft: React.Dispatch<React.SetStateAction<AvailabilityDraft>>;
};

export default function CalendarAvailabilityModal({
  open,
  mode,
  draft,
  resources,
  supportedLocations,
  editingTeamMemberName,
  onClose,
  onApply,
  setDraft,
}: CalendarAvailabilityModalProps) {
  const m = useTheme().palette.mollure;
  const isEdit = mode === "edit";

  const updateShift = (index: number, key: "start" | "end", value: string) => {
    setDraft((prev) => ({
      ...prev,
      shifts: prev.shifts.map((shift, idx) => (idx === index ? { ...shift, [key]: value } : shift)),
    }));
  };

  const addShift = () => {
    setDraft((prev) => ({
      ...prev,
      shifts: [...prev.shifts, { start: "13:00", end: "18:00" }],
    }));
  };

  const removeShift = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((_, idx) => idx !== index),
    }));
  };

  const teamMemberNameById = React.useCallback(
    (resourceId: string) => resources.find((resource) => resource.id === resourceId)?.name ?? resourceId,
    [resources],
  );

  const formatTeamMemberSelection = React.useCallback(
    (ids: readonly string[]) => {
      if (!ids.length) return "Select Team Member";
      if (ids.length === resources.length) return "All";
      return ids.map((id) => teamMemberNameById(id)).join(", ");
    },
    [resources.length, teamMemberNameById],
  );

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Availability" : "Add Availability"}
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="center" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 40,
                minWidth: 120,
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
                height: 40,
                minWidth: 120,
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
          {isEdit ? (
            <AppTextField label="Team Member" value={editingTeamMemberName ?? ""} fullWidth disabled />
          ) : (
            <AppDropdown
              label="Team Member"
              value={draft.teamIds}
              multiple
              closeOnSelect
              placeholder="Select Team Member"
              renderValue={(selected) => formatTeamMemberSelection(selected as readonly string[])}
              onChange={(val) => setDraft((prev) => ({ ...prev, teamIds: val as string[] }))}
              options={resources.map((resource) => ({
                value: resource.id,
                label: resource.name,
              }))}
              fullWidth
            />
          )}

          <AppDropdown
            label="Location"
            value={isEdit ? (draft.locations[0] ?? "") : draft.locations}
            multiple={!isEdit}
            closeOnSelect
            placeholder="Select Location"
            renderValue={(selected) => {
              if (isEdit) {
                const loc = selected as string;
                return loc || "Select Location";
              }
              const locs = selected as readonly string[];
              if (!locs.length) return "Select Location";
              if (locs.length === supportedLocations.length) return "All";
              return locs.join(", ");
            }}
            onChange={(val) => {
              if (isEdit) {
                setDraft((prev) => ({ ...prev, locations: [val as CalendarBookingLocation] }));
                return;
              }
              setDraft((prev) => ({ ...prev, locations: val as CalendarBookingLocation[] }));
            }}
            options={supportedLocations.map((location) => ({ label: location, value: location }))}
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1 }}>
              <AppDatePicker
                label="Date (from)"
                value={draft.dateFrom}
                onChange={(iso) => setDraft((prev) => ({ ...prev, dateFrom: iso }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <AppDatePicker
                label="Date (To)"
                value={draft.dateTo}
                onChange={(iso) => setDraft((prev) => ({ ...prev, dateTo: iso }))}
                min={draft.dateFrom || undefined}
                fullWidth
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppSelect
              label="Day (From)"
              value={draft.dayFrom}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, dayFrom: e.target.value as AvailabilityDraft["dayFrom"] }))
              }
              options={[...DAY_FULL_OPTIONS]}
              fullWidth
            />
            <AppSelect
              label="Day (To)"
              value={draft.dayTo}
              onChange={(e) => setDraft((prev) => ({ ...prev, dayTo: e.target.value as AvailabilityDraft["dayTo"] }))}
              options={[...DAY_FULL_OPTIONS]}
              fullWidth
            />
          </Stack>

          {draft.shifts.map((shift, index) => (
            <Stack key={`shift-${index}`} direction="row" spacing={1.25} alignItems="flex-end">
              <AppTextField
                label="Start Time"
                type="time"
                value={shift.start}
                onChange={(e) => updateShift(index, "start", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <AppTextField
                label="End Time"
                type="time"
                value={shift.end}
                onChange={(e) => updateShift(index, "end", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              {draft.shifts.length > 1 ? (
                <IconButton
                  size="small"
                  onClick={() => removeShift(index)}
                  sx={{ mb: 0.5, color: alpha(m.navy, 0.45) }}
                >
                  ×
                </IconButton>
              ) : null}
            </Stack>
          ))}

          <Button
            onClick={addShift}
            startIcon={
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "999px",
                  bgcolor: m.teal,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 14 }} />
              </Box>
            }
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 800,
              fontSize: 13,
              color: m.teal,
              px: 0,
              minWidth: 0,
              "&:hover": { bgcolor: "transparent", color: m.tealDark },
            }}
          >
            Add Shift
          </Button>
        </Stack>
      </Box>
    </MollureModal>
  );
}
