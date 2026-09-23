"use client";

import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";
import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Box, ButtonBase, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import { AppTimePanel, formatTimeDisplay } from "../AppTimePicker";
import AppModal from "../AppModal";
import { BodyText } from "../../ui/typography";
import { calendarModalFlexFieldSx } from "./calendar.utils";

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
  // Prefer saved schedule so FL/DL can independently be Fixed or Variable.
  const schedule =
    scheduleTypeForLocation(entries, location) ||
    preferredScheduleForLocation(location);
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

  const firstDay = days[0];
  return {
    location,
    locations: [location],
    schedule,
    day: firstDay?.day || "",
    dateFrom: "",
    dateTo: "",
    startTime: firstDay?.startTime || "09:00",
    endTime: firstDay?.endTime || "17:00",
    notAvailable: Boolean(firstDay?.off),
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

/** Fixed schedule → Fixed Location (FL); Variable schedule → Desired Location (DL). */
export function preferredLocationForSchedule(
  schedule: "" | "fixed" | "variable",
  available: readonly PublicBusinessHoursLocation[] = ["FL", "DL"],
): PublicBusinessHoursLocation | "" {
  const allowed = available.filter(
    (item): item is PublicBusinessHoursLocation =>
      item === "FL" || item === "DL",
  );
  if (schedule === "fixed" && allowed.includes("FL")) return "FL";
  if (schedule === "variable" && allowed.includes("DL")) return "DL";
  if (schedule === "fixed" && allowed.includes("DL")) return "DL";
  if (schedule === "variable" && allowed.includes("FL")) return "FL";
  return allowed[0] || "";
}

/** FL defaults to Fixed schedule; DL defaults to Variable schedule. */
export function preferredScheduleForLocation(
  location: "" | PublicBusinessHoursLocation,
): "fixed" | "variable" {
  return location === "DL" ? "variable" : "fixed";
}

type CalendarPublicBusinessHoursModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  draft: PublicBusinessHoursDraft;
  setDraft: React.Dispatch<React.SetStateAction<PublicBusinessHoursDraft>>;
  /** Locations offered by this professional (FL / DL / both). */
  availableLocations?: readonly PublicBusinessHoursLocation[];
  /** Saved hours — used when switching Location in the modal. */
  existingEntries?: readonly PublicBusinessHoursEntry[];
};

