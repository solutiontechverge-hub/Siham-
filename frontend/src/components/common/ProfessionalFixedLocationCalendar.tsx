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
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Avatar, Box, Button, ButtonBase, Chip, Divider, IconButton, Menu, MenuItem, Paper, Popover, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import { useSnackbar } from "./AppSnackbar";
import { getApiErrorMessage } from "../../lib/api-error";
import AppPillTabs from "./AppPillTabs";
import MollureDrawer from "./MollureDrawer";
import AppSearchField from "./AppSearchField";
import AppDatePicker from "./AppDatePicker";
import { AppCalendarPanel } from "./AppDatePicker";
import AppTextField from "./AppTextField";
import AppCountryPhoneFields from "./AppCountryPhoneFields";
import AppDropdown from "./AppDropdown";
import CalendarAddMenu from "./calendar/CalendarAddMenu";
import CalendarNoShowModal from "./calendar/CalendarNoShowModal";
import CalendarCancelBookingModal from "./calendar/CalendarCancelBookingModal";
import CalendarBookingActionConfirmDialog, {
  type CalendarBookingAction,
} from "./calendar/CalendarBookingActionConfirmDialog";
import CalendarBookingCard from "./calendar/CalendarBookingCard";
import BookingEditedTag from "./calendar/BookingEditedTag";
import CalendarBookingTicketStack from "./calendar/CalendarBookingTicketStack";
import { clusterSameStartTimeEvents, getClusterTimeBounds } from "./calendar/calendar-overlap.utils";
import { useMessagingWidget } from "./messaging/MessagingWidgetContext";
import {
  buildBookingDetailsSnapshot,
  clearEbrSuggestionsFromNotes,
  markClientEbrAcceptedInNotes,
  markClientEbrRejectedInNotes,
  emptyDesiredLocation,
  hydrateBookingDrawerFromEvent,
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  serializeCalendarEntryNotes,
} from "./calendar/bookingEventDetails";
import {
  canDiscardEbr,
  canRespondToIncomingRequest,
  detectEditedServiceIds,
  getServiceEditTag,
  isClientOriginatedBooking,
  resolveOriginalServices,
} from "./calendar/bookingRequestNegotiation";
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
import ManualEntryDiscountModal from "../sections/finance/ManualEntryDiscountModal";
import {
  calculateManualEntryDiscountAmount,
  formatManualEntryDiscountLabel,
  type ManualEntryDiscount,
} from "../sections/finance/manualEntry.data";
import BookingSelectServicesScreen from "./calendar/BookingSelectServicesScreen";
import DiscardBrDialog from "./calendar/DiscardBrDialog";
import DiscardEbrDialog from "./calendar/DiscardEbrDialog";
import BookingRequestConfirmDialog from "./calendar/BookingRequestConfirmDialog";
import BookingRequestResponseActions from "./calendar/BookingRequestResponseActions";
import BookingDrawerSelectedItemsSection from "./calendar/BookingDrawerSelectedItemsSection";
import BookingDrawerClientSnapshotSection from "./calendar/BookingDrawerClientSnapshotSection";
import BookingActivityOverview from "./calendar/BookingActivityOverview";
import { buildBookingActivityTimeline } from "./calendar/buildBookingActivityTimeline";
import type { BookingActivityItem } from "./calendar/bookingActivity.types";
import SalesOverview from "./calendar/SalesOverview";
import BookingEditServiceScreen from "./calendar/BookingEditServiceScreen";
import BookingSelectProductsScreen from "./calendar/BookingSelectProductsScreen";
import BookingAddUniqueItemScreen from "./calendar/BookingAddUniqueItemScreen";
import { professionalSuggestBookingChanges } from "./client-booking/bookingEditRequest";
import { useCalendarFilters } from "./calendar/useCalendarFilters";
import type { BookingCatalogService } from "../../data/bookingServiceCatalog.data";
import {
  allBookingCatalogServices,
  bookingServiceCatalog,
  formatBookingServiceMeta,
} from "../../data/bookingServiceCatalog.data";
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
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityIntervals,
  makeScheduleRowId,
} from "./calendar/calendar-schedule.utils";
import {
  defaultBookingRules,
  normalizeServiceOrderSettings,
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
  getCalendarQueryDateRange,
  type CalendarQueryDateRange,
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
  isBookingRequestAccepted,
  statusAccentColor,
} from "./calendar/bookingStatus";
import BookingRequestAcceptedPanel from "./calendar/BookingRequestAcceptedPanel";
import PrepaymentStatusIcon from "./calendar/PrepaymentStatusIcon";
import { PREPAYMENT_STATUS_LABELS } from "./calendar/PrepaymentStatusIcon";
import BookingIndicatorIcon, { BOOKING_INDICATOR_LABELS } from "./calendar/BookingIndicatorIcon";
import BookingRequestBadge, {
  resolveBookingRequestBadgeState,
  resolveProfessionalBookingRequestDirection,
} from "./calendar/BookingRequestBadge";
import { resolveBookingResponseIndicators } from "./calendar/bookingResponseStatus";
import { resolveCalendarPrepaymentStatus, toPrepaymentIconVariant } from "./calendar/prepaymentStatus";
import type {
  CalendarBlock,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarBookingLocation,
  CalendarEvent,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildCreateCalendarEntryPayload,
  isApiCalendarEventId,
  mapCalendarEntryToEvent,
} from "./calendar/calendar-entry.mappers";
import type { CreateCalendarEntryRequest, CalendarEntry, UpsertCalendarSettingsRequest } from "../../store/services/businessApi";
import { useGetMyBookingsQuery } from "../../store/services/businessApi";
import { GENDER_OPTIONS, type GenderOption } from "../../lib/gender-options";
import { getOptionalPhoneValidationErrors, getPhoneValidationErrors } from "../../lib/phone-validation";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  calendarSettings?: ParsedCalendarSettings | null;
  serviceOptions?: string[];
  serviceCatalog?: readonly BookingCatalogService[];
  serviceOrderDefaults?: ServiceOrderSettings;
  fixedLocationAddress?: string;
  lateRescheduleFeePercentDefault?: string;
  clientOptions?: readonly { name: string; email: string }[];
  platformClientOptions?: readonly { name: string; email: string }[];
  isSaving?: boolean;
  onCreateCalendarEntry?: (payload: CreateCalendarEntryRequest) => Promise<CalendarEntry | void>;
  onSaveCalendarSettings?: (payload: UpsertCalendarSettingsRequest) => Promise<void>;
  onDeleteCalendarEntry?: (id: string) => Promise<void>;
  onUpdateBookingStatus?: (
    id: string,
    status: "requested" | "cancelled" | "completed" | "confirmed" | "in_progress" | "no_show",
    options?: {
      notification_event?: string;
      notify_incoming_er?: boolean;
      initiated_by?: "client" | "professional";
      notes?: string | null;
      total_price?: number | null;
      booking_date?: string | null;
      start_time?: string | null;
      end_time?: string | null;
    },
  ) => Promise<void>;
  onDispatchBookingNotification?: (
    id: string,
    event: string,
    options?: { initiated_by?: "client" | "professional"; message?: string },
  ) => Promise<void>;
  onUpdateCalendarEntryStatus?: (
    id: string,
    status: "requested" | "cancelled" | "completed" | "confirmed" | "in_progress" | "no_show",
  ) => Promise<void>;
  onDateRangeChange?: (range: CalendarQueryDateRange) => void;
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
  calendarSettings,
  serviceOptions = [],
  serviceCatalog = [],
  serviceOrderDefaults,
  fixedLocationAddress,
  lateRescheduleFeePercentDefault,
  clientOptions = [],
  platformClientOptions = [],
  isSaving = false,
  onCreateCalendarEntry,
  onSaveCalendarSettings,
  onDeleteCalendarEntry,
  onUpdateBookingStatus,
  onDispatchBookingNotification,
  onUpdateCalendarEntryStatus,
  onDateRangeChange,
}: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  /** Same list shown in Select Services and used when saving the selection. */
  const selectableServiceCatalog = React.useMemo(
    () => (serviceCatalog.length > 0 ? serviceCatalog : [...allBookingCatalogServices]),
    [serviceCatalog],
  );
  const selectableServiceCategories = React.useMemo(() => {
    if (serviceCatalog.length > 0) {
      return [{ category: "Services", services: serviceCatalog }];
    }
    return bookingServiceCatalog;
  }, [serviceCatalog]);
  const { openMessaging } = useMessagingWidget();

  const openBookingMessages = React.useCallback(
    (ev: CalendarEvent) => {
      const bookingRef = ev.bookingCode ?? extractBookingId(ev.id);
      const clientName = ev.showClientName?.trim();
      openMessaging({
        bookingRef,
        searchPrefill: clientName || undefined,
      });
    },
    [openMessaging],
  );

  const [events, setEvents] = React.useState<readonly CalendarEvent[]>(() => [...data.events]);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

  // Sync whenever overview payload changes (ids or content). String key catches RTK/304 reuse quirks.
  const overviewEventKey = React.useMemo(
    () => data.events.map((event) => `${event.id}:${event.date}:${event.start}:${event.resourceId}`).join("|"),
    [data.events],
  );
  React.useEffect(() => {
    setEvents([...data.events]);
  }, [overviewEventKey, data.events]);

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

  const productCatalog = React.useMemo(() => [...bookingProductCatalog], []);

  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(data.initialSubTab);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("day");
  const [activeDateIso, setActiveDateIso] = React.useState(defaultDateIso);

  React.useEffect(() => {
    onDateRangeChange?.(getCalendarQueryDateRange(activeDateIso, viewMode));
  }, [activeDateIso, onDateRangeChange, viewMode]);

  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const [teamActionAnchor, setTeamActionAnchor] = React.useState<HTMLElement | null>(null);
  const [teamMenuResourceId, setTeamMenuResourceId] = React.useState("");
  const [datePickerAnchor, setDatePickerAnchor] = React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<"booking" | "sales" | "activity">("booking");
  const [activityDetailItem, setActivityDetailItem] = React.useState<BookingActivityItem | null>(null);
  const [slotLocation, setSlotLocation] = React.useState<CalendarBookingLocation>(data.supportedLocations[0] ?? "FL");
  const [slotBookingType, setSlotBookingType] = React.useState<CalendarBookingType>("Requests");
  const [slotStatus, setSlotStatus] = React.useState<
    "Confirmed" | "Requested" | "No Show" | "Completed" | "Cancelled" | "Invalid"
  >(
    "Requested",
  );
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotCalendarOpen, setSlotCalendarOpen] = React.useState(false);
  const [slotCalendarTouched, setSlotCalendarTouched] = React.useState(false);
  const [discardBrOpen, setDiscardBrOpen] = React.useState(false);
  const [discardEbrOpen, setDiscardEbrOpen] = React.useState(false);
  const [incomingConfirmAction, setIncomingConfirmAction] = React.useState<"accept" | "reject" | null>(
    null,
  );
  const [incomingRequestEditMode, setIncomingRequestEditMode] = React.useState(false);
  const [originalServicesSnapshot, setOriginalServicesSnapshot] = React.useState<BookingServiceLineItem[]>([]);
  const [slotClientSearch, setSlotClientSearch] = React.useState("");
  const [slotAddMenuAnchor, setSlotAddMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [bookingActionAnchor, setBookingActionAnchor] = React.useState<HTMLElement | null>(null);
  const [noShowModalOpen, setNoShowModalOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [pendingBookingAction, setPendingBookingAction] = React.useState<CalendarBookingAction | null>(
    null,
  );
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
  const [showLateRescheduling, setShowLateRescheduling] = React.useState(false);
  const [lateRescheduleFeePercent, setLateRescheduleFeePercent] = React.useState("");
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

  const clientList = clientOptions;
  const mollurePlatformClients = platformClientOptions;

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
  const lateRescheduleFeeAmount = React.useMemo(() => {
    const pct = Number(lateRescheduleFeePercent);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return Math.round((subtotalPrice * pct) / 100);
  }, [lateRescheduleFeePercent, subtotalPrice]);
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

  const drawerSalesActivityContext = React.useMemo<CalendarEvent | null>(() => {
    if (viewingBookingEvent) return viewingBookingEvent;
    if (!selectedSlot) return null;

    return {
      id: editingEventId ?? "draft",
      resourceId: selectedSlot.resourceId,
      date: selectedSlot.date,
      start: selectedSlot.start,
      end: selectedSlot.end,
      title: selectedServices[0]?.name ?? selectedProducts[0]?.name ?? "Booking",
      status: slotStatus,
      location: slotLocation,
      bookingType: slotBookingType,
      bookingScenario: slotStatus === "Requested" ? "BR" : undefined,
      showClientName:
        selectedClient?.name ||
        `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
        `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
        undefined,
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
        showLateRescheduling,
        lateRescheduleFeePercent,
        showInternalNote,
        bookingInternalNote,
        bookingTotalDiscount,
        showKilometerAllowance,
        kilometerAllowanceDraft,
      }),
    };
  }, [
    viewingBookingEvent,
    selectedSlot,
    editingEventId,
    selectedServices,
    selectedProducts,
    slotStatus,
    slotLocation,
    slotBookingType,
    selectedClient,
    guestDraft.firstName,
    guestDraft.lastName,
    nonMollureDraft.firstName,
    nonMollureDraft.lastName,
    bookingGuests,
    bookingPhoneDraft,
    desiredLocationDraft,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    showLateCancellation,
    lateCancellationFeePercent,
    showLateRescheduling,
    lateRescheduleFeePercent,
    showInternalNote,
    bookingInternalNote,
    bookingTotalDiscount,
    showKilometerAllowance,
    kilometerAllowanceDraft,
  ]);

  const { data: myBookingsResponse } = useGetMyBookingsQuery(undefined, {
    skip: !slotDrawerOpen || (slotDrawerTab !== "activity" && slotDrawerTab !== "sales"),
  });

  const clientActivityIdentity = React.useMemo(() => {
    const email =
      selectedClient?.email?.trim() ||
      drawerSalesActivityContext?.details?.clientEmail?.trim() ||
      "";
    const name =
      selectedClient?.name?.trim() ||
      drawerSalesActivityContext?.showClientName?.trim() ||
      `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
      `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
      "";
    return { email, name };
  }, [
    selectedClient?.email,
    selectedClient?.name,
    drawerSalesActivityContext?.details?.clientEmail,
    drawerSalesActivityContext?.showClientName,
    guestDraft.firstName,
    guestDraft.lastName,
    nonMollureDraft.firstName,
    nonMollureDraft.lastName,
  ]);

  const clientBookingsForActivity = React.useMemo(() => {
    const all = myBookingsResponse?.data ?? [];
    const currentId = drawerSalesActivityContext
      ? parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null
      : null;
    const currentCode = drawerSalesActivityContext?.bookingCode ?? null;
    return all.filter((booking) => {
      if (currentId && String(booking.id) === String(currentId)) return true;
      if (currentCode && booking.unique_code && booking.unique_code === currentCode) return true;
      const email = clientActivityIdentity.email.toLowerCase();
      const name = clientActivityIdentity.name.toLowerCase();
      const bookingEmail = (booking.customer_email ?? "").trim().toLowerCase();
      const bookingName = (booking.customer_name || booking.client_name || "").trim().toLowerCase();
      if (email && bookingEmail && email === bookingEmail) return true;
      if (name && bookingName && name === bookingName) return true;
      return false;
    });
  }, [clientActivityIdentity.email, clientActivityIdentity.name, drawerSalesActivityContext, myBookingsResponse?.data]);

  const activityTimelineItems = React.useMemo(
    () =>
      buildBookingActivityTimeline({
        bookings: clientBookingsForActivity,
        clientEmail: clientActivityIdentity.email,
        clientName: clientActivityIdentity.name,
        currentBookingId: drawerSalesActivityContext
          ? parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null
          : null,
        currentBookingCode: drawerSalesActivityContext?.bookingCode ?? null,
        currentScenario: drawerSalesActivityContext?.bookingScenario ?? null,
        currentStatus: drawerSalesActivityContext?.status ?? null,
        currentCancellationReason: drawerSalesActivityContext?.details?.cancellationReason ?? null,
        currentProfessionalName:
          data.resources.find((r) => r.id === drawerSalesActivityContext?.resourceId)?.name ?? null,
        mode: "activity",
      }),
    [
      clientActivityIdentity.email,
      clientActivityIdentity.name,
      clientBookingsForActivity,
      data.resources,
      drawerSalesActivityContext,
    ],
  );

  const isCompletedBooking = viewingBookingEvent?.status === "Completed";

  const noShowParticipants = React.useMemo(() => {
    if (!viewingBookingEvent) return [];
    const list: { id: string; name: string }[] = [];
    const clientName = viewingBookingEvent.showClientName?.trim();
    if (clientName) list.push({ id: "client", name: clientName });

    const people = viewingBookingEvent.details?.clientSnapshot?.people ?? [];
    let modelOrdinal = 0;
    for (const person of people) {
      if (person.isRequester) continue;
      if (person.participantType === "planning" || person.name?.trim() === "Planning") continue;
      const trimmed = person.name?.trim() ?? "";
      let name: string;
      if (person.participantType === "model") {
        modelOrdinal += 1;
        name = trimmed && trimmed.toLowerCase() !== "model" ? trimmed : `Model ${modelOrdinal}`;
      } else {
        name = trimmed && trimmed.toLowerCase() !== "guest" ? trimmed : "Guest";
      }
      list.push({ id: person.id, name });
    }
    if (list.length === 0) list.push({ id: "client", name: "Client" });
    return list;
  }, [viewingBookingEvent]);

  const showIncomingRequestActions =
    isViewingBooking && canRespondToIncomingRequest(viewingBookingEvent) && !isEditingExisting;
  const showDiscardEbr = isViewingBooking && canDiscardEbr(viewingBookingEvent) && !isEditingExisting;
  const negotiationDetails = viewingBookingEvent?.details;
  const liveEditedServiceIds = React.useMemo(() => {
    if (!incomingRequestEditMode) return new Set<string>();
    return new Set(detectEditedServiceIds(originalServicesSnapshot, selectedServices));
  }, [incomingRequestEditMode, originalServicesSnapshot, selectedServices]);

  const resolveServiceEditTag = React.useCallback(
    (serviceId: string) => {
      if (incomingRequestEditMode && liveEditedServiceIds.has(serviceId)) return "edited" as const;
      return getServiceEditTag(serviceId, negotiationDetails);
    },
    [incomingRequestEditMode, liveEditedServiceIds, negotiationDetails],
  );
  const isViewingExisting =
    isCompletedBooking || (Boolean(editingEventId) && !isEditingExisting);

  const bookingEditSignature = React.useMemo(
    () =>
      JSON.stringify({
        services: selectedServices,
        products: selectedProducts,
        slot: selectedSlot,
        client: selectedClient,
        guests: bookingGuests,
        phone: bookingPhoneDraft,
        desiredLocation: desiredLocationDraft,
        location: slotLocation,
        status: slotStatus,
        showPrepayment,
        prepaymentPercent,
        paymentMethod,
        showLateCancellation,
        lateCancellationFeePercent,
        showLateRescheduling,
        lateRescheduleFeePercent,
        showInternalNote,
        internalNote: bookingInternalNote,
        totalDiscount: bookingTotalDiscount,
        showKilometerAllowance,
        kilometerAllowance: kilometerAllowanceDraft,
      }),
    [
      selectedServices,
      selectedProducts,
      selectedSlot,
      selectedClient,
      bookingGuests,
      bookingPhoneDraft,
      desiredLocationDraft,
      slotLocation,
      slotStatus,
      showPrepayment,
      prepaymentPercent,
      paymentMethod,
      showLateCancellation,
      lateCancellationFeePercent,
      showLateRescheduling,
      lateRescheduleFeePercent,
      showInternalNote,
      bookingInternalNote,
      bookingTotalDiscount,
      showKilometerAllowance,
      kilometerAllowanceDraft,
    ],
  );
  const [editBaselineSignature, setEditBaselineSignature] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (isEditingExisting) {
      setEditBaselineSignature((prev) => (prev === null ? bookingEditSignature : prev));
    } else {
      setEditBaselineSignature(null);
    }
  }, [isEditingExisting, bookingEditSignature]);
  const isBookingDirty =
    isEditingExisting &&
    editBaselineSignature !== null &&
    bookingEditSignature !== editBaselineSignature;

  const lockClientIdentity = isViewingBooking && isClientOriginatedBooking(viewingBookingEvent);
  const showLineItemRemoveButton = !isViewingExisting;
  const showClientRemoveButton = showLineItemRemoveButton && !lockClientIdentity;
  const hideClientBookingFooterActions =
    slotBookingScreen === "new-booking" && showIncomingRequestActions;
  const hideClientBookingEditButton = showIncomingRequestActions;
  const isBookingSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "add-unique-item";
  const drawerPrimaryActionLabel = isBookingSubScreen
    ? "Save"
    : incomingRequestEditMode
      ? "Send EBR"
      : editingEventId
        ? "Update"
        : "Save";

  const closeBookingDrawer = React.useCallback(() => {
    setSlotDrawerOpen(false);
    setEditingEventId(null);
    setIsEditingExisting(false);
    setActivityDetailItem(null);
  }, []);

  const calendarFieldLabel = React.useMemo(() => {
    if ((isViewingBooking || slotCalendarTouched) && selectedSlot?.date) {
      const locLabel = slotLocation === "FL" ? "Fixed Location" : "Desired Location";
      return `${locLabel} · ${formatMdyDate(selectedSlot.date)}`;
    }
    return "Select calender";
  }, [isViewingBooking, slotCalendarTouched, selectedSlot?.date, slotLocation]);

  const clientEbrSuggestion = React.useMemo(() => {
    if (!viewingBookingEvent || viewingBookingEvent.bookingScenario !== "EBR") return null;
    const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
    if (!ebr || ebr.lastEditedBy !== "client") return null;
    return ebr;
  }, [viewingBookingEvent]);

  const requestedScheduleLabel = React.useMemo(() => {
    if (!clientEbrSuggestion?.suggestedDateISO) return "";
    const datePart = formatMdyDate(clientEbrSuggestion.suggestedDateISO);
    const timePart = clientEbrSuggestion.suggestedTime?.trim() || "";
    return [datePart, timePart].filter(Boolean).join(" · ");
  }, [clientEbrSuggestion]);

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
    colorsByStatus: {},
    colorsByTeamMember: {},
  }));
  const [appliedDesign, setAppliedDesign] = React.useState<CalendarDesignDraft>(() => ({
    scope: "Categories",
    colorsByCategory: {},
    colorsByService: {},
    colorsByStatus: {},
    colorsByTeamMember: {},
  }));
  const [bookingRules, setBookingRules] = React.useState<BookingRules>(() => defaultBookingRules());
  const [scheduleRows, setScheduleRows] = React.useState<ScheduleAvailabilityRow[]>([]);
  const [dateOverrides, setDateOverrides] = React.useState<ParsedCalendarSettings["availability"]["dateOverrides"]>([]);
  const [serviceOrderDraft, setServiceOrderDraft] = React.useState<ServiceOrderSettings>(() =>
    normalizeServiceOrderSettings(undefined, {
      categories: serviceOrderDefaults?.categories ?? [],
      servicesByCategory: serviceOrderDefaults?.servicesByCategory ?? {},
    }),
  );
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
      setServiceOrderDraft(
        normalizeServiceOrderSettings(calendarSettings.availability.serviceOrder, serviceOrderDefaults),
      );
    } else if (serviceOrderDefaults) {
      setServiceOrderDraft(normalizeServiceOrderSettings(serviceOrderDefaults));
    }
  }, [calendarSettings, serviceOrderDefaults]);

  const persistAvailabilitySettings = React.useCallback(
    async (next: {
      bookingRules?: BookingRules;
      scheduleAvailability?: ScheduleAvailabilityRow[];
      dateOverrides?: ParsedCalendarSettings["availability"]["dateOverrides"];
      serviceOrder?: ServiceOrderSettings;
      publicBusinessHours?: PublicBusinessHoursDraft[];
      design?: CalendarDesignDraft;
    }) => {
      await onSaveCalendarSettings?.({
        availability: {
          bookingRules: next.bookingRules ?? bookingRules,
          scheduleAvailability: next.scheduleAvailability ?? scheduleRows,
          dateOverrides: next.dateOverrides ?? dateOverrides,
          serviceOrder: next.serviceOrder ?? serviceOrderDraft,
          publicBusinessHours: next.publicBusinessHours ?? calendarSettings?.availability.publicBusinessHours,
        },
        design: next.design ?? appliedDesign,
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
    if (/\b(nail|manicure|pedicure)\b/.test(t)) return "nails";
    if (/\b(facial|brow|lash|lashes|make-?up|makeup)\b/.test(t)) return "face-treatments";
    if (/\b(massage|spa|body)\b/.test(t)) return "body-treatments";
    if (/\b(hair|cut|wash|blow|color|colour|keratin|style|styling)\b/.test(t)) return "hair";
    return null;
  }, []);

  const resolveEventColors = React.useCallback(
    (event: CalendarEvent) => {
      const cardServiceCategory = getServiceCategory(event.title);
      const serviceColor =
        appliedDesign.scope === "Services"
          ? appliedDesign.colorsByService?.[event.title]
          : cardServiceCategory
            ? appliedDesign.colorsByCategory[cardServiceCategory]
            : undefined;
      const teamColor = appliedDesign.colorsByTeamMember?.[event.resourceId];
      const statusColor = appliedDesign.colorsByStatus?.[event.status];
      return {
        serviceColor: teamColor ?? serviceColor,
        statusColor,
      };
    },
    [appliedDesign, getServiceCategory],
  );

  const persistEventStatus = React.useCallback(
    async (
      eventId: string,
      status: CalendarEvent["status"],
      options?: {
        notification_event?: string;
        notify_incoming_er?: boolean;
        initiated_by?: "client" | "professional";
        notes?: string | null;
        total_price?: number | null;
        booking_date?: string | null;
        start_time?: string | null;
        end_time?: string | null;
      },
    ) => {
      const parsed = parseApiCalendarEventId(eventId);
      if (!parsed) return;
      const apiStatus =
        status === "Requested"
          ? "requested"
          : status === "Confirmed"
            ? "confirmed"
            : status === "In Progress"
              ? "in_progress"
              : status === "Completed"
                ? "completed"
                : status === "No Show"
                  ? "no_show"
                  : "cancelled";
      if (parsed.kind === "booking") {
        if (onUpdateBookingStatus) {
          await onUpdateBookingStatus(parsed.id, apiStatus, options);
        }
        return;
      }
      if (onUpdateCalendarEntryStatus) {
        await onUpdateCalendarEntryStatus(parsed.id, apiStatus);
      }
    },
    [onUpdateBookingStatus, onUpdateCalendarEntryStatus],
  );

  const dispatchBookingEventIfApi = React.useCallback(
    async (
      eventId: string | null | undefined,
      event: string,
      options?: { initiated_by?: "client" | "professional"; message?: string },
    ) => {
      const parsed = eventId ? parseApiCalendarEventId(eventId) : null;
      if (parsed?.kind === "booking" && onDispatchBookingNotification) {
        await onDispatchBookingNotification(parsed.id, event, options);
      }
    },
    [onDispatchBookingNotification],
  );

  const handleBookingActionSelect = React.useCallback(
    async (action: "edit" | "in_progress" | "no_show" | "cancel") => {
      setBookingActionAnchor(null);
      if (!editingEventId) return;

      if (action === "edit") {
        setIsEditingExisting(true);
        return;
      }

      if (action === "no_show") {
        setNoShowModalOpen(true);
        return;
      }

      if (action === "cancel") {
        setCancelModalOpen(true);
        return;
      }

      setPendingBookingAction(action);
    },
    [editingEventId],
  );

  const handleConfirmCancel = React.useCallback(async () => {
    setCancelModalOpen(false);
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Cancelled");
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEventId ? { ...event, status: "Cancelled" } : event)),
      );
      showSnackbar({ severity: "success", message: "Booking cancelled." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, persistEventStatus, showSnackbar]);

  const handleConfirmBookingAction = React.useCallback(async () => {
    const action = pendingBookingAction;
    setPendingBookingAction(null);
    if (!action || !editingEventId) return;

    const nextStatus: CalendarEvent["status"] =
      action === "in_progress" ? "In Progress" : "Cancelled";
    const successMessage =
      action === "in_progress" ? "Booking marked in progress." : "Booking cancelled.";
    try {
      await persistEventStatus(editingEventId, nextStatus);
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEventId ? { ...event, status: nextStatus } : event)),
      );
      showSnackbar({ severity: "success", message: successMessage });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, pendingBookingAction, persistEventStatus, showSnackbar]);

  const handleConfirmNoShow = React.useCallback(async () => {
    setNoShowModalOpen(false);
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "No Show");
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEventId ? { ...event, status: "No Show" } : event)),
      );
      showSnackbar({ severity: "success", message: "Booking marked as no show." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, persistEventStatus, showSnackbar]);

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
  const { startMin, endMin } = React.useMemo(
    () => ({
      startMin: grid.startHour * 60,
      endMin: grid.endHour * 60,
    }),
    [grid.endHour, grid.startHour],
  );
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
    setSelectedResourceId((current) => {
      const stillValid = current && filteredResources.some((resource) => resource.id === current);
      return stillValid ? current : filteredResources[0].id;
    });
  }, [filteredResources]);

  const activeResource = React.useMemo(
    () => filteredResources.find((r) => r.id === selectedResourceId) ?? filteredResources[0],
    [filteredResources, selectedResourceId],
  );

  const closeTeamMenu = React.useCallback(() => {
    setTeamActionAnchor(null);
    setTeamMenuResourceId("");
  }, []);

  const openTeamMenu = React.useCallback((resourceId: string, anchor: HTMLElement) => {
    setTeamMenuResourceId(resourceId);
    setTeamActionAnchor(anchor);
  }, []);

  const selectTeamMember = React.useCallback(
    (resourceId: string) => {
      const normalizedId = String(resourceId);
      if (!data.resources.some((resource) => String(resource.id) === normalizedId)) return;

      // Day view shows one active lane but must keep all-date bookings visible.
      // Only switch the active header — do not focus-filter by team (client bookings
      // often have null team_member_id and would disappear).
      setSelectedResourceId(normalizedId);
      closeTeamMenu();
    },
    [closeTeamMenu, data.resources],
  );

  const teamMenuResource = React.useMemo(
    () => data.resources.find((resource) => resource.id === teamMenuResourceId) ?? activeResource,
    [activeResource, data.resources, teamMenuResourceId],
  );

  const displayedResources = React.useMemo(() => {
    if (viewMode === "week") return activeResource ? [activeResource] : [];
    // Day view: one body lane for the active (or first) team member.
    // Headers still list everyone; teamAll shows all events on this lane.
    if (viewMode === "day") return activeResource ? [activeResource] : [];
    return filteredResources;
  }, [activeResource, filteredResources, viewMode]);

  const knownResourceIds = React.useMemo(
    () => new Set(data.resources.map((resource) => String(resource.id))),
    [data.resources],
  );

  const eventsInRange = React.useMemo(
    () => {
      const base = events.filter((e) => visibleDates.includes(e.date));
      // Day view: never drop bookings by team focus. Client bookings often have
      // null team_member_id and get assigned to the first resource; focusing another
      // team member must not hide them.
      const byTeam =
        viewMode === "day" || appliedFilters.teamAll
          ? base
          : base.filter(
              (e) =>
                appliedFilters.teamIds[e.resourceId] ||
                !e.resourceId ||
                !knownResourceIds.has(e.resourceId),
            );
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
      knownResourceIds,
      viewMode,
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
        | "bookingPhoneNumber"
        | "uniqueItemProductName"
        | "uniqueItemPrice",
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

  const renderTeamMemberHeader = (laneResource?: (typeof filteredResources)[number]) => {
    const headerResources =
      viewMode === "day" && appliedFilters.teamAll && laneResource ? [laneResource] : filteredResources;
    const menuResourceId =
      viewMode === "day" && appliedFilters.teamAll && laneResource ? laneResource.id : activeResource?.id;

    return (
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
          const isActive = resource.id === menuResourceId;
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
                onClick={(e) => openTeamMenu(resource.id, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openTeamMenu(resource.id, e.currentTarget);
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
              onClick={() => selectTeamMember(resource.id)}
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
    );
  };

  const renderTeamActionPopover = () => (
    <Popover
      open={Boolean(teamActionAnchor)}
      anchorEl={teamActionAnchor}
      onClose={closeTeamMenu}
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
          closeTeamMenu();
          showSnackbar({ severity: "info", message: "Client profile panel opened." });
        }}
        sx={{ width: "100%", px: 1, py: 0.75, justifyContent: "flex-start", borderRadius: "8px" }}
      >
        <BodyText sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>View profile</BodyText>
      </ButtonBase>
      <ButtonBase
        disabled={viewMode !== "day" || !teamMenuResource}
        onClick={() => {
          if (!teamMenuResource) return;
          const shifts =
            getCombinedAvailabilityIntervals(teamMenuResource.id, activeDateIso, scheduleRows, dateOverrides ?? []).length > 0
              ? getCombinedAvailabilityIntervals(teamMenuResource.id, activeDateIso, scheduleRows, dateOverrides ?? []).map((interval) => ({
                  start: fmtMinToTime(interval.startMin),
                  end: fmtMinToTime(interval.endMin),
                }))
              : [{ start: "09:00", end: "17:00" }];
          setEditAvailabilityDraft({
            resourceId: teamMenuResource.id,
            date: activeDateIso,
            locations: [...data.supportedLocations],
            shifts,
          });
          setEditAvailabilityOpen(true);
          closeTeamMenu();
        }}
        sx={{ width: "100%", px: 1, py: 0.75, justifyContent: "flex-start", borderRadius: "8px", opacity: viewMode !== "day" ? 0.5 : 1 }}
      >
        <BodyText sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}>Edit availability</BodyText>
      </ButtonBase>
      <Box sx={{ my: 0.5, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }} />
      {data.resources.map((resource) => {
        const focusedId = selectedResourceId || activeResource?.id;
        const isActive = String(resource.id) === String(focusedId);
        return (
          <ButtonBase
            key={resource.id}
            onClick={() => selectTeamMember(resource.id)}
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
  );

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot) => {
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation(data.supportedLocations[0] ?? "FL");
      setSlotBookingType("Requests");
      setSlotStatus("Requested");
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
      setShowLateRescheduling(false);
      setLateRescheduleFeePercent(lateRescheduleFeePercentDefault ?? "");
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
      setIncomingRequestEditMode(false);
      setOriginalServicesSnapshot([]);
      setDiscardBrOpen(false);
      setDiscardEbrOpen(false);
      setSlotDrawerOpen(true);
    },
    [data.supportedLocations, lateRescheduleFeePercentDefault],
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
      setSlotBookingType(ev.bookingType ?? "Requests");
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
      setShowLateRescheduling(hydration.showLateRescheduling);
      setLateRescheduleFeePercent(hydration.lateRescheduleFeePercent);
      setShowInternalNote(hydration.showInternalNote);
      setBookingInternalNote(hydration.internalNote);
      setBookingTotalDiscount(hydration.totalDiscount);
      setBookingDiscountModalOpen(false);
      setShowKilometerAllowance(hydration.showKilometerAllowance);
      setKilometerAllowanceDraft(hydration.kilometerAllowance);
      setEditingEventId(ev.id);
      setSlotStatus(ev.status);
      setIsEditingExisting(false);
      setIncomingRequestEditMode(false);
      setOriginalServicesSnapshot(resolveOriginalServices(ev, hydration.services));
      setSlotSaveAttempted(false);
      setAddMenuTarget("client");
      setSelectionTarget("client");
      setSlotAddMenuAnchor(null);
      setBookingMoreAnchor(null);
      setSlotDrawerOpen(true);
    },
    [],
  );

  const handleDiscardBr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid");
    } catch {
      showSnackbar({ severity: "error", message: "Unable to discard booking request." });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId ? { ...event, status: "Invalid", bookingScenario: undefined } : event,
      ),
    );
    setSlotStatus("Invalid");
    showSnackbar({ severity: "success", message: "Booking request discarded." });
  }, [editingEventId, persistEventStatus, showSnackbar]);

  const handleAcknowledgeAcceptedBr = React.useCallback(() => {
    if (!editingEventId) return;
    setEvents((prev) =>
      prev.map((event) => (event.id === editingEventId ? { ...event, bookingScenario: undefined } : event)),
    );
    showSnackbar({ severity: "success", message: "Booking request acknowledged." });
  }, [editingEventId, showSnackbar]);

  const handleAcceptIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
      try {
        await persistEventStatus(editingEventId, "Confirmed");
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to accept booking request."),
        });
        return;
      }
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEventId ? { ...event, status: "Confirmed" } : event)),
      );
      setSlotStatus("Confirmed");
      setIncomingRequestEditMode(false);
      showSnackbar({ severity: "success", message: "Booking request accepted." });
      return;
    }

    try {
      const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
      const isClientEbr =
        viewingBookingEvent.bookingScenario === "EBR" &&
        Boolean(ebr) &&
        (ebr.status === "pending" || ebr.status === "suggested") &&
        (ebr.lastEditedBy === "client" || viewingBookingEvent.details?.lastEditedBy === "client");

      const suggestedServices = ebr?.suggestedServices?.length
        ? ebr.suggestedServices
        : viewingBookingEvent.details?.services;
      const suggestedProducts = ebr?.suggestedProducts?.length
        ? ebr.suggestedProducts
        : viewingBookingEvent.details?.products;
      const suggestedTotal =
        ebr?.suggestedTotalPrice ??
        suggestedServices?.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const suggestedProject = ebr?.suggestedProjectDetails;
      const suggestedDate = ebr?.suggestedDateISO;
      const suggestedStart = ebr?.suggestedStart;
      const suggestedEnd = ebr?.suggestedEnd;

      let nextNotes: string | null | undefined;
      let scheduleExtras: {
        booking_date?: string;
        start_time?: string;
        end_time?: string;
      } = {};

    // Client change request: apply suggested schedule/services and keep accepted outcome for client UI.
      if (isClientEbr) {
        const appliedNote = (ebr?.clientNote || viewingBookingEvent.details?.internalNote || "").trim();
        nextNotes = markClientEbrAcceptedInNotes(viewingBookingEvent.notes, {
          internalNote: appliedNote,
          services: suggestedServices,
          products: suggestedProducts,
          clientSnapshot: {
            ...(viewingBookingEvent.details?.clientSnapshot ?? {}),
            ...(suggestedServices?.length
              ? {
                  services: suggestedServices.map((s) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    durationMins: s.durationMins,
                    guestId: s.guestId,
                    teamMemberId: s.teamMemberId,
                  })),
                }
              : {}),
            ...(suggestedProject ? { projectDetails: suggestedProject } : {}),
          },
          requestDirection: "incoming",
        });
        if (
          suggestedDate &&
          suggestedStart &&
          suggestedEnd &&
          /^\d{2}:\d{2}$/.test(suggestedStart) &&
          /^\d{2}:\d{2}$/.test(suggestedEnd)
        ) {
          scheduleExtras = {
            booking_date: suggestedDate,
            start_time: `${suggestedDate}T${suggestedStart}:00`,
            end_time: `${suggestedDate}T${suggestedEnd}:00`,
          };
        }
      }

      await onUpdateBookingStatus(parsed.id, "confirmed", {
        ...(nextNotes !== undefined ? { notes: nextNotes } : {}),
        ...(typeof suggestedTotal === "number" && isClientEbr ? { total_price: suggestedTotal } : {}),
        ...scheduleExtras,
      });

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== editingEventId) return event;
          return {
            ...event,
            status: "Confirmed" as const,
            bookingScenario: undefined,
            notes: nextNotes ?? event.notes,
            ...(scheduleExtras.booking_date
              ? {
                  date: scheduleExtras.booking_date,
                  start: suggestedStart || event.start,
                  end: suggestedEnd || event.end,
                }
              : {}),
            details: {
              ...event.details,
              responseStatus: undefined,
              lastEditedBy: undefined,
              editedServiceIds: undefined,
              clientEditedServiceIds: undefined,
              ...(suggestedServices?.length ? { services: suggestedServices } : {}),
              ...(suggestedProducts?.length ? { products: suggestedProducts } : {}),
            },
          };
        }),
      );
      if (scheduleExtras.booking_date && selectedSlot) {
        setSelectedSlot({
          ...selectedSlot,
          date: scheduleExtras.booking_date,
          start: suggestedStart || selectedSlot.start,
          end: suggestedEnd || selectedSlot.end,
        });
      }
      setSlotStatus("Confirmed");
      setIncomingRequestEditMode(false);
      showSnackbar({ severity: "success", message: "Booking request accepted." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept booking request."),
      });
    }
  }, [
    editingEventId,
    onUpdateBookingStatus,
    persistEventStatus,
    selectedSlot,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRejectIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
    const isClientEbr =
      viewingBookingEvent.bookingScenario === "EBR" &&
      Boolean(ebr) &&
      (ebr.status === "pending" || ebr.status === "suggested") &&
      (ebr.lastEditedBy === "client" || viewingBookingEvent.details?.lastEditedBy === "client");

    // Client change request: keep original booking confirmed; keep rejected proposal for client UI.
    if (isClientEbr) {
      const parsed = parseApiCalendarEventId(editingEventId);
      if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
        showSnackbar({ severity: "error", message: "Unable to reject booking request." });
        return;
      }
      try {
        const rejectedNotes = markClientEbrRejectedInNotes(viewingBookingEvent.notes);
        await onUpdateBookingStatus(parsed.id, "confirmed", {
          notes: rejectedNotes,
        });
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: "Confirmed" as const,
                  bookingScenario: undefined,
                  notes: rejectedNotes,
                  details: {
                    ...event.details,
                    responseStatus: undefined,
                    lastEditedBy: undefined,
                    editedServiceIds: undefined,
                    clientEditedServiceIds: undefined,
                  },
                }
              : event,
          ),
        );
        setSlotStatus("Confirmed");
        setIncomingRequestEditMode(false);
        setIsEditingExisting(false);
        showSnackbar({ severity: "success", message: "Edit request rejected. Booking unchanged." });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to reject booking request."),
        });
      }
      return;
    }

    try {
      const parsed = parseApiCalendarEventId(editingEventId);
      if (parsed?.kind === "booking" && onUpdateBookingStatus) {
        await onUpdateBookingStatus(parsed.id, "cancelled");
      } else {
        await persistEventStatus(editingEventId, "Invalid");
      }
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to reject booking request."),
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) => (event.id === editingEventId ? { ...event, status: "Invalid" } : event)),
    );
    setSlotStatus("Invalid");
    setIncomingRequestEditMode(false);
    setIsEditingExisting(false);
    showSnackbar({ severity: "success", message: "Booking request rejected." });
  }, [editingEventId, onUpdateBookingStatus, persistEventStatus, showSnackbar, viewingBookingEvent]);

  const handleStartIncomingEdit = React.useCallback(() => {
    if (!viewingBookingEvent) return;
    const hydration = hydrateBookingDrawerFromEvent(viewingBookingEvent);
    setOriginalServicesSnapshot(resolveOriginalServices(viewingBookingEvent, hydration.services));
    setIncomingRequestEditMode(true);
    setIsEditingExisting(true);
  }, [viewingBookingEvent]);

  const handleDiscardEbr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid", { notification_event: "ebr_discarded" });
    } catch {
      showSnackbar({ severity: "error", message: "Unable to discard edited booking request." });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId ? { ...event, status: "Invalid", bookingScenario: undefined } : event,
      ),
    );
    setSlotStatus("Invalid");
    setIncomingRequestEditMode(false);
    showSnackbar({ severity: "success", message: "Edited booking request discarded." });
  }, [editingEventId, persistEventStatus, showSnackbar]);

  const openSelectServices = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    // Add flow: start with no preselection — only what the user picks is added.
    setServiceOverridesDraft({});
    setServiceSelectionDraft([]);
    setServiceEditDraft(emptyBookingServiceEditDraft());
    setServiceEditAttempted(false);
    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-services");
  }, [addMenuTarget]);

  const openEditService = React.useCallback(
    (service: BookingCatalogService) => {
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
    [data.resources, selectedSlot?.resourceId, selectedSlot?.start, serviceOverridesDraft],
  );

  const applyServiceEdit = React.useCallback(() => {
    const catalogService = selectableServiceCatalog.find((service) => service.id === serviceEditDraft.serviceId);
    if (!catalogService) return false;

    const lineItem = buildBookingServiceLineItem(catalogService, serviceEditDraft);
    setServiceOverridesDraft((prev) => ({
      ...prev,
      [lineItem.id]: lineItemToOverride(lineItem),
    }));
    setServiceSelectionDraft((prev) => (prev.includes(lineItem.id) ? prev : [...prev, lineItem.id]));
    setServiceEditAttempted(false);
    setSlotBookingScreen("select-services");
    void dispatchBookingEventIfApi(editingEventId, "service_edited", { initiated_by: "professional" });
    return true;
  }, [dispatchBookingEventIfApi, editingEventId, selectableServiceCatalog, serviceEditDraft]);

  const toggleServiceSelectionDraft = React.useCallback((serviceId: string) => {
    if (isViewingExisting) return;
    setServiceSelectionDraft((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }, [isViewingExisting]);

  const applyServiceSelection = React.useCallback(() => {
    const byId = new Map(selectableServiceCatalog.map((service) => [service.id, service]));
    const currentServices =
      selectionTarget === "client"
        ? selectedServices
        : bookingGuests.find((item) => item.id === selectionTarget)?.services ?? [];
    const currentById = new Map(currentServices.map((service) => [service.id, service]));

    const pickedServices = serviceSelectionDraft
      .map((id) => {
        const catalogService = byId.get(id);
        if (catalogService) {
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
            startTime: selectedSlot?.start,
            endTime: selectedSlot?.end,
            staffResourceId: selectedSlot?.resourceId,
          } satisfies BookingServiceLineItem;
        }
        return currentById.get(id) ?? null;
      })
      .filter((service): service is BookingServiceLineItem => Boolean(service));

    // Always keep already-added services; only append newly selected ones.
    const mergedById = new Map<string, BookingServiceLineItem>();
    for (const service of currentServices) mergedById.set(service.id, service);
    // Also keep original booking services so nothing disappears while editing.
    if (selectionTarget === "client") {
      for (const service of originalServicesSnapshot) {
        if (!mergedById.has(service.id)) mergedById.set(service.id, service);
      }
    }
    for (const service of pickedServices) mergedById.set(service.id, service);
    const nextServices = Array.from(mergedById.values());

    if (selectionTarget === "client") {
      setSelectedServices(nextServices);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) => (guest.id === selectionTarget ? { ...guest, services: nextServices } : guest)),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    originalServicesSnapshot,
    selectedServices,
    selectedSlot?.end,
    selectedSlot?.resourceId,
    selectedSlot?.start,
    selectionTarget,
    selectableServiceCatalog,
    serviceOverridesDraft,
    serviceSelectionDraft,
  ]);

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

    // Add flow: nothing preselected — only what the user picks is added.
    setProductSelectionDraft(createEmptyProductSelectionDraft());

    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-products");
  }, [addMenuTarget, bookingGuests, selectedProducts]);

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
    const currentProducts =
      selectionTarget === "client"
        ? selectedProducts
        : bookingGuests.find((item) => item.id === selectionTarget)?.products ?? [];

    // Merge newly picked products into the current list (no defaults, no wipe).
    const mergedById = new Map(currentProducts.map((product) => [product.id, product]));
    for (const product of nextProducts) {
      mergedById.set(product.id, product);
    }
    const mergedProducts = Array.from(mergedById.values());

    if (selectionTarget === "client") {
      setSelectedProducts(mergedProducts);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) => (guest.id === selectionTarget ? { ...guest, products: mergedProducts } : guest)),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [bookingGuests, customBookingProducts, productCatalog, productSelectionDraft, selectedProducts, selectionTarget]);

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
    void dispatchBookingEventIfApi(editingEventId, "unique_item_edited", { initiated_by: "professional" });
  }, [dispatchBookingEventIfApi, editingEventId, uniqueItemDraft]);

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

  const persistBookingFromDrawer = React.useCallback(async (): Promise<boolean> => {
    if (!selectedSlot) return false;

    const existingEvent = editingEventId ? events.find((event) => event.id === editingEventId) : null;

    if (incomingRequestEditMode && editingEventId && existingEvent) {
      const editedIds = detectEditedServiceIds(originalServicesSnapshot, selectedServices);
      const originalServices = existingEvent.details?.originalServices ?? originalServicesSnapshot;
      const nextDetails = buildBookingDetailsSnapshot({
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
        showLateRescheduling,
        lateRescheduleFeePercent,
        showInternalNote,
        bookingInternalNote,
        bookingTotalDiscount,
        showKilometerAllowance,
        kilometerAllowanceDraft,
        // Keep BR on calendar; only flip arrow to outgoing for the client-facing edit request.
        requestDirection: "outgoing",
        originalServices,
        editedServiceIds: editedIds,
        clientEditedServiceIds: [],
        lastEditedBy: "professional",
      });
      nextDetails.responseStatus = "suggestion_for_change";
      // Keep client project/people snapshot so client EBR view stays on Continue layout.
      if (existingEvent.details?.clientSnapshot) {
        nextDetails.clientSnapshot = existingEvent.details.clientSnapshot;
      }

      const snapshotServices = existingEvent.details?.clientSnapshot?.services ?? [];
      const suggestedServices = selectedServices.map((service) => {
        const fromSnapshot =
          snapshotServices.find((row) => row.id === service.id) ??
          snapshotServices.find((row) => row.name === service.name);
        return {
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: getEffectiveServicePrice(service),
          staffResourceId: service.staffResourceId,
          startTime: service.startTime,
          endTime: service.endTime,
          guestId: fromSnapshot?.guestId ?? null,
        };
      });
      const suggestedProducts: NonNullable<typeof nextDetails.products> = selectedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        unitPrice: product.unitPrice ?? product.price,
      }));
      const originalProductIds = new Set((existingEvent.details?.products ?? []).map((product) => product.id));
      const editedProductIds = selectedProducts
        .filter((product) => !originalProductIds.has(product.id))
        .map((product) => product.id);
      const bookingRef = existingEvent.bookingCode ?? editingEventId;
      const ebrTotal = suggestedServices.reduce((sum, service) => sum + service.price, 0)
        + suggestedProducts.reduce((sum, product) => sum + product.price * (product.quantity || 1), 0);
      const serviceNames = suggestedServices.map((service) => service.name).filter(Boolean);
      const humanNote = [
        bookingInternalNote.trim(),
        serviceNames.length ? `Services: ${serviceNames.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const persistedNotes = serializeCalendarEntryNotes(humanNote, nextDetails, {
        status: "suggested",
        suggestedAt: new Date().toISOString(),
        professionalNote: bookingInternalNote.trim() || undefined,
        editedServiceIds: editedIds,
        editedProductIds,
        suggestedServices,
        suggestedProducts,
        responseStatus: "suggestion_for_change",
        requestDirection: "outgoing",
        lastEditedBy: "professional",
      });

      const parsedBooking = parseApiCalendarEventId(editingEventId);
      if (parsedBooking?.kind === "booking" && onUpdateBookingStatus) {
        try {
          await onUpdateBookingStatus(parsedBooking.id, "requested", {
            notes: persistedNotes,
            total_price: ebrTotal,
          });
        } catch {
          showSnackbar({ severity: "error", message: "Unable to send edited booking request." });
          return false;
        }
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Requested",
                bookingScenario: "BR",
                title: selectedServices[0]?.name ?? event.title,
                details: {
                  ...event.details,
                  ...nextDetails,
                  prepaymentStatus: event.details?.prepaymentStatus,
                  responseStatus: "suggestion_for_change",
                },
              }
            : event,
        ),
      );
      professionalSuggestBookingChanges(bookingRef, {
        professionalNote: bookingInternalNote.trim() || undefined,
        editedServiceIds: editedIds,
        editedProductIds,
        suggestedServices: suggestedServices.map((service) => ({
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: service.price,
          teamMemberId: service.staffResourceId ?? null,
          teamMemberName: service.staffResourceId
            ? resourceNameById.get(service.staffResourceId)
            : undefined,
          guestId: service.guestId ?? null,
          startTime: service.startTime,
          endTime: service.endTime,
        })),
        suggestedProducts: suggestedProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
        })),
      });
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
      setSlotStatus("Requested");
      showSnackbar({ severity: "success", message: "Edited booking request sent to client." });
      void dispatchBookingEventIfApi(editingEventId, "suggest_for_change", { initiated_by: "professional" });
      setSlotSaveAttempted(false);
      return true;
    }

    const title = selectedServices[0]?.name ?? selectedProducts[0]?.name ?? "Booking";
    const clientName =
      selectedClient?.name?.trim() ||
      `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
      `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
      "Client";
    const isNewManualBooking = !editingEventId;
    const shouldPersistToApi = isNewManualBooking || !isApiCalendarEventId(editingEventId);

    const details = buildBookingDetailsSnapshot({
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
      showLateRescheduling,
      lateRescheduleFeePercent,
      showInternalNote,
      bookingInternalNote,
      bookingTotalDiscount,
      showKilometerAllowance,
      kilometerAllowanceDraft,
      ...(isNewManualBooking
        ? {
            requestDirection: "outgoing" as const,
            originalServices: selectedServices,
          }
        : {}),
    });

    const resolvedStatus = existingEvent?.status ?? (isNewManualBooking ? "Requested" : slotStatus);
    const resolvedBookingType = existingEvent?.bookingType ?? (isNewManualBooking ? "Requests" : slotBookingType);

    const buildLocalEvent = (id: string, bookingCode: string): CalendarEvent => ({
      id,
      bookingCode,
      resourceId: selectedSlot.resourceId,
      date: selectedSlot.date,
      start: selectedSlot.start,
      end: selectedSlot.end,
      title,
      status: resolvedStatus,
      location: slotLocation,
      bookingType: resolvedBookingType,
      bookingScenario: resolvedStatus === "Requested" ? existingEvent?.bookingScenario ?? "BR" : existingEvent?.bookingScenario,
      showClientName: clientName,
      details,
    });

    if (shouldPersistToApi) {
      if (!onCreateCalendarEntry) {
        showSnackbar({ severity: "error", message: "Calendar API is not connected." });
        return false;
      }

      try {
        const created = await onCreateCalendarEntry(
          buildCreateCalendarEntryPayload({
            selectedSlot,
            title,
            clientName,
            status: resolvedStatus,
            bookingType: resolvedBookingType,
            location: slotLocation,
            serviceIds: selectedServices.map((service) => service.id),
            details,
          }),
        );

        const nextEvent = created
          ? {
              ...mapCalendarEntryToEvent(created, selectedSlot.resourceId),
              title,
              status: resolvedStatus,
              bookingType: resolvedBookingType,
              bookingScenario: resolvedStatus === "Requested" ? existingEvent?.bookingScenario ?? "BR" : existingEvent?.bookingScenario,
              showClientName: clientName,
              details,
            }
          : buildLocalEvent(
              editingEventId ?? `b-${Date.now()}-a`,
              existingEvent?.bookingCode ?? String(Math.floor(10000 + Math.random() * 90000)),
            );

        setEvents((prev) => {
          if (editingEventId && !isApiCalendarEventId(editingEventId)) {
            return prev.map((event) => (event.id === editingEventId ? nextEvent : event));
          }
          if (editingEventId && isApiCalendarEventId(editingEventId)) {
            return prev.map((event) => (event.id === editingEventId ? { ...event, ...nextEvent, id: event.id } : event));
          }
          return [...prev, nextEvent];
        });

        setEditingEventId(nextEvent.id);
        setSlotStatus(nextEvent.status);
        setIsEditingExisting(false);
        if (editingEventId && isApiCalendarEventId(editingEventId) && existingEvent && selectedSlot) {
          if (existingEvent.date !== selectedSlot.date) {
            void dispatchBookingEventIfApi(editingEventId, "booking_date_changed", {
              initiated_by: "professional",
            });
          } else if (existingEvent.start !== selectedSlot.start || existingEvent.end !== selectedSlot.end) {
            void dispatchBookingEventIfApi(editingEventId, "time_changed", { initiated_by: "professional" });
          }
        }
        showSnackbar({
          severity: "success",
          message: isNewManualBooking ? "Booking saved." : "Booking updated.",
        });
        setSlotSaveAttempted(false);
        return true;
      } catch {
        showSnackbar({ severity: "error", message: "Unable to save booking." });
        return false;
      }
    }

    const nextEvent = buildLocalEvent(
      editingEventId ?? `b-${Date.now()}-a`,
      existingEvent?.bookingCode ?? String(Math.floor(10000 + Math.random() * 90000)),
    );

    setEvents((prev) => {
      if (!editingEventId) return [...prev, nextEvent];
      return prev.map((event) => (event.id === editingEventId ? nextEvent : event));
    });
    setEditingEventId(nextEvent.id);
    setSlotStatus(nextEvent.status);
    setIsEditingExisting(false);
    showSnackbar({ severity: "success", message: "Booking updated." });
    setSlotSaveAttempted(false);
    return true;
  }, [
    bookingGuests,
    bookingInternalNote,
    bookingPhoneDraft,
    bookingTotalDiscount,
    desiredLocationDraft,
    dispatchBookingEventIfApi,
    editingEventId,
    events,
    guestDraft.firstName,
    guestDraft.lastName,
    incomingRequestEditMode,
    kilometerAllowanceDraft,
    lateCancellationFeePercent,
    nonMollureDraft.firstName,
    nonMollureDraft.lastName,
    onCreateCalendarEntry,
    onUpdateBookingStatus,
    originalServicesSnapshot,
    paymentMethod,
    prepaymentPercent,
    selectedClient,
    selectedProducts,
    selectedServices,
    selectedSlot,
    showInternalNote,
    showKilometerAllowance,
    showLateCancellation,
    showLateRescheduling,
    lateRescheduleFeePercent,
    showPrepayment,
    showSnackbar,
    slotBookingType,
    slotLocation,
    slotStatus,
    resourceNameById,
  ]);

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
              onMockAction={(label) => showSnackbar({ severity: "info", message: label })}
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
                overflowX: "hidden",
                overflowY: "visible",
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
                        {renderTeamMemberHeader(viewMode === "day" ? undefined : res)}
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
                            const laneEvents = eventsInRange.filter((event) => {
                              if (event.date !== date) return false;
                              // Day view uses a single active lane — show every booking for that date.
                              if (viewMode === "day") return true;
                              if (!event.resourceId || !knownResourceIds.has(event.resourceId)) return true;
                              return event.resourceId === resource.id;
                            });
                            const laneBlocks = blocksInRange.filter((block) => {
                              if (block.date !== date) return false;
                              if (viewMode === "day") return true;
                              if (!block.resourceId || !knownResourceIds.has(block.resourceId)) return true;
                              return block.resourceId === resource.id;
                            });

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
                                  overflow: "visible",
                                }}
                              >
                                {/* Click layer — below booking cards */}
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
                                    zIndex: 1,
                                  }}
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
                                            bgcolor: "#fff",
                                            borderLeft: dlOnly ? `2px solid ${alpha(m.teal, 0.12)}` : undefined,
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
                                  const isBlockedTime = true;

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
                                            top: "50%",
                                            height: 2,
                                            bgcolor: "#FF2F64",
                                            transform: "translateY(-50%)",
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

                                  return null;
                                })}

                                {/* Events */}
                                {clusterSameStartTimeEvents(laneEvents).map((cluster) => {
                                  const { startMin: clusterStart, endMin: clusterEnd } = getClusterTimeBounds(cluster);
                                  const top = ((clusterStart - startMin) / grid.stepMinutes) * rowPx + 0.15;
                                  const height = Math.max(78, ((clusterEnd - clusterStart) / grid.stepMinutes) * rowPx - 0.3);
                                  const resolveServiceColor = (ev: (typeof cluster)[number]) =>
                                    resolveEventColors(ev).serviceColor;
                                  const resolveStatusColor = (ev: (typeof cluster)[number]) =>
                                    resolveEventColors(ev).statusColor;
                                  const eventHandlers = {
                                    onOpen: openExistingBooking,
                                    onOpenCalendar: (ev: (typeof cluster)[number]) =>
                                      showSnackbar({ severity: "info", message: `Calendar for booking ${extractBookingId(ev.id)}` }),
                                    onOpenNotes: (ev: (typeof cluster)[number]) => openExistingBooking(ev),
                                    onOpenClient: (ev: (typeof cluster)[number]) =>
                                      showSnackbar({ severity: "info", message: `Client drawer: ${ev.showClientName ?? "Client"}` }),
                                    onOpenMessages: openBookingMessages,
                                  };

                                  if (cluster.length > 1) {
                                    return (
                                      <CalendarBookingTicketStack
                                        key={cluster.map((event) => event.id).join("-")}
                                        events={cluster}
                                        top={top}
                                        rowPx={rowPx}
                                        slotHeight={height}
                                        getServiceColor={resolveServiceColor}
                                        getStatusColor={resolveStatusColor}
                                        {...eventHandlers}
                                      />
                                    );
                                  }

                                  const ev = cluster[0];
                                  return (
                                    <CalendarBookingCard
                                      key={ev.id}
                                      event={ev}
                                      top={top}
                                      height={height}
                                      left={0}
                                      right={0}
                                      serviceColor={resolveServiceColor(ev)}
                                      statusColor={resolveStatusColor(ev)}
                                      onOpen={() => eventHandlers.onOpen(ev)}
                                      onOpenCalendar={() => eventHandlers.onOpenCalendar(ev)}
                                      onOpenNotes={() => eventHandlers.onOpenNotes(ev)}
                                      onOpenClient={() => eventHandlers.onOpenClient(ev)}
                                      onOpenMessages={() => eventHandlers.onOpenMessages(ev)}
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

      {activeSubTab === "Settings" ? (
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
        onClose={closeBookingDrawer}
        title={
          activityDetailItem
            ? activityDetailItem.detailType === "cancellation"
              ? "Activity Details"
              : "Edit request details"
            : isBookingDetailsSubScreen
              ? "Booking Details"
              : ""
        }
        onBack={
          activityDetailItem
            ? () => setActivityDetailItem(null)
            : isBookingDetailsSubScreen
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
        footer={
          selectedSlot && slotDrawerTab === "booking" && !activityDetailItem ? (
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
                      {
                        label: "Add Late Rescheduling",
                        onClick: () => {
                          if (isViewingExisting) return;
                          setShowLateRescheduling(true);
                          if (!lateRescheduleFeePercent && lateRescheduleFeePercentDefault) {
                            setLateRescheduleFeePercent(lateRescheduleFeePercentDefault);
                          }
                        },
                      },
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
                {slotBookingScreen === "new-booking" && editingEventId && !isCompletedBooking && !hideClientBookingEditButton ? (
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
                {!hideClientBookingFooterActions ? (
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
                ) : null}
                {!hideClientBookingFooterActions && (slotBookingScreen === "new-booking" && isCompletedBooking ? null : (
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
                          : !slotValidation.isValid || isViewingExisting) ||
                    (drawerPrimaryActionLabel === "Update" && isEditingExisting && !isBookingDirty)
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
                    if (isBookingSubScreen) return;
                    if (slotBookingScreen === "non-mollure-individual" || slotBookingScreen === "non-mollure-company") {
                      setBookingPhoneDraft({
                        phoneCode: nonMollureDraft.phoneCode,
                        phoneNumber: nonMollureDraft.phoneNumber,
                      });
                      setSlotClientAdded(true);
                      showSnackbar({ severity: "success", message: "Client details saved." });
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
                      showSnackbar({ severity: "success", message: "Guest added." });
                      setSlotBookingScreen("new-booking");
                      setSlotSaveAttempted(false);
                      return;
                    }
                    if (!selectedSlot) return;
                    void persistBookingFromDrawer();
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
                  {drawerPrimaryActionLabel}
                </Button>
                ))}
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
                  const disabled = false;
                  return (
                    <Box
                      key={t.id}
                      role={disabled ? undefined : "button"}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => {
                        if (disabled) return;
                        setSlotDrawerTab(t.id);
                        setActivityDetailItem(null);
                      }}
                      onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter" || e.key === " ") {
                          setSlotDrawerTab(t.id);
                          setActivityDetailItem(null);
                        }
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
                    catalog={selectableServiceCategories}
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
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 16, letterSpacing: "-0.01em" }}>
                            Booking Details
                          </BodyText>
                          {viewingBookingEvent.status === "Confirmed" ? (
                            <>
                              <Button
                                onClick={(e) => setBookingActionAnchor(e.currentTarget)}
                                endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                  borderRadius: "10px",
                                  textTransform: "none",
                                  fontWeight: 800,
                                  height: 34,
                                  px: 1.5,
                                  color: alpha(m.navy, 0.72),
                                  bgcolor: alpha(m.navy, 0.04),
                                  "&:hover": { bgcolor: alpha(m.navy, 0.08) },
                                }}
                              >
                                Action
                              </Button>
                              <Menu
                                anchorEl={bookingActionAnchor}
                                open={Boolean(bookingActionAnchor)}
                                onClose={() => setBookingActionAnchor(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                slotProps={{
                                  paper: {
                                    sx: {
                                      mt: 0.5,
                                      minWidth: 180,
                                      borderRadius: "12px",
                                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                                      boxShadow: "0 14px 30px rgba(16, 35, 63, 0.12)",
                                    },
                                  },
                                }}
                              >
                                <MenuItem
                                  onClick={() => void handleBookingActionSelect("edit")}
                                  sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.78), py: 1.1 }}
                                >
                                  Edit Booking
                                </MenuItem>
                                <Divider sx={{ my: "0 !important" }} />
                                <MenuItem
                                  onClick={() => void handleBookingActionSelect("cancel")}
                                  sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.78), py: 1.1 }}
                                >
                                  Cancel Booking
                                </MenuItem>
                                <Divider sx={{ my: "0 !important" }} />
                                <MenuItem
                                  onClick={() => void handleBookingActionSelect("in_progress")}
                                  sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.78), py: 1.1 }}
                                >
                                  In Progress
                                </MenuItem>
                                <Divider sx={{ my: "0 !important" }} />
                                <MenuItem
                                  onClick={() => void handleBookingActionSelect("no_show")}
                                  sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.78), py: 1.1 }}
                                >
                                  No Show
                                </MenuItem>
                              </Menu>
                            </>
                          ) : null}
                        </Stack>

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
                                          {indicator === "BR" ? (
                                            <BookingRequestBadge
                                              variant="inline"
                                              iconSize={12}
                                              state={resolveBookingRequestBadgeState(viewingBookingEvent)}
                                              direction={resolveProfessionalBookingRequestDirection(viewingBookingEvent)}
                                            />
                                          ) : (
                                            <span>{indicator}</span>
                                          )}
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

                      {requestedScheduleLabel ? (
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1, px: 0.25 }}>
                          <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
                            Requested: {requestedScheduleLabel}
                          </BodyText>
                          <BookingEditedTag variant="edited" />
                        </Stack>
                      ) : null}

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
                          {lockClientIdentity ? null : (
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
                          )}

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
                            {showClientRemoveButton ? (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSlotClientAdded(false);
                                  setSlotClientSearch("");
                                  setSelectedClient(null);
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove client"
                              >
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            ) : null}
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
                          disabled={isViewingExisting && !incomingRequestEditMode}
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

                        <BookingDrawerSelectedItemsSection
                          services={selectedServices}
                          products={selectedProducts}
                          showRemoveButtons={showLineItemRemoveButton}
                          resolveStaffName={(staffResourceId) =>
                            staffResourceId ? resourceNameById.get(staffResourceId) : undefined
                          }
                          resolveServiceEditTag={resolveServiceEditTag}
                          onRemoveService={(serviceId) => {
                            setSelectedServices((prev) => prev.filter((item) => item.id !== serviceId));
                            setServiceSelectionDraft((prev) => prev.filter((id) => id !== serviceId));
                          }}
                          onRemoveProduct={(productId) => {
                            setSelectedProducts((prev) => prev.filter((item) => item.id !== productId));
                            setProductSelectionDraft((prev) => {
                              if (!prev[productId]) return prev;
                              return { ...prev, [productId]: { ...prev[productId], selected: false } };
                            });
                          }}
                          onServiceClick={
                            incomingRequestEditMode
                              ? (service) => {
                                  const catalogService =
                                    selectableServiceCatalog.find((item) => item.id === service.id) ??
                                    selectableServiceCatalog.find((item) => item.name === service.name);
                                  if (catalogService) openEditService(catalogService);
                                }
                              : undefined
                          }
                        />

                        <BookingDrawerClientSnapshotSection
                          snapshot={viewingBookingEvent?.details?.clientSnapshot ?? null}
                        />

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
                              {showClientRemoveButton ? (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setBookingGuests((prev) => prev.filter((item) => item.id !== guest.id));
                                    if (addMenuTarget === guest.id) setSlotAddMenuAnchor(null);
                                  }}
                                  sx={{ color: alpha(m.navy, 0.35) }}
                                  aria-label={`Remove ${guest.name}`}
                                >
                                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              ) : null}
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
                                    {showLineItemRemoveButton ? (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
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
                                      >
                                        <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    ) : null}
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
                                    {showLineItemRemoveButton ? (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
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
                                      >
                                        <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    ) : null}
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

                        <Box
                          sx={{
                            borderRadius: "10px",
                            bgcolor: alpha(m.navy, 0.025),
                            p: 1.5,
                            ...(slotLocation === "FL"
                              ? {
                                  backgroundImage: `repeating-linear-gradient(90deg, ${alpha(m.teal, 0.1)} 0 2px, transparent 2px 13px)`,
                                  backgroundSize: "15px 100%",
                                }
                              : slotLocation === "DL"
                                ? {
                                    backgroundImage: `radial-gradient(${alpha(m.navy, 0.14)} 1px, transparent 1.35px)`,
                                    backgroundSize: "17px 17px",
                                  }
                                : {}),
                          }}
                        >
                          <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.76), mb: 1 }}>
                            Location
                          </BodyText>
                          {slotLocation === "FL" ? (
                            <Stack direction="row" spacing={4}>
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.68) }}>
                                Fixed Location
                              </BodyText>
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.42) }}>
                                {fixedLocationAddress || "Fixed location address"}
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

                        {isViewingBooking && isBookingRequestAccepted(viewingBookingEvent) ? (
                          <BookingRequestAcceptedPanel
                            totalPrice={totalPrice}
                            prepaymentPercent={Number(prepaymentPercent) || undefined}
                            prepaymentAmount={prepaymentAmount}
                            remainingAmount={remainingAfterPrepayment}
                            onOk={handleAcknowledgeAcceptedBr}
                          />
                        ) : (
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
                        )}

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

                        {showLateRescheduling ? (
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
                                Late Rescheduling
                              </BodyText>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  setShowLateRescheduling(false);
                                  setLateRescheduleFeePercent("");
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove late rescheduling"
                                disabled={isViewingExisting}
                              >
                                <CloseRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Stack>

                            <BodyText sx={{ mt: 0.5, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.48), lineHeight: 1.35 }}>
                              Fee applies when rescheduling after the allowed notice period
                            </BodyText>

                            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1.25 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 52 }}>
                                <BodyText sx={{ fontSize: 12.5, fontWeight: 850, color: alpha(m.navy, 0.62) }}>Fee</BodyText>
                                <InfoOutlinedIcon sx={{ fontSize: 15, color: m.teal }} />
                              </Stack>
                              <AppTextField
                                placeholder="%"
                                value={lateRescheduleFeePercent}
                                onChange={(e) => setLateRescheduleFeePercent(e.target.value)}
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
                                €{lateRescheduleFeeAmount}
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

                        {showIncomingRequestActions ? (
                          <BookingRequestResponseActions
                            onAccept={() => setIncomingConfirmAction("accept")}
                            onEdit={handleStartIncomingEdit}
                            onReject={() => setIncomingConfirmAction("reject")}
                          />
                        ) : null}

                        {showDiscardEbr ? (
                          <ButtonBase
                            onClick={() => setDiscardEbrOpen(true)}
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
                            <BodyText sx={{ fontSize: 13, fontWeight: 800, color: "inherit" }}>Discard EBR</BodyText>
                          </ButtonBase>
                        ) : null}

                        {showInternalNote ? (
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                              <StickyNote2OutlinedIcon sx={{ fontSize: 16, color: m.teal }} />
                              <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                                Internal Note
                              </BodyText>
                            </Stack>
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
                  {drawerSalesActivityContext ? (
                    slotDrawerTab === "sales" ? (
                      <SalesOverview
                        bookings={clientBookingsForActivity}
                        currentEvent={drawerSalesActivityContext}
                        clientName={clientActivityIdentity.name}
                        clientEmail={clientActivityIdentity.email}
                        clientPhone={
                          [bookingPhoneDraft.phoneCode, bookingPhoneDraft.phoneNumber]
                            .filter(Boolean)
                            .join(" ")
                            .trim() ||
                          drawerSalesActivityContext.details?.phoneNumber ||
                          ""
                        }
                        fallbackResourceId={drawerSalesActivityContext.resourceId || data.resources[0]?.id || "unassigned"}
                      />
                    ) : (
                      <BookingActivityOverview
                        title="Activity Overview"
                        items={activityTimelineItems}
                        emptyMessage="No activity for this client yet."
                        selectedDetail={activityDetailItem}
                        onSelectedDetailChange={setActivityDetailItem}
                      />
                    )
                  ) : (
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.6) }}>
                      Add booking details to view {slotDrawerTab === "sales" ? "sales" : "activity"}.
                    </BodyText>
                  )}
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
      {renderTeamActionPopover()}
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
              publicBusinessHours: [
                ...(calendarSettings?.availability.publicBusinessHours ?? []),
                publicBusinessHoursDraft,
              ],
            });
            showSnackbar({ severity: "success", message: "Public business hours added." });
            setPublicBusinessHoursOpen(false);
            setPublicBusinessHoursDraft({
              location: publicBusinessHoursDraft.location,
              schedule: publicBusinessHoursDraft.schedule,
              day: "",
              startTime: "08:00",
              endTime: "18:00",
              notAvailable: false,
              note: "",
            });
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
        onColorSelect={async (key, color) => {
          const nextDesign: CalendarDesignDraft =
            designDraft.scope === "Status"
              ? {
                  ...designDraft,
                  colorsByStatus: {
                    ...(designDraft.colorsByStatus ?? {}),
                    [key as CalendarBookingStatus]: color,
                  },
                }
              : designDraft.scope === "Team Members"
                ? {
                    ...designDraft,
                    colorsByTeamMember: { ...(designDraft.colorsByTeamMember ?? {}), [key]: color },
                  }
                : {
                    ...designDraft,
                    colorsByCategory: { ...designDraft.colorsByCategory, [key]: color },
                  };
          setDesignDraft(nextDesign);
          setAppliedDesign(nextDesign);
          setDesignOpen(false);
          try {
            await persistAvailabilitySettings({ design: nextDesign });
            showSnackbar({ severity: "success", message: "Calendar colour saved." });
          } catch {
            showSnackbar({ severity: "error", message: "Unable to save calendar colour." });
          }
        }}
        onApply={async () => {
          try {
            setAppliedDesign(designDraft);
            await persistAvailabilitySettings({ design: designDraft });
            showSnackbar({ severity: "success", message: "Design saved." });
            setDesignOpen(false);
          } catch {
            showSnackbar({ severity: "error", message: "Unable to save design." });
          }
        }}
        draft={designDraft}
        setDraft={setDesignDraft}
        serviceOptions={serviceOptions}
        teamMemberOptions={data.resources.map((resource) => ({ id: resource.id, name: resource.name }))}
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
      <DiscardEbrDialog open={discardEbrOpen} onClose={() => setDiscardEbrOpen(false)} onConfirm={handleDiscardEbr} />
      <BookingRequestConfirmDialog
        open={Boolean(incomingConfirmAction)}
        action={incomingConfirmAction}
        onClose={() => setIncomingConfirmAction(null)}
        onConfirm={() => {
          if (incomingConfirmAction === "accept") void handleAcceptIncomingRequest();
          else if (incomingConfirmAction === "reject") void handleRejectIncomingRequest();
        }}
      />
      <CalendarNoShowModal
        open={noShowModalOpen}
        participants={noShowParticipants}
        onClose={() => setNoShowModalOpen(false)}
        onConfirm={() => void handleConfirmNoShow()}
      />
      <CalendarCancelBookingModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => void handleConfirmCancel()}
      />
      <CalendarBookingActionConfirmDialog
        open={Boolean(pendingBookingAction)}
        action={pendingBookingAction}
        onClose={() => setPendingBookingAction(null)}
        onConfirm={() => void handleConfirmBookingAction()}
      />
    </Stack>
  );
}

