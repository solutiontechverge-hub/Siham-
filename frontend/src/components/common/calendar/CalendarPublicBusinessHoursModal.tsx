"use client";

import AppButton from "../AppButton";
import * as React from "react";
import {
  Box,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
import { BodyText } from "../../ui/typography";

export const PUBLIC_HOURS_NOTE_MAX_LENGTH = 120;

export type PublicBusinessHoursLocation = "FL" | "DL";

export type PublicBusinessHoursDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

/** Persisted public business hours row (one location + one weekday). */
export type PublicBusinessHoursEntry = {
  location: "" | PublicBusinessHoursLocation;
  schedule: "" | "fixed" | "variable";
  day: "" | PublicBusinessHoursDay;
  dateFrom: string;
  dateTo: string;
  startTime: string;
  endTime: string;
  notAvailable: boolean;
  note: string;
};

export type PublicHoursDayConfig = {
  day: PublicBusinessHoursDay;
  startTime: string;
  endTime: string;
  off: boolean;
};

/** Modal draft — one location at a time; Mon–Sun day configs. */
export type PublicBusinessHoursDraft = {
  location: "" | PublicBusinessHoursLocation;
  /** @deprecated multi-select removed; kept for legacy callers */
  locations: PublicBusinessHoursLocation[];
  schedule: "" | "fixed" | "variable";
  day: "" | PublicBusinessHoursDay;
  dateFrom: string;
  dateTo: string;
  startTime: string;
  endTime: string;
  notAvailable: boolean;
  note: string;
  days: PublicHoursDayConfig[];
};

export const WEEKDAY_ORDER: PublicBusinessHoursDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function createDefaultPublicHoursDayConfigs(): PublicHoursDayConfig[] {
  return WEEKDAY_ORDER.map((day) => ({
    day,
    startTime: "09:00",
    endTime: "17:00",
    off: false,
  }));
}

export function createEmptyPublicBusinessHoursDraft(
  location?: PublicBusinessHoursLocation,
): PublicBusinessHoursDraft {
  return {
    location: location ?? "",
    locations: location ? [location] : [],
    schedule: location === "DL" ? "variable" : location === "FL" ? "fixed" : "",
    day: "",
    dateFrom: "",
    dateTo: "",
    startTime: "09:00",
    endTime: "17:00",
    notAvailable: false,
    note: "",
    days: createDefaultPublicHoursDayConfigs(),
  };
}

export function offLabelForLocation(
  location: "" | PublicBusinessHoursLocation | undefined,
) {
  return location === "DL" ? "Not Available" : "Closed";
}

export function scheduleLabelForType(
  schedule: "" | "fixed" | "variable" | undefined,
) {
  if (schedule === "variable") return "Variable Schedule";
  if (schedule === "fixed") return "Fixed Schedule";
  return "Schedule";
}

/** Build modal draft from saved weekly entries for one location. */
export function draftFromPublicBusinessHoursEntries(
  entries: readonly PublicBusinessHoursEntry[],
  location: PublicBusinessHoursLocation,
): PublicBusinessHoursDraft {
  const forLocation = entries.filter((entry) => entry.location === location);
  const schedule =
    forLocation.find((entry) => entry.schedule)?.schedule ||
    (location === "DL" ? "variable" : "fixed");
  const note =
    forLocation.find((entry) => entry.note?.trim())?.note?.trim() || "";

  const days = WEEKDAY_ORDER.map((day) => {
    const match = [...forLocation]
      .reverse()
      .find((entry) => entry.day === day);
    if (!match) {
      return {
        day,
        startTime: "09:00",
        endTime: "17:00",
        off: false,
      };
    }
    return {
      day,
      startTime: match.startTime || "09:00",
      endTime: match.endTime || "17:00",
      off: Boolean(match.notAvailable),
    };
  });

  return {
    location,
    locations: [location],
    schedule,
    day: "",
    dateFrom: "",
    dateTo: "",
    startTime: "09:00",
    endTime: "17:00",
    notAvailable: false,
    note: schedule === "variable" ? note.slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH) : "",
    days,
  };
}

