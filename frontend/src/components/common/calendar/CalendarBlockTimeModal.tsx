"use client";

import * as React from "react";
import { Box, Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";
import type { CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BlockTimeDraft } from "./calendar.utils";

type CalendarBlockTimeModalProps = {
  availableLocations?: readonly CalendarBookingLocation[];
  draft: BlockTimeDraft & { activity?: string };
  mode?: "add" | "edit";
  variant?: "calendar" | "schedule";
  onApply: () => void;
  onClose: () => void;
  open: boolean;
  resources: readonly CalendarResource[];
  setDraft: React.Dispatch<React.SetStateAction<BlockTimeDraft & { activity?: string }>>;
  teamLabelById?: ReadonlyMap<string, string>;
  editingTeamMemberName?: string;
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

export default function CalendarBlockTimeModal({
  availableLocations = ["FL", "DL"],
  draft,
  mode = "add",
  variant = "calendar",
  onApply,
  onClose,
  open,
  resources,
  setDraft,
  teamLabelById = new Map(),
  editingTeamMemberName,
}: CalendarBlockTimeModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isEdit = mode === "edit";
  const isSchedule = variant === "schedule";
  const modalTitle = isSchedule ? (isEdit ? "Edit Block Time" : "Add Block Time") : "Add Block Time";

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
      title={modalTitle}
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
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                minWidth: 110,
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
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
                minWidth: 110,
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
          {isSchedule ? (
            <AppTextField
              label="Activity"
              value={draft.activity ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, activity: e.target.value }))}
              fullWidth
            />
          ) : (
            <AppSelect
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value as BlockTimeDraft["title"] }))}
              options={[
                { label: "Meeting", value: "Meeting" },
                { label: "Training", value: "Training" },
                { label: "Holiday", value: "Holiday" },
                { label: "Custom", value: "Custom" },
              ]}
              fullWidth
            />
          )}

          {isEdit && isSchedule ? (
            <AppTextField label="Team Member" value={editingTeamMemberName ?? ""} fullWidth disabled />
          ) : (
            <AppDropdown
              label="Team Member"
              value={draft.teamIds}
              multiple={!isEdit}
              closeOnSelect={isSchedule}
              placeholder="Select Team Member"
              renderValue={(selected) => {
                const ids = selected as readonly string[];
                if (isSchedule) return formatTeamMemberSelection(ids);
                if (!ids.length) return "Select Team Member";
                if (ids.length === resources.length) return "All";
                return ids.map((id) => teamLabelById.get(id) ?? teamMemberNameById(id)).join(", ");
              }}
              onChange={(val) => setDraft((p) => ({ ...p, teamIds: val as string[] }))}
              options={resources.map((r) => ({
                value: r.id,
                label: isSchedule ? r.name : (teamLabelById.get(r.id) ?? r.name),
              }))}
              fullWidth
            />
          )}

          {!isSchedule ? (
            <AppDropdown
              label="Location"
              value={draft.locations}
              multiple
              closeOnSelect
              placeholder="Select Location"
              renderValue={(selected) => {
                const locs = selected as readonly string[];
                if (!locs.length) return "Select Location";
                if (locs.length === availableLocations.length) return "All";
                return locs.join(", ");
              }}
              onChange={(val) => setDraft((p) => ({ ...p, locations: val as CalendarBookingLocation[] }))}
              options={availableLocations.map((location) => ({ label: location, value: location }))}
              fullWidth
            />
          ) : null}

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1 }}>
              <AppDatePicker
                label="Date (from)"
                value={draft.dateFrom}
                onChange={(iso) => setDraft((p) => ({ ...p, dateFrom: iso }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <AppDatePicker
                label="Date (to)"
                value={draft.dateTo}
                onChange={(iso) => setDraft((p) => ({ ...p, dateTo: iso }))}
                min={draft.dateFrom || undefined}
                fullWidth
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppSelect
              label="Day (from)"
              value={draft.dayFrom}
              onChange={(e) => setDraft((p) => ({ ...p, dayFrom: e.target.value as BlockTimeDraft["dayFrom"] }))}
              options={dayOptions}
              fullWidth
            />
            <AppSelect
              label="Day (to)"
              value={draft.dayTo}
              onChange={(e) => setDraft((p) => ({ ...p, dayTo: e.target.value as BlockTimeDraft["dayTo"] }))}
              options={dayOptions}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppTextField
              label="Start Time"
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft((p) => ({ ...p, startTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <AppTextField
              label="End Time"
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft((p) => ({ ...p, endTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>
      </Box>
    </MollureModal>
  );
}
