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
import { Avatar, Box, Button, ButtonBase, Checkbox, Chip, Divider, FormControlLabel, IconButton, Menu, MenuItem, Paper, Stack, Tooltip } from "@mui/material";
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

function toIsoLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<"booking" | "sales" | "activity">("booking");
  const [slotSelectedCalendar, setSlotSelectedCalendar] = React.useState<string>("");
  const [slotCalendarDropdownOpen, setSlotCalendarDropdownOpen] = React.useState(true);
  const [slotMiniScope, setSlotMiniScope] = React.useState<"fixed" | "desired">("fixed");
  const [slotMiniMonth, setSlotMiniMonth] = React.useState<Date>(() => startOfLocalDay(new Date()));
  const [slotMiniSelected, setSlotMiniSelected] = React.useState<Date | null>(null);
  const [slotBookingScreen, setSlotBookingScreen] = React.useState<
    "new-booking" | "non-mollure-type" | "non-mollure-individual" | "non-mollure-company" | "guest"
  >("new-booking");
  const [nonMollureClientType, setNonMollureClientType] = React.useState<"" | "individual" | "company">("");
  const [guestDraft, setGuestDraft] = React.useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
  }>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  }));
  const [nonMollureDraft, setNonMollureDraft] = React.useState<{
    firstName: string;
    lastName: string;
    email: string;
    gender: "" | "male" | "female" | "other";
    dob: string;
    phoneCode: string;
    phoneNumber: string;
    companyName: string;
    legalName: string;
    coc: string;
    vat: string;
    contactFirstName: string;
    contactLastName: string;
    street: string;
    streetNumber: string;
    postalCode: string;
    province: string;
    municipality: string;
  }>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dob: "",
    phoneCode: "",
    phoneNumber: "",
    companyName: "",
    legalName: "",
    coc: "",
    vat: "",
    contactFirstName: "",
    contactLastName: "",
    street: "",
    streetNumber: "",
    postalCode: "",
    province: "",
    municipality: "",
  }));

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

  const slotTabs = React.useMemo(
    () =>
      [
        { id: "booking" as const, label: "Booking" },
        { id: "activity" as const, label: "Activity" },
        { id: "sales" as const, label: "Sales" },
      ] as const,
    [],
  );

  const todayLocal = React.useMemo(() => startOfLocalDay(new Date()), []);

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
      // Init drawer "New Booking" date/month to today when opened
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setNonMollureClientType("");
      setNonMollureDraft({
        firstName: "",
        lastName: "",
        email: "",
        gender: "",
        dob: "",
        phoneCode: "",
        phoneNumber: "",
        companyName: "",
        legalName: "",
        coc: "",
        vat: "",
        contactFirstName: "",
        contactLastName: "",
        street: "",
        streetNumber: "",
        postalCode: "",
        province: "",
        municipality: "",
      });
      setSlotCalendarDropdownOpen(true);
      setSlotMiniSelected(todayLocal);
      setSlotMiniMonth(todayLocal);
      setSlotDrawerOpen(true);
    },
    [getAvailabilityFor, getBusyFor, grid.stepMinutes, showSnackbar, startMin, todayLocal],
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

      <MollureDrawer
        anchor="right"
        open={slotDrawerOpen}
        onClose={() => setSlotDrawerOpen(false)}
        title="Free time"
        width={{ xs: "100%", sm: 420 }}
        footer={
          selectedSlot && slotDrawerTab === "booking" ? (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      setSlotBookingScreen("non-mollure-type");
                      return;
                    }
                    if (slotBookingScreen === "non-mollure-type") {
                      setSlotBookingScreen("new-booking");
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      setSlotBookingScreen("new-booking");
                      return;
                    }
                    setSlotDrawerOpen(false);
                  }}
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
                  Back
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    if (slotBookingScreen === "non-mollure-type") {
                      if (!nonMollureClientType) {
                        showSnackbar({ severity: "warning", message: "Please select Client Type." });
                        return;
                      }
                      setSlotBookingScreen(nonMollureClientType === "individual" ? "non-mollure-individual" : "non-mollure-company");
                      return;
                    }
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      showSnackbar({ severity: "success", message: "Saved (mock)." });
                      setSlotBookingScreen("new-booking");
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      const first = guestDraft.firstName.trim();
                      const last = guestDraft.lastName.trim();
                      if (!first || !last) {
                        showSnackbar({ severity: "warning", message: "Guest first name and last name are required." });
                        return;
                      }
                      showSnackbar({ severity: "success", message: "Guest added (mock)." });
                      setSlotBookingScreen("new-booking");
                      return;
                    }
                    showSnackbar({ severity: "success", message: "Saved (mock)." });
                    setSlotDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 900,
                    height: 38,
                    bgcolor: m.teal,
                    "&:hover": { bgcolor: m.tealDark },
                    minWidth: 110,
                  }}
                >
                  {slotBookingScreen === "new-booking" ? "Save" : "Save"}
                </Button>
              </Stack>
            </Box>
          ) : null
        }
      >
        <Box sx={{ px: 2.5, pt: 2.25, pb: 2.5 }}>
          {selectedSlot ? (
            <>
              {/* Top tabs (underline style) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  borderBottom: `1px solid ${alpha(m.navy, 0.10)}`,
                  mb: 1.75,
                }}
              >
                {slotTabs.map((t) => {
                  const active = t.id === slotDrawerTab;
                  return (
                    <Box
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSlotDrawerTab(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSlotDrawerTab(t.id);
                      }}
                      sx={{
                        textAlign: "center",
                        py: 1.25,
                        cursor: "pointer",
                        position: "relative",
                        userSelect: "none",
                        color: active ? m.teal : alpha(m.navy, 0.55),
                        fontWeight: 900,
                        fontSize: 13.5,
                        "&:after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -1,
                          height: 2,
                          bgcolor: active ? m.teal : "transparent",
                        },
                      }}
                    >
                      {t.label}
                    </Box>
                  );
                })}
              </Box>

              {slotDrawerTab === "booking" ? (
                slotBookingScreen === "non-mollure-type" ? (
                  <Stack spacing={1.6}>
                    <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 22, letterSpacing: "-0.01em" }}>
                      Add Non-Mollure Client
                    </BodyText>

                    <Box sx={{ pt: 0.5 }}>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Client Type
                      </BodyText>
                      <AppDropdown
                        label=""
                        value={nonMollureClientType}
                        onChange={(val) => {
                          const next = val as "" | "individual" | "company";
                          setNonMollureClientType(next);
                          if (next === "individual") setSlotBookingScreen("non-mollure-individual");
                          if (next === "company") setSlotBookingScreen("non-mollure-company");
                        }}
                        options={[
                          { label: "Individual Client", value: "individual" },
                          { label: "Company Client", value: "company" },
                        ]}
                        fullWidth
                        placeholder="Select Client Type"
                      />
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 360 }} />
                  </Stack>
                ) : slotBookingScreen === "non-mollure-individual" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 22, letterSpacing: "-0.01em" }}>
                        Add Non-Mollure Client
                      </BodyText>
                      <Box
                        sx={{
                          px: 1,
                          height: 22,
                          borderRadius: "999px",
                          bgcolor: alpha(m.teal, 0.12),
                          color: m.teal,
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        IC
                      </Box>
                    </Stack>

                    <Box sx={{ pt: 0.25 }}>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Client Type
                      </BodyText>
                      <AppTextField value="Individual Client" fullWidth disabled />
                    </Box>

                    <AppTextField
                      placeholder="First Name"
                      value={nonMollureDraft.firstName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, firstName: e.target.value }))}
                      fullWidth
                    />
                    <AppTextField
                      placeholder="Last Name"
                      value={nonMollureDraft.lastName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, lastName: e.target.value }))}
                      fullWidth
                    />

                    <AppDropdown
                      label=""
                      value={nonMollureDraft.gender}
                      onChange={(val) => setNonMollureDraft((p) => ({ ...p, gender: val as any }))}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                      ]}
                      fullWidth
                      placeholder="Select Gender"
                    />

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Date of Birth
                      </BodyText>
                      <AppTextField
                        type="text"
                        value={nonMollureDraft.dob}
                        onChange={(e) => setNonMollureDraft((p) => ({ ...p, dob: e.target.value }))}
                        fullWidth
                        placeholder="mm/dd/yyyy"
                      />
                    </Box>

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Contact Number
                      </BodyText>
                      <Stack direction="row" spacing={1.25}>
                        <AppDropdown
                          label=""
                          value={nonMollureDraft.phoneCode}
                          onChange={(val) => setNonMollureDraft((p) => ({ ...p, phoneCode: val as string }))}
                          options={[
                            { label: "Select Country Code", value: "" },
                            { label: "+1", value: "+1" },
                            { label: "+44", value: "+44" },
                            { label: "+92", value: "+92" },
                          ]}
                          fullWidth
                          sx={{ maxWidth: 140 }}
                          placeholder="Select Country Code"
                        />
                        <AppTextField
                          placeholder="+442xxxxxxxxxx"
                          value={nonMollureDraft.phoneNumber}
                          onChange={(e) => setNonMollureDraft((p) => ({ ...p, phoneNumber: e.target.value }))}
                          fullWidth
                        />
                      </Stack>
                    </Box>

                    <AppTextField
                      placeholder="Email Address"
                      value={nonMollureDraft.email}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, email: e.target.value }))}
                      fullWidth
                    />

                    <Box sx={{ flex: 1, minHeight: 140 }} />
                  </Stack>
                ) : slotBookingScreen === "non-mollure-company" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 22, letterSpacing: "-0.01em" }}>
                        Add Non-Mollure Client
                      </BodyText>
                      <Box
                        sx={{
                          px: 1,
                          height: 22,
                          borderRadius: "999px",
                          bgcolor: alpha(m.teal, 0.12),
                          color: m.teal,
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        CC
                      </Box>
                    </Stack>

                    <Box sx={{ pt: 0.25 }}>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Client Type
                      </BodyText>
                      <AppTextField value="Company Client" fullWidth disabled />
                    </Box>

                    <AppTextField
                      placeholder="Legal Name"
                      value={nonMollureDraft.legalName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, legalName: e.target.value }))}
                      fullWidth
                    />
                    <AppTextField
                      placeholder="COC"
                      value={nonMollureDraft.coc}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, coc: e.target.value }))}
                      fullWidth
                    />
                    <AppTextField
                      placeholder="VAT"
                      value={nonMollureDraft.vat}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, vat: e.target.value }))}
                      fullWidth
                    />

                    <AppTextField
                      placeholder="Contact Person’s First Name"
                      value={nonMollureDraft.contactFirstName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, contactFirstName: e.target.value }))}
                      fullWidth
                    />
                    <AppTextField
                      placeholder="Contact Person’s Last Name"
                      value={nonMollureDraft.contactLastName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, contactLastName: e.target.value }))}
                      fullWidth
                    />

                    <AppDropdown
                      label=""
                      value={nonMollureDraft.gender}
                      onChange={(val) => setNonMollureDraft((p) => ({ ...p, gender: val as any }))}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                      ]}
                      fullWidth
                      placeholder="Select Gender"
                    />

                    <Box sx={{ pt: 0.5 }}>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Business Address
                      </BodyText>
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1.25}>
                          <AppTextField
                            placeholder="Street"
                            value={nonMollureDraft.street}
                            onChange={(e) => setNonMollureDraft((p) => ({ ...p, street: e.target.value }))}
                            fullWidth
                          />
                          <AppTextField
                            placeholder="Number"
                            value={nonMollureDraft.streetNumber}
                            onChange={(e) => setNonMollureDraft((p) => ({ ...p, streetNumber: e.target.value }))}
                            fullWidth
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.25}>
                          <AppTextField
                            placeholder="Postal Code"
                            value={nonMollureDraft.postalCode}
                            onChange={(e) => setNonMollureDraft((p) => ({ ...p, postalCode: e.target.value }))}
                            fullWidth
                          />
                          <AppDropdown
                            label=""
                            value={nonMollureDraft.province}
                            onChange={(val) => setNonMollureDraft((p) => ({ ...p, province: val as string }))}
                            options={[
                              { label: "Province", value: "" },
                              { label: "Province A", value: "province-a" },
                              { label: "Province B", value: "province-b" },
                            ]}
                            fullWidth
                            placeholder="Province"
                          />
                        </Stack>
                        <AppDropdown
                          label=""
                          value={nonMollureDraft.municipality}
                          onChange={(val) => setNonMollureDraft((p) => ({ ...p, municipality: val as string }))}
                          options={[
                            { label: "Municipality", value: "" },
                            { label: "Municipality A", value: "municipality-a" },
                            { label: "Municipality B", value: "municipality-b" },
                          ]}
                          fullWidth
                          placeholder="Municipality"
                        />
                      </Stack>
                    </Box>

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Contact Number
                      </BodyText>
                      <Stack direction="row" spacing={1.25}>
                        <AppDropdown
                          label=""
                          value={nonMollureDraft.phoneCode}
                          onChange={(val) => setNonMollureDraft((p) => ({ ...p, phoneCode: val as string }))}
                          options={[
                            { label: "Country Code", value: "" },
                            { label: "+1", value: "+1" },
                            { label: "+44", value: "+44" },
                            { label: "+92", value: "+92" },
                          ]}
                          fullWidth
                          sx={{ maxWidth: 140 }}
                          placeholder="Country Code"
                        />
                        <AppTextField
                          placeholder="+442xxxxxxxxxx"
                          value={nonMollureDraft.phoneNumber}
                          onChange={(e) => setNonMollureDraft((p) => ({ ...p, phoneNumber: e.target.value }))}
                          fullWidth
                        />
                      </Stack>
                    </Box>

                    <AppTextField
                      placeholder="Email Address"
                      value={nonMollureDraft.email}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, email: e.target.value }))}
                      fullWidth
                    />

                    <Box sx={{ flex: 1, minHeight: 140 }} />
                  </Stack>
                ) : slotBookingScreen === "guest" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 22, letterSpacing: "-0.01em" }}>
                        Add Guest
                      </BodyText>
                      <Box
                        sx={{
                          px: 1,
                          height: 22,
                          borderRadius: "999px",
                          bgcolor: alpha(m.navy, 0.06),
                          color: alpha(m.navy, 0.72),
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        Guest
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <AppTextField
                        placeholder="First Name*"
                        value={guestDraft.firstName}
                        onChange={(e) => setGuestDraft((p) => ({ ...p, firstName: e.target.value }))}
                        fullWidth
                      />
                      <AppTextField
                        placeholder="Last Name*"
                        value={guestDraft.lastName}
                        onChange={(e) => setGuestDraft((p) => ({ ...p, lastName: e.target.value }))}
                        fullWidth
                      />
                    </Stack>

                    <AppTextField
                      placeholder="Email (optional)"
                      value={guestDraft.email}
                      onChange={(e) => setGuestDraft((p) => ({ ...p, email: e.target.value }))}
                      fullWidth
                    />

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Contact Number (optional)
                      </BodyText>
                      <Stack direction="row" spacing={1.25}>
                        <AppDropdown
                          label=""
                          value={guestDraft.phoneCode}
                          onChange={(val) => setGuestDraft((p) => ({ ...p, phoneCode: val as string }))}
                          options={[
                            { label: "Country Code", value: "" },
                            { label: "+1", value: "+1" },
                            { label: "+44", value: "+44" },
                            { label: "+92", value: "+92" },
                          ]}
                          fullWidth
                          sx={{ maxWidth: 140 }}
                          placeholder="Country Code"
                        />
                        <AppTextField
                          placeholder="Phone number"
                          value={guestDraft.phoneNumber}
                          onChange={(e) => setGuestDraft((p) => ({ ...p, phoneNumber: e.target.value }))}
                          fullWidth
                        />
                      </Stack>
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 200 }} />
                  </Stack>
                ) : (
                  <Stack spacing={1.6}>
                    <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}>
                      New Booking
                    </BodyText>

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Calendar
                      </BodyText>
                      <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => setSlotCalendarDropdownOpen((p) => !p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setSlotCalendarDropdownOpen((p) => !p);
                        }}
                        sx={{
                          border: `1px solid ${alpha(m.navy, 0.14)}`,
                          borderRadius: "10px",
                          height: 42,
                          display: "flex",
                          alignItems: "center",
                          px: 1.25,
                          cursor: "pointer",
                          bgcolor: "#fff",
                          "&:hover": { bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: slotSelectedCalendar ? alpha(m.navy, 0.78) : alpha(m.navy, 0.45) }}>
                          {slotSelectedCalendar
                            ? data.resources.find((r) => r.id === slotSelectedCalendar)?.name ?? slotSelectedCalendar
                            : "Select calender"}
                        </BodyText>
                        <Box sx={{ flex: 1 }} />
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.45), transform: slotCalendarDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 140ms ease" }} />
                      </Box>
                    </Box>

                    {/* Embedded mini calendar */}
                    {slotCalendarDropdownOpen ? (
                      <Box
                        sx={{
                          border: `1px solid ${alpha(m.navy, 0.10)}`,
                          borderRadius: "12px",
                          bgcolor: "#fff",
                          p: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: "fit-content",
                            mx: "auto",
                            mb: 1.25,
                            borderRadius: "999px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            bgcolor: "#fff",
                            overflow: "hidden",
                            display: "flex",
                          }}
                        >
                          {[
                            { id: "fixed" as const, label: "Fixed Location" },
                            { id: "desired" as const, label: "Desired Location" },
                          ].map((t) => {
                            const active = t.id === slotMiniScope;
                            return (
                              <Box
                                key={t.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSlotMiniScope(t.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") setSlotMiniScope(t.id);
                                }}
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  fontSize: 12,
                                  fontWeight: 900,
                                  cursor: "pointer",
                                  color: active ? "#fff" : alpha(m.navy, 0.55),
                                  bgcolor: active ? m.teal : "transparent",
                                  userSelect: "none",
                                }}
                              >
                                {t.label}
                              </Box>
                            );
                          })}
                        </Box>

                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}>
                            {slotMiniMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
                          </BodyText>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => setSlotMiniMonth(new Date(slotMiniMonth.getFullYear(), slotMiniMonth.getMonth() - 1, 1))}
                            >
                              <ChevronLeftRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.6) }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setSlotMiniMonth(new Date(slotMiniMonth.getFullYear(), slotMiniMonth.getMonth() + 1, 1))}
                            >
                              <ChevronRightRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.6) }} />
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                            <BodyText key={d} sx={{ width: 36, textAlign: "center", fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.55) }}>
                              {d}
                            </BodyText>
                          ))}
                        </Stack>

                        {(() => {
                          const monthStart = new Date(slotMiniMonth.getFullYear(), slotMiniMonth.getMonth(), 1);
                          const monthEnd = new Date(slotMiniMonth.getFullYear(), slotMiniMonth.getMonth() + 1, 0);
                          const daysInMonth = monthEnd.getDate();
                          const firstWeekdayMon0 = (monthStart.getDay() + 6) % 7;
                          const cells: Array<Date | null> = [];
                          for (let i = 0; i < firstWeekdayMon0; i++) cells.push(null);
                          for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(slotMiniMonth.getFullYear(), slotMiniMonth.getMonth(), day));
                          while (cells.length % 7 !== 0) cells.push(null);

                          return (
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}>
                              {cells.map((cell, idx) => {
                                const isSelected = cell && slotMiniSelected ? isSameLocalDay(cell, slotMiniSelected) : false;
                                const isDisabled = !cell || cell < todayLocal;
                                return (
                                  <ButtonBase
                                    key={idx}
                                    disabled={isDisabled}
                                    onClick={() => {
                                      if (!cell) return;
                                      setSlotMiniSelected(cell);
                                    }}
                                    sx={{
                                      width: 36,
                                      height: 34,
                                      borderRadius: "10px",
                                      fontSize: 12,
                                      fontWeight: 900,
                                      color: isDisabled ? alpha(m.navy, 0.25) : isSelected ? "#fff" : alpha(m.navy, 0.78),
                                      bgcolor: isSelected ? m.teal : "transparent",
                                      border: `1px solid ${isSelected ? m.teal : "transparent"}`,
                                      "&:hover": !isDisabled ? { bgcolor: isSelected ? m.tealDark : alpha(m.teal, 0.10) } : undefined,
                                    }}
                                  >
                                    {cell ? cell.getDate() : ""}
                                  </ButtonBase>
                                );
                              })}
                            </Box>
                          );
                        })()}
                      </Box>
                    ) : null}

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Client
                      </BodyText>
                      <Stack spacing={1.25}>
                        {[
                          { label: "Add Non-Mollure Client", key: "non-mollure" },
                          { label: "Add Guest", key: "guest" },
                        ].map((item) => (
                          <Box
                            key={item.key}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (item.key === "non-mollure") {
                                setSlotBookingScreen("non-mollure-type");
                                return;
                              }
                              setSlotBookingScreen("guest");
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              if (item.key === "non-mollure") {
                                setSlotBookingScreen("non-mollure-type");
                                return;
                              }
                              setSlotBookingScreen("guest");
                            }}
                            sx={{
                              border: `1px solid ${alpha(m.navy, 0.14)}`,
                              borderRadius: "10px",
                              height: 46,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.25,
                              px: 1.5,
                              cursor: "pointer",
                              bgcolor: "#fff",
                              boxShadow: "0 4px 14px rgba(16, 35, 63, 0.06)",
                              "&:hover": { bgcolor: alpha(m.navy, 0.02) },
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "999px",
                                bgcolor: alpha(m.teal, 0.12),
                                color: m.teal,
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 900,
                                flexShrink: 0,
                                border: `1px solid ${alpha(m.teal, 0.22)}`,
                              }}
                            >
                              +
                            </Box>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
                              {item.label}
                            </BodyText>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                )
              ) : (
                <Box sx={{ pt: 1 }}>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.6) }}>
                    {slotDrawerTab === "sales" ? "Sales tab (mock)." : "Activity tab (mock)."}
                  </BodyText>
                </Box>
              )}
            </>
          ) : (
            <BodyText sx={{ mt: 1, color: alpha(m.navy, 0.6), fontSize: 12.5 }}>
              Click an empty space in the schedule to view free time.
            </BodyText>
          )}
        </Box>
      </MollureDrawer>

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

