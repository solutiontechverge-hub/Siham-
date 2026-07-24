"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
import type {
  CalendarBookingLocation,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
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
  setDraft: React.Dispatch<
    React.SetStateAction<BlockTimeDraft & { activity?: string }>
  >;
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

const titleOptions = [
  { label: "Meeting", value: "Meeting" },
  { label: "Training", value: "Training" },
  { label: "Holiday", value: "Holiday" },
  { label: "Custom", value: "Custom" },
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
  const modalTitle = isSchedule
    ? isEdit
      ? "Edit Block Time"
      : "Add Block Time"
    : "Add Block Time";

  const teamMemberNameById = React.useCallback(
    (resourceId: string) =>
      resources.find((resource) => resource.id === resourceId)?.name ??
      resourceId,
    [resources],
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={modalTitle}
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <AppButton
              tone="secondary"
              onClick={onClose}
              sx={{
                height: 38,
                minWidth: 110,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={onApply}
              sx={{
                height: 38,
                minWidth: 110,
              }}
            >
              Apply
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <AppDropdown
            label="Title"
            value={draft.title}
            placeholder="e.g photoshoot"
            onChange={(val) =>
              setDraft((p) => ({
                ...p,
                title: String(val) as BlockTimeDraft["title"],
                ...(String(val) !== "Custom"
                  ? { customTitle: "", activity: String(val) }
                  : { activity: p.customTitle ?? "" }),
              }))
            }
            options={titleOptions}
            fullWidth
          />
          {draft.title === "Custom" ? (
            <AppTextField
              label="Custom Title"
              placeholder="e.g photoshoot"
              value={draft.customTitle ?? draft.activity ?? ""}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  customTitle: e.target.value,
                  activity: e.target.value,
                }))
              }
              fullWidth
            />
          ) : null}

          {isEdit && isSchedule ? (
            <AppTextField
              label="Team Member"
              value={editingTeamMemberName ?? ""}
              fullWidth
              disabled
            />
          ) : (
            <AppDropdown
              label="Team Member"
              value={draft.teamIds}
              multiple={!isEdit}
              placeholder="Select Team Member"
              renderValue={(selected) => {
                const ids = selected as readonly string[];
                if (!ids.length) return "Select Team Member";
                if (ids.length === resources.length) return "All";
                return ids
                  .map((id) => teamLabelById.get(id) ?? teamMemberNameById(id))
                  .join(", ");
              }}
              onChange={(val) =>
                setDraft((p) => ({ ...p, teamIds: val as string[] }))
              }
              options={resources.map((r) => ({
                value: r.id,
                label: teamLabelById.get(r.id) ?? r.name,
              }))}
              fullWidth
            />
          )}

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
                onChange={(iso) => setDraft((p) => ({ ...p, dateFrom: iso }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDatePicker
                label="Date (To)"
                value={draft.dateTo}
                onChange={(iso) => setDraft((p) => ({ ...p, dateTo: iso }))}
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
                  setDraft((p) => ({
                    ...p,
                    dayFrom: String(val) as BlockTimeDraft["dayFrom"],
                  }))
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
                  setDraft((p) => ({
                    ...p,
                    dayTo: String(val) as BlockTimeDraft["dayTo"],
                  }))
                }
                options={dayOptions}
                fullWidth
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="Start Time"
                value={draft.startTime}
                onChange={(val) => setDraft((p) => ({ ...p, startTime: val }))}
                fullWidth
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="End Time"
                value={draft.endTime}
                onChange={(val) => setDraft((p) => ({ ...p, endTime: val }))}
                fullWidth
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
          </Stack>
        </Stack>
      </Box>
    </AppModal>
  );
}