/** Expand draft into persisted weekday rows (no date range). */
export function expandPublicBusinessHoursDraft(
  draft: PublicBusinessHoursDraft,
): PublicBusinessHoursEntry[] {
  const location =
    draft.location ||
    draft.locations[0] ||
    ("" as "" | PublicBusinessHoursLocation);
  if (!location) return [];

  const dayConfigs =
    draft.days?.length === 7
      ? draft.days
      : createDefaultPublicHoursDayConfigs().map((row) =>
          row.day === draft.day
            ? {
                ...row,
                startTime: draft.startTime || row.startTime,
                endTime: draft.endTime || row.endTime,
                off: draft.notAvailable,
              }
            : row,
        );

  const note =
    draft.schedule === "variable"
      ? draft.note.trim().slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH)
      : "";

  return dayConfigs.map((dayConfig) => ({
    location,
    schedule: draft.schedule,
    day: dayConfig.day,
    dateFrom: "",
    dateTo: "",
    startTime: dayConfig.off ? "" : dayConfig.startTime,
    endTime: dayConfig.off ? "" : dayConfig.endTime,
    notAvailable: dayConfig.off,
    note,
  }));
}

/** Replace all entries for draft location(s); keep other locations intact. */
export function replacePublicBusinessHoursForLocations(
  existing: readonly PublicBusinessHoursEntry[],
  draft: PublicBusinessHoursDraft,
): PublicBusinessHoursEntry[] {
  const locations = new Set<PublicBusinessHoursLocation>(
    draft.location
      ? [draft.location]
      : draft.locations.length
        ? draft.locations
        : [],
  );
  if (!locations.size) return [...existing];
  const kept = existing.filter(
    (entry) =>
      !entry.location ||
      !locations.has(entry.location as PublicBusinessHoursLocation),
  );
  return [...kept, ...expandPublicBusinessHoursDraft(draft)];
}

export function locationHasPublicHoursConfigured(
  entries: readonly PublicBusinessHoursEntry[],
  location: PublicBusinessHoursLocation,
) {
  return entries.some(
    (entry) =>
      entry.location === location &&
      Boolean(entry.day) &&
      (entry.notAvailable || Boolean(entry.startTime && entry.endTime)),
  );
}

export function variableNoteForLocation(
  entries: readonly PublicBusinessHoursEntry[],
  location: PublicBusinessHoursLocation,
) {
  const match = entries.find(
    (entry) =>
      entry.location === location &&
      entry.schedule === "variable" &&
      Boolean(entry.note?.trim()),
  );
  return match?.note?.trim() || "";
}

export function scheduleTypeForLocation(
  entries: readonly PublicBusinessHoursEntry[],
  location: PublicBusinessHoursLocation,
): "" | "fixed" | "variable" {
  const match = [...entries]
    .reverse()
    .find((entry) => entry.location === location && entry.schedule);
  return match?.schedule || "";
}

type CalendarPublicBusinessHoursModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  draft: PublicBusinessHoursDraft;
  setDraft: React.Dispatch<React.SetStateAction<PublicBusinessHoursDraft>>;
};

