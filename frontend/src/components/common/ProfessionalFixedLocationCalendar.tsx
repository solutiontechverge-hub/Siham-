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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Avatar, Box, Button, ButtonBase, Chip, IconButton, Paper, Popover, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import { useSnackbar } from "./AppSnackbar";
import AppPillTabs from "./AppPillTabs";
import MollureDrawer from "./MollureDrawer";
import AppSearchField from "./AppSearchField";
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
  CalendarEvent,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../app/professionals/fixed-location/calendar/calendar.data";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
};

export default function ProfessionalFixedLocationCalendar({ data }: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [events, setEvents] = React.useState<readonly CalendarEvent[]>(() => [...data.events]);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

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
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>("FL");
  const [slotCalendarMonth, setSlotCalendarMonth] = React.useState(() => toMonthIso(defaultDateIso));
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
  } = useCalendarFilters(data.resources);
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
    locations: ["FL", "DL"],
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
  const blocksInRange = React.useMemo(
    () => {
      const base = data.blocks.filter((b) => visibleDates.includes(b.date));
      if (appliedFilters.teamAll) return base;
      return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
    },
    [appliedFilters.teamAll, appliedFilters.teamIds, data.blocks, visibleDates],
  );

  const todayIso = defaultDateIso;

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
    if (viewMode === "month") return addDaysIso(activeDateIso, -30);
    return addDaysIso(activeDateIso, -1);
  }, [activeDateIso, viewMode]);

  const canGoPrev = prevCandidateIso >= todayIso;

  const onToday = () => {
    setActiveDateIso(todayIso);
  };

  const onPrev = () => {
    setActiveDateIso(canGoPrev ? prevCandidateIso : todayIso);
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
      for (const e of events) {
        if (e.resourceId !== resourceId || e.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(e.start), endMin: minutesSinceMidnight(e.end) });
      }
      for (const b of data.blocks) {
        if (b.resourceId !== resourceId || b.date !== iso) continue;
        busy.push({ startMin: minutesSinceMidnight(b.start), endMin: minutesSinceMidnight(b.end) });
      }
      return busy;
    },
    [data.blocks, events],
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
      setSlotCalendarMonth(toMonthIso(ev.date));
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
                disabled={!canGoPrev}
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
                  {activeResource ? [activeResource].map((res, laneIdx) => {
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
                                      onClick={() => openExistingBooking(ev)}
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
                                        cursor: "pointer",
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
                  }) : null}
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
                  onClick={() => {
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
                  disabled={!slotValidation.isValid || (Boolean(editingEventId) && !isEditingExisting)}
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
                      <AppTextField
                        type="text"
                        value={nonMollureDraft.dob}
                        onChange={(e) => setNonMollureDraft((p) => ({ ...p, dob: e.target.value }))}
                        fullWidth
                        placeholder="mm/dd/yyyy"
                        error={Boolean(slotErrors.nonMollureDob)}
                        helperText={slotErrors.nonMollureDob}
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
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                border: `1px solid ${alpha(m.navy, 0.08)}`,
                                borderRadius: "7px",
                                overflow: "hidden",
                                mb: 1.2,
                                maxWidth: 242,
                                mx: "auto",
                              }}
                            >
                              {(["FL", "DL"] as const).map((loc) => {
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
                                      borderRight: loc === "FL" ? `1px solid ${alpha(m.navy, 0.08)}` : undefined,
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
        draft={blockDraft}
        onApply={() => {
          showSnackbar({ severity: "success", message: "Blocked time added (mock)." });
          setBlockTimeOpen(false);
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
        onApply={() => {
          showSnackbar({ severity: "success", message: "Public business hours saved (mock)." });
          setPublicBusinessHoursOpen(false);
        }}
        draft={publicBusinessHoursDraft}
        setDraft={setPublicBusinessHoursDraft}
      />
      <CalendarDesignModal
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        onApply={() => {
          setAppliedDesign(designDraft);
          showSnackbar({ severity: "success", message: "Design saved (mock)." });
          setDesignOpen(false);
        }}
        draft={designDraft}
        setDraft={setDesignDraft}
      />
    </Stack>
  );
}

