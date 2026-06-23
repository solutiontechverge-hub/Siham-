"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Avatar, Box, Button, ButtonBase, Chip, IconButton, Paper, Popover, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import { useSnackbar } from "./AppSnackbar";
import AppPillTabs from "./AppPillTabs";
import MollureDrawer from "./MollureDrawer";
import AppSearchField from "./AppSearchField";
import AppDatePicker from "./AppDatePicker";
import { AppCalendarPanel } from "./AppDatePicker";
import AppTextField from "./AppTextField";
import AppDropdown from "./AppDropdown";
import CalendarAddMenu from "./calendar/CalendarAddMenu";
import CalendarBookingCard from "./calendar/CalendarBookingCard";
import CalendarBlockTimeModal from "./calendar/CalendarBlockTimeModal";
import CalendarDesignModal, { type CalendarDesignDraft } from "./calendar/CalendarDesignModal";
import CalendarPublicBusinessHoursModal, {
  type PublicBusinessHoursDraft,
} from "./calendar/CalendarPublicBusinessHoursModal";
import CalendarFiltersDrawer from "./calendar/CalendarFiltersDrawer";
import CalendarSchedulePanel from "./calendar/CalendarSchedulePanel";
import CalendarHoursRulesPanel from "./calendar/CalendarHoursRulesPanel";
import CalendarEditAvailabilityModal, {
  type EditAvailabilityDraft,
} from "./calendar/CalendarEditAvailabilityModal";
import CalendarServiceOrderModal from "./calendar/CalendarServiceOrderModal";
import { useCalendarFilters } from "./calendar/useCalendarFilters";
import {
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityIntervals,
  makeScheduleRowId,
} from "./calendar/calendar-schedule.utils";
import {
  defaultBookingRules,
  type BookingRules,
  type ParsedCalendarSettings,
  type ScheduleAvailabilityRow,
  type ServiceOrderSettings,
} from "./calendar/calendar-settings.types";
import {
  addDaysIso,
  addMonthsIso,
  extractBookingId,
  fmtMinToTime,
  fmtTimeLabel,
  formatLongDateUtc,
  formatMdyDate,
  formatMonthYearUtc,
  buildBlocksFromDraft,
  type BlockTimeDraft,
  type Interval,
  mergeIntervals,
  minutesSinceMidnight,
  parseIsoDate,
  type SelectedSlot,
  startOfWeekIso,
  subtractIntervals,
  sumIntervalsMins,
  toMonthIso,
  toIsoLocalDate,
} from "./calendar/calendar.utils";
import type {
  CalendarBlock,
  CalendarBookingType,
  CalendarBookingLocation,
  CalendarEvent,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../app/professionals/fixed-location/calendar/calendar.data";
import type { CreateCalendarEntryRequest, UpsertCalendarSettingsRequest } from "../../store/services/businessApi";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  calendarSettings?: ParsedCalendarSettings | null;
  serviceOptions?: string[];
  serviceOrderDefaults?: ServiceOrderSettings;
  isSaving?: boolean;
  onCreateCalendarEntry?: (payload: CreateCalendarEntryRequest) => Promise<void>;
  onSaveCalendarSettings?: (payload: UpsertCalendarSettingsRequest) => Promise<void>;
  onDeleteCalendarEntry?: (id: string) => Promise<void>;
};

