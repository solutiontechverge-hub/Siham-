"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import AppDatePicker from "../AppDatePicker";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
import type {
  CalendarBookingLocation,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  weekdayNameFromIso,
  type BlockTimeDraft,
} from "./calendar.utils";

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
  const isEdit = mode === "edit";
  const isSchedule = variant === "schedule";
  const modalTitle = isSchedule
    ? isEdit
      ? "Edit Block Time"
      : "Add Block Time"
    : "Add Block Time";

  const showDays =
    Boolean(draft.dateFrom) &&
    Boolean(draft.dateTo) &&
    draft.dateFrom !== draft.dateTo;

  const dayFromLabel = draft.dateFrom
    ? weekdayNameFromIso(draft.dateFrom)
    : draft.dayFrom;
  const dayToLabel = draft.dateTo
    ? weekdayNameFromIso(draft.dateTo)
    : draft.dayTo;

  const patchDates = React.useCallback(
    (patch: { dateFrom?: string; dateTo?: string }) => {
      setDraft((p) => {
        const dateFrom = patch.dateFrom ?? p.dateFrom;
        let dateTo = patch.dateTo ?? p.dateTo;
        if (dateFrom && dateTo && dateTo < dateFrom) dateTo = dateFrom;
        return {
          ...p,
          dateFrom,
          dateTo,
          dayFrom: dateFrom ? weekdayNameFromIso(dateFrom) : p.dayFrom,
          dayTo: dateTo
            ? weekdayNameFromIso(dateTo)
            : dateFrom
              ? weekdayNameFromIso(dateFrom)
              : p.dayTo,
        };
      });
    },
    [setDraft],
  );

  React.useEffect(() => {
    if (!open) return;
    if (!draft.dateFrom && !draft.dateTo) return;
    const nextFrom = draft.dateFrom
      ? weekdayNameFromIso(draft.dateFrom)
      : draft.dayFrom;
    const nextTo = draft.dateTo
      ? weekdayNameFromIso(draft.dateTo)
      : draft.dayTo;
    if (nextFrom === draft.dayFrom && nextTo === draft.dayTo) return;
    setDraft((p) => ({ ...p, dayFrom: nextFrom, dayTo: nextTo }));
  }, [open, draft.dateFrom, draft.dateTo, draft.dayFrom, draft.dayTo, setDraft]);

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
              disabled={!draft.title}
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
                onChange={(iso) => patchDates({ dateFrom: iso })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppDatePicker
                label="Date (To)"
                value={draft.dateTo}
                onChange={(iso) => patchDates({ dateTo: iso })}
                min={draft.dateFrom || undefined}
                fullWidth
              />
            </Box>
          </Stack>

          {showDays ? (
            <Stack direction="row" spacing={1.25}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTextField
                  label="Day (From)"
                  value={dayFromLabel}
                  fullWidth
                  disabled
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AppTextField
                  label="Day (To)"
                  value={dayToLabel}
                  fullWidth
                  disabled
                />
              </Box>
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                variant="wheel"
                label="Start Time"
                value={draft.startTime}
                onChange={(val) => setDraft((p) => ({ ...p, startTime: val }))}
                fullWidth
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                variant="wheel"
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