export default function CalendarPublicBusinessHoursModal({
  open,
  onClose,
  onApply,
  draft,
  setDraft,
}: CalendarPublicBusinessHoursModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const location =
    draft.location || draft.locations[0] || ("" as PublicBusinessHoursLocation | "");
  const offLabel = offLabelForLocation(location);
  const isVariable = draft.schedule === "variable";
  const selectedDay = draft.day || WEEKDAY_ORDER[0];
  const dayConfigs = draft.days?.length
    ? draft.days
    : createDefaultPublicHoursDayConfigs();
  const activeDay =
    dayConfigs.find((row) => row.day === selectedDay) ?? dayConfigs[0];

  const updateActiveDay = React.useCallback(
    (patch: Partial<PublicHoursDayConfig>) => {
      setDraft((prev) => {
        const days = (prev.days?.length
          ? prev.days
          : createDefaultPublicHoursDayConfigs()
        ).map((row) =>
          row.day === (prev.day || WEEKDAY_ORDER[0])
            ? { ...row, ...patch }
            : row,
        );
        const nextActive =
          days.find((row) => row.day === (prev.day || WEEKDAY_ORDER[0])) ??
          days[0];
        return {
          ...prev,
          days,
          startTime: nextActive.startTime,
          endTime: nextActive.endTime,
          notAvailable: nextActive.off,
        };
      });
    },
    [setDraft],
  );

  React.useEffect(() => {
    if (!open) return;
    setDraft((prev) => {
      const nextLocation =
        prev.location || prev.locations[0] || ("" as PublicBusinessHoursLocation | "");
      const days =
        prev.days?.length === 7
          ? prev.days
          : createDefaultPublicHoursDayConfigs();
      const day = prev.day || WEEKDAY_ORDER[0];
      const active = days.find((row) => row.day === day) ?? days[0];
      return {
        ...prev,
        location: nextLocation,
        locations: nextLocation ? [nextLocation] : prev.locations,
        day,
        days,
        startTime: active.startTime,
        endTime: active.endTime,
        notAvailable: active.off,
        note:
          prev.schedule === "variable"
            ? prev.note.slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH)
            : "",
      };
    });
  }, [open, setDraft]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Public Business Hours"
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <AppButton
              tone="secondary"
              onClick={onClose}
              sx={{ height: 38, minWidth: 110 }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={onApply}
              sx={{ height: 38, minWidth: 110 }}
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
            label="Location"
            value={location}
            onChange={(val) => {
              const next = String(val) as PublicBusinessHoursLocation;
              setDraft((p) => ({
                ...p,
                location: next,
                locations: [next],
                schedule:
                  p.schedule ||
                  (next === "DL" ? "variable" : "fixed"),
              }));
            }}
            options={[
              { label: "Fixed Location (FL)", value: "FL" },
              { label: "Desired Location (DL)", value: "DL" },
            ]}
            placeholder="Select Location"
            fullWidth
          />

          <AppDropdown
            label="Schedule"
            value={draft.schedule}
            onChange={(val) =>
              setDraft((p) => ({
                ...p,
                schedule: String(val) as PublicBusinessHoursDraft["schedule"],
                note:
                  String(val) === "variable"
                    ? p.note.slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH)
                    : "",
              }))
            }
            options={[
              { label: "Fixed schedule", value: "fixed" },
              { label: "Variable schedule", value: "variable" },
            ]}
            placeholder="Select Schedule"
            fullWidth
          />

          <Box>
            <BodyText
              component="label"
              sx={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: alpha(m.navy, 0.9),
                lineHeight: 1.25,
                mb: 0.75,
              }}
            >
              Days
            </BodyText>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
              {dayConfigs.map((row) => {
                const active = row.day === selectedDay;
                return (
                  <ButtonBase
                    key={row.day}
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        day: row.day,
                        startTime: row.startTime,
                        endTime: row.endTime,
                        notAvailable: row.off,
                      }))
                    }
                    sx={{
                      px: 1.1,
                      height: 34,
                      borderRadius: "10px",
                      border: `1px solid ${
                        active ? alpha(m.teal, 0.45) : alpha(m.navy, 0.12)
                      }`,
                      bgcolor: active
                        ? alpha(m.teal, 0.12)
                        : row.off
                          ? alpha(m.navy, 0.04)
                          : "#fff",
                      color: active ? m.teal : alpha(m.navy, 0.7),
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {row.day.slice(0, 3)}
                    {row.off ? "*" : ""}
                  </ButtonBase>
                );
              })}
            </Stack>
            <BodyText
              sx={{
                mt: 0.85,
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
              }}
            >
              Editing {selectedDay}
              {activeDay?.off ? ` (${offLabel})` : ""}
            </BodyText>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="Start Time (from)"
                value={activeDay?.startTime || "09:00"}
                onChange={(val) => updateActiveDay({ startTime: val, off: false })}
                fullWidth
                disabled={Boolean(activeDay?.off)}
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="End Time (to)"
                value={activeDay?.endTime || "17:00"}
                onChange={(val) => updateActiveDay({ endTime: val, off: false })}
                fullWidth
                disabled={Boolean(activeDay?.off)}
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(activeDay?.off)}
                onChange={(e) => updateActiveDay({ off: e.target.checked })}
                size="small"
              />
            }
            label={offLabel}
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.7),
              },
              m: 0,
            }}
          />

          {isVariable ? (
            <AppTextField
              label="Add Note"
              value={draft.note}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  note: e.target.value.slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH),
                }))
              }
              fullWidth
              multiline
              minRows={2}
              helperText={`${draft.note.length}/${PUBLIC_HOURS_NOTE_MAX_LENGTH}`}
              inputProps={{ maxLength: PUBLIC_HOURS_NOTE_MAX_LENGTH }}
            />
          ) : null}
        </Stack>
      </Box>
    </AppModal>
  );
}
