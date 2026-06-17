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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
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
import AppCountryPhoneFields from "./AppCountryPhoneFields";
import AppDropdown from "./AppDropdown";
import CalendarAddMenu from "./calendar/CalendarAddMenu";
import CalendarBookingCard from "./calendar/CalendarBookingCard";
import { useMessagingWidget } from "./messaging/MessagingWidgetContext";
import {
  buildBookingDetailsSnapshot,
  emptyDesiredLocation,
  hydrateBookingDrawerFromEvent,
} from "./calendar/bookingEventDetails";
import CalendarBlockTimeModal from "./calendar/CalendarBlockTimeModal";
import CalendarDesignModal, { type CalendarDesignDraft } from "./calendar/CalendarDesignModal";
import CalendarPublicBusinessHoursModal, {
  type PublicBusinessHoursDraft,
} from "./calendar/CalendarPublicBusinessHoursModal";
import CalendarFiltersDrawer from "./calendar/CalendarFiltersDrawer";
import ManualEntryDiscountModal from "../sections/finance/ManualEntryDiscountModal";
import {
  calculateManualEntryDiscountAmount,
  formatManualEntryDiscountLabel,
  type ManualEntryDiscount,
} from "../sections/finance/manualEntry.data";
import BookingSelectServicesScreen from "./calendar/BookingSelectServicesScreen";
import DiscardBrDialog from "./calendar/DiscardBrDialog";
import BookingEditServiceScreen from "./calendar/BookingEditServiceScreen";
import BookingSelectProductsScreen from "./calendar/BookingSelectProductsScreen";
import BookingAddUniqueItemScreen from "./calendar/BookingAddUniqueItemScreen";
import { useCalendarFilters } from "./calendar/useCalendarFilters";
import { allBookingCatalogServices, formatBookingServiceMeta } from "../../data/bookingServiceCatalog.data";
import {
  buildBookingServiceLineItem,
  buildServiceEditDraftFromCatalog,
  emptyBookingServiceEditDraft,
  formatBookingServiceLineMeta,
  getBookingServiceEditErrors,
  getEffectiveServicePrice,
  lineItemToOverride,
  type BookingServiceEditDraft,
  type BookingServiceLineItem,
} from "../../data/bookingServiceEdit.data";
import {
  bookingProductCatalog,
  buildProductSelectionDraftFromSelected,
  createEmptyProductSelectionDraft,
  formatProductLineName,
  formatProductUnitPrice,
  getProductBaseName,
  type BookingCatalogProduct,
  type BookingProductSelectionDraft,
} from "../../data/bookingProductCatalog.data";
import {
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
  getUniqueItemDraftErrors,
  type BookingUniqueItemDraft,
} from "../../data/bookingUniqueItem.data";
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
  statusChipSx,
  subtractIntervals,
  sumIntervalsMins,
  toMonthIso,
  toIsoLocalDate,
} from "./calendar/calendar.utils";
import {
  BOOKING_SCENARIO_LABELS,
  canDiscardBookingRequest,
  getBookingScenarioIndicators,
  statusAccentColor,
} from "./calendar/bookingStatus";
import PrepaymentStatusIcon from "./calendar/PrepaymentStatusIcon";
import { PREPAYMENT_STATUS_LABELS } from "./calendar/PrepaymentStatusIcon";
import BookingIndicatorIcon, { BOOKING_INDICATOR_LABELS } from "./calendar/BookingIndicatorIcon";
import BookingRequestSentIcon, { BOOKING_REQUEST_SENT_LABEL } from "./calendar/BookingRequestSentIcon";
import { resolveBookingResponseIndicators } from "./calendar/bookingResponseStatus";
import { resolveCalendarPrepaymentStatus, toPrepaymentIconVariant } from "./calendar/prepaymentStatus";
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
import { GENDER_OPTIONS, type GenderOption } from "../../lib/gender-options";
import { getOptionalPhoneValidationErrors, getPhoneValidationErrors } from "../../lib/phone-validation";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  isSaving?: boolean;
  onCreateCalendarEntry?: (payload: CreateCalendarEntryRequest) => Promise<void>;
  onSaveCalendarSettings?: (payload: UpsertCalendarSettingsRequest) => Promise<void>;
};

const toDateTimeInput = (date: string, time: string) => `${date}T${time}:00`;
const locationToApi = (location: CalendarBookingLocation) => (location === "DL" ? "desired" : "fixed");
const isMinuteInAvailability = (minute: number, windows: readonly Interval[]) =>
  windows.some((w) => minute >= w.startMin && minute < w.endMin);
