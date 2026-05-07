"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardDoubleArrowLeftRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Avatar, Box, Button, ButtonBase, Chip, IconButton, Paper, Popover, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import { useSnackbar } from "./AppSnackbar";
import AppPillTabs from "./AppPillTabs";
import MollureDrawer from "./MollureDrawer";
import AppTextField from "./AppTextField";
import AppDropdown from "./AppDropdown";
import CalendarAddMenu from "./calendar/CalendarAddMenu";
import CalendarBlockTimeModal from "./calendar/CalendarBlockTimeModal";
import CalendarDesignModal, { type CalendarDesignDraft } from "./calendar/CalendarDesignModal";
import CalendarPublicBusinessHoursModal, {
  type PublicBusinessHoursDraft,
} from "./calendar/CalendarPublicBusinessHoursModal";
import CalendarFiltersDrawer from "./calendar/CalendarFiltersDrawer";
import { useCalendarFilters } from "./calendar/useCalendarFilters";
import {
  addDaysIso,
  addMonthsIso,
  extractBookingId,
  fmtMinToTime,
  fmtTimeLabel,
  formatLongDateUtc,
  formatMdyDate,
  formatMonthYearUtc,
  type BlockTimeDraft,
  type Interval,
  mergeIntervals,
  minutesSinceMidnight,
  parseIsoDate,
  type SelectedSlot,
  startOfWeekIso,
  statusChipSx,
  subtractIntervals,
  sumIntervalsMins,
  toIsoLocalDate,
  toMonthIso,
} from "./calendar/calendar.utils";
import type {
  CalendarBookingType,
  CalendarBookingLocation,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../app/professionals/fixed-location/calendar/calendar.data";
import type { CreateCalendarEntryRequest, UpsertCalendarSettingsRequest } from "../../store/services/businessApi";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  isSaving?: boolean;
  onCreateCalendarEntry?: (payload: CreateCalendarEntryRequest) => Promise<void>;
  onSaveCalendarSettings?: (payload: UpsertCalendarSettingsRequest) => Promise<void>;
};

const toDateTimeInput = (date: string, time: string) => `${date}T${time}:00`;
const locationToApi = (location: CalendarBookingLocation) => (location === "DL" ? "desired" : "fixed");