const toDateTimeInput = (date: string, time: string) => `${date}T${time}:00`;
const locationToApi = (location: CalendarBookingLocation) => (location === "DL" ? "desired" : "fixed");
const formatWeekDayName = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const formatWeekDayDate = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function ProfessionalFixedLocationCalendar({
  data,
  calendarSettings,
  serviceOptions = [],
  serviceOrderDefaults,
  isSaving = false,
  onCreateCalendarEntry,
  onSaveCalendarSettings,
  onDeleteCalendarEntry,
}: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [events, setEvents] = React.useState<readonly CalendarEvent[]>(() => [...data.events]);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

  React.useEffect(() => {
    setEvents([...data.events]);
  }, [data.events]);

  const [blocks, setBlocks] = React.useState<readonly CalendarBlock[]>(() => [...data.blocks]);
  React.useEffect(() => {
    setBlocks((prev) => {
      const apiKeys = new Set(data.blocks.map((block) => `${block.resourceId}-${block.date}-${block.start}-${block.end}`));
      const localBlocks = prev.filter(
        (block) => block.id.startsWith("blk-local-") && !apiKeys.has(`${block.resourceId}-${block.date}-${block.start}-${block.end}`),
      );
      return [...data.blocks, ...localBlocks];
    });
  }, [data.blocks]);

  const isViewingExisting = Boolean(editingEventId) && !isEditingExisting;
  const addMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const serviceCatalog = React.useMemo(
    () =>
      [
        { id: "svc-haircut", name: "Haircut", price: 60 },
        { id: "svc-color", name: "Hair Color", price: 95 },
        { id: "svc-styling", name: "Hair Styling", price: 45 },
        { id: "svc-facemask", name: "Face Mask", price: 35 },
      ] as const,
    [],
  );
  const productCatalog = React.useMemo(
    () =>
      [
        { id: "prd-hair", name: "Hair Product", price: 25 },
        { id: "prd-mask", name: "Face Mask", price: 18 },
        { id: "prd-serum", name: "Hair Serum", price: 22 },
      ] as const,
    [],
  );

  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>(data.initialView);
  const [activeDateIso, setActiveDateIso] = React.useState(data.initialDate || defaultDateIso);
  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const [teamActionAnchor, setTeamActionAnchor] = React.useState<HTMLElement | null>(null);
  const [datePickerAnchor, setDatePickerAnchor] = React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<"booking" | "sales" | "activity">("booking");
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>(data.supportedLocations[0] ?? "FL");
  const [slotBookingType, setSlotBookingType] = React.useState<CalendarBookingType>("Offline");
  const [slotStatus, setSlotStatus] = React.useState<"Confirmed" | "Requested" | "No Show" | "Completed" | "Cancelled">(
    "Confirmed",
  );
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotClientSearch, setSlotClientSearch] = React.useState("");
  const [slotAddMenuAnchor, setSlotAddMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [servicePickerOpen, setServicePickerOpen] = React.useState(false);
  const [productPickerOpen, setProductPickerOpen] = React.useState(false);
  const [selectedServiceId, setSelectedServiceId] = React.useState("");
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [selectedServices, setSelectedServices] = React.useState<Array<{ id: string; name: string; price: number }>>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<Array<{ id: string; name: string; price: number }>>([]);
  const [desiredLocationDraft, setDesiredLocationDraft] = React.useState<{
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  }>(() => ({
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  }));
  const [showPrepayment, setShowPrepayment] = React.useState(false);
  const [prepaymentPercent, setPrepaymentPercent] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"online" | "offline">("online");
  const [showKilometerAllowance, setShowKilometerAllowance] = React.useState(false);
  const [kilometerAllowanceDraft, setKilometerAllowanceDraft] = React.useState<{
    eurPerKm: string;
    totalKilometer: string;
  }>(() => ({
    eurPerKm: "",
    totalKilometer: "",
  }));
  React.useEffect(() => {
    // Kilometer allowance is only applicable for Desired Location bookings.
    if (slotLocation !== "DL") {
      setShowKilometerAllowance(false);
      setKilometerAllowanceDraft({ eurPerKm: "", totalKilometer: "" });
    }
  }, [slotLocation]);
  const [bookingMoreAnchor, setBookingMoreAnchor] = React.useState<HTMLElement | null>(null);
  const [slotBookingScreen, setSlotBookingScreen] = React.useState<
    | "new-booking"
    | "add-client-choice"
    | "non-mollure-individual"
    | "non-mollure-company"
    | "guest"
  >("new-booking");
  const [nonMollureClientType, setNonMollureClientType] = React.useState<"" | "individual" | "company">("");
  const [slotSaveAttempted, setSlotSaveAttempted] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<null | { name: string; email: string }>(null);
  const [addClientSource, setAddClientSource] = React.useState<
    "" | "client-list" | "mollure-platform" | "non-mollure" | "guest"
  >("");
  const [clientListSelectedEmail, setClientListSelectedEmail] = React.useState("");
  const [platformSelectedEmail, setPlatformSelectedEmail] = React.useState("");

  React.useEffect(() => {
    setSlotSaveAttempted(false);
  }, [slotBookingScreen]);

  React.useEffect(() => {
    if (slotBookingScreen !== "add-client-choice") return;
    setAddClientSource("");
  }, [slotBookingScreen]);

  const clientList = React.useMemo(
    () =>
      [
        { name: "Sara Johnson", email: "sarajohnson@gmail.com" },
        { name: "Emma Stone", email: "emma.stone@gmail.com" },
        { name: "Noah Parker", email: "noah.parker@gmail.com" },
        { name: "Priya Shah", email: "priya.shah@gmail.com" },
      ] as const,
    [],
  );
  const mollurePlatformClients = React.useMemo(
    () =>
      [
        { name: "Alex Morgan", email: "alex.morgan@mollure.com" },
        { name: "Yuki Tanaka", email: "yuki.tanaka@mollure.com" },
        { name: "Liam Roberts", email: "liam.roberts@mollure.com" },
        { name: "Ava Kim", email: "ava.kim@mollure.com" },
      ] as const,
    [],
  );

  const servicesTotal = React.useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);
  const productsTotal = React.useMemo(() => selectedProducts.reduce((sum, p) => sum + p.price, 0), [selectedProducts]);
  const totalPrice = servicesTotal + productsTotal;
  const prepaymentAmount = React.useMemo(() => {
    const pct = Number(prepaymentPercent);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return Math.round((totalPrice * pct) / 100);
  }, [prepaymentPercent, totalPrice]);
  const remainingAfterPrepayment = Math.max(0, totalPrice - prepaymentAmount);
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
    colorsByService: {},
  }));
  const [appliedDesign, setAppliedDesign] = React.useState<CalendarDesignDraft>(() => ({
    scope: "Categories",
    colorsByCategory: {},
    colorsByService: {},
  }));
  const [bookingRules, setBookingRules] = React.useState<BookingRules>(() => defaultBookingRules());
  const [scheduleRows, setScheduleRows] = React.useState<ScheduleAvailabilityRow[]>([]);
  const [dateOverrides, setDateOverrides] = React.useState<ParsedCalendarSettings["availability"]["dateOverrides"]>([]);
  const [serviceOrderDraft, setServiceOrderDraft] = React.useState<ServiceOrderSettings>(() => ({
    categories: serviceOrderDefaults?.categories ?? [],
    servicesByCategory: serviceOrderDefaults?.servicesByCategory ?? {},
  }));
  const [serviceOrderOpen, setServiceOrderOpen] = React.useState(false);
  const [scheduleResourceFilter, setScheduleResourceFilter] = React.useState<string[]>([]);
  const [editAvailabilityOpen, setEditAvailabilityOpen] = React.useState(false);
  const [editAvailabilityDraft, setEditAvailabilityDraft] = React.useState<EditAvailabilityDraft>(() => ({
    resourceId: "",
    date: "",
    locations: [...data.supportedLocations],
    shifts: [{ start: "09:00", end: "17:00" }],
  }));

  React.useEffect(() => {
    if (!calendarSettings) return;
    setBookingRules(calendarSettings.availability.bookingRules ?? defaultBookingRules());
    setScheduleRows(calendarSettings.availability.scheduleAvailability ?? []);
    setDateOverrides(calendarSettings.availability.dateOverrides ?? []);
    setAppliedDesign(calendarSettings.design);
    setDesignDraft(calendarSettings.design);
    if (calendarSettings.availability.serviceOrder) {
      setServiceOrderDraft(calendarSettings.availability.serviceOrder);
    } else if (serviceOrderDefaults) {
      setServiceOrderDraft(serviceOrderDefaults);
    }
  }, [calendarSettings, serviceOrderDefaults]);

  const persistAvailabilitySettings = React.useCallback(
    async (next: {
      bookingRules?: BookingRules;
      scheduleAvailability?: ScheduleAvailabilityRow[];
      dateOverrides?: ParsedCalendarSettings["availability"]["dateOverrides"];
      serviceOrder?: ServiceOrderSettings;
      publicBusinessHours?: PublicBusinessHoursDraft[];
    }) => {
      await onSaveCalendarSettings?.({
        availability: {
          bookingRules: next.bookingRules ?? bookingRules,
          scheduleAvailability: next.scheduleAvailability ?? scheduleRows,
          dateOverrides: next.dateOverrides ?? dateOverrides,
          serviceOrder: next.serviceOrder ?? serviceOrderDraft,
          publicBusinessHours: next.publicBusinessHours ?? calendarSettings?.availability.publicBusinessHours,
        },
        design: appliedDesign,
      });
    },
    [
      appliedDesign,
      bookingRules,
      calendarSettings?.availability.publicBusinessHours,
      dateOverrides,
      onSaveCalendarSettings,
      scheduleRows,
      serviceOrderDraft,
    ],
  );

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
  const resourceNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    data.resources.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [data.resources]);

  const grid = data.timeGrid;
  const { startMin, endMin } = React.useMemo(() => {
    const defaultStart = grid.startHour * 60;
    const defaultEnd = grid.endHour * 60;
    const step = grid.stepMinutes;
    const mins: number[] = [];
    for (const event of events) {
      mins.push(minutesSinceMidnight(event.start), minutesSinceMidnight(event.end));
    }
    for (const block of blocks) {
      mins.push(minutesSinceMidnight(block.start), minutesSinceMidnight(block.end));
    }
    if (!mins.length) {
      return { startMin: defaultStart, endMin: defaultEnd };
    }
    const minT = Math.min(defaultStart, ...mins);
    const maxT = Math.max(defaultEnd, ...mins);
    return {
      startMin: Math.floor(minT / step) * step,
      endMin: Math.ceil(maxT / step) * step,
    };
  }, [blocks, events, grid.endHour, grid.startHour, grid.stepMinutes]);
  const rows = Math.floor((endMin - startMin) / grid.stepMinutes) + 1;
  const rowPx = 78;
  const laneHeaderPx = 48;
  const timelineHeaderRows = viewMode === "week" ? 2 : 1;
  const timelineHeaderPx = laneHeaderPx * timelineHeaderRows;

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

  React.useEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId("");
      return;
    }
    const stillValid = filteredResources.some((r) => r.id === selectedResourceId);
    if (!stillValid) {
      setSelectedResourceId(filteredResources[0].id);
    }
  }, [filteredResources, selectedResourceId]);

  const activeResource = React.useMemo(
    () => filteredResources.find((r) => r.id === selectedResourceId) ?? filteredResources[0],
    [filteredResources, selectedResourceId],
  );
  const displayedResources = React.useMemo(() => {
    if (viewMode === "week") return activeResource ? [activeResource] : [];
    if (viewMode === "day") {
      if (appliedFilters.teamAll) return filteredResources;
      return activeResource ? [activeResource] : [];
    }
    return filteredResources;
  }, [activeResource, appliedFilters.teamAll, filteredResources, viewMode]);

  const eventsInRange = React.useMemo(
    () => {
      const base = events.filter((e) => visibleDates.includes(e.date));
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
      events,
      visibleDates,
    ],
  );
  const todayIso = defaultDateIso;
  const [nowMin, setNowMin] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowMin(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const showNowLine = activeDateIso === todayIso && nowMin >= startMin && nowMin <= endMin;
  const nowLineTop = ((nowMin - startMin) / grid.stepMinutes) * rowPx;
  const activeMonthIso = React.useMemo(() => toMonthIso(activeDateIso), [activeDateIso]);
  const monthEvents = React.useMemo(
    () => {
      const base = events.filter((e) => toMonthIso(e.date) === activeMonthIso);
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
      activeMonthIso,
      appliedFilters.booking,
      appliedFilters.bookingAll,
      appliedFilters.locationAll,
      appliedFilters.locations,
      appliedFilters.teamAll,
      appliedFilters.teamIds,
      events,
    ],
  );
  const monthCells = React.useMemo(() => {
    const first = parseIsoDate(activeMonthIso);
    const year = first.getUTCFullYear();
    const monthIndex = first.getUTCMonth();
    const gridStartIso = startOfWeekIso(activeMonthIso);

    return Array.from({ length: 42 }, (_, idx) => {
      const iso = addDaysIso(gridStartIso, idx);
      const dayDate = parseIsoDate(iso);
      const inMonth = dayDate.getUTCMonth() === monthIndex;
      const dayEvents = monthEvents
        .filter((event) => event.date === iso)
        .sort((a, b) => `${a.start}-${a.resourceId}`.localeCompare(`${b.start}-${b.resourceId}`));

      return {
        iso,
        dateNumber: dayDate.getUTCDate(),
        inMonth,
        isToday: iso === todayIso,
        isSelected: iso === activeDateIso,
        isPast: iso < todayIso,
        dayEvents,
        hiddenCount: Math.max(0, dayEvents.length - 3),
      };
    });
  }, [activeDateIso, activeMonthIso, monthEvents, todayIso]);
  const blocksInRange = React.useMemo(
    () => {
      const base = blocks.filter((b) => visibleDates.includes(b.date));
      if (appliedFilters.teamAll) return base;
      return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
    },
    [appliedFilters.teamAll, appliedFilters.teamIds, blocks, visibleDates],
  );

  const slotValidation = React.useMemo(() => {
    const isBlank = (v: string) => v.trim().length === 0;

    const errors: Partial<
      Record<
        | "nonMollureClientType"
        | "guestFirstName"
        | "guestLastName"
        | "nonMollureFirstName"
        | "nonMollureLastName"
        | "nonMollureGender"
        | "nonMollureDob"
        | "nonMollurePhoneCode"
        | "nonMollurePhoneNumber"
        | "nonMollureEmail"
        | "nonMollureLegalName"
        | "nonMollureCoc"
        | "nonMollureVat"
        | "nonMollureContactFirstName"
        | "nonMollureContactLastName"
        | "nonMollureStreet"
        | "nonMollureStreetNumber"
        | "nonMollurePostalCode"
        | "nonMollureProvince"
        | "nonMollureMunicipality"
        | "bookingClient",
        string
      >
    > = {};

    let isValid = true;

    if (slotDrawerTab !== "booking") {
      return { isValid: true as const, errors };
    }

    if (slotBookingScreen === "add-client-choice") {
      return { isValid: false as const, errors };
    }

    if (slotBookingScreen === "guest") {
      if (isBlank(guestDraft.firstName)) {
        isValid = false;
        errors.guestFirstName = "First name is required.";
      }
      if (isBlank(guestDraft.lastName)) {
        isValid = false;
        errors.guestLastName = "Last name is required.";
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "non-mollure-individual") {
      if (isBlank(nonMollureDraft.firstName)) {
        isValid = false;
        errors.nonMollureFirstName = "First name is required.";
      }
      if (isBlank(nonMollureDraft.lastName)) {
        isValid = false;
        errors.nonMollureLastName = "Last name is required.";
      }
      if (!nonMollureDraft.gender) {
        isValid = false;
        errors.nonMollureGender = "Gender is required.";
      }
      if (isBlank(nonMollureDraft.dob)) {
        isValid = false;
        errors.nonMollureDob = "Date of birth is required.";
      }
      if (isBlank(nonMollureDraft.phoneCode)) {
        isValid = false;
        errors.nonMollurePhoneCode = "Country code is required.";
      }
      if (isBlank(nonMollureDraft.phoneNumber)) {
        isValid = false;
        errors.nonMollurePhoneNumber = "Phone number is required.";
      }
      if (isBlank(nonMollureDraft.email)) {
        isValid = false;
        errors.nonMollureEmail = "Email is required.";
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "non-mollure-company") {
      if (isBlank(nonMollureDraft.legalName)) {
        isValid = false;
        errors.nonMollureLegalName = "Legal name is required.";
      }
      if (isBlank(nonMollureDraft.coc)) {
        isValid = false;
        errors.nonMollureCoc = "COC is required.";
      }
      if (isBlank(nonMollureDraft.vat)) {
        isValid = false;
        errors.nonMollureVat = "VAT is required.";
      }
      if (isBlank(nonMollureDraft.contactFirstName)) {
        isValid = false;
        errors.nonMollureContactFirstName = "Contact first name is required.";
      }
      if (isBlank(nonMollureDraft.contactLastName)) {
        isValid = false;
        errors.nonMollureContactLastName = "Contact last name is required.";
      }
      if (!nonMollureDraft.gender) {
        isValid = false;
        errors.nonMollureGender = "Gender is required.";
      }
      if (isBlank(nonMollureDraft.street)) {
        isValid = false;
        errors.nonMollureStreet = "Street is required.";
      }
      if (isBlank(nonMollureDraft.streetNumber)) {
        isValid = false;
        errors.nonMollureStreetNumber = "Number is required.";
      }
      if (isBlank(nonMollureDraft.postalCode)) {
        isValid = false;
        errors.nonMollurePostalCode = "Postal code is required.";
      }
      if (isBlank(nonMollureDraft.province)) {
        isValid = false;
        errors.nonMollureProvince = "Province is required.";
      }
      if (isBlank(nonMollureDraft.municipality)) {
        isValid = false;
        errors.nonMollureMunicipality = "Municipality is required.";
      }
      if (isBlank(nonMollureDraft.email)) {
        isValid = false;
        errors.nonMollureEmail = "Email is required.";
      }
      return { isValid, errors };
    }

    // new-booking
    if (!slotClientAdded) {
      isValid = false;
      errors.bookingClient = "Client is required.";
    }
    if (selectedServices.length === 0 && selectedProducts.length === 0) {
      isValid = false;
      errors.bookingClient = errors.bookingClient ?? "Select at least one item/service or product.";
    }
    return { isValid, errors };
  }, [
    guestDraft.firstName,
    guestDraft.lastName,
    nonMollureClientType,
    nonMollureDraft,
    selectedProducts.length,
    selectedServices.length,
    slotBookingScreen,
    slotClientAdded,
    slotDrawerTab,
  ]);

  const slotErrors = React.useMemo(() => (slotSaveAttempted ? slotValidation.errors : {}), [slotSaveAttempted, slotValidation.errors]);

  const prevCandidateIso = React.useMemo(() => {
    if (viewMode === "week") return addDaysIso(activeDateIso, -7);
    if (viewMode === "month") return addMonthsIso(activeMonthIso, -1);
    return addDaysIso(activeDateIso, -1);
  }, [activeDateIso, activeMonthIso, viewMode]);

  const canGoPrev = prevCandidateIso >= todayIso;

  const onToday = () => {
    setActiveDateIso(todayIso);
    setViewMode("day");
    setSelectedResourceId("");
  };

  const onPrev = () => {
    setActiveDateIso(canGoPrev ? prevCandidateIso : todayIso);
  };

  const onNext = () => {
    if (viewMode === "week") setActiveDateIso(addDaysIso(activeDateIso, 7));
    else if (viewMode === "month") setActiveDateIso(addMonthsIso(activeMonthIso, 1));
    else setActiveDateIso(addDaysIso(activeDateIso, 1));
  };

  const getAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const fromSchedule = getCombinedAvailabilityIntervals(resourceId, iso, scheduleRows, dateOverrides ?? []);
      if (fromSchedule.length) return fromSchedule;

      const av = data.availability.find((a) => a.resourceId === resourceId);
      if (!av) return [];
      const dow = parseIsoDate(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const windows = av.weekly[dow] ?? [];
      return windows.map((w) => ({ startMin: minutesSinceMidnight(w.start), endMin: minutesSinceMidnight(w.end) }));
    },
    [data.availability, dateOverrides, scheduleRows],
  );

  const getLocationAvailability = React.useCallback(
    (resourceId: string, iso: string, location: CalendarBookingLocation): Interval[] => {
      const fromSchedule = getLocationAvailabilityIntervals(resourceId, iso, location, scheduleRows, dateOverrides ?? []);
      if (fromSchedule.length) return fromSchedule;
      return getAvailabilityFor(resourceId, iso);
    },
    [dateOverrides, getAvailabilityFor, scheduleRows],
  );

  const getBusyFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const busy: Interval[] = [];
      for (const e of events) {
        if (e.resourceId !== resourceId || e.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(e.start), endMin: minutesSinceMidnight(e.end) });
      }
      for (const b of blocks) {
        if (b.resourceId !== resourceId || b.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(b.start), endMin: minutesSinceMidnight(b.end) });
      }
      return busy;
    },
    [blocks, events],
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

  const renderTeamCapacityBar = (resourceId: string) => {
    const bookedPct = Math.round(getDailyBookingRatio(resourceId, activeDateIso) * 100);
    return (
      <Box
        sx={{
          mt: 0.35,
          height: 3,
          width: 76,
          borderRadius: "999px",
          bgcolor: m.fxGrayF2F4F7,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${bookedPct}%`,
            bgcolor: m.teal,
            borderRadius: "999px",
            transition: "width 0.2s ease",
          }}
        />
      </Box>
    );
  };

  const renderTeamMemberHeader = (laneResource?: (typeof filteredResources)[number]) => {
    const headerResources =
      viewMode === "day" && appliedFilters.teamAll && laneResource ? [laneResource] : filteredResources;

    return (
    <>
      <Box
        sx={{
          minHeight: laneHeaderPx,
          display: "flex",
          alignItems: "center",
          px: 1.5,
          gap: 2.5,
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
          overflowX: "auto",
          flexWrap: "nowrap",
        }}
      >
        {headerResources.map((resource) => {
          const isActive = resource.id === activeResource?.id;
          const teamAvatarSx = {
            width: 22,
            height: 22,
            bgcolor: alpha(m.teal, 0.14),
            color: m.teal,
            fontWeight: 700,
            fontSize: 9.5,
            flexShrink: 0,
          };
          const teamNameSx = {
            fontWeight: 600,
            fontSize: 11.5,
            color: alpha(m.navy, 0.78),
            lineHeight: 1.2,
            whiteSpace: "nowrap" as const,
          };

          if (isActive) {
            return (
              <Box
                key={resource.id}
                role="button"
                tabIndex={0}
                onClick={(e) => setTeamActionAnchor(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setTeamActionAnchor(e.currentTarget);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.65,
                  px: 1.15,
                  py: 0.5,
                  borderRadius: "999px",
                  bgcolor: alpha(m.navy, 0.04),
                  cursor: "pointer",
                  flexShrink: 0,
                  "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                }}
              >
                <Avatar sx={teamAvatarSx}>{resource.avatarText}</Avatar>
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.2} sx={{ minWidth: 0 }}>
                    <BodyText sx={teamNameSx}>{resource.name}</BodyText>
                    <KeyboardArrowDownRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.45), flexShrink: 0 }} />
                  </Stack>
                  {renderTeamCapacityBar(resource.id)}
                </Box>
              </Box>
            );
          }

          return (
            <ButtonBase
              key={resource.id}
              onClick={() => setSelectedResourceId(resource.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.65,
                flexShrink: 0,
                borderRadius: "4px",
                px: 0.25,
                py: 0.35,
              }}
            >
              <Avatar sx={teamAvatarSx}>{resource.avatarText}</Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, alignItems: "flex-start" }}>
                <BodyText sx={teamNameSx}>{resource.name}</BodyText>
                {renderTeamCapacityBar(resource.id)}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
      <Popover
        open={Boolean(teamActionAnchor)}
        anchorEl={teamActionAnchor}
        onClose={() => setTeamActionAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 0.75,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 8px 24px rgba(16, 35, 63, 0.12)",
            minWidth: 200,
            py: 0.75,
            px: 0.5,
          },
        }}
      >
        <ButtonBase
          onClick={() => {
            setTeamActionAnchor(null);
            showSnackbar({ severity: "info", message: "Client profile panel opened." });
          }}
          sx={{ width: "100%", px: 1, py: 0.75, justifyContent: "flex-start", borderRadius: "8px" }}
        >
          <BodyText sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>View profile</BodyText>
        </ButtonBase>
        <ButtonBase
          disabled={viewMode !== "day"}
          onClick={() => {
            if (!activeResource) return;
            const shifts =
              getCombinedAvailabilityIntervals(activeResource.id, activeDateIso, scheduleRows, dateOverrides ?? []).length > 0
                ? getCombinedAvailabilityIntervals(activeResource.id, activeDateIso, scheduleRows, dateOverrides ?? []).map((interval) => ({
                    start: fmtMinToTime(interval.startMin),
                    end: fmtMinToTime(interval.endMin),
                  }))
                : [{ start: "09:00", end: "17:00" }];
            setEditAvailabilityDraft({
              resourceId: activeResource.id,
              date: activeDateIso,
              locations: [...data.supportedLocations],
              shifts,
            });
            setEditAvailabilityOpen(true);
            setTeamActionAnchor(null);
          }}
          sx={{ width: "100%", px: 1, py: 0.75, justifyContent: "flex-start", borderRadius: "8px", opacity: viewMode !== "day" ? 0.5 : 1 }}
        >
          <BodyText sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>Edit availability</BodyText>
        </ButtonBase>
        <Box sx={{ my: 0.5, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }} />
        {filteredResources.map((resource) => {
          const isActive = resource.id === activeResource?.id;
          return (
            <ButtonBase
              key={resource.id}
              onClick={() => {
                setSelectedResourceId(resource.id);
                setTeamActionAnchor(null);
              }}
              sx={{
                width: "100%",
                px: 1,
                py: 0.65,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                justifyContent: "flex-start",
                borderRadius: "8px",
                bgcolor: isActive ? alpha(m.teal, 0.06) : "transparent",
                "&:hover": { bgcolor: alpha(m.teal, 0.04) },
              }}
            >
              <Avatar
                sx={{
                  width: 22,
                  height: 22,
                  bgcolor: alpha(m.teal, 0.14),
                  color: m.teal,
                  fontWeight: 700,
                  fontSize: 9.5,
                }}
              >
                {resource.avatarText}
              </Avatar>
              {isActive ? (
                <BodyText sx={{ fontWeight: 600, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>{resource.name}</BodyText>
              ) : (
                <Box sx={{ borderBottom: `1px solid ${alpha(m.navy, 0.2)}`, pb: 0.15 }}>
                  <BodyText sx={{ fontWeight: 600, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>{resource.name}</BodyText>
                </Box>
              )}
            </ButtonBase>
          );
        })}
      </Popover>
    </>
    );
  };

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot) => {
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation("FL");
      setSlotClientAdded(false);
      setSelectedClient(null);
      setSelectedServices([]);
      setSelectedProducts([]);
      setEditingEventId(null);
      setIsEditingExisting(false);
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

  const openExistingBooking = React.useCallback(
    (ev: CalendarEvent) => {
      setSelectedSlot({
        resourceId: ev.resourceId,
        date: ev.date,
        start: ev.start,
        end: ev.end,
        freeStart: ev.start,
        freeEnd: ev.end,
      });
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation(ev.location);
      setSlotClientAdded(true);
      setSelectedClient({ name: ev.showClientName ?? "Client", email: "" });
      setSelectedServices([]);
      setSelectedProducts([]);
      setEditingEventId(ev.id);
      setIsEditingExisting(false);
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
      const teamMemberId = selectedSlot.resourceId?.trim() || null;
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
          team_member_id: teamMemberId,
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
    <Stack
      spacing={1.5}
      sx={{
        bgcolor: alpha(m.teal, 0.12),
        px: { xs: 1.25, md: 3 },
        py: { xs: 1.5, md: 2.5 },
        borderRadius: "2px",
      }}
    >
      <AppPillTabs
        tabs={data.subTabs.map((label) => ({ label }))}
        active={activeSubTab}
        onChange={(next) => setActiveSubTab(next as CalendarSubTab)}
        alignStart={false}
      />

      {activeSubTab === "Overview" ? (
      <Paper
        elevation={0}
        sx={{
          borderRadius: "2px",
          border: 0,
          boxShadow: "none",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Box sx={{ px: 2, py: 1.25, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <IconButton
                size="small"
                onClick={onPrev}
                disabled={!canGoPrev}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "5px",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  color: alpha(m.navy, 0.6),
                  bgcolor: "#fff",
                }}
              >
                <ChevronLeftRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>

              <Button
                variant="outlined"
                startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setDatePickerAnchor(e.currentTarget)}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 10.5,
                  borderColor: alpha(m.navy, 0.12),
                  color: alpha(m.navy, 0.78),
                  bgcolor: "#fff",
                  height: 24,
                  px: 1,
                  "& .MuiButton-startIcon": { mr: 0.45 },
                }}
              >
                {viewMode === "month" ? formatMonthYearUtc(activeMonthIso) : formatLongDateUtc(activeDateIso)}
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
                    borderRadius: "14px",
                    border: `1px solid ${alpha(m.navy, 0.10)}`,
                    boxShadow: "0 16px 40px rgba(16, 35, 63, 0.13)",
                    overflow: "hidden",
                    bgcolor: "#fff",
                  },
                }}
              >
                <AppCalendarPanel
                  value={activeDateIso}
                  onChange={setActiveDateIso}
                  min={todayIso}
                  onDaySelect={() => setDatePickerAnchor(null)}
                />
              </Popover>

              <IconButton
                size="small"
                onClick={onNext}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "5px",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  color: alpha(m.navy, 0.6),
                  bgcolor: "#fff",
                }}
              >
                <ChevronRightRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="outlined"
              onClick={onToday}
              sx={{
                borderRadius: "5px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 10.5,
                borderColor: alpha(m.navy, 0.12),
                color: alpha(m.navy, 0.78),
                bgcolor: "#fff",
                height: 24,
                px: 1,
              }}
            >
              Today
            </Button>

            <Box
              sx={{
                display: "flex",
                borderRadius: "5px",
                overflow: "hidden",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
              }}
            >
              {(["day", "week"] as const).map((v) => {
                const active = v === viewMode;
                return (
                  <Button
                    key={v}
                    onClick={() => {
                      setViewMode(v);
                      if (v === "day") setSelectedResourceId("");
                    }}
                    sx={{
                      borderRadius: 0,
                      minWidth: 38,
                      height: 22,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 10.5,
                      bgcolor: active ? alpha(m.teal, 0.08) : "#fff",
                      color: alpha(m.navy, 0.78),
                    }}
                  >
                    {v === "day" ? "Day" : "Week"}
                  </Button>
                );
              })}
            </Box>

            <Button
              variant="outlined"
              startIcon={<FilterListRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setFiltersOpen(true)}
              sx={{
                borderRadius: "5px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 10.5,
                borderColor: alpha(m.navy, 0.12),
                color: alpha(m.navy, 0.78),
                bgcolor: "#fff",
                height: 24,
                px: 1,
                "& .MuiButton-startIcon": { mr: 0.45 },
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
                borderRadius: "5px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 10.5,
                height: 24,
                px: 1.1,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              Add
            </Button>
            <CalendarAddMenu
              anchorEl={addAnchor}
              onBlockedTime={() => {
                setBlockDraft((prev) => ({
                  ...prev,
                  dateFrom: activeDateIso,
                  dateTo: activeDateIso,
                  teamIds: activeResource ? [activeResource.id] : prev.teamIds,
                }));
                setBlockTimeOpen(true);
              }}
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
        <Box sx={{ px: 2, pb: 2, bgcolor: "#fff" }}>
          {viewMode === "month" ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "6px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(118px, 1fr))",
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: alpha(m.navy, 0.02),
                }}
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <Box
                    key={day}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderLeft: day !== "Mon" ? `1px solid ${alpha(m.navy, 0.07)}` : undefined,
                    }}
                  >
                    <BodyText sx={{ fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.58), lineHeight: 1 }}>
                      {day}
                    </BodyText>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(118px, 1fr))" }}>
                {monthCells.map((cell, idx) => {
                  const hasBookings = cell.dayEvents.length > 0;

                  return (
                    <ButtonBase
                      key={cell.iso}
                      onClick={() => {
                        setActiveDateIso(cell.iso);
                        setSelectedResourceId("");
                        setViewMode("day");
                      }}
                      sx={{
                        minHeight: 132,
                        alignItems: "stretch",
                        justifyContent: "stretch",
                        textAlign: "left",
                        borderLeft: idx % 7 === 0 ? undefined : `1px solid ${alpha(m.navy, 0.07)}`,
                        borderTop: idx < 7 ? undefined : `1px solid ${alpha(m.navy, 0.07)}`,
                        bgcolor: cell.isSelected
                          ? alpha(m.teal, 0.055)
                          : cell.inMonth
                            ? "#fff"
                            : alpha(m.navy, 0.018),
                        opacity: cell.isPast ? 0.66 : cell.inMonth ? 1 : 0.72,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: hasBookings ? alpha(m.teal, 0.045) : alpha(m.navy, 0.025),
                        },
                      }}
                    >
                      <Box sx={{ width: "100%", minWidth: 0, p: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "999px",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                              fontWeight: 900,
                              color: cell.isToday ? "#fff" : alpha(m.navy, cell.inMonth ? 0.82 : 0.42),
                              bgcolor: cell.isToday ? m.teal : "transparent",
                              border: cell.isSelected && !cell.isToday ? `1px solid ${alpha(m.teal, 0.45)}` : "1px solid transparent",
                            }}
                          >
                            {cell.dateNumber}
                          </Box>
                          {hasBookings ? (
                            <Chip
                              size="small"
                              label={`${cell.dayEvents.length} booking${cell.dayEvents.length === 1 ? "" : "s"}`}
                              sx={{
                                height: 20,
                                borderRadius: "999px",
                                fontSize: 9.5,
                                fontWeight: 900,
                                color: m.tealDark,
                                bgcolor: alpha(m.teal, 0.1),
                                border: `1px solid ${alpha(m.teal, 0.18)}`,
                                "& .MuiChip-label": { px: 0.85 },
                              }}
                            />
                          ) : null}
                        </Stack>

                        <Stack spacing={0.45} sx={{ minWidth: 0 }}>
                          {cell.dayEvents.slice(0, 3).map((event) => {
                            const resourceName = resourceNameById.get(event.resourceId) ?? "Team member";
                            const eventAccent =
                              event.status === "Requested"
                                ? "#F4A100"
                                : event.status === "Cancelled"
                                  ? "#EF4444"
                                  : event.status === "Confirmed"
                                    ? "#22B573"
                                    : "#74839A";

                            return (
                              <Box
                                key={event.id}
                                sx={{
                                  minWidth: 0,
                                  borderRadius: "4px",
                                  border: `1px solid ${alpha(eventAccent, 0.2)}`,
                                  borderLeft: `3px solid ${eventAccent}`,
                                  bgcolor: alpha(eventAccent, 0.055),
                                  px: 0.75,
                                  py: 0.55,
                                }}
                              >
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                  <BodyText
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.78),
                                      lineHeight: 1,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {event.start}
                                  </BodyText>
                                  <Chip
                                    size="small"
                                    label={event.location}
                                    sx={{
                                      height: 15,
                                      borderRadius: "4px",
                                      fontSize: 8,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.65),
                                      bgcolor: alpha("#fff", 0.72),
                                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                                      "& .MuiChip-label": { px: 0.55 },
                                    }}
                                  />
                                </Stack>
                                <BodyText
                                  sx={{
                                    mt: 0.25,
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    color: alpha(m.navy, 0.8),
                                    lineHeight: 1.15,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {event.title}
                                </BodyText>
                                <BodyText
                                  sx={{
                                    mt: 0.2,
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.54),
                                    lineHeight: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {resourceName} - ID: {extractBookingId(event.id)}
                                </BodyText>
                              </Box>
                            );
                          })}
                          {cell.hiddenCount > 0 ? (
                            <BodyText sx={{ fontSize: 10.5, fontWeight: 900, color: alpha(m.tealDark, 0.9), px: 0.3 }}>
                              +{cell.hiddenCount} more
                            </BodyText>
                          ) : null}
                        </Stack>
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Paper>
          ) : (
            <Box
              sx={{
                borderRadius: "1px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "48px 1fr", bgcolor: m.fxSurface, position: "relative" }}>
                {showNowLine ? (
                  <>
                    <Box
                      sx={{
                        position: "absolute",
                        left: 36,
                        top: timelineHeaderPx + nowLineTop - 4,
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        bgcolor: "#FF2F64",
                        border: "1px solid #fff",
                        zIndex: 6,
                        pointerEvents: "none",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        left: 48,
                        right: 0,
                        top: timelineHeaderPx + nowLineTop,
                        height: 2,
                        bgcolor: "#FF2F64",
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    />
                  </>
                ) : null}
                {/* Time column */}
                <Box sx={{ bgcolor: "#fff" }}>
                  <Box sx={{ height: timelineHeaderPx, borderBottom: `1px solid ${alpha(m.navy, 0.07)}` }} />
                  {slotLines.map((t, idx) => (
                    <Box
                      key={t}
                      sx={{
                        height: rowPx,
                        px: 0.45,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        pt: idx === 0 ? 1.15 : 1,
                        borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                      }}
                    >
                      <BodyText sx={{ fontSize: 9.5, fontWeight: 600, color: alpha(m.navy, 0.58), lineHeight: 1 }}>
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
                    const laneColumns = viewMode === "day"
                      ? [{ key: res.id, resource: res, date: activeDateIso }]
                      : laneDates.map((date) => ({ key: date, resource: res, date }));
                    return (
                      <Box
                        key={res.id}
                        sx={{
                          borderTop: laneIdx > 0 ? `1px solid ${alpha(m.navy, 0.08)}` : undefined,
                        }}
                      >
                        {/* Lane header */}
                        {renderTeamMemberHeader(res)}
                        {viewMode === "week" ? (
                          <Box
                            sx={{
                              height: laneHeaderPx,
                              display: "grid",
                              gridTemplateColumns: "repeat(7, minmax(110px, 1fr))",
                              bgcolor: "#fff",
                              borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                              overflow: "hidden",
                            }}
                          >
                            {laneDates.map((date, colIdx) => {
                              const isActiveDay = date === activeDateIso;
                              const ratio = Math.round(getDailyBookingRatio(res.id, date) * 100);

                              return (
                                <Box
                                  key={`week-day-${date}`}
                                  sx={{
                                    minWidth: 110,
                                    px: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "column",
                                    borderLeft: colIdx > 0 ? `1px solid ${alpha(m.navy, 0.07)}` : undefined,
                                    bgcolor: isActiveDay ? alpha(m.teal, 0.035) : "#fff",
                                  }}
                                >
                                  <BodyText sx={{ fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                                    {formatWeekDayName(date)}
                                  </BodyText>
                                  <BodyText sx={{ mt: 0.3, fontSize: 10, fontWeight: 700, color: alpha(m.navy, 0.5), lineHeight: 1 }}>
                                    {formatWeekDayDate(date)}
                                  </BodyText>
                                  <Box
                                    sx={{
                                      mt: 0.45,
                                      height: 3,
                                      width: 58,
                                      borderRadius: "999px",
                                      bgcolor: m.fxGrayF2F4F7,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Box sx={{ height: "100%", width: `${ratio}%`, bgcolor: isActiveDay ? m.teal : alpha(m.navy, 0.24) }} />
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        ) : null}

                        {/* Lane body */}
                        <Box
                          sx={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: viewMode === "week" ? "repeat(7, 1fr)" : "1fr",
                            bgcolor: "#fff",
                          }}
                        >
                          {laneColumns.map(({ key, resource, date }, colIdx) => {
                            const laneEvents = eventsInRange.filter((e) => e.resourceId === resource.id && e.date === date);
                            const laneBlocks = blocksInRange.filter((b) => b.resourceId === resource.id && b.date === date);

                            // Unavailable overlay (everything outside availability windows)
                            const availability = getAvailabilityFor(resource.id, date);

                            return (
                              <Box
                                key={key}
                                sx={{
                                  position: "relative",
                                  borderLeft: colIdx > 0 ? `1px solid ${alpha(m.navy, 0.07)}` : undefined,
                                  height: rows * rowPx,
                                  bgcolor: "#fff",
                                }}
                              >
                                {/* Click layer */}
                                <Box
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    const minutes = startMin + Math.floor(y / rowPx) * grid.stepMinutes;
                                    onEmptyClick(resource.id, date, minutes);
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
                                          bgcolor: "#fff",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Box sx={{ position: "absolute", inset: 0, bgcolor: "#fff", pointerEvents: "none" }} />
                                )}

                                {data.supportedLocations.map((location) => {
                                  const locationIntervals = getLocationAvailability(resource.id, date, location);
                                  return locationIntervals.map((interval, intervalIdx) => {
                                    const top = ((interval.startMin - startMin) / grid.stepMinutes) * rowPx;
                                    const height = ((interval.endMin - interval.startMin) / grid.stepMinutes) * rowPx;
                                    const flOnly = location === "FL";
                                    const dlOnly = location === "DL";
                                    const tooltipTitle = flOnly
                                      ? "FL Availability: Available for booking at a fixed location."
                                      : "DL Availability: Available for booking at a desired location.";

                                    return (
                                      <Tooltip key={`${location}-${intervalIdx}`} title={tooltipTitle} placement="top">
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top,
                                            height,
                                            pointerEvents: "none",
                                            zIndex: 1,
                                            bgcolor: flOnly ? "#fff" : alpha(m.fxMintTint, 0.65),
                                            backgroundImage: dlOnly
                                              ? "repeating-linear-gradient(135deg, rgba(20,156,167,0.05) 0 6px, transparent 6px 12px)"
                                              : undefined,
                                            borderLeft: dlOnly ? `2px solid ${alpha(m.teal, 0.18)}` : undefined,
                                          }}
                                        />
                                      </Tooltip>
                                    );
                                  });
                                })}

                                {/* Horizontal grid lines */}
                                {slotLines.map((t) => (
                                  <Box
                                    key={`line-${resource.id}-${date}-${t}`}
                                    sx={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      top: ((t - startMin) / grid.stepMinutes) * rowPx,
                                      height: 1,
                                      bgcolor: alpha(m.navy, 0.065),
                                      pointerEvents: "none",
                                    }}
                                  />
                                ))}

                                {/* Blocks */}
                                {laneBlocks.map((b) => {
                                  const top = ((minutesSinceMidnight(b.start) - startMin) / grid.stepMinutes) * rowPx;
                                  const height = Math.max(
                                    2,
                                    ((minutesSinceMidnight(b.end) - minutesSinceMidnight(b.start)) / grid.stepMinutes) * rowPx,
                                  );
                                  const isBlockedTime = b.kind === "unavailable";

                                  if (isBlockedTime) {
                                    return (
                                      <Box
                                        key={b.id}
                                        sx={{
                                          position: "absolute",
                                          left: 0,
                                          right: 0,
                                          top,
                                          height,
                                          pointerEvents: "none",
                                          zIndex: 3,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            height: 2,
                                            bgcolor: "#FF2F64",
                                          }}
                                        />
                                        {height > 2 ? (
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              left: 0,
                                              right: 0,
                                              top: 0,
                                              height,
                                              bgcolor: alpha("#FF2F64", 0.05),
                                            }}
                                          />
                                        ) : null}
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            left: -4,
                                            top: -3,
                                            width: 8,
                                            height: 8,
                                            borderRadius: "999px",
                                            bgcolor: "#FF2F64",
                                            border: "1px solid #fff",
                                            zIndex: 4,
                                          }}
                                        />
                                        {height >= 40 ? (
                                          <Box sx={{ position: "absolute", left: 8, top: 6, pointerEvents: "none" }}>
                                            <BodyText sx={{ fontWeight: 900, fontSize: 10, color: alpha(m.navy, 0.62), lineHeight: 1.1 }}>
                                              {b.start} to {b.end}
                                            </BodyText>
                                            <BodyText sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.58), lineHeight: 1.1 }}>
                                              {b.title}
                                            </BodyText>
                                          </Box>
                                        ) : null}
                                      </Box>
                                    );
                                  }

                                  return (
                                    <Box
                                      key={b.id}
                                      sx={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        top,
                                        height,
                                        borderRadius: 0,
                                        bgcolor: alpha(m.navy, 0.03),
                                        borderTop: `1px solid ${alpha(m.navy, 0.12)}`,
                                        borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                                        px: 1.2,
                                        py: 0.55,
                                        pointerEvents: "none",
                                        zIndex: 2,
                                      }}
                                    >
                                      {height >= 34 ? (
                                        <>
                                          <BodyText sx={{ fontWeight: 900, fontSize: 10, color: alpha(m.navy, 0.62), lineHeight: 1.1 }}>
                                            {b.start} to {b.end}
                                          </BodyText>
                                          <BodyText sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.58), lineHeight: 1.1 }}>
                                            {b.title}
                                          </BodyText>
                                        </>
                                      ) : null}
                                    </Box>
                                  );
                                })}

                                {/* Events */}
                                {laneEvents.map((ev, idx) => {
                                  const evStart = minutesSinceMidnight(ev.start);
                                  const evEnd = minutesSinceMidnight(ev.end);
                                  const top = ((evStart - startMin) / grid.stepMinutes) * rowPx + 0.15;
                                  const height = Math.max(78, ((evEnd - evStart) / grid.stepMinutes) * rowPx - 0.3);
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
                                  const left = isSplit ? `calc(${overlapIndex * widthPct}% + 2px)` : 0;
                                  const right = isSplit ? `calc(${(overlapCount - overlapIndex - 1) * widthPct}% + 2px)` : 0;
                                  const cardServiceCategory = getServiceCategory(ev.title);
                                  const cardServiceColor =
                                    appliedDesign.scope === "Services"
                                      ? appliedDesign.colorsByService?.[ev.title]
                                      : cardServiceCategory
                                        ? appliedDesign.colorsByCategory[cardServiceCategory]
                                        : undefined;

                                  return (
                                    <CalendarBookingCard
                                      key={ev.id}
                                      event={ev}
                                      top={top}
                                      height={height}
                                      left={left}
                                      right={right}
                                      serviceColor={cardServiceColor}
                                      onOpen={() => openExistingBooking(ev)}
                                      onOpenCalendar={() => showSnackbar({ severity: "info", message: `Calendar for booking ${extractBookingId(ev.id)}` })}
                                      onOpenNotes={() => showSnackbar({ severity: "info", message: `Notes for booking ${extractBookingId(ev.id)}` })}
                                      onOpenClient={() => showSnackbar({ severity: "info", message: `Client drawer: ${ev.showClientName ?? "Client"}` })}
                                    />
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
      ) : null}

      {activeSubTab === "Schedule" ? (
        <CalendarSchedulePanel
          activeDateIso={activeDateIso}
          availableLocations={data.supportedLocations}
          blocks={blocks}
          isSaving={isSaving}
          onActiveDateChange={setActiveDateIso}
          onCreateBlockedTime={async (draft) => {
            const nextBlocks = buildBlocksFromDraft(draft, draft.teamIds);
            setBlocks((prev) => [...prev, ...nextBlocks]);
            if (!onCreateCalendarEntry) return;
            for (const teamId of draft.teamIds) {
              for (const location of draft.locations) {
                await onCreateCalendarEntry({
                  team_member_id: String(teamId).trim() || null,
                  status: "blocked",
                  title: draft.title || "Blocked time",
                  blocked_time_start: toDateTimeInput(draft.dateFrom, draft.startTime),
                  blocked_time_end: toDateTimeInput(draft.dateTo || draft.dateFrom, draft.endTime),
                  start_date: draft.dateFrom,
                  end_date: draft.dateTo || draft.dateFrom,
                  location_type: locationToApi(location),
                  notes: `${draft.dayFrom}${draft.dayTo ? ` - ${draft.dayTo}` : ""}`.trim() || null,
                });
              }
            }
            showSnackbar({ severity: "success", message: "Blocked time added." });
          }}
          onDeleteBlockedEntry={onDeleteCalendarEntry}
          onSaveScheduleRows={async (rows) => {
            setScheduleRows(rows);
            await persistAvailabilitySettings({ scheduleAvailability: rows });
            showSnackbar({ severity: "success", message: "Availability saved." });
          }}
          resources={data.resources}
          scheduleRows={scheduleRows}
          selectedResourceIds={scheduleResourceFilter}
          onSelectedResourceIdsChange={setScheduleResourceFilter}
        />
      ) : null}

      {activeSubTab === "Hours and Rules" ? (
        <CalendarHoursRulesPanel
          availableLocations={data.supportedLocations}
          bookingRules={bookingRules}
          isSaving={isSaving}
          onBookingRulesChange={setBookingRules}
          onOpenDesign={() => {
            setDesignDraft(appliedDesign);
            setDesignOpen(true);
          }}
          onOpenPublicHours={() => setPublicBusinessHoursOpen(true)}
          onOpenServiceOrder={() => setServiceOrderOpen(true)}
          onSaveBookingRules={async () => {
            await persistAvailabilitySettings({ bookingRules });
            showSnackbar({ severity: "success", message: "Booking rules saved." });
          }}
        />
      ) : null}

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
                    onClick={(e) => setBookingMoreAnchor(e.currentTarget)}
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
                <Popover
                  open={Boolean(bookingMoreAnchor)}
                  anchorEl={bookingMoreAnchor}
                  onClose={() => setBookingMoreAnchor(null)}
                  anchorOrigin={{ vertical: "top", horizontal: "left" }}
                  transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                  PaperProps={{
                    sx: {
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      boxShadow: "0 10px 24px rgba(16, 35, 63, 0.14)",
                      overflow: "hidden",
                      minWidth: 240,
                    },
                  }}
                >
                  <Stack sx={{ py: 0.5 }}>
                    {[
                      {
                        label: "Add Prepayment",
                        onClick: () => {
                          if (isViewingExisting) return;
                          setShowPrepayment(true);
                          showSnackbar({ severity: "info", message: "Prepayment enabled." });
                        },
                      },
                      ...(slotLocation === "DL"
                        ? ([
                            {
                              label: "Add Kilometer Allowance",
                              onClick: () => {
                                if (isViewingExisting) return;
                                setShowKilometerAllowance(true);
                                showSnackbar({ severity: "info", message: "Kilometer Allowance enabled." });
                              },
                            },
                          ] as const)
                        : []),
                      { label: "Add Discount to Total", onClick: () => showSnackbar({ severity: "info", message: "Add Discount to Total (mock)." }) },
                      { label: "Add Late Cancellation", onClick: () => showSnackbar({ severity: "info", message: "Add Late Cancellation (mock)." }) },
                      { label: "Add Late Rescheduling", onClick: () => showSnackbar({ severity: "info", message: "Add Late Rescheduling (mock)." }) },
                      { label: "Add Note", onClick: () => showSnackbar({ severity: "info", message: "Add Note (mock)." }) },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setBookingMoreAnchor(null);
                          item.onClick();
                        }}
                        sx={{
                          px: 1.5,
                          py: 1,
                          cursor: "pointer",
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.72),
                          borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                          "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                          "&:last-of-type": { borderBottom: "none" },
                        }}
                      >
                        {item.label}
                      </Box>
                    ))}
                  </Stack>
                </Popover>
                <Box sx={{ flex: 1 }} />
                {slotBookingScreen === "new-booking" && editingEventId ? (
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditingExisting(true)}
                    startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />}
                    disabled={isEditingExisting}
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
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="outlined"
                  onClick={async () => {
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
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
                  disabled={
                    isSaving || !slotValidation.isValid || (Boolean(editingEventId) && !isEditingExisting)
                  }
                  onClick={() => {
                    setSlotSaveAttempted(true);
                    if (!slotValidation.isValid) return;
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      showSnackbar({ severity: "success", message: "Saved (mock)." });
                      setSlotBookingScreen("new-booking");
                      setSlotSaveAttempted(false);
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      showSnackbar({ severity: "success", message: "Guest added (mock)." });
                      setSlotBookingScreen("new-booking");
                      setSlotSaveAttempted(false);
                      return;
                    }
                    if (!selectedSlot) return;

                    const title =
                      selectedServices[0]?.name ??
                      selectedProducts[0]?.name ??
                      "Booking";
                    const clientName = selectedClient?.name ?? `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ?? "Client";

                    const nextEvent: CalendarEvent = {
                      id: editingEventId ?? `b-${Date.now()}-a`,
                      resourceId: selectedSlot.resourceId,
                      date: selectedSlot.date,
                      start: selectedSlot.start,
                      end: selectedSlot.end,
                      title,
                      status: "Confirmed",
                      location: slotLocation,
                      bookingType: "Offline",
                      showClientName: clientName || "Client",
                    };

                    setEvents((prev) => {
                      if (!editingEventId) return [...prev, nextEvent];
                      return prev.map((e) => (e.id === editingEventId ? nextEvent : e));
                    });
                    showSnackbar({ severity: "success", message: editingEventId ? "Booking updated." : "Booking saved." });
                    // Keep the drawer open on the booking tab; the calendar behind will now show the booking on that slot.
                    setSlotSaveAttempted(false);
                    if (editingEventId) setIsEditingExisting(false);
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
                  {editingEventId ? "Update" : "Save"}
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

                    {(
                      [
                        { label: "Add from client list", key: "client-list" as const },
                        { label: "Add from Mollure platform", key: "mollure-platform" as const },
                        { label: "Add Non-Mollure Client", key: "non-mollure" as const },
                        { label: "Add Guest", key: "guest" as const },
                      ] as const
                    ).map((item) => (
                      <React.Fragment key={item.key}>
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (item.key === "client-list" || item.key === "mollure-platform") {
                              setAddClientSource((p) => (p === item.key ? "" : item.key));
                              return;
                            }
                            if (item.key === "non-mollure") {
                              // Default to Individual Client
                              setNonMollureClientType("individual");
                              setSlotBookingScreen("non-mollure-individual");
                              return;
                            }
                            setSlotBookingScreen("guest");
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            if (item.key === "client-list" || item.key === "mollure-platform") {
                              setAddClientSource((p) => (p === item.key ? "" : item.key));
                              return;
                            }
                            if (item.key === "non-mollure") {
                              setNonMollureClientType("individual");
                              setSlotBookingScreen("non-mollure-individual");
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

                        {item.key === "client-list" && addClientSource === "client-list" ? (
                          <AppDropdown
                            label=""
                            value={clientListSelectedEmail}
                            onChange={(val) => {
                              if (isViewingExisting) return;
                              const email = String(val);
                              setClientListSelectedEmail(email);
                              const c = clientList.find((x) => x.email === email);
                              if (!c) return;
                              setSelectedClient({ name: c.name, email: c.email });
                              setSlotClientAdded(true);
                              setSlotClientSearch("");
                              setSlotBookingScreen("new-booking");
                            }}
                            options={clientList.map((c) => ({
                              label: c.name,
                              value: c.email,
                            }))}
                            fullWidth
                            placeholder="Search based on name"
                            disabled={isViewingExisting}
                          />
                        ) : null}

                        {item.key === "mollure-platform" && addClientSource === "mollure-platform" ? (
                          <AppDropdown
                            label=""
                            value={platformSelectedEmail}
                            onChange={(val) => {
                              if (isViewingExisting) return;
                              const email = String(val);
                              setPlatformSelectedEmail(email);
                              const c = mollurePlatformClients.find((x) => x.email === email);
                              if (!c) return;
                              setSelectedClient({ name: c.name, email: c.email });
                              setSlotClientAdded(true);
                              setSlotClientSearch("");
                              setSlotBookingScreen("new-booking");
                            }}
                            options={mollurePlatformClients.map((c) => ({
                              label: c.email,
                              value: c.email,
                            }))}
                            fullWidth
                            placeholder="Search based on email"
                            disabled={isViewingExisting}
                          />
                        ) : null}
                      </React.Fragment>
                    ))}

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
                      <AppDropdown
                        label=""
                        value={nonMollureClientType || "individual"}
                        onChange={(val) => {
                          const next = val as "individual" | "company";
                          setNonMollureClientType(next);
                          setSlotBookingScreen(next === "individual" ? "non-mollure-individual" : "non-mollure-company");
                        }}
                        options={[
                          { label: "Individual Client", value: "individual" },
                          { label: "Company Client", value: "company" },
                        ]}
                        fullWidth
                        placeholder="Select Client Type"
                      />
                    </Box>

                    <AppTextField
                      placeholder="First Name"
                      value={nonMollureDraft.firstName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, firstName: e.target.value }))}
                      fullWidth
                        error={Boolean(slotErrors.nonMollureFirstName)}
                        helperText={slotErrors.nonMollureFirstName}
                    />
                    <AppTextField
                      placeholder="Last Name"
                      value={nonMollureDraft.lastName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, lastName: e.target.value }))}
                      fullWidth
                        error={Boolean(slotErrors.nonMollureLastName)}
                        helperText={slotErrors.nonMollureLastName}
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
                      error={Boolean(slotErrors.nonMollureGender)}
                      helperText={slotErrors.nonMollureGender}
                    />

                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Date of Birth
                      </BodyText>
                      <AppDatePicker
                        value={nonMollureDraft.dob}
                        onChange={(iso) => setNonMollureDraft((p) => ({ ...p, dob: iso }))}
                        max={todayIso}
                        fullWidth
                      />
                      {slotErrors.nonMollureDob ? (
                        <BodyText sx={{ mt: 0.5, fontSize: 11.5, fontWeight: 700, color: theme.palette.error.main }}>
                          {slotErrors.nonMollureDob}
                        </BodyText>
                      ) : null}
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
                          error={Boolean(slotErrors.nonMollurePhoneCode)}
                          helperText={slotErrors.nonMollurePhoneCode}
                        />
                        <AppTextField
                          placeholder="+442xxxxxxxxxx"
                          value={nonMollureDraft.phoneNumber}
                          onChange={(e) => setNonMollureDraft((p) => ({ ...p, phoneNumber: e.target.value }))}
                          fullWidth
                          error={Boolean(slotErrors.nonMollurePhoneNumber)}
                          helperText={slotErrors.nonMollurePhoneNumber}
                        />
                      </Stack>
                    </Box>

                    <AppTextField
                      placeholder="Email Address"
                      value={nonMollureDraft.email}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, email: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureEmail)}
                      helperText={slotErrors.nonMollureEmail}
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
                      <AppDropdown
                        label=""
                        value={nonMollureClientType || "company"}
                        onChange={(val) => {
                          const next = val as "individual" | "company";
                          setNonMollureClientType(next);
                          setSlotBookingScreen(next === "individual" ? "non-mollure-individual" : "non-mollure-company");
                        }}
                        options={[
                          { label: "Individual Client", value: "individual" },
                          { label: "Company Client", value: "company" },
                        ]}
                        fullWidth
                        placeholder="Select Client Type"
                      />
                    </Box>

                    <AppTextField
                      placeholder="Legal Name"
                      value={nonMollureDraft.legalName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, legalName: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureLegalName)}
                      helperText={slotErrors.nonMollureLegalName}
                    />
                    <AppTextField
                      placeholder="COC"
                      value={nonMollureDraft.coc}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, coc: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureCoc)}
                      helperText={slotErrors.nonMollureCoc}
                    />
                    <AppTextField
                      placeholder="VAT"
                      value={nonMollureDraft.vat}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, vat: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureVat)}
                      helperText={slotErrors.nonMollureVat}
                    />

                    <AppTextField
                      placeholder="Contact Person’s First Name"
                      value={nonMollureDraft.contactFirstName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, contactFirstName: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureContactFirstName)}
                      helperText={slotErrors.nonMollureContactFirstName}
                    />
                    <AppTextField
                      placeholder="Contact Person’s Last Name"
                      value={nonMollureDraft.contactLastName}
                      onChange={(e) => setNonMollureDraft((p) => ({ ...p, contactLastName: e.target.value }))}
                      fullWidth
                      error={Boolean(slotErrors.nonMollureContactLastName)}
                      helperText={slotErrors.nonMollureContactLastName}
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
                      error={Boolean(slotErrors.nonMollureGender)}
                      helperText={slotErrors.nonMollureGender}
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
                            error={Boolean(slotErrors.nonMollureStreet)}
                            helperText={slotErrors.nonMollureStreet}
                          />
                          <AppTextField
                            placeholder="Number"
                            value={nonMollureDraft.streetNumber}
                            onChange={(e) => setNonMollureDraft((p) => ({ ...p, streetNumber: e.target.value }))}
                            fullWidth
                            error={Boolean(slotErrors.nonMollureStreetNumber)}
                            helperText={slotErrors.nonMollureStreetNumber}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.25}>
                          <AppTextField
                            placeholder="Postal Code"
                            value={nonMollureDraft.postalCode}
                            onChange={(e) => setNonMollureDraft((p) => ({ ...p, postalCode: e.target.value }))}
                            fullWidth
                            error={Boolean(slotErrors.nonMollurePostalCode)}
                            helperText={slotErrors.nonMollurePostalCode}
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
                            error={Boolean(slotErrors.nonMollureProvince)}
                            helperText={slotErrors.nonMollureProvince}
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
                          error={Boolean(slotErrors.nonMollureMunicipality)}
                          helperText={slotErrors.nonMollureMunicipality}
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
                      error={Boolean(slotErrors.nonMollureEmail)}
                      helperText={slotErrors.nonMollureEmail}
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
                        error={Boolean(slotErrors.guestFirstName)}
                        helperText={slotErrors.guestFirstName}
                      />
                      <AppTextField
                        placeholder="Last Name*"
                        value={guestDraft.lastName}
                        onChange={(e) => setGuestDraft((p) => ({ ...p, lastName: e.target.value }))}
                        fullWidth
                        error={Boolean(slotErrors.guestLastName)}
                        helperText={slotErrors.guestLastName}
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
                          color: alpha(m.navy, 0.74),
                          fontSize: 12.5,
                          fontWeight: 800,
                        }}
                      >
                        <Box component="span">
                          {selectedSlot ? `${slotLocation}: ${formatMdyDate(selectedSlot.date)}` : "Select calendar"}
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
                                    onClick={() => {
                                      if (isViewingExisting) return;
                                      setSlotLocation(loc);
                                    }}
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

                            <Box sx={{ mt: 0.5 }}>
                              <AppCalendarPanel
                                compact
                                value={selectedSlot?.date ?? defaultDateIso}
                                onChange={(iso) => setSelectedSlot((p) => (p ? { ...p, date: iso } : p))}
                                min={todayIso}
                              />
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
                            px: 1.5,
                            py: 1.25,
                            bgcolor: "#fff",
                            boxShadow: `0 0 0 6px ${alpha(m.teal, 0.08)}`,
                          }}
                        >
                          <AppSearchField
                            value={slotClientSearch}
                            onChange={(e) => {
                              if (isViewingExisting) return;
                              setSlotClientSearch(e.target.value);
                            }}
                            onClear={() => {
                              if (isViewingExisting) return;
                              setSlotClientSearch("");
                            }}
                            placeholder="Search client..."
                            size="small"
                            fullWidth
                            sx={{ mb: 1 }}
                            disabled={isViewingExisting}
                          />

                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar src="/images/testimonial.webp" sx={{ width: 34, height: 34 }}>
                              {!selectedClient?.name ? null : selectedClient.name.slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.2 }}>
                                {selectedClient?.name ?? "Client"}
                              </BodyText>
                              <BodyText sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.46), lineHeight: 1.2 }}>
                                {selectedClient?.email ?? ""}
                              </BodyText>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (isViewingExisting) return;
                                setSlotClientAdded(false);
                                setSlotClientSearch("");
                                setSelectedClient(null);
                              }}
                              sx={{ color: alpha(m.navy, 0.35) }}
                              disabled={isViewingExisting}
                            >
                              <CloseRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Stack>
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
                      {slotErrors.bookingClient ? (
                        <BodyText sx={{ mt: 0.6, fontSize: 11.5, fontWeight: 800, color: theme.palette.error.main }}>
                          {slotErrors.bookingClient}
                        </BodyText>
                      ) : null}
                    </Box>

                    {slotClientAdded ? (
                      <>
                        <Box
                          onClickCapture={(e) => {
                            // Only the arrow button should open the menu.
                            // If the click wasn't inside the arrow button, swallow it.
                            const t = e.target as unknown;
                            if (t && typeof t === "object" && "closest" in (t as any)) {
                              const el = t as Element;
                              if (el.closest('[data-add-menu-arrow="true"]')) return;
                            }
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          sx={{
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            borderRadius: "10px",
                            height: 38,
                            width: 132,
                            display: "flex",
                            alignItems: "center",
                            bgcolor: "#fff",
                            overflow: "hidden",
                            boxShadow: "0 4px 14px rgba(16, 35, 63, 0.06)",
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              height: "100%",
                              px: 1.2,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.95,
                              justifyContent: "flex-start",
                              userSelect: "none",
                              cursor: "default",
                              opacity: isViewingExisting ? 0.55 : 1,
                            }}
                          >
                            <Box sx={{ width: 22, height: 22, borderRadius: "999px", bgcolor: alpha(m.teal, 0.18), color: m.teal, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 900 }}>
                              +
                            </Box>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.62), flex: 1, lineHeight: 1 }}>
                              Add
                            </BodyText>
                          </Box>

                          <Box sx={{ width: 1, height: "100%", bgcolor: alpha(m.navy, 0.10) }} />

                          <IconButton
                            size="small"
                            ref={addMenuButtonRef}
                            onClick={(e) => setSlotAddMenuAnchor(e.currentTarget)}
                            data-add-menu-arrow="true"
                            sx={{
                              width: 38,
                              height: 38,
                              flex: "0 0 38px",
                              borderRadius: 0,
                              p: 0,
                              m: 0,
                              color: alpha(m.navy, 0.45),
                              display: "grid",
                              placeItems: "center",
                              "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                              zIndex: 1,
                            }}
                            aria-label="Add menu"
                            disabled={isViewingExisting}
                          >
                            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>

                        <Popover
                          open={Boolean(slotAddMenuAnchor)}
                          anchorEl={slotAddMenuAnchor}
                          onClose={() => setSlotAddMenuAnchor(null)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                          transformOrigin={{ vertical: "top", horizontal: "left" }}
                          PaperProps={{
                            sx: {
                              mt: 0.8,
                              borderRadius: "12px",
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              boxShadow: "0 16px 44px rgba(16, 35, 63, 0.18)",
                              overflow: "hidden",
                              minWidth: 210,
                            },
                          }}
                        >
                          <Stack sx={{ p: 0.75 }}>
                            {[
                              { key: "service", label: "Add item" },
                              { key: "service-2", label: "Add service" },
                              { key: "product", label: "Add product" },
                            ].map((item) => (
                              <ButtonBase
                                key={item.key}
                                onClick={() => {
                                  setSlotAddMenuAnchor(null);
                                  if (item.key === "service" || item.key === "service-2") {
                                    setProductPickerOpen(false);
                                    setServicePickerOpen(true);
                                  }
                                  if (item.key === "product") {
                                    setServicePickerOpen(false);
                                    setProductPickerOpen(true);
                                  }
                                }}
                                sx={{
                                  width: "100%",
                                  textAlign: "left",
                                  borderRadius: "10px",
                                  px: 1.25,
                                  py: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  "&:hover": { bgcolor: alpha(m.navy, 0.035) },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 30,
                                    height: 30,
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
                                <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.76) }}>
                                  {item.label}
                                </BodyText>
                              </ButtonBase>
                            ))}
                          </Stack>
                        </Popover>

                        {servicePickerOpen ? (
                          <Box
                            sx={{
                              borderRadius: "12px",
                              bgcolor: "#fff",
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
                              p: 1.5,
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <BodyText sx={{ flex: 1, fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                Services
                              </BodyText>
                              <IconButton size="small" onClick={() => setServicePickerOpen(false)} sx={{ color: alpha(m.navy, 0.35) }}>
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <AppDropdown
                                label=""
                                value={selectedServiceId}
                                onChange={(val) => {
                                  if (isViewingExisting) return;
                                  setSelectedServiceId(val as string);
                                }}
                                options={[
                                  { label: "Select service", value: "" },
                                  ...serviceCatalog.map((s) => ({ label: `${s.name} — €${s.price}`, value: s.id })),
                                ]}
                                fullWidth
                                placeholder="Select service"
                                disabled={isViewingExisting}
                              />
                              <Button
                                variant="outlined"
                                disabled={!selectedServiceId}
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  const s = serviceCatalog.find((x) => x.id === selectedServiceId);
                                  if (!s) return;
                                  setSelectedServices((p) => (p.some((it) => it.id === s.id) ? p : [...p, { id: s.id, name: s.name, price: s.price }]));
                                  setSelectedServiceId("");
                                }}
                                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 850, minWidth: 90 }}
                              >
                                Add
                              </Button>
                            </Stack>

                            {selectedServices.length ? (
                              <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                                {selectedServices.map((s) => (
                                  <Box
                                    key={s.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                                      px: 1.25,
                                      py: 0.85,
                                    }}
                                  >
                                    <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.72) }}>{s.name}</BodyText>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                      <BodyText sx={{ fontSize: 12.5, fontWeight: 950, color: alpha(m.navy, 0.82) }}>€{s.price}</BodyText>
                                      <IconButton
                                        size="small"
                                        onClick={() => setSelectedServices((p) => p.filter((x) => x.id !== s.id))}
                                        sx={{ color: alpha(m.navy, 0.3) }}
                                        aria-label={`Remove ${s.name}`}
                                        disabled={isViewingExisting}
                                      >
                                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            ) : null}
                          </Box>
                        ) : null}

                        {productPickerOpen ? (
                          <Box
                            sx={{
                              borderRadius: "12px",
                              bgcolor: "#fff",
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
                              p: 1.5,
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <BodyText sx={{ flex: 1, fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                Products
                              </BodyText>
                              <IconButton size="small" onClick={() => setProductPickerOpen(false)} sx={{ color: alpha(m.navy, 0.35) }}>
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <AppDropdown
                                label=""
                                value={selectedProductId}
                                onChange={(val) => {
                                  if (isViewingExisting) return;
                                  setSelectedProductId(val as string);
                                }}
                                options={[
                                  { label: "Select product", value: "" },
                                  ...productCatalog.map((p) => ({ label: `${p.name} — €${p.price}`, value: p.id })),
                                ]}
                                fullWidth
                                placeholder="Select product"
                                disabled={isViewingExisting}
                              />
                              <Button
                                variant="outlined"
                                disabled={!selectedProductId}
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  const p = productCatalog.find((x) => x.id === selectedProductId);
                                  if (!p) return;
                                  setSelectedProducts((prev) => (prev.some((it) => it.id === p.id) ? prev : [...prev, { id: p.id, name: p.name, price: p.price }]));
                                  setSelectedProductId("");
                                }}
                                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 850, minWidth: 90 }}
                              >
                                Add
                              </Button>
                            </Stack>

                            {selectedProducts.length ? (
                              <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                                {selectedProducts.map((p) => (
                                  <Box
                                    key={p.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                                      px: 1.25,
                                      py: 0.85,
                                    }}
                                  >
                                    <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.72) }}>{p.name}</BodyText>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                      <BodyText sx={{ fontSize: 12.5, fontWeight: 950, color: alpha(m.navy, 0.82) }}>€{p.price}</BodyText>
                                      <IconButton
                                        size="small"
                                        onClick={() => setSelectedProducts((prev) => prev.filter((x) => x.id !== p.id))}
                                        sx={{ color: alpha(m.navy, 0.3) }}
                                        aria-label={`Remove ${p.name}`}
                                        disabled={isViewingExisting}
                                      >
                                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            ) : null}
                          </Box>
                        ) : null}

                        <Box sx={{ borderRadius: "10px", bgcolor: alpha(m.navy, 0.025), p: 1.5 }}>
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.76), mb: 1 }}>
                            Location
                          </BodyText>
                          {slotLocation === "FL" ? (
                            <Stack direction="row" spacing={4}>
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.68) }}>
                                Fixed Location
                              </BodyText>
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.42) }}>
                                St. Salon 123
                              </BodyText>
                            </Stack>
                          ) : (
                            <Box>
                              {showKilometerAllowance ? (
                                <Box
                                  sx={{
                                    borderRadius: "12px",
                                    bgcolor: "#fff",
                                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                                    boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
                                    p: 1.5,
                                    mb: 1.25,
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <BodyText sx={{ flex: 1, fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                      Kilometer Allowance
                                    </BodyText>
                                    <IconButton
                                      size="small"
                                      onClick={() => setShowKilometerAllowance(false)}
                                      sx={{ color: alpha(m.navy, 0.35) }}
                                      aria-label="Remove kilometer allowance"
                                    >
                                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Stack>

                                  <BodyText sx={{ fontSize: 12.25, fontWeight: 850, color: alpha(m.navy, 0.6), mt: 1, mb: 0.75 }}>
                                    Amount/Per Kilometer
                                  </BodyText>

                                  <Stack direction="row" spacing={1}>
                                    <AppTextField
                                      placeholder="EUR/Km"
                                      value={kilometerAllowanceDraft.eurPerKm}
                                      onChange={(e) => setKilometerAllowanceDraft((p) => ({ ...p, eurPerKm: e.target.value }))}
                                      fullWidth
                                    />
                                    <AppTextField
                                      placeholder="Total Kilometer"
                                      value={kilometerAllowanceDraft.totalKilometer}
                                      onChange={(e) => setKilometerAllowanceDraft((p) => ({ ...p, totalKilometer: e.target.value }))}
                                      fullWidth
                                    />
                                  </Stack>

                                  <Box
                                    sx={{
                                      mt: 1.25,
                                      pt: 1.25,
                                      borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.62) }}>Total Price</BodyText>
                                    <BodyText sx={{ fontSize: 18, fontWeight: 950, color: alpha(m.navy, 0.84) }}>20€</BodyText>
                                  </Box>
                                </Box>
                              ) : null}

                              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.68), mb: 1 }}>
                                Desired Location
                              </BodyText>
                              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <AppTextField
                                  placeholder="Street"
                                  value={desiredLocationDraft.street}
                                  onChange={(e) => setDesiredLocationDraft((p) => ({ ...p, street: e.target.value }))}
                                  fullWidth
                                />
                                <AppTextField
                                  placeholder="Number"
                                  value={desiredLocationDraft.number}
                                  onChange={(e) => setDesiredLocationDraft((p) => ({ ...p, number: e.target.value }))}
                                  fullWidth
                                />
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                <AppTextField
                                  placeholder="Postal Code"
                                  value={desiredLocationDraft.postalCode}
                                  onChange={(e) => setDesiredLocationDraft((p) => ({ ...p, postalCode: e.target.value }))}
                                  fullWidth
                                />
                                <AppDropdown
                                  label=""
                                  value={desiredLocationDraft.province}
                                  onChange={(val) => setDesiredLocationDraft((p) => ({ ...p, province: val as string }))}
                                  options={[
                                    { label: "Province", value: "" },
                                    { label: "Province 1", value: "Province 1" },
                                    { label: "Province 2", value: "Province 2" },
                                  ]}
                                  fullWidth
                                  placeholder="Province"
                                />
                                <AppDropdown
                                  label=""
                                  value={desiredLocationDraft.municipality}
                                  onChange={(val) => setDesiredLocationDraft((p) => ({ ...p, municipality: val as string }))}
                                  options={[
                                    { label: "Municipality", value: "" },
                                    { label: "Municipality 1", value: "Municipality 1" },
                                    { label: "Municipality 2", value: "Municipality 2" },
                                  ]}
                                  fullWidth
                                  placeholder="Municipality"
                                />
                              </Stack>
                            </Box>
                          )}
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

                        <Box
                          sx={{
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.16)}`,
                            bgcolor: "#fff",
                            px: 2,
                            py: 1.6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <BodyText sx={{ fontSize: 16, fontWeight: 950, color: alpha(m.navy, 0.78) }}>Total Price:</BodyText>
                          <BodyText sx={{ fontSize: 18, fontWeight: 950, color: alpha(m.navy, 0.9) }}>€{totalPrice}</BodyText>
                        </Box>

                        {showPrepayment ? (
                          <>
                            <Box
                              sx={{
                                borderRadius: "12px",
                                bgcolor: "#fff",
                                border: `1px solid ${alpha(m.navy, 0.08)}`,
                                boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
                                p: 1.5,
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <BodyText sx={{ flex: 1, fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                  Prepayment
                                </BodyText>
                                <IconButton
                                  size="small"
                                  onClick={() => setShowPrepayment(false)}
                                  sx={{ color: alpha(m.navy, 0.35) }}
                                  aria-label="Remove prepayment"
                                >
                                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Stack>

                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                                <BodyText sx={{ flex: 1, fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.62) }}>
                                  Prepayment:
                                </BodyText>
                                <AppTextField
                                  placeholder="%"
                                  value={prepaymentPercent}
                                  onChange={(e) => setPrepaymentPercent(e.target.value)}
                                  sx={{ maxWidth: 86 }}
                                />
                                <BodyText sx={{ fontSize: 16, fontWeight: 950, color: alpha(m.navy, 0.85) }}>€{prepaymentAmount}</BodyText>
                              </Stack>

                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                                <BodyText sx={{ flex: 1, fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.55) }}>
                                  Remaining after prepayment
                                </BodyText>
                                <BodyText sx={{ fontSize: 16, fontWeight: 950, color: alpha(m.navy, 0.85) }}>€{remainingAfterPrepayment}</BodyText>
                              </Stack>

                              <Box sx={{ mt: 1.25, pt: 1.25, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }}>
                                <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), mb: 0.75 }}>
                                  Payment method
                                </BodyText>

                                {[
                                  { key: "online" as const, label: "Online Direct" },
                                  { key: "offline" as const, label: "Offline Direct" },
                                ].map((pm) => {
                                  const active = paymentMethod === pm.key;
                                  return (
                                    <ButtonBase
                                      key={pm.key}
                                      onClick={() => setPaymentMethod(pm.key)}
                                      sx={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        py: 0.65,
                                        borderRadius: "10px",
                                        "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                                      }}
                                    >
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Box
                                          sx={{
                                            width: 18,
                                            height: 12,
                                            borderRadius: "3px",
                                            border: `1px solid ${alpha(m.navy, 0.22)}`,
                                            bgcolor: alpha(m.navy, 0.04),
                                          }}
                                        />
                                        <BodyText sx={{ fontSize: 12.75, fontWeight: 850, color: alpha(m.navy, 0.74) }}>
                                          {pm.label}
                                        </BodyText>
                                      </Stack>
                                      <Box
                                        sx={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: "999px",
                                          border: `2px solid ${active ? m.teal : alpha(m.navy, 0.22)}`,
                                          display: "grid",
                                          placeItems: "center",
                                        }}
                                      >
                                        {active ? <Box sx={{ width: 8, height: 8, borderRadius: "999px", bgcolor: m.teal }} /> : null}
                                      </Box>
                                    </ButtonBase>
                                  );
                                })}
                              </Box>
                            </Box>
                          </>
                        ) : null}

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
          const nextBlocks = buildBlocksFromDraft(blockDraft, blockDraft.teamIds);
          if (!nextBlocks.length) {
            showSnackbar({
              severity: "warning",
              message: "No dates matched your selection. Check the date range and day filters.",
            });
            return;
          }

          setBlocks((prev) => {
            const seen = new Set(prev.map((block) => `${block.resourceId}-${block.date}-${block.start}-${block.end}`));
            const unique = nextBlocks.filter((block) => {
              const key = `${block.resourceId}-${block.date}-${block.start}-${block.end}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return [...prev, ...unique];
          });
          setActiveDateIso(blockDraft.dateFrom);
          if (blockDraft.teamIds.length === 1) {
            setSelectedResourceId(blockDraft.teamIds[0]);
          }
          setBlockTimeOpen(false);
          showSnackbar({ severity: "success", message: "Blocked time added." });

          if (!onCreateCalendarEntry) return;

          try {
            for (const teamId of blockDraft.teamIds) {
              const teamMemberId = String(teamId).trim() || null;
              for (const location of blockDraft.locations) {
                await onCreateCalendarEntry({
                  team_member_id: teamMemberId,
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
          } catch {
            showSnackbar({
              severity: "warning",
              message: "Blocked time shown on calendar, but it could not be saved to the server.",
            });
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
            await persistAvailabilitySettings({
              publicBusinessHours: [publicBusinessHoursDraft],
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
                bookingRules,
                scheduleAvailability: scheduleRows,
                dateOverrides,
                serviceOrder: serviceOrderDraft,
                publicBusinessHours: calendarSettings?.availability.publicBusinessHours,
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
        serviceOptions={serviceOptions}
      />
      <CalendarServiceOrderModal
        draft={serviceOrderDraft}
        onApply={async () => {
          try {
            await persistAvailabilitySettings({ serviceOrder: serviceOrderDraft });
            showSnackbar({ severity: "success", message: "Service order saved." });
            setServiceOrderOpen(false);
          } catch {
            showSnackbar({ severity: "error", message: "Unable to save service order." });
          }
        }}
        onClose={() => setServiceOrderOpen(false)}
        open={serviceOrderOpen}
        setDraft={setServiceOrderDraft}
      />
      <CalendarEditAvailabilityModal
        availableLocations={data.supportedLocations}
        draft={editAvailabilityDraft}
        onApply={async () => {
          const nextOverrides = [
            ...(dateOverrides ?? []).filter(
              (item) => !(item.resourceId === editAvailabilityDraft.resourceId && item.date === editAvailabilityDraft.date),
            ),
            {
              id: makeScheduleRowId(),
              resourceId: editAvailabilityDraft.resourceId,
              date: editAvailabilityDraft.date,
              locations: editAvailabilityDraft.locations,
              shifts: editAvailabilityDraft.shifts,
            },
          ];
          setDateOverrides(nextOverrides);
          await persistAvailabilitySettings({ dateOverrides: nextOverrides });
          showSnackbar({ severity: "success", message: "Availability updated." });
          setEditAvailabilityOpen(false);
        }}
        onClose={() => setEditAvailabilityOpen(false)}
        open={editAvailabilityOpen}
        resource={data.resources.find((resource) => resource.id === editAvailabilityDraft.resourceId)}
        setDraft={setEditAvailabilityDraft}
      />
    </Stack>
  );
}

