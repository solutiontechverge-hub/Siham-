"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, ButtonBase, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppTimePanel, formatTimeDisplay } from "../AppTimePicker";
import { AppCalendarPanel } from "../AppDatePicker";
import {
  defaultListingDateTimeFilter,
  todayIsoDate,
  type CalendarPopoverValue,
  type ListingDateTimeFilter,
  type ListingTimePreset,
} from "./listingDateTime";

type CalendarPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  value: CalendarPopoverValue;
  onChange: (next: CalendarPopoverValue) => void;
};

const DATE_MODE_OPTIONS = [
  { label: "today", value: "today" as const },
  { label: "any date", value: "any" as const },
];

const TIME_PRESET_ROWS: Array<
  Array<{ label: string; value: ListingTimePreset }>
> = [
  [
    { label: "any time", value: "any" },
    { label: "morning", value: "morning" },
    { label: "noon", value: "noon" },
  ],
  [
    { label: "afternoon", value: "afternoon" },
    { label: "evening", value: "evening" },
  ],
];

function mergeDraft(value: CalendarPopoverValue): ListingDateTimeFilter {
  return value ? { ...value } : defaultListingDateTimeFilter();
}

export default function CalendarPopover({
  anchorEl,
  open,
  onClose,
  value,
  onChange,
}: CalendarPopoverProps) {
  const tokens = useTheme().palette.mollure;
  const today = React.useMemo(() => todayIsoDate(), []);
  const [draft, setDraft] = React.useState<ListingDateTimeFilter>(() =>
    mergeDraft(value),
  );
  const [activeTimeField, setActiveTimeField] = React.useState<
    "timeFrom" | "timeTo" | null
  >(null);

  React.useEffect(() => {
    if (open) {
      setDraft(mergeDraft(value));
      setActiveTimeField(null);
    }
  }, [open, value]);

  const patchDraft = (patch: Partial<ListingDateTimeFilter>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const setDateMode = (mode: ListingDateTimeFilter["dateMode"]) => {
    if (mode === "today") {
      patchDraft({ dateMode: "today", date: today });
      return;
    }
    patchDraft({
      dateMode: "any",
      date: draft.date < today ? today : draft.date,
    });
  };

  const setTimePreset = (preset: ListingTimePreset) => {
    setActiveTimeField(null);
    patchDraft({ timePreset: preset, timeFrom: "", timeTo: "" });
  };

  const setCustomTime = (field: "timeFrom" | "timeTo", next: string) => {
    patchDraft({
      [field]: next,
      timePreset: "any",
    });
  };

  const timeFieldSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    minHeight: 44,
    px: 1.5,
    py: 1.1,
    borderRadius: "10px",
    border: `1px solid ${alpha(tokens.navy, 0.14)}`,
    bgcolor: "#fff",
    textAlign: "left" as const,
    transition: "border-color 0.15s",
    "&:hover": { borderColor: tokens.teal },
  };

  const apply = () => {
    onChange({ ...draft });
    onClose();
  };

  const clear = () => {
    onChange(null);
    onClose();
  };

  const pillSx = (active: boolean) => ({
    width: "100%",
    textTransform: "none" as const,
    fontWeight: 700,
    fontSize: 12.5,
    borderRadius: "999px",
    px: 1.5,
    py: 0.9,
    minHeight: 36,
    color: active ? "#fff" : alpha(tokens.navy, 0.72),
    bgcolor: active ? tokens.teal : alpha(tokens.navy, 0.06),
    border: `1px solid ${active ? tokens.teal : alpha(tokens.navy, 0.08)}`,
    "&:hover": {
      bgcolor: active ? tokens.tealDark : alpha(tokens.teal, 0.1),
    },
  });

  const isPresetActive = (preset: ListingTimePreset) =>
    !draft.timeFrom && !draft.timeTo && draft.timePreset === preset;

  const todayDisplay = React.useMemo(() => {
    const [y, m, d] = today.split("-").map(Number);
    if (!y || !m || !d) return today;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [today]);

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          width: { xs: "min(360px, calc(100vw - 32px))", sm: 360 },
          borderRadius: 3,
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 18px 45px rgba(16, 24, 40, 0.14)",
          overflow: "hidden",
          bgcolor: "#fff",
        },
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          sx={{
            fontWeight: 800,
            color: alpha(tokens.navy, 0.55),
            fontSize: 13,
            mb: 1.25,
          }}
        >
          Select Date
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          {DATE_MODE_OPTIONS.map((option) => (
            <ButtonBase
              key={option.value}
              onClick={() => setDateMode(option.value)}
              sx={{
                ...pillSx(draft.dateMode === option.value),
                width: "auto",
                px: 2.25,
              }}
            >
              {option.label}
            </ButtonBase>
          ))}
        </Box>

        {draft.dateMode === "today" ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              px: 1.5,
              py: 1.25,
              borderRadius: "10px",
              border: `1px solid ${alpha(tokens.teal, 0.25)}`,
              bgcolor: alpha(tokens.teal, 0.06),
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: alpha(tokens.navy, 0.78),
                textAlign: "center",
              }}
            >
              {todayDisplay}
            </Typography>
          </Box>
        ) : (
          <AppCalendarPanel
            compact
            value={draft.date}
            min={today}
            onChange={(iso) => patchDraft({ date: iso })}
          />
        )}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: `1px solid ${alpha(tokens.navy, 0.08)}`,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            color: alpha(tokens.navy, 0.55),
            fontSize: 13,
            mb: 1.25,
          }}
        >
          Select Time
        </Typography>

        <Stack spacing={0.75}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 0.75,
            }}
          >
            {TIME_PRESET_ROWS[0].map((option) => (
              <ButtonBase
                key={option.value}
                onClick={() => setTimePreset(option.value)}
                sx={pillSx(isPresetActive(option.value))}
              >
                {option.label}
              </ButtonBase>
            ))}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 0.75,
            }}
          >
            {TIME_PRESET_ROWS[1].map((option) => (
              <ButtonBase
                key={option.value}
                onClick={() => setTimePreset(option.value)}
                sx={pillSx(isPresetActive(option.value))}
              >
                {option.label}
              </ButtonBase>
            ))}
            <Box />
          </Box>
        </Stack>

        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <Box>
            <ButtonBase
              onClick={() =>
                setActiveTimeField((prev) =>
                  prev === "timeFrom" ? null : "timeFrom",
                )
              }
              sx={{
                ...timeFieldSx,
                borderColor:
                  activeTimeField === "timeFrom"
                    ? tokens.teal
                    : alpha(tokens.navy, 0.14),
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: draft.timeFrom ? 700 : 500,
                  color: draft.timeFrom
                    ? alpha(tokens.navy, 0.78)
                    : alpha(tokens.navy, 0.42),
                }}
              >
                {draft.timeFrom ? formatTimeDisplay(draft.timeFrom) : "From"}
              </Typography>
            </ButtonBase>
            {activeTimeField === "timeFrom" ? (
              <Box
                sx={{
                  mt: 0.75,
                  borderRadius: "12px",
                  border: `1px solid ${alpha(tokens.navy, 0.1)}`,
                  overflow: "hidden",
                }}
              >
                <AppTimePanel
                  compact
                  value={draft.timeFrom}
                  onChange={(next) => setCustomTime("timeFrom", next)}
                  onDone={() => setActiveTimeField(null)}
                />
              </Box>
            ) : null}
          </Box>

          <Box>
            <ButtonBase
              onClick={() =>
                setActiveTimeField((prev) =>
                  prev === "timeTo" ? null : "timeTo",
                )
              }
              sx={{
                ...timeFieldSx,
                borderColor:
                  activeTimeField === "timeTo"
                    ? tokens.teal
                    : alpha(tokens.navy, 0.14),
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: draft.timeTo ? 700 : 500,
                  color: draft.timeTo
                    ? alpha(tokens.navy, 0.78)
                    : alpha(tokens.navy, 0.42),
                }}
              >
                {draft.timeTo ? formatTimeDisplay(draft.timeTo) : "To"}
              </Typography>
            </ButtonBase>
            {activeTimeField === "timeTo" ? (
              <Box
                sx={{
                  mt: 0.75,
                  borderRadius: "12px",
                  border: `1px solid ${alpha(tokens.navy, 0.1)}`,
                  overflow: "hidden",
                }}
              >
                <AppTimePanel
                  compact
                  value={draft.timeTo}
                  onChange={(next) => setCustomTime("timeTo", next)}
                  onDone={() => setActiveTimeField(null)}
                />
              </Box>
            ) : null}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <AppButton
            onClick={clear}
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              borderColor: tokens.border,
              color: tokens.navy,
              "&:hover": {
                borderColor: tokens.inputBorderHover,
                bgcolor: "rgba(52, 74, 102, 0.03)",
              },
            }}
          >
            Clear
          </AppButton>
          <AppButton
            onClick={apply}
            variant="contained"
            disableElevation
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: tokens.teal,
              "&:hover": { bgcolor: tokens.tealDark },
            }}
          >
            Done
          </AppButton>
        </Stack>
      </Box>
    </Popover>
  );
}

export type {
  CalendarPopoverValue,
  ListingDateTimeFilter,
  ListingDateMode,
  ListingTimePreset,
} from "./listingDateTime";
export {
  formatListingDateTimeDisplay,
  defaultListingDateTimeFilter,
  timePresetRange,
} from "./listingDateTime";
