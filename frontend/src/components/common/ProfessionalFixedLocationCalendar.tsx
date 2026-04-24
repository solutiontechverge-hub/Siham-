"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Avatar, Box, Button, Checkbox, Chip, Divider, Drawer, FormControlLabel, IconButton, Menu, MenuItem, Paper, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import MollureCardHeader from "./MollureCardHeader";
import { useSnackbar } from "./AppSnackbar";
import AppPillTabs from "./AppPillTabs";
import MollureDrawer from "./MollureDrawer";
import MollureModal from "./MollureModal";
import AppSelect from "./AppSelect";
import AppTextField from "./AppTextField";
import AppDropdown from "./AppDropdown";
import type {
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarBookingLocation,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../app/professionals/fixed-location/calendar/calendar.data";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
};

function statusChipSx(status: CalendarBookingStatus, m: { navy: string }) {
  switch (status) {
    case "Requested":
      return { bgcolor: alpha("#F4A100", 0.12), color: "#C87800", borderColor: alpha("#F4A100", 0.5) };
    case "Cancelled":
      return { bgcolor: alpha("#D32F2F", 0.10), color: "#B71C1C", borderColor: alpha("#D32F2F", 0.4) };
    case "Confirmed":
      return { bgcolor: alpha("#2E7D32", 0.10), color: "#1B5E20", borderColor: alpha("#2E7D32", 0.4) };
    case "Completed":
      return { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.7), borderColor: alpha(m.navy, 0.2) };
    case "No Show":
    default:
      return { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.7), borderColor: alpha(m.navy, 0.2) };
  }
}

function extractBookingId(rawId: string) {
  // "b-34009-a" → "34009"
  const parts = rawId.split("-");
  if (parts.length >= 3) return parts.slice(1, parts.length - 1).join("-");
  if (parts.length === 2) return parts[1];
  return rawId;
}

