"use client";

import AppButton from "./AppButton";
import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import {
  Box,
  ButtonBase,
  Dialog,
  FormHelperText,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import {
  alpha,
  createTheme,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material/styles";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs, { type Dayjs } from "dayjs";

export type AppTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minuteStep?: number;
  /** When set, only these `HH:MM` times can be selected. */
  allowedTimes?: readonly string[];
  error?: boolean;
  helperText?: React.ReactNode;
  sx?: SxProps<Theme>;
  /** Analog MUI clock face. Use `wheel` for Availability / Block Time. */
  variant?: "wheel" | "clock";
};

export type AppTimePanelProps = {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
  compact?: boolean;
  minuteStep?: number;
  /** When set, only these `HH:MM` times can be selected. */
  allowedTimes?: readonly string[];
  /** Hide the teal header strip (useful when parent already has a label). */
  hideHeader?: boolean;
  disabled?: boolean;
  /** Analog MUI clock face. Defaults to the analog clock. */
  variant?: "wheel" | "clock";
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);

function buildMinuteOptions(step = 1): number[] {
  const safeStep = Math.min(60, Math.max(1, Math.floor(step)));
  const values: number[] = [];
  for (let minute = 0; minute < 60; minute += safeStep) {
    values.push(minute);
  }
  return values;
}

export function formatTimeDisplay(value: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function usePickerAccentTheme() {
  const theme = useTheme();
  return React.useMemo(
    () =>
      createTheme(theme, {
        palette: {
          primary: {
            main: theme.palette.primary.light,
            light: theme.palette.primary.light,
            dark: theme.palette.primary.main,
            contrastText: theme.palette.primary.contrastText,
          },
        },
      }),
    [theme],
  );
}

function AnalogClockPanel({
  value,
  onChange,
  minuteStep = 1,
  allowedTimes,
  disabled = false,
  showActions = false,
  onAccept,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  minuteStep?: number;
  allowedTimes?: readonly string[];
  disabled?: boolean;
  showActions?: boolean;
  onAccept?: (value: string) => void;
  onClose?: () => void;
}) {
  const pickerTheme = usePickerAccentTheme();
  const allowedSet = React.useMemo(
    () => (allowedTimes?.length ? new Set(allowedTimes) : null),
    [allowedTimes],
  );
  const parsed =
    toDayjsTime(value) ??
    dayjs().hour(9).minute(0).second(0).millisecond(0);
  const currentHhmm = parsed.format("HH:mm");
  const currentHour = parsed.format("HH");

  const shouldDisableTime = (
    time: Dayjs,
    view: "hours" | "minutes" | "seconds",
  ) => {
    if (!allowedSet) return false;
    const hhmm = time.format("HH:mm");
    if (hhmm === currentHhmm) return false;
    if (view === "hours") {
      const hour = time.format("HH");
      if (hour === currentHour) return false;
      for (const allowed of allowedSet) {
        if (allowed.startsWith(`${hour}:`)) return false;
      }
      return true;
    }
    return !allowedSet.has(hhmm);
  };

  const commit = (next: Dayjs | null) => {
    if (!next?.isValid()) return;
    const hhmm = next.format("HH:mm");
    if (allowedSet && !allowedSet.has(hhmm) && hhmm !== currentHhmm) return;
    onChange(hhmm);
  };

  return (
    <ThemeProvider theme={pickerTheme}>
      <StaticTimePicker
        ampm={false}
        minutesStep={minuteStep}
        value={parsed}
        onChange={commit}
        onAccept={(next) => {
          if (!next?.isValid()) return;
          const hhmm = next.format("HH:mm");
          if (allowedSet && !allowedSet.has(hhmm) && hhmm !== currentHhmm) {
            return;
          }
          onAccept?.(hhmm);
        }}
        onClose={onClose}
        disabled={disabled}
        shouldDisableTime={allowedSet ? shouldDisableTime : undefined}
        displayStaticWrapperAs="mobile"
        viewRenderers={{
          hours: renderTimeViewClock,
          minutes: renderTimeViewClock,
          seconds: renderTimeViewClock,
        }}
        slotProps={{
          actionBar: { actions: showActions ? ["cancel", "accept"] : [] },
          toolbar: {
            hidden: false,
            sx: {
              alignItems: "center",
              px: 0,
              "& .MuiPickersToolbar-content": {
                justifyContent: "center",
                width: "100%",
              },
              "& .MuiTimePickerToolbar-hourMinuteLabel": {
                justifyContent: "center",
                width: "100%",
              },
            },
          },
          layout: {
            sx: {
              minWidth: 0,
              bgcolor: "#fff",
              alignItems: "center",
              "& .MuiPickersLayout-toolbar": {
                gridColumn: "1 / -1",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              },
              "& .MuiPickersLayout-contentWrapper": {
                gridColumn: "1 / -1",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              },
              "& .MuiTimeClock-root": {
                mx: "auto",
              },
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

function toDayjsTime(value: string): Dayjs | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return dayjs()
    .hour(Math.min(23, Math.max(0, hour)))
    .minute(Math.min(59, Math.max(0, minute)))
    .second(0)
    .millisecond(0);
}

function parseTimeValue(value: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour: 9, minute: 0 };
  }
  const [hour, minute] = value.split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 9,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

function toTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function nearestMinuteOption(minute: number, options: readonly number[]) {
  if (!options.length) return 0;
  return options.reduce((closest, current) =>
    Math.abs(current - minute) < Math.abs(closest - minute) ? current : closest,
  );
}

function nearestHourOption(hour: number, options: readonly number[]) {
  if (!options.length) return 0;
  return options.reduce((closest, current) =>
    Math.abs(current - hour) < Math.abs(closest - hour) ? current : closest,
  );
}

function parseAllowedTimes(allowedTimes: readonly string[] | undefined) {
  if (!allowedTimes?.length) return null;

  const byHour = new Map<number, number[]>();
  for (const raw of allowedTimes) {
    if (!/^\d{2}:\d{2}$/.test(raw)) continue;
    const { hour, minute } = parseTimeValue(raw);
    const list = byHour.get(hour) ?? [];
    if (!list.includes(minute)) list.push(minute);
    byHour.set(hour, list);
  }

  if (!byHour.size) return null;

  for (const list of byHour.values()) {
    list.sort((a, b) => a - b);
  }

  const hours = [...byHour.keys()].sort((a, b) => a - b);
  return { hours, byHour };
}

function TimeWheelColumn({
  label,
  values,
  selected,
  onSelect,
  disabled = false,
}: {
  label: string;
  values: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accent = theme.palette.primary.light;
  const itemH = 36;
  const listRef = React.useRef<HTMLDivElement>(null);
  const scrollFrameRef = React.useRef<number | null>(null);

  const scrollToValue = React.useCallback(
    (value: number, behavior: ScrollBehavior = "auto") => {
      const el = listRef.current;
      if (!el) return;
      const index = values.indexOf(value);
      if (index < 0) return;
      el.scrollTo({ top: index * itemH, behavior });
    },
    [itemH, values],
  );

  React.useEffect(() => {
    scrollToValue(selected);
  }, [selected, scrollToValue, values]);

  const handleScroll = () => {
    if (disabled || !values.length) return;
    if (scrollFrameRef.current != null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      const index = Math.min(
        values.length - 1,
        Math.max(0, Math.round(el.scrollTop / itemH)),
      );
      const next = values[index];
      if (next != null && next !== selected) {
        onSelect(next);
      }
    });
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          color: alpha(m.navy, 0.45),
          mb: 0.75,
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          position: "relative",
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "50%",
            height: itemH,
            transform: "translateY(-50%)",
            borderRadius: "8px",
            bgcolor: alpha(accent, 0.22),
            border: `1px solid ${alpha(accent, 0.38)}`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <Box
          ref={listRef}
          onScroll={handleScroll}
          sx={{
            height: itemH * 5,
            overflowY: disabled ? "hidden" : "auto",
            scrollSnapType: "y mandatory",
            position: "relative",
            zIndex: 2,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(m.navy, 0.25),
              borderRadius: 4,
            },
          }}
        >
          <Box sx={{ height: itemH * 2 }} />
          {values.map((value) => {
            const active = selected === value;
            return (
              <Box
                key={value}
                onClick={() => {
                  if (disabled) return;
                  onSelect(value);
                  scrollToValue(value, "smooth");
                }}
                sx={{
                  height: itemH,
                  scrollSnapAlign: "center",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  color: active ? accent : alpha(m.navy, 0.55),
                  cursor: disabled ? "default" : "pointer",
                  userSelect: "none",
                }}
              >
                {String(value).padStart(2, "0")}
              </Box>
            );
          })}
          <Box sx={{ height: itemH * 2 }} />
        </Box>
      </Box>
    </Box>
  );
}

export function AppTimePanel({
  value,
  onChange,
  onDone,
  compact = false,
  minuteStep = 1,
  allowedTimes,
  hideHeader = false,
  disabled = false,
  variant = "clock",
}: AppTimePanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accent = theme.palette.primary.light;

  if (variant === "clock") {
    return (
      <Box
        sx={{
          width: compact ? "100%" : 320,
          bgcolor: "#fff",
          pointerEvents: disabled ? "none" : "auto",
          overflow: "hidden",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AnalogClockPanel
          value={value}
          onChange={onChange}
          minuteStep={minuteStep}
          allowedTimes={allowedTimes}
          disabled={disabled}
          showActions={Boolean(onDone)}
          onAccept={() => onDone?.()}
          onClose={onDone}
        />
      </Box>
    );
  }
  const allowed = React.useMemo(
    () => parseAllowedTimes(allowedTimes),
    [allowedTimes],
  );
  const defaultMinuteOptions = React.useMemo(
    () => buildMinuteOptions(minuteStep),
    [minuteStep],
  );
  const hourOptions = allowed?.hours ?? HOUR_OPTIONS;

  const parsed = parseTimeValue(value);
  const initialHour = nearestHourOption(parsed.hour, hourOptions);
  const initialMinuteOptions =
    allowed?.byHour.get(initialHour) ?? defaultMinuteOptions;

  const [hour, setHour] = React.useState(initialHour);
  const [minute, setMinute] = React.useState(() =>
    nearestMinuteOption(parsed.minute, initialMinuteOptions),
  );

  const minuteOptions =
    allowed?.byHour.get(hour) ?? defaultMinuteOptions;

  React.useEffect(() => {
    const next = parseTimeValue(value);
    const nextHour = nearestHourOption(next.hour, hourOptions);
    const nextMinutes = allowed?.byHour.get(nextHour) ?? defaultMinuteOptions;
    setHour(nextHour);
    setMinute(nearestMinuteOption(next.minute, nextMinutes));
  }, [allowed, defaultMinuteOptions, hourOptions, value]);

  const applyTime = (nextHour: number, nextMinute: number) => {
    if (disabled) return;
    const safeHour = nearestHourOption(nextHour, hourOptions);
    const nextMinutes = allowed?.byHour.get(safeHour) ?? defaultMinuteOptions;
    const safeMinute = nearestMinuteOption(nextMinute, nextMinutes);
    setHour(safeHour);
    setMinute(safeMinute);
    onChange(toTimeValue(safeHour, safeMinute));
  };

  return (
    <Box
      sx={{
        width: compact ? "100%" : 280,
        bgcolor: "#fff",
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {!hideHeader ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.75,
            py: 1.25,
            borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
            bgcolor: alpha(accent, 0.08),
            gap: 0.75,
          }}
        >
          <AccessTimeRoundedIcon sx={{ fontSize: 18, color: accent }} />
          <Typography
            sx={{
              flex: 1,
              fontSize: 13,
              fontWeight: 800,
              color: accent,
            }}
          >
            Select time
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ px: hideHeader ? 0 : 1.5, py: hideHeader ? 0 : 1.25 }}>
        <Stack direction="row" spacing={1}>
          <TimeWheelColumn
            label="Hour"
            values={hourOptions}
            selected={hour}
            disabled={disabled || !hourOptions.length}
            onSelect={(nextHour) => {
              const mins = allowed?.byHour.get(nextHour) ?? defaultMinuteOptions;
              applyTime(nextHour, nearestMinuteOption(minute, mins));
            }}
          />
          <TimeWheelColumn
            label="Minute"
            values={minuteOptions}
            selected={minute}
            disabled={disabled || !minuteOptions.length}
            onSelect={(nextMinute) => applyTime(hour, nextMinute)}
          />
        </Stack>

        {onDone ? (
          <AppButton
            tone="primary"
            fullWidth
            onClick={onDone}
            disabled={disabled}
            sx={{
              mt: 1.25,
            }}
          >
            Done
          </AppButton>
        ) : null}
      </Box>
    </Box>
  );
}

export default function AppTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select time",
  disabled = false,
  fullWidth = true,
  minuteStep = 1,
  allowedTimes,
  error = false,
  helperText,
  sx,
  variant = "clock",
}: AppTimePickerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accent = theme.palette.primary.light;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const closePicker = () => setOpen(false);

  const openPicker = () => {
    if (disabled) return;
    setDraft(value || "09:00");
    setOpen(true);
  };

  const acceptPicker = (next: string) => {
    if (next) onChange(next);
    closePicker();
  };

  return (
    <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
      {label ? (
        <Typography
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
          {label}
        </Typography>
      ) : null}
      <ButtonBase
        disabled={disabled}
        onClick={openPicker}
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
            error
              ? theme.palette.error.main
              : open
                ? accent
                : m.inputBorder
          }`,
          bgcolor: disabled ? alpha(m.navy, 0.04) : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "border-color 0.15s",
          "&:hover": {
            borderColor: disabled
              ? m.inputBorder
              : error
                ? theme.palette.error.main
                : accent,
          },
          "&:focus-visible": {
            outline: `2px solid ${accent}`,
            outlineOffset: 2,
          },
          ...sx,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: value ? 700 : 500,
            color: value ? alpha(m.navy, 0.78) : alpha(m.navy, 0.42),
            userSelect: "none",
          }}
        >
          {value ? formatTimeDisplay(value) : placeholder}
        </Typography>
        <AccessTimeRoundedIcon
          sx={{ fontSize: 18, color: error ? theme.palette.error.main : accent }}
        />
      </ButtonBase>
      {helperText ? (
        <FormHelperText error={error} sx={{ mx: 1.75, mt: 0.4 }}>
          {helperText}
        </FormHelperText>
      ) : null}

      <Dialog
        open={open}
        onClose={closePicker}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            m: 2,
          },
        }}
      >
        {variant === "wheel" ? (
          <AppTimePanel
            variant="wheel"
            value={draft}
            onChange={setDraft}
            onDone={() => acceptPicker(draftRef.current)}
            minuteStep={minuteStep}
            allowedTimes={allowedTimes}
            disabled={disabled}
          />
        ) : (
          <AnalogClockPanel
            value={draft}
            onChange={setDraft}
            minuteStep={minuteStep}
            allowedTimes={allowedTimes}
            disabled={disabled}
            showActions
            onAccept={acceptPicker}
            onClose={closePicker}
          />
        )}
      </Dialog>
    </Box>
  );
}
