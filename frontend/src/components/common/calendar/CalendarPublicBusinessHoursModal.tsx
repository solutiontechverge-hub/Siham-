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
import AppMultiSelect from "../AppMultiSelect";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import AppTimePicker from "../AppTimePicker";
import AppModal from "../AppModal";
import { AppCalendarPanel } from "../AppDatePicker";
import { BodyText } from "../../ui/typography";

const DEFAULT_NOT_AVAILABLE_NOTE = "Shop will be remain close";

type DatePickMode = "single" | "range";

export type PublicBusinessHoursLocation = "FL" | "DL";

export type PublicBusinessHoursDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

/** Persisted public business hours row (one location + one day). */
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

/** Modal draft — location is multi-select; expanded to entries on apply. */
export type PublicBusinessHoursDraft = Omit<PublicBusinessHoursEntry, "location"> & {
  locations: PublicBusinessHoursLocation[];
};

const ISO_DOW_TO_DAY_NAME: PublicBusinessHoursDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function dayNameFromIso(iso: string): PublicBusinessHoursDay | "" {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return ISO_DOW_TO_DAY_NAME[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? "";
}

export function expandPublicBusinessHoursDraft(
  draft: PublicBusinessHoursDraft,
): PublicBusinessHoursEntry[] {
  const dateFrom = draft.dateFrom;
  const dateTo = draft.dateTo || draft.dateFrom;
  const isRange = Boolean(dateFrom && dateTo && dateFrom !== dateTo);

  // Range without a specific day → one row per weekday (shown as week in settings).
  const days: Array<"" | PublicBusinessHoursDay> = draft.day
    ? [draft.day]
    : isRange
      ? [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ]
      : [dayNameFromIso(dateFrom) || ""];

  const entries: PublicBusinessHoursEntry[] = [];
  for (const location of draft.locations) {
    for (const day of days) {
      entries.push({
        location,
        schedule: draft.schedule,
        day,
        dateFrom,
        dateTo,
        startTime: draft.startTime,
        endTime: draft.endTime,
        notAvailable: draft.notAvailable,
        note: draft.note,
      });
    }
  }
  return entries;
}

type CalendarPublicBusinessHoursModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  draft: PublicBusinessHoursDraft;
  setDraft: React.Dispatch<React.SetStateAction<PublicBusinessHoursDraft>>;
};

const dayOptions: Array<{
  label: string;
  value: PublicBusinessHoursDay;
}> = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

const locationOptions = [
  { label: "FL", value: "FL" },
  { label: "DL", value: "DL" },
];

function formatDisplayDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function CalendarPublicBusinessHoursModal({
  open,
  onClose,
  onApply,
  draft,
  setDraft,
}: CalendarPublicBusinessHoursModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [datePickMode, setDatePickMode] = React.useState<DatePickMode>("single");

  React.useEffect(() => {
    if (open) setDatePickMode("single");
  }, [open]);

  const dayLockedToCalendar =
    datePickMode === "single" ||
    Boolean(draft.dateFrom && !draft.dateTo);

  const handleDatePickModeChange = React.useCallback(
    (mode: DatePickMode) => {
      setDatePickMode(mode);
      setDraft((p) => {
        if (mode === "single") {
          const iso = p.dateFrom || p.dateTo || "";
          return {
            ...p,
            dateFrom: iso,
            dateTo: iso,
            day: iso ? dayNameFromIso(iso) : p.day,
          };
        }
        // Range mode: Day field is hidden; clear day so hours cover the whole span.
        if (p.dateFrom && p.dateTo && p.dateFrom === p.dateTo) {
          return { ...p, dateTo: "", day: "" };
        }
        return { ...p, day: "" };
      });
    },
    [setDraft],
  );

  const handleCalendarDaySelect = React.useCallback(
    (iso: string) => {
      setDraft((p) => {
        if (datePickMode === "single") {
          return {
            ...p,
            dateFrom: iso,
            dateTo: iso,
            day: dayNameFromIso(iso),
          };
        }

        // Range: first click (or restart after a complete range).
        if (!p.dateFrom || (p.dateFrom && p.dateTo)) {
          return {
            ...p,
            dateFrom: iso,
            dateTo: "",
            day: "",
          };
        }
        // Second click: set end (swap if earlier than start).
        if (iso < p.dateFrom) {
          return {
            ...p,
            dateFrom: iso,
            dateTo: p.dateFrom,
            day: "",
          };
        }
        return {
          ...p,
          dateTo: iso,
          day: "",
        };
      });
    },
    [datePickMode, setDraft],
  );

  const dateLabel = React.useMemo(() => {
    if (datePickMode === "single") {
      if (!draft.dateFrom) return "Select a day";
      return formatDisplayDate(draft.dateFrom);
    }
    if (!draft.dateFrom) return "Select start date, then end date";
    const from = formatDisplayDate(draft.dateFrom);
    if (!draft.dateTo) return `${from} → select end date`;
    return `${from} – ${formatDisplayDate(draft.dateTo)}`;
  }, [datePickMode, draft.dateFrom, draft.dateTo]);

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
          <AppMultiSelect
            label="Location"
            value={draft.locations}
            onChange={(val) =>
              setDraft((p) => ({
                ...p,
                locations: val as PublicBusinessHoursLocation[],
              }))
            }
            options={locationOptions}
            placeholder="Select Location"
            renderValue={(selected) => {
              if (!selected.length) return "Select Location";
              if (selected.length === locationOptions.length) return "All";
              return selected.join(", ");
            }}
            fullWidth
          />

          <AppDropdown
            label="Schedule"
            value={draft.schedule}
            onChange={(val) =>
              setDraft((p) => ({
                ...p,
                schedule: String(val) as PublicBusinessHoursDraft["schedule"],
              }))
            }
            options={[
              { label: "Fixed schedule", value: "fixed" },
              { label: "Variable schedule", value: "variable" },
            ]}
            placeholder="Select Schedule"
            fullWidth
          />

          {datePickMode === "single" ? (
            <AppDropdown
              label="Day"
              value={draft.day}
              onChange={(val) =>
                setDraft((p) => ({
                  ...p,
                  day: String(val) as PublicBusinessHoursDraft["day"],
                }))
              }
              options={dayOptions}
              placeholder="Select Day"
              fullWidth
              disabled={dayLockedToCalendar}
            />
          ) : null}

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
              Dates
            </BodyText>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {(
                [
                  { id: "single", label: "Single day" },
                  { id: "range", label: "Date range" },
                ] as const
              ).map((option) => {
                const active = datePickMode === option.id;
                return (
                  <ButtonBase
                    key={option.id}
                    onClick={() => handleDatePickModeChange(option.id)}
                    sx={{
                      flex: 1,
                      height: 34,
                      borderRadius: "10px",
                      border: `1px solid ${
                        active ? alpha(m.teal, 0.45) : alpha(m.navy, 0.12)
                      }`,
                      bgcolor: active ? alpha(m.teal, 0.12) : "#fff",
                      color: active ? m.teal : alpha(m.navy, 0.7),
                      fontSize: 12.5,
                      fontWeight: 800,
                    }}
                  >
                    {option.label}
                  </ButtonBase>
                );
              })}
            </Stack>
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 1,
              }}
            >
              {dateLabel}
            </BodyText>
            <Box
              sx={{
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <AppCalendarPanel
                value={draft.dateFrom}
                onChange={handleCalendarDaySelect}
                compact
                daySx={(iso) => {
                  const from = draft.dateFrom;
                  const to = draft.dateTo;
                  if (!from) return undefined;
                  if (datePickMode === "single") {
                    if (iso === from) {
                      return {
                        bgcolor: m.teal,
                        color: "#fff",
                        fontWeight: 900,
                        borderRadius: "9px",
                      };
                    }
                    return undefined;
                  }
                  const isStart = iso === from;
                  const isEnd = Boolean(to) && iso === to;
                  const inRange = Boolean(to) && iso > from && iso < to;
                  if (isStart || isEnd) {
                    return {
                      bgcolor: m.teal,
                      color: "#fff",
                      fontWeight: 900,
                      borderRadius: "9px",
                    };
                  }
                  if (inRange) {
                    return {
                      bgcolor: alpha(m.teal, 0.14),
                      color: alpha(m.navy, 0.82),
                      borderRadius: "9px",
                    };
                  }
                  return undefined;
                }}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="Start Time (from)"
                value={draft.startTime}
                onChange={(val) => setDraft((p) => ({ ...p, startTime: val }))}
                fullWidth
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTimePicker
                label="End Time (to)"
                value={draft.endTime}
                onChange={(val) => setDraft((p) => ({ ...p, endTime: val }))}
                fullWidth
                sx={{ minHeight: 40, py: 0.5 }}
              />
            </Box>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={draft.notAvailable}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDraft((p) => ({
                    ...p,
                    notAvailable: checked,
                    note:
                      checked && !p.note.trim()
                        ? DEFAULT_NOT_AVAILABLE_NOTE
                        : p.note,
                  }));
                }}
                size="small"
              />
            }
            label="Not Availability"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.7),
              },
              m: 0,
            }}
          />

          <AppTextField
            label={draft.notAvailable ? "Add Note (required)" : "Add Note"}
            value={draft.note}
            onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            required={draft.notAvailable}
            error={draft.notAvailable && !draft.note.trim()}
            helperText={
              draft.notAvailable && !draft.note.trim()
                ? "Note is required when Not Availability is selected."
                : undefined
            }
          />
        </Stack>
      </Box>
    </AppModal>
  );
}