function minutesSinceMidnight(hhmm: string) {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  return h * 60 + m;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function parseIsoDate(iso: string) {
  // Use UTC to keep the label stable across timezones.
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

function formatLongDateUtc(iso: string) {
  const dt = parseIsoDate(iso);
  // Force a stable locale to avoid Next.js hydration mismatches
  // (server locale can differ from the user's browser locale).
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addDaysIso(iso: string, days: number) {
  const dt = parseIsoDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeekIso(iso: string) {
  const dt = parseIsoDate(iso);
  const dow = dt.getUTCDay(); // 0..6
  // start week on Monday
  const diff = (dow + 6) % 7;
  return addDaysIso(iso, -diff);
}

type Interval = { startMin: number; endMin: number };

function mergeIntervals(intervals: readonly Interval[]) {
  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);
  const out: Interval[] = [];
  for (const it of sorted) {
    const last = out[out.length - 1];
    if (!last || it.startMin > last.endMin) out.push({ ...it });
    else last.endMin = Math.max(last.endMin, it.endMin);
  }
  return out;
}

function subtractIntervals(base: readonly Interval[], busy: readonly Interval[]) {
  const mergedBusy = mergeIntervals(busy);
  const out: Interval[] = [];
  for (const b of base) {
    let cursor = b.startMin;
    for (const u of mergedBusy) {
      if (u.endMin <= cursor) continue;
      if (u.startMin >= b.endMin) break;
      if (u.startMin > cursor) out.push({ startMin: cursor, endMin: Math.min(u.startMin, b.endMin) });
      cursor = Math.max(cursor, u.endMin);
      if (cursor >= b.endMin) break;
    }
    if (cursor < b.endMin) out.push({ startMin: cursor, endMin: b.endMin });
  }
  return out;
}

function fmtMinToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function sumIntervalsMins(intervals: readonly Interval[]) {
  return intervals.reduce((acc, it) => acc + Math.max(0, it.endMin - it.startMin), 0);
}

export default function ProfessionalFixedLocationCalendar({ data }: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>(data.initialView);
  const [activeDateIso, setActiveDateIso] = React.useState(data.initialDate);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const bookingTypes: readonly CalendarBookingType[] = ["Online", "Offline", "Project", "Requests"];
  const locations: readonly CalendarBookingLocation[] = ["FL", "DL"];

  const initialFilters = React.useMemo(
    () => ({
      teamAll: true,
      teamIds: Object.fromEntries(data.resources.map((r) => [r.id, false])),
      locationAll: true,
      locations: { FL: false, DL: false },
      bookingAll: true,
      booking: { Online: false, Offline: false, Project: false, Requests: false },
    }),
    [data.resources],
  );

  const [draftFilters, setDraftFilters] = React.useState<{
    teamAll: boolean;
    teamIds: Record<string, boolean>;
    locationAll: boolean;
    locations: Record<CalendarBookingLocation, boolean>;
    bookingAll: boolean;
    booking: Record<CalendarBookingType, boolean>;
  }>(() => initialFilters);

  const [appliedFilters, setAppliedFilters] = React.useState(draftFilters);
  const [blockTimeOpen, setBlockTimeOpen] = React.useState(false);
  const [slotDrawerOpen, setSlotDrawerOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<null | {
    resourceId: string;
    date: string;
    start: string;
    end: string;
    freeStart: string;
    freeEnd: string;
  }>(null);

  const [blockDraft, setBlockDraft] = React.useState<{
    title: "Meeting" | "Training" | "Holiday" | "Custom";
    teamIds: string[];
    locations: CalendarBookingLocation[];
    dayFrom: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    dayTo: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    dateFrom: string;
    dateTo: string;
    startTime: string;
    endTime: string;
  }>(() => ({
    title: "Meeting",
    teamIds: data.resources.map((r) => r.id),
    locations: ["FL", "DL"],
    dateFrom: "2025-04-06",
    dateTo: "2025-04-06",
    dayFrom: "Monday",
    dayTo: "Friday",
    startTime: "16:30",
    endTime: "17:30",
  }));

  const teamLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    data.resources.forEach((r, idx) => {
      map.set(r.id, `Team Member ${String.fromCharCode(65 + idx)}`);
    });
    return map;
  }, [data.resources]);

  const grid = data.timeGrid;
  const startMin = grid.startHour * 60;
  const endMin = grid.endHour * 60;
  const rows = Math.floor((endMin - startMin) / grid.stepMinutes) + 1;
  const rowPx = 44;
  const laneHeaderPx = 42;

  const slotLines = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < rows; i++) out.push(startMin + i * grid.stepMinutes);
    return out;
  }, [rows, startMin, grid.stepMinutes]);

  const visibleDates = React.useMemo(() => {
    if (viewMode === "day") return [activeDateIso];
    if (viewMode === "week") {
      const start = startOfWeekIso(activeDateIso);
      return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
    }
    // month: we still keep a single active date; month grid computed separately in UI.
    return [activeDateIso];
  }, [activeDateIso, viewMode]);

  const filteredResources = React.useMemo(() => {
    if (appliedFilters.teamAll) return data.resources;
    const selectedIds = Object.entries(appliedFilters.teamIds)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!selectedIds.length) return data.resources;
    return data.resources.filter((r) => selectedIds.includes(r.id));
  }, [appliedFilters.teamAll, appliedFilters.teamIds, data.resources]);

  const eventsInRange = React.useMemo(
    () => {
      const base = data.events.filter((e) => visibleDates.includes(e.date));
      const byTeam = appliedFilters.teamAll
        ? base
        : base.filter((e) => appliedFilters.teamIds[e.resourceId]);
      const byLocation = appliedFilters.locationAll
        ? byTeam
        : byTeam.filter((e) => appliedFilters.locations[e.location]);
      const byBooking = appliedFilters.bookingAll
        ? byLocation
        : byLocation.filter((e) => {
            const bt = (e.bookingType ?? (e.status === "Requested" ? "Requests" : "Online")) as CalendarBookingType;
            return appliedFilters.booking[bt];
          });
      return byBooking;
    },
    [data.events, visibleDates],
  );
  const blocksInRange = React.useMemo(
    () => {
      const base = data.blocks.filter((b) => visibleDates.includes(b.date));
      if (appliedFilters.teamAll) return base;
      return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
    },
    [data.blocks, visibleDates],
  );

  const onToday = () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setActiveDateIso(iso);
  };

  const onPrev = () => {
    if (viewMode === "week") setActiveDateIso(addDaysIso(activeDateIso, -7));
    else if (viewMode === "month") setActiveDateIso(addDaysIso(activeDateIso, -30));
    else setActiveDateIso(addDaysIso(activeDateIso, -1));
  };

  const onNext = () => {
    if (viewMode === "week") setActiveDateIso(addDaysIso(activeDateIso, 7));
    else if (viewMode === "month") setActiveDateIso(addDaysIso(activeDateIso, 30));
    else setActiveDateIso(addDaysIso(activeDateIso, 1));
  };

  const getAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const av = data.availability.find((a) => a.resourceId === resourceId);
      if (!av) return [];
      const dow = parseIsoDate(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const windows = av.weekly[dow] ?? [];
      return windows.map((w) => ({ startMin: minutesSinceMidnight(w.start), endMin: minutesSinceMidnight(w.end) }));
    },
    [data.availability],
  );

  const getBusyFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const busy: Interval[] = [];
      for (const e of data.events) {
        if (e.resourceId !== resourceId || e.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(e.start), endMin: minutesSinceMidnight(e.end) });
      }
      for (const b of data.blocks) {
        if (b.resourceId !== resourceId || b.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(b.start), endMin: minutesSinceMidnight(b.end) });
      }
      return busy;
    },
    [data.blocks, data.events],
  );

  const getDailyBookingRatio = React.useCallback(
    (resourceId: string, iso: string) => {
      const availability = getAvailabilityFor(resourceId, iso);
      const availableMins = sumIntervalsMins(availability);
      if (availableMins <= 0) return 0;
      const busy = getBusyFor(resourceId, iso);
      const bookedMins = sumIntervalsMins(mergeIntervals(busy));
      return Math.max(0, Math.min(1, bookedMins / availableMins));
    },
    [getAvailabilityFor, getBusyFor],
  );

  const onEmptyClick = React.useCallback(
    (resourceId: string, iso: string, minutes: number) => {
      const availability = getAvailabilityFor(resourceId, iso);
      if (!availability.length) {
        showSnackbar({ severity: "info", message: "No availability set for this team member on this day." });
        return;
      }
      const busy = getBusyFor(resourceId, iso);
      const free = subtractIntervals(availability, busy);
      const segment = free.find((f) => minutes >= f.startMin && minutes < f.endMin);
      if (!segment) {
        showSnackbar({ severity: "warning", message: "This time is not available." });
        return;
      }

      const snap = Math.round((minutes - startMin) / grid.stepMinutes) * grid.stepMinutes + startMin;
      const start = Math.max(segment.startMin, snap);
      const end = segment.endMin;

      const payload = {
        resourceId,
        date: iso,
        start: fmtMinToTime(start),
        end: fmtMinToTime(Math.min(end, start + grid.stepMinutes)),
        freeStart: fmtMinToTime(segment.startMin),
        freeEnd: fmtMinToTime(segment.endMin),
      };
      setSelectedSlot(payload);
      setSlotDrawerOpen(true);
    },
    [getAvailabilityFor, getBusyFor, grid.stepMinutes, showSnackbar, startMin],
  );

  return (
    <Stack spacing={2}>
      <AppPillTabs
        tabs={data.subTabs.map((label) => ({ label }))}
        active={activeSubTab}
        onChange={(next) => setActiveSubTab(next as CalendarSubTab)}
      />

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          bgcolor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <MollureCardHeader title="Calendar" subtitle="Manage your schedule and bookings." tone="default" />
        <Divider />

        {/* Toolbar */}
        <Box sx={{ px: 2, py: 1.25 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <IconButton
                size="small"
                onClick={onPrev}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  border: `1px solid ${alpha(m.navy, 0.14)}`,
                  color: alpha(m.navy, 0.6),
                  bgcolor: "#fff",
                }}
              >
                <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>

              <Button
                variant="outlined"
                startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => showSnackbar({ severity: "info", message: "Date picker UI can be added next." })}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 12,
                  borderColor: alpha(m.navy, 0.14),
                  color: alpha(m.navy, 0.78),
                  bgcolor: "#fff",
                  height: 30,
                  px: 1.25,
                }}
              >
                {formatLongDateUtc(activeDateIso)}
              </Button>

              <IconButton
                size="small"
                onClick={onNext}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  border: `1px solid ${alpha(m.navy, 0.14)}`,
                  color: alpha(m.navy, 0.6),
                  bgcolor: "#fff",
                }}
              >
                <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="outlined"
              onClick={onToday}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.78),
                bgcolor: "#fff",
                height: 30,
                px: 1.25,
              }}
            >
              Today
            </Button>

            <Box
              sx={{
                display: "flex",
                borderRadius: "8px",
                overflow: "hidden",
                border: `1px solid ${alpha(m.navy, 0.14)}`,
                bgcolor: "#fff",
              }}
            >
              {(["day", "week", "month"] as const).map((v) => {
                const active = v === viewMode;
                return (
                  <Button
                    key={v}
                    onClick={() => setViewMode(v)}
                    sx={{
                      borderRadius: 0,
                      minWidth: 44,
                      height: 30,
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: 12,
                      bgcolor: active ? alpha(m.navy, 0.04) : "#fff",
                      color: alpha(m.navy, 0.78),
                    }}
                  >
                    {v === "day" ? "Day" : v === "week" ? "Week" : "Month"}
                  </Button>
                );
              })}
            </Box>

            <Button
              variant="outlined"
              startIcon={<FilterListRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setFiltersOpen(true)}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.78),
                bgcolor: "#fff",
                height: 30,
                px: 1.25,
              }}
            >
              Filters
            </Button>

            <Button
              variant="contained"
              disableElevation
              endIcon={<KeyboardArrowDownRoundedIcon />}
              onClick={(e) => setAddAnchor(e.currentTarget)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                height: 30,
                px: 1.5,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              Add
            </Button>
            <Menu open={Boolean(addAnchor)} anchorEl={addAnchor} onClose={() => setAddAnchor(null)}>
              {[
                { label: "Booking", key: "booking" as const },
                { label: "Blocked time", key: "blocked" as const },
                { label: "Design", key: "design" as const },
                { label: "Add Note", key: "note" as const },
              ].map((item) => (
                <MenuItem
                  key={item.key}
                  onClick={() => {
                    setAddAnchor(null);
                    if (item.key === "blocked") {
                      setBlockTimeOpen(true);
                      return;
                    }
                    showSnackbar({ severity: "info", message: `${item.label} (mock).` });
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Box>

        <Divider />

        {/* Timeline grid */}
        <Box sx={{ px: 2, pb: 2 }}>
          {viewMode === "month" ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2 }}>
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}>
                  Month view (summary)
                </BodyText>
                <BodyText sx={{ mt: 0.5, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
                  Weekly/day timeline is already functional. Next we can render a full month grid with per-day counts per team member.
                </BodyText>
              </Box>
            </Paper>
          ) : (
            <Box
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr", bgcolor: m.fxSurface }}>
                {/* Time column */}
                <Box sx={{ bgcolor: alpha(m.navy, 0.02) }}>
                  <Box sx={{ height: laneHeaderPx, borderBottom: `1px solid ${alpha(m.navy, 0.06)}` }} />
                  {slotLines.map((t, idx) => (
                    <Box
                      key={t}
                      sx={{
                        height: rowPx,
                        px: 1,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        pt: idx === 0 ? 1.1 : 0.9,
                        borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      }}
                    >
                      <BodyText sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                        {fmtTimeLabel(t)}
                      </BodyText>
                    </Box>
                  ))}
                </Box>

                {/* Events canvas */}
                <Box
                  sx={{
                    position: "relative",
                    bgcolor: m.fxSurface,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {filteredResources.map((res, laneIdx) => {
                    const laneDates = viewMode === "week" ? visibleDates : [activeDateIso];
                    return (
                      <Box
                        key={res.id}
                        sx={{
                          borderTop: laneIdx > 0 ? `1px solid ${alpha(m.navy, 0.08)}` : undefined,
                        }}
                      >
                        {/* Lane header */}
                        <Box
                          sx={{
                            height: laneHeaderPx,
                            px: 1.25,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: m.fxSurface,
                            borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                          }}
                        >
                          <Avatar sx={{ width: 26, height: 26, bgcolor: alpha(m.teal, 0.14), color: m.teal, fontWeight: 900, fontSize: 12 }}>
                            {res.avatarText}
                          </Avatar>
                          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 140 }}>
                            <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.85), lineHeight: 1.1 }}>
                              {res.name}
                            </BodyText>
                            <Box
                              sx={{
                                mt: 0.45,
                                height: 4,
                                width: 84,
                                borderRadius: "999px",
                                bgcolor: m.fxGrayF2F4F7,
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  width: `${
                                    Math.round(
                                      (viewMode === "week"
                                        ? laneDates.reduce((acc, iso) => acc + getDailyBookingRatio(res.id, iso), 0) /
                                          Math.max(1, laneDates.length)
                                        : getDailyBookingRatio(res.id, activeDateIso)) * 100,
                                    )
                                  }%`,
                                  bgcolor: m.teal,
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1 }} />
                          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }} />
                        </Box>

                        {/* Lane body */}
                        <Box
                          sx={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: viewMode === "week" ? "repeat(7, 1fr)" : "1fr",
                            bgcolor: m.fxSurface,
                          }}
                        >
                          {laneDates.map((iso, colIdx) => {
                            const laneEvents = eventsInRange.filter((e) => e.resourceId === res.id && e.date === iso);
                            const laneBlocks = blocksInRange.filter((b) => b.resourceId === res.id && b.date === iso);

                            // Unavailable overlay (everything outside availability windows)
                            const availability = getAvailabilityFor(res.id, iso);

                            return (
                              <Box
                                key={`${res.id}-${iso}`}
                                sx={{
                                  position: "relative",
                                  borderLeft: viewMode === "week" && colIdx > 0 ? `1px solid ${alpha(m.navy, 0.06)}` : undefined,
                                  height: rows * rowPx,
                                  bgcolor: m.fxSurface, // Free time = white
                                }}
                              >
                                {/* Click layer */}
                                <Box
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    const minutes = startMin + Math.floor(y / rowPx) * grid.stepMinutes;
                                    onEmptyClick(res.id, iso, minutes);
                                  }}
                                  sx={{ position: "absolute", inset: 0, cursor: "pointer" }}
                                />

                                {/* Outside availability tint */}
                                {availability.length ? (
                                  <>
                                    {/* Top unavailable */}
                                    {Math.min(...availability.map((a) => a.startMin)) > startMin ? (
                                      <Box
                                        sx={{
                                          position: "absolute",
                                          left: 0,
                                          right: 0,
                                          top: 0,
                                          height: ((Math.min(...availability.map((a) => a.startMin)) - startMin) / grid.stepMinutes) * rowPx,
                                          bgcolor: m.fxGrayF9FAFB,
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}
                                    {/* Bottom unavailable */}
                                    {Math.max(...availability.map((a) => a.endMin)) < endMin ? (
                                      <Box
                                        sx={{
                                          position: "absolute",
                                          left: 0,
                                          right: 0,
                                          top: ((Math.max(...availability.map((a) => a.endMin)) - startMin) / grid.stepMinutes) * rowPx,
                                          height: ((endMin - Math.max(...availability.map((a) => a.endMin))) / grid.stepMinutes) * rowPx,
                                          bgcolor: m.fxGrayF9FAFB,
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Box sx={{ position: "absolute", inset: 0, bgcolor: m.fxGrayF9FAFB, pointerEvents: "none" }} />
                                )}

                                {/* Horizontal grid lines */}
                                {slotLines.map((t) => (
                                  <Box
                                    key={`line-${res.id}-${iso}-${t}`}
                                    sx={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      top: ((t - startMin) / grid.stepMinutes) * rowPx,
                                      height: 1,
                                      bgcolor: alpha(m.navy, 0.06),
                                      pointerEvents: "none",
                                    }}
                                  />
                                ))}

                                {/* Blocks */}
                                {laneBlocks.map((b) => {
                                  const top = ((minutesSinceMidnight(b.start) - startMin) / grid.stepMinutes) * rowPx;
                                  const height = ((minutesSinceMidnight(b.end) - minutesSinceMidnight(b.start)) / grid.stepMinutes) * rowPx;
                                  const isUnavail = b.kind === "unavailable";
                                  return (
                                    <Paper
                                      key={b.id}
                                      elevation={0}
                                      sx={{
                                        position: "absolute",
                                        left: 10,
                                        right: 10,
                                        top,
                                        height,
                                        borderRadius: "10px",
                                        bgcolor: isUnavail ? alpha(m.navy, 0.04) : alpha(m.navy, 0.03),
                                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                                        p: 1,
                                        pointerEvents: "none",
                                      }}
                                    >
                                      <BodyText sx={{ fontWeight: 900, fontSize: 11.5, color: alpha(m.navy, 0.8) }}>
                                        {b.start} to {b.end}
                                      </BodyText>
                                      <BodyText sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                                        {b.title}
                                      </BodyText>
                                    </Paper>
                                  );
                                })}

                                {/* Events */}
                                {laneEvents.map((ev, idx) => {
                                  const top = ((minutesSinceMidnight(ev.start) - startMin) / grid.stepMinutes) * rowPx + 4;
                                  const height = ((minutesSinceMidnight(ev.end) - minutesSinceMidnight(ev.start)) / grid.stepMinutes) * rowPx - 8;
                                  const split = idx % 2 === 0;
                                  const left = split ? 4 : "50%";
                                  const right = split ? "50%" : 4;

                                  const statusTone =
                                    ev.status === "Requested"
                                      ? { bar: "#F4A100", bg: m.fxLavenderTint }
                                      : ev.status === "Cancelled"
                                        ? { bar: "#D32F2F", bg: alpha("#D32F2F", 0.05) }
                                        : ev.status === "Confirmed"
                                          ? { bar: "#2E7D32", bg: m.fxMintTint }
                                          : ev.status === "Completed"
                                            ? { bar: m.teal, bg: alpha(m.teal, 0.05) }
                                            : { bar: alpha(m.navy, 0.4), bg: m.fxGrayF9FAFB };

                                  const RAIL_W = 52;

                                  return (
                                    <Box
                                      key={ev.id}
                                      sx={{
                                        position: "absolute",
                                        top,
                                        left,
                                        right,
                                        height,
                                        borderRadius: "8px",
                                        bgcolor: statusTone.bg,
                                        border: `1px solid ${m.fxGrayDCDFE3}`,
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "row",
                                        // left accent bar via box-shadow so we avoid pseudo-element clipping issues
                                        boxShadow: `inset 3px 0 0 0 ${statusTone.bar}`,
                                      }}
                                    >
                                      {/* ── LEFT content (non-interactive) ── */}
                                      <Box
                                        sx={{
                                          flex: 1,
                                          minWidth: 0,
                                          pl: 1.5,
                                          pr: 0.75,
                                          py: 0.75,
                                          pointerEvents: "none",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.3 }}>
                                          <BodyText sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.65), lineHeight: 1 }}>
                                            ID: {extractBookingId(ev.id)}
                                          </BodyText>
                                          <Chip
                                            size="small"
                                            label={ev.status}
                                            sx={{
                                              height: 17,
                                              borderRadius: "999px",
                                              fontSize: 9,
                                              fontWeight: 900,
                                              border: "1px solid",
                                              "& .MuiChip-label": { px: 1 },
                                              ...statusChipSx(ev.status, m),
                                            }}
                                          />
                                        </Stack>
                                        <BodyText
                                          sx={{
                                            fontSize: 12,
                                            fontWeight: 900,
                                            color: alpha(m.navy, 0.88),
                                            lineHeight: 1.2,
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                          }}
                                        >
                                          {ev.title}
                                        </BodyText>
                                        <BodyText sx={{ fontSize: 10.5, color: alpha(m.navy, 0.55), mt: 0.25, lineHeight: 1 }}>
                                          ({ev.start} to {ev.end})
                                        </BodyText>
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                                          <Box
                                            component="span"
                                            sx={{
                                              width: 7,
                                              height: 7,
                                              borderRadius: "50%",
                                              bgcolor: ev.location === "FL" ? alpha("#E53935", 0.75) : alpha(m.teal, 0.75),
                                              flexShrink: 0,
                                            }}
                                          />
                                          <BodyText sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.6), lineHeight: 1 }}>
                                            {ev.location}
                                          </BodyText>
                                        </Stack>
                                      </Box>

                                      {/* ── RIGHT rail (clickable icons) ── */}
                                      <Box
                                        sx={{
                                          width: RAIL_W,
                                          flexShrink: 0,
                                          bgcolor: m.fxSurface,
                                          borderLeft: `1px solid ${m.fxGrayDCDFE3}`,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "space-around",
                                          py: 0.5,
                                        }}
                                      >
                                        {/* Calendar */}
                                        <Tooltip title="Open calendar" placement="left">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showSnackbar({ severity: "info", message: `Calendar for booking ${extractBookingId(ev.id)}` });
                                            }}
                                            sx={{ p: 0.4, borderRadius: "6px", color: alpha(m.navy, 0.45), "&:hover": { bgcolor: alpha(m.navy, 0.06), color: m.navy } }}
                                          >
                                            <CalendarMonthRoundedIcon sx={{ fontSize: 17 }} />
                                          </IconButton>
                                        </Tooltip>

                                        {/* Person + name */}
                                        <Tooltip title={`Open profile: ${ev.showClientName ?? "Client"}`} placement="left">
                                          <Box
                                            component="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showSnackbar({ severity: "info", message: `Client drawer: ${ev.showClientName ?? "Client"}` });
                                            }}
                                            sx={{
                                              all: "unset",
                                              cursor: "pointer",
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "center",
                                              gap: 0.1,
                                              px: 0.5,
                                              py: 0.3,
                                              borderRadius: "6px",
                                              "&:hover": { bgcolor: alpha(m.navy, 0.06) },
                                            }}
                                          >
                                            <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />
                                            <BodyText
                                              sx={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                color: alpha(m.navy, 0.55),
                                                lineHeight: 1,
                                                maxWidth: RAIL_W - 8,
                                                textAlign: "center",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                              }}
                                            >
                                              {ev.showClientName ?? "Client"}
                                            </BodyText>
                                          </Box>
                                        </Tooltip>

                                        {/* Timer / notes */}
                                        <Tooltip title="Open notes" placement="left">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showSnackbar({ severity: "info", message: `Notes for booking ${extractBookingId(ev.id)}` });
                                            }}
                                            sx={{ p: 0.4, borderRadius: "6px", color: "#E53935", "&:hover": { bgcolor: alpha("#E53935", 0.08) } }}
                                          >
                                            <AccessTimeRoundedIcon sx={{ fontSize: 17 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Drawer
        anchor="right"
        open={slotDrawerOpen}
        onClose={() => setSlotDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
      >
        <Box sx={{ p: 2.25 }}>
          <BodyText sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.85) }}>
            Free time
          </BodyText>
          {selectedSlot ? (
            <>
              <BodyText sx={{ mt: 0.75, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
                Team member: <b>{data.resources.find((r) => r.id === selectedSlot.resourceId)?.name ?? selectedSlot.resourceId}</b>
              </BodyText>
              <BodyText sx={{ mt: 0.5, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
                Date: <b>{formatLongDateUtc(selectedSlot.date)}</b>
              </BodyText>
              <BodyText sx={{ mt: 0.5, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
                Clicked slot: <b>{selectedSlot.start}</b>
              </BodyText>
              <BodyText sx={{ mt: 0.5, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
                Free window: <b>{selectedSlot.freeStart}</b> to <b>{selectedSlot.freeEnd}</b>
              </BodyText>

              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  borderRadius: "12px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  bgcolor: alpha(m.navy, 0.02),
                  p: 1.5,
                }}
              >
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.75) }}>
                  Drawer content placeholder
                </BodyText>
                <BodyText sx={{ mt: 0.5, color: alpha(m.navy, 0.55), fontSize: 12.5 }}>
                  Tell me what fields/actions you want here, and I’ll build it.
                </BodyText>
              </Paper>
            </>
          ) : (
            <BodyText sx={{ mt: 1, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
              Click an empty space in the schedule to view free time.
            </BodyText>
          )}
        </Box>
      </Drawer>

      <MollureDrawer
        anchor="right"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        width={{ xs: "100%", sm: 320 }}
        footer={
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setDraftFilters(appliedFilters);
                  setFiltersOpen(false);
                }}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px" }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setDraftFilters(initialFilters as any);
                }}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px" }}
              >
                Reset
              </Button>
              <Button
                fullWidth
                variant="contained"
                disableElevation
                onClick={() => {
                  setAppliedFilters(draftFilters);
                  setFiltersOpen(false);
                }}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px", bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
              >
                Apply
              </Button>
            </Stack>
          </Box>
        }
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={2}>
            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Team Member</BodyText>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={draftFilters.teamAll}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          teamAll: e.target.checked,
                          teamIds: Object.fromEntries(Object.keys(p.teamIds).map((id) => [id, false])),
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
                {data.resources.map((r, i) => (
                  <FormControlLabel
                    key={r.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={!draftFilters.teamAll && Boolean(draftFilters.teamIds[r.id])}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            teamAll: false,
                            teamIds: { ...p.teamIds, [r.id]: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{`TM ${String.fromCharCode(65 + i)}`}</BodyText>}
                    sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Location</BodyText>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={draftFilters.locationAll}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          locationAll: e.target.checked,
                          locations: { FL: false, DL: false },
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
                {locations.map((loc) => (
                  <FormControlLabel
                    key={loc}
                    control={
                      <Checkbox
                        size="small"
                        checked={!draftFilters.locationAll && Boolean(draftFilters.locations[loc])}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            locationAll: false,
                            locations: { ...p.locations, [loc]: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{loc}</BodyText>}
                    sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Booking</BodyText>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={draftFilters.bookingAll}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          bookingAll: e.target.checked,
                          booking: { Online: false, Offline: false, Project: false, Requests: false },
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
                {bookingTypes.map((bt) => (
                  <FormControlLabel
                    key={bt}
                    control={
                      <Checkbox
                        size="small"
                        checked={!draftFilters.bookingAll && Boolean(draftFilters.booking[bt])}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            bookingAll: false,
                            booking: { ...p.booking, [bt]: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{bt}</BodyText>}
                    sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </MollureDrawer>

      <MollureModal
        open={blockTimeOpen}
        onClose={() => setBlockTimeOpen(false)}
        title="Add Block Time"
        maxWidth="sm"
        fullWidth
        footer={
          <Box sx={{ px: 2.5, py: 2 }}>
            <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
              <Button
                variant="outlined"
                onClick={() => setBlockTimeOpen(false)}
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
                onClick={() => {
                  showSnackbar({ severity: "success", message: "Blocked time added (mock)." });
                  setBlockTimeOpen(false);
                }}
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
            <AppSelect
              label="Title"
              value={blockDraft.title}
              onChange={(e) => setBlockDraft((p) => ({ ...p, title: e.target.value as any }))}
              options={[
                { label: "Meeting", value: "Meeting" },
                { label: "Training", value: "Training" },
                { label: "Holiday", value: "Holiday" },
                { label: "Custom", value: "Custom" },
              ]}
              fullWidth
            />

            <AppDropdown
              label="Team Member"
              value={blockDraft.teamIds}
              multiple
              renderValue={(selected) => {
                const ids = selected as readonly string[];
                if (!ids.length) return "Select Team Member";
                if (ids.length === data.resources.length) return "All";
                return ids.map((id) => teamLabelById.get(id) ?? id).join(", ");
              }}
              onChange={(val) => setBlockDraft((p) => ({ ...p, teamIds: val as string[] }))}
              options={data.resources.map((r) => ({ value: r.id, label: teamLabelById.get(r.id) ?? r.name }))}
              fullWidth
            />

            <AppDropdown
              label="Location"
              value={blockDraft.locations}
              multiple
              renderValue={(selected) => {
                const locs = selected as readonly string[];
                if (!locs.length) return "Select Location";
                if (locs.length === 2) return "All";
                return locs.join(", ");
              }}
              onChange={(val) => setBlockDraft((p) => ({ ...p, locations: val as CalendarBookingLocation[] }))}
              options={[
                { label: "FL", value: "FL" },
                { label: "DL", value: "DL" },
              ]}
              fullWidth
            />

            <Stack direction="row" spacing={1.25}>
              <AppTextField
                label="Date (from)"
                type="date"
                value={blockDraft.dateFrom}
                onChange={(e) => setBlockDraft((p) => ({ ...p, dateFrom: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <AppTextField
                label="Date (to)"
                type="date"
                value={blockDraft.dateTo}
                onChange={(e) => setBlockDraft((p) => ({ ...p, dateTo: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Stack direction="row" spacing={1.25}>
              <AppSelect
                label="Day (from)"
                value={blockDraft.dayFrom}
                onChange={(e) => setBlockDraft((p) => ({ ...p, dayFrom: e.target.value as any }))}
                options={[
                  { label: "Monday", value: "Monday" },
                  { label: "Tuesday", value: "Tuesday" },
                  { label: "Wednesday", value: "Wednesday" },
                  { label: "Thursday", value: "Thursday" },
                  { label: "Friday", value: "Friday" },
                  { label: "Saturday", value: "Saturday" },
                  { label: "Sunday", value: "Sunday" },
                ]}
                fullWidth
              />
              <AppSelect
                label="Day (to)"
                value={blockDraft.dayTo}
                onChange={(e) => setBlockDraft((p) => ({ ...p, dayTo: e.target.value as any }))}
                options={[
                  { label: "Monday", value: "Monday" },
                  { label: "Tuesday", value: "Tuesday" },
                  { label: "Wednesday", value: "Wednesday" },
                  { label: "Thursday", value: "Thursday" },
                  { label: "Friday", value: "Friday" },
                  { label: "Saturday", value: "Saturday" },
                  { label: "Sunday", value: "Sunday" },
                ]}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1.25}>
              <AppTextField
                label="Start Time"
                type="time"
                value={blockDraft.startTime}
                onChange={(e) => setBlockDraft((p) => ({ ...p, startTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <AppTextField
                label="End Time"
                type="time"
                value={blockDraft.endTime}
                onChange={(e) => setBlockDraft((p) => ({ ...p, endTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </Box>
      </MollureModal>
    </Stack>
  );
}