const formatWeekDayName = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const formatWeekDayDate = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function ProfessionalFixedLocationCalendar({
  data,
  isSaving = false,
  onCreateCalendarEntry,
  onSaveCalendarSettings,
}: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { openMessaging } = useMessagingWidget();

  const openBookingMessages = React.useCallback(
    (ev: CalendarEvent) => {
      const bookingRef = ev.bookingCode ?? extractBookingId(ev.id);
      openMessaging({ bookingRef });
    },
    [openMessaging],
  );

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

  const addMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const serviceCatalog = React.useMemo(() => allBookingCatalogServices, []);
  const productCatalog = React.useMemo(() => bookingProductCatalog, []);

  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("day");
  const [activeDateIso, setActiveDateIso] = React.useState(defaultDateIso);
  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const [resourceMenuAnchor, setResourceMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [datePickerAnchor, setDatePickerAnchor] = React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<"booking" | "sales" | "activity">("booking");
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>(data.supportedLocations[0] ?? "FL");
  const [slotBookingType, setSlotBookingType] = React.useState<CalendarBookingType>("Offline");
  const [slotStatus, setSlotStatus] = React.useState<
    "Confirmed" | "Requested" | "No Show" | "Completed" | "Cancelled" | "Invalid"
  >(
    "Confirmed",
  );
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotCalendarOpen, setSlotCalendarOpen] = React.useState(false);
  const [slotCalendarTouched, setSlotCalendarTouched] = React.useState(false);
  const [discardBrOpen, setDiscardBrOpen] = React.useState(false);
  const [slotClientSearch, setSlotClientSearch] = React.useState("");
  const [slotAddMenuAnchor, setSlotAddMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [addMenuTarget, setAddMenuTarget] = React.useState<"client" | string>("client");
  const [selectionTarget, setSelectionTarget] = React.useState<"client" | string>("client");
  const [selectedServices, setSelectedServices] = React.useState<BookingServiceLineItem[]>([]);
  const [serviceSelectionDraft, setServiceSelectionDraft] = React.useState<string[]>([]);
  const [serviceOverridesDraft, setServiceOverridesDraft] = React.useState<
    Record<string, Partial<BookingServiceLineItem>>
  >({});
  const [serviceEditDraft, setServiceEditDraft] = React.useState<BookingServiceEditDraft>(() =>
    emptyBookingServiceEditDraft(),
  );
  const [serviceEditAttempted, setServiceEditAttempted] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<
    Array<{ id: string; name: string; price: number; quantity: number; unitPrice: number }>
  >([]);
  const [productSelectionDraft, setProductSelectionDraft] = React.useState<BookingProductSelectionDraft>(() =>
    createEmptyProductSelectionDraft(),
  );
  const [uniqueItemDraft, setUniqueItemDraft] = React.useState<BookingUniqueItemDraft>(() => emptyBookingUniqueItemDraft());
  const [customBookingProducts, setCustomBookingProducts] = React.useState<BookingCatalogProduct[]>([]);
  const [showInlineGuestField, setShowInlineGuestField] = React.useState(false);
  const [inlineGuestDraft, setInlineGuestDraft] = React.useState({ firstName: "", lastName: "" });
  const [bookingGuests, setBookingGuests] = React.useState<
    Array<{
      id: string;
      name: string;
      services: BookingServiceLineItem[];
      products: Array<{ id: string; name: string; price: number; quantity: number; unitPrice: number }>;
    }>
  >([]);
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
  const [bookingTotalDiscount, setBookingTotalDiscount] = React.useState<ManualEntryDiscount | null>(null);
  const [bookingDiscountModalOpen, setBookingDiscountModalOpen] = React.useState(false);
  const [showLateCancellation, setShowLateCancellation] = React.useState(false);
  const [lateCancellationFeePercent, setLateCancellationFeePercent] = React.useState("");
  const [showInternalNote, setShowInternalNote] = React.useState(false);
  const [bookingInternalNote, setBookingInternalNote] = React.useState("");
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
    | "select-services"
    | "edit-service"
    | "select-products"
    | "add-unique-item"
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

  const servicesTotal = React.useMemo(
    () => selectedServices.reduce((sum, service) => sum + getEffectiveServicePrice(service), 0),
    [selectedServices],
  );
  const productsTotal = React.useMemo(() => selectedProducts.reduce((sum, p) => sum + p.price, 0), [selectedProducts]);
  const guestsTotal = React.useMemo(
    () =>
      bookingGuests.reduce(
        (sum, guest) =>
          sum +
          guest.services.reduce((serviceSum, service) => serviceSum + getEffectiveServicePrice(service), 0) +
          guest.products.reduce((productSum, product) => productSum + product.price, 0),
        0,
      ),
    [bookingGuests],
  );
  const subtotalPrice = servicesTotal + productsTotal + guestsTotal;
  const bookingDiscountAmount = React.useMemo(
    () => calculateManualEntryDiscountAmount(subtotalPrice, bookingTotalDiscount),
    [bookingTotalDiscount, subtotalPrice],
  );
  const totalPrice = Math.max(0, subtotalPrice - bookingDiscountAmount);
  const lateCancellationFeeAmount = React.useMemo(() => {
    const pct = Number(lateCancellationFeePercent);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return Math.round((subtotalPrice * pct) / 100);
  }, [lateCancellationFeePercent, subtotalPrice]);
  const prepaymentAmount = React.useMemo(() => {
    const pct = Number(prepaymentPercent);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return Math.round((totalPrice * pct) / 100);
  }, [prepaymentPercent, totalPrice]);
  const remainingAfterPrepayment = Math.max(0, totalPrice - prepaymentAmount);
  const [bookingPhoneDraft, setBookingPhoneDraft] = React.useState<{ phoneCode: string; phoneNumber: string }>(() => ({
    phoneCode: "",
    phoneNumber: "",
  }));
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
    gender: "" | GenderOption;
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
        { id: "sales" as const, label: "Sales" },
        { id: "activity" as const, label: "Activity" },
      ] as const,
    [],
  );

  const isViewingBooking = Boolean(editingEventId);

  const viewingBookingEvent = React.useMemo(
    () => (editingEventId ? events.find((event) => event.id === editingEventId) ?? null : null),
    [editingEventId, events],
  );

  const isCompletedBooking = viewingBookingEvent?.status === "Completed";
  const isViewingExisting =
    isCompletedBooking || (Boolean(editingEventId) && !isEditingExisting);

  const closeBookingDrawer = React.useCallback(() => {
    setSlotDrawerOpen(false);
    setEditingEventId(null);
    setIsEditingExisting(false);
  }, []);

  React.useEffect(() => {
    if (!isViewingBooking && slotDrawerTab !== "booking") {
      setSlotDrawerTab("booking");
    }
  }, [isViewingBooking, slotDrawerTab]);

  const calendarFieldLabel = React.useMemo(() => {
    if ((isViewingBooking || slotCalendarTouched) && selectedSlot?.date) {
      const locLabel = slotLocation === "FL" ? "Fixed Location" : "Desired Location";
      return `${locLabel} · ${formatMdyDate(selectedSlot.date)}`;
    }
    return "Select calender";
  }, [isViewingBooking, slotCalendarTouched, selectedSlot?.date, slotLocation]);

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
  const displayedResources = React.useMemo(
    () => {
      if (viewMode === "week" || viewMode === "day") return activeResource ? [activeResource] : [];
      return filteredResources;
    },
    [activeResource, filteredResources, viewMode],
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
        | "guestPhoneCode"
        | "guestPhoneNumber"
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
        | "bookingClient"
        | "bookingPhoneCode"
        | "bookingPhoneNumber",
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

    if (slotBookingScreen === "edit-service") {
      const editErrors = getBookingServiceEditErrors(serviceEditDraft);
      if (Object.keys(editErrors).length > 0) {
        isValid = false;
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "select-services") {
      if (serviceSelectionDraft.length === 0) {
        isValid = false;
        errors.bookingClient = "Select at least one service.";
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "select-products") {
      const hasSelected = Object.values(productSelectionDraft).some((item) => item.selected);
      if (!hasSelected) {
        isValid = false;
        errors.bookingClient = "Select at least one product.";
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "add-unique-item") {
      const uniqueErrors = getUniqueItemDraftErrors(uniqueItemDraft);
      if (uniqueErrors.productName) {
        isValid = false;
        errors.uniqueItemProductName = uniqueErrors.productName;
      }
      if (uniqueErrors.price) {
        isValid = false;
        errors.uniqueItemPrice = uniqueErrors.price;
      }
      return { isValid, errors };
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
      const guestPhoneErrors = getOptionalPhoneValidationErrors(guestDraft.phoneCode, guestDraft.phoneNumber);
      if (guestPhoneErrors.countryCode) {
        isValid = false;
        errors.guestPhoneCode = guestPhoneErrors.countryCode;
      }
      if (guestPhoneErrors.phone) {
        isValid = false;
        errors.guestPhoneNumber = guestPhoneErrors.phone;
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
      const phoneErrors = getPhoneValidationErrors(nonMollureDraft.phoneCode, nonMollureDraft.phoneNumber);
      if (phoneErrors.countryCode) {
        isValid = false;
        errors.nonMollurePhoneCode = phoneErrors.countryCode;
      }
      if (phoneErrors.phone) {
        isValid = false;
        errors.nonMollurePhoneNumber = phoneErrors.phone;
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
      const companyPhoneErrors = getPhoneValidationErrors(nonMollureDraft.phoneCode, nonMollureDraft.phoneNumber);
      if (companyPhoneErrors.countryCode) {
        isValid = false;
        errors.nonMollurePhoneCode = companyPhoneErrors.countryCode;
      }
      if (companyPhoneErrors.phone) {
        isValid = false;
        errors.nonMollurePhoneNumber = companyPhoneErrors.phone;
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
    if (selectedSlot?.date && selectedSlot.date < todayIso && !editingEventId) {
      isValid = false;
      errors.bookingClient = errors.bookingClient ?? "Cannot create a booking on a past date.";
    }
    if (selectedServices.length === 0 && selectedProducts.length === 0 && guestsTotal === 0) {
      isValid = false;
      errors.bookingClient = errors.bookingClient ?? "Select at least one item/service or product.";
    }
    const bookingPhoneErrors = getOptionalPhoneValidationErrors(
      bookingPhoneDraft.phoneCode,
      bookingPhoneDraft.phoneNumber,
    );
    if (bookingPhoneErrors.countryCode) {
      isValid = false;
      errors.bookingPhoneCode = bookingPhoneErrors.countryCode;
    }
    if (bookingPhoneErrors.phone) {
      isValid = false;
      errors.bookingPhoneNumber = bookingPhoneErrors.phone;
    }
    return { isValid, errors };
  }, [
    bookingPhoneDraft.phoneCode,
    bookingPhoneDraft.phoneNumber,
    guestDraft.firstName,
    guestDraft.lastName,
    guestDraft.phoneCode,
    guestDraft.phoneNumber,
    nonMollureClientType,
    nonMollureDraft,
    selectedProducts.length,
    selectedServices.length,
    guestsTotal,
    selectedSlot?.date,
    editingEventId,
    todayIso,
    slotBookingScreen,
    slotClientAdded,
    slotDrawerTab,
    serviceSelectionDraft,
    serviceEditDraft,
    productSelectionDraft,
    uniqueItemDraft,
  ]);

  const slotErrors = React.useMemo(() => (slotSaveAttempted ? slotValidation.errors : {}), [slotSaveAttempted, slotValidation.errors]);

  const prevCandidateIso = React.useMemo(() => {
    if (viewMode === "week") return addDaysIso(activeDateIso, -7);
    if (viewMode === "month") return addMonthsIso(activeMonthIso, -1);
    return addDaysIso(activeDateIso, -1);
  }, [activeDateIso, activeMonthIso, viewMode]);

  const onToday = () => {
    setActiveDateIso(todayIso);
    setViewMode("day");
    setSelectedResourceId("");
  };

  const onPrev = () => {
    setActiveDateIso(prevCandidateIso);
  };

  const onNext = () => {
    if (viewMode === "week") setActiveDateIso(addDaysIso(activeDateIso, 7));
    else if (viewMode === "month") setActiveDateIso(addMonthsIso(activeMonthIso, 1));
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

  const timeColumnAvailability = React.useMemo(() => {
    if (viewMode !== "day" || !activeResource) return [];
    return getAvailabilityFor(activeResource.id, activeDateIso);
  }, [activeDateIso, activeResource, getAvailabilityFor, viewMode]);

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

  const renderTeamMemberHeader = () => (
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
        {filteredResources.map((resource) => {
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
                onClick={(e) => setResourceMenuAnchor(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setResourceMenuAnchor(e.currentTarget);
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
        open={Boolean(resourceMenuAnchor)}
        anchorEl={resourceMenuAnchor}
        onClose={() => setResourceMenuAnchor(null)}
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
        {filteredResources.map((resource) => {
          const isActive = resource.id === activeResource?.id;
          return (
            <ButtonBase
              key={resource.id}
              onClick={() => {
                setSelectedResourceId(resource.id);
                setResourceMenuAnchor(null);
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

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot) => {
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation("FL");
      setSlotClientAdded(false);
      setSlotCalendarOpen(false);
      setSlotCalendarTouched(false);
      setSelectedClient(null);
      setSelectedServices([]);
      setSelectedProducts([]);
      setServiceSelectionDraft([]);
      setServiceOverridesDraft({});
      setServiceEditDraft(emptyBookingServiceEditDraft());
      setServiceEditAttempted(false);
      setProductSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setCustomBookingProducts([]);
      setEditingEventId(null);
      setIsEditingExisting(false);
      setBookingGuests([]);
      setShowInlineGuestField(false);
      setBookingTotalDiscount(null);
      setBookingDiscountModalOpen(false);
      setShowLateCancellation(false);
      setLateCancellationFeePercent("");
      setShowInternalNote(false);
      setBookingInternalNote("");
      setShowPrepayment(false);
      setPrepaymentPercent("");
      setPaymentMethod("online");
      setShowKilometerAllowance(false);
      setKilometerAllowanceDraft({ eurPerKm: "", totalKilometer: "" });
      setDesiredLocationDraft(emptyDesiredLocation());
      setInlineGuestDraft({ firstName: "", lastName: "" });
      setAddMenuTarget("client");
      setSelectionTarget("client");
      setSlotAddMenuAnchor(null);
      setGuestDraft({
        firstName: "",
        lastName: "",
        email: "",
        phoneCode: "",
        phoneNumber: "",
      });
      setBookingPhoneDraft({ phoneCode: "", phoneNumber: "" });
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
      const hydration = hydrateBookingDrawerFromEvent(ev);

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
      setSlotCalendarOpen(false);
      setSlotCalendarTouched(true);
      setSlotClientSearch("");
      setSelectedClient({ name: ev.showClientName ?? "Client", email: hydration.clientEmail });
      setSelectedServices(hydration.services);
      setSelectedProducts(hydration.products);
      setServiceSelectionDraft(hydration.services.map((service) => service.id));
      setProductSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setCustomBookingProducts([]);
      setBookingGuests(hydration.guests);
      setShowInlineGuestField(false);
      setBookingPhoneDraft({ phoneCode: hydration.phoneCode, phoneNumber: hydration.phoneNumber });
      setDesiredLocationDraft(hydration.desiredLocation);
      setShowPrepayment(hydration.showPrepayment);
      setPrepaymentPercent(hydration.prepaymentPercent);
      setPaymentMethod(hydration.paymentMethod);
      setShowLateCancellation(hydration.showLateCancellation);
      setLateCancellationFeePercent(hydration.lateCancellationFeePercent);
      setShowInternalNote(hydration.showInternalNote);
      setBookingInternalNote(hydration.internalNote);
      setBookingTotalDiscount(hydration.totalDiscount);
      setBookingDiscountModalOpen(false);
      setShowKilometerAllowance(hydration.showKilometerAllowance);
      setKilometerAllowanceDraft(hydration.kilometerAllowance);
      setEditingEventId(ev.id);
      setSlotStatus(ev.status);
      setIsEditingExisting(false);
      setSlotSaveAttempted(false);
      setAddMenuTarget("client");
      setSelectionTarget("client");
      setSlotAddMenuAnchor(null);
      setBookingMoreAnchor(null);
      setSlotDrawerOpen(true);
    },
    [],
  );

  const handleDiscardBr = React.useCallback(() => {
    if (!editingEventId) return;
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId ? { ...event, status: "Invalid", bookingScenario: undefined } : event,
      ),
    );
    setSlotStatus("Invalid");
    showSnackbar({ severity: "success", message: "Booking request discarded." });
  }, [editingEventId, showSnackbar]);

  const openSelectServices = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    const currentServices =
      addMenuTarget === "client"
        ? selectedServices
        : bookingGuests.find((item) => item.id === addMenuTarget)?.services ?? [];

    setServiceOverridesDraft(
      Object.fromEntries(currentServices.map((service) => [service.id, lineItemToOverride(service)])),
    );
    setServiceSelectionDraft(currentServices.map((service) => service.id));
    setServiceEditDraft(emptyBookingServiceEditDraft());
    setServiceEditAttempted(false);
    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-services");
  }, [addMenuTarget, bookingGuests, selectedServices]);

  const openEditService = React.useCallback(
    (service: (typeof serviceCatalog)[number]) => {
      const override = serviceOverridesDraft[service.id];
      setServiceEditDraft(
        buildServiceEditDraftFromCatalog(service, {
          override,
          defaultStartTime: selectedSlot?.start,
          defaultStaffResourceId: selectedSlot?.resourceId ?? data.resources[0]?.id ?? "",
        }),
      );
      setServiceEditAttempted(false);
      setSlotBookingScreen("edit-service");
    },
    [data.resources, selectedSlot?.resourceId, selectedSlot?.start, serviceOverridesDraft, serviceCatalog],
  );

  const applyServiceEdit = React.useCallback(() => {
    const catalogService = serviceCatalog.find((service) => service.id === serviceEditDraft.serviceId);
    if (!catalogService) return false;

    const lineItem = buildBookingServiceLineItem(catalogService, serviceEditDraft);
    setServiceOverridesDraft((prev) => ({
      ...prev,
      [lineItem.id]: lineItemToOverride(lineItem),
    }));
    setServiceSelectionDraft((prev) => (prev.includes(lineItem.id) ? prev : [...prev, lineItem.id]));
    setServiceEditAttempted(false);
    setSlotBookingScreen("select-services");
    return true;
  }, [serviceCatalog, serviceEditDraft]);

  const toggleServiceSelectionDraft = React.useCallback((serviceId: string) => {
    if (isViewingExisting) return;
    setServiceSelectionDraft((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }, [isViewingExisting]);

  const applyServiceSelection = React.useCallback(() => {
    const byId = new Map(serviceCatalog.map((service) => [service.id, service]));
    const nextServices = serviceSelectionDraft
      .map((id) => {
        const catalogService = byId.get(id);
        if (!catalogService) return null;
        const override = serviceOverridesDraft[id];
        if (override) {
          return buildBookingServiceLineItem(
            catalogService,
            buildServiceEditDraftFromCatalog(catalogService, { override }),
          );
        }
        return {
          id: catalogService.id,
          name: catalogService.name,
          price: catalogService.price,
          durationMins: catalogService.durationMins,
        } satisfies BookingServiceLineItem;
      })
      .filter((service): service is BookingServiceLineItem => Boolean(service));

    if (selectionTarget === "client") {
      setSelectedServices(nextServices);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) => (guest.id === selectionTarget ? { ...guest, services: nextServices } : guest)),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [serviceCatalog, selectionTarget, serviceOverridesDraft, serviceSelectionDraft]);

  const openSelectProducts = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    const currentProducts =
      addMenuTarget === "client"
        ? selectedProducts
        : bookingGuests.find((item) => item.id === addMenuTarget)?.products ?? [];

    const customFromSelection = currentProducts
      .filter((product) => product.id.startsWith("unique-"))
      .map((product) => ({
        id: product.id,
        name: getProductBaseName(product.name, product.quantity),
        price: product.unitPrice,
      }));

    setCustomBookingProducts((prev) => {
      const merged = new Map<string, BookingCatalogProduct>();
      prev.forEach((product) => merged.set(product.id, product));
      customFromSelection.forEach((product) => merged.set(product.id, product));
      return Array.from(merged.values());
    });

    setProductSelectionDraft(() => {
      const mergedCustomMap = new Map<string, BookingCatalogProduct>();
      customBookingProducts.forEach((product) => mergedCustomMap.set(product.id, product));
      customFromSelection.forEach((product) => mergedCustomMap.set(product.id, product));

      const catalogDraft = buildProductSelectionDraftFromSelected(
        currentProducts
          .filter((product) => !product.id.startsWith("unique-"))
          .map((product) => ({ id: product.id, quantity: product.quantity })),
      );
      const customDraft = Object.fromEntries(
        Array.from(mergedCustomMap.values()).map((product) => {
          const saved = currentProducts.find((item) => item.id === product.id);
          const draftItem = productSelectionDraft[product.id];
          return [
            product.id,
            saved
              ? { selected: true, quantity: saved.quantity }
              : draftItem ?? { selected: true, quantity: 1 },
          ];
        }),
      );
      return { ...catalogDraft, ...customDraft };
    });

    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-products");
  }, [addMenuTarget, bookingGuests, customBookingProducts, productSelectionDraft, selectedProducts]);

  const toggleProductSelectionDraft = React.useCallback((productId: string) => {
    if (isViewingExisting) return;
    setProductSelectionDraft((prev) => {
      const current = prev[productId] ?? { selected: false, quantity: 1 };
      return {
        ...prev,
        [productId]: { ...current, selected: !current.selected },
      };
    });
  }, [isViewingExisting]);

  const adjustProductQuantityDraft = React.useCallback((productId: string, delta: number) => {
    if (isViewingExisting) return;
    setProductSelectionDraft((prev) => {
      const current = prev[productId] ?? { selected: false, quantity: 1 };
      if (!current.selected) return prev;
      const nextQty = Math.max(1, current.quantity + delta);
      return {
        ...prev,
        [productId]: { ...current, quantity: nextQty },
      };
    });
  }, [isViewingExisting]);

  const applyProductSelection = React.useCallback(() => {
    const catalogProducts = productCatalog
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return {
          id: product.id,
          name: formatProductLineName(product.name, quantity),
          unitPrice: product.price,
          price: product.price * quantity,
          quantity,
        };
      });

    const customProducts = customBookingProducts
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return {
          id: product.id,
          name: formatProductLineName(product.name, quantity),
          unitPrice: product.price,
          price: product.price * quantity,
          quantity,
        };
      });

    const nextProducts = [...catalogProducts, ...customProducts];

    if (selectionTarget === "client") {
      setSelectedProducts(nextProducts);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) => (guest.id === selectionTarget ? { ...guest, products: nextProducts } : guest)),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [customBookingProducts, productCatalog, productSelectionDraft, selectionTarget]);

  const openAddUniqueItem = React.useCallback(() => {
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setSlotBookingScreen("add-unique-item");
  }, []);

  const applyUniqueItem = React.useCallback(() => {
    const line = buildUniqueItemLine(uniqueItemDraft);
    if (!line) return;

    const customProduct: BookingCatalogProduct = {
      id: line.id,
      name: uniqueItemDraft.productName.trim(),
      price: line.unitPrice,
    };

    setCustomBookingProducts((prev) => [...prev, customProduct]);
    setProductSelectionDraft((prev) => ({
      ...prev,
      [line.id]: { selected: true, quantity: line.quantity },
    }));
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setSlotBookingScreen("select-products");
    setSlotSaveAttempted(false);
  }, [uniqueItemDraft]);

  const isBookingDetailsSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "add-unique-item";

  const serviceEditErrors = React.useMemo(
    () => (serviceEditAttempted ? getBookingServiceEditErrors(serviceEditDraft) : {}),
    [serviceEditAttempted, serviceEditDraft],
  );

  const addInlineGuest = React.useCallback(() => {
    const guestName = `${inlineGuestDraft.firstName.trim()} ${inlineGuestDraft.lastName.trim()}`.trim();
    if (!guestName) {
      showSnackbar({ severity: "warning", message: "Guest name is required." });
      return;
    }
    setBookingGuests((prev) => [
      ...prev,
      { id: `guest-${Date.now()}`, name: guestName, services: [], products: [] },
    ]);
    setInlineGuestDraft({ firstName: "", lastName: "" });
    setShowInlineGuestField(false);
  }, [inlineGuestDraft.firstName, inlineGuestDraft.lastName, showSnackbar]);

  const hasProductDraftSelection = React.useMemo(
    () => Object.values(productSelectionDraft).some((item) => item.selected),
    [productSelectionDraft],
  );

  const onEmptyClick = React.useCallback(
    (resourceId: string, iso: string, minutes: number) => {
      if (iso < todayIso) {
        showSnackbar({ severity: "info", message: "Cannot create a new booking on a past date." });
        return;
      }
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
        Invalid: "cancelled",
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
                  onChange={(iso) => {
                    setActiveDateIso(iso);
                    setViewMode("day");
                    setSelectedResourceId("");
                  }}
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
                if (activeDateIso < todayIso) {
                  showSnackbar({ severity: "info", message: "Cannot create a new booking on a past date." });
                  return;
                }
                const bookingDate = activeDateIso;
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
                            const eventAccent = statusAccentColor(event.status);

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
                  {slotLines.map((t, idx) => {
                    const isAvailable =
                      viewMode === "day" && timeColumnAvailability.length
                        ? isMinuteInAvailability(t, timeColumnAvailability)
                        : viewMode !== "day";
                    return (
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
                          bgcolor: isAvailable ? "#fff" : m.fxGrayF2F4F7,
                        }}
                      >
                        <BodyText sx={{ fontSize: 9.5, fontWeight: 600, color: alpha(m.navy, 0.58), lineHeight: 1 }}>
                          {fmtTimeLabel(t)}
                        </BodyText>
                      </Box>
                    );
                  })}
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
                      ? activeResource
                        ? [{ key: activeResource.id, resource: activeResource, date: activeDateIso }]
                        : []
                      : laneDates.map((date) => ({ key: date, resource: res, date }));
                    return (
                      <Box
                        key={res.id}
                        sx={{
                          borderTop: laneIdx > 0 ? `1px solid ${alpha(m.navy, 0.08)}` : undefined,
                        }}
                      >
                        {/* Lane header */}
                        {renderTeamMemberHeader()}
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
                                  bgcolor: m.fxGrayF2F4F7,
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
                                  sx={{
                                    position: "absolute",
                                    inset: 0,
                                    cursor: date < todayIso ? "default" : "pointer",
                                    zIndex: 2,
                                  }}
                                />

                                {/* Per-slot row backgrounds */}
                                {slotLines.map((t) => {
                                  const isAvailable = isMinuteInAvailability(t, availability);
                                  return (
                                    <Box
                                      key={`slot-bg-${resource.id}-${date}-${t}`}
                                      sx={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        top: ((t - startMin) / grid.stepMinutes) * rowPx,
                                        height: rowPx,
                                        bgcolor: isAvailable ? "#fff" : m.fxGrayF2F4F7,
                                        borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                                        pointerEvents: "none",
                                        zIndex: 1,
                                      }}
                                    />
                                  );
                                })}

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
                                  const cardServiceColor = cardServiceCategory ? appliedDesign.colorsByCategory[cardServiceCategory] : undefined;

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
                                      onOpenMessages={() => openBookingMessages(ev)}
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

      <MollureDrawer
        anchor="right"
        open={slotDrawerOpen}
        onClose={closeBookingDrawer}
        title={isBookingDetailsSubScreen ? "Booking Details" : ""}
        onBack={
          isBookingDetailsSubScreen
            ? () =>
                setSlotBookingScreen(
                  slotBookingScreen === "add-unique-item"
                    ? "select-products"
                    : slotBookingScreen === "edit-service"
                      ? "select-services"
                      : "new-booking",
                )
            : undefined
        }
        hideDividers
        width={{ xs: "100%", sm: 420 }}
        footer={
          selectedSlot && slotDrawerTab === "booking" ? (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                {slotBookingScreen === "new-booking" && slotClientAdded && !isViewingExisting ? (
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
                      {
                        label: "Add Discount to Total",
                        onClick: () => {
                          if (isViewingExisting) return;
                          setBookingDiscountModalOpen(true);
                        },
                      },
                      {
                        label: "Add Late Cancellation",
                        onClick: () => {
                          if (isViewingExisting) return;
                          setShowLateCancellation(true);
                        },
                      },
                      { label: "Add Late Rescheduling", onClick: () => showSnackbar({ severity: "info", message: "Add Late Rescheduling (mock)." }) },
                      {
                        label: "Add Note",
                        onClick: () => {
                          if (isViewingExisting) return;
                          setShowInternalNote(true);
                        },
                      },
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
                {slotBookingScreen === "new-booking" && editingEventId && !isCompletedBooking ? (
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
                    if (slotBookingScreen === "add-unique-item") {
                      setSlotBookingScreen("select-products");
                      return;
                    }
                    if (slotBookingScreen === "edit-service") {
                      setSlotBookingScreen("select-services");
                      return;
                    }
                    if (slotBookingScreen === "select-services" || slotBookingScreen === "select-products") {
                      setSlotBookingScreen("new-booking");
                      return;
                    }
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
                    closeBookingDrawer();
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
                {slotBookingScreen === "new-booking" && isCompletedBooking ? null : (
                <Button
                  variant="contained"
                  disableElevation
                  disabled={
                    isSaving ||
                    (slotBookingScreen === "edit-service"
                      ? isViewingExisting || !slotValidation.isValid
                      : slotBookingScreen === "select-services"
                      ? isViewingExisting || serviceSelectionDraft.length === 0
                      : slotBookingScreen === "select-products"
                        ? isViewingExisting || !hasProductDraftSelection
                        : slotBookingScreen === "add-unique-item"
                          ? isViewingExisting || !slotValidation.isValid
                          : !slotValidation.isValid || isViewingExisting)
                  }
                  onClick={() => {
                    if (isCompletedBooking) return;
                    setSlotSaveAttempted(true);
                    if (slotBookingScreen === "edit-service") {
                      if (isViewingExisting) return;
                      setServiceEditAttempted(true);
                      if (!slotValidation.isValid) return;
                      applyServiceEdit();
                      return;
                    }
                    if (slotBookingScreen === "select-services") {
                      if (isViewingExisting || serviceSelectionDraft.length === 0) return;
                      applyServiceSelection();
                      return;
                    }
                    if (slotBookingScreen === "select-products") {
                      if (isViewingExisting || !hasProductDraftSelection) return;
                      applyProductSelection();
                      return;
                    }
                    if (slotBookingScreen === "add-unique-item") {
                      if (isViewingExisting || !slotValidation.isValid) return;
                      applyUniqueItem();
                      return;
                    }
                    if (!slotValidation.isValid) return;
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      setBookingPhoneDraft({
                        phoneCode: nonMollureDraft.phoneCode,
                        phoneNumber: nonMollureDraft.phoneNumber,
                      });
                      setSlotClientAdded(true);
                      showSnackbar({ severity: "success", message: "Saved (mock)." });
                      setSlotBookingScreen("new-booking");
                      setSlotSaveAttempted(false);
                      return;
                    }
                    if (slotBookingScreen === "guest") {
                      setBookingPhoneDraft({
                        phoneCode: guestDraft.phoneCode,
                        phoneNumber: guestDraft.phoneNumber,
                      });
                      setSlotClientAdded(true);
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
                    const existingEvent = editingEventId ? events.find((event) => event.id === editingEventId) : null;

                    const isNewManualBooking = !editingEventId;
                    const nextEvent: CalendarEvent = {
                      id: editingEventId ?? `b-${Date.now()}-a`,
                      bookingCode: existingEvent?.bookingCode ?? String(Math.floor(10000 + Math.random() * 90000)),
                      resourceId: selectedSlot.resourceId,
                      date: selectedSlot.date,
                      start: selectedSlot.start,
                      end: selectedSlot.end,
                      title,
                      status: existingEvent?.status ?? "Requested",
                      location: slotLocation,
                      bookingType: existingEvent?.bookingType ?? "Requests",
                      bookingScenario: existingEvent?.bookingScenario ?? "BR",
                      showClientName: clientName || "Client",
                      details: buildBookingDetailsSnapshot({
                        selectedClient,
                        selectedServices,
                        selectedProducts,
                        bookingGuests,
                        bookingPhoneDraft,
                        desiredLocationDraft,
                        showPrepayment,
                        prepaymentPercent,
                        paymentMethod,
                        showLateCancellation,
                        lateCancellationFeePercent,
                        showInternalNote,
                        bookingInternalNote,
                        bookingTotalDiscount,
                        showKilometerAllowance,
                        kilometerAllowanceDraft,
                      }),
                    };

                    setEvents((prev) => {
                      if (!editingEventId) return [...prev, nextEvent];
                      return prev.map((e) => (e.id === editingEventId ? nextEvent : e));
                    });
                    showSnackbar({
                      severity: "success",
                      message: editingEventId ? "Booking updated." : "Booking request sent to client.",
                    });
                    setSlotSaveAttempted(false);
                    if (isNewManualBooking) {
                      setEditingEventId(nextEvent.id);
                      setSlotStatus("Requested");
                      setIsEditingExisting(false);
                    } else if (editingEventId) {
                      setIsEditingExisting(false);
                    }
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
                )}
              </Stack>
            </Box>
          ) : null
        }
      >
        <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5 }}>
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
                  const disabled = !isViewingBooking && t.id !== "booking";
                  return (
                    <Box
                      key={t.id}
                      role={disabled ? undefined : "button"}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => {
                        if (disabled) return;
                        setSlotDrawerTab(t.id);
                      }}
                      onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter" || e.key === " ") setSlotDrawerTab(t.id);
                      }}
                      sx={{
                        textAlign: "center",
                        py: 1.25,
                        cursor: disabled ? "default" : "pointer",
                        position: "relative",
                        userSelect: "none",
                        color: active ? m.teal : disabled ? alpha(m.navy, 0.32) : alpha(m.navy, 0.55),
                        fontWeight: 900,
                        fontSize: 13.5,
                        pointerEvents: disabled ? "none" : "auto",
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
                slotBookingScreen === "select-services" ? (
                  <BookingSelectServicesScreen
                    selectedIds={serviceSelectionDraft}
                    serviceOverrides={serviceOverridesDraft}
                    onToggle={(service) => toggleServiceSelectionDraft(service.id)}
                    onEdit={(service) => openEditService(service)}
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "edit-service" ? (
                  <BookingEditServiceScreen
                    draft={serviceEditDraft}
                    staffOptions={data.resources}
                    errors={serviceEditErrors}
                    onChange={(patch) => setServiceEditDraft((prev) => ({ ...prev, ...patch }))}
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "select-products" ? (
                  <BookingSelectProductsScreen
                    draft={productSelectionDraft}
                    customProducts={customBookingProducts}
                    onToggle={(product) => toggleProductSelectionDraft(product.id)}
                    onQuantityChange={adjustProductQuantityDraft}
                    onAddProduct={isViewingExisting ? undefined : openAddUniqueItem}
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "add-unique-item" ? (
                  <BookingAddUniqueItemScreen
                    draft={uniqueItemDraft}
                    errors={{
                      productName: slotErrors.uniqueItemProductName,
                      price: slotErrors.uniqueItemPrice,
                    }}
                    onChange={(patch) => setUniqueItemDraft((prev) => ({ ...prev, ...patch }))}
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "add-client-choice" ? (
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
                        <ButtonBase
                          onClick={() => {
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
                            width: "100%",
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            borderRadius: "10px",
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 1.25,
                            px: 1.5,
                            bgcolor: "#fff",
                            transition: "border-color 0.15s, background-color 0.15s",
                            "&:hover": { bgcolor: alpha(m.navy, 0.02), borderColor: m.teal },
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "999px",
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              border: `1px solid ${alpha(m.teal, 0.22)}`,
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <BodyText
                            component="span"
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.72),
                              lineHeight: 1,
                              textAlign: "left",
                            }}
                          >
                            {item.label}
                          </BodyText>
                        </ButtonBase>

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
                      options={[...GENDER_OPTIONS]}
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

                    <AppCountryPhoneFields
                      countryCode={nonMollureDraft.phoneCode}
                      phone={nonMollureDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) => setNonMollureDraft((p) => ({ ...p, phoneCode: dialCode }))}
                      onPhoneChange={(phone) => setNonMollureDraft((p) => ({ ...p, phoneNumber: phone }))}
                      countryCodeError={slotErrors.nonMollurePhoneCode}
                      phoneError={slotErrors.nonMollurePhoneNumber}
                      phonePlaceholder="+442xxxxxxxxxx"
                    />

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
                      options={[...GENDER_OPTIONS]}
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

                    <AppCountryPhoneFields
                      countryCode={nonMollureDraft.phoneCode}
                      phone={nonMollureDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) => setNonMollureDraft((p) => ({ ...p, phoneCode: dialCode }))}
                      onPhoneChange={(phone) => setNonMollureDraft((p) => ({ ...p, phoneNumber: phone }))}
                      countryCodeError={slotErrors.nonMollurePhoneCode}
                      phoneError={slotErrors.nonMollurePhoneNumber}
                      phonePlaceholder="+442xxxxxxxxxx"
                    />

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

                    <AppCountryPhoneFields
                      countryCode={guestDraft.phoneCode}
                      phone={guestDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) => setGuestDraft((p) => ({ ...p, phoneCode: dialCode }))}
                      onPhoneChange={(phone) => setGuestDraft((p) => ({ ...p, phoneNumber: phone }))}
                      countryCodeError={slotErrors.guestPhoneCode}
                      phoneError={slotErrors.guestPhoneNumber}
                      label="Contact Number (optional)"
                      phonePlaceholder="Phone number"
                      required={false}
                    />

                    <Box sx={{ flex: 1, minHeight: 200 }} />
                  </Stack>
                ) : (
                  <Stack spacing={1.6}>
                    {isViewingBooking && viewingBookingEvent ? (
                      <Box>
                        <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 16, letterSpacing: "-0.01em" }}>
                          Booking Details
                        </BodyText>

                        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                          <Box>
                            <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                              Booking ID
                            </BodyText>
                            <Box
                              sx={{
                                width: "100%",
                                border: `1px solid ${alpha(m.navy, 0.14)}`,
                                borderRadius: "10px",
                                minHeight: 40,
                                px: 1.5,
                                display: "flex",
                                alignItems: "center",
                                bgcolor: alpha(m.navy, 0.02),
                              }}
                            >
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.45) }}>
                                {viewingBookingEvent.bookingCode ?? extractBookingId(viewingBookingEvent.id)}
                              </BodyText>
                            </Box>
                          </Box>

                          <Box>
                            <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                              Status
                            </BodyText>
                            <Box
                              sx={{
                                width: "100%",
                                border: `1px solid ${alpha(m.navy, 0.14)}`,
                                borderRadius: "10px",
                                minHeight: 40,
                                px: 1.25,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                flexWrap: "wrap",
                                bgcolor: "#fff",
                              }}
                            >
                              <Chip
                                size="small"
                                label={viewingBookingEvent.status}
                                sx={{
                                  height: 24,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  border: "1px solid",
                                  "& .MuiChip-label": { px: 1 },
                                  ...statusChipSx(viewingBookingEvent.status, m),
                                }}
                              />
                              {getBookingScenarioIndicators(viewingBookingEvent).map((indicator) => {
                                const responseIndicators = resolveBookingResponseIndicators(viewingBookingEvent);
                                const prepayment = resolveCalendarPrepaymentStatus(viewingBookingEvent);
                                const prepaymentVariant = prepayment ? toPrepaymentIconVariant(prepayment) : undefined;
                                const badgeResponses =
                                  indicator === "EBR"
                                    ? responseIndicators
                                    : indicator === "ER" || indicator === "E"
                                      ? responseIndicators.filter((item) => item === "overdue_response")
                                      : [];

                                return (
                                  <Tooltip key={indicator} title={BOOKING_SCENARIO_LABELS[indicator]} placement="top">
                                    <Chip
                                      size="small"
                                      label={
                                        <Stack direction="row" alignItems="center" spacing={0.35}>
                                          <span>{indicator}</span>
                                          {indicator === "BR" ? (
                                            <Tooltip title={BOOKING_REQUEST_SENT_LABEL} placement="top">
                                              <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
                                                <BookingRequestSentIcon size={12} />
                                              </Box>
                                            </Tooltip>
                                          ) : null}
                                          {badgeResponses.map((item) => (
                                            <Tooltip key={item} title={BOOKING_INDICATOR_LABELS[item]} placement="top">
                                              <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
                                                <BookingIndicatorIcon variant={item} size={18} />
                                              </Box>
                                            </Tooltip>
                                          ))}
                                          {indicator === "ER" ? <OpenInNewRoundedIcon sx={{ fontSize: 12 }} /> : null}
                                          {indicator === "EBR" && prepaymentVariant && prepaymentVariant !== "pending" ? (
                                            <PrepaymentStatusIcon variant={prepaymentVariant} size={18} />
                                          ) : null}
                                        </Stack>
                                      }
                                      sx={{
                                        height: 24,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        bgcolor: alpha(m.navy, 0.06),
                                        color: alpha(m.navy, 0.62),
                                        border: `1px solid ${alpha(m.navy, 0.14)}`,
                                        "& .MuiChip-label": { px: 0.85 },
                                      }}
                                    />
                                  </Tooltip>
                                );
                              })}
                              {(() => {
                                const scenarioIndicators = getBookingScenarioIndicators(viewingBookingEvent);
                                const responseIndicators = resolveBookingResponseIndicators(viewingBookingEvent);
                                const prepayment = resolveCalendarPrepaymentStatus(viewingBookingEvent);
                                const hasBr = scenarioIndicators.includes("BR");

                                if (scenarioIndicators.length && !hasBr) {
                                  if (!responseIndicators.includes("overdue_response")) return null;
                                  if (scenarioIndicators.some((indicator) => indicator === "ER" || indicator === "E")) {
                                    return null;
                                  }
                                }

                                const standaloneResponses = hasBr
                                  ? responseIndicators
                                  : scenarioIndicators.length === 0
                                    ? responseIndicators
                                    : [];

                                const standalonePrepayment =
                                  prepayment && (scenarioIndicators.length === 0 || hasBr) ? prepayment : undefined;

                                if (!standaloneResponses.length && !standalonePrepayment) return null;

                                return (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    {standaloneResponses.map((item) => (
                                      <Tooltip key={item} title={BOOKING_INDICATOR_LABELS[item]} placement="top">
                                        <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
                                          <BookingIndicatorIcon variant={item} size={18} />
                                        </Box>
                                      </Tooltip>
                                    ))}
                                    {standalonePrepayment ? (
                                      <Tooltip
                                        title={PREPAYMENT_STATUS_LABELS[toPrepaymentIconVariant(standalonePrepayment)]}
                                        placement="top"
                                      >
                                        <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
                                          <PrepaymentStatusIcon
                                            variant={toPrepaymentIconVariant(standalonePrepayment)}
                                            size={18}
                                          />
                                        </Box>
                                      </Tooltip>
                                    ) : null}
                                  </Stack>
                                );
                              })()}
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    ) : (
                      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 16, letterSpacing: "-0.01em" }}>
                        New Booking
                      </BodyText>
                    )}

                    {/* Calendar selector */}
                    <Box>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), mb: 0.75 }}>
                        Calendar
                      </BodyText>
                      <ButtonBase
                        onClick={() => {
                          if (isViewingExisting) return;
                          setSlotCalendarOpen((prev) => !prev);
                        }}
                        disabled={isViewingExisting}
                        sx={{
                          width: "100%",
                          border: `1px solid ${alpha(m.navy, 0.14)}`,
                          borderRadius: "10px",
                          minHeight: 40,
                          px: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          bgcolor: isViewingExisting ? alpha(m.navy, 0.02) : "#fff",
                          textAlign: "left",
                          cursor: isViewingExisting ? "default" : "pointer",
                          transition: "border-color 0.15s",
                          "&:hover": {
                            borderColor: isViewingExisting ? alpha(m.navy, 0.14) : m.teal,
                          },
                        }}
                      >
                        <BodyText
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color:
                              isViewingBooking || slotCalendarTouched
                                ? alpha(m.navy, 0.74)
                                : alpha(m.navy, 0.45),
                          }}
                        >
                          {calendarFieldLabel}
                        </BodyText>
                        <KeyboardArrowDownRoundedIcon
                          sx={{
                            fontSize: 18,
                            color: slotCalendarOpen ? m.teal : alpha(m.navy, 0.45),
                            transform: slotCalendarOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                            flexShrink: 0,
                          }}
                        />
                      </ButtonBase>

                      {slotCalendarOpen ? (
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
                                      setSlotCalendarTouched(true);
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
                                onChange={(iso) => {
                                  setSelectedSlot((p) => (p ? { ...p, date: iso } : p));
                                  setSlotCalendarTouched(true);
                                }}
                                min={isViewingBooking ? undefined : todayIso}
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
                        <ButtonBase
                          onClick={() => setSlotBookingScreen("add-client-choice")}
                          sx={{
                            width: "100%",
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            borderRadius: "10px",
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 1.25,
                            px: 1.5,
                            bgcolor: "#fff",
                            transition: "border-color 0.15s, background-color 0.15s",
                            "&:hover": { bgcolor: alpha(m.navy, 0.02), borderColor: m.teal },
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "999px",
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              border: `1px solid ${alpha(m.teal, 0.22)}`,
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <BodyText
                            component="span"
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.72),
                              lineHeight: 1,
                            }}
                          >
                            Add Client
                          </BodyText>
                        </ButtonBase>
                      )}
                      {slotErrors.bookingClient ? (
                        <BodyText sx={{ mt: 0.6, fontSize: 11.5, fontWeight: 800, color: theme.palette.error.main }}>
                          {slotErrors.bookingClient}
                        </BodyText>
                      ) : null}
                    </Box>

                    {slotClientAdded ? (
                      <>
                        <ButtonBase
                          ref={addMenuButtonRef}
                          disabled={isViewingExisting}
                          onClick={(e) => {
                            const el = e.currentTarget;
                            if (slotAddMenuAnchor && addMenuTarget === "client") {
                              setSlotAddMenuAnchor(null);
                              return;
                            }
                            setAddMenuTarget("client");
                            setSlotAddMenuAnchor(el);
                          }}
                          aria-label="Add menu"
                          sx={{
                            width: "100%",
                            maxWidth: 220,
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            borderRadius: "10px",
                            height: 44,
                            px: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.25,
                            bgcolor: "#fff",
                            textAlign: "left",
                            transition: "border-color 0.15s, background-color 0.15s",
                            "&:hover": {
                              bgcolor: isViewingExisting ? "#fff" : alpha(m.navy, 0.02),
                              borderColor: isViewingExisting ? alpha(m.navy, 0.14) : m.teal,
                            },
                            "&.Mui-disabled": {
                              opacity: 0.55,
                              cursor: "not-allowed",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "999px",
                                bgcolor: alpha(m.teal, 0.12),
                                color: m.teal,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                border: `1px solid ${alpha(m.teal, 0.22)}`,
                              }}
                            >
                              <AddRoundedIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <BodyText
                              component="span"
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.72),
                                lineHeight: 1,
                              }}
                            >
                              Add
                            </BodyText>
                          </Box>
                          <KeyboardArrowDownRoundedIcon
                            sx={{
                              fontSize: 18,
                              color: slotAddMenuAnchor && addMenuTarget === "client" ? m.teal : alpha(m.navy, 0.45),
                              flexShrink: 0,
                              transform: slotAddMenuAnchor && addMenuTarget === "client" ? "rotate(180deg)" : "none",
                              transition: "transform 0.15s, color 0.15s",
                            }}
                          />
                        </ButtonBase>

                        <Popover
                          open={Boolean(slotAddMenuAnchor)}
                          anchorEl={slotAddMenuAnchor}
                          onClose={() => setSlotAddMenuAnchor(null)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                          transformOrigin={{ vertical: "top", horizontal: "left" }}
                          slotProps={{
                            paper: {
                              sx: {
                                mt: 0.75,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.10)}`,
                                boxShadow: "0 10px 24px rgba(16, 35, 63, 0.12)",
                                overflow: "hidden",
                                width: slotAddMenuAnchor?.offsetWidth ?? addMenuButtonRef.current?.offsetWidth ?? 220,
                              },
                            },
                          }}
                        >
                          <Stack sx={{ py: 0.5 }}>
                            <ButtonBase
                              onClick={() => {
                                setSlotAddMenuAnchor(null);
                                openSelectServices();
                              }}
                              sx={{
                                width: "100%",
                                textAlign: "left",
                                px: 1.5,
                                py: 1.1,
                                display: "block",
                                "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                              }}
                            >
                              <BodyText
                                component="span"
                                sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72), lineHeight: 1 }}
                              >
                                Services
                              </BodyText>
                            </ButtonBase>
                            <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.08), mx: 1 }} />
                            <ButtonBase
                              onClick={() => {
                                setSlotAddMenuAnchor(null);
                                openSelectProducts();
                              }}
                              sx={{
                                width: "100%",
                                textAlign: "left",
                                px: 1.5,
                                py: 1.1,
                                display: "block",
                                "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                              }}
                            >
                              <BodyText
                                component="span"
                                sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72), lineHeight: 1 }}
                              >
                                Product/Items
                              </BodyText>
                            </ButtonBase>
                          </Stack>
                        </Popover>

                        {selectedServices.length > 0 ? (
                          <Stack spacing={0.75}>
                            {selectedServices.map((service) => (
                              <Box
                                key={service.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                  borderRadius: "10px",
                                  border: `1px solid ${alpha(m.navy, 0.10)}`,
                                  px: 1.25,
                                  py: 1.1,
                                  bgcolor: "#fff",
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
                                    {service.name}
                                  </BodyText>
                                  <BodyText sx={{ mt: 0.35, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
                                    {service.startTime || service.discount
                                      ? formatBookingServiceLineMeta(service)
                                      : formatBookingServiceMeta(service)}
                                  </BodyText>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (isViewingExisting) return;
                                    setSelectedServices((prev) => prev.filter((item) => item.id !== service.id));
                                  }}
                                  sx={{ color: alpha(m.navy, 0.35) }}
                                  aria-label={`Remove ${service.name}`}
                                  disabled={isViewingExisting}
                                >
                                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        ) : null}

                        {selectedProducts.length > 0 ? (
                          <Stack spacing={0.75}>
                            {selectedProducts.map((product) => (
                              <Box
                                key={product.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                  borderRadius: "10px",
                                  border: `1px solid ${alpha(m.navy, 0.10)}`,
                                  px: 1.25,
                                  py: 1.1,
                                  bgcolor: "#fff",
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
                                    {product.name}
                                  </BodyText>
                                  <BodyText sx={{ mt: 0.35, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
                                    {formatProductUnitPrice(product.price)}
                                  </BodyText>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (isViewingExisting) return;
                                    setSelectedProducts((prev) => prev.filter((item) => item.id !== product.id));
                                  }}
                                  sx={{ color: alpha(m.navy, 0.35) }}
                                  aria-label={`Remove ${product.name}`}
                                  disabled={isViewingExisting}
                                >
                                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        ) : null}

                        {bookingGuests.map((guest) => (
                          <Box
                            key={guest.id}
                            sx={{
                              borderRadius: "12px",
                              bgcolor: alpha(m.teal, 0.06),
                              border: `1px solid ${alpha(m.teal, 0.14)}`,
                              p: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.10)}`,
                                px: 1.25,
                                py: 1,
                                bgcolor: "#fff",
                                mb: 1,
                              }}
                            >
                              <BodyText sx={{ fontSize: 12.5, lineHeight: 1.25 }}>
                                <Box component="span" sx={{ fontWeight: 700, color: alpha(m.navy, 0.52) }}>
                                  Guest:{" "}
                                </Box>
                                <Box component="span" sx={{ fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                                  {guest.name}
                                </Box>
                              </BodyText>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  setBookingGuests((prev) => prev.filter((item) => item.id !== guest.id));
                                  if (addMenuTarget === guest.id) setSlotAddMenuAnchor(null);
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label={`Remove ${guest.name}`}
                                disabled={isViewingExisting}
                              >
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Box>

                            {guest.services.length > 0 ? (
                              <Stack spacing={0.75} sx={{ mb: guest.products.length > 0 ? 0.75 : 1 }}>
                                {guest.services.map((service) => (
                                  <Box
                                    key={service.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 1,
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                                      px: 1.25,
                                      py: 1.1,
                                      bgcolor: "#fff",
                                    }}
                                  >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
                                        {service.name}
                                      </BodyText>
                                      <BodyText sx={{ mt: 0.35, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
                                        {service.startTime || service.discount
                                          ? formatBookingServiceLineMeta(service)
                                          : formatBookingServiceMeta(service)}
                                      </BodyText>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (isViewingExisting) return;
                                        setBookingGuests((prev) =>
                                          prev.map((item) =>
                                            item.id === guest.id
                                              ? { ...item, services: item.services.filter((svc) => svc.id !== service.id) }
                                              : item,
                                          ),
                                        );
                                      }}
                                      sx={{ color: alpha(m.navy, 0.35) }}
                                      aria-label={`Remove ${service.name}`}
                                      disabled={isViewingExisting}
                                    >
                                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Stack>
                            ) : null}

                            {guest.products.length > 0 ? (
                              <Stack spacing={0.75} sx={{ mb: 1 }}>
                                {guest.products.map((product) => (
                                  <Box
                                    key={product.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 1,
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                                      px: 1.25,
                                      py: 1.1,
                                      bgcolor: "#fff",
                                    }}
                                  >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
                                        {product.name}
                                      </BodyText>
                                      <BodyText sx={{ mt: 0.35, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
                                        {formatProductUnitPrice(product.price)}
                                      </BodyText>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (isViewingExisting) return;
                                        setBookingGuests((prev) =>
                                          prev.map((item) =>
                                            item.id === guest.id
                                              ? { ...item, products: item.products.filter((prd) => prd.id !== product.id) }
                                              : item,
                                          ),
                                        );
                                      }}
                                      sx={{ color: alpha(m.navy, 0.35) }}
                                      aria-label={`Remove ${product.name}`}
                                      disabled={isViewingExisting}
                                    >
                                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Stack>
                            ) : null}

                            <ButtonBase
                              disabled={isViewingExisting}
                              onClick={(e) => {
                                const el = e.currentTarget;
                                if (slotAddMenuAnchor && addMenuTarget === guest.id) {
                                  setSlotAddMenuAnchor(null);
                                  return;
                                }
                                setAddMenuTarget(guest.id);
                                setSlotAddMenuAnchor(el);
                              }}
                              aria-label={`Add items for ${guest.name}`}
                              sx={{
                                width: "100%",
                                maxWidth: 220,
                                border: `1px solid ${alpha(m.navy, 0.14)}`,
                                borderRadius: "10px",
                                height: 44,
                                px: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1.25,
                                bgcolor: "#fff",
                                textAlign: "left",
                                transition: "border-color 0.15s, background-color 0.15s",
                                "&:hover": {
                                  bgcolor: isViewingExisting ? "#fff" : alpha(m.navy, 0.02),
                                  borderColor: isViewingExisting ? alpha(m.navy, 0.14) : m.teal,
                                },
                                "&.Mui-disabled": {
                                  opacity: 0.55,
                                  cursor: "not-allowed",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "999px",
                                    bgcolor: alpha(m.teal, 0.12),
                                    color: m.teal,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    border: `1px solid ${alpha(m.teal, 0.22)}`,
                                  }}
                                >
                                  <AddRoundedIcon sx={{ fontSize: 16 }} />
                                </Box>
                                <BodyText
                                  component="span"
                                  sx={{
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    color: alpha(m.navy, 0.72),
                                    lineHeight: 1,
                                  }}
                                >
                                  Add
                                </BodyText>
                              </Box>
                              <KeyboardArrowDownRoundedIcon
                                sx={{
                                  fontSize: 18,
                                  color: slotAddMenuAnchor && addMenuTarget === guest.id ? m.teal : alpha(m.navy, 0.45),
                                  flexShrink: 0,
                                  transform: slotAddMenuAnchor && addMenuTarget === guest.id ? "rotate(180deg)" : "none",
                                  transition: "transform 0.15s, color 0.15s",
                                }}
                              />
                            </ButtonBase>
                          </Box>
                        ))}

                        {showInlineGuestField ? (
                          <Box
                            sx={{
                              borderRadius: "12px",
                              bgcolor: alpha(m.navy, 0.025),
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              p: 1.5,
                            }}
                          >
                            <BodyText sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82), mb: 1.25 }}>
                              Guest
                            </BodyText>
                            <Stack direction="row" spacing={1.25} sx={{ mb: 1.25 }}>
                              <AppTextField
                                placeholder="First Name*"
                                value={inlineGuestDraft.firstName}
                                onChange={(e) => setInlineGuestDraft((prev) => ({ ...prev, firstName: e.target.value }))}
                                fullWidth
                                disabled={isViewingExisting}
                              />
                              <AppTextField
                                placeholder="Last Name*"
                                value={inlineGuestDraft.lastName}
                                onChange={(e) => setInlineGuestDraft((prev) => ({ ...prev, lastName: e.target.value }))}
                                fullWidth
                                disabled={isViewingExisting}
                              />
                            </Stack>
                            <Button
                              variant="contained"
                              disableElevation
                              onClick={addInlineGuest}
                              disabled={isViewingExisting}
                              sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 900,
                                height: 38,
                                bgcolor: m.teal,
                                "&:hover": { bgcolor: m.tealDark },
                                minWidth: 96,
                              }}
                            >
                              Add
                            </Button>
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

                        <AppCountryPhoneFields
                          countryCode={bookingPhoneDraft.phoneCode}
                          phone={bookingPhoneDraft.phoneNumber}
                          onCountryCodeChange={(dialCode) =>
                            setBookingPhoneDraft((p) => ({ ...p, phoneCode: dialCode }))
                          }
                          onPhoneChange={(phone) => setBookingPhoneDraft((p) => ({ ...p, phoneNumber: phone }))}
                          countryCodeError={slotErrors.bookingPhoneCode}
                          phoneError={slotErrors.bookingPhoneNumber}
                          phonePlaceholder="+442xxxxxxxxxx"
                          required={false}
                          disabled={isViewingExisting}
                        />

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
                            gap: 1.5,
                          }}
                        >
                          <BodyText sx={{ fontSize: 16, fontWeight: 950, color: alpha(m.navy, 0.78), flexShrink: 0 }}>
                            Total Price:
                          </BodyText>
                          {bookingDiscountAmount > 0 && bookingTotalDiscount ? (
                            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <BodyText
                                sx={{
                                  fontSize: 16,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.42),
                                  textDecoration: "line-through",
                                  lineHeight: 1.2,
                                }}
                              >
                                {subtotalPrice}€
                              </BodyText>
                              <BodyText sx={{ fontSize: 18, fontWeight: 950, color: alpha(m.navy, 0.9), lineHeight: 1.2 }}>
                                {totalPrice}€
                              </BodyText>
                              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: m.teal, lineHeight: 1.2 }}>
                                {bookingTotalDiscount.type === "percentage"
                                  ? `${bookingTotalDiscount.amount}% Discount`
                                  : `${formatManualEntryDiscountLabel(bookingTotalDiscount)} Discount`}
                              </BodyText>
                            </Stack>
                          ) : (
                            <BodyText sx={{ fontSize: 18, fontWeight: 950, color: alpha(m.navy, 0.9) }}>€{totalPrice}</BodyText>
                          )}
                        </Box>

                        {isViewingBooking && canDiscardBookingRequest(viewingBookingEvent) ? (
                          <ButtonBase
                            onClick={() => setDiscardBrOpen(true)}
                            sx={{
                              width: "100%",
                              borderRadius: "10px",
                              border: `1px solid ${alpha(m.navy, 0.12)}`,
                              bgcolor: alpha(m.navy, 0.04),
                              minHeight: 44,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.75,
                              color: alpha(m.navy, 0.68),
                              transition: "background-color 0.15s, border-color 0.15s",
                              "&:hover": {
                                bgcolor: alpha(m.navy, 0.07),
                                borderColor: alpha(m.navy, 0.18),
                              },
                            }}
                          >
                            <CloseRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
                            <BodyText sx={{ fontSize: 13, fontWeight: 800, color: "inherit" }}>Discard BR</BodyText>
                          </ButtonBase>
                        ) : null}

                        {showLateCancellation ? (
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
                                Late Cancellation
                              </BodyText>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  setShowLateCancellation(false);
                                  setLateCancellationFeePercent("");
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove late cancellation"
                                disabled={isViewingExisting}
                              >
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Stack>

                            <BodyText sx={{ mt: 0.5, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.35 }}>
                              1 Min Past Required 24h Notice
                            </BodyText>

                            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1.25 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 52 }}>
                                <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.62) }}>Fee</BodyText>
                                <InfoOutlinedIcon sx={{ fontSize: 15, color: m.teal }} />
                              </Stack>
                              <AppTextField
                                placeholder="%"
                                value={lateCancellationFeePercent}
                                onChange={(e) => setLateCancellationFeePercent(e.target.value)}
                                disabled={isViewingExisting}
                                sx={{ width: 72, flexShrink: 0 }}
                              />
                              <BodyText
                                sx={{
                                  flex: 1,
                                  textAlign: "right",
                                  fontSize: 16,
                                  fontWeight: 950,
                                  color: alpha(m.navy, 0.85),
                                }}
                              >
                                €{lateCancellationFeeAmount}
                              </BodyText>
                            </Stack>
                          </Box>
                        ) : null}

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

                        {showInternalNote ? (
                          <Box>
                            <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), mb: 0.75 }}>
                              Internal Note
                            </BodyText>
                            <AppTextField
                              placeholder="Description"
                              value={bookingInternalNote}
                              onChange={(e) => setBookingInternalNote(e.target.value)}
                              disabled={isViewingExisting}
                              multiline
                              minRows={4}
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: "#fff",
                                  borderRadius: "10px",
                                },
                              }}
                            />
                            <Box sx={{ mt: 1.5, borderTop: `1px solid ${alpha(m.navy, 0.1)}` }} />
                          </Box>
                        ) : null}

                        <Box sx={{ borderRadius: "10px", bgcolor: alpha(m.navy, 0.025), p: 1.5 }}>
                          <ButtonBase
                            onClick={() => {
                              if (isViewingExisting || showInlineGuestField) return;
                              setShowInlineGuestField(true);
                            }}
                            disabled={isViewingExisting || showInlineGuestField}
                            sx={{
                              border: `1px solid ${alpha(m.navy, 0.14)}`,
                              borderRadius: "10px",
                              height: 44,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: 1.25,
                              px: 1.5,
                              bgcolor: "#fff",
                              transition: "border-color 0.15s, background-color 0.15s",
                              "&:hover": {
                                bgcolor: isViewingExisting || showInlineGuestField ? "#fff" : alpha(m.navy, 0.02),
                              },
                              "&.Mui-disabled": {
                                opacity: 0.55,
                                cursor: "not-allowed",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "999px",
                                bgcolor: alpha(m.navy, 0.06),
                                color: alpha(m.navy, 0.45),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <AddRoundedIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <BodyText
                              component="span"
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.6),
                                lineHeight: 1,
                              }}
                            >
                              Guest
                            </BodyText>
                          </ButtonBase>
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
      <ManualEntryDiscountModal
        open={bookingDiscountModalOpen}
        initialValue={bookingTotalDiscount}
        onClose={() => setBookingDiscountModalOpen(false)}
        onApply={(discount) => {
          setBookingTotalDiscount(discount.amount > 0 ? discount : null);
          showSnackbar({ severity: "success", message: "Discount applied." });
        }}
      />
      <DiscardBrDialog open={discardBrOpen} onClose={() => setDiscardBrOpen(false)} onConfirm={handleDiscardBr} />
    </Stack>
  );
}