export default function ProfessionalFixedLocationCalendar({
  data,
  isSaving = false,
  onCreateCalendarEntry,
  onSaveCalendarSettings,
}: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>(data.initialView);
  const [activeDateIso, setActiveDateIso] = React.useState(defaultDateIso);
  const [selectedResourceId, setSelectedResourceId] = React.useState(data.resources[0]?.id ?? "");
  const [datePickerAnchor, setDatePickerAnchor] = React.useState<HTMLElement | null>(null);
  const [datePickerMonth, setDatePickerMonth] = React.useState(() => {
    const base = parseIsoDate(defaultDateIso);
    return new Date(base.getUTCFullYear(), base.getUTCMonth(), 1);
  });
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<"booking" | "sales" | "activity">("booking");
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>(data.supportedLocations[0] ?? "FL");
  const [slotBookingType, setSlotBookingType] = React.useState<CalendarBookingType>("Offline");
  const [slotStatus, setSlotStatus] = React.useState<"Confirmed" | "Requested" | "No Show" | "Completed" | "Cancelled">(
    "Confirmed",
  );
  const [slotCalendarMonth, setSlotCalendarMonth] = React.useState(() => toMonthIso(defaultDateIso));
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotBookingScreen, setSlotBookingScreen] = React.useState<
    "new-booking" | "add-client-choice" | "non-mollure-type" | "non-mollure-individual" | "non-mollure-company" | "guest"
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

  const {
    appliedFilters,
    bookingTypes,
    draftFilters,
    filteredResources,
    initialFilters,
    locations,
    setAppliedFilters,
    setDraftFilters,
  } = useCalendarFilters(data.resources, data.supportedLocations);
  React.useEffect(() => {
    if (!data.supportedLocations.includes(slotLocation)) {
      setSlotLocation(data.supportedLocations[0] ?? "FL");
    }
  }, [data.supportedLocations, slotLocation]);
  const [blockTimeOpen, setBlockTimeOpen] = React.useState(false);
  const [publicBusinessHoursOpen, setPublicBusinessHoursOpen] = React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  const [slotDrawerOpen, setSlotDrawerOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<null | SelectedSlot>(null);

  const slotTabs = React.useMemo(
    () =>
      [
        { id: "booking" as const, label: "Booking" },
        { id: "activity" as const, label: "Activity" },
        { id: "sales" as const, label: "Sales" },
      ] as const,
    [],
  );

  const [blockDraft, setBlockDraft] = React.useState<BlockTimeDraft>(() => ({
    title: "Meeting",
    teamIds: data.resources.map((r) => r.id),
    locations: [...data.supportedLocations],
    dateFrom: "2025-04-06",
    dateTo: "2025-04-06",
    dayFrom: "Monday",
    dayTo: "Friday",
    startTime: "16:30",
    endTime: "17:30",
  }));

  const [publicBusinessHoursDraft, setPublicBusinessHoursDraft] = React.useState<PublicBusinessHoursDraft>(() => ({
    location: "",
    schedule: "",
    day: "",
    startTime: "16:30",
    endTime: "17:30",
    notAvailable: false,
    note: "",
  }));

  const [designDraft, setDesignDraft] = React.useState<CalendarDesignDraft>(() => ({
    scope: "Categories",
    colorsByCategory: {},
  }));
  const [appliedDesign, setAppliedDesign] = React.useState<CalendarDesignDraft>(() => ({
    scope: "Categories",
    colorsByCategory: {},
  }));

  const getServiceCategory = React.useCallback((title: string) => {
    const t = String(title ?? "").toLowerCase();
    // Heuristic mapping (mock): lets the Design modal color the grid right away.
    if (/\b(nail|manicure|pedicure)\b/.test(t)) return "Nails";
    if (/\b(facial|brow|lash|lashes|make-?up|makeup)\b/.test(t)) return "Face treatments";
    if (/\b(massage|spa|body)\b/.test(t)) return "Body treatments";
    if (/\b(hair|cut|wash|blow|color|colour|keratin|style|styling)\b/.test(t)) return "Hair";
    return null;
  }, []);

  React.useEffect(() => {
    setBlockDraft((prev) => {
      const nextLocations = prev.locations.filter((loc) => data.supportedLocations.includes(loc));
      return {
        ...prev,
        locations: nextLocations.length ? nextLocations : [...data.supportedLocations],
      };
    });
  }, [data.supportedLocations]);

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
  const rowPx = 48;
  const laneHeaderPx = 44;

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

  const activeResource = React.useMemo(
    () => filteredResources.find((r) => r.id === selectedResourceId) ?? filteredResources[0],
    [filteredResources, selectedResourceId],
  );
  const displayedResources = React.useMemo(
    () => (viewMode === "week" ? (activeResource ? [activeResource] : []) : filteredResources),
    [activeResource, filteredResources, viewMode],
  );

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
    [
      appliedFilters.booking,
      appliedFilters.bookingAll,
      appliedFilters.locationAll,
      appliedFilters.locations,
      appliedFilters.teamAll,
      appliedFilters.teamIds,
      data.events,
      visibleDates,
    ],
  );
  const blocksInRange = React.useMemo(
    () => {
      const base = data.blocks.filter((b) => visibleDates.includes(b.date));
      if (appliedFilters.teamAll) return base;
      return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
    },
    [appliedFilters.teamAll, appliedFilters.teamIds, data.blocks, visibleDates],
  );

  const todayIso = defaultDateIso;

  const onToday = () => {
    setActiveDateIso(todayIso);
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

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot) => {
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation("FL");
      setSlotCalendarMonth(toMonthIso(payload.date));
      setSlotClientAdded(false);
      setGuestDraft({
        firstName: "",
        lastName: "",
        email: "",
        phoneCode: "",
        phoneNumber: "",
      });
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
      setSlotDrawerOpen(true);
    },
    [],
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
      const drawerDateIso = iso < todayIso ? todayIso : iso;

      const payload = {
        resourceId,
        date: drawerDateIso,
        start: fmtMinToTime(start),
        end: fmtMinToTime(Math.min(end, start + grid.stepMinutes)),
        freeStart: fmtMinToTime(segment.startMin),
        freeEnd: fmtMinToTime(segment.endMin),
      };
      openBookingDrawer(payload);
    },
    [getAvailabilityFor, getBusyFor, grid.stepMinutes, openBookingDrawer, showSnackbar, startMin, todayIso],
  );

  const saveSelectedBooking = React.useCallback(
    async (clientNameOverride?: string) => {
      if (!selectedSlot) return;

      if (!onCreateCalendarEntry) {
        showSnackbar({ severity: "error", message: "Calendar API is not connected." });
        return;
      }

      const clientName =
        clientNameOverride ||
        (slotClientAdded && guestDraft.firstName.trim()
          ? `${guestDraft.firstName.trim()} ${guestDraft.lastName.trim()}`.trim()
          : nonMollureDraft.firstName.trim()
            ? `${nonMollureDraft.firstName.trim()} ${nonMollureDraft.lastName.trim()}`.trim()
            : "Walk-in client");
      const teamMemberId = Number(selectedSlot.resourceId);
      const statusToApi: Record<typeof slotStatus, CreateCalendarEntryRequest["status"]> = {
        Confirmed: "confirmed",
        Requested: "requested",
        "No Show": "no_show",
        Completed: "completed",
        Cancelled: "cancelled",
      };
      const bookingTypeToApi: Record<CalendarBookingType, NonNullable<CreateCalendarEntryRequest["booking_type"]>> = {
        Online: "online",
        Offline: "offline",
        Project: "project",
        Requests: "request",
      };
      const apiStatus = statusToApi[slotStatus];
      const apiBookingType = bookingTypeToApi[slotBookingType];

      try {
        await onCreateCalendarEntry({
          team_member_id: Number.isInteger(teamMemberId) ? teamMemberId : null,
          status: apiStatus,
          title: `${slotBookingType} booking`,
          start_time: toDateTimeInput(selectedSlot.date, selectedSlot.start),
          end_time: toDateTimeInput(selectedSlot.date, selectedSlot.end),
          location_type: locationToApi(slotLocation),
          booking_type: apiBookingType,
          client_name: clientName,
          notes: slotLocation,
        });
        showSnackbar({ severity: "success", message: "Booking saved." });
        setSlotDrawerOpen(false);
      } catch {
        showSnackbar({ severity: "error", message: "Unable to save booking." });
      }
    },
    [
      guestDraft.firstName,
      guestDraft.lastName,
      nonMollureDraft.firstName,
      nonMollureDraft.lastName,
      onCreateCalendarEntry,
      selectedSlot,
      showSnackbar,
      slotClientAdded,
      slotBookingType,
      slotStatus,
      slotLocation,
    ],
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
          borderRadius: "4px",
          border: 0,
          boxShadow: "0 12px 28px rgba(16, 35, 63, 0.04)",
          bgcolor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Box sx={{ px: 1.5, py: 1.1, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <IconButton
                size="small"
                onClick={onPrev}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
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
                onClick={(e) => {
                  setDatePickerMonth(() => {
                    const base = parseIsoDate(activeDateIso);
                    return new Date(base.getUTCFullYear(), base.getUTCMonth(), 1);
                  });
                  setDatePickerAnchor(e.currentTarget);
                }}
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

              <Popover
                open={Boolean(datePickerAnchor)}
                anchorEl={datePickerAnchor}
                onClose={() => setDatePickerAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: "12px",
                    border: `1px solid ${alpha(m.navy, 0.10)}`,
                    boxShadow: "0 14px 28px rgba(16, 35, 63, 0.12)",
                    overflow: "hidden",
                    width: 320,
                    bgcolor: "#fff",
                  },
                }}
              >
                <Box sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDatePickerMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
                      }
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        border: `1px solid ${alpha(m.navy, 0.12)}`,
                        color: alpha(m.navy, 0.65),
                        bgcolor: "#fff",
                      }}
                    >
                      <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.85), flex: 1, textAlign: "center" }}>
                      {datePickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </BodyText>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDatePickerMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
                      }
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        border: `1px solid ${alpha(m.navy, 0.12)}`,
                        color: alpha(m.navy, 0.65),
                        bgcolor: "#fff",
                      }}
                    >
                      <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>

                  <Box
                    sx={{
                      mt: 1.25,
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: 0.5,
                    }}
                  >
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <BodyText
                        key={d}
                        sx={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.5),
                          textAlign: "center",
                          py: 0.5,
                        }}
                      >
                        {d}
                      </BodyText>
                    ))}

                    {(() => {
                      const firstDowMon0 = (datePickerMonth.getDay() + 6) % 7; // 0=Mon..6=Sun
                      const daysInMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 0).getDate();
                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < firstDowMon0; i++) cells.push(<Box key={`pad-${i}`} sx={{ height: 34 }} />);
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dt = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), day);
                        const iso = toIsoLocalDate(dt);
                        const isPast = iso < todayIso;
                        const selected = iso === activeDateIso;
                        cells.push(
                          <ButtonBase
                            key={iso}
                            disabled={isPast}
                            onClick={() => {
                              setActiveDateIso(iso);
                              setDatePickerAnchor(null);
                            }}
                            sx={{
                              height: 34,
                              borderRadius: "10px",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 12,
                              fontWeight: 900,
                              color: isPast ? alpha(m.navy, 0.24) : selected ? "#fff" : alpha(m.navy, 0.75),
                              bgcolor: selected && !isPast ? m.teal : "transparent",
                              cursor: isPast ? "not-allowed" : "pointer",
                              "&.Mui-disabled": {
                                color: alpha(m.navy, 0.24),
                                pointerEvents: "auto",
                              },
                              "&:hover": { bgcolor: isPast ? "transparent" : selected ? m.tealDark : alpha(m.navy, 0.05) },
                            }}
                          >
                            {day}
                          </ButtonBase>
                        );
                      }
                      return cells;
                    })()}
                  </Box>
                </Box>
              </Popover>

              <IconButton
                size="small"
                onClick={onNext}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
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
                      height: 28,
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
            <CalendarAddMenu
              anchorEl={addAnchor}
              onBlockedTime={() => setBlockTimeOpen(true)}
              onBooking={() => {
                const bookingDate = activeDateIso < todayIso ? todayIso : activeDateIso;
                const resourceId = activeResource?.id ?? selectedResourceId ?? data.resources[0]?.id ?? "";
                const availability = resourceId ? getAvailabilityFor(resourceId, bookingDate) : [];
                const segment = availability[0] ?? { startMin, endMin: Math.min(endMin, startMin + grid.stepMinutes) };
                const start = segment.startMin;
                openBookingDrawer({
                  resourceId,
                  date: bookingDate,
                  start: fmtMinToTime(start),
                  end: fmtMinToTime(Math.min(segment.endMin, start + grid.stepMinutes)),
                  freeStart: fmtMinToTime(segment.startMin),
                  freeEnd: fmtMinToTime(segment.endMin),
                });
              }}
              onPublicBusinessHours={() => setPublicBusinessHoursOpen(true)}
              onDesign={() => {
                setDesignDraft(appliedDesign);
                setDesignOpen(true);
              }}
              onClose={() => setAddAnchor(null)}
              onMockAction={(label) => showSnackbar({ severity: "info", message: `${label} (mock).` })}
            />
          </Stack>
        </Box>

        {/* Timeline grid */}
        <Box sx={{ px: 1.5, pb: 1.5, bgcolor: "#fff" }}>
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
                borderRadius: "2px",
                border: `1px solid ${alpha(m.navy, 0.10)}`,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "58px 1fr", bgcolor: m.fxSurface }}>
                {/* Time column */}
                <Box sx={{ bgcolor: "#fff" }}>
                  <Box sx={{ height: laneHeaderPx, borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }} />
                  {slotLines.map((t, idx) => (
                    <Box
                      key={t}
                      sx={{
                        height: rowPx,
                        px: 1,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        pt: idx === 0 ? 1.15 : 1,
                        borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                      }}
                    >
                      <BodyText sx={{ fontSize: 10, fontWeight: 800, color: alpha(m.navy, 0.5) }}>
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
                  {displayedResources.map((res, laneIdx) => {
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
                            px: 1.1,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                            bgcolor: "#fff",
                            borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, overflowX: "auto", py: 0.25 }}>
                            {filteredResources.map((member) => {
                              const isActiveMember = member.id === res.id;
                              const ratio = Math.round(
                                (viewMode === "week"
                                  ? laneDates.reduce((acc, iso) => acc + getDailyBookingRatio(member.id, iso), 0) / Math.max(1, laneDates.length)
                                  : getDailyBookingRatio(member.id, activeDateIso)) * 100,
                              );

                              return (
                                <Box
                                  key={member.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedResourceId(member.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setSelectedResourceId(member.id);
                                  }}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.8,
                                    minWidth: 126,
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                    px: 0.4,
                                    py: 0.35,
                                    bgcolor: isActiveMember ? alpha(m.teal, 0.04) : "transparent",
                                    "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: alpha(m.teal, isActiveMember ? 0.2 : 0.12),
                                      color: m.teal,
                                      fontWeight: 900,
                                      fontSize: 11,
                                    }}
                                  >
                                    {member.avatarText}
                                  </Avatar>
                                  <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                    <BodyText
                                      sx={{
                                        fontWeight: 900,
                                        color: isActiveMember ? alpha(m.navy, 0.82) : alpha(m.navy, 0.58),
                                        lineHeight: 1.1,
                                        fontSize: 12,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {member.name}
                                    </BodyText>
                                    <Box
                                      sx={{
                                        mt: 0.45,
                                        height: 3,
                                        width: 72,
                                        borderRadius: "999px",
                                        bgcolor: m.fxGrayF2F4F7,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Box sx={{ height: "100%", width: `${ratio}%`, bgcolor: isActiveMember ? m.teal : alpha(m.navy, 0.24) }} />
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Stack>
                          <Box sx={{ flex: 1 }} />
                          <Tooltip title="Team notes" placement="left">
                            <IconButton
                              size="small"
                              onClick={() => showSnackbar({ severity: "info", message: `Notes for ${res.name}` })}
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "6px",
                                color: alpha(m.navy, 0.46),
                                "&:hover": { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.72) },
                              }}
                            >
                              <StickyNote2OutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.42) }} />
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
                                  borderLeft: viewMode === "week" && colIdx > 0 ? `1px solid ${alpha(m.navy, 0.08)}` : undefined,
                                  height: rows * rowPx,
                                  bgcolor: "#fff",
                                  backgroundColor: "#fff",
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
                                          // Free slot background should stay white everywhere.
                                          bgcolor: "#fff",
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
                                          // Free slot background should stay white everywhere.
                                          bgcolor: "#fff",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Box sx={{ position: "absolute", inset: 0, bgcolor: "#fff", pointerEvents: "none" }} />
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
                                      bgcolor: alpha(m.navy, 0.08),
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
                                        left: 0,
                                        right: 0,
                                        top,
                                        height,
                                        borderRadius: 0,
                                        bgcolor: isUnavail ? alpha(m.navy, 0.035) : alpha(m.navy, 0.025),
                                        border: 0,
                                        borderTop: `1px solid ${alpha(m.navy, 0.04)}`,
                                        borderBottom: `1px solid ${alpha(m.navy, 0.04)}`,
                                        px: 1.2,
                                        py: 0.75,
                                        pointerEvents: "none",
                                      }}
                                    >
                                      <BodyText sx={{ fontWeight: 900, fontSize: 10, color: alpha(m.navy, 0.6), lineHeight: 1.1 }}>
                                        {b.start} to {b.end}
                                      </BodyText>
                                      <BodyText sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.58), lineHeight: 1.1 }}>
                                        {b.title}
                                      </BodyText>
                                    </Paper>
                                  );
                                })}

                                {/* Events */}
                                {laneEvents.map((ev, idx) => {
                                  const evStart = minutesSinceMidnight(ev.start);
                                  const evEnd = minutesSinceMidnight(ev.end);
                                  const top = ((evStart - startMin) / grid.stepMinutes) * rowPx + 1;
                                  const height = Math.max(44, ((evEnd - evStart) / grid.stepMinutes) * rowPx - 2);
                                  const overlapping = laneEvents
                                    .filter((other) => {
                                      const otherStart = minutesSinceMidnight(other.start);
                                      const otherEnd = minutesSinceMidnight(other.end);
                                      return evStart < otherEnd && evEnd > otherStart;
                                    })
                                    .sort((a, b) => a.id.localeCompare(b.id));
                                  const overlapIndex = Math.max(0, overlapping.findIndex((other) => other.id === ev.id));
                                  const overlapCount = Math.max(1, overlapping.length);
                                  const isSplit = overlapCount > 1;
                                  const widthPct = 100 / overlapCount;
                                  const left = isSplit ? `calc(${overlapIndex * widthPct}% + 4px)` : 4;
                                  const right = isSplit ? `calc(${(overlapCount - overlapIndex - 1) * widthPct}% + 4px)` : 4;

                                  const statusTone =
                                    ev.status === "Requested"
                                      ? { bar: "#FFA800", bg: "linear-gradient(90deg, rgba(255,168,0,0.11) 0%, rgba(255,168,0,0.035) 48%, rgba(33,184,191,0.045) 100%)" }
                                      : ev.status === "Cancelled"
                                        ? { bar: "#FF6B6B", bg: "#F0F2F5" }
                                        : ev.status === "Confirmed"
                                          ? { bar: "#2EAD73", bg: alpha(m.teal, 0.10) }
                                          : ev.status === "Completed"
                                            ? { bar: "#7C8AA0", bg: "#F0F2F5" }
                                            : { bar: "#5D7FA5", bg: "#F0F2F5" };

                                  const RAIL_W = 78;
                                  const serviceCategory = getServiceCategory(ev.title);
                                  const serviceColor = serviceCategory ? appliedDesign.colorsByCategory[serviceCategory] : undefined;
                                  const serviceBg = serviceColor ? alpha(serviceColor, 0.14) : undefined;
                                  const serviceBorder = serviceColor ? alpha(serviceColor, 0.35) : undefined;

                                  return (
                                    <Box
                                      key={ev.id}
                                      sx={{
                                        position: "absolute",
                                        top,
                                        left,
                                        right,
                                        height,
                                        borderRadius: "2px",
                                        background: serviceBg ?? statusTone.bg,
                                        border: `1px solid ${serviceBorder ?? alpha(m.navy, 0.08)}`,
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "row",
                                        // left accent bar via box-shadow so we avoid pseudo-element clipping issues
                                        boxShadow: `inset 4px 0 0 0 ${statusTone.bar}`,
                                        zIndex: 4,
                                      }}
                                    >
                                      {/* ── LEFT content (non-interactive) ── */}
                                      <Box
                                        sx={{
                                          flex: 1,
                                          minWidth: 0,
                                          pl: 1.3,
                                          pr: 0.5,
                                          py: 0.35,
                                          pointerEvents: "none",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35 }}>
                                          <BodyText sx={{ fontSize: 10.5, fontWeight: 500, color: alpha(m.navy, 0.78), lineHeight: 1 }}>
                                            ID: {extractBookingId(ev.id)}
                                          </BodyText>
                                          <Chip
                                            size="small"
                                            label={ev.status}
                                            sx={{
                                              height: 16,
                                              borderRadius: "7px",
                                              fontSize: 8.5,
                                              fontWeight: 800,
                                              border: "1px solid",
                                              "& .MuiChip-label": { px: 0.9 },
                                              ...statusChipSx(ev.status, m),
                                            }}
                                          />
                                        </Stack>
                                        <BodyText
                                          sx={{
                                            fontSize: 10.5,
                                            fontWeight: 500,
                                            color: alpha(m.navy, 0.82),
                                            lineHeight: 1.1,
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                          }}
                                        >
                                          {ev.title}
                                        </BodyText>
                                        <BodyText sx={{ fontSize: 10.5, color: alpha(m.navy, 0.74), mt: 0.15, lineHeight: 1.05 }}>
                                          ({ev.start} to {ev.end})
                                        </BodyText>
                                        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.15 }}>
                                          <LocationOnRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.62), flexShrink: 0 }} />
                                          <BodyText sx={{ fontSize: 10.5, fontWeight: 500, color: alpha(m.navy, 0.68), lineHeight: 1 }}>
                                            {ev.location}
                                          </BodyText>
                                        </Stack>
                                      </Box>

                                      {/* ── RIGHT rail (clickable icons) ── */}
                                      <Box
                                        sx={{
                                          width: RAIL_W,
                                          flexShrink: 0,
                                          bgcolor: "transparent",
                                          borderLeft: `1px solid ${alpha(m.navy, 0.06)}`,
                                          display: "grid",
                                          gridTemplateRows: "15px 15px 1fr",
                                          justifyItems: "center",
                                          alignItems: "center",
                                          py: 0.2,
                                        }}
                                      >
                                        <Tooltip title="Open calendar" placement="left">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showSnackbar({ severity: "info", message: `Calendar for booking ${extractBookingId(ev.id)}` });
                                            }}
                                            sx={{ p: 0.1, borderRadius: "5px", color: alpha(m.navy, 0.58), "&:hover": { bgcolor: alpha(m.navy, 0.06), color: m.navy } }}
                                          >
                                            <CalendarMonthRoundedIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Open notes" placement="left">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showSnackbar({ severity: "info", message: `Notes for booking ${extractBookingId(ev.id)}` });
                                            }}
                                            sx={{
                                              p: 0.1,
                                              borderRadius: "5px",
                                              color: alpha(m.navy, 0.58),
                                              "&:hover": { bgcolor: alpha(m.navy, 0.06), color: m.navy },
                                            }}
                                          >
                                            <StickyNote2OutlinedIcon sx={{ fontSize: 14 }} />
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
                                              px: 0,
                                              py: 0.2,
                                              borderRadius: "5px",
                                              "&:hover": { bgcolor: alpha(m.navy, 0.06) },
                                            }}
                                          >
                                            <PersonOutlineRoundedIcon sx={{ fontSize: 13, color: alpha(m.navy, 0.58) }} />
                                            <BodyText
                                              sx={{
                                                fontSize: 8.5,
                                                fontWeight: 700,
                                                color: alpha(m.navy, 0.62),
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
              <Stack direction="row" alignItems="center" spacing={1.25}>
                {slotBookingScreen === "new-booking" && slotClientAdded ? (
                  <IconButton
                    size="small"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.14)}`,
                      color: alpha(m.navy, 0.68),
                      bgcolor: "#fff",
                    }}
                  >
                    <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                ) : null}
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="outlined"
                  onClick={async () => {
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      setSlotBookingScreen("non-mollure-type");
                      return;
                    }
                    if (slotBookingScreen === "non-mollure-type") {
                      setSlotBookingScreen("add-client-choice");
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      setSlotBookingScreen("add-client-choice");
                      return;
                    }
                    if (slotBookingScreen === "add-client-choice") {
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
                  {slotBookingScreen === "new-booking" ? "Cancel" : "Back"}
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={async () => {
                    if (slotBookingScreen === "non-mollure-type") {
                      if (!nonMollureClientType) {
                        showSnackbar({ severity: "warning", message: "Please select Client Type." });
                        return;
                      }
                      setSlotBookingScreen(nonMollureClientType === "individual" ? "non-mollure-individual" : "non-mollure-company");
                      return;
                    }
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      const clientName =
                        slotBookingScreen === "non-mollure-company"
                          ? nonMollureDraft.companyName.trim() ||
                            nonMollureDraft.legalName.trim() ||
                            `${nonMollureDraft.contactFirstName.trim()} ${nonMollureDraft.contactLastName.trim()}`.trim()
                          : `${nonMollureDraft.firstName.trim()} ${nonMollureDraft.lastName.trim()}`.trim();
                      await saveSelectedBooking(clientName || "Non-Mollure client");
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      const first = guestDraft.firstName.trim();
                      const last = guestDraft.lastName.trim();
                      if (!first || !last) {
                        showSnackbar({ severity: "warning", message: "Guest first name and last name are required." });
                        return;
                      }
                      await saveSelectedBooking(`${first} ${last}`);
                      return;
                    }
                    await saveSelectedBooking();
                  }}
                  disabled={isSaving}
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
                slotBookingScreen === "add-client-choice" ? (
                  <Stack spacing={1.6}>
                    <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}>
                      Add Client
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
                            if (item.key === "non-mollure") setSlotBookingScreen("non-mollure-type");
                            else {
                              setSlotClientAdded(true);
                              setSlotBookingScreen("new-booking");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            if (item.key === "non-mollure") setSlotBookingScreen("non-mollure-type");
                            else {
                              setSlotClientAdded(true);
                              setSlotBookingScreen("new-booking");
                            }
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
                              fontSize: 18,
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
                    <Box sx={{ flex: 1, minHeight: 360 }} />
                  </Stack>
                ) : slotBookingScreen === "non-mollure-type" ? (
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

                    {/* Calendar selector */}
                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Calendar
                      </BodyText>
                      <Box
                        sx={{
                          border: `1px solid ${alpha(m.navy, 0.14)}`,
                          borderRadius: "10px",
                          minHeight: 40,
                          px: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          bgcolor: "#fff",
                          color: slotClientAdded ? alpha(m.navy, 0.74) : alpha(m.navy, 0.45),
                          fontSize: 12.5,
                          fontWeight: 800,
                        }}
                      >
                        <Box component="span">
                          {slotClientAdded ? `${slotLocation}: ${formatMdyDate(selectedSlot.date)}` : "Select calendar"}
                        </Box>
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
                      </Box>

                      {!slotClientAdded ? (
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 1.5,
                            mx: 0,
                            width: "100%",
                            borderRadius: "8px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            boxShadow: "0 8px 18px rgba(16, 35, 63, 0.08)",
                            overflow: "hidden",
                            bgcolor: "#fff",
                          }}
                        >
                          <Box sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 1.2 }}>
                              <AppDropdown
                                label=""
                                value={slotBookingType}
                                onChange={(value) => {
                                  const next = value as CalendarBookingType;
                                  setSlotBookingType(next);
                                  if (next === "Requests") setSlotStatus("Requested");
                                  if (next === "Offline" && slotStatus === "Requested") setSlotStatus("Confirmed");
                                }}
                                options={[
                                  { label: "Online", value: "Online" },
                                  { label: "Offline", value: "Offline" },
                                  { label: "Project", value: "Project" },
                                  { label: "Requests", value: "Requests" },
                                ]}
                                fullWidth
                                placeholder="Booking Type"
                              />
                              <AppDropdown
                                label=""
                                value={slotStatus}
                                onChange={(value) => setSlotStatus(value as typeof slotStatus)}
                                options={[
                                  { label: "Confirmed", value: "Confirmed" },
                                  { label: "Requested", value: "Requested" },
                                  { label: "Completed", value: "Completed" },
                                  { label: "Cancelled", value: "Cancelled" },
                                  { label: "No Show", value: "No Show" },
                                ]}
                                fullWidth
                                placeholder="Status"
                              />
                            </Stack>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${Math.max(1, data.supportedLocations.length)}, 1fr)`,
                                border: `1px solid ${alpha(m.navy, 0.08)}`,
                                borderRadius: "7px",
                                overflow: "hidden",
                                mb: 1.2,
                                maxWidth: 242,
                                mx: "auto",
                              }}
                            >
                              {data.supportedLocations.map((loc) => {
                                const active = slotLocation === loc;
                                return (
                                  <ButtonBase
                                    key={loc}
                                    onClick={() => setSlotLocation(loc)}
                                    sx={{
                                      height: 28,
                                      fontSize: 10,
                                      fontWeight: 900,
                                      bgcolor: active ? m.teal : "#fff",
                                      color: active ? "#fff" : alpha(m.navy, 0.55),
                                      borderRight:
                                        data.supportedLocations[data.supportedLocations.length - 1] !== loc
                                          ? `1px solid ${alpha(m.navy, 0.08)}`
                                          : undefined,
                                    }}
                                  >
                                    {loc === "FL" ? "Fixed Location" : "Desired Location"}
                                  </ButtonBase>
                                );
                              })}
                            </Box>

                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 0.3 }}>
                              <BodyText sx={{ flex: 1, fontSize: 15, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                {formatMonthYearUtc(slotCalendarMonth)}
                              </BodyText>
                              <IconButton
                                size="small"
                                onClick={() => setSlotCalendarMonth((p) => addMonthsIso(p, -12))}
                                sx={{ width: 22, height: 22, color: m.teal }}
                                aria-label="Previous year"
                              >
                                <KeyboardDoubleArrowLeftRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setSlotCalendarMonth((p) => addMonthsIso(p, -1))}
                                sx={{ width: 22, height: 22, color: m.teal }}
                                aria-label="Previous month"
                              >
                                <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setSlotCalendarMonth((p) => addMonthsIso(p, 1))}
                                sx={{ width: 22, height: 22, color: m.teal }}
                                aria-label="Next month"
                              >
                                <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setSlotCalendarMonth((p) => addMonthsIso(p, 12))}
                                sx={{ width: 22, height: 22, color: m.teal }}
                                aria-label="Next year"
                              >
                                <KeyboardDoubleArrowRightRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Stack>

                            <Box sx={{ mt: 0.9, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", columnGap: 0.5, rowGap: 0.55 }}>
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                                <BodyText key={d} sx={{ fontSize: 9, fontWeight: 800, color: alpha(m.navy, 0.42), textAlign: "center" }}>
                                  {d}
                                </BodyText>
                              ))}
                              {(() => {
                                const monthDate = parseIsoDate(slotCalendarMonth);
                                const year = monthDate.getUTCFullYear();
                                const month = monthDate.getUTCMonth();
                                const firstDowMon0 = (monthDate.getUTCDay() + 6) % 7;
                                const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                                const cells: React.ReactNode[] = [];
                                for (let i = 0; i < firstDowMon0; i++) cells.push(<Box key={`slot-pad-${i}`} sx={{ height: 28 }} />);
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                  const isPast = iso < todayIso;
                                  const selected = iso === selectedSlot.date && !isPast;
                                  cells.push(
                                    <ButtonBase
                                      key={iso}
                                      disabled={isPast}
                                      onClick={() => setSelectedSlot((p) => (p ? { ...p, date: iso } : p))}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "999px",
                                        display: "grid",
                                        placeItems: "center",
                                        justifySelf: "center",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: isPast ? alpha(m.navy, 0.24) : selected ? "#fff" : alpha(m.navy, 0.65),
                                        bgcolor: isPast ? "transparent" : selected ? m.teal : alpha(m.navy, 0.04),
                                        cursor: isPast ? "not-allowed" : "pointer",
                                        "&.Mui-disabled": {
                                          color: alpha(m.navy, 0.24),
                                          pointerEvents: "auto",
                                        },
                                        "&:hover": { bgcolor: isPast ? "transparent" : selected ? m.tealDark : alpha(m.navy, 0.05) },
                                      }}
                                    >
                                      {day}
                                    </ButtonBase>,
                                  );
                                }
                                return cells;
                              })()}
                            </Box>
                          </Box>
                        </Paper>
                      ) : null}
                    </Box>

                    {/* Client */}
                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Client
                      </BodyText>
                      {slotClientAdded ? (
                        <Box
                          sx={{
                            border: `1px solid ${alpha(m.navy, 0.12)}`,
                            borderRadius: "10px",
                            minHeight: 64,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            px: 1.5,
                            bgcolor: "#fff",
                            boxShadow: `0 0 0 6px ${alpha(m.teal, 0.08)}`,
                          }}
                        >
                          <Avatar src="/images/testimonial.webp" sx={{ width: 34, height: 34 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.2 }}>
                              Sara Johnson
                            </BodyText>
                            <BodyText sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.46), lineHeight: 1.2 }}>
                              Sarajohnson@gmail.com
                            </BodyText>
                          </Box>
                          <IconButton size="small" onClick={() => setSlotClientAdded(false)} sx={{ color: alpha(m.navy, 0.35) }}>
                            <CloseRoundedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => setSlotBookingScreen("add-client-choice")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSlotBookingScreen("add-client-choice");
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
                              fontSize: 18,
                              border: `1px solid ${alpha(m.teal, 0.22)}`,
                            }}
                          >
                            +
                          </Box>
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
                            Add Client
                          </BodyText>
                        </Box>
                      )}
                    </Box>

                    {slotClientAdded ? (
                      <>
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => setSlotBookingScreen("add-client-choice")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSlotBookingScreen("add-client-choice");
                          }}
                          sx={{
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            borderRadius: "10px",
                            height: 38,
                            width: 132,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.25,
                            cursor: "pointer",
                            bgcolor: "#fff",
                          }}
                        >
                          <Box sx={{ width: 22, height: 22, borderRadius: "999px", bgcolor: alpha(m.teal, 0.18), color: m.teal, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 900 }}>
                            +
                          </Box>
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.62), flex: 1 }}>
                            Add
                          </BodyText>
                          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
                        </Box>

                        <Box sx={{ borderRadius: "10px", bgcolor: alpha(m.navy, 0.025), p: 1.5 }}>
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.76), mb: 1 }}>
                            Location
                          </BodyText>
                          <Stack direction="row" spacing={4}>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.68) }}>
                              {slotLocation === "FL" ? "Fixed Location" : "Desired Location"}
                            </BodyText>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.42) }}>
                              St. Salon 123
                            </BodyText>
                          </Stack>
                        </Box>

                        <Box>
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
                            Contact Number
                          </BodyText>
                          <Stack direction="row" spacing={1}>
                            <AppDropdown
                              label=""
                              value=""
                              onChange={() => undefined}
                              options={[{ label: "Select Code", value: "" }, { label: "+44", value: "+44" }, { label: "+92", value: "+92" }]}
                              fullWidth
                              sx={{ maxWidth: 120 }}
                              placeholder="Select Code"
                            />
                            <AppTextField placeholder="+442xxxxxxxxxx" fullWidth />
                          </Stack>
                        </Box>

                        <Box sx={{ borderRadius: "10px", bgcolor: alpha(m.navy, 0.025), p: 1.5 }}>
                          <Button
                            variant="outlined"
                            startIcon={
                              <Box sx={{ width: 20, height: 20, borderRadius: "999px", bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.45), display: "grid", placeItems: "center", fontWeight: 900 }}>
                                +
                              </Box>
                            }
                            sx={{
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 800,
                              color: alpha(m.navy, 0.6),
                              borderColor: alpha(m.navy, 0.14),
                              bgcolor: "#fff",
                              minWidth: 112,
                            }}
                          >
                            Guest
                          </Button>
                        </Box>
                        <Box sx={{ flex: 1, minHeight: 40 }} />
                      </>
                    ) : (
                      <Box sx={{ flex: 1, minHeight: 360 }} />
                    )}
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
      <CalendarFiltersDrawer
        appliedFilters={appliedFilters}
        bookingTypes={bookingTypes}
        draftFilters={draftFilters}
        initialFilters={initialFilters}
        locations={locations}
        onApply={(nextFilters) => {
          setAppliedFilters(nextFilters);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
        resources={data.resources}
        setDraftFilters={setDraftFilters}
      />
      <CalendarBlockTimeModal
        availableLocations={data.supportedLocations}
        draft={blockDraft}
        onApply={async () => {
          if (!blockDraft.teamIds.length || !blockDraft.locations.length) {
            showSnackbar({ severity: "warning", message: "Select team member and location." });
            return;
          }
          try {
            for (const teamId of blockDraft.teamIds) {
              const teamMemberId = Number(teamId);
              for (const location of blockDraft.locations) {
                await onCreateCalendarEntry?.({
                  team_member_id: Number.isInteger(teamMemberId) ? teamMemberId : null,
                  status: "blocked",
                  title: blockDraft.title || "Blocked time",
                  blocked_time_start: toDateTimeInput(blockDraft.dateFrom, blockDraft.startTime),
                  blocked_time_end: toDateTimeInput(blockDraft.dateTo || blockDraft.dateFrom, blockDraft.endTime),
                  start_date: blockDraft.dateFrom,
                  end_date: blockDraft.dateTo || blockDraft.dateFrom,
                  location_type: locationToApi(location),
                  notes: `${blockDraft.dayFrom || ""}${blockDraft.dayTo ? ` - ${blockDraft.dayTo}` : ""}`.trim() || null,
                });
              }
            }
            showSnackbar({ severity: "success", message: "Blocked time added." });
            setBlockTimeOpen(false);
          } catch {
            showSnackbar({ severity: "error", message: "Unable to add blocked time." });
          }
        }}
        onClose={() => setBlockTimeOpen(false)}
        open={blockTimeOpen}
        resources={data.resources}
        setDraft={setBlockDraft}
        teamLabelById={teamLabelById}
      />
      <CalendarPublicBusinessHoursModal
        open={publicBusinessHoursOpen}
        onClose={() => setPublicBusinessHoursOpen(false)}
        onApply={async () => {
          try {
            await onSaveCalendarSettings?.({
              availability: {
                publicBusinessHours: publicBusinessHoursDraft,
              },
              design: appliedDesign,
            });
            showSnackbar({ severity: "success", message: "Public business hours saved." });
            setPublicBusinessHoursOpen(false);
          } catch {
            showSnackbar({ severity: "error", message: "Unable to save public business hours." });
          }
        }}
        draft={publicBusinessHoursDraft}
        setDraft={setPublicBusinessHoursDraft}
      />
      <CalendarDesignModal
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        onApply={async () => {
          try {
            setAppliedDesign(designDraft);
            await onSaveCalendarSettings?.({
              availability: {
                publicBusinessHours: publicBusinessHoursDraft,
              },
              design: designDraft,
            });
            showSnackbar({ severity: "success", message: "Design saved." });
            setDesignOpen(false);
          } catch {
            showSnackbar({ severity: "error", message: "Unable to save design." });
          }
        }}
        draft={designDraft}
        setDraft={setDesignDraft}
      />
    </Stack>
  );
}