export default function CalendarPublicBusinessHoursModal({
  open,
  onClose,
  onApply,
  draft,
  setDraft,
  availableLocations = ["FL", "DL"],
  existingEntries = [],
}: CalendarPublicBusinessHoursModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const locationOptions = React.useMemo(() => {
    const allowed = new Set(
      availableLocations.filter(
        (item): item is PublicBusinessHoursLocation =>
          item === "FL" || item === "DL",
      ),
    );
    const options: { label: string; value: PublicBusinessHoursLocation }[] = [];
    if (allowed.has("FL") || allowed.size === 0) {
      options.push({ label: "Fixed Location", value: "FL" });
    }
    if (allowed.has("DL") || allowed.size === 0) {
      options.push({ label: "Desired Location", value: "DL" });
    }
    return options;
  }, [availableLocations]);
  const location =
    draft.location ||
    draft.locations[0] ||
    locationOptions[0]?.value ||
    ("" as PublicBusinessHoursLocation | "");
  const offLabel = offLabelForLocation(location);
  const isVariable = draft.schedule === "variable";
  const selectedDay = draft.day || WEEKDAY_ORDER[0];
  const dayConfigs = draft.days?.length
    ? draft.days
    : createDefaultPublicHoursDayConfigs();
  const activeDay =
    dayConfigs.find((row) => row.day === selectedDay) ?? dayConfigs[0];
  const timesDisabled = Boolean(activeDay?.off);
  const [editingTimeField, setEditingTimeField] = React.useState<
    "start" | "end"
  >("start");

  React.useEffect(() => {
    if (!open) return;
    setEditingTimeField("start");
  }, [open, selectedDay, location]);

  const selectDay = React.useCallback(
    (day: PublicBusinessHoursDay) => {
      setDraft((prev) => {
        const days =
          prev.days?.length === 7
            ? prev.days
            : createDefaultPublicHoursDayConfigs();
        const active = days.find((row) => row.day === day) ?? days[0];
        return {
          ...prev,
          day,
          startTime: active.startTime,
          endTime: active.endTime,
          notAvailable: active.off,
          days,
        };
      });
    },
    [setDraft],
  );

  const updateDay = React.useCallback(
    (day: PublicBusinessHoursDay, patch: Partial<PublicHoursDayConfig>) => {
      setDraft((prev) => {
        const days = (prev.days?.length === 7
          ? prev.days
          : createDefaultPublicHoursDayConfigs()
        ).map((row) => (row.day === day ? { ...row, ...patch } : row));
        const nextActive =
          days.find((row) => row.day === day) ??
          days.find((row) => row.day === (prev.day || WEEKDAY_ORDER[0])) ??
          days[0];
        return {
          ...prev,
          day,
          days,
          startTime: nextActive.startTime,
          endTime: nextActive.endTime,
          notAvailable: nextActive.off,
        };
      });
    },
    [setDraft],
  );

  const switchLocation = React.useCallback(
    (next: PublicBusinessHoursLocation) => {
      const hasSaved = existingEntries.some((entry) => entry.location === next);
      const nextDraft = hasSaved
        ? draftFromPublicBusinessHoursEntries(existingEntries, next)
        : createEmptyPublicBusinessHoursDraft(next);
      // Load that location's own saved (or default) schedule — do not force FL↔Fixed / DL↔Variable.
      setDraft(nextDraft);
    },
    [existingEntries, setDraft],
  );

  const switchSchedule = React.useCallback(
    (nextSchedule: "fixed" | "variable") => {
      // Schedule type is independent of location — stay on the current FL/DL.
      setDraft((p) => ({
        ...p,
        schedule: nextSchedule,
        note:
          nextSchedule === "variable"
            ? p.note.slice(0, PUBLIC_HOURS_NOTE_MAX_LENGTH)
            : "",
      }));
    },
    [setDraft],
  );

  React.useEffect(() => {
    if (!open) return;
    setDraft((prev) => {
      const allowed = availableLocations.filter(
        (item): item is PublicBusinessHoursLocation =>
          item === "FL" || item === "DL",
      );
      const fallbackLocation =
        allowed[0] ||
        prev.location ||
        prev.locations[0] ||
        ("" as PublicBusinessHoursLocation | "");
      const nextLocation =
        prev.location &&
        (allowed.length === 0 || allowed.includes(prev.location))
          ? prev.location
          : fallbackLocation;
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
        schedule:
          prev.schedule ||
          (nextLocation === "DL"
            ? "variable"
            : nextLocation === "FL"
              ? "fixed"
              : ""),
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
  }, [open, availableLocations, setDraft]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Public Business Hours"
      maxWidth="sm"
      fullWidth
      footer={
        <ModalCancelApplyFooter onCancel={onClose} onPrimary={onApply} />
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <AppDropdown
            label="Location"
            value={location}
            onChange={(val) =>
              switchLocation(String(val) as PublicBusinessHoursLocation)
            }
            options={locationOptions}
            placeholder="Select Location"
            fullWidth
          />

          <AppDropdown
            label="Schedule"
            value={draft.schedule}
            onChange={(val) => {
              const next = String(val);
              if (next !== "fixed" && next !== "variable") return;
              switchSchedule(next);
            }}
            options={[
              { label: "Fixed schedule", value: "fixed" },
              { label: "Variable schedule", value: "variable" },
            ]}
            placeholder="Select Schedule"
            fullWidth
          />

          <Stack spacing={0.75}>
            <BodyText
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: alpha(m.navy, 0.9),
              }}
            >
              Hours by day
            </BodyText>
            {dayConfigs.map((row) => {
              const isSelected = row.day === selectedDay;
              const timeLabel = row.off
                ? offLabel
                : `${formatTimeDisplay(row.startTime) || row.startTime} – ${formatTimeDisplay(row.endTime) || row.endTime}`;
              return (
                <Box
                  key={row.day}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minHeight: 44,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: "6px",
                    border: `1px solid ${
                      isSelected ? m.teal : alpha(m.navy, 0.12)
                    }`,
                    bgcolor: isSelected ? alpha(m.teal, 0.06) : "#fff",
                  }}
                >
                  <ButtonBase
                    onClick={() => selectDay(row.day)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: "space-between",
                      gap: 1,
                      py: 0.5,
                      textAlign: "left",
                    }}
                  >
                    <BodyText
                      sx={{
                        fontSize: 13,
                        fontWeight: isSelected ? 800 : 700,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      {row.day}
                    </BodyText>
                    <BodyText
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: alpha(m.navy, row.off ? 0.45 : 0.62),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {timeLabel}
                    </BodyText>
                  </ButtonBase>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(row.off)}
                        onChange={(e) => {
                          selectDay(row.day);
                          updateDay(row.day, { off: e.target.checked });
                        }}
                        size="small"
                        sx={{
                          color: alpha(m.navy, 0.35),
                          "&.Mui-checked": { color: m.teal },
                          py: 0,
                        }}
                      />
                    }
                    label={offLabel}
                    sx={{
                      m: 0,
                      mr: 0.25,
                      flexShrink: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: 12,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.72),
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>

          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25}>
              {(
                [
                  {
                    key: "start" as const,
                    label: "Start Time (From)",
                    value: activeDay?.startTime || "09:00",
                  },
                  {
                    key: "end" as const,
                    label: "End Time (To)",
                    value: activeDay?.endTime || "17:00",
                  },
                ] as const
              ).map((field) => {
                const active = editingTimeField === field.key && !timesDisabled;
                return (
                  <Box key={field.key} sx={calendarModalFlexFieldSx}>
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
                      {field.label}
                    </BodyText>
                    <ButtonBase
                      disabled={timesDisabled}
                      onClick={() => setEditingTimeField(field.key)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        width: "100%",
                        minHeight: 40,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: "6px",
                        border: `1px solid ${
                          active ? m.teal : alpha(m.navy, 0.14)
                        }`,
                        bgcolor: timesDisabled
                          ? alpha(m.navy, 0.04)
                          : active
                            ? alpha(m.teal, 0.06)
                            : "#fff",
                        cursor: timesDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <BodyText
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: alpha(m.navy, timesDisabled ? 0.4 : 0.78),
                        }}
                      >
                        {formatTimeDisplay(field.value) || field.value}
                      </BodyText>
                      <AccessTimeRoundedIcon
                        sx={{
                          fontSize: 18,
                          color: active ? m.teal : alpha(m.navy, 0.45),
                        }}
                      />
                    </ButtonBase>
                  </Box>
                );
              })}
            </Stack>

            {!timesDisabled ? (
              <Box
                sx={{
                  borderRadius: "16px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  overflow: "hidden",
                  bgcolor: "#fff",
                  boxShadow: "0 8px 24px rgba(16, 35, 63, 0.08)",
                  display: "flex",
                  justifyContent: "center",
                  py: 1,
                }}
              >
                <AppTimePanel
                  compact
                  hideHeader
                  variant="wheel"
                  value={
                    editingTimeField === "start"
                      ? activeDay?.startTime || "09:00"
                      : activeDay?.endTime || "17:00"
                  }
                  onChange={(val) =>
                    updateDay(
                      selectedDay,
                      editingTimeField === "start"
                        ? { startTime: val, off: false }
                        : { endTime: val, off: false },
                    )
                  }
                  minuteStep={1}
                  disabled={timesDisabled}
                />
              </Box>
            ) : null}
          </Stack>

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
