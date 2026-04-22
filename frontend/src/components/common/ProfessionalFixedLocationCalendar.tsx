"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Button, Chip, Divider, Drawer, IconButton, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import MollureCardHeader from "./MollureCardHeader";
import { useSnackbar } from "./AppSnackbar";
import type {
  CalendarBookingStatus,
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
      return { bgcolor: alpha("#F4A100", 0.12), color: "#F4A100", borderColor: alpha("#F4A100", 0.28) };
    case "Cancelled":
      return { bgcolor: alpha("#D32F2F", 0.10), color: "#D32F2F", borderColor: alpha("#D32F2F", 0.26) };
    case "Confirmed":
      return { bgcolor: alpha("#2E7D32", 0.12), color: "#2E7D32", borderColor: alpha("#2E7D32", 0.28) };
    case "Completed":
      return { bgcolor: alpha(m.navy, 0.08), color: alpha(m.navy, 0.62), borderColor: alpha(m.navy, 0.18) };
    case "No Show":
    default:
      return { bgcolor: alpha(m.navy, 0.08), color: alpha(m.navy, 0.62), borderColor: alpha(m.navy, 0.18) };
  }
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

function SegmentedSubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly CalendarSubTab[];
  active: CalendarSubTab;
  onChange: (next: CalendarSubTab) => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: alpha(m.teal, 0.08),
        borderRadius: "10px",
        border: `1px solid ${alpha(m.teal, 0.16)}`,
        p: 0.5,
        display: "flex",
        gap: 0.75,
      }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <Button
            key={t}
            onClick={() => onChange(t)}
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: 13.5,
              borderRadius: "10px",
              px: 2.5,
              py: 1.05,
              minHeight: 42,
              flex: "1 1 0",
              bgcolor: isActive ? m.teal : "#fff",
              color: isActive ? "#fff" : alpha(m.navy, 0.62),
              boxShadow: "none",
              "&:hover": { bgcolor: isActive ? m.tealDark : alpha(m.navy, 0.03) },
            }}
          >
            {t}
          </Button>
        );
      })}
    </Box>
  );
}

export default function ProfessionalFixedLocationCalendar({ data }: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>(data.initialView);
  const [activeDateIso, setActiveDateIso] = React.useState(data.initialDate);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [slotDrawerOpen, setSlotDrawerOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<null | {
    resourceId: string;
    date: string;
    start: string;
    end: string;
    freeStart: string;
    freeEnd: string;
  }>(null);

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

  const eventsInRange = React.useMemo(
    () => data.events.filter((e) => visibleDates.includes(e.date)),
    [data.events, visibleDates],
  );
  const blocksInRange = React.useMemo(
    () => data.blocks.filter((b) => visibleDates.includes(b.date)),
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
      <SegmentedSubTabs tabs={data.subTabs} active={activeSubTab} onChange={setActiveSubTab} />

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
              onClick={() => showSnackbar({ severity: "info", message: "Filters (mock)." })}
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
              {["New booking", "New block", "New break"].map((label) => (
                <MenuItem
                  key={label}
                  onClick={() => {
                    setAddAnchor(null);
                    showSnackbar({ severity: "info", message: `${label} (mock).` });
                  }}
                >
                  {label}
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
              <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr", bgcolor: "#fff" }}>
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
                    bgcolor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {data.resources.map((res, laneIdx) => {
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
                            bgcolor: "#fff",
                            borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                          }}
                        >
                          <Avatar sx={{ width: 26, height: 26, bgcolor: alpha(m.teal, 0.14), color: m.teal, fontWeight: 900, fontSize: 12 }}>
                            {res.avatarText}
                          </Avatar>
                          <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}>
                            {res.name}
                          </BodyText>
                          <Box sx={{ flex: 1 }} />
                          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }} />
                        </Box>

                        {/* Lane body */}
                        <Box
                          sx={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: viewMode === "week" ? "repeat(7, 1fr)" : "1fr",
                            bgcolor: "#fff",
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
                                  bgcolor: "#fff", // Free time = white
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
                                          bgcolor: alpha(m.navy, 0.02),
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
                                          bgcolor: alpha(m.navy, 0.02),
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Box sx={{ position: "absolute", inset: 0, bgcolor: alpha(m.navy, 0.02), pointerEvents: "none" }} />
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
                                  const top = ((minutesSinceMidnight(ev.start) - startMin) / grid.stepMinutes) * rowPx + 6;
                                  const height = ((minutesSinceMidnight(ev.end) - minutesSinceMidnight(ev.start)) / grid.stepMinutes) * rowPx - 12;
                                  const split = idx % 2 === 0;
                                  const left = split ? 10 : "50%";
                                  const right = split ? "50%" : 10;

                                  const bg =
                                    ev.status === "Requested"
                                      ? alpha("#F4A100", 0.08)
                                      : ev.status === "Cancelled"
                                        ? alpha("#D32F2F", 0.06)
                                        : ev.status === "Confirmed"
                                          ? alpha("#2E7D32", 0.07)
                                          : alpha(m.navy, 0.03);

                                  return (
                                    <Paper
                                      key={ev.id}
                                      elevation={0}
                                      sx={{
                                        position: "absolute",
                                        top,
                                        left,
                                        right,
                                        height,
                                        borderRadius: "10px",
                                        bgcolor: bg,
                                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                                        p: 1,
                                        overflow: "hidden",
                                        pointerEvents: "none",
                                      }}
                                    >
                                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35 }}>
                                        <BodyText sx={{ fontSize: 10.5, fontWeight: 900, color: alpha(m.navy, 0.7) }}>
                                          ID: {ev.id.replaceAll("b-", "")}
                                        </BodyText>
                                        <Chip
                                          size="small"
                                          label={ev.status}
                                          sx={{
                                            height: 18,
                                            borderRadius: "999px",
                                            fontSize: 9,
                                            fontWeight: 900,
                                            border: "1px solid",
                                            ...statusChipSx(ev.status, m),
                                          }}
                                        />
                                      </Stack>
                                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.85), lineHeight: 1.2 }}>
                                        {ev.title}
                                      </BodyText>
                                      <BodyText sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.6), mt: 0.2 }}>
                                        ({ev.start} to {ev.end})
                                      </BodyText>
                                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                                        <BodyText sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.65) }}>
                                          {ev.location}
                                        </BodyText>
                                      </Stack>

                                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ position: "absolute", right: 8, bottom: 8 }}>
                                        <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />
                                        <BodyText sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                                          {ev.showClientName ?? "Client"}
                                        </BodyText>
                                      </Stack>
                                    </Paper>
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
    </Stack>
  );
}

