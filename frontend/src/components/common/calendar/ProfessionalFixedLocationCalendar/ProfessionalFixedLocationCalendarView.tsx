"use client";

import AppButton from "../../AppButton";
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
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";
import { BodyText } from "../../../ui/typography";
import { useSnackbar } from "../../AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  FOCUS_BOOKING_DATE_KEY,
  FOCUS_BOOKING_ID_KEY,
  FOCUS_BOOKING_REF_KEY,
} from "../../NotificationBookingSummaryModal";
import AppPillTabs from "../../AppPillTabs";
import AppDrawer from "../../AppDrawer";
import AppDatePicker from "../../AppDatePicker";
import { AppCalendarPanel } from "../../AppDatePicker";
import AppTextField from "../../AppTextField";
import AppCountryPhoneFields from "../../AppCountryPhoneFields";
import AppDropdown from "../../AppDropdown";
import AppSearchField from "../../AppSearchField";
import CalendarAddMenu from "../CalendarAddMenu";
import CalendarNoShowModal from "../CalendarNoShowModal";
import CalendarCancelBookingModal from "../CalendarCancelBookingModal";
import CalendarBookingActionConfirmDialog, {
  type CalendarBookingAction,
} from "../CalendarBookingActionConfirmDialog";
import CalendarBookingCard from "../CalendarBookingCard";
import BookingEditedTag from "../BookingEditedTag";
import CalendarBookingTicketStack from "../CalendarBookingTicketStack";
import {
  clusterSameStartTimeEvents,
  getClusterTimeBounds,
} from "../calendar-overlap.utils";
import { useMessagingWidget } from "../../messaging/MessagingWidgetContext";
import { useOpenMessagingForBookingMutation } from "../../../../store/services/messagingApi";
import { useProfessionalMessagingUnread } from "../../messaging/useProfessionalMessagingUnread";
import {
  buildBookingDetailsSnapshot,
  clearEbrSuggestionsFromNotes,
  markClientEbrAcceptedInNotes,
  markClientEbrRejectedInNotes,
  emptyDesiredLocation,
  hydrateBookingDrawerFromEvent,
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  resolveKilometerAllowanceAmount,
  serializeCalendarEntryNotes,
  parseCalendarEntryNotes,
} from "../bookingEventDetails";
import {
  restartResponseDeadline,
  buildResponseDeadline,
} from "../bookingResponseDeadline";
import {
  canDiscardEbr,
  canRespondToConfirmedEr,
  canRespondToIncomingRequest,
  detectEditedServiceIds,
  detectServiceLineChanges,
  detectEditedProductIds,
  getProductEditTag,
  getServiceEditTag,
  isClientOriginatedBooking,
  resolveOriginalServices,
} from "../bookingRequestNegotiation";
import {
  consumeConfirmedEditGrant,
  getBookingEditRequest,
  isConfirmedEditGrantActive,
  professionalSuggestBookingChanges,
  syncBookingEditRequestFromRemote,
} from "../../client-booking/bookingEditRequest";
import { syncEditRequestFromBookingApi } from "../../client-booking/syncEditRequestFromApi";
import EditRequestNoteDialog from "../../client-booking/EditRequestNoteDialog";
import EditRequestIncomingNote from "../../client-booking/EditRequestIncomingNote";
import { markBookingUpdateSeen } from "../bookingUpdateSeen";
import CalendarBlockTimeModal from "../CalendarBlockTimeModal";
import CalendarDesignModal, {
  type CalendarDesignDraft,
} from "../CalendarDesignModal";
import CalendarPublicBusinessHoursModal, {
  expandPublicBusinessHoursDraft,
  type PublicBusinessHoursDraft,
  type PublicBusinessHoursEntry,
} from "../CalendarPublicBusinessHoursModal";
import CalendarFiltersDrawer from "../CalendarFiltersDrawer";
import CalendarSchedulePanel from "../CalendarSchedulePanel";
import CalendarHoursRulesPanel from "../CalendarHoursRulesPanel";
import CalendarEditAvailabilityModal, {
  type EditAvailabilityDraft,
} from "../CalendarEditAvailabilityModal";
import CalendarServiceOrderModal from "../CalendarServiceOrderModal";
import ManualEntryDiscountModal from "../../../sections/finance/ManualEntryDiscountModal";
import {
  parseFinancePrice,
  type ManualEntryDiscount,
} from "../../../sections/finance/manualEntry.data";
import {
  removeFinanceProduct,
  removeFinanceUniqueItem,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "../../../sections/finance/financeCatalogPersist";
import {
  computeBookingPrice,
} from "../bookingTotal";
import { useFinanceInvoiceSettings } from "../../../sections/finance/useFinanceInvoiceSettings";
import BookingSelectServicesScreen from "../BookingSelectServicesScreen";
import DiscardBrDialog from "../DiscardBrDialog";
import DiscardEbrDialog from "../DiscardEbrDialog";
import BookingRequestConfirmDialog from "../BookingRequestConfirmDialog";
import BookingRequestResponseActions from "../BookingRequestResponseActions";
import BookingDrawerSelectedItemsSection from "../BookingDrawerSelectedItemsSection";
import BookingDrawerClientSnapshotSection from "../BookingDrawerClientSnapshotSection";
import CompanyClientTag from "../CompanyClientTag";
import BookingActivityOverview from "../BookingActivityOverview";
import { buildBookingActivityTimeline } from "../buildBookingActivityTimeline";
import type { BookingActivityItem } from "../bookingActivity.types";
import SalesOverview from "../SalesOverview";
import CatalogItemDeleteDialog from "../CatalogItemDeleteDialog";
import BookingEditServiceScreen from "../BookingEditServiceScreen";
import BookingSelectProductsScreen from "../BookingSelectProductsScreen";
import BookingAddUniqueItemScreen from "../BookingAddUniqueItemScreen";
import BookingEditCatalogItemScreen from "../BookingEditCatalogItemScreen";
import { useCalendarFilters } from "../useCalendarFilters";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import { buildOrderedBookingServiceCategories } from "../../../../data/bookingServiceCatalog.data";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  resolveServiceCategorySliderIconId,
} from "../../../../data/businessServiceCategorySlider.data";
import {
  addMinutesToTime,
  buildBookingServiceLineItem,
  buildServiceEditDraftFromCatalog,
  emptyBookingServiceEditDraft,
  getBookingServiceEditErrors,
  getEffectiveServicePrice,
  lineItemToOverride,
  type BookingServiceEditDraft,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  buildBookingProductLine,
  createEmptyProductSelectionDraft,
  formatProductLineName,
  getProductBaseName,
  productLineOriginalAmount,
  type BookingCatalogProduct,
  type BookingProductLineItem,
  type BookingProductSelectionDraft,
} from "../../../../data/bookingProductCatalog.data";
import {
  buildCatalogProductFromUniqueItemDraft,
  buildUniqueItemDraftFromProduct,
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
  getUniqueItemDraftErrors,
  type BookingUniqueItemDraft,
  type BookingUniqueItemLine,
} from "../../../../data/bookingUniqueItem.data";
import {
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityIntervals,
  makeScheduleRowId,
} from "../calendar-schedule.utils";
import {
  defaultBookingRules,
  normalizeServiceOrderSettings,
  type BookingRules,
  type ParsedCalendarSettings,
  type ScheduleAvailabilityRow,
  type ServiceOrderSettings,
} from "../calendar-settings.types";
import { dedupeServiceOrderSettings } from "../serviceOrder.utils";
import {
  addDaysIso,
  addMonthsIso,
  extractBookingId,
  fmtMinToTime,
  fmtTimeLabel,
  formatLongDateUtc,
  formatMdyDate,
  formatMonthYearUtc,
  blockTitleFromDraft,
  buildBlocksFromDraft,
  getCalendarQueryDateRange,
  getPublicBusinessHoursInterval,
  getPublicBusinessHoursNotAvailableNote,
  isPublicBusinessHoursNotAvailable,
  type CalendarQueryDateRange,
  type BlockTimeDraft,
  type Interval,
  intervalsOverlap,
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
} from "../calendar.utils";
import {
  BOOKING_SCENARIO_LABELS,
  calendarBookingStatusLabel,
  canDiscardBookingRequest,
  getBookingScenarioIndicators,
  isBookingRequestAccepted,
  scenarioIndicatorDisplayLabel,
  statusAccentColor,
} from "../bookingStatus";
import {
  isRefundApplicable,
  resolveProfessionalBookingActions,
  showProfessionalActionMenu,
} from "../bookingStatusActions";
import BookingGuidelineIcon from "../BookingGuidelineIcon";
import BookingRequestAcceptedPanel from "../BookingRequestAcceptedPanel";
import BookingDrawerTotalPriceCard from "../BookingDrawerTotalPriceCard";
import PrepaymentStatusIcon from "../PrepaymentStatusIcon";
import { PREPAYMENT_STATUS_LABELS } from "../PrepaymentStatusIcon";
import BookingIndicatorIcon, {
  BOOKING_INDICATOR_LABELS,
} from "../BookingIndicatorIcon";
import BookingRequestBadge, {
  resolveBookingRequestBadgeState,
  resolveProfessionalBookingRequestDirection,
} from "../BookingRequestBadge";
import BookingRequestReceivedIcon from "../BookingRequestReceivedIcon";
import BookingRequestSentIcon from "../BookingRequestSentIcon";
import PaymentDueIcon from "../../client-booking/PaymentDueIcon";
import { useBookingPaymentDueMeta } from "../resolveBookingPaymentDueMeta";
import { resolveBookingResponseIndicators } from "../bookingResponseStatus";
import {
  resolveCalendarPrepaymentStatus,
  toPrepaymentIconVariant,
} from "../prepaymentStatus";
import type {
  CalendarBlock,
  CalendarBookingServiceItem,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarBookingLocation,
  CalendarEvent,
  CalendarSubTab,
  CalendarViewMode,
  ProfessionalFixedLocationCalendarData,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildCreateCalendarEntryPayload,
  isApiCalendarEventId,
  mapCalendarEntryToEvent,
} from "../calendar-entry.mappers";
import type {
  BookingNotificationEvent,
  CreateCalendarEntryRequest,
  CalendarEntry,
  UpsertCalendarSettingsRequest,
} from "../../../../store/services/businessApi";
import {
  useGetMyBookingsQuery,
  useLazyLookupMollureClientByEmailQuery,
  useUploadBookingAttachmentsMutation,
  useManageBookingEditRequestMutation,
} from "../../../../store/services/businessApi";
import { GENDER_OPTIONS, type GenderOption } from "../../../../lib/gender-options";
import {
  sanitizeDecimalInput,
  sanitizeDigitsInput,
  sanitizeNameInput,
} from "../../../../lib/field-input";
import {
  getOptionalPhoneValidationErrors,
  getPhoneValidationErrors,
  phoneDraftFromStoredContact,
} from "../../../../lib/phone-validation";
import { resolveMediaUrl } from "../../../../lib/resolveMediaUrl";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  calendarSettings?: ParsedCalendarSettings | null;
  serviceOptions?: string[];
  serviceCatalog?: readonly BookingCatalogService[];
  serviceOrderDefaults?: ServiceOrderSettings;
  fixedLocationAddress?: string;
  lateRescheduleFeePercentDefault?: string;
  cancellationBeforeHours?: number | null;
  cancellationBeforeMinutes?: number | null;
  clientOptions?: readonly {
    name: string;
    email: string;
    mollureUserId?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    clientKind?: "individual" | "company";
  }[];
  isSaving?: boolean;
  onCreateCalendarEntry?: (
    payload: CreateCalendarEntryRequest,
  ) => Promise<CalendarEntry | void>;
  onUpdateCalendarEntry?: (
    id: string,
    payload: Omit<CreateCalendarEntryRequest, never>,
  ) => Promise<CalendarEntry | void>;
  onSaveCalendarSettings?: (
    payload: UpsertCalendarSettingsRequest,
  ) => Promise<void>;
  onSyncServiceOrderToSetup?: (
    serviceOrder: ServiceOrderSettings,
  ) => Promise<void>;
  onDeleteCalendarEntry?: (id: string) => Promise<void>;
  onUpdateBookingStatus?: (
    id: string,
    status:
      | "requested"
      | "cancelled"
      | "completed"
      | "confirmed"
      | "in_progress"
      | "no_show"
      | "invalid",
    options?: {
      notification_event?: BookingNotificationEvent;
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
    event: BookingNotificationEvent,
    options?: { initiated_by?: "client" | "professional"; message?: string },
  ) => Promise<void>;
  onUpdateCalendarEntryStatus?: (
    id: string,
    status:
      | "requested"
      | "cancelled"
      | "completed"
      | "confirmed"
      | "in_progress"
      | "no_show"
      | "invalid",
  ) => Promise<void>;
  onDateRangeChange?: (range: CalendarQueryDateRange) => void;
};

const toDateTimeInput = (date: string, time: string) => `${date}T${time}:00`;
const locationToApi = (location: CalendarBookingLocation) =>
  location === "DL" ? "desired" : "fixed";
const isMinuteInAvailability = (minute: number, windows: readonly Interval[]) =>
  windows.some((w) => minute >= w.startMin && minute < w.endMin);
const formatWeekDayName = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
const formatWeekDayDate = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export default function ProfessionalFixedLocationCalendar({
  data,
  calendarSettings,
  serviceOptions = [],
  serviceCatalog = [],
  serviceOrderDefaults,
  fixedLocationAddress,
  lateRescheduleFeePercentDefault,
  cancellationBeforeHours,
  cancellationBeforeMinutes,
  clientOptions = [],
  isSaving = false,
  onCreateCalendarEntry,
  onUpdateCalendarEntry,
  onSaveCalendarSettings,
  onSyncServiceOrderToSetup,
  onDeleteCalendarEntry,
  onUpdateBookingStatus,
  onDispatchBookingNotification,
  onUpdateCalendarEntryStatus,
  onDateRangeChange,
}: ProfessionalFixedLocationCalendarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { settings: financeSettings, setSettings: setFinanceSettings } =
    useFinanceInvoiceSettings();
  const [uploadBookingAttachments] = useUploadBookingAttachmentsMutation();
  const [manageBookingEditRequest] = useManageBookingEditRequestMutation();

  /** Same list shown in Select Services and used when saving the selection. */
  const baseServiceCatalog = React.useMemo(
    () => [...serviceCatalog],
    [serviceCatalog],
  );
  const [serviceCatalogPatches, setServiceCatalogPatches] = React.useState<
    Record<string, Partial<BookingCatalogService>>
  >({});
  const selectableServiceCatalog = React.useMemo(
    () =>
      baseServiceCatalog.map((service) => {
        const patch = serviceCatalogPatches[service.id];
        return patch ? { ...service, ...patch } : service;
      }),
    [baseServiceCatalog, serviceCatalogPatches],
  );
  const { openMessaging } = useMessagingWidget();
  const [openMessagingForBooking] = useOpenMessagingForBookingMutation();

  const openBookingMessages = React.useCallback(
    (ev: CalendarEvent) => {
      const bookingRef = ev.bookingCode ?? extractBookingId(ev.id);
      const clientName = ev.showClientName?.trim();
      void (async () => {
        try {
          const result = await openMessagingForBooking({ bookingRef }).unwrap();
          openMessaging({
            threadId: result.threadId,
            bookingRef: result.bookingRef,
            searchPrefill: result.thread?.name || clientName || undefined,
          });
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              "Unable to open chat for this booking.",
            ),
          });
          openMessaging({
            bookingRef,
            searchPrefill: clientName || undefined,
          });
        }
      })();
    },
    [openMessaging, openMessagingForBooking, showSnackbar],
  );

  const [events, setEvents] = React.useState<readonly CalendarEvent[]>(() => [
    ...data.events,
  ]);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(
    null,
  );
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

  // Sync whenever overview payload changes (ids or content). Include notes/title
  // so client EBR time/service updates replace the grid without a page reload.
  const overviewEventKey = React.useMemo(
    () =>
      data.events
        .map(
          (event) =>
            [
              event.id,
              event.date,
              event.start,
              event.end,
              event.status,
              event.title,
              event.bookingScenario ?? "",
              event.updatedAt ?? "",
              event.notes ?? "",
              event.details?.services?.map((s) => s.id).join(",") ?? "",
            ].join(":"),
        )
        .join("|"),
    [data.events],
  );
  React.useEffect(() => {
    if (isEditingExisting) return;
    setEvents([...data.events]);
  }, [overviewEventKey, data.events, isEditingExisting]);

  const [blocks, setBlocks] = React.useState<readonly CalendarBlock[]>(() => [
    ...data.blocks,
  ]);
  React.useEffect(() => {
    setBlocks((prev) => {
      const apiKeys = new Set(
        data.blocks.map(
          (block) =>
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
        ),
      );
      const localBlocks = prev.filter(
        (block) =>
          block.id.startsWith("blk-local-") &&
          !apiKeys.has(
            `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
          ),
      );
      return [...data.blocks, ...localBlocks];
    });
  }, [data.blocks]);

  const addMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const [productCatalog, setProductCatalog] = React.useState<
    BookingCatalogProduct[]
  >([]);
  const [editingCatalogProductId, setEditingCatalogProductId] = React.useState<
    string | null
  >(null);

  /** Sync retail products from this professional's finance settings (backend). */
  React.useEffect(() => {
    setProductCatalog(
      financeSettings.products.map((product) => ({
        id: product.id,
        name: product.name,
        price: parseFinancePrice(product.price),
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      })),
    );
  }, [financeSettings.products]);

  const persistedUniqueCatalog = React.useMemo<BookingCatalogProduct[]>(
    () =>
      (financeSettings.uniqueItems ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        price: parseFinancePrice(item.price),
        vat: item.vat,
        unit: item.unit,
        discountType: item.discountType,
        discountAmount: item.discountAmount,
      })),
    [financeSettings.uniqueItems],
  );

  const defaultDateIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [activeSubTab, setActiveSubTab] = React.useState<CalendarSubTab>(
    data.initialSubTab,
  );
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("day");
  const [activeDateIso, setActiveDateIso] = React.useState(defaultDateIso);

  React.useEffect(() => {
    onDateRangeChange?.(getCalendarQueryDateRange(activeDateIso, viewMode));
  }, [activeDateIso, onDateRangeChange, viewMode]);

  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const [teamActionAnchor, setTeamActionAnchor] =
    React.useState<HTMLElement | null>(null);
  const [teamMenuResourceId, setTeamMenuResourceId] = React.useState("");
  const [datePickerAnchor, setDatePickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [slotDrawerTab, setSlotDrawerTab] = React.useState<
    "booking" | "sales" | "activity"
  >("booking");
  const [activityDetailItem, setActivityDetailItem] =
    React.useState<BookingActivityItem | null>(null);
  const [slotLocation, setSlotLocation] =
    React.useState<CalendarBookingLocation>(data.supportedLocations[0] ?? "FL");
  const [slotBookingType, setSlotBookingType] =
    React.useState<CalendarBookingType>("Requests");
  const [slotStatus, setSlotStatus] = React.useState<
    | "Confirmed"
    | "Requested"
    | "In Progress"
    | "No Show"
    | "Completed"
    | "Cancelled"
    | "Invalid"
  >("Requested");
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotCalendarOpen, setSlotCalendarOpen] = React.useState(false);
  const [slotCalendarTouched, setSlotCalendarTouched] = React.useState(false);
  /** When false, drawer was opened from a calendar slot click — hide manual time picker. */
  const [allowDrawerTimeSelection, setAllowDrawerTimeSelection] =
    React.useState(false);
  const [discardBrOpen, setDiscardBrOpen] = React.useState(false);
  const [discardEbrOpen, setDiscardEbrOpen] = React.useState(false);
  const [erNoteDialogOpen, setErNoteDialogOpen] = React.useState(false);
  const [incomingConfirmAction, setIncomingConfirmAction] = React.useState<
    "accept" | "suggest" | "reject" | null
  >(null);
  const [incomingRequestEditMode, setIncomingRequestEditMode] =
    React.useState(false);
  const [originalServicesSnapshot, setOriginalServicesSnapshot] =
    React.useState<BookingServiceLineItem[]>([]);
  const [slotAddMenuAnchor, setSlotAddMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [bookingActionAnchor, setBookingActionAnchor] =
    React.useState<HTMLElement | null>(null);
  const [noShowModalOpen, setNoShowModalOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [pendingBookingAction, setPendingBookingAction] =
    React.useState<CalendarBookingAction | null>(null);
  const [addMenuTarget, setAddMenuTarget] = React.useState<"client" | string>(
    "client",
  );
  const [selectionTarget, setSelectionTarget] = React.useState<
    "client" | string
  >("client");
  const [selectedServices, setSelectedServices] = React.useState<
    BookingServiceLineItem[]
  >([]);
  const [serviceSelectionDraft, setServiceSelectionDraft] = React.useState<
    string[]
  >([]);
  const [serviceOverridesDraft, setServiceOverridesDraft] = React.useState<
    Record<string, Partial<BookingServiceLineItem>>
  >({});
  const [serviceEditDraft, setServiceEditDraft] =
    React.useState<BookingServiceEditDraft>(() =>
      emptyBookingServiceEditDraft(),
    );
  const [serviceEditAttempted, setServiceEditAttempted] = React.useState(false);
  /** When true, client already assigned staff — hide assign UI on Edit Service. */
  const [editServiceStaffLocked, setEditServiceStaffLocked] =
    React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<
    BookingProductLineItem[]
  >([]);
  const [productSelectionDraft, setProductSelectionDraft] =
    React.useState<BookingProductSelectionDraft>(() =>
      createEmptyProductSelectionDraft(),
    );
  const [uniqueItemDraft, setUniqueItemDraft] =
    React.useState<BookingUniqueItemDraft>(() => emptyBookingUniqueItemDraft());
  const [uniqueItemOrigin, setUniqueItemOrigin] = React.useState<
    "products" | "booking"
  >("products");
  const [bookingUniqueItems, setBookingUniqueItems] = React.useState<
    BookingUniqueItemLine[]
  >([]);
  const [customBookingProducts, setCustomBookingProducts] = React.useState<
    BookingCatalogProduct[]
  >([]);
  const [pendingCatalogDelete, setPendingCatalogDelete] =
    React.useState<BookingCatalogProduct | null>(null);
  const mergedCustomBookingProducts = React.useMemo(() => {
    const byId = new Map<string, BookingCatalogProduct>();
    persistedUniqueCatalog.forEach((product) => byId.set(product.id, product));
    customBookingProducts.forEach((product) => byId.set(product.id, product));
    return Array.from(byId.values());
  }, [customBookingProducts, persistedUniqueCatalog]);
  const [showInlineGuestField, setShowInlineGuestField] = React.useState(false);
  const [inlineGuestDraft, setInlineGuestDraft] = React.useState({
    firstName: "",
    lastName: "",
  });
  const [inlineGuestParticipantType, setInlineGuestParticipantType] =
    React.useState<"guest" | "model">("guest");
  const [dlGuestMenuAnchor, setDlGuestMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [bookingProjectEnabled, setBookingProjectEnabled] =
    React.useState(false);
  const [bookingProjectDescription, setBookingProjectDescription] =
    React.useState("");
  const [bookingProjectUploads, setBookingProjectUploads] = React.useState<
    Array<{
      id: string;
      name: string;
      previewUrl?: string;
      file?: File;
      url?: string;
      mimeType?: string;
      kind?: "image" | "document";
    }>
  >([]);
  const projectFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [bufferDraft, setBufferDraft] = React.useState({
    title: "",
    teamMemberId: "",
    durationMins: "45",
    endTime: "",
  });
  const [bookingGuests, setBookingGuests] = React.useState<
    Array<{
      id: string;
      name: string;
      services: BookingServiceLineItem[];
      products: BookingProductLineItem[];
      participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
      planningActivity?: string;
      planningDuration?: string;
      bufferTeamMemberId?: string;
      bufferEndTime?: string;
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
  const [bookingTotalDiscount, setBookingTotalDiscount] =
    React.useState<ManualEntryDiscount | null>(null);
  const [bookingDiscountModalOpen, setBookingDiscountModalOpen] =
    React.useState(false);
  const [showLateCancellation, setShowLateCancellation] = React.useState(false);
  const [lateCancellationFeePercent, setLateCancellationFeePercent] =
    React.useState("");
  const [showLateRescheduling, setShowLateRescheduling] = React.useState(false);
  const [lateRescheduleFeePercent, setLateRescheduleFeePercent] =
    React.useState("");
  const [showInternalNote, setShowInternalNote] = React.useState(false);
  const [bookingInternalNote, setBookingInternalNote] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "online" | "offline"
  >("online");
  const [showKilometerAllowance, setShowKilometerAllowance] =
    React.useState(false);
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
  const [bookingMoreAnchor, setBookingMoreAnchor] =
    React.useState<HTMLElement | null>(null);
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
    | "add-buffer"
  >("new-booking");
  const [nonMollureClientType, setNonMollureClientType] = React.useState<
    "" | "individual" | "company"
  >("");
  const [slotSaveAttempted, setSlotSaveAttempted] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<null | {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
  }>(null);
  const [addClientSource, setAddClientSource] = React.useState<
    "" | "client-list" | "mollure-platform" | "non-mollure" | "guest"
  >("");
  const [clientListSelectedEmail, setClientListSelectedEmail] =
    React.useState("");
  const [platformEmailInput, setPlatformEmailInput] = React.useState("");
  const [platformEmailMatch, setPlatformEmailMatch] = React.useState<null | {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    countryCode?: string | null;
    userType?: string | null;
  }>(null);
  const [platformLookupStatus, setPlatformLookupStatus] = React.useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");
  const [lookupMollureClientByEmail] = useLazyLookupMollureClientByEmailQuery();

  React.useEffect(() => {
    setSlotSaveAttempted(false);
  }, [slotBookingScreen]);

  React.useEffect(() => {
    if (slotBookingScreen !== "add-client-choice") return;
    setAddClientSource("");
    setPlatformEmailInput("");
    setPlatformEmailMatch(null);
    setPlatformLookupStatus("idle");
  }, [slotBookingScreen]);

  const clientList = clientOptions;

  const platformEmailQuery = platformEmailInput.trim().toLowerCase();
  const platformEmailComplete = /^\S+@\S+\.\S+$/.test(platformEmailQuery);

  React.useEffect(() => {
    if (addClientSource !== "mollure-platform" || !platformEmailComplete) {
      setPlatformEmailMatch(null);
      setPlatformLookupStatus("idle");
      return;
    }

    let cancelled = false;
    setPlatformLookupStatus("loading");
    setPlatformEmailMatch(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await lookupMollureClientByEmail({
          email: platformEmailQuery,
        }).unwrap();
        if (cancelled) return;
        const client = response.data;
        if (!client?.email) {
          setPlatformEmailMatch(null);
          setPlatformLookupStatus("not_found");
          return;
        }
        setPlatformEmailMatch({
          id: client.id,
          name: client.name || client.email,
          email: client.email,
          phone: client.phone,
          countryCode: client.country_code,
          userType: client.user_type ?? null,
        });
        setPlatformLookupStatus("found");
      } catch {
        if (cancelled) return;
        setPlatformEmailMatch(null);
        setPlatformLookupStatus("not_found");
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    addClientSource,
    lookupMollureClientByEmail,
    platformEmailComplete,
    platformEmailQuery,
  ]);

  const servicesTotal = React.useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + getEffectiveServicePrice(service),
        0,
      ),
    [selectedServices],
  );
  const productsTotal = React.useMemo(
    () => selectedProducts.reduce((sum, p) => sum + p.price, 0),
    [selectedProducts],
  );
  const uniqueItemsTotal = React.useMemo(
    () => bookingUniqueItems.reduce((sum, item) => sum + item.price, 0),
    [bookingUniqueItems],
  );
  const guestsTotal = React.useMemo(
    () =>
      bookingGuests.reduce(
        (sum, guest) =>
          sum +
          guest.services.reduce(
            (serviceSum, service) =>
              serviceSum + getEffectiveServicePrice(service),
            0,
          ) +
          guest.products.reduce(
            (productSum, product) => productSum + product.price,
            0,
          ),
        0,
      ),
    [bookingGuests],
  );
  const subtotalPrice =
    servicesTotal + productsTotal + uniqueItemsTotal + guestsTotal;
  const lineActualAmount = React.useMemo(() => {
    const servicesActual = selectedServices.reduce(
      (sum, service) => sum + service.price,
      0,
    );
    const productsActual = selectedProducts.reduce(
      (sum, product) => sum + productLineOriginalAmount(product),
      0,
    );
    const uniqueActual = bookingUniqueItems.reduce(
      (sum, item) => sum + productLineOriginalAmount(item),
      0,
    );
    const guestsActual = bookingGuests.reduce(
      (sum, guest) =>
        sum +
        guest.services.reduce(
          (serviceSum, service) => serviceSum + service.price,
          0,
        ) +
        guest.products.reduce(
          (productSum, product) =>
            productSum + productLineOriginalAmount(product),
          0,
        ),
      0,
    );
    return servicesActual + productsActual + uniqueActual + guestsActual;
  }, [bookingGuests, bookingUniqueItems, selectedProducts, selectedServices]);
  const lineDiscountAmount = Math.max(0, lineActualAmount - subtotalPrice);
  const kilometerAllowanceAmount = React.useMemo(
    () =>
      showKilometerAllowance
        ? resolveKilometerAllowanceAmount(kilometerAllowanceDraft)
        : 0,
    [kilometerAllowanceDraft, showKilometerAllowance],
  );
  const bookingPrice = React.useMemo(
    () =>
      computeBookingPrice({
        lineSubtotal: subtotalPrice,
        extrasAmount: kilometerAllowanceAmount,
        discount: bookingTotalDiscount,
        showLateCancellation,
        lateCancellationFeePercent,
        showLateRescheduling,
        lateRescheduleFeePercent,
        showPrepayment,
        prepaymentPercent,
        // When prepayment is configured, Total Price reflects amount still due.
        prepaymentPaid: showPrepayment,
      }),
    [
      bookingTotalDiscount,
      kilometerAllowanceAmount,
      lateCancellationFeePercent,
      lateRescheduleFeePercent,
      prepaymentPercent,
      showLateCancellation,
      showLateRescheduling,
      showPrepayment,
      subtotalPrice,
    ],
  );
  const bookingDiscountAmount = bookingPrice.discountAmount;
  const lateCancellationFeeAmount = bookingPrice.lateCancellationFeeAmount;
  const lateRescheduleFeeAmount = bookingPrice.lateRescheduleFeeAmount;
  const prepaymentAmount = bookingPrice.prepaymentAmount;
  const remainingAfterPrepayment = bookingPrice.remainingAfterPrepayment;
  /** Amount due in the drawer (discount + fees + prepaid applied). */
  const totalPrice = bookingPrice.payableTotal;
  /** Persisted booking value (discount + fees, before prepaid deduction). */
  const bookingTotalForSave = bookingPrice.bookingTotal;
  const [bookingPhoneDraft, setBookingPhoneDraft] = React.useState<{
    phoneCode: string;
    phoneNumber: string;
  }>(() => ({
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
    bookingStatuses,
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
  const [publicBusinessHoursOpen, setPublicBusinessHoursOpen] =
    React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  const [slotDrawerOpen, setSlotDrawerOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<null | SelectedSlot>(
    null,
  );

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
    () =>
      editingEventId
        ? (events.find((event) => event.id === editingEventId) ?? null)
        : null,
    [editingEventId, events],
  );

  const viewingBookingChatRef =
    viewingBookingEvent?.bookingCode ??
    (viewingBookingEvent ? extractBookingId(viewingBookingEvent.id) : undefined);
  const viewingBookingUnread = useProfessionalMessagingUnread(viewingBookingChatRef);

  const viewingBookingPaymentDue = useBookingPaymentDueMeta(viewingBookingEvent);

  const drawerSalesActivityContext = React.useMemo<CalendarEvent | null>(() => {
    if (viewingBookingEvent) return viewingBookingEvent;
    if (!selectedSlot) return null;

    return {
      id: editingEventId ?? "draft",
      resourceId: selectedSlot.resourceId,
      date: selectedSlot.date,
      start: selectedSlot.start,
      end: selectedSlot.end,
      title:
        selectedServices[0]?.name ??
        selectedProducts[0]?.name ??
        bookingUniqueItems[0]?.name ??
        "Booking",
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
        selectedProducts: [...selectedProducts, ...bookingUniqueItems],
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
    bookingUniqueItems,
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
    skip:
      !slotDrawerOpen ||
      (slotDrawerTab !== "activity" && slotDrawerTab !== "sales"),
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
      ? (parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null)
      : null;
    const currentCode = drawerSalesActivityContext?.bookingCode ?? null;
    return all.filter((booking) => {
      if (currentId && String(booking.id) === String(currentId)) return true;
      if (
        currentCode &&
        booking.unique_code &&
        booking.unique_code === currentCode
      )
        return true;
      const email = clientActivityIdentity.email.toLowerCase();
      const name = clientActivityIdentity.name.toLowerCase();
      const bookingEmail = (booking.customer_email ?? "").trim().toLowerCase();
      const bookingName = (booking.customer_name || booking.client_name || "")
        .trim()
        .toLowerCase();
      if (email && bookingEmail && email === bookingEmail) return true;
      if (name && bookingName && name === bookingName) return true;
      return false;
    });
  }, [
    clientActivityIdentity.email,
    clientActivityIdentity.name,
    drawerSalesActivityContext,
    myBookingsResponse?.data,
  ]);

  const activityTimelineItems = React.useMemo(
    () =>
      buildBookingActivityTimeline({
        bookings: clientBookingsForActivity,
        clientEmail: clientActivityIdentity.email,
        clientName: clientActivityIdentity.name,
        currentBookingId: drawerSalesActivityContext
          ? (parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null)
          : null,
        currentBookingCode: drawerSalesActivityContext?.bookingCode ?? null,
        currentScenario: drawerSalesActivityContext?.bookingScenario ?? null,
        currentStatus: drawerSalesActivityContext?.status ?? null,
        currentCancellationReason:
          drawerSalesActivityContext?.details?.cancellationReason ?? null,
        currentProfessionalName:
          data.resources.find(
            (r) => r.id === drawerSalesActivityContext?.resourceId,
          )?.name ?? null,
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
  const isCancelledOrInvalidBooking =
    viewingBookingEvent?.status === "Cancelled" ||
    viewingBookingEvent?.status === "Invalid";

  const noShowParticipants = React.useMemo(() => {
    if (!viewingBookingEvent) return [];
    const list: { id: string; name: string }[] = [];
    const clientName = viewingBookingEvent.showClientName?.trim();
    if (clientName) list.push({ id: "client", name: clientName });

    const people = viewingBookingEvent.details?.clientSnapshot?.people ?? [];
    let modelOrdinal = 0;
    for (const person of people) {
      if (person.isRequester) continue;
      if (
        person.participantType === "planning" ||
        person.participantType === "notes" ||
        person.name?.trim() === "Planning" ||
        person.name?.trim().toLowerCase() === "notes"
      )
        continue;
      const trimmed = person.name?.trim() ?? "";
      let name: string;
      if (person.participantType === "model") {
        modelOrdinal += 1;
        name =
          trimmed && trimmed.toLowerCase() !== "model"
            ? trimmed
            : `Model ${modelOrdinal}`;
      } else {
        name = trimmed && trimmed.toLowerCase() !== "guest" ? trimmed : "Guest";
      }
      list.push({ id: person.id, name });
    }
    if (list.length === 0) list.push({ id: "client", name: "Client" });
    return list;
  }, [viewingBookingEvent]);

  const showIncomingRequestActions =
    isViewingBooking &&
    canRespondToIncomingRequest(viewingBookingEvent) &&
    !isEditingExisting;
  const showIncomingErActions =
    isViewingBooking &&
    canRespondToConfirmedEr(viewingBookingEvent) &&
    !isEditingExisting;
  const incomingClientNote =
    viewingBookingEvent?.details?.clientNote?.trim() || "";
  const incomingErNote = React.useMemo(() => {
    if (!showIncomingErActions || !viewingBookingEvent) return null;
    const detailsNote = viewingBookingEvent.details?.editRequestNote?.trim();
    if (
      detailsNote &&
      viewingBookingEvent.details?.editRequestInitiatedBy === "client"
    ) {
      return detailsNote;
    }
    const bookingRef =
      viewingBookingEvent.bookingCode ??
      extractBookingId(viewingBookingEvent.id);
    const rec = getBookingEditRequest(bookingRef);
    if (
      rec.status === "pending" &&
      rec.initiatedBy === "client" &&
      rec.note?.trim()
    ) {
      return rec.note.trim();
    }
    return null;
  }, [showIncomingErActions, viewingBookingEvent]);
  const showDiscardEbr =
    isViewingBooking &&
    canDiscardEbr(viewingBookingEvent) &&
    !isEditingExisting;
  const negotiationDetails = viewingBookingEvent?.details;
  /** Pro drawer: Edited only for client-originated line changes (never own edits). */
  const resolveServiceEditTag = React.useCallback(
    (serviceId: string) => {
      const ebr = viewingBookingEvent
        ? parseStoredEbrFromNotes(viewingBookingEvent.notes)
        : null;
      const clientRoundEbr =
        ebr?.lastEditedBy === "client" ? ebr : null;
      return getServiceEditTag(serviceId, negotiationDetails, clientRoundEbr);
    },
    [negotiationDetails, viewingBookingEvent],
  );

  const resolveProductEditTag = React.useCallback(
    (productId: string) => {
      const ebr = viewingBookingEvent
        ? parseStoredEbrFromNotes(viewingBookingEvent.notes)
        : null;
      const clientRoundEbr =
        ebr?.lastEditedBy === "client" ? ebr : null;
      return getProductEditTag(productId, negotiationDetails, clientRoundEbr);
    },
    [negotiationDetails, viewingBookingEvent],
  );
  const isViewingExisting =
    isCompletedBooking ||
    isCancelledOrInvalidBooking ||
    (Boolean(editingEventId) && !isEditingExisting);
  const isSelectedCompanyClient = selectedClient?.clientKind === "company";
  const canUseBookingProject =
    slotLocation === "DL" && slotClientAdded && isSelectedCompanyClient;

  React.useEffect(() => {
    if (!isSelectedCompanyClient && !isViewingExisting) {
      setBookingProjectEnabled(false);
    }
  }, [isSelectedCompanyClient, isViewingExisting]);

  const bookingEditSignature = React.useMemo(
    () =>
      JSON.stringify({
        services: selectedServices,
        products: selectedProducts,
        uniqueItems: bookingUniqueItems,
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
        projectEnabled: bookingProjectEnabled,
        projectDescription: bookingProjectDescription,
        projectUploads: bookingProjectUploads.map((u) => ({
          id: u.id,
          name: u.name,
        })),
      }),
    [
      selectedServices,
      selectedProducts,
      bookingUniqueItems,
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
      bookingProjectEnabled,
      bookingProjectDescription,
      bookingProjectUploads,
    ],
  );
  const [editBaselineSignature, setEditBaselineSignature] = React.useState<
    string | null
  >(null);
  React.useEffect(() => {
    if (isEditingExisting) {
      setEditBaselineSignature((prev) =>
        prev === null ? bookingEditSignature : prev,
      );
      return;
    }
    if (!editingEventId) {
      setEditBaselineSignature(null);
      return;
    }
    // View / accept / live-hydrate must not look like an unsaved edit.
    setEditBaselineSignature(bookingEditSignature);
  }, [isEditingExisting, bookingEditSignature, editingEventId]);
  const isBookingDirty =
    Boolean(editingEventId) &&
    editBaselineSignature !== null &&
    bookingEditSignature !== editBaselineSignature;

  const lockClientIdentity =
    isViewingBooking && isClientOriginatedBooking(viewingBookingEvent);
  const isProfessionalManualBooking =
    !viewingBookingEvent || !isClientOriginatedBooking(viewingBookingEvent);
  const showManualBookingParticipantActions =
    isProfessionalManualBooking && !isViewingExisting;
  const showLineItemRemoveButton = !isViewingExisting;
  const showClientRemoveButton =
    showLineItemRemoveButton && !lockClientIdentity;
  const hideClientBookingFooterActions =
    slotBookingScreen === "new-booking" && showIncomingRequestActions;
  const hideClientBookingEditButton = showIncomingRequestActions;
  const isBookingSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "add-unique-item" ||
    slotBookingScreen === "add-buffer";
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
      const locLabel =
        slotLocation === "FL" ? "Fixed Location" : "Desired Location";
      const timePart = selectedSlot.start ? selectedSlot.start.slice(0, 5) : "";
      return [locLabel, formatMdyDate(selectedSlot.date), timePart]
        .filter(Boolean)
        .join(" · ");
    }
    return "Select calender";
  }, [
    isViewingBooking,
    slotCalendarTouched,
    selectedSlot?.date,
    selectedSlot?.start,
    slotLocation,
  ]);

  const clientEbrSuggestion = React.useMemo(() => {
    if (!viewingBookingEvent || viewingBookingEvent.bookingScenario !== "EBR")
      return null;
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

  const [publicBusinessHoursDraft, setPublicBusinessHoursDraft] =
    React.useState<PublicBusinessHoursDraft>(() => ({
      locations: [],
      schedule: "",
      day: "",
      dateFrom: "",
      dateTo: "",
      startTime: "16:30",
      endTime: "17:30",
      notAvailable: false,
      note: "",
    }));

  const [designDraft, setDesignDraft] = React.useState<CalendarDesignDraft>(
    () => ({
      scope: "Categories",
      colorsByCategory: {},
      colorsByService: {},
      colorsByStatus: {},
      colorsByTeamMember: {},
    }),
  );
  const [appliedDesign, setAppliedDesign] = React.useState<CalendarDesignDraft>(
    () => ({
      scope: "Categories",
      colorsByCategory: {},
      colorsByService: {},
      colorsByStatus: {},
      colorsByTeamMember: {},
    }),
  );
  const [bookingRules, setBookingRules] = React.useState<BookingRules>(() =>
    defaultBookingRules(),
  );
  const [scheduleRows, setScheduleRows] = React.useState<
    ScheduleAvailabilityRow[]
  >([]);
  const [dateOverrides, setDateOverrides] = React.useState<
    ParsedCalendarSettings["availability"]["dateOverrides"]
  >([]);
  const [serviceOrderDraft, setServiceOrderDraft] =
    React.useState<ServiceOrderSettings>(() =>
      dedupeServiceOrderSettings(
        normalizeServiceOrderSettings(undefined, {
          categories: serviceOrderDefaults?.categories ?? [],
          servicesByCategory: serviceOrderDefaults?.servicesByCategory ?? {},
        }),
      ),
    );
  const selectableServiceCategories = React.useMemo(() => {
    const patchedServices = selectableServiceCatalog.map((service) => ({
      ...service,
      category: service.category?.trim() || "Services",
    }));
    return buildOrderedBookingServiceCategories(
      patchedServices,
      serviceOrderDraft,
    );
  }, [selectableServiceCatalog, serviceOrderDraft]);
  const [serviceOrderOpen, setServiceOrderOpen] = React.useState(false);
  const [scheduleResourceFilter, setScheduleResourceFilter] = React.useState<
    string[]
  >([]);
  const [editAvailabilityOpen, setEditAvailabilityOpen] = React.useState(false);
  const [editAvailabilityDraft, setEditAvailabilityDraft] =
    React.useState<EditAvailabilityDraft>(() => ({
      resourceId: "",
      date: "",
      locations: [...data.supportedLocations],
      shifts: [{ start: "09:00", end: "17:00" }],
    }));

  React.useEffect(() => {
    if (!calendarSettings) return;
    setBookingRules(
      calendarSettings.availability.bookingRules ?? defaultBookingRules(),
    );
    setScheduleRows(calendarSettings.availability.scheduleAvailability ?? []);
    setDateOverrides(calendarSettings.availability.dateOverrides ?? []);
    setAppliedDesign(calendarSettings.design);
    setDesignDraft(calendarSettings.design);
    if (calendarSettings.availability.serviceOrder) {
      setServiceOrderDraft(
        dedupeServiceOrderSettings(
          normalizeServiceOrderSettings(
            calendarSettings.availability.serviceOrder,
            serviceOrderDefaults,
          ),
        ),
      );
    } else if (serviceOrderDefaults) {
      setServiceOrderDraft(
        dedupeServiceOrderSettings(
          normalizeServiceOrderSettings(serviceOrderDefaults),
        ),
      );
    }
  }, [calendarSettings, serviceOrderDefaults]);

  const persistAvailabilitySettings = React.useCallback(
    async (next: {
      bookingRules?: BookingRules;
      scheduleAvailability?: ScheduleAvailabilityRow[];
      dateOverrides?: ParsedCalendarSettings["availability"]["dateOverrides"];
      serviceOrder?: ServiceOrderSettings;
      publicBusinessHours?: PublicBusinessHoursEntry[];
      design?: CalendarDesignDraft;
    }) => {
      await onSaveCalendarSettings?.({
        availability: {
          bookingRules: next.bookingRules ?? bookingRules,
          scheduleAvailability: next.scheduleAvailability ?? scheduleRows,
          dateOverrides: next.dateOverrides ?? dateOverrides,
          serviceOrder: next.serviceOrder ?? serviceOrderDraft,
          publicBusinessHours:
            next.publicBusinessHours ??
            calendarSettings?.availability.publicBusinessHours,
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

  const resolveEventCategoryKey = React.useCallback((event: CalendarEvent) => {
    const candidates = [
      event.title,
      ...(event.details?.services?.map((service) => service.name) ?? []),
    ].filter(Boolean);

    for (const text of candidates) {
      const iconId = resolveServiceCategorySliderIconId(String(text));
      if (iconId !== "generic" && iconId !== "all") return iconId;
    }
    return null;
  }, []);

  const lookupCategoryColor = React.useCallback(
    (categoryKey: string | null | undefined) => {
      if (!categoryKey) return undefined;
      const colors = appliedDesign.colorsByCategory ?? {};
      if (colors[categoryKey]) return colors[categoryKey];

      const entry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
        (item) => item.key === categoryKey,
      );
      if (!entry) return undefined;
      if (colors[entry.label]) return colors[entry.label];
      if (entry.key === "hair" && colors.Haar) return colors.Haar;
      return undefined;
    },
    [appliedDesign.colorsByCategory],
  );

  const resolveEventColors = React.useCallback(
    (event: CalendarEvent) => {
      const categoryKey = resolveEventCategoryKey(event);
      const categoryColor = lookupCategoryColor(categoryKey);
      const serviceNames = [
        event.title,
        ...(event.details?.services?.map((service) => service.name) ?? []),
      ].filter(Boolean);
      const namedServiceColor = serviceNames
        .map((name) => appliedDesign.colorsByService?.[String(name)])
        .find(Boolean);
      const teamColor = appliedDesign.colorsByTeamMember?.[event.resourceId];
      const statusColor = appliedDesign.colorsByStatus?.[event.status];

      let cardColor: string | undefined;
      if (appliedDesign.scope === "Team Members") {
        cardColor = teamColor ?? categoryColor;
      } else if (appliedDesign.scope === "Services") {
        cardColor = namedServiceColor ?? categoryColor;
      } else if (appliedDesign.scope === "Status") {
        cardColor = statusColor ?? categoryColor;
      } else {
        cardColor = categoryColor;
      }

      return {
        serviceColor: cardColor,
        statusColor,
      };
    },
    [appliedDesign, lookupCategoryColor, resolveEventCategoryKey],
  );

  const persistEventStatus = React.useCallback(
    async (
      eventId: string,
      status: CalendarEvent["status"],
      options?: {
        notification_event?: BookingNotificationEvent;
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
                  : status === "Invalid"
                    ? "invalid"
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
      event: BookingNotificationEvent,
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
    async (
      action:
        | "edit"
        | "in_progress"
        | "no_show"
        | "cancel"
        | "checkout"
        | "delete"
        | "rebook"
        | "refund"
        | "ok",
    ) => {
      setBookingActionAnchor(null);
      if (!editingEventId) return;

      if (action === "edit") {
        if (
          viewingBookingEvent?.status === "Cancelled" ||
          viewingBookingEvent?.status === "Invalid"
        ) {
          return;
        }
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        if (current?.status === "Confirmed") {
          const bookingRef =
            current.bookingCode ?? extractBookingId(current.id);
          const erFromNotes = parseStoredErFromNotes(current.notes);
          if (erFromNotes) {
            syncBookingEditRequestFromRemote(bookingRef, {
              status: erFromNotes.status,
              note: erFromNotes.note,
              initiatedBy: erFromNotes.initiatedBy,
              requestedAt: erFromNotes.requestedAt,
              approvedAt: erFromNotes.approvedAt,
              editGrantActive: erFromNotes.editGrantActive,
            });
          }
          if (
            current.bookingScenario === "ER" &&
            current.details?.requestDirection === "outgoing"
          ) {
            showSnackbar({
              severity: "info",
              message: "Edit request pending — waiting for the client.",
            });
            return;
          }
          if (isConfirmedEditGrantActive(bookingRef, "professional")) {
            setIsEditingExisting(true);
            return;
          }
          setErNoteDialogOpen(true);
          return;
        }
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

      if (action === "checkout") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const remaining = remainingAfterPrepayment;
        const waiting = remaining > 0;
        const nextDetails = {
          ...(current?.details ?? {}),
          waitingForPayment: waiting,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        try {
          await persistEventStatus(editingEventId, "Completed", {
            notes: nextNotes,
          });
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    status: "Completed",
                    notes: nextNotes,
                    details: nextDetails,
                  }
                : event,
            ),
          );
          setSlotStatus("Completed");
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to complete checkout.",
          });
          return;
        }
        setSlotDrawerTab("sales");
        return;
      }

      if (action === "ok") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const nextDetails = {
          ...(current?.details ?? {}),
          needsOk: false,
          ackScenario: undefined,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        try {
          await persistEventStatus(editingEventId, current?.status ?? "Confirmed", {
            notes: nextNotes,
          });
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to acknowledge booking.",
          });
          return;
        }
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  bookingScenario: undefined,
                  notes: nextNotes,
                  details: { ...(event.details ?? {}), needsOk: false, ackScenario: undefined },
                }
              : event,
          ),
        );
        showSnackbar({
          severity: "success",
          message: "Booking request acknowledged.",
        });
        return;
      }

      if (action === "delete") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const nextDetails = {
          ...(current?.details ?? {}),
          hiddenForProfessional: true,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        try {
          await persistEventStatus(editingEventId, current?.status ?? "Cancelled", {
            notes: nextNotes,
          });
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to remove booking from calendar.",
          });
          return;
        }
        setEvents((prev) => prev.filter((event) => event.id !== editingEventId));
        setEditingEventId(null);
        setSlotDrawerOpen(false);
        showSnackbar({
          severity: "success",
          message: "Booking removed from calendar.",
        });
        return;
      }

      if (action === "rebook") {
        setEditingEventId(null);
        setIsEditingExisting(false);
        setSlotStatus("Confirmed");
        setAllowDrawerTimeSelection(true);
        setSlotCalendarOpen(true);
        setSlotCalendarTouched(false);
        setSlotDrawerTab("booking");
        setSlotClientAdded(true);
        showSnackbar({
          severity: "info",
          message: "Rebook started — pick a new date/time and save.",
        });
        return;
      }

      if (action === "refund") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        const nextDetails = {
          ...(current?.details ?? {}),
          refunded: true,
          waitingForPayment: false,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(current?.notes),
          parseStoredErFromNotes(current?.notes),
        );
        try {
          await persistEventStatus(editingEventId, current?.status ?? "Completed", {
            notes: nextNotes,
          });
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEventId
                ? { ...event, notes: nextNotes, details: nextDetails }
                : event,
            ),
          );
        } catch {
          showSnackbar({
            severity: "error",
            message: "Unable to mark refund.",
          });
          return;
        }
        setSlotDrawerTab("sales");
        showSnackbar({
          severity: "success",
          message: "Refund recorded. Finish the payment in Sales if needed.",
        });
        return;
      }

      setPendingBookingAction(action);
    },
    [editingEventId, events, persistEventStatus, remainingAfterPrepayment, showSnackbar, viewingBookingEvent],
  );

  const handleConfirmCancel = React.useCallback(async () => {
    setCancelModalOpen(false);
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Cancelled");
      setIsEditingExisting(false);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? { ...event, status: "Cancelled" }
            : event,
        ),
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
      action === "in_progress"
        ? "Booking marked in progress."
        : "Booking cancelled.";
    try {
      await persistEventStatus(editingEventId, nextStatus);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? { ...event, status: nextStatus }
            : event,
        ),
      );
      showSnackbar({ severity: "success", message: successMessage });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update booking status."),
      });
    }
  }, [editingEventId, pendingBookingAction, persistEventStatus, showSnackbar]);

  const handleConfirmNoShow = React.useCallback(
    async (selectedIds: string[]) => {
      setNoShowModalOpen(false);
      if (!editingEventId) return;
      // Booking-level status only: require at least one person selected.
      // Partial selection still marks the booking no-show (client booked, did not attend).
      if (!selectedIds.length) return;
      try {
        await persistEventStatus(editingEventId, "No Show");
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? { ...event, status: "No Show" }
              : event,
          ),
        );
        showSnackbar({
          severity: "success",
          message: "Booking marked as no show.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to update booking status.",
          ),
        });
      }
    },
    [editingEventId, persistEventStatus, showSnackbar],
  );

  React.useEffect(() => {
    setBlockDraft((prev) => {
      const nextLocations = prev.locations.filter((loc) =>
        data.supportedLocations.includes(loc),
      );
      return {
        ...prev,
        locations: nextLocations.length
          ? nextLocations
          : [...data.supportedLocations],
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

  const visibleDates = React.useMemo(() => {
    if (viewMode === "day") return [activeDateIso];
    if (viewMode === "week") {
      const start = startOfWeekIso(activeDateIso);
      return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
    }
    // month: we still keep a single active date; month grid computed separately in UI.
    return [activeDateIso];
  }, [activeDateIso, viewMode]);

  /** Public business hours window for a date (union across FL/DL). */
  const getPublicWorkingHoursForDate = React.useCallback(
    (isoDate: string): Interval | null => {
      const entries = calendarSettings?.availability.publicBusinessHours;
      const locations = data.supportedLocations.length
        ? data.supportedLocations
        : (["FL", "DL"] as const);
      let start = Number.POSITIVE_INFINITY;
      let end = Number.NEGATIVE_INFINITY;
      for (const loc of locations) {
        const interval = getPublicBusinessHoursInterval(entries, isoDate, loc);
        if (!interval) continue;
        start = Math.min(start, interval.startMin);
        end = Math.max(end, interval.endMin);
      }
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
      ) {
        return null;
      }
      return { startMin: start, endMin: end };
    },
    [
      calendarSettings?.availability.publicBusinessHours,
      data.supportedLocations,
    ],
  );

  /** Grid height follows public hours for visible days (no full-day scroller). */
  const { startMin, endMin } = React.useMemo(() => {
    const step = grid.stepMinutes;
    let start = Number.POSITIVE_INFINITY;
    let end = Number.NEGATIVE_INFINITY;
    for (const iso of visibleDates) {
      const hours = getPublicWorkingHoursForDate(iso);
      if (!hours) continue;
      start = Math.min(start, hours.startMin);
      end = Math.max(end, hours.endMin);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return {
        startMin: grid.startHour * 60,
        endMin: grid.endHour * 60,
      };
    }
    return {
      startMin: Math.floor(start / step) * step,
      endMin: Math.ceil(end / step) * step,
    };
  }, [
    getPublicWorkingHoursForDate,
    grid.endHour,
    grid.startHour,
    grid.stepMinutes,
    visibleDates,
  ]);

  const rows = Math.max(
    1,
    Math.floor((endMin - startMin) / grid.stepMinutes),
  );
  const rowPx = 78;
  const laneHeaderPx = 48;
  const hasTeamMembers = data.resources.length > 0;
  // Week always needs the date header row; day only needs a header when staff exist.
  const timelineHeaderRows =
    viewMode === "week" ? (hasTeamMembers ? 2 : 1) : hasTeamMembers ? 1 : 0;
  const timelineHeaderPx = laneHeaderPx * timelineHeaderRows;

  const slotLines = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < rows; i++) out.push(startMin + i * grid.stepMinutes);
    return out;
  }, [rows, startMin, grid.stepMinutes]);

  React.useEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId("");
      return;
    }
    setSelectedResourceId((current) => {
      const stillValid =
        current &&
        filteredResources.some((resource) => resource.id === current);
      return stillValid ? current : filteredResources[0].id;
    });
  }, [filteredResources]);

  const activeResource = React.useMemo(
    () =>
      filteredResources.find((r) => r.id === selectedResourceId) ??
      filteredResources[0],
    [filteredResources, selectedResourceId],
  );

  const closeTeamMenu = React.useCallback(() => {
    setTeamActionAnchor(null);
    setTeamMenuResourceId("");
  }, []);

  const openTeamMenu = React.useCallback(
    (resourceId: string, anchor: HTMLElement) => {
      setTeamMenuResourceId(resourceId);
      setTeamActionAnchor(anchor);
    },
    [],
  );

  const selectTeamMember = React.useCallback(
    (resourceId: string) => {
      const normalizedId = String(resourceId);
      if (
        !data.resources.some((resource) => String(resource.id) === normalizedId)
      )
        return;

      // Day view shows one active lane but must keep all-date bookings visible.
      // Only switch the active header — do not focus-filter by team (client bookings
      // often have null team_member_id and would disappear).
      setSelectedResourceId(normalizedId);
      closeTeamMenu();
    },
    [closeTeamMenu, data.resources],
  );

  const teamMenuResource = React.useMemo(
    () =>
      data.resources.find((resource) => resource.id === teamMenuResourceId) ??
      activeResource,
    [activeResource, data.resources, teamMenuResourceId],
  );

  const displayedResources = React.useMemo(() => {
    // No team members yet: keep one anonymous lane so the time grid still renders.
    const emptyLane = {
      id: "unassigned",
      name: "Unassigned",
      avatarText: "U",
    } as (typeof filteredResources)[number];
    if (viewMode === "week") {
      if (activeResource) return [activeResource];
      return data.resources.length === 0 ? [emptyLane] : [];
    }
    // Day view: one body lane for the active (or first) team member.
    // Headers still list everyone; teamAll shows all events on this lane.
    if (viewMode === "day") {
      if (activeResource) return [activeResource];
      return data.resources.length === 0 ? [emptyLane] : [];
    }
    return filteredResources;
  }, [activeResource, data.resources.length, filteredResources, viewMode]);

  const knownResourceIds = React.useMemo(
    () => new Set(data.resources.map((resource) => String(resource.id))),
    [data.resources],
  );

  const eventsInRange = React.useMemo(() => {
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
          const bt = (e.bookingType ??
            (e.status === "Requested"
              ? "Requests"
              : "Online")) as CalendarBookingType;
          return appliedFilters.booking[bt];
        });
    if (appliedFilters.statusAll !== false) return byBooking;
    return byBooking.filter((e) => Boolean(appliedFilters.statuses?.[e.status]));
  }, [
    appliedFilters.booking,
    appliedFilters.bookingAll,
    appliedFilters.statusAll,
    appliedFilters.statuses,
    appliedFilters.locationAll,
    appliedFilters.locations,
    appliedFilters.teamAll,
    appliedFilters.teamIds,
    events,
    knownResourceIds,
    viewMode,
    visibleDates,
  ]);
  const [todayIso, setTodayIso] = React.useState(defaultDateIso);
  const [nowMin, setNowMin] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowMin(now.getHours() * 60 + now.getMinutes());
      setTodayIso(toIsoLocalDate(now));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const showNowLine =
    activeDateIso === todayIso && nowMin >= startMin && nowMin <= endMin;
  const nowLineTop = ((nowMin - startMin) / grid.stepMinutes) * rowPx;
  const activeMonthIso = React.useMemo(
    () => toMonthIso(activeDateIso),
    [activeDateIso],
  );
  const monthEvents = React.useMemo(() => {
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
          const bt = (e.bookingType ??
            (e.status === "Requested"
              ? "Requests"
              : "Online")) as CalendarBookingType;
          return appliedFilters.booking[bt];
        });
    if (appliedFilters.statusAll !== false) return byBooking;
    return byBooking.filter((e) => Boolean(appliedFilters.statuses?.[e.status]));
  }, [
    activeMonthIso,
    appliedFilters.booking,
    appliedFilters.bookingAll,
    appliedFilters.statusAll,
    appliedFilters.statuses,
    appliedFilters.locationAll,
    appliedFilters.locations,
    appliedFilters.teamAll,
    appliedFilters.teamIds,
    events,
  ]);
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
        .sort((a, b) =>
          `${a.start}-${a.resourceId}`.localeCompare(
            `${b.start}-${b.resourceId}`,
          ),
        );

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
  const blocksInRange = React.useMemo(() => {
    const base = blocks.filter((b) => visibleDates.includes(b.date));
    if (appliedFilters.teamAll) return base;
    return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
  }, [appliedFilters.teamAll, appliedFilters.teamIds, blocks, visibleDates]);

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
        | "uniqueItemPrice"
        | "bufferTitle"
        | "bufferDuration",
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
      const hasSelected = Object.values(productSelectionDraft).some(
        (item) => item.selected,
      );
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

    if (slotBookingScreen === "add-buffer") {
      if (isBlank(bufferDraft.title)) {
        isValid = false;
        errors.bufferTitle = "Title is required.";
      }
      if (isBlank(bufferDraft.durationMins)) {
        isValid = false;
        errors.bufferDuration = "Duration is required.";
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
      const guestPhoneErrors = getOptionalPhoneValidationErrors(
        guestDraft.phoneCode,
        guestDraft.phoneNumber,
      );
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
      const phoneErrors = getPhoneValidationErrors(
        nonMollureDraft.phoneCode,
        nonMollureDraft.phoneNumber,
      );
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
      const companyPhoneErrors = getPhoneValidationErrors(
        nonMollureDraft.phoneCode,
        nonMollureDraft.phoneNumber,
      );
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
    if (
      selectedServices.length === 0 &&
      selectedProducts.length === 0 &&
      bookingUniqueItems.length === 0 &&
      guestsTotal === 0
    ) {
      isValid = false;
      errors.bookingClient =
        errors.bookingClient ?? "Select at least one item/service or product.";
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
    bookingUniqueItems.length,
    guestsTotal,
    slotBookingScreen,
    slotClientAdded,
    slotDrawerTab,
    serviceSelectionDraft,
    serviceEditDraft,
    productSelectionDraft,
    uniqueItemDraft,
    bufferDraft,
  ]);

  const slotErrors = React.useMemo(() => {
    if (slotSaveAttempted) return slotValidation.errors;
    // Surface phone errors early so Save isn't silently disabled.
    const phoneOnly: typeof slotValidation.errors = {};
    if (slotValidation.errors.bookingPhoneCode) {
      phoneOnly.bookingPhoneCode = slotValidation.errors.bookingPhoneCode;
    }
    if (slotValidation.errors.bookingPhoneNumber) {
      phoneOnly.bookingPhoneNumber = slotValidation.errors.bookingPhoneNumber;
    }
    return phoneOnly;
  }, [slotSaveAttempted, slotValidation.errors]);

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
    else if (viewMode === "month")
      setActiveDateIso(addMonthsIso(activeMonthIso, 1));
    else setActiveDateIso(addDaysIso(activeDateIso, 1));
  };

  const getAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const fromSchedule = getCombinedAvailabilityIntervals(
        resourceId,
        iso,
        scheduleRows,
        dateOverrides ?? [],
      );
      if (fromSchedule.length) return fromSchedule;

      const av = data.availability.find((a) => a.resourceId === resourceId);
      if (!av) return [];
      const dow = parseIsoDate(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const windows = av.weekly[dow] ?? [];
      return windows.map((w) => ({
        startMin: minutesSinceMidnight(w.start),
        endMin: minutesSinceMidnight(w.end),
      }));
    },
    [data.availability, dateOverrides, scheduleRows],
  );

  const getLocationAvailability = React.useCallback(
    (
      resourceId: string,
      iso: string,
      location: CalendarBookingLocation,
    ): Interval[] => {
      const fromSchedule = getLocationAvailabilityIntervals(
        resourceId,
        iso,
        location,
        scheduleRows,
        dateOverrides ?? [],
      );
      if (fromSchedule.length) return fromSchedule;
      return getAvailabilityFor(resourceId, iso);
    },
    [dateOverrides, getAvailabilityFor, scheduleRows],
  );

  const getBusyFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const busy: Interval[] = [];
      for (const e of events) {
        if (e.date !== iso) continue;
        // Cancelled slots stay visually shown but are free to rebook.
        if (e.status === "Cancelled") continue;
        const assignedKnown =
          Boolean(e.resourceId) && knownResourceIds.has(String(e.resourceId));
        if (assignedKnown) {
          if (e.resourceId !== resourceId) continue;
        } else if (
          resourceId !== activeResource?.id &&
          resourceId !== "unassigned"
        ) {
          continue;
        }
        busy.push({
          startMin: minutesSinceMidnight(e.start),
          endMin: minutesSinceMidnight(e.end),
        });
      }
      for (const b of blocks) {
        if (b.resourceId !== resourceId || b.date !== iso) continue;
        busy.push({
          startMin: minutesSinceMidnight(b.start),
          endMin: minutesSinceMidnight(b.end),
        });
      }
      return busy;
    },
    [activeResource?.id, blocks, events, knownResourceIds],
  );

  const drawerBookingDurationMins = React.useMemo(() => {
    const fromServices = selectedServices.reduce(
      (sum, service) => sum + (service.durationMins || 0),
      0,
    );
    return fromServices > 0 ? fromServices : grid.stepMinutes;
  }, [grid.stepMinutes, selectedServices]);

  const isPublicDayNotAvailable = React.useCallback(
    (isoDate: string) =>
      isPublicBusinessHoursNotAvailable(
        calendarSettings?.availability.publicBusinessHours,
        isoDate,
        slotLocation,
      ),
    [calendarSettings?.availability.publicBusinessHours, slotLocation],
  );

  const getPublicDayNotAvailableNote = React.useCallback(
    (isoDate: string) =>
      getPublicBusinessHoursNotAvailableNote(
        calendarSettings?.availability.publicBusinessHours,
        isoDate,
        slotLocation,
      ),
    [calendarSettings?.availability.publicBusinessHours, slotLocation],
  );

  const drawerAvailableTimeSlots = React.useMemo(() => {
    if (!selectedSlot?.resourceId || !selectedSlot.date) {
      return [] as Array<{ time: string; disabled: boolean }>;
    }

    const entries = calendarSettings?.availability.publicBusinessHours;
    const date = selectedSlot.date;

    // Prefer public business hours for the active FL/DL location.
    let hourWindows: Interval[] = [];
    const primary = getPublicBusinessHoursInterval(entries, date, slotLocation);
    if (primary) {
      hourWindows = [primary];
    } else {
      // If hours are saved under the other location, still show those slots.
      for (const loc of data.supportedLocations) {
        if (loc === slotLocation) continue;
        const alt = getPublicBusinessHoursInterval(entries, date, loc);
        if (alt) {
          hourWindows = [alt];
          break;
        }
      }
    }

    // Fall back to the team member's schedule availability for this date.
    if (!hourWindows.length) {
      hourWindows = getAvailabilityFor(selectedSlot.resourceId, date);
    }

    // Professional has not set hours/availability for this date.
    if (!hourWindows.length) {
      return [] as Array<{ time: string; disabled: boolean }>;
    }

    const busy = getBusyFor(selectedSlot.resourceId, date).filter(
      (interval) => {
        if (!editingEventId || !selectedSlot.start || !selectedSlot.end)
          return true;
        return !(
          interval.startMin === minutesSinceMidnight(selectedSlot.start) &&
          interval.endMin === minutesSinceMidnight(selectedSlot.end)
        );
      },
    );

    const isPastDate = date < todayIso;
    const isToday = date === todayIso;

    const slots: Array<{ time: string; disabled: boolean }> = [];
    for (const hours of hourWindows) {
      for (
        let min = hours.startMin;
        min < hours.endMin;
        min += grid.stepMinutes
      ) {
        const slotEnd = min + drawerBookingDurationMins;
        const conflicts = busy.some((interval) =>
          intervalsOverlap({ startMin: min, endMin: slotEnd }, interval),
        );
        if (conflicts) continue;
        const disabled = isPastDate || (isToday && min < nowMin);
        slots.push({ time: fmtMinToTime(min), disabled });
      }
    }
    return slots;
  }, [
    calendarSettings?.availability.publicBusinessHours,
    data.supportedLocations,
    drawerBookingDurationMins,
    editingEventId,
    getAvailabilityFor,
    getBusyFor,
    grid.stepMinutes,
    nowMin,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.resourceId,
    selectedSlot?.start,
    slotLocation,
    todayIso,
  ]);

  /** Edit Service Start Time list: Available + Occupied (manual booking only). */
  const editServiceStartTimeSlots = React.useMemo(() => {
    if (!selectedSlot?.date) {
      return [] as Array<{ time: string; status: "available" | "occupied" }>;
    }

    const resourceId =
      serviceEditDraft.staffResourceId || selectedSlot.resourceId;
    if (!resourceId) {
      return [] as Array<{ time: string; status: "available" | "occupied" }>;
    }

    const entries = calendarSettings?.availability.publicBusinessHours;
    const date = selectedSlot.date;

    let hourWindows: Interval[] = [];
    const primary = getPublicBusinessHoursInterval(entries, date, slotLocation);
    if (primary) {
      hourWindows = [primary];
    } else {
      for (const loc of data.supportedLocations) {
        if (loc === slotLocation) continue;
        const alt = getPublicBusinessHoursInterval(entries, date, loc);
        if (alt) {
          hourWindows = [alt];
          break;
        }
      }
    }
    if (!hourWindows.length) {
      hourWindows = getAvailabilityFor(resourceId, date);
    }
    if (!hourWindows.length) {
      return [] as Array<{ time: string; status: "available" | "occupied" }>;
    }

    const durationMins =
      Number.parseInt(serviceEditDraft.durationMins, 10) ||
      drawerBookingDurationMins;

    const busy = getBusyFor(resourceId, date).filter((interval) => {
      if (!editingEventId || !selectedSlot.start || !selectedSlot.end)
        return true;
      return !(
        interval.startMin === minutesSinceMidnight(selectedSlot.start) &&
        interval.endMin === minutesSinceMidnight(selectedSlot.end)
      );
    });

    const slots: Array<{ time: string; status: "available" | "occupied" }> =
      [];
    const isPastDate = date < todayIso;
    const isToday = date === todayIso;
    for (const hours of hourWindows) {
      for (
        let min = hours.startMin;
        min < hours.endMin;
        min += grid.stepMinutes
      ) {
        // Missed / past clock times stay non-selectable in Add/Edit Booking.
        if (isPastDate || (isToday && min < nowMin)) continue;
        const slotEnd = min + durationMins;
        const conflicts = busy.some((interval) =>
          intervalsOverlap({ startMin: min, endMin: slotEnd }, interval),
        );
        slots.push({
          time: fmtMinToTime(min),
          status: conflicts ? "occupied" : "available",
        });
      }
    }
    return slots;
  }, [
    calendarSettings?.availability.publicBusinessHours,
    data.supportedLocations,
    drawerBookingDurationMins,
    editingEventId,
    getAvailabilityFor,
    getBusyFor,
    grid.stepMinutes,
    nowMin,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.resourceId,
    selectedSlot?.start,
    serviceEditDraft.durationMins,
    serviceEditDraft.staffResourceId,
    slotLocation,
    todayIso,
  ]);

  const applyDrawerTimeSlot = React.useCallback(
    (startTime: string) => {
      if (!selectedSlot || isViewingExisting) return;
      const start = minutesSinceMidnight(startTime);
      const end = start + drawerBookingDurationMins;
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start: fmtMinToTime(start),
              end: fmtMinToTime(end),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
      setSlotCalendarOpen(false);
    },
    [drawerBookingDurationMins, isViewingExisting, selectedSlot],
  );

  const getDailyBookingRatio = React.useCallback(
    (resourceId: string, iso: string) => {
      let availability = getAvailabilityFor(resourceId, iso);
      if (!availability.length) {
        const publicHours = getPublicWorkingHoursForDate(iso);
        if (publicHours) availability = [publicHours];
      }
      if (!availability.length) {
        availability = [
          {
            startMin: grid.startHour * 60,
            endMin: grid.endHour * 60,
          },
        ];
      }
      const availableMins = sumIntervalsMins(availability);
      if (availableMins <= 0) return 0;
      const busy = getBusyFor(resourceId, iso);
      const bookedMins = sumIntervalsMins(mergeIntervals(busy));
      return Math.max(0, Math.min(1, bookedMins / availableMins));
    },
    [
      getAvailabilityFor,
      getBusyFor,
      getPublicWorkingHoursForDate,
      grid.endHour,
      grid.startHour,
    ],
  );

  const timeColumnAvailability = React.useMemo(() => {
    if (viewMode !== "day") return [];
    const publicHours = getPublicWorkingHoursForDate(activeDateIso);
    return publicHours ? [publicHours] : [];
  }, [activeDateIso, getPublicWorkingHoursForDate, viewMode]);

  const addMenuBookingResourceId = React.useMemo(
    () =>
      activeResource?.id ??
      selectedResourceId ??
      data.resources[0]?.id ??
      "",
    [activeResource?.id, data.resources, selectedResourceId],
  );

  /** Add → Booking disabled only on Not Availability days. */
  const isAddMenuBookingDisabled = isPublicDayNotAvailable(activeDateIso);

  const lateCancelNoticeLabel = React.useMemo(() => {
    const hours = Number(cancellationBeforeHours) || 0;
    const minutes = Number(cancellationBeforeMinutes) || 0;
    const windowLabel =
      hours && minutes
        ? `${hours}h ${minutes}m`
        : hours
          ? `${hours}h`
          : minutes
            ? `${minutes} min`
            : "24h";
    return `Fee applies after the required ${windowLabel} notice`;
  }, [cancellationBeforeHours, cancellationBeforeMinutes]);

  const renderTeamCapacityBar = (resourceId: string) => {
    const bookedPct = Math.round(
      getDailyBookingRatio(resourceId, activeDateIso) * 100,
    );
    return (
      <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.35 }}>
        <Box
          sx={{
            height: 3,
            width: 62,
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
        <BodyText
          sx={{
            fontSize: 9,
            fontWeight: 800,
            color: alpha(m.navy, 0.48),
            lineHeight: 1,
          }}
        >
          {bookedPct}%
        </BodyText>
      </Stack>
    );
  };

  const renderTeamMemberHeader = (
    laneResource?: (typeof filteredResources)[number],
  ) => {
    const headerResources = laneResource
      ? [laneResource]
      : filteredResources;
    const menuResourceId = laneResource?.id ?? activeResource?.id;

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
                  if (e.key === "Enter" || e.key === " ")
                    openTeamMenu(resource.id, e.currentTarget);
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
                <Box
                  sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.2}
                    sx={{ minWidth: 0 }}
                  >
                    <BodyText sx={teamNameSx}>{resource.name}</BodyText>
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        fontSize: 15,
                        color: alpha(m.navy, 0.45),
                        flexShrink: 0,
                      }}
                    />
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  alignItems: "flex-start",
                }}
              >
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
          border: `1px solid ${alpha(m.navy, 0.1)}`,
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
          showSnackbar({
            severity: "info",
            message: "Client profile panel opened.",
          });
        }}
        sx={{
          width: "100%",
          px: 1,
          py: 0.75,
          justifyContent: "flex-start",
          borderRadius: "8px",
        }}
      >
        <BodyText
          sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}
        >
          View profile
        </BodyText>
      </ButtonBase>
      <ButtonBase
        disabled={viewMode !== "day" || !teamMenuResource}
        onClick={() => {
          if (!teamMenuResource) return;
          const shifts =
            getCombinedAvailabilityIntervals(
              teamMenuResource.id,
              activeDateIso,
              scheduleRows,
              dateOverrides ?? [],
            ).length > 0
              ? getCombinedAvailabilityIntervals(
                  teamMenuResource.id,
                  activeDateIso,
                  scheduleRows,
                  dateOverrides ?? [],
                ).map((interval) => ({
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
        sx={{
          width: "100%",
          px: 1,
          py: 0.75,
          justifyContent: "flex-start",
          borderRadius: "8px",
          opacity: viewMode !== "day" ? 0.5 : 1,
        }}
      >
        <BodyText
          sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}
        >
          Edit availability
        </BodyText>
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
              <BodyText
                sx={{
                  fontWeight: 600,
                  fontSize: 11.5,
                  color: alpha(m.navy, 0.78),
                }}
              >
                {resource.name}
              </BodyText>
            ) : (
              <Box
                sx={{
                  borderBottom: `1px solid ${alpha(m.navy, 0.2)}`,
                  pb: 0.15,
                }}
              >
                <BodyText
                  sx={{
                    fontWeight: 600,
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {resource.name}
                </BodyText>
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Popover>
  );

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot, options?: { allowTimeSelection?: boolean }) => {
      const allowTimeSelection = Boolean(options?.allowTimeSelection);
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation(data.supportedLocations[0] ?? "FL");
      setSlotBookingType("Requests");
      setSlotStatus("Requested");
      setSlotClientAdded(false);
      setAllowDrawerTimeSelection(allowTimeSelection);
      setSlotCalendarOpen(allowTimeSelection);
      setSlotCalendarTouched(!allowTimeSelection);
      setSelectedClient(null);
      setSelectedServices([]);
      setSelectedProducts([]);
      setServiceSelectionDraft([]);
      setServiceOverridesDraft({});
      setServiceEditDraft(emptyBookingServiceEditDraft());
      setServiceEditAttempted(false);
      setProductSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setBookingUniqueItems([]);
      setCustomBookingProducts([]);
      setEditingCatalogProductId(null);
      setEditingEventId(null);
      setIsEditingExisting(false);
      setBookingGuests([]);
      setShowInlineGuestField(false);
      setInlineGuestParticipantType("guest");
      setBookingProjectEnabled(false);
      setBookingProjectDescription("");
      setBookingProjectUploads([]);
      setDlGuestMenuAnchor(null);
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

  const lastLiveHydratedEventKeyRef = React.useRef("");
  const bookingEventLiveKey = React.useCallback((ev: CalendarEvent) => {
    return [
      ev.id,
      ev.date,
      ev.start,
      ev.end,
      ev.status,
      ev.title,
      ev.bookingScenario ?? "",
      ev.updatedAt ?? "",
      ev.notes ?? "",
      ev.details?.services?.map((service) => service.id).join(",") ?? "",
    ].join(":");
  }, []);

  const openExistingBooking = React.useCallback((ev: CalendarEvent) => {
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
    setAllowDrawerTimeSelection(false);
    setSlotCalendarOpen(false);
    setSlotCalendarTouched(true);
    setSelectedClient({
      name: ev.showClientName ?? "Client",
      email: hydration.clientEmail,
      clientKind: ev.clientKind ?? ev.details?.clientKind,
    });
    setSelectedServices(hydration.services);
    setSelectedProducts(
      hydration.products.filter(
        (product) => !String(product.id).startsWith("unique-"),
      ),
    );
    setBookingUniqueItems(
      hydration.products
        .filter((product) => String(product.id).startsWith("unique-"))
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          originalPrice: product.originalPrice,
          discount: product.discount ?? null,
        })),
    );
    setServiceSelectionDraft(hydration.services.map((service) => service.id));
    setProductSelectionDraft(createEmptyProductSelectionDraft());
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setCustomBookingProducts([]);
    setEditingCatalogProductId(null);
      setBookingGuests(hydration.guests);
      setShowInlineGuestField(false);
      {
        const snap = ev.details?.clientSnapshot;
        const project = snap?.projectDetails;
        setBookingProjectEnabled(
          Boolean(
            project?.description?.trim() || (project?.uploads?.length ?? 0) > 0,
          ),
        );
        setBookingProjectDescription(project?.description ?? "");
        setBookingProjectUploads(
          (project?.uploads ?? []).map((upload) => {
            const durable = resolveMediaUrl(upload.url || upload.previewUrl);
            return {
              id: upload.id,
              name: upload.name,
              previewUrl: durable,
              url: durable ?? upload.url,
              mimeType: upload.mimeType,
              kind: upload.kind,
            };
          }),
        );
        if (
          (!hydration.guests || hydration.guests.length === 0) &&
          snap?.people?.length
        ) {
          setBookingGuests(
            snap.people
              .filter(
                (person) =>
                  !person.isRequester &&
                  person.participantType !== "notes" &&
                  person.name?.trim().toLowerCase() !== "notes",
              )
              .map((person) => ({
                id: person.id,
                name: person.name,
                services: (snap.services ?? [])
                  .filter((service) => service.guestId === person.id)
                  .map((service) => ({
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    durationMins: service.durationMins,
                    staffResourceId: service.teamMemberId ?? undefined,
                  })),
                products: [],
                participantType: person.participantType ?? "guest",
                planningActivity: person.planningActivity,
                planningDuration: person.planningDuration,
                bufferTeamMemberId: person.bufferTeamMemberId,
                bufferEndTime: person.bufferEndTime,
              })),
          );
        }
      }
      setBookingPhoneDraft({
      phoneCode: hydration.phoneCode,
      phoneNumber: hydration.phoneNumber,
    });
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
    setOriginalServicesSnapshot([
      ...resolveOriginalServices(ev, hydration.services),
      ...hydration.guests.flatMap((guest) => guest.services),
    ]);
    setSlotSaveAttempted(false);
    setAddMenuTarget("client");
    setSelectionTarget("client");
    setSlotAddMenuAnchor(null);
    setBookingMoreAnchor(null);
    setSlotDrawerOpen(true);
    lastLiveHydratedEventKeyRef.current = bookingEventLiveKey(ev);
    markBookingUpdateSeen(
      "professional",
      ev.bookingCode ?? extractBookingId(ev.id),
      ev.updatedAt,
    );
  }, [bookingEventLiveKey]);

  React.useEffect(() => {
    if (!slotDrawerOpen) {
      lastLiveHydratedEventKeyRef.current = "";
      return;
    }
    if (
      isEditingExisting ||
      incomingRequestEditMode ||
      !viewingBookingEvent
    ) {
      return;
    }
    const liveKey = bookingEventLiveKey(viewingBookingEvent);
    if (lastLiveHydratedEventKeyRef.current === liveKey) return;
    lastLiveHydratedEventKeyRef.current = liveKey;
    openExistingBooking(viewingBookingEvent);
  }, [
    bookingEventLiveKey,
    incomingRequestEditMode,
    isEditingExisting,
    openExistingBooking,
    slotDrawerOpen,
    viewingBookingEvent,
  ]);

  // Keep "Updated" cleared while the drawer stays open (e.g. after accept/save refresh).
  React.useEffect(() => {
    if (!isViewingExisting || !viewingBookingEvent) return;
    markBookingUpdateSeen(
      "professional",
      viewingBookingEvent.bookingCode ??
        extractBookingId(viewingBookingEvent.id),
      viewingBookingEvent.updatedAt,
    );
  }, [
    isViewingExisting,
    viewingBookingEvent?.bookingCode,
    viewingBookingEvent?.id,
    viewingBookingEvent?.updatedAt,
  ]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const focusBookingHandledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const paramRef = searchParams?.get("bookingRef")?.trim() || "";
    const paramId = searchParams?.get("bookingId")?.trim() || "";
    const paramDate = searchParams?.get("date")?.trim() || "";
    const shouldOpen = searchParams?.get("open") === "1";

    let storedRef = "";
    let storedId = "";
    let storedDate = "";
    if (typeof window !== "undefined") {
      storedRef = window.sessionStorage.getItem(FOCUS_BOOKING_REF_KEY)?.trim() || "";
      storedId = window.sessionStorage.getItem(FOCUS_BOOKING_ID_KEY)?.trim() || "";
      storedDate =
        window.sessionStorage.getItem(FOCUS_BOOKING_DATE_KEY)?.trim() || "";
    }

    const focusRef = paramRef || storedRef;
    const focusId = paramId || storedId;
    const focusDate = paramDate || storedDate;

    if (!focusRef && !focusId) {
      focusBookingHandledRef.current = null;
      return;
    }
    if (!shouldOpen && !storedRef && !storedId) return;

    // Jump calendar to the booking date first so the event enters the loaded range.
    if (
      focusDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(focusDate) &&
      focusDate !== activeDateIso
    ) {
      setActiveDateIso(focusDate);
      return;
    }

    if (!events.length) return;

    const focusKey = `${focusRef}|${focusId}|${focusDate}`;
    if (focusBookingHandledRef.current === focusKey) return;

    const normalize = (value: string) =>
      value.trim().replace(/^#/, "").replace(/^bk-?/i, "").toLowerCase();

    const match =
      events.find((event) => {
        if (
          focusId &&
          (event.id === focusId || String(event.id).includes(focusId))
        ) {
          return true;
        }
        if (focusRef && event.bookingCode) {
          return normalize(event.bookingCode) === normalize(focusRef);
        }
        return false;
      }) ?? null;

    if (!match) return;

    focusBookingHandledRef.current = focusKey;
    openExistingBooking(match);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(FOCUS_BOOKING_REF_KEY);
      window.sessionStorage.removeItem(FOCUS_BOOKING_ID_KEY);
      window.sessionStorage.removeItem(FOCUS_BOOKING_DATE_KEY);
    }

    if (paramRef || paramId || shouldOpen || paramDate) {
      router.replace("/professionals/calendar", { scroll: false });
    }
  }, [
    activeDateIso,
    events,
    openExistingBooking,
    router,
    searchParams,
  ]);

  const handleSendConfirmedEr = React.useCallback(
    async (note: string) => {
      if (!editingEventId || !viewingBookingEvent) return;
      const trimmed = note.trim();
      if (!trimmed) return;
      const parsed = parseApiCalendarEventId(editingEventId);
      if (parsed?.kind !== "booking") {
        showSnackbar({
          severity: "error",
          message: "Edit request is only available for bookings.",
        });
        return;
      }
      const bookingRef =
        viewingBookingEvent.bookingCode ?? extractBookingId(editingEventId);
      try {
        const result = await manageBookingEditRequest({
          id: parsed.id,
          action: "send",
          note: trimmed,
        }).unwrap();
        syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: "Confirmed",
                  bookingScenario: "ER",
                  details: {
                    ...event.details,
                    requestDirection: "outgoing",
                  },
                }
              : event,
          ),
        );
        showSnackbar({
          severity: "success",
          message: "Edit request sent to the client.",
        });
        setErNoteDialogOpen(false);
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to send edit request."),
        });
      }
    },
    [
      editingEventId,
      manageBookingEditRequest,
      showSnackbar,
      viewingBookingEvent,
    ],
  );

  const handleAcceptConfirmedEr = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (parsed?.kind !== "booking") return;
    const bookingRef =
      viewingBookingEvent.bookingCode ?? extractBookingId(editingEventId);
    try {
      const result = await manageBookingEditRequest({
        id: parsed.id,
        action: "accept",
      }).unwrap();
      syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                bookingScenario: undefined,
              }
            : event,
        ),
      );
      showSnackbar({
        severity: "success",
        message: "Edit request accepted. Client can edit once.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRejectConfirmedEr = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (parsed?.kind !== "booking") return;
    const bookingRef =
      viewingBookingEvent.bookingCode ?? extractBookingId(editingEventId);
    try {
      const result = await manageBookingEditRequest({
        id: parsed.id,
        action: "reject",
      }).unwrap();
      syncEditRequestFromBookingApi(bookingRef, result.data?.edit_request);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed",
                bookingScenario: undefined,
              }
            : event,
        ),
      );
      showSnackbar({
        severity: "success",
        message: "Edit request rejected. Booking stays Confirmed.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to reject edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleDiscardBr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid");
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to discard booking request.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? { ...event, status: "Invalid", bookingScenario: undefined }
          : event,
      ),
    );
    setSlotStatus("Invalid");
    showSnackbar({
      severity: "success",
      message: "Booking request discarded.",
    });
  }, [editingEventId, persistEventStatus, showSnackbar]);

  const handleRestartResponseTime = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const details = viewingBookingEvent.details ?? {};
    const deadline = restartResponseDeadline(details);
    const nextDetails = {
      ...details,
      ...deadline,
      responseStatus: undefined,
    };
    const nextNotes = serializeCalendarEntryNotes(
      details.internalNote ?? "",
      nextDetails,
      parseStoredEbrFromNotes(viewingBookingEvent.notes),
      parseStoredErFromNotes(viewingBookingEvent.notes),
    );
    try {
      await persistEventStatus(editingEventId, viewingBookingEvent.status, {
        notes: nextNotes,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to restart response time.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? {
              ...event,
              notes: nextNotes,
              details: {
                ...(event.details ?? {}),
                ...deadline,
                responseStatus: undefined,
              },
            }
          : event,
      ),
    );
    showSnackbar({
      severity: "success",
      message: "Response time restarted.",
    });
  }, [
    editingEventId,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleAcknowledgeAcceptedBr = React.useCallback(async () => {
    if (!editingEventId) return;
    const current =
      viewingBookingEvent ??
      events.find((event) => event.id === editingEventId);
    const nextDetails = {
      ...(current?.details ?? {}),
      needsOk: false,
      ackScenario: undefined,
    };
    const nextNotes = serializeCalendarEntryNotes(
      nextDetails.internalNote ?? "",
      nextDetails,
      parseStoredEbrFromNotes(current?.notes),
      parseStoredErFromNotes(current?.notes),
    );
    try {
      await persistEventStatus(editingEventId, current?.status ?? "Confirmed", {
        notes: nextNotes,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to acknowledge booking.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? {
              ...event,
              bookingScenario: undefined,
              notes: nextNotes,
              details: { ...(event.details ?? {}), needsOk: false, ackScenario: undefined },
            }
          : event,
      ),
    );
    showSnackbar({
      severity: "success",
      message: "Booking request acknowledged.",
    });
  }, [editingEventId, events, persistEventStatus, showSnackbar, viewingBookingEvent]);

  const handleAcceptIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
      try {
        await persistEventStatus(editingEventId, "Confirmed");
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to accept booking request.",
          ),
        });
        return;
      }
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed",
                bookingScenario: event.bookingScenario ?? "BR",
                details: {
                  ...(event.details ?? {}),
                  needsOk: true,
                  ackScenario: event.bookingScenario ?? "BR",
                },
              }
            : event,
        ),
      );
      setSlotStatus("Confirmed");
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
      showSnackbar({
        severity: "success",
        message: "Booking request accepted.",
      });
      return;
    }

    try {
      const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
      const isClientEbr =
        viewingBookingEvent.bookingScenario === "EBR" &&
        ebr != null &&
        (ebr.status === "pending" || ebr.status === "suggested") &&
        (ebr.lastEditedBy === "client" ||
          viewingBookingEvent.details?.lastEditedBy === "client");

      const drawerServiceLines: CalendarBookingServiceItem[] = [
        ...selectedServices.map((service) => ({
          ...service,
          staffResourceId: service.staffResourceId,
          teamMemberId: service.staffResourceId,
          guestId: null as string | null,
        })),
        ...bookingGuests.flatMap((guest) =>
          guest.services.map((service) => ({
            ...service,
            staffResourceId: service.staffResourceId,
            teamMemberId: service.staffResourceId,
            guestId: guest.id,
          })),
        ),
      ];
      const drawerProductLines = [
        ...selectedProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unitPrice: product.unitPrice ?? product.price,
        })),
        ...bookingUniqueItems,
        ...bookingGuests.flatMap((guest) => guest.products),
      ];
      const suggestedServices = drawerServiceLines.length
        ? drawerServiceLines
        : ebr?.suggestedServices?.length
          ? ebr.suggestedServices
          : viewingBookingEvent.details?.services;
      const suggestedProducts = drawerProductLines.length
        ? drawerProductLines
        : ebr?.suggestedProducts?.length
          ? ebr.suggestedProducts
          : viewingBookingEvent.details?.products;
      const suggestedTotal =
        (suggestedServices ?? []).reduce(
          (sum, s) => sum + (Number(s.price) || 0),
          0,
        ) +
        (suggestedProducts ?? []).reduce(
          (sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 1),
          0,
        );
      const suggestedProject = ebr?.suggestedProjectDetails;
      const suggestedDate = ebr?.suggestedDateISO;
      const suggestedStart = ebr?.suggestedStart;
      const suggestedEnd = ebr?.suggestedEnd;
      const originalServices =
        viewingBookingEvent.details?.originalServices ??
        viewingBookingEvent.details?.services ??
        [];
      const lineChanges = detectServiceLineChanges(
        originalServices,
        suggestedServices ?? [],
      );
      const ebrSuggestedIds = new Set(
        (ebr?.suggestedServices ?? []).map((service) => service.id),
      );
      const professionalAddedLines = drawerServiceLines.some(
        (service) => !ebrSuggestedIds.has(service.id),
      );

      let nextNotes: string | null | undefined;
      let scheduleExtras: {
        booking_date?: string;
        start_time?: string;
        end_time?: string;
      } = {};

      // Client change request: apply suggested + any drawer additions so they
      // persist on the client booking after Accept.
      if (isClientEbr) {
        const appliedNote = (
          ebr?.clientNote ||
          viewingBookingEvent.details?.internalNote ||
          ""
        ).trim();
        nextNotes = markClientEbrAcceptedInNotes(viewingBookingEvent.notes, {
          internalNote: appliedNote,
          services: suggestedServices,
          products: suggestedProducts,
          lastEditedBy: professionalAddedLines
            ? "professional"
            : (ebr?.lastEditedBy ?? "client"),
          editedServiceIds: [
            ...(ebr?.editedServiceIds ?? []),
            ...lineChanges.added,
            ...lineChanges.edited,
          ],
          addedServiceIds: lineChanges.added,
          cancelledServiceIds: lineChanges.cancelled,
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
                    teamMemberId: s.teamMemberId ?? s.staffResourceId,
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
        ...(typeof suggestedTotal === "number" &&
        (isClientEbr || professionalAddedLines)
          ? { total_price: suggestedTotal }
          : {}),
        ...scheduleExtras,
      });

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== editingEventId) return event;
          return {
            ...event,
            status: "Confirmed" as const,
            bookingScenario: viewingBookingEvent.bookingScenario ?? "BR",
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
              needsOk: true,
              ackScenario: viewingBookingEvent.bookingScenario ?? "BR",
              responseStatus: undefined,
              lastEditedBy: professionalAddedLines
                ? "professional"
                : event.details?.lastEditedBy,
              editedServiceIds: [
                ...((event.details?.editedServiceIds ?? []).filter(Boolean)),
                ...lineChanges.added,
                ...lineChanges.edited,
              ],
              addedServiceIds: lineChanges.added,
              cancelledServiceIds: lineChanges.cancelled,
              ...(suggestedServices?.length
                ? { services: suggestedServices }
                : {}),
              ...(suggestedProducts?.length
                ? { products: suggestedProducts }
                : {}),
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
      setIsEditingExisting(false);
      showSnackbar({
        severity: "success",
        message: "Booking request accepted.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept booking request."),
      });
    }
  }, [
    bookingGuests,
    bookingUniqueItems,
    editingEventId,
    onUpdateBookingStatus,
    persistEventStatus,
    selectedProducts,
    selectedServices,
    selectedSlot,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRejectIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const ebr = parseStoredEbrFromNotes(viewingBookingEvent.notes);
    const isClientEbr =
      viewingBookingEvent.bookingScenario === "EBR" &&
      ebr != null &&
      (ebr.status === "pending" || ebr.status === "suggested") &&
      (ebr.lastEditedBy === "client" ||
        viewingBookingEvent.details?.lastEditedBy === "client");

    // Client change request: keep original booking confirmed; keep rejected proposal for client UI.
    if (isClientEbr) {
      const parsed = parseApiCalendarEventId(editingEventId);
      if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
        showSnackbar({
          severity: "error",
          message: "Unable to reject booking request.",
        });
        return;
      }
      try {
        const rejectedNotes = markClientEbrRejectedInNotes(
          viewingBookingEvent.notes,
        );
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
        showSnackbar({
          severity: "success",
          message: "Edit request rejected. Booking unchanged.",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to reject booking request.",
          ),
        });
      }
      return;
    }

    try {
      const parsed = parseApiCalendarEventId(editingEventId);
      if (parsed?.kind === "booking" && onUpdateBookingStatus) {
        await onUpdateBookingStatus(parsed.id, "invalid");
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
      prev.map((event) =>
        event.id === editingEventId ? { ...event, status: "Invalid" } : event,
      ),
    );
    setSlotStatus("Invalid");
    setIncomingRequestEditMode(false);
    setIsEditingExisting(false);
    showSnackbar({ severity: "success", message: "Booking request rejected." });
  }, [
    editingEventId,
    onUpdateBookingStatus,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleStartIncomingEdit = React.useCallback(() => {
    if (!viewingBookingEvent) return;
    const hydration = hydrateBookingDrawerFromEvent(viewingBookingEvent);
    setOriginalServicesSnapshot([
      ...resolveOriginalServices(viewingBookingEvent, hydration.services),
      ...hydration.guests.flatMap((guest) => guest.services),
    ]);
    setIncomingRequestEditMode(true);
    setIsEditingExisting(true);
  }, [viewingBookingEvent]);

  const handleDiscardEbr = React.useCallback(async () => {
    if (!editingEventId) return;
    try {
      await persistEventStatus(editingEventId, "Invalid", {
        notification_event: "ebr_discarded",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Unable to discard edited booking request.",
      });
      return;
    }
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEventId
          ? { ...event, status: "Invalid", bookingScenario: undefined }
          : event,
      ),
    );
    setSlotStatus("Invalid");
    setIncomingRequestEditMode(false);
    showSnackbar({
      severity: "success",
      message: "Edited booking request discarded.",
    });
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
      const existingOnBooking =
        selectionTarget === "client"
          ? selectedServices.find((item) => item.id === service.id)
          : bookingGuests
              .find((guest) => guest.id === selectionTarget)
              ?.services.find((item) => item.id === service.id);
      const assignedStaff =
        override?.staffResourceId?.trim() ||
        existingOnBooking?.staffResourceId?.trim() ||
        "";
      setEditServiceStaffLocked(Boolean(assignedStaff));
      setServiceEditDraft(
        buildServiceEditDraftFromCatalog(service, {
          override: {
            ...override,
            staffResourceId: assignedStaff || undefined,
          },
          defaultStartTime:
            override?.startTime ??
            existingOnBooking?.startTime ??
            selectedSlot?.start,
          defaultStaffResourceId: assignedStaff,
        }),
      );
      setServiceEditAttempted(false);
      setSlotBookingScreen("edit-service");
    },
    [
      bookingGuests,
      selectedServices,
      selectedSlot?.start,
      selectionTarget,
      serviceOverridesDraft,
    ],
  );

  const applyServiceEdit = React.useCallback(() => {
    const catalogService = selectableServiceCatalog.find(
      (service) => service.id === serviceEditDraft.serviceId,
    );
    if (!catalogService) return false;

    const lineItem = buildBookingServiceLineItem(
      catalogService,
      serviceEditDraft,
    );
    setServiceOverridesDraft((prev) => ({
      ...prev,
      [lineItem.id]: lineItemToOverride(lineItem),
    }));
    setServiceCatalogPatches((prev) => ({
      ...prev,
      [lineItem.id]: {
        name: lineItem.name,
        price: lineItem.price,
        durationMins: lineItem.durationMins,
      },
    }));
    setServiceSelectionDraft((prev) =>
      prev.includes(lineItem.id) ? prev : [...prev, lineItem.id],
    );

    // Reflect edited service on the main booking drawer immediately.
    const syncServices = (services: BookingServiceLineItem[]) => {
      const exists = services.some((service) => service.id === lineItem.id);
      if (!exists) return services;
      return services.map((service) =>
        service.id === lineItem.id ? { ...service, ...lineItem } : service,
      );
    };
    setSelectedServices((prev) => syncServices(prev));
    setBookingGuests((prev) =>
      prev.map((guest) => ({
        ...guest,
        services: syncServices(guest.services),
      })),
    );

    // Service start time takes priority for the calendar booking slot.
    if (lineItem.startTime) {
      const endTime =
        lineItem.endTime ||
        addMinutesToTime(lineItem.startTime, lineItem.durationMins);
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start: lineItem.startTime!,
              end: endTime,
              ...(lineItem.staffResourceId
                ? { resourceId: lineItem.staffResourceId }
                : {}),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    } else if (lineItem.staffResourceId) {
      setSelectedSlot((prev) =>
        prev ? { ...prev, resourceId: lineItem.staffResourceId! } : prev,
      );
    }

    setServiceEditAttempted(false);
    setSlotBookingScreen("select-services");
    void dispatchBookingEventIfApi(editingEventId, "service_edited", {
      initiated_by: "professional",
    });
    return true;
  }, [
    dispatchBookingEventIfApi,
    editingEventId,
    selectableServiceCatalog,
    serviceEditDraft,
  ]);

  const toggleServiceSelectionDraft = React.useCallback(
    (serviceId: string) => {
      if (isViewingExisting) return;
      setServiceSelectionDraft((prev) =>
        prev.includes(serviceId)
          ? prev.filter((id) => id !== serviceId)
          : [...prev, serviceId],
      );
    },
    [isViewingExisting],
  );

  const applyServiceSelection = React.useCallback(() => {
    const byId = new Map(
      selectableServiceCatalog.map((service) => [service.id, service]),
    );
    const currentServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);
    const currentById = new Map(
      currentServices.map((service) => [service.id, service]),
    );

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
            // Do not auto-assign calendar column as client-selected staff.
            staffResourceId: undefined,
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

    // Service start times take priority for the calendar booking slot.
    const timedServices = nextServices
      .filter((service) => Boolean(service.startTime))
      .sort(
        (a, b) =>
          minutesSinceMidnight(a.startTime!) -
          minutesSinceMidnight(b.startTime!),
      );
    if (timedServices.length > 0) {
      const first = timedServices[0];
      const start = first.startTime!;
      const end =
        first.endTime || addMinutesToTime(start, first.durationMins);
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start,
              end,
              ...(first.staffResourceId
                ? { resourceId: first.staffResourceId }
                : {}),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    }

    if (selectionTarget === "client") {
      setSelectedServices(nextServices);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, services: nextServices }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    originalServicesSnapshot,
    selectedServices,
    selectedSlot?.end,
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
        : (bookingGuests.find((item) => item.id === addMenuTarget)?.products ??
          []);

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

  const toggleProductSelectionDraft = React.useCallback(
    (productId: string) => {
      if (isViewingExisting) return;
      setProductSelectionDraft((prev) => {
        const current = prev[productId] ?? { selected: false, quantity: 1 };
        return {
          ...prev,
          [productId]: { ...current, selected: !current.selected },
        };
      });
    },
    [isViewingExisting],
  );

  const adjustProductQuantityDraft = React.useCallback(
    (productId: string, delta: number) => {
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
    },
    [isViewingExisting],
  );

  const applyProductSelection = React.useCallback(() => {
    const catalogProducts = productCatalog
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return buildBookingProductLine(product, quantity);
      });

    const customProducts = mergedCustomBookingProducts
      .filter((product) => productSelectionDraft[product.id]?.selected)
      .map((product) => {
        const quantity = productSelectionDraft[product.id]?.quantity ?? 1;
        return buildBookingProductLine(product, quantity);
      });

    const nextProducts = [...catalogProducts, ...customProducts];
    const currentProducts =
      selectionTarget === "client"
        ? selectedProducts
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.products ?? []);

    // Merge newly picked products into the current list (no defaults, no wipe).
    const mergedById = new Map(
      currentProducts.map((product) => [product.id, product]),
    );
    for (const product of nextProducts) {
      mergedById.set(product.id, product);
    }
    const mergedProducts = Array.from(mergedById.values());

    if (selectionTarget === "client") {
      setSelectedProducts(mergedProducts);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, products: mergedProducts }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    mergedCustomBookingProducts,
    productCatalog,
    productSelectionDraft,
    selectedProducts,
    selectionTarget,
  ]);

  const openAddUniqueItem = React.useCallback(
    (origin: "products" | "booking" = "products") => {
      setUniqueItemOrigin(origin);
      setEditingCatalogProductId(null);
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("add-unique-item");
    },
    [],
  );

  const openEditCatalogProduct = React.useCallback(
    (product: BookingCatalogProduct) => {
      if (isViewingExisting) return;
      setUniqueItemOrigin("products");
      setEditingCatalogProductId(product.id);
      setUniqueItemDraft(buildUniqueItemDraftFromProduct(product));
      setSlotBookingScreen("add-unique-item");
    },
    [isViewingExisting],
  );

  const persistBookingCatalogProduct = React.useCallback(
    (product: BookingCatalogProduct, kind: "product" | "unique") => {
      const payload = toFinanceCatalogProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      });
      setFinanceSettings((prev) =>
        kind === "unique"
          ? upsertFinanceUniqueItem(prev, payload)
          : upsertFinanceProduct(prev, payload),
      );
    },
    [setFinanceSettings],
  );

  const applyUniqueItem = React.useCallback(() => {
    if (editingCatalogProductId) {
      const updated = buildCatalogProductFromUniqueItemDraft(
        uniqueItemDraft,
        editingCatalogProductId,
      );
      if (!updated) return;

      const isPersistedUnique =
        editingCatalogProductId.startsWith("unique-") ||
        customBookingProducts.some(
          (product) => product.id === editingCatalogProductId,
        ) ||
        (financeSettings.uniqueItems ?? []).some(
          (item) => item.id === editingCatalogProductId,
        );
      const isCustom = customBookingProducts.some(
        (product) => product.id === editingCatalogProductId,
      );
      if (isCustom) {
        setCustomBookingProducts((prev) =>
          prev.map((product) =>
            product.id === editingCatalogProductId ? updated : product,
          ),
        );
      } else if (!isPersistedUnique) {
        setProductCatalog((prev) =>
          prev.map((product) =>
            product.id === editingCatalogProductId ? updated : product,
          ),
        );
        setFinanceSettings((prev) => ({
          ...prev,
          products: prev.products.map((product) =>
            product.id === editingCatalogProductId
              ? {
                  ...product,
                  name: updated.name,
                  price: `${updated.price}EUR`,
                  vat: updated.vat?.trim() || product.vat,
                  unit: updated.unit,
                  discountType: updated.discountType,
                  discountAmount: updated.discountAmount,
                }
              : product,
          ),
        }));
      }

      persistBookingCatalogProduct(
        updated,
        isPersistedUnique ? "unique" : "product",
      );

      const syncSelectedProducts = (
        products: Array<{
          id: string;
          name: string;
          price: number;
          quantity: number;
          unitPrice: number;
        }>,
      ) =>
        products.map((product) => {
          if (product.id !== editingCatalogProductId) return product;
          const quantity = Math.max(1, product.quantity);
          return {
            ...product,
            name: formatProductLineName(updated.name, quantity),
            unitPrice: updated.price,
            price: updated.price * quantity,
          };
        });

      setSelectedProducts((prev) => syncSelectedProducts(prev));
      setBookingGuests((prev) =>
        prev.map((guest) => ({
          ...guest,
          products: syncSelectedProducts(guest.products),
        })),
      );

      setProductSelectionDraft((prev) => {
        const current = prev[editingCatalogProductId];
        if (!current) return prev;
        return {
          ...prev,
          [editingCatalogProductId]: {
            ...current,
            quantity: Math.max(1, uniqueItemDraft.unit || current.quantity),
          },
        };
      });

      setEditingCatalogProductId(null);
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("select-products");
      setSlotSaveAttempted(false);
      return;
    }

    const line = buildUniqueItemLine(uniqueItemDraft);
    if (!line) return;

    if (uniqueItemOrigin === "booking") {
      setBookingUniqueItems((prev) => [
        ...prev,
        { ...line, name: uniqueItemDraft.productName.trim() },
      ]);
      persistBookingCatalogProduct(
        {
          id: line.id,
          name: uniqueItemDraft.productName.trim(),
          price: line.unitPrice,
          vat: uniqueItemDraft.vat.trim() || undefined,
          unit: line.quantity,
          discountType: uniqueItemDraft.discountType,
          discountAmount: uniqueItemDraft.discountAmount,
        },
        "unique",
      );
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("new-booking");
      setSlotSaveAttempted(false);
      void dispatchBookingEventIfApi(editingEventId, "unique_item_edited", {
        initiated_by: "professional",
      });
      return;
    }

    const catalogId = `p-${Date.now()}`;
    const customProduct: BookingCatalogProduct = {
      id: catalogId,
      name: uniqueItemDraft.productName.trim(),
      price: line.unitPrice,
      vat: uniqueItemDraft.vat.trim() || undefined,
      unit: line.quantity,
      discountType: uniqueItemDraft.discountType,
      discountAmount: uniqueItemDraft.discountAmount,
    };

    persistBookingCatalogProduct(customProduct, "product");
    setProductSelectionDraft((prev) => ({
      ...prev,
      [catalogId]: { selected: true, quantity: line.quantity },
    }));
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setSlotBookingScreen("select-products");
    setSlotSaveAttempted(false);
    void dispatchBookingEventIfApi(editingEventId, "unique_item_edited", {
      initiated_by: "professional",
    });
  }, [
    customBookingProducts,
    dispatchBookingEventIfApi,
    editingCatalogProductId,
    editingEventId,
    financeSettings.uniqueItems,
    persistBookingCatalogProduct,
    setFinanceSettings,
    uniqueItemDraft,
    uniqueItemOrigin,
  ]);

  const confirmDeleteCatalogProduct = React.useCallback(() => {
    if (!pendingCatalogDelete) return;
    const id = pendingCatalogDelete.id;
    const isUnique =
      id.startsWith("unique-") ||
      (financeSettings.uniqueItems ?? []).some((item) => item.id === id) ||
      customBookingProducts.some((product) => product.id === id);

    setFinanceSettings((prev) =>
      isUnique ? removeFinanceUniqueItem(prev, id) : removeFinanceProduct(prev, id),
    );
    setCustomBookingProducts((prev) =>
      prev.filter((product) => product.id !== id),
    );
    setProductCatalog((prev) => prev.filter((product) => product.id !== id));
    setProductSelectionDraft((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPendingCatalogDelete(null);
  }, [
    customBookingProducts,
    financeSettings.uniqueItems,
    pendingCatalogDelete,
    setFinanceSettings,
  ]);

  const isBookingDetailsSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "add-unique-item" ||
    slotBookingScreen === "add-buffer";

  const serviceEditErrors = React.useMemo(
    () =>
      serviceEditAttempted ? getBookingServiceEditErrors(serviceEditDraft) : {},
    [serviceEditAttempted, serviceEditDraft],
  );

  const addInlineGuest = React.useCallback(() => {
    const guestName =
      `${inlineGuestDraft.firstName.trim()} ${inlineGuestDraft.lastName.trim()}`.trim();
    if (!guestName) {
      showSnackbar({
        severity: "warning",
        message:
          inlineGuestParticipantType === "model"
            ? "Model name is required."
            : "Guest name is required.",
      });
      return;
    }
    const modelCount =
      bookingGuests.filter((g) => g.participantType === "model").length + 1;
    setBookingGuests((prev) => [
      ...prev,
      {
        id: `guest-${Date.now()}`,
        name:
          inlineGuestParticipantType === "model" && !guestName
            ? `Model ${modelCount}`
            : guestName,
        services: [],
        products: [],
        participantType: inlineGuestParticipantType,
      },
    ]);
    setInlineGuestDraft({ firstName: "", lastName: "" });
    setInlineGuestParticipantType("guest");
    setShowInlineGuestField(false);
  }, [
    bookingGuests,
    inlineGuestDraft.firstName,
    inlineGuestDraft.lastName,
    inlineGuestParticipantType,
    showSnackbar,
  ]);

  const addDlParticipant = React.useCallback(
    (kind: "planning" | "buffer") => {
      if (kind === "buffer") {
        const defaultEnd =
          selectedSlot?.end?.slice(0, 5) ||
          selectedSlot?.start?.slice(0, 5) ||
          "";
        setBufferDraft({
          title: "",
          teamMemberId: selectedSlot?.resourceId || data.resources[0]?.id || "",
          durationMins: "45",
          endTime: defaultEnd,
        });
        setSlotBookingScreen("add-buffer");
        return;
      }
      const id = `planning-${Date.now()}`;
      setBookingGuests((prev) => [
        ...prev,
        {
          id,
          name: "Planning",
          services: [],
          products: [],
          participantType: "planning",
          planningActivity: "Photoshoot",
          planningDuration: "45 Mins",
        },
      ]);
    },
    [data.resources, selectedSlot?.end, selectedSlot?.resourceId, selectedSlot?.start],
  );

  const applyBufferDraft = React.useCallback(() => {
    const title = bufferDraft.title.trim() || "Buffer";
    setBookingGuests((prev) => [
      ...prev,
      {
        id: `buffer-${Date.now()}`,
        name: title,
        services: [],
        products: [],
        participantType: "buffer",
        planningActivity: title,
        planningDuration: bufferDraft.durationMins.trim()
          ? `${bufferDraft.durationMins.trim()} Mins`
          : "45 Mins",
        bufferTeamMemberId: bufferDraft.teamMemberId || undefined,
        bufferEndTime: bufferDraft.endTime.trim() || undefined,
      },
    ]);
    setSlotBookingScreen("new-booking");
  }, [bufferDraft]);

  const handleProjectFilePick = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      const stamp = Date.now();
      setBookingProjectUploads((prev) => [
        ...prev,
        ...files.map((file, index) => ({
          id: `upload-${stamp}-${prev.length + index}`,
          name: file.name || `upload-${prev.length + index + 1}`,
          previewUrl: URL.createObjectURL(file),
          file,
        })),
      ]);
      e.target.value = "";
    },
    [],
  );

  const deleteProjectUpload = React.useCallback((uploadId: string) => {
    setBookingProjectUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((u) => u.id !== uploadId);
    });
  }, []);

  const hasProductDraftSelection = React.useMemo(
    () => Object.values(productSelectionDraft).some((item) => item.selected),
    [productSelectionDraft],
  );

  const onEmptyClick = React.useCallback(
    (resourceId: string, iso: string, minutes: number) => {
      if (iso < todayIso) {
        showSnackbar({
          severity: "info",
          message: "Cannot create a new booking on a past date.",
        });
        return;
      }
      if (isPublicDayNotAvailable(iso)) {
        showSnackbar({
          severity: "info",
          message:
            getPublicDayNotAvailableNote(iso) ||
            "This day is marked as not available.",
        });
        return;
      }
      const workingHours = getPublicWorkingHoursForDate(iso);
      if (!workingHours) {
        showSnackbar({
          severity: "info",
          message: "No public business hours set for this day.",
        });
        return;
      }
      const busy = getBusyFor(resourceId, iso);
      const free = subtractIntervals([workingHours], busy);
      const segment = free.find(
        (f) => minutes >= f.startMin && minutes < f.endMin,
      );
      if (!segment) {
        showSnackbar({
          severity: "warning",
          message: "This time is not available.",
        });
        return;
      }

      const snap =
        Math.round((minutes - startMin) / grid.stepMinutes) * grid.stepMinutes +
        startMin;
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
      // Empty-slot booking: lock clicked time (no Select time / Start Time pickers).
      openBookingDrawer(payload, { allowTimeSelection: false });
    },
    [
      getBusyFor,
      getPublicDayNotAvailableNote,
      getPublicWorkingHoursForDate,
      grid.stepMinutes,
      isPublicDayNotAvailable,
      openBookingDrawer,
      showSnackbar,
      startMin,
      todayIso,
    ],
  );

  const persistBookingFromDrawer =
    React.useCallback(async (): Promise<boolean> => {
      if (!selectedSlot) return false;

      const existingEvent = editingEventId
        ? events.find((event) => event.id === editingEventId)
        : null;

      if (incomingRequestEditMode && editingEventId && existingEvent) {
        const editedIds = detectEditedServiceIds(
          originalServicesSnapshot,
          selectedServices,
        );
        const originalServices =
          existingEvent.details?.originalServices ?? originalServicesSnapshot;
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
          clientNote: existingEvent.details?.clientNote,
          // Persist as outgoing EBR so Discard EBR and client EBR pill stay in sync.
          requestDirection: "outgoing",
          originalServices,
          editedServiceIds: editedIds,
          clientEditedServiceIds: [],
          lastEditedBy: "professional",
        });
        nextDetails.responseStatus = "suggestion_for_change";
        Object.assign(nextDetails, buildResponseDeadline());
        // Keep client project/people snapshot so client EBR view stays on Continue layout.
        if (existingEvent.details?.clientSnapshot) {
          nextDetails.clientSnapshot = existingEvent.details.clientSnapshot;
        }

        const snapshotServices =
          existingEvent.details?.clientSnapshot?.services ?? [];
        const suggestedServices: CalendarBookingServiceItem[] = [
          ...selectedServices.map((service) => {
            const fromSnapshot =
              snapshotServices.find((row) => row.id === service.id) ??
              snapshotServices.find((row) => row.name === service.name);
            return {
              ...service,
              staffResourceId: service.staffResourceId,
              teamMemberId: service.staffResourceId,
              guestId: fromSnapshot?.guestId ?? null,
            };
          }),
          ...bookingGuests.flatMap((guest) =>
            guest.services.map((service) => ({
              id: service.id,
              name: service.name,
              durationMins: service.durationMins,
              price: service.price,
              staffResourceId: service.staffResourceId,
              teamMemberId: service.staffResourceId,
              startTime: service.startTime,
              endTime: service.endTime,
              guestId: guest.id,
            })),
          ),
        ];
        const suggestedProducts: NonNullable<typeof nextDetails.products> = [
          ...selectedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            unitPrice: product.unitPrice ?? product.price,
          })),
          ...bookingUniqueItems,
          ...bookingGuests.flatMap((guest) => guest.products),
        ];
        const originalProductIds = new Set(
          (existingEvent.details?.products ?? []).map((product) => product.id),
        );
        const editedProductIds = selectedProducts
          .filter((product) => !originalProductIds.has(product.id))
          .map((product) => product.id);
        const bookingRef = existingEvent.bookingCode ?? editingEventId;
        const ebrTotal = bookingTotalForSave;
        const humanNote = bookingInternalNote.trim();
        const persistedNotes = serializeCalendarEntryNotes(
          humanNote,
          nextDetails,
          {
            status: "suggested",
            suggestedAt: new Date().toISOString(),
            professionalNote: bookingInternalNote.trim() || undefined,
            editedServiceIds: editedIds,
            editedProductIds,
            suggestedServices,
            suggestedProducts,
            suggestedDateISO: selectedSlot.date,
            suggestedStart: selectedSlot.start,
            suggestedEnd: selectedSlot.end,
            responseStatus: "suggestion_for_change",
            requestDirection: "outgoing",
            lastEditedBy: "professional",
          },
        );

        const parsedBooking = parseApiCalendarEventId(editingEventId);
        if (parsedBooking?.kind === "booking" && onUpdateBookingStatus) {
          try {
            await onUpdateBookingStatus(parsedBooking.id, "requested", {
              notes: persistedNotes,
              total_price: ebrTotal,
              booking_date: selectedSlot.date,
              start_time: `${selectedSlot.date}T${selectedSlot.start}:00`,
              end_time: `${selectedSlot.date}T${selectedSlot.end}:00`,
            });
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to send edited booking request.",
            });
            return false;
          }
        }

        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEventId
              ? {
                  ...event,
                  status: "Requested",
                  bookingScenario: "EBR",
                  date: selectedSlot.date,
                  start: selectedSlot.start,
                  end: selectedSlot.end,
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
        showSnackbar({
          severity: "success",
          message: "Edited booking request sent to client.",
        });
        void dispatchBookingEventIfApi(editingEventId, "suggest_for_change", {
          initiated_by: "professional",
        });
        setSlotSaveAttempted(false);
        return true;
      }

      const title =
        selectedServices[0]?.name ??
        selectedProducts[0]?.name ??
        bookingUniqueItems[0]?.name ??
        "Booking";
      const clientName =
        selectedClient?.name?.trim() ||
        `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
        `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
        "Client";
      const isNewManualBooking = !editingEventId;
      const parsedEditingId = parseApiCalendarEventId(editingEventId);
      const statusToApiValue = (
        status: CalendarEvent["status"],
      ):
        | "requested"
        | "cancelled"
        | "completed"
        | "confirmed"
        | "in_progress"
        | "no_show"
        | "invalid" => {
        switch (status) {
          case "Requested":
            return "requested";
          case "Cancelled":
            return "cancelled";
          case "Completed":
            return "completed";
          case "In Progress":
            return "in_progress";
          case "No Show":
            return "no_show";
          case "Invalid":
            return "invalid";
          case "Confirmed":
          default:
            return "confirmed";
        }
      };

      const details = {
        ...buildBookingDetailsSnapshot({
          selectedClient,
          selectedServices,
          selectedProducts: [...selectedProducts, ...bookingUniqueItems],
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
          clientNote: existingEvent?.details?.clientNote,
          ...(isNewManualBooking
            ? {
                requestDirection: "outgoing" as const,
                originalServices: selectedServices,
              }
            : existingEvent?.details?.requestDirection
              ? {
                  requestDirection: existingEvent.details.requestDirection,
                  ...(existingEvent.details.originalServices?.length
                    ? {
                        originalServices:
                          existingEvent.details.originalServices,
                      }
                    : { originalServices: selectedServices }),
                }
              : {
                  requestDirection: "outgoing" as const,
                  originalServices: selectedServices,
                }),
        }),
        ...(showPrepayment
          ? {
              prepaymentStatus:
                paymentMethod === "offline"
                  ? ("confirmed" as const)
                  : (existingEvent?.details?.prepaymentStatus ??
                    ("pending" as const)),
            }
          : {}),
      };

      // Shared FL+DL: persist main + guest/model lines in top-level notes so
      // client mapper sees the full update without location forks.
      const guestServiceLines: CalendarBookingServiceItem[] = bookingGuests.flatMap(
        (guest) =>
          guest.services.map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            durationMins: service.durationMins,
            staffResourceId: service.staffResourceId,
            teamMemberId: service.staffResourceId,
            startTime: service.startTime,
            endTime: service.endTime,
            guestId: guest.id,
          })),
      );
      details.services = [
        ...selectedServices.map((service) => ({
          ...service,
          guestId: null as string | null,
        })),
        ...guestServiceLines,
      ];
      details.products = [
        ...selectedProducts,
        ...bookingUniqueItems,
        ...bookingGuests.flatMap((guest) => guest.products),
      ];

      const shouldWriteClientSnapshot =
        slotLocation === "DL" || bookingGuests.length > 0;
      const existingClientSnapshot = existingEvent?.details?.clientSnapshot;
      if (shouldWriteClientSnapshot) {
        let projectUploadsForSnapshot = bookingProjectUploads.map((upload) => ({
          id: upload.id,
          name: upload.name,
          url: upload.url,
          mimeType: upload.mimeType,
          kind: upload.kind,
          previewUrl:
            upload.url && !upload.url.startsWith("blob:")
              ? upload.url
              : upload.previewUrl,
        }));

        if (canUseBookingProject && bookingProjectEnabled) {
          const filesToUpload = bookingProjectUploads
            .map((upload) => upload.file)
            .filter((file): file is File => Boolean(file));
          if (filesToUpload.length > 0) {
            try {
              const uploaded = await uploadBookingAttachments(
                filesToUpload,
              ).unwrap();
              const attachments = uploaded.data?.attachments ?? [];
              const durableByName = new Map(
                attachments.map((att) => [att.name, att]),
              );
              projectUploadsForSnapshot = bookingProjectUploads.map(
                (upload, index) => {
                  if (upload.url && !upload.url.startsWith("blob:")) {
                    const durable = resolveMediaUrl(upload.url) ?? upload.url;
                    return {
                      id: upload.id,
                      name: upload.name,
                      url: upload.url,
                      mimeType: upload.mimeType,
                      kind: upload.kind,
                      previewUrl: durable,
                    };
                  }
                  const matched =
                    (upload.file && durableByName.get(upload.file.name)) ||
                    attachments[index];
                  if (!matched) {
                    return {
                      id: upload.id,
                      name: upload.name,
                      url: upload.url,
                      mimeType: upload.mimeType,
                      kind: upload.kind,
                      previewUrl: undefined,
                    };
                  }
                  const matchedUrl =
                    resolveMediaUrl(matched.url) ?? matched.url;
                  return {
                    id: upload.id,
                    name: upload.name || matched.name,
                    url: matched.url,
                    mimeType: matched.mimeType ?? upload.mimeType,
                    kind: matched.kind ?? upload.kind,
                    previewUrl: matchedUrl,
                  };
                },
              );
              setBookingProjectUploads(
                projectUploadsForSnapshot.map((upload) => ({
                  id: upload.id,
                  name: upload.name,
                  previewUrl: upload.previewUrl,
                  url: upload.url,
                  mimeType: upload.mimeType,
                  kind: upload.kind,
                })),
              );
            } catch (error) {
              showSnackbar({
                severity: "error",
                message: getApiErrorMessage(
                  error,
                  "Unable to upload project files. Please try again.",
                ),
              });
              return false;
            }
          }
        }

        details.clientSnapshot = {
          people: [
            {
              id: "requester",
              name: clientName,
              isRequester: true,
            },
            ...bookingGuests.map((guest) => ({
              id: guest.id,
              name: guest.name,
              isRequester: false as const,
              participantType: guest.participantType ?? ("guest" as const),
              planningActivity: guest.planningActivity,
              planningDuration: guest.planningDuration,
              bufferTeamMemberId: guest.bufferTeamMemberId,
              bufferEndTime: guest.bufferEndTime,
            })),
          ],
          services: details.services.map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            durationMins: service.durationMins,
            guestId: service.guestId ?? null,
            teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
            originalPrice: service.price,
            discount: service.discount ?? null,
          })),
          ...(canUseBookingProject && bookingProjectEnabled
            ? {
                projectDetails: {
                  description: bookingProjectDescription,
                  uploads: projectUploadsForSnapshot
                    .filter(
                      (upload) =>
                        Boolean(upload.url) &&
                        !String(upload.url).startsWith("blob:"),
                    )
                    .map((upload) => ({
                      id: upload.id,
                      name: upload.name,
                      url: upload.url,
                      mimeType: upload.mimeType,
                      kind: upload.kind,
                      previewUrl: upload.url || upload.previewUrl,
                    })),
                },
              }
            : {}),
        };
      }

      // Persist Edited labels for FL + DL when pro updates an existing booking.
      if (editingEventId && existingEvent) {
        const originalServices =
          existingEvent.details?.originalServices?.length
            ? existingEvent.details.originalServices
            : originalServicesSnapshot.length
              ? originalServicesSnapshot
              : selectedServices;
        details.originalServices = originalServices;
        const editedIds = detectEditedServiceIds(
          originalServices,
          (details.services ?? []).map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            durationMins: service.durationMins,
            startTime: service.startTime,
            endTime: service.endTime,
            staffResourceId: service.staffResourceId,
          })),
        );
        const lineChanges = detectServiceLineChanges(
          originalServices,
          (details.services ?? []).map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            durationMins: service.durationMins,
            startTime: service.startTime,
            endTime: service.endTime,
            staffResourceId: service.staffResourceId,
          })),
        );
        const originalProducts = existingEvent.details?.products ?? [];
        const editedProductIds = detectEditedProductIds(
          originalProducts,
          details.products ?? [],
        );
        if (editedIds.length) details.editedServiceIds = editedIds;
        if (lineChanges.added.length) details.addedServiceIds = lineChanges.added;
        if (lineChanges.cancelled.length) {
          details.cancelledServiceIds = lineChanges.cancelled;
        }
        if (editedProductIds.length) details.editedProductIds = editedProductIds;
        const phoneChanged =
          (existingEvent.details?.phoneNumber ?? "") !==
            (details.phoneNumber ?? "") ||
          (existingEvent.details?.phoneCode ?? "") !== (details.phoneCode ?? "");
        const guestNamesChanged =
          JSON.stringify(
            (existingEvent.details?.guests ?? []).map((guest) => guest.name),
          ) !== JSON.stringify((details.guests ?? []).map((guest) => guest.name));
        const scheduleChanged =
          existingEvent.date !== selectedSlot.date ||
          existingEvent.start !== selectedSlot.start ||
          existingEvent.end !== selectedSlot.end;
        if (scheduleChanged) {
          details.scheduleEdited = true;
          details.lastEditedBy = "professional";
        } else if (
          !editedIds.length &&
          !editedProductIds.length &&
          (phoneChanged || guestNamesChanged)
        ) {
          details.silentUpdated = true;
          details.lastEditedBy = "professional";
        } else if (existingEvent.status === "Confirmed") {
          details.lastEditedBy = "professional";
        } else if (editedIds.length || editedProductIds.length) {
          details.lastEditedBy = "professional";
        }
      }

      const isMollureManualBooking =
        addClientSource === "mollure-platform" ||
        Boolean(selectedClient?.mollureUserId);
      const isOfflineManualBooking =
        isNewManualBooking && !isMollureManualBooking;
      const resolvedStatus =
        existingEvent?.status ??
        (isNewManualBooking
          ? isOfflineManualBooking
            ? "Confirmed"
            : "Requested"
          : slotStatus);
      const resolvedBookingType =
        existingEvent?.bookingType ??
        (isNewManualBooking
          ? canUseBookingProject && bookingProjectEnabled
            ? "Project"
            : isOfflineManualBooking
              ? "Offline"
              : "Requests"
          : slotBookingType);

      const buildLocalEvent = (
        id: string,
        bookingCode: string,
      ): CalendarEvent => ({
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
        bookingScenario:
          resolvedStatus === "Requested"
            ? (existingEvent?.bookingScenario ?? "BR")
            : resolvedStatus === "Confirmed" &&
                (details.scheduleEdited ||
                  details.lastEditedBy === "professional" ||
                  details.lastEditedBy === "client") &&
                !details.silentUpdated
              ? "E"
              : undefined,
        showClientName: clientName,
        clientKind: selectedClient?.clientKind,
        details,
      });

      const bookingTotal = bookingTotalForSave;

      // Edit existing API booking / calendar entry — never create a second OF123 code.
      if (editingEventId && parsedEditingId) {
        const createPayload = buildCreateCalendarEntryPayload({
          selectedSlot,
          title,
          clientName,
          status: resolvedStatus,
          bookingType: resolvedBookingType,
          location: slotLocation,
          serviceIds: selectedServices.map((service) => service.id),
          details,
        });
        const grantSave =
          existingEvent?.status === "Confirmed" &&
          isConfirmedEditGrantActive(
            existingEvent.bookingCode ?? extractBookingId(editingEventId),
            "professional",
          );
        const persistedNotes = serializeCalendarEntryNotes(
          details.internalNote ?? "",
          details,
          grantSave ? null : parseStoredEbrFromNotes(existingEvent?.notes),
          grantSave ? null : parseStoredErFromNotes(existingEvent?.notes),
        );

        try {
          if (parsedEditingId.kind === "booking") {
            if (!onUpdateBookingStatus) {
              showSnackbar({
                severity: "error",
                message: "Booking update API is not connected.",
              });
              return false;
            }
            await onUpdateBookingStatus(
              parsedEditingId.id,
              statusToApiValue(resolvedStatus),
              {
                notes: persistedNotes,
                total_price: bookingTotal,
                booking_date: selectedSlot.date,
                start_time: createPayload.start_time ?? null,
                end_time: createPayload.end_time ?? null,
                notify_incoming_er: resolvedStatus === "Requested",
                initiated_by: "professional",
              },
            );
          } else {
            if (!onUpdateCalendarEntry) {
              showSnackbar({
                severity: "error",
                message: "Calendar update API is not connected.",
              });
              return false;
            }
            await onUpdateCalendarEntry(parsedEditingId.id, createPayload);
          }

          const nextEvent = buildLocalEvent(
            editingEventId,
            existingEvent?.bookingCode ??
              String(Math.floor(10000 + Math.random() * 90000)),
          );
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEventId
                ? {
                    ...event,
                    ...nextEvent,
                    id: event.id,
                    notes: persistedNotes,
                  }
                : event,
            ),
          );
          setSlotStatus(nextEvent.status);
          setIsEditingExisting(false);
          if (existingEvent?.status === "Confirmed") {
            const bookingRef =
              existingEvent.bookingCode ?? extractBookingId(editingEventId);
            consumeConfirmedEditGrant(bookingRef);
            setEvents((prev) =>
              prev.map((event) =>
                event.id === editingEventId
                  ? {
                      ...event,
                      bookingScenario:
                        event.bookingScenario === "ER" ||
                        event.bookingScenario === "E" ||
                        nextEvent.bookingScenario === "E"
                          ? "E"
                          : event.bookingScenario,
                    }
                  : event,
              ),
            );
          }
          if (existingEvent && selectedSlot) {
            if (existingEvent.date !== selectedSlot.date) {
              void dispatchBookingEventIfApi(
                editingEventId,
                "booking_date_changed",
                { initiated_by: "professional" },
              );
            } else if (
              existingEvent.start !== selectedSlot.start ||
              existingEvent.end !== selectedSlot.end
            ) {
              void dispatchBookingEventIfApi(editingEventId, "time_changed", {
                initiated_by: "professional",
              });
            }
          }
          showSnackbar({
            severity: "success",
            message: "Booking updated.",
          });
          setSlotSaveAttempted(false);
          return true;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to update booking."),
          });
          return false;
        }
      }

      if (isNewManualBooking) {
        if (!onCreateCalendarEntry) {
          showSnackbar({
            severity: "error",
            message: "Calendar API is not connected.",
          });
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
                bookingScenario:
                  resolvedStatus === "Requested"
                    ? (existingEvent?.bookingScenario ?? "BR")
                    : undefined,
                showClientName: clientName,
                details,
              }
            : buildLocalEvent(
                `b-${Date.now()}-a`,
                String(Math.floor(10000 + Math.random() * 90000)),
              );

          setEvents((prev) => [...prev, nextEvent]);
          setEditingEventId(nextEvent.id);
          setSlotStatus(nextEvent.status);
          setIsEditingExisting(false);
          showSnackbar({
            severity: "success",
            message: isOfflineManualBooking
              ? "Booking confirmed."
              : "Booking request sent.",
          });
          setSlotSaveAttempted(false);
          return true;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to save booking."),
          });
          return false;
        }
      }

      const nextEvent = buildLocalEvent(
        editingEventId ?? `b-${Date.now()}-a`,
        existingEvent?.bookingCode ??
          String(Math.floor(10000 + Math.random() * 90000)),
      );

      setEvents((prev) => {
        if (!editingEventId) return [...prev, nextEvent];
        return prev.map((event) =>
          event.id === editingEventId ? nextEvent : event,
        );
      });
      setEditingEventId(nextEvent.id);
      setSlotStatus(nextEvent.status);
      setIsEditingExisting(false);
      if (existingEvent?.status === "Confirmed" && editingEventId) {
        const bookingRef =
          existingEvent.bookingCode ?? extractBookingId(editingEventId);
        consumeConfirmedEditGrant(bookingRef);
      }
      showSnackbar({
        severity: "success",
        message: "Booking updated.",
      });
      setSlotSaveAttempted(false);
      return true;
    }, [
      bookingGuests,
      bookingInternalNote,
      bookingPhoneDraft,
      bookingTotalDiscount,
      bookingTotalForSave,
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
      onUpdateCalendarEntry,
      originalServicesSnapshot,
      paymentMethod,
      prepaymentPercent,
      bookingProjectDescription,
      bookingProjectEnabled,
      bookingProjectUploads,
      selectedClient,
      addClientSource,
      uploadBookingAttachments,
      selectedProducts,
      selectedServices,
      bookingUniqueItems,
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
      canUseBookingProject,
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
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
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

                <AppButton
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
                  {viewMode === "month"
                    ? formatMonthYearUtc(activeMonthIso)
                    : formatLongDateUtc(activeDateIso)}
                </AppButton>

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
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
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

              <AppButton
                tone="secondary"
                onClick={onToday}
                sx={{
                  fontSize: 10.5,
                  height: 24,
                  px: 1,
                }}
              >
                Today
              </AppButton>

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
                    <AppButton
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
                    </AppButton>
                  );
                })}
              </Box>

              <AppButton
                tone="secondary"
                startIcon={<FilterListRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setFiltersOpen(true)}
                sx={{
                  borderRadius: "5px",
                  fontSize: 10.5,
                  height: 24,
                  px: 1,
                  "& .MuiButton-startIcon": { mr: 0.45 },
                }}
              >
                Filters
              </AppButton>

              <AppButton
                tone="primary"
                endIcon={<KeyboardArrowDownRoundedIcon />}
                onClick={(e) => setAddAnchor(e.currentTarget)}
                sx={{
                  fontSize: 10.5,
                  height: 24,
                  px: 1.1,
                  "& .MuiButton-endIcon": { color: "#fff" },
                }}
              >
                Add
              </AppButton>
              <CalendarAddMenu
                anchorEl={addAnchor}
                bookingDisabled={isAddMenuBookingDisabled}
                onBlockedTime={() => {
                  setBlockDraft((prev) => ({
                    ...prev,
                    dateFrom: activeDateIso,
                    dateTo: activeDateIso,
                    teamIds: activeResource
                      ? [activeResource.id]
                      : prev.teamIds,
                  }));
                  setBlockTimeOpen(true);
                }}
                onBooking={() => {
                  const bookingDate = activeDateIso;
                  const resourceId =
                    addMenuBookingResourceId ||
                    data.resources[0]?.id ||
                    "unassigned";
                  const availability = getAvailabilityFor(
                    resourceId,
                    bookingDate,
                  );
                  const publicHours = getPublicBusinessHoursInterval(
                    calendarSettings?.availability.publicBusinessHours,
                    bookingDate,
                    slotLocation,
                  );
                  const segment = availability[0] ??
                    publicHours ?? {
                      startMin,
                      endMin: Math.min(endMin, startMin + grid.stepMinutes),
                    };
                  let start = Number.isFinite(segment.startMin)
                    ? segment.startMin
                    : startMin;
                  const segmentEnd = Number.isFinite(segment.endMin)
                    ? segment.endMin
                    : Math.min(endMin, start + grid.stepMinutes);
                  if (bookingDate === todayIso && start < nowMin) {
                    const snapped =
                      Math.ceil(nowMin / grid.stepMinutes) * grid.stepMinutes;
                    if (snapped < segmentEnd) start = snapped;
                  }
                  openBookingDrawer(
                    {
                      resourceId,
                      date: bookingDate,
                      start: fmtMinToTime(start),
                      end: fmtMinToTime(
                        Math.min(segmentEnd, start + grid.stepMinutes),
                      ),
                      freeStart: fmtMinToTime(
                        Number.isFinite(segment.startMin)
                          ? segment.startMin
                          : start,
                      ),
                      freeEnd: fmtMinToTime(segmentEnd),
                    },
                    { allowTimeSelection: true },
                  );
                }}
                onPublicBusinessHours={() => setPublicBusinessHoursOpen(true)}
                onDesign={() => {
                  setDesignDraft(appliedDesign);
                  setDesignOpen(true);
                }}
                onClose={() => setAddAnchor(null)}
                onMockAction={(label) =>
                  showSnackbar({ severity: "info", message: label })
                }
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
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <Box
                        key={day}
                        sx={{
                          px: 1.25,
                          py: 1,
                          borderLeft:
                            day !== "Mon"
                              ? `1px solid ${alpha(m.navy, 0.07)}`
                              : undefined,
                        }}
                      >
                        <BodyText
                          sx={{
                            fontSize: 11,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.58),
                            lineHeight: 1,
                          }}
                        >
                          {day}
                        </BodyText>
                      </Box>
                    ),
                  )}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(118px, 1fr))",
                  }}
                >
                  {monthCells.map((cell, idx) => {
                    const hasBookings = cell.dayEvents.length > 0;
                    const showClosed =
                      isPublicDayNotAvailable(cell.iso) && !cell.isPast;
                    const closedNote = showClosed
                      ? getPublicDayNotAvailableNote(cell.iso)
                      : null;

                    return (
                      <Tooltip
                        key={cell.iso}
                        title={closedNote || ""}
                        disableHoverListener={!closedNote}
                        arrow
                        placement="top"
                      >
                      <ButtonBase
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
                          borderLeft:
                            idx % 7 === 0
                              ? undefined
                              : `1px solid ${alpha(m.navy, 0.07)}`,
                          borderTop:
                            idx < 7
                              ? undefined
                              : `1px solid ${alpha(m.navy, 0.07)}`,
                          bgcolor: showClosed
                            ? m.blockedTimeBg
                            : cell.isSelected
                              ? alpha(m.teal, 0.055)
                              : cell.inMonth
                                ? "#fff"
                                : alpha(m.navy, 0.018),
                          opacity: cell.isPast ? 0.66 : cell.inMonth ? 1 : 0.72,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: showClosed
                              ? alpha(m.blockedTimeFg, 0.16)
                              : hasBookings
                                ? alpha(m.teal, 0.045)
                                : alpha(m.navy, 0.025),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            minWidth: 0,
                            p: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "999px",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 11,
                                fontWeight: 900,
                                color: showClosed
                                  ? m.blockedTimeFg
                                  : cell.isToday
                                    ? "#fff"
                                    : alpha(m.navy, cell.inMonth ? 0.82 : 0.42),
                                bgcolor: showClosed
                                  ? alpha(m.blockedTimeFg, 0.12)
                                  : cell.isToday
                                    ? m.teal
                                    : "transparent",
                                border:
                                  cell.isSelected &&
                                  !cell.isToday &&
                                  !showClosed
                                    ? `1px solid ${alpha(m.teal, 0.45)}`
                                    : "1px solid transparent",
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
                              const resourceName =
                                resourceNameById.get(event.resourceId) ??
                                "Team member";
                              const eventAccent = statusAccentColor(
                                event.status,
                              );

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
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ minWidth: 0 }}
                                  >
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
                                    {resourceName} - ID:{" "}
                                    {extractBookingId(event.id)}
                                  </BodyText>
                                </Box>
                              );
                            })}
                            {cell.hiddenCount > 0 ? (
                              <BodyText
                                sx={{
                                  fontSize: 10.5,
                                  fontWeight: 900,
                                  color: alpha(m.tealDark, 0.9),
                                  px: 0.3,
                                }}
                              >
                                +{cell.hiddenCount} more
                              </BodyText>
                            ) : null}
                          </Stack>
                        </Box>
                      </ButtonBase>
                      </Tooltip>
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
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    bgcolor: m.fxSurface,
                    position: "relative",
                  }}
                >
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
                    <Box
                      sx={{
                        height: timelineHeaderPx,
                        borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                      }}
                    />
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
                          <BodyText
                            sx={{
                              fontSize: 9.5,
                              fontWeight: 600,
                              color: alpha(m.navy, 0.58),
                              lineHeight: 1,
                            }}
                          >
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
                      const laneDates =
                        viewMode === "week" ? visibleDates : [activeDateIso];
                      // Week keeps Mon–Sun headers, but body shows only the selected day.
                      const laneColumns =
                        viewMode === "day"
                          ? [
                              {
                                key: res.id,
                                resource: res,
                                date: activeDateIso,
                              },
                            ]
                          : [
                              {
                                key: activeDateIso,
                                resource: res,
                                date: activeDateIso,
                              },
                            ];
                      return (
                        <Box
                          key={res.id}
                          sx={{
                            borderTop:
                              laneIdx > 0
                                ? `1px solid ${alpha(m.navy, 0.08)}`
                                : undefined,
                          }}
                        >
                          {/* Lane header — hidden until at least one team member exists */}
                          {hasTeamMembers
                            ? renderTeamMemberHeader(res)
                            : null}
                          {viewMode === "week" ? (
                            <Box
                              sx={{
                                height: laneHeaderPx,
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(7, minmax(110px, 1fr))",
                                bgcolor: "#fff",
                                borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                                overflow: "hidden",
                              }}
                            >
                              {laneDates.map((date, colIdx) => {
                                const isActiveDay = date === activeDateIso;
                                const isPastDay = date < todayIso;
                                const showClosed =
                                  isPublicDayNotAvailable(date) && !isPastDay;
                                const closedNote = showClosed
                                  ? getPublicDayNotAvailableNote(date)
                                  : null;
                                const ratio = Math.round(
                                  getDailyBookingRatio(res.id, date) * 100,
                                );

                                return (
                                  <Tooltip
                                    key={`week-day-${date}`}
                                    title={closedNote || ""}
                                    disableHoverListener={!closedNote}
                                    arrow
                                    placement="top"
                                  >
                                  <Box
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isActiveDay}
                                    aria-label={`Select ${formatWeekDayName(date)} ${formatWeekDayDate(date)}`}
                                    onClick={() => setActiveDateIso(date)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setActiveDateIso(date);
                                      }
                                    }}
                                    sx={{
                                      minWidth: 110,
                                      px: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexDirection: "column",
                                      cursor: "pointer",
                                      borderLeft:
                                        colIdx > 0
                                          ? `1px solid ${alpha(m.navy, 0.07)}`
                                          : undefined,
                                      bgcolor: showClosed
                                        ? m.blockedTimeBg
                                        : isActiveDay
                                          ? alpha(m.teal, 0.035)
                                          : "#fff",
                                      opacity: isPastDay ? 0.66 : 1,
                                      "&:hover": {
                                        bgcolor: showClosed
                                          ? alpha(m.blockedTimeFg, 0.16)
                                          : isActiveDay
                                            ? alpha(m.teal, 0.05)
                                            : alpha(m.navy, 0.02),
                                      },
                                    }}
                                  >
                                    <BodyText
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 900,
                                        color: showClosed
                                          ? m.blockedTimeFg
                                          : alpha(m.navy, 0.78),
                                        lineHeight: 1.1,
                                      }}
                                    >
                                      {formatWeekDayName(date)}
                                    </BodyText>
                                    <BodyText
                                      sx={{
                                        mt: 0.3,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: showClosed
                                          ? m.blockedTimeFg
                                          : alpha(m.navy, 0.5),
                                        lineHeight: 1,
                                      }}
                                    >
                                      {formatWeekDayDate(date)}
                                    </BodyText>
                                    <Box
                                      sx={{
                                        mt: 0.45,
                                        height: 3,
                                        width: 58,
                                        borderRadius: "999px",
                                        bgcolor: showClosed
                                          ? alpha(m.blockedTimeFg, 0.2)
                                          : m.fxGrayF2F4F7,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          height: "100%",
                                          width: `${ratio}%`,
                                          bgcolor: showClosed
                                            ? m.blockedTimeFg
                                            : isActiveDay
                                              ? m.teal
                                              : alpha(m.navy, 0.24),
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          ) : null}

                          {/* Lane body */}
                          <Box
                            sx={{
                              position: "relative",
                              display: "grid",
                              gridTemplateColumns: "1fr",
                              bgcolor: "#fff",
                            }}
                          >
                            {laneColumns.map(
                              ({ key, resource, date }, colIdx) => {
                                const laneEvents = eventsInRange.filter(
                                  (event) => {
                                    if (event.date !== date) return false;
                                    // Day / week body: single selected-day lane.
                                    if (viewMode === "day") return true;
                                    if (viewMode === "week") {
                                      if (date !== activeDateIso) return false;
                                      if (
                                        !event.resourceId ||
                                        !knownResourceIds.has(event.resourceId)
                                      )
                                        return true;
                                      return event.resourceId === resource.id;
                                    }
                                    if (
                                      !event.resourceId ||
                                      !knownResourceIds.has(event.resourceId)
                                    )
                                      return true;
                                    return event.resourceId === resource.id;
                                  },
                                );
                                const laneBlocks = blocksInRange.filter(
                                  (block) => {
                                    if (block.date !== date) return false;
                                    if (viewMode === "day") return true;
                                    if (viewMode === "week") {
                                      if (date !== activeDateIso) return false;
                                      if (
                                        !block.resourceId ||
                                        !knownResourceIds.has(block.resourceId)
                                      )
                                        return true;
                                      return block.resourceId === resource.id;
                                    }
                                    if (
                                      !block.resourceId ||
                                      !knownResourceIds.has(block.resourceId)
                                    )
                                      return true;
                                    return block.resourceId === resource.id;
                                  },
                                );

                                // Unavailable overlay (everything outside public working hours)
                                const workingHours =
                                  getPublicWorkingHoursForDate(date);
                                const availability = workingHours
                                  ? [workingHours]
                                  : [];
                                const isPastDay = date < todayIso;
                                const showClosed =
                                  isPublicDayNotAvailable(date) && !isPastDay;
                                const closedNote = showClosed
                                  ? getPublicDayNotAvailableNote(date)
                                  : null;
                                const bookingAddDisabled =
                                  showClosed ||
                                  isPastDay ||
                                  availability.length === 0;

                                return (
                                  <Tooltip
                                    key={key}
                                    title={closedNote || ""}
                                    disableHoverListener={!closedNote}
                                    arrow
                                    placement="top"
                                  >
                                  <Box
                                    sx={{
                                      position: "relative",
                                      borderLeft:
                                        colIdx > 0
                                          ? `1px solid ${alpha(m.navy, 0.07)}`
                                          : undefined,
                                      height: rows * rowPx,
                                      bgcolor: showClosed
                                        ? m.blockedTimeBg
                                        : m.fxGrayF2F4F7,
                                      overflow: "visible",
                                      ...(isPastDay
                                        ? { opacity: 0.72 }
                                        : null),
                                    }}
                                  >
                                    {/* Click layer — below booking cards */}
                                    <Box
                                      onClick={(e) => {
                                        if (bookingAddDisabled) return;
                                        const rect = (
                                          e.currentTarget as HTMLDivElement
                                        ).getBoundingClientRect();
                                        const y = e.clientY - rect.top;
                                        const minutes =
                                          startMin +
                                          Math.floor(y / rowPx) *
                                            grid.stepMinutes;
                                        onEmptyClick(
                                          resource.id,
                                          date,
                                          minutes,
                                        );
                                      }}
                                      sx={{
                                        position: "absolute",
                                        inset: 0,
                                        cursor: bookingAddDisabled
                                          ? "default"
                                          : "pointer",
                                        zIndex: 1,
                                      }}
                                    />

                                    {/* Public hours: whole day not available */}
                                    {showClosed ? (
                                      <Box
                                        sx={{
                                          position: "absolute",
                                          inset: 0,
                                          bgcolor: m.blockedTimeBg,
                                          border: `1px solid ${alpha(m.blockedTimeFg, 0.18)}`,
                                          pointerEvents: "none",
                                          zIndex: 0,
                                        }}
                                      />
                                    ) : null}

                                    {/* Outside availability tint */}
                                    {!showClosed && availability.length ? (
                                      <>
                                        {/* Top unavailable */}
                                        {Math.min(
                                          ...availability.map(
                                            (a) => a.startMin,
                                          ),
                                        ) > startMin ? (
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              left: 0,
                                              right: 0,
                                              top: 0,
                                              height:
                                                ((Math.min(
                                                  ...availability.map(
                                                    (a) => a.startMin,
                                                  ),
                                                ) -
                                                  startMin) /
                                                  grid.stepMinutes) *
                                                rowPx,
                                              bgcolor: "#fff",
                                              pointerEvents: "none",
                                            }}
                                          />
                                        ) : null}
                                        {/* Bottom unavailable */}
                                        {Math.max(
                                          ...availability.map((a) => a.endMin),
                                        ) < endMin ? (
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              left: 0,
                                              right: 0,
                                              top:
                                                ((Math.max(
                                                  ...availability.map(
                                                    (a) => a.endMin,
                                                  ),
                                                ) -
                                                  startMin) /
                                                  grid.stepMinutes) *
                                                rowPx,
                                              height:
                                                ((endMin -
                                                  Math.max(
                                                    ...availability.map(
                                                      (a) => a.endMin,
                                                    ),
                                                  )) /
                                                  grid.stepMinutes) *
                                                rowPx,
                                              bgcolor: "#fff",
                                              pointerEvents: "none",
                                            }}
                                          />
                                        ) : null}
                                      </>
                                    ) : !showClosed ? (
                                      <Box
                                        sx={{
                                          position: "absolute",
                                          inset: 0,
                                          bgcolor: "#fff",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ) : null}

                                    {data.supportedLocations.map((location) => {
                                      const locationIntervals =
                                        getLocationAvailability(
                                          resource.id,
                                          date,
                                          location,
                                        );
                                      return locationIntervals.map(
                                        (interval, intervalIdx) => {
                                          const top =
                                            ((interval.startMin - startMin) /
                                              grid.stepMinutes) *
                                            rowPx;
                                          const height =
                                            ((interval.endMin -
                                              interval.startMin) /
                                              grid.stepMinutes) *
                                            rowPx;
                                          const flOnly = location === "FL";
                                          const dlOnly = location === "DL";
                                          const tooltipTitle = flOnly
                                            ? "FL Availability: Available for booking at a fixed location."
                                            : "DL Availability: Available for booking at a desired location.";

                                          return (
                                            <Tooltip
                                              key={`${location}-${intervalIdx}`}
                                              title={tooltipTitle}
                                              placement="top"
                                            >
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
                                                  borderLeft: dlOnly
                                                    ? `2px solid ${alpha(m.teal, 0.12)}`
                                                    : undefined,
                                                }}
                                              />
                                            </Tooltip>
                                          );
                                        },
                                      );
                                    })}

                                    {/* Horizontal grid lines */}
                                    {slotLines.map((t) => (
                                      <Box
                                        key={`line-${resource.id}-${date}-${t}`}
                                        sx={{
                                          position: "absolute",
                                          left: 0,
                                          right: 0,
                                          top:
                                            ((t - startMin) /
                                              grid.stepMinutes) *
                                            rowPx,
                                          height: 1,
                                          bgcolor: alpha(m.navy, 0.065),
                                          pointerEvents: "none",
                                        }}
                                      />
                                    ))}

                                    {/* Blocks */}
                                    {laneBlocks.map((b) => {
                                      const top =
                                        ((minutesSinceMidnight(b.start) -
                                          startMin) /
                                          grid.stepMinutes) *
                                        rowPx;
                                      const height = Math.max(
                                        2,
                                        ((minutesSinceMidnight(b.end) -
                                          minutesSinceMidnight(b.start)) /
                                          grid.stepMinutes) *
                                          rowPx,
                                      );

                                      return (
                                        <Box
                                          key={b.id}
                                          title={`${b.title}: ${b.start} – ${b.end}`}
                                          sx={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top,
                                            height,
                                            pointerEvents: "none",
                                            zIndex: 3,
                                            bgcolor: m.blockedTimeBg,
                                            borderLeft: `3px solid ${m.blockedTimeFg}`,
                                            boxSizing: "border-box",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {height >= 28 ? (
                                            <Box
                                              sx={{
                                                position: "absolute",
                                                left: 8,
                                                top: 6,
                                                right: 6,
                                                pointerEvents: "none",
                                              }}
                                            >
                                              <BodyText
                                                sx={{
                                                  fontWeight: 900,
                                                  fontSize: 10,
                                                  color: m.blockedTimeFg,
                                                  lineHeight: 1.1,
                                                }}
                                              >
                                                {b.start} to {b.end}
                                              </BodyText>
                                              {height >= 40 ? (
                                                <BodyText
                                                  sx={{
                                                    fontSize: 10.5,
                                                    fontWeight: 800,
                                                    color: m.blockedTimeFg,
                                                    lineHeight: 1.1,
                                                  }}
                                                >
                                                  {b.title}
                                                </BodyText>
                                              ) : null}
                                            </Box>
                                          ) : null}
                                        </Box>
                                      );
                                    })}

                                    {/* Events */}
                                    {clusterSameStartTimeEvents(laneEvents).map(
                                      (cluster) => {
                                        const {
                                          startMin: clusterStart,
                                          endMin: clusterEnd,
                                        } = getClusterTimeBounds(cluster);
                                        const top =
                                          ((clusterStart - startMin) /
                                            grid.stepMinutes) *
                                            rowPx +
                                          0.15;
                                        const height = Math.max(
                                          78,
                                          ((clusterEnd - clusterStart) /
                                            grid.stepMinutes) *
                                            rowPx -
                                            0.3,
                                        );
                                        const resolveServiceColor = (
                                          ev: (typeof cluster)[number],
                                        ) =>
                                          resolveEventColors(ev).serviceColor;
                                        const resolveStatusColor = (
                                          ev: (typeof cluster)[number],
                                        ) => resolveEventColors(ev).statusColor;
                                        const eventHandlers = {
                                          onOpen: openExistingBooking,
                                          onOpenCalendar: (
                                            ev: (typeof cluster)[number],
                                          ) =>
                                            showSnackbar({
                                              severity: "info",
                                              message: `Calendar for booking ${extractBookingId(ev.id)}`,
                                            }),
                                          onOpenNotes: (
                                            ev: (typeof cluster)[number],
                                          ) => openExistingBooking(ev),
                                          onOpenClient: (
                                            ev: (typeof cluster)[number],
                                          ) =>
                                            showSnackbar({
                                              severity: "info",
                                              message: `Client drawer: ${ev.showClientName ?? "Client"}`,
                                            }),
                                          onOpenMessages: openBookingMessages,
                                        };

                                        if (cluster.length > 1) {
                                          return (
                                            <CalendarBookingTicketStack
                                              key={cluster
                                                .map((event) => event.id)
                                                .join("-")}
                                              events={cluster}
                                              top={top}
                                              rowPx={rowPx}
                                              slotHeight={height}
                                              getServiceColor={
                                                resolveServiceColor
                                              }
                                              getStatusColor={
                                                resolveStatusColor
                                              }
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
                                            serviceColor={resolveServiceColor(
                                              ev,
                                            )}
                                            statusColor={resolveStatusColor(ev)}
                                            onOpen={() =>
                                              eventHandlers.onOpen(ev)
                                            }
                                            onOpenCalendar={() =>
                                              eventHandlers.onOpenCalendar(ev)
                                            }
                                            onOpenNotes={() =>
                                              eventHandlers.onOpenNotes(ev)
                                            }
                                            onOpenClient={() =>
                                              eventHandlers.onOpenClient(ev)
                                            }
                                            onOpenMessages={() =>
                                              eventHandlers.onOpenMessages(ev)
                                            }
                                          />
                                        );
                                      },
                                    )}
                                  </Box>
                                  </Tooltip>
                                );
                              },
                            )}
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
            const blockTitle = blockTitleFromDraft(draft);
            const nextBlocks = buildBlocksFromDraft(draft, draft.teamIds);
            setBlocks((prev) => [...prev, ...nextBlocks]);
            if (!onCreateCalendarEntry) return;
            for (const teamId of draft.teamIds) {
              for (const location of draft.locations) {
                await onCreateCalendarEntry({
                  team_member_id: String(teamId).trim() || null,
                  status: "blocked",
                  title: blockTitle,
                  blocked_time_start: toDateTimeInput(
                    draft.dateFrom,
                    draft.startTime,
                  ),
                  blocked_time_end: toDateTimeInput(
                    draft.dateTo || draft.dateFrom,
                    draft.endTime,
                  ),
                  start_date: draft.dateFrom,
                  end_date: draft.dateTo || draft.dateFrom,
                  location_type: locationToApi(location),
                  notes:
                    `${draft.dayFrom}${draft.dayTo ? ` - ${draft.dayTo}` : ""}`.trim() ||
                    null,
                });
              }
            }
            showSnackbar({
              severity: "success",
              message: "Blocked time added.",
            });
          }}
          onDeleteBlockedEntry={onDeleteCalendarEntry}
          onSaveScheduleRows={async (rows) => {
            setScheduleRows(rows);
            await persistAvailabilitySettings({ scheduleAvailability: rows });
            showSnackbar({
              severity: "success",
              message: "Availability saved.",
            });
          }}
          resources={data.resources}
          scheduleRows={scheduleRows}
          selectedResourceIds={scheduleResourceFilter}
          onSelectedResourceIdsChange={setScheduleResourceFilter}
          activeBookings={events.map((event) => ({
            id: event.id,
            resourceId: event.resourceId,
            date: event.date,
            start: event.start,
            end: event.end,
            prepaid: event.details?.prepaymentStatus === "confirmed",
            status: event.status,
          }))}
          onCancelBookingsInSlot={async (bookingIds) => {
            for (const eventId of bookingIds) {
              const current = events.find((event) => event.id === eventId);
              const nextDetails = {
                ...(current?.details ?? {}),
                refunded: Boolean(current?.details?.prepaymentStatus === "confirmed"),
              };
              const nextNotes = serializeCalendarEntryNotes(
                nextDetails.internalNote ?? "",
                nextDetails,
                parseStoredEbrFromNotes(current?.notes),
                parseStoredErFromNotes(current?.notes),
              );
              await persistEventStatus(eventId, "Cancelled", { notes: nextNotes });
            }
            setEvents((prev) =>
              prev.map((event) =>
                bookingIds.includes(event.id)
                  ? {
                      ...event,
                      status: "Cancelled",
                      details: {
                        ...(event.details ?? {}),
                        refunded:
                          event.details?.prepaymentStatus === "confirmed",
                      },
                    }
                  : event,
              ),
            );
          }}
        />
      ) : null}

      {activeSubTab === "Settings" ? (
        <CalendarHoursRulesPanel
          availableLocations={data.supportedLocations}
          bookingRules={bookingRules}
          publicBusinessHours={
            Array.isArray(calendarSettings?.availability.publicBusinessHours)
              ? calendarSettings.availability.publicBusinessHours
              : []
          }
          serviceOrder={serviceOrderDraft}
          appliedDesign={appliedDesign}
          isSaving={isSaving}
          onBookingRulesChange={setBookingRules}
          onServiceOrderChange={setServiceOrderDraft}
          onOpenDesign={() => {
            setDesignDraft(appliedDesign);
            setDesignOpen(true);
          }}
          onOpenPublicHours={(location) => {
            if (location) {
              setPublicBusinessHoursDraft((prev) => ({
                ...prev,
                locations: [location],
                schedule: location === "FL" ? "fixed" : "variable",
              }));
            }
            setPublicBusinessHoursOpen(true);
          }}
          onOpenServiceOrder={() => setServiceOrderOpen(true)}
          onSaveBookingRules={async () => {
            await persistAvailabilitySettings({ bookingRules });
            showSnackbar({
              severity: "success",
              message: "Booking rules saved.",
            });
          }}
          onSaveServiceOrder={async () => {
            await persistAvailabilitySettings({
              serviceOrder: serviceOrderDraft,
            });
            await onSyncServiceOrderToSetup?.(serviceOrderDraft);
            showSnackbar({
              severity: "success",
              message: "Service order saved.",
            });
          }}
          onEditAppearanceColor={() => {
            setDesignDraft(appliedDesign);
            setDesignOpen(true);
          }}
          onRemoveAppearanceColor={async (key) => {
            const nextDesign: CalendarDesignDraft =
              appliedDesign.scope === "Services"
                ? {
                    ...appliedDesign,
                    colorsByService: Object.fromEntries(
                      Object.entries(
                        appliedDesign.colorsByService ?? {},
                      ).filter(([entryKey]) => entryKey !== key),
                    ),
                  }
                : appliedDesign.scope === "Status"
                  ? {
                      ...appliedDesign,
                      colorsByStatus: Object.fromEntries(
                        Object.entries(
                          appliedDesign.colorsByStatus ?? {},
                        ).filter(([entryKey]) => entryKey !== key),
                      ),
                    }
                  : appliedDesign.scope === "Team Members"
                    ? {
                        ...appliedDesign,
                        colorsByTeamMember: Object.fromEntries(
                          Object.entries(
                            appliedDesign.colorsByTeamMember ?? {},
                          ).filter(([entryKey]) => entryKey !== key),
                        ),
                      }
                    : {
                        ...appliedDesign,
                        colorsByCategory: Object.fromEntries(
                          Object.entries(
                            appliedDesign.colorsByCategory ?? {},
                          ).filter(([entryKey]) => entryKey !== key),
                        ),
                      };
            setAppliedDesign(nextDesign);
            setDesignDraft(nextDesign);
            try {
              await persistAvailabilitySettings({ design: nextDesign });
              showSnackbar({
                severity: "success",
                message: "Calendar colour removed.",
              });
            } catch {
              showSnackbar({
                severity: "error",
                message: "Unable to remove calendar colour.",
              });
            }
          }}
        />
      ) : null}

      <AppDrawer
        anchor="right"
        open={slotDrawerOpen}
        onClose={closeBookingDrawer}
        bodyBgcolor={
          isCancelledOrInvalidBooking ? m.cancelledSurface : undefined
        }
        title={
          activityDetailItem
            ? activityDetailItem.detailType === "cancellation"
              ? "Activity Details"
              : "Edit request details"
            : slotBookingScreen === "select-services"
              ? "Select Service"
              : slotBookingScreen === "edit-service"
                ? "Edit service"
                : slotBookingScreen === "select-products"
                  ? "Select Product"
                  : slotBookingScreen === "add-unique-item"
                    ? editingCatalogProductId
                      ? "Edit Product"
                      : uniqueItemOrigin === "products"
                        ? "Add Product"
                        : "Add Unique Item"
                    : slotBookingScreen === "add-buffer"
                      ? "Add Buffer"
                      : slotBookingScreen === "add-client-choice"
                        ? "Add Client"
                        : slotBookingScreen === "guest"
                          ? "Add Guest"
                          : slotBookingScreen === "non-mollure-individual" ||
                              slotBookingScreen === "non-mollure-company"
                            ? "Add Non-Mollure Client"
                            : slotDrawerTab === "sales"
                              ? "Sales"
                              : slotDrawerTab === "activity"
                                ? "Activity"
                                : editingEventId || isViewingExisting
                                  ? "Booking Details"
                                  : "New Booking"
        }
        onBack={
          activityDetailItem
            ? () => setActivityDetailItem(null)
            : isBookingDetailsSubScreen
              ? () =>
                  setSlotBookingScreen(
                    slotBookingScreen === "add-unique-item"
                      ? uniqueItemOrigin === "booking"
                        ? "new-booking"
                        : "select-products"
                      : slotBookingScreen === "edit-service"
                        ? "select-services"
                        : "new-booking",
                  )
              : undefined
        }
        footer={
          selectedSlot && slotDrawerTab === "booking" && !activityDetailItem ? (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                {slotBookingScreen === "new-booking" &&
                slotClientAdded &&
                !isViewingExisting ? (
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
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
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
                          showSnackbar({
                            severity: "info",
                            message: "Prepayment enabled.",
                          });
                        },
                      },
                      ...(slotLocation === "DL"
                        ? ([
                            {
                              label: "Add Kilometer Allowance",
                              onClick: () => {
                                if (isViewingExisting) return;
                                setShowKilometerAllowance(true);
                                showSnackbar({
                                  severity: "info",
                                  message: "Kilometer Allowance enabled.",
                                });
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
                          if (
                            !lateRescheduleFeePercent &&
                            lateRescheduleFeePercentDefault
                          ) {
                            setLateRescheduleFeePercent(
                              lateRescheduleFeePercentDefault,
                            );
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
                {!hideClientBookingFooterActions ? (
                  <AppButton
                    tone="secondary"
                    onClick={async () => {
                      if (slotBookingScreen === "add-unique-item") {
                        setEditingCatalogProductId(null);
                        setSlotBookingScreen(
                          uniqueItemOrigin === "booking"
                            ? "new-booking"
                            : "select-products",
                        );
                        return;
                      }
                      if (slotBookingScreen === "add-buffer") {
                        setSlotBookingScreen("new-booking");
                        return;
                      }
                      if (slotBookingScreen === "edit-service") {
                        setSlotBookingScreen("select-services");
                        return;
                      }
                      if (
                        slotBookingScreen === "select-services" ||
                        slotBookingScreen === "select-products"
                      ) {
                        setSlotBookingScreen("new-booking");
                        return;
                      }
                      if (
                        slotBookingScreen === "non-mollure-individual" ||
                        slotBookingScreen === "non-mollure-company"
                      ) {
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
                      height: 38,
                      minWidth: 110,
                    }}
                  >
                    {slotBookingScreen === "new-booking" ? "Cancel" : "Back"}
                  </AppButton>
                ) : null}
                {slotBookingScreen === "new-booking" &&
                editingEventId &&
                !isCompletedBooking &&
                !isCancelledOrInvalidBooking &&
                !hideClientBookingEditButton ? (
                  <AppButton
                    tone="secondary"
                    onClick={() => {
                      void handleBookingActionSelect("edit");
                    }}
                    disabled={isEditingExisting}
                    sx={{
                      borderRadius: "10px",
                      height: 38,
                      minWidth: 110,
                      gap: 0.5,
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 18 }} />
                    Edit
                  </AppButton>
                ) : null}
                {!hideClientBookingFooterActions &&
                  (slotBookingScreen === "new-booking" &&
                  (isCompletedBooking || isCancelledOrInvalidBooking) ? null : (
                    <AppButton
                      tone="primary"
                      disabled={
                        isSaving ||
                        (slotBookingScreen === "edit-service"
                          ? isViewingExisting || !slotValidation.isValid
                          : slotBookingScreen === "select-services"
                            ? isViewingExisting ||
                              serviceSelectionDraft.length === 0
                            : slotBookingScreen === "select-products"
                              ? isViewingExisting || !hasProductDraftSelection
                              : slotBookingScreen === "add-unique-item"
                                ? isViewingExisting || !slotValidation.isValid
                                : slotBookingScreen === "add-buffer"
                                  ? isViewingExisting || !slotValidation.isValid
                                  : incomingRequestEditMode
                                    ? !slotValidation.isValid
                                    : drawerPrimaryActionLabel === "Update"
                                      ? !isEditingExisting ||
                                        !slotValidation.isValid ||
                                        !isBookingDirty
                                      : !slotValidation.isValid ||
                                        isViewingExisting)
                      }
                      onClick={() => {
                        if (isCompletedBooking || isCancelledOrInvalidBooking)
                          return;
                        setSlotSaveAttempted(true);
                        if (
                          drawerPrimaryActionLabel === "Update" &&
                          !isEditingExisting
                        ) {
                          return;
                        }
                        if (slotBookingScreen === "edit-service") {
                          if (isViewingExisting) return;
                          setServiceEditAttempted(true);
                          if (!slotValidation.isValid) return;
                          applyServiceEdit();
                          return;
                        }
                        if (slotBookingScreen === "select-services") {
                          if (
                            isViewingExisting ||
                            serviceSelectionDraft.length === 0
                          )
                            return;
                          applyServiceSelection();
                          return;
                        }
                        if (slotBookingScreen === "select-products") {
                          if (isViewingExisting || !hasProductDraftSelection)
                            return;
                          applyProductSelection();
                          return;
                        }
                        if (slotBookingScreen === "add-unique-item") {
                          if (isViewingExisting || !slotValidation.isValid)
                            return;
                          applyUniqueItem();
                          return;
                        }
                        if (slotBookingScreen === "add-buffer") {
                          if (isViewingExisting || !slotValidation.isValid)
                            return;
                          applyBufferDraft();
                          return;
                        }
                        if (!slotValidation.isValid) return;
                        if (isBookingSubScreen) return;
                        if (
                          slotBookingScreen === "non-mollure-individual" ||
                          slotBookingScreen === "non-mollure-company"
                        ) {
                          setAddClientSource("non-mollure");
                          setSelectedClient({
                            name:
                              `${nonMollureDraft.firstName} ${nonMollureDraft.lastName}`.trim() ||
                              nonMollureDraft.legalName.trim() ||
                              "Client",
                            email: nonMollureDraft.email.trim(),
                            mollureUserId: null,
                            clientKind:
                              slotBookingScreen === "non-mollure-company"
                                ? "company"
                                : "individual",
                          });
                          setBookingPhoneDraft({
                            phoneCode: nonMollureDraft.phoneCode,
                            phoneNumber: nonMollureDraft.phoneNumber,
                          });
                          setSlotClientAdded(true);
                          showSnackbar({
                            severity: "success",
                            message: "Client details saved.",
                          });
                          setSlotBookingScreen("new-booking");
                          setSlotSaveAttempted(false);
                          return;
                        }
                        if (slotBookingScreen === "guest") {
                          setAddClientSource("guest");
                          setSelectedClient({
                            name:
                              `${guestDraft.firstName} ${guestDraft.lastName}`.trim() ||
                              "Guest",
                            email: "",
                            mollureUserId: null,
                            clientKind: "individual",
                          });
                          setBookingPhoneDraft({
                            phoneCode: guestDraft.phoneCode,
                            phoneNumber: guestDraft.phoneNumber,
                          });
                          setSlotClientAdded(true);
                          showSnackbar({
                            severity: "success",
                            message: "Guest added.",
                          });
                          setSlotBookingScreen("new-booking");
                          setSlotSaveAttempted(false);
                          return;
                        }
                        if (!selectedSlot) return;
                        void persistBookingFromDrawer().then((saved) => {
                          if (saved) closeBookingDrawer();
                        });
                      }}
                      sx={{
                        height: 38,
                        minWidth: 110,
                      }}
                    >
                      {drawerPrimaryActionLabel}
                    </AppButton>
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
                  borderBottom: `1px solid ${alpha(m.navy, 0.1)}`,
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
                        color: active
                          ? m.teal
                          : disabled
                            ? alpha(m.navy, 0.32)
                            : alpha(m.navy, 0.55),
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
                    onToggle={(service) =>
                      toggleServiceSelectionDraft(service.id)
                    }
                    onEdit={(service) => openEditService(service)}
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "edit-service" ? (
                  <BookingEditServiceScreen
                    draft={serviceEditDraft}
                    staffOptions={data.resources.map((resource) => {
                      const bookedRatio =
                        selectedSlot?.date != null
                          ? getDailyBookingRatio(
                              resource.id,
                              selectedSlot.date,
                            )
                          : 0;
                      return {
                        id: resource.id,
                        name: resource.name,
                        avatarText: resource.avatarText,
                        availabilityPercent: Math.round(
                          (1 - bookedRatio) * 100,
                        ),
                      };
                    })}
                    errors={serviceEditErrors}
                    onChange={(patch) =>
                      setServiceEditDraft((prev) => ({ ...prev, ...patch }))
                    }
                    disabled={isViewingExisting}
                    showStartTime={allowDrawerTimeSelection}
                    startTimeSlots={
                      allowDrawerTimeSelection
                        ? editServiceStartTimeSlots
                        : undefined
                    }
                    showStaffAssign={!editServiceStaffLocked}
                  />
                ) : slotBookingScreen === "select-products" ? (
                  <BookingSelectProductsScreen
                    draft={productSelectionDraft}
                    catalog={productCatalog}
                    customProducts={mergedCustomBookingProducts}
                    onToggle={(product) =>
                      toggleProductSelectionDraft(product.id)
                    }
                    onQuantityChange={adjustProductQuantityDraft}
                    onAddProduct={
                      isViewingExisting
                        ? undefined
                        : () => openAddUniqueItem("products")
                    }
                    onEdit={
                      isViewingExisting ? undefined : openEditCatalogProduct
                    }
                    onDelete={
                      isViewingExisting
                        ? undefined
                        : (product) => setPendingCatalogDelete(product)
                    }
                    disabled={isViewingExisting}
                  />
                ) : slotBookingScreen === "add-unique-item" ? (
                  editingCatalogProductId ? (
                    <BookingEditCatalogItemScreen
                      draft={uniqueItemDraft}
                      errors={{
                        productName: slotErrors.uniqueItemProductName,
                        price: slotErrors.uniqueItemPrice,
                      }}
                      heading="Edit Product"
                      onChange={(patch) =>
                        setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
                      }
                      disabled={isViewingExisting}
                    />
                  ) : (
                    <BookingAddUniqueItemScreen
                      draft={uniqueItemDraft}
                      errors={{
                        productName: slotErrors.uniqueItemProductName,
                        price: slotErrors.uniqueItemPrice,
                      }}
                      heading={
                        uniqueItemOrigin === "products"
                          ? "Add Product"
                          : "Add Unique Item"
                      }
                      namePlaceholder={
                        uniqueItemOrigin === "products"
                          ? "Product Name"
                          : "Unique Name"
                      }
                      onChange={(patch) =>
                        setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
                      }
                      disabled={isViewingExisting}
                    />
                  )
                ) : slotBookingScreen === "add-buffer" ? (
                  <Stack spacing={1.5} sx={{ px: 0.25 }}>
                    <AppTextField
                      label="Title"
                      placeholder="Enter title"
                      value={bufferDraft.title}
                      onChange={(e) =>
                        setBufferDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      fullWidth
                      disabled={isViewingExisting}
                      error={Boolean(slotErrors.bufferTitle)}
                      helperText={slotErrors.bufferTitle}
                    />
                    <AppDropdown
                      label="Team Member"
                      placeholder="Select team member"
                      value={bufferDraft.teamMemberId}
                      onChange={(value) =>
                        setBufferDraft((prev) => ({
                          ...prev,
                          teamMemberId: String(value ?? ""),
                        }))
                      }
                      options={[
                        { label: "Select team member", value: "" },
                        ...data.resources.map((resource) => ({
                          label: resource.name,
                          value: resource.id,
                        })),
                      ]}
                      fullWidth
                      disabled={isViewingExisting}
                    />
                    <AppTextField
                      label="Duration"
                      placeholder="45"
                      value={bufferDraft.durationMins}
                      onChange={(e) =>
                        setBufferDraft((prev) => ({
                          ...prev,
                          durationMins: sanitizeDigitsInput(e.target.value),
                        }))
                      }
                      fullWidth
                      disabled={isViewingExisting}
                      error={Boolean(slotErrors.bufferDuration)}
                      helperText={slotErrors.bufferDuration}
                      inputProps={{ inputMode: "numeric" }}
                    />
                    <AppTextField
                      label="End Time"
                      placeholder="HH:MM"
                      value={bufferDraft.endTime}
                      onChange={(e) =>
                        setBufferDraft((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      fullWidth
                      disabled={isViewingExisting}
                    />
                  </Stack>
                ) : slotBookingScreen === "add-client-choice" ? (
                  <Stack spacing={1.6}>
                    <BodyText
                      sx={{
                        fontWeight: 900,
                        color: alpha(m.navy, 0.88),
                        fontSize: 15,
                      }}
                    >
                      Add Client
                    </BodyText>

                    {(
                      [
                        {
                          label: "Add from client list",
                          key: "client-list" as const,
                        },
                        {
                          label: "Add from Mollure platform",
                          key: "mollure-platform" as const,
                        },
                        {
                          label: "Add Non-Mollure Client",
                          key: "non-mollure" as const,
                        },
                        { label: "Add Guest", key: "guest" as const },
                      ] as const
                    ).map((item) => (
                      <React.Fragment key={item.key}>
                        <ButtonBase
                          onClick={() => {
                            if (
                              item.key === "client-list" ||
                              item.key === "mollure-platform"
                            ) {
                              setAddClientSource((p) =>
                                p === item.key ? "" : item.key,
                              );
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
                            transition:
                              "border-color 0.15s, background-color 0.15s",
                            "&:hover": {
                              bgcolor: alpha(m.navy, 0.02),
                              borderColor: m.teal,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "999px",
                              bgcolor: m.addSoftBg,
                              color: m.addSoftFg,
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

                        {item.key === "client-list" &&
                        addClientSource === "client-list" ? (
                          <AppDropdown
                            label="Client"
                            value={clientListSelectedEmail}
                            onChange={(val) => {
                              if (isViewingExisting) return;
                              const email = String(val);
                              setClientListSelectedEmail(email);
                              const c = clientList.find(
                                (x) => x.email === email,
                              );
                              if (!c) return;
                              setSelectedClient({
                                name: c.name,
                                email: c.email,
                                mollureUserId: c.mollureUserId ?? null,
                                clientKind: c.clientKind,
                              });
                              setBookingPhoneDraft(
                                phoneDraftFromStoredContact(
                                  c.phone,
                                  c.countryCode,
                                ),
                              );
                              setAddClientSource("client-list");
                              setSlotClientAdded(true);
                              setSlotBookingScreen("new-booking");
                            }}
                            options={clientList.map((c) => ({
                              label: c.name,
                              value: c.email,
                            }))}
                            fullWidth
                            placeholder="Search based on name"
                            searchable
                            searchPlaceholder="Search based on name"
                            disabled={isViewingExisting}
                          />
                        ) : null}

                        {item.key === "mollure-platform" &&
                        addClientSource === "mollure-platform" ? (
                          <Stack spacing={1}>
                            <AppSearchField
                              fullWidth
                              placeholder="Search based on email"
                              value={platformEmailInput}
                              onChange={(e) =>
                                setPlatformEmailInput(e.target.value)
                              }
                              onClear={() => setPlatformEmailInput("")}
                              disabled={isViewingExisting}
                            />
                            {platformEmailMatch ? (
                              <ButtonBase
                                onClick={() => {
                                  if (isViewingExisting) return;
                                  setSelectedClient({
                                    name: platformEmailMatch.name,
                                    email: platformEmailMatch.email,
                                    mollureUserId: platformEmailMatch.id ?? "platform",
                                    clientKind:
                                      platformEmailMatch.userType === "company" ||
                                      clientList.find(
                                        (x) =>
                                          x.email.toLowerCase() ===
                                            platformEmailMatch.email.toLowerCase() ||
                                          (platformEmailMatch.id &&
                                            x.mollureUserId ===
                                              platformEmailMatch.id),
                                      )?.clientKind === "company"
                                        ? "company"
                                        : "individual",
                                  });
                                  {
                                    const listed = clientList.find(
                                      (x) =>
                                        x.email.toLowerCase() ===
                                          platformEmailMatch.email.toLowerCase() ||
                                        (platformEmailMatch.id &&
                                          x.mollureUserId ===
                                            platformEmailMatch.id),
                                    );
                                    setBookingPhoneDraft(
                                      phoneDraftFromStoredContact(
                                        platformEmailMatch.phone ||
                                          listed?.phone,
                                        platformEmailMatch.countryCode ||
                                          listed?.countryCode,
                                      ),
                                    );
                                  }
                                  setAddClientSource("mollure-platform");
                                  setSlotClientAdded(true);
                                  setPlatformEmailInput("");
                                  setSlotBookingScreen("new-booking");
                                }}
                                sx={{
                                  width: "100%",
                                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                                  borderRadius: "10px",
                                  px: 1.5,
                                  py: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.25,
                                  bgcolor: "#fff",
                                  textAlign: "left",
                                  "&:hover": {
                                    bgcolor: alpha(m.teal, 0.04),
                                    borderColor: m.teal,
                                  },
                                }}
                              >
                                <Avatar
                                  sx={{ width: 32, height: 32, fontSize: 14 }}
                                >
                                  {platformEmailMatch.name
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <BodyText
                                    sx={{
                                      fontSize: 12.5,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.78),
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {platformEmailMatch.name}
                                  </BodyText>
                                  <BodyText
                                    sx={{
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      color: alpha(m.navy, 0.46),
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {platformEmailMatch.email}
                                  </BodyText>
                                </Box>
                              </ButtonBase>
                            ) : platformLookupStatus === "loading" ? (
                              <BodyText
                                sx={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: alpha(m.navy, 0.46),
                                }}
                              >
                                Searching Mollure clients…
                              </BodyText>
                            ) : platformLookupStatus === "not_found" ? (
                              <BodyText
                                sx={{
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  color: theme.palette.error.main,
                                }}
                              >
                                User is not a Mollure client
                              </BodyText>
                            ) : null}
                          </Stack>
                        ) : null}
                      </React.Fragment>
                    ))}

                    <Box sx={{ flex: 1, minHeight: 360 }} />
                  </Stack>
                ) : slotBookingScreen === "non-mollure-individual" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                          fontSize: 22,
                          letterSpacing: "-0.01em",
                        }}
                      >
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
                      <AppDropdown
                        label="Client Type"
                        value={nonMollureClientType || "individual"}
                        onChange={(val) => {
                          const next = val as "individual" | "company";
                          setNonMollureClientType(next);
                          setSlotBookingScreen(
                            next === "individual"
                              ? "non-mollure-individual"
                              : "non-mollure-company",
                          );
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
                      label="First Name"
                      placeholder="Enter first name"
                      value={nonMollureDraft.firstName}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          firstName: sanitizeNameInput(e.target.value),
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureFirstName)}
                      helperText={slotErrors.nonMollureFirstName}
                    />
                    <AppTextField
                      label="Last Name"
                      placeholder="Enter last name"
                      value={nonMollureDraft.lastName}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          lastName: sanitizeNameInput(e.target.value),
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureLastName)}
                      helperText={slotErrors.nonMollureLastName}
                    />

                    <AppDropdown
                      label="Gender"
                      value={nonMollureDraft.gender}
                      onChange={(val) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          gender: val as any,
                        }))
                      }
                      options={[...GENDER_OPTIONS]}
                      fullWidth
                      placeholder="Select Gender"
                      error={Boolean(slotErrors.nonMollureGender)}
                      helperText={slotErrors.nonMollureGender}
                    />

                    <Box>
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.65),
                          mb: 0.75,
                        }}
                      >
                        Date of Birth
                      </BodyText>
                      <AppDatePicker
                        value={nonMollureDraft.dob}
                        onChange={(iso) =>
                          setNonMollureDraft((p) => ({ ...p, dob: iso }))
                        }
                        max={todayIso}
                        fullWidth
                      />
                      {slotErrors.nonMollureDob ? (
                        <BodyText
                          sx={{
                            mt: 0.5,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: theme.palette.error.main,
                          }}
                        >
                          {slotErrors.nonMollureDob}
                        </BodyText>
                      ) : null}
                    </Box>

                    <AppCountryPhoneFields
                      countryCode={nonMollureDraft.phoneCode}
                      phone={nonMollureDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          phoneCode: dialCode,
                        }))
                      }
                      onPhoneChange={(phone) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          phoneNumber: phone,
                        }))
                      }
                      countryCodeError={slotErrors.nonMollurePhoneCode}
                      phoneError={slotErrors.nonMollurePhoneNumber}
                      phonePlaceholder="+442xxxxxxxxxx"
                    />

                    <AppTextField
                      label="Email Address"
                      placeholder="Enter email address"
                      value={nonMollureDraft.email}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureEmail)}
                      helperText={slotErrors.nonMollureEmail}
                    />

                    <Box sx={{ flex: 1, minHeight: 140 }} />
                  </Stack>
                ) : slotBookingScreen === "non-mollure-company" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                          fontSize: 22,
                          letterSpacing: "-0.01em",
                        }}
                      >
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
                      <AppDropdown
                        label="Client Type"
                        value={nonMollureClientType || "company"}
                        onChange={(val) => {
                          const next = val as "individual" | "company";
                          setNonMollureClientType(next);
                          setSlotBookingScreen(
                            next === "individual"
                              ? "non-mollure-individual"
                              : "non-mollure-company",
                          );
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
                      label="Legal Name"
                      placeholder="Enter legal name"
                      value={nonMollureDraft.legalName}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          legalName: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureLegalName)}
                      helperText={slotErrors.nonMollureLegalName}
                    />
                    <AppTextField
                      label="COC"
                      placeholder="Enter COC"
                      value={nonMollureDraft.coc}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          coc: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureCoc)}
                      helperText={slotErrors.nonMollureCoc}
                    />
                    <AppTextField
                      label="VAT"
                      placeholder="Enter VAT"
                      value={nonMollureDraft.vat}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          vat: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureVat)}
                      helperText={slotErrors.nonMollureVat}
                    />

                    <AppTextField
                      label="Contact Person’s First Name"
                      placeholder="Enter first name"
                      value={nonMollureDraft.contactFirstName}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          contactFirstName: sanitizeNameInput(e.target.value),
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureContactFirstName)}
                      helperText={slotErrors.nonMollureContactFirstName}
                    />
                    <AppTextField
                      label="Contact Person’s Last Name"
                      placeholder="Enter last name"
                      value={nonMollureDraft.contactLastName}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          contactLastName: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureContactLastName)}
                      helperText={slotErrors.nonMollureContactLastName}
                    />

                    <AppDropdown
                      label="Gender"
                      value={nonMollureDraft.gender}
                      onChange={(val) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          gender: val as any,
                        }))
                      }
                      options={[...GENDER_OPTIONS]}
                      fullWidth
                      placeholder="Select Gender"
                      error={Boolean(slotErrors.nonMollureGender)}
                      helperText={slotErrors.nonMollureGender}
                    />

                    <Box sx={{ pt: 0.5 }}>
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.65),
                          mb: 0.75,
                        }}
                      >
                        Business Address
                      </BodyText>
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1.25}>
                          <AppTextField
                            label="Street"
                            placeholder="Enter street"
                            value={nonMollureDraft.street}
                            onChange={(e) =>
                              setNonMollureDraft((p) => ({
                                ...p,
                                street: e.target.value,
                              }))
                            }
                            fullWidth
                            error={Boolean(slotErrors.nonMollureStreet)}
                            helperText={slotErrors.nonMollureStreet}
                          />
                          <AppTextField
                            label="Number"
                            placeholder="Enter number"
                            value={nonMollureDraft.streetNumber}
                            onChange={(e) =>
                              setNonMollureDraft((p) => ({
                                ...p,
                                streetNumber: e.target.value,
                              }))
                            }
                            fullWidth
                            error={Boolean(slotErrors.nonMollureStreetNumber)}
                            helperText={slotErrors.nonMollureStreetNumber}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.25}>
                          <AppTextField
                            label="Postal Code"
                            placeholder="Enter postal code"
                            value={nonMollureDraft.postalCode}
                            onChange={(e) =>
                              setNonMollureDraft((p) => ({
                                ...p,
                                postalCode: e.target.value,
                              }))
                            }
                            fullWidth
                            error={Boolean(slotErrors.nonMollurePostalCode)}
                            helperText={slotErrors.nonMollurePostalCode}
                          />
                          <AppDropdown
                            label="Province"
                            value={nonMollureDraft.province}
                            onChange={(val) =>
                              setNonMollureDraft((p) => ({
                                ...p,
                                province: val as string,
                              }))
                            }
                            options={[
                              { label: "Province", value: "" },
                              { label: "Province A", value: "province-a" },
                              { label: "Province B", value: "province-b" },
                            ]}
                            fullWidth
                            placeholder="Select province"
                            error={Boolean(slotErrors.nonMollureProvince)}
                            helperText={slotErrors.nonMollureProvince}
                          />
                        </Stack>
                        <AppDropdown
                          label="Municipality"
                          value={nonMollureDraft.municipality}
                          onChange={(val) =>
                            setNonMollureDraft((p) => ({
                              ...p,
                              municipality: val as string,
                            }))
                          }
                          options={[
                            { label: "Municipality", value: "" },
                            {
                              label: "Municipality A",
                              value: "municipality-a",
                            },
                            {
                              label: "Municipality B",
                              value: "municipality-b",
                            },
                          ]}
                          fullWidth
                          placeholder="Select municipality"
                          error={Boolean(slotErrors.nonMollureMunicipality)}
                          helperText={slotErrors.nonMollureMunicipality}
                        />
                      </Stack>
                    </Box>

                    <AppCountryPhoneFields
                      countryCode={nonMollureDraft.phoneCode}
                      phone={nonMollureDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          phoneCode: dialCode,
                        }))
                      }
                      onPhoneChange={(phone) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          phoneNumber: phone,
                        }))
                      }
                      countryCodeError={slotErrors.nonMollurePhoneCode}
                      phoneError={slotErrors.nonMollurePhoneNumber}
                      phonePlaceholder="+442xxxxxxxxxx"
                    />

                    <AppTextField
                      label="Email Address"
                      placeholder="Enter email address"
                      value={nonMollureDraft.email}
                      onChange={(e) =>
                        setNonMollureDraft((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      fullWidth
                      error={Boolean(slotErrors.nonMollureEmail)}
                      helperText={slotErrors.nonMollureEmail}
                    />

                    <Box sx={{ flex: 1, minHeight: 140 }} />
                  </Stack>
                ) : slotBookingScreen === "guest" ? (
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                          fontSize: 22,
                          letterSpacing: "-0.01em",
                        }}
                      >
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
                        label="First Name"
                        placeholder="Enter first name"
                        value={guestDraft.firstName}
                        onChange={(e) =>
                          setGuestDraft((p) => ({
                            ...p,
                            firstName: sanitizeNameInput(e.target.value),
                          }))
                        }
                        fullWidth
                        error={Boolean(slotErrors.guestFirstName)}
                        helperText={slotErrors.guestFirstName}
                      />
                      <AppTextField
                        label="Last Name"
                        placeholder="Enter last name"
                        value={guestDraft.lastName}
                        onChange={(e) =>
                          setGuestDraft((p) => ({
                            ...p,
                            lastName: sanitizeNameInput(e.target.value),
                          }))
                        }
                        fullWidth
                        error={Boolean(slotErrors.guestLastName)}
                        helperText={slotErrors.guestLastName}
                      />
                    </Stack>

                    <AppTextField
                      label="Email"
                      placeholder="Email (optional)"
                      value={guestDraft.email}
                      onChange={(e) =>
                        setGuestDraft((p) => ({ ...p, email: e.target.value }))
                      }
                      fullWidth
                    />

                    <AppCountryPhoneFields
                      countryCode={guestDraft.phoneCode}
                      phone={guestDraft.phoneNumber}
                      onCountryCodeChange={(dialCode) =>
                        setGuestDraft((p) => ({ ...p, phoneCode: dialCode }))
                      }
                      onPhoneChange={(phone) =>
                        setGuestDraft((p) => ({ ...p, phoneNumber: phone }))
                      }
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
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <BodyText
                            sx={{
                              fontWeight: 900,
                              color: alpha(m.navy, 0.88),
                              fontSize: 16,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            Booking Details
                          </BodyText>
                          {viewingBookingEvent &&
                          showProfessionalActionMenu(viewingBookingEvent) ? (
                            <>
                              <AppButton
                                onClick={(e) =>
                                  setBookingActionAnchor(e.currentTarget)
                                }
                                endIcon={
                                  <KeyboardArrowDownRoundedIcon
                                    sx={{ fontSize: 18 }}
                                  />
                                }
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
                              </AppButton>
                              <Menu
                                anchorEl={bookingActionAnchor}
                                open={Boolean(bookingActionAnchor)}
                                onClose={() => setBookingActionAnchor(null)}
                                anchorOrigin={{
                                  vertical: "bottom",
                                  horizontal: "right",
                                }}
                                transformOrigin={{
                                  vertical: "top",
                                  horizontal: "right",
                                }}
                                slotProps={{
                                  paper: {
                                    sx: {
                                      mt: 0.5,
                                      minWidth: 180,
                                      borderRadius: "12px",
                                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                                      boxShadow:
                                        "0 14px 30px rgba(16, 35, 63, 0.12)",
                                    },
                                  },
                                }}
                              >
                                {(() => {
                                  const refundApplicable = isRefundApplicable({
                                    status: viewingBookingEvent.status,
                                    prepaid:
                                      viewingBookingEvent.details
                                        ?.prepaymentStatus === "confirmed",
                                    prepaymentStatus:
                                      viewingBookingEvent.details
                                        ?.prepaymentStatus,
                                  });
                                  const actions =
                                    resolveProfessionalBookingActions(
                                      viewingBookingEvent,
                                      { refundApplicable },
                                    );
                                  const itemSx = {
                                    fontWeight: 800,
                                    fontSize: 13.5,
                                    color: alpha(m.navy, 0.78),
                                    py: 1.1,
                                  } as const;
                                  const items: React.ReactNode[] = [];
                                  if (actions.edit) {
                                    items.push(
                                      <MenuItem
                                        key="edit"
                                        onClick={() =>
                                          void handleBookingActionSelect("edit")
                                        }
                                        sx={itemSx}
                                      >
                                        Edit Booking
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.cancel) {
                                    items.push(
                                      <MenuItem
                                        key="cancel"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "cancel",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        Cancel Booking
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.in_progress) {
                                    items.push(
                                      <MenuItem
                                        key="in_progress"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "in_progress",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        In Progress
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.no_show) {
                                    items.push(
                                      <MenuItem
                                        key="no_show"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "no_show",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        No Show
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.checkout) {
                                    items.push(
                                      <MenuItem
                                        key="checkout"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "checkout",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        Checkout
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.rebook) {
                                    items.push(
                                      <MenuItem
                                        key="rebook"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "rebook",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        Rebook
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.refund) {
                                    items.push(
                                      <MenuItem
                                        key="refund"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "refund",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          spacing={0.75}
                                        >
                                          <BookingGuidelineIcon
                                            variant="refund_completed"
                                            size={14}
                                          />
                                          <span>Refund</span>
                                        </Stack>
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.ok) {
                                    items.push(
                                      <MenuItem
                                        key="ok"
                                        onClick={() =>
                                          void handleBookingActionSelect("ok")
                                        }
                                        sx={itemSx}
                                      >
                                        OK
                                      </MenuItem>,
                                    );
                                  }
                                  if (actions.delete) {
                                    items.push(
                                      <MenuItem
                                        key="delete"
                                        onClick={() =>
                                          void handleBookingActionSelect(
                                            "delete",
                                          )
                                        }
                                        sx={itemSx}
                                      >
                                        Delete
                                      </MenuItem>,
                                    );
                                  }
                                  return items.flatMap((item, index) =>
                                    index === 0
                                      ? [item]
                                      : [
                                          <Divider
                                            key={`div-${index}`}
                                            sx={{ my: "0 !important" }}
                                          />,
                                          item,
                                        ],
                                  );
                                })()}
                              </Menu>
                            </>
                          ) : null}
                        </Stack>

                        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                          <Box>
                            <BodyText
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.65),
                                mb: 0.75,
                              }}
                            >
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
                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  color: alpha(m.navy, 0.45),
                                }}
                              >
                                {viewingBookingEvent.bookingCode ??
                                  extractBookingId(viewingBookingEvent.id)}
                              </BodyText>
                            </Box>
                          </Box>

                          <Box>
                            <BodyText
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.65),
                                mb: 0.75,
                              }}
                            >
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
                                label={calendarBookingStatusLabel(
                                  viewingBookingEvent,
                                )}
                                sx={{
                                  height: 18,
                                  fontSize: 9,
                                  fontWeight: 800,
                                  border: "1px solid",
                                  "& .MuiChip-label": {
                                    px: 0.7,
                                    py: 0,
                                    lineHeight: 1.2,
                                  },
                                  ...statusChipSx(
                                    viewingBookingEvent.status,
                                    m,
                                  ),
                                }}
                              />
                              {getBookingScenarioIndicators(
                                viewingBookingEvent,
                              )
                                .filter((indicator) => indicator !== "E")
                                .map((indicator) => {
                                const responseIndicators =
                                  resolveBookingResponseIndicators(
                                    viewingBookingEvent,
                                  );
                                const prepayment =
                                  resolveCalendarPrepaymentStatus(
                                    viewingBookingEvent,
                                  );
                                const prepaymentVariant = prepayment
                                  ? toPrepaymentIconVariant(prepayment)
                                  : undefined;
                                const badgeResponses =
                                  indicator === "EBR"
                                    ? responseIndicators
                                    : indicator === "ER"
                                      ? responseIndicators.filter(
                                          (item) => item === "overdue_response",
                                        )
                                      : [];

                                return (
                                  <Tooltip
                                    key={indicator}
                                    title={BOOKING_SCENARIO_LABELS[indicator]}
                                    placement="top"
                                  >
                                    <Chip
                                      size="small"
                                      label={
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          spacing={0.35}
                                        >
                                          {indicator === "BR" ? (
                                            <BookingRequestBadge
                                              variant="inline"
                                              iconSize={12}
                                              state={resolveBookingRequestBadgeState(
                                                viewingBookingEvent,
                                              )}
                                              direction={resolveProfessionalBookingRequestDirection(
                                                viewingBookingEvent,
                                              )}
                                            />
                                          ) : (
                                            <span>
                                              {scenarioIndicatorDisplayLabel(
                                                indicator,
                                              )}
                                            </span>
                                          )}
                                          {badgeResponses.map((item) => (
                                            <Tooltip
                                              key={item}
                                              title={
                                                BOOKING_INDICATOR_LABELS[item]
                                              }
                                              placement="top"
                                            >
                                              <Box
                                                sx={{
                                                  display: "grid",
                                                  placeItems: "center",
                                                  lineHeight: 0,
                                                }}
                                              >
                                                <BookingIndicatorIcon
                                                  variant={item}
                                                  size={18}
                                                />
                                              </Box>
                                            </Tooltip>
                                          ))}
                                          {indicator === "ER" ? (
                                            resolveProfessionalBookingRequestDirection(
                                              viewingBookingEvent,
                                            ) === "incoming" ? (
                                              <BookingRequestReceivedIcon
                                                size={12}
                                              />
                                            ) : (
                                              <BookingRequestSentIcon
                                                size={12}
                                              />
                                            )
                                          ) : null}
                                          {indicator === "EBR" &&
                                          prepaymentVariant &&
                                          prepaymentVariant !== "pending" ? (
                                            <PrepaymentStatusIcon
                                              variant={prepaymentVariant}
                                              size={18}
                                            />
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
                                const scenarioIndicators =
                                  getBookingScenarioIndicators(
                                    viewingBookingEvent,
                                  );
                                const responseIndicators =
                                  resolveBookingResponseIndicators(
                                    viewingBookingEvent,
                                  );
                                const prepayment =
                                  resolveCalendarPrepaymentStatus(
                                    viewingBookingEvent,
                                  );
                                const hasBr = scenarioIndicators.includes("BR");

                                if (scenarioIndicators.length && !hasBr) {
                                  if (
                                    !responseIndicators.includes(
                                      "overdue_response",
                                    )
                                  )
                                    return null;
                                  if (
                                    scenarioIndicators.some(
                                      (indicator) =>
                                        indicator === "ER" || indicator === "E",
                                    )
                                  ) {
                                    return null;
                                  }
                                }

                                const standaloneResponses = hasBr
                                  ? responseIndicators
                                  : scenarioIndicators.length === 0
                                    ? responseIndicators
                                    : [];

                                const standalonePrepayment =
                                  prepayment &&
                                  (scenarioIndicators.length === 0 || hasBr)
                                    ? prepayment
                                    : undefined;

                                const prepaymentAsIndicator =
                                  standalonePrepayment === "pending"
                                    ? ("waiting_for_prepayment" as const)
                                    : standalonePrepayment === "confirmed"
                                      ? ("prepaid" as const)
                                      : standalonePrepayment === "canceled" ||
                                          standalonePrepayment === "invalid"
                                        ? ("refund_pending" as const)
                                        : null;

                                const filteredResponses =
                                  standaloneResponses.filter(
                                    (item) => item !== prepaymentAsIndicator,
                                  );

                                if (
                                  !filteredResponses.length &&
                                  !standalonePrepayment
                                )
                                  return null;

                                return (
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                  >
                                    {filteredResponses.map((item) => (
                                      <Tooltip
                                        key={item}
                                        title={BOOKING_INDICATOR_LABELS[item]}
                                        placement="top"
                                      >
                                        <Box
                                          sx={{
                                            display: "grid",
                                            placeItems: "center",
                                            lineHeight: 0,
                                          }}
                                        >
                                          <BookingIndicatorIcon
                                            variant={item}
                                            size={18}
                                          />
                                        </Box>
                                      </Tooltip>
                                    ))}
                                    {standalonePrepayment ? (
                                      <Tooltip
                                        title={
                                          PREPAYMENT_STATUS_LABELS[
                                            toPrepaymentIconVariant(
                                              standalonePrepayment,
                                            )
                                          ]
                                        }
                                        placement="top"
                                      >
                                        <Box
                                          sx={{
                                            display: "grid",
                                            placeItems: "center",
                                            lineHeight: 0,
                                          }}
                                        >
                                          <PrepaymentStatusIcon
                                            variant={toPrepaymentIconVariant(
                                              standalonePrepayment,
                                            )}
                                            size={18}
                                          />
                                        </Box>
                                      </Tooltip>
                                    ) : null}
                                  </Stack>
                                );
                              })()}
                              {viewingBookingPaymentDue ? (
                                <Tooltip title="Payment due" placement="top">
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 26,
                                      height: 26,
                                      borderRadius: "8px",
                                      bgcolor: alpha(m.navy, 0.04),
                                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                                    }}
                                  >
                                    <PaymentDueIcon size={18} />
                                  </Box>
                                </Tooltip>
                              ) : null}
                            </Box>
                          </Box>

                          {viewingBookingPaymentDue ? (
                            <Box
                              sx={{
                                width: "100%",
                                borderRadius: "12px",
                                px: 1.35,
                                py: 1.05,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                bgcolor: alpha(m.teal, 0.07),
                                border: `1px solid ${alpha(m.teal, 0.22)}`,
                                backgroundImage: `linear-gradient(135deg, ${alpha("#fff", 0.7)} 0%, ${alpha(m.teal, 0.04)} 100%)`,
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.85}
                                sx={{ minWidth: 0 }}
                              >
                                <Box
                                  sx={{
                                    display: "grid",
                                    placeItems: "center",
                                    width: 28,
                                    height: 28,
                                    borderRadius: "9px",
                                    bgcolor: alpha(m.teal, 0.12),
                                    flexShrink: 0,
                                  }}
                                >
                                  <PaymentDueIcon size={18} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <BodyText
                                    sx={{
                                      fontSize: 12.5,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.82),
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {viewingBookingPaymentDue.reissued
                                      ? "Reissue Invoice"
                                      : "Payment Due"}
                                  </BodyText>
                                  <BodyText
                                    sx={{
                                      mt: 0.2,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: alpha(m.navy, 0.5),
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    Due date
                                  </BodyText>
                                </Box>
                              </Stack>
                              <BodyText
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: m.teal,
                                  flexShrink: 0,
                                  letterSpacing: "0.01em",
                                }}
                              >
                                {viewingBookingPaymentDue.dateLabel}
                              </BodyText>
                            </Box>
                          ) : null}
                        </Stack>
                      </Box>
                    ) : (
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                          fontSize: 16,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        New Booking
                      </BodyText>
                    )}

                    {/* Calendar selector */}
                    <Box>
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.65),
                          mb: 0.75,
                        }}
                      >
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
                          bgcolor: isViewingExisting
                            ? alpha(m.navy, 0.02)
                            : "#fff",
                          textAlign: "left",
                          cursor: isViewingExisting ? "default" : "pointer",
                          transition: "border-color 0.15s",
                          "&:hover": {
                            borderColor: isViewingExisting
                              ? alpha(m.navy, 0.14)
                              : m.teal,
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
                            color: slotCalendarOpen
                              ? m.teal
                              : alpha(m.navy, 0.45),
                            transform: slotCalendarOpen
                              ? "rotate(180deg)"
                              : "none",
                            transition: "transform 0.15s",
                            flexShrink: 0,
                          }}
                        />
                      </ButtonBase>

                      {requestedScheduleLabel ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{ mt: 1, px: 0.25 }}
                        >
                          <BodyText
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.72),
                            }}
                          >
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
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
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
                                      color: active
                                        ? "#fff"
                                        : alpha(m.navy, 0.55),
                                      borderRight:
                                        data.supportedLocations[
                                          data.supportedLocations.length - 1
                                        ] !== loc
                                          ? `1px solid ${alpha(m.navy, 0.08)}`
                                          : undefined,
                                    }}
                                  >
                                    {loc === "FL"
                                      ? "Fixed Location"
                                      : "Desired Location"}
                                  </ButtonBase>
                                );
                              })}
                            </Box>

                            <Box sx={{ mt: 0.5 }}>
                              <AppCalendarPanel
                                compact
                                value={selectedSlot?.date ?? defaultDateIso}
                                onChange={(iso) => {
                                  setSelectedSlot((p) =>
                                    p ? { ...p, date: iso } : p,
                                  );
                                  setSlotCalendarTouched(true);
                                }}
                                min={isViewingBooking ? undefined : todayIso}
                              />
                            </Box>

                            {!isViewingExisting && allowDrawerTimeSelection ? (
                              <Box sx={{ mt: 1.5 }}>
                                <BodyText
                                  sx={{
                                    fontSize: 11.5,
                                    fontWeight: 900,
                                    color: alpha(m.navy, 0.55),
                                    mb: 0.85,
                                  }}
                                >
                                  Select time
                                </BodyText>
                                {drawerAvailableTimeSlots.length ? (
                                  <Box
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(4, minmax(0, 1fr))",
                                      gap: 0.75,
                                      maxHeight: 168,
                                      overflowY: "auto",
                                      pr: 0.25,
                                    }}
                                  >
                                    {drawerAvailableTimeSlots.map(
                                      ({ time, disabled }) => {
                                      const active =
                                        !disabled &&
                                        selectedSlot?.start?.slice(0, 5) ===
                                          time;
                                      return (
                                        <ButtonBase
                                          key={time}
                                          disabled={disabled}
                                          onClick={() => {
                                            if (disabled) return;
                                            applyDrawerTimeSlot(time);
                                          }}
                                          sx={{
                                            height: 32,
                                            borderRadius: "8px",
                                            border: `1px solid ${active ? m.teal : alpha(m.navy, 0.12)}`,
                                            bgcolor: active ? m.teal : "#fff",
                                            color: disabled
                                              ? alpha(m.navy, 0.32)
                                              : active
                                                ? "#fff"
                                                : alpha(m.navy, 0.72),
                                            fontSize: 11.5,
                                            fontWeight: 800,
                                            opacity: disabled ? 0.55 : 1,
                                            cursor: disabled
                                              ? "default"
                                              : "pointer",
                                            "&:hover": disabled
                                              ? undefined
                                              : {
                                                  bgcolor: active
                                                    ? m.tealDark
                                                    : alpha(m.teal, 0.08),
                                                  borderColor: m.teal,
                                                },
                                          }}
                                        >
                                          {time}
                                        </ButtonBase>
                                      );
                                    })}
                                  </Box>
                                ) : (
                                  <BodyText
                                    sx={{
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      color: alpha(m.navy, 0.45),
                                    }}
                                  >
                                    No available time slots for this date.
                                  </BodyText>
                                )}
                              </Box>
                            ) : null}
                          </Box>
                        </Paper>
                      ) : null}
                    </Box>

                    {canUseBookingProject ? (
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={bookingProjectEnabled}
                              disabled={isViewingExisting}
                              onChange={(e) =>
                                setBookingProjectEnabled(e.target.checked)
                              }
                              sx={{
                                color: alpha(m.navy, 0.35),
                                "&.Mui-checked": { color: m.teal },
                              }}
                            />
                          }
                          label={
                            <BodyText
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.72),
                              }}
                            >
                              Project
                            </BodyText>
                          }
                        />
                        {bookingProjectEnabled ? (
                          <Box sx={{ mt: 1 }}>
                            <BodyText
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.78),
                                mb: 0.75,
                              }}
                            >
                              Project
                            </BodyText>
                            <BodyText
                              sx={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.62),
                                mb: 0.5,
                              }}
                            >
                              Description
                            </BodyText>
                            <AppTextField
                              placeholder="Create this to provide premium salon booking services"
                              value={bookingProjectDescription}
                              onChange={(e) =>
                                setBookingProjectDescription(e.target.value)
                              }
                              disabled={isViewingExisting}
                              multiline
                              minRows={3}
                              fullWidth
                              sx={{ mb: 1.5 }}
                            />
                            <BodyText
                              sx={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.62),
                                mb: 0.75,
                              }}
                            >
                              Upload
                            </BodyText>
                            <Box
                              component="button"
                              type="button"
                              disabled={isViewingExisting}
                              onClick={() =>
                                projectFileInputRef.current?.click()
                              }
                              sx={{
                                width: "100%",
                                border: `1px dashed ${alpha(m.navy, 0.18)}`,
                                borderRadius: "10px",
                                bgcolor: "#fff",
                                py: 2.5,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.75,
                                cursor: isViewingExisting
                                  ? "default"
                                  : "pointer",
                                mb: 1.25,
                                opacity: isViewingExisting ? 0.6 : 1,
                                "&:hover": isViewingExisting
                                  ? undefined
                                  : {
                                      bgcolor: alpha(m.teal, 0.04),
                                      borderColor: alpha(m.teal, 0.35),
                                    },
                              }}
                            >
                              <FileUploadOutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: alpha(m.navy, 0.35),
                                }}
                              />
                              <BodyText
                                sx={{
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.48),
                                }}
                              >
                                Upload Image &amp; Documents
                              </BodyText>
                            </Box>
                            <input
                              ref={projectFileInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              multiple
                              hidden
                              onChange={handleProjectFilePick}
                            />
                            {bookingProjectUploads.length > 0 ? (
                              <Box>
                                <BodyText
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: alpha(m.navy, 0.62),
                                    mb: 0.75,
                                  }}
                                >
                                  Uploaded
                                </BodyText>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ overflowX: "auto", pb: 0.5 }}
                                >
                                  {bookingProjectUploads.map((img) => (
                                    <Box
                                      key={img.id}
                                      sx={{
                                        flex: "0 0 88px",
                                        minWidth: 88,
                                        position: "relative",
                                      }}
                                    >
                                      {!isViewingExisting ? (
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            deleteProjectUpload(img.id)
                                          }
                                          aria-label={`Remove ${img.name}`}
                                          sx={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            zIndex: 1,
                                            width: 20,
                                            height: 20,
                                            bgcolor: alpha(m.navy, 0.55),
                                            color: "#fff",
                                            "&:hover": {
                                              bgcolor: alpha(m.navy, 0.72),
                                            },
                                          }}
                                        >
                                          <CloseRoundedIcon
                                            sx={{ fontSize: 12 }}
                                          />
                                        </IconButton>
                                      ) : null}
                                      <Box
                                        sx={{
                                          width: 88,
                                          height: 62,
                                          borderRadius: "8px",
                                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                                          overflow: "hidden",
                                          bgcolor: alpha(m.navy, 0.04),
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        {img.previewUrl &&
                                        !img.name
                                          .toLowerCase()
                                          .endsWith(".pdf") ? (
                                          <Box
                                            component="img"
                                            src={
                                              resolveMediaUrl(img.previewUrl) ??
                                              img.previewUrl
                                            }
                                            alt={img.name}
                                            sx={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                              display: "block",
                                            }}
                                          />
                                        ) : (
                                          <BodyText
                                            sx={{
                                              fontSize: 10,
                                              fontWeight: 800,
                                              color: alpha(m.navy, 0.45),
                                            }}
                                          >
                                            PDF
                                          </BodyText>
                                        )}
                                      </Box>
                                      <BodyText
                                        sx={{
                                          mt: 0.4,
                                          fontSize: 9,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.48),
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {img.name}
                                      </BodyText>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            ) : null}
                          </Box>
                        ) : null}
                      </Box>
                    ) : null}

                    {/* Client */}
                    <Box>
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.65),
                          mb: 0.75,
                        }}
                      >
                        Client
                      </BodyText>
                      {slotClientAdded ? (
                        <Box
                          sx={{
                            border: `1px solid ${alpha(m.teal, 0.22)}`,
                            borderRadius: "12px",
                            px: 1.5,
                            py: 1.25,
                            bgcolor: theme.palette.secondary.main,
                          }}
                        >
                          <Stack spacing={1.25}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.25}
                            >
                              <Avatar
                                src="/images/testimonial.webp"
                                sx={{ width: 34, height: 34 }}
                              >
                                {!selectedClient?.name
                                  ? null
                                  : selectedClient.name
                                      .slice(0, 1)
                                      .toUpperCase()}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.75}
                                  sx={{ minWidth: 0 }}
                                >
                                  <BodyText
                                    sx={{
                                      fontSize: 12.5,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.78),
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {selectedClient?.name ?? "Client"}
                                  </BodyText>
                                  {isSelectedCompanyClient ? (
                                    <CompanyClientTag variant="dot" />
                                  ) : null}
                                </Stack>
                                <BodyText
                                  sx={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.46),
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {selectedClient?.email ?? ""}
                                </BodyText>
                              </Box>
                              {isViewingBooking && viewingBookingEvent ? (
                                <Tooltip title="Open chat with client">
                                  <IconButton
                                    size="small"
                                    aria-label="Open messaging"
                                    onClick={() =>
                                      openBookingMessages(viewingBookingEvent)
                                    }
                                    sx={{ color: alpha(m.navy, 0.45), p: 0.5 }}
                                  >
                                    {viewingBookingUnread > 0 ? (
                                      <Badge
                                        badgeContent={
                                          viewingBookingUnread > 9
                                            ? "9+"
                                            : viewingBookingUnread
                                        }
                                        color="error"
                                        sx={{
                                          "& .MuiBadge-badge": {
                                            fontSize: 10,
                                            minWidth: 16,
                                            height: 16,
                                          },
                                        }}
                                      >
                                        <ChatBubbleOutlineRoundedIcon
                                          sx={{ fontSize: 18 }}
                                        />
                                      </Badge>
                                    ) : (
                                      <ChatBubbleOutlineRoundedIcon
                                        sx={{ fontSize: 18 }}
                                      />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                              {showClientRemoveButton ? (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSlotClientAdded(false);
                                    setSelectedClient(null);
                                    setBookingPhoneDraft({
                                      phoneCode: "",
                                      phoneNumber: "",
                                    });
                                  }}
                                  sx={{ color: alpha(m.navy, 0.35) }}
                                  aria-label="Remove client"
                                >
                                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              ) : null}
                            </Stack>

                            <BookingDrawerSelectedItemsSection
                              nested
                              services={selectedServices}
                              products={selectedProducts}
                              uniqueItems={bookingUniqueItems}
                              showRemoveButtons={showLineItemRemoveButton}
                              resolveStaffName={(staffResourceId) =>
                                staffResourceId
                                  ? resourceNameById.get(staffResourceId)
                                  : undefined
                              }
                              resolveServiceEditTag={resolveServiceEditTag}
                              resolveProductEditTag={resolveProductEditTag}
                              onRemoveService={(serviceId) => {
                                setSelectedServices((prev) =>
                                  prev.filter((item) => item.id !== serviceId),
                                );
                                setServiceSelectionDraft((prev) =>
                                  prev.filter((id) => id !== serviceId),
                                );
                              }}
                              onRemoveProduct={(productId) => {
                                setSelectedProducts((prev) =>
                                  prev.filter((item) => item.id !== productId),
                                );
                                setProductSelectionDraft((prev) => {
                                  if (!prev[productId]) return prev;
                                  return {
                                    ...prev,
                                    [productId]: {
                                      ...prev[productId],
                                      selected: false,
                                    },
                                  };
                                });
                              }}
                              onRemoveUniqueItem={(itemId) => {
                                setBookingUniqueItems((prev) =>
                                  prev.filter((item) => item.id !== itemId),
                                );
                              }}
                              onServiceClick={
                                incomingRequestEditMode
                                  ? (service) => {
                                      const catalogService =
                                        selectableServiceCatalog.find(
                                          (item) => item.id === service.id,
                                        ) ??
                                        selectableServiceCatalog.find(
                                          (item) => item.name === service.name,
                                        );
                                      if (catalogService)
                                        openEditService(catalogService);
                                    }
                                  : undefined
                              }
                            />

                            <ButtonBase
                              ref={addMenuButtonRef}
                              disabled={
                                isViewingExisting && !incomingRequestEditMode
                              }
                              onClick={(e) => {
                                const el = e.currentTarget;
                                if (
                                  slotAddMenuAnchor &&
                                  addMenuTarget === "client"
                                ) {
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
                                transition:
                                  "border-color 0.15s, background-color 0.15s",
                                "&:hover": {
                                  bgcolor: isViewingExisting
                                    ? "#fff"
                                    : alpha(m.navy, 0.02),
                                  borderColor: isViewingExisting
                                    ? alpha(m.navy, 0.14)
                                    : m.teal,
                                },
                                "&.Mui-disabled": {
                                  opacity: 0.55,
                                  cursor: "not-allowed",
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.1,
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "999px",
                                    bgcolor: m.addSoftBg,
                                    color: m.addSoftFg,
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
                                  color:
                                    slotAddMenuAnchor &&
                                    addMenuTarget === "client"
                                      ? m.teal
                                      : alpha(m.navy, 0.45),
                                  flexShrink: 0,
                                  transform:
                                    slotAddMenuAnchor &&
                                    addMenuTarget === "client"
                                      ? "rotate(180deg)"
                                      : "none",
                                  transition: "transform 0.15s, color 0.15s",
                                }}
                              />
                            </ButtonBase>
                          </Stack>
                        </Box>
                      ) : (
                        <ButtonBase
                          onClick={() =>
                            setSlotBookingScreen("add-client-choice")
                          }
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
                            transition:
                              "border-color 0.15s, background-color 0.15s",
                            "&:hover": {
                              bgcolor: alpha(m.navy, 0.02),
                              borderColor: m.teal,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "999px",
                              bgcolor: m.addSoftBg,
                              color: m.addSoftFg,
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
                        <BodyText
                          sx={{
                            mt: 0.6,
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: theme.palette.error.main,
                          }}
                        >
                          {slotErrors.bookingClient}
                        </BodyText>
                      ) : null}
                    </Box>

                    {slotClientAdded ? (
                      <>
                        <Popover
                          open={Boolean(slotAddMenuAnchor)}
                          anchorEl={slotAddMenuAnchor}
                          onClose={() => setSlotAddMenuAnchor(null)}
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                          }}
                          transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                          }}
                          slotProps={{
                            paper: {
                              sx: {
                                mt: 0.75,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.1)}`,
                                boxShadow: "0 10px 24px rgba(16, 35, 63, 0.12)",
                                overflow: "hidden",
                                width:
                                  slotAddMenuAnchor?.offsetWidth ??
                                  addMenuButtonRef.current?.offsetWidth ??
                                  220,
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
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.72),
                                  lineHeight: 1,
                                }}
                              >
                                Services
                              </BodyText>
                            </ButtonBase>
                            <Box
                              sx={{
                                height: 1,
                                bgcolor: alpha(m.navy, 0.08),
                                mx: 1,
                              }}
                            />
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
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.72),
                                  lineHeight: 1,
                                }}
                              >
                                Product/Items
                              </BodyText>
                            </ButtonBase>
                            <Box
                              sx={{
                                height: 1,
                                bgcolor: alpha(m.navy, 0.08),
                                mx: 1,
                              }}
                            />
                            <ButtonBase
                              onClick={() => {
                                setSlotAddMenuAnchor(null);
                                openAddUniqueItem("booking");
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
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.72),
                                  lineHeight: 1,
                                }}
                              >
                                Unique Items
                              </BodyText>
                            </ButtonBase>
                          </Stack>
                        </Popover>

                        <BookingDrawerClientSnapshotSection
                          snapshot={
                            viewingBookingEvent?.details?.clientSnapshot ?? null
                          }
                          hiddenPersonIds={bookingGuests.map((guest) => guest.id)}
                        />

                        {bookingGuests.map((guest) => {
                          const participantKind =
                            guest.participantType ?? "guest";
                          const sectionLabel =
                            participantKind === "model"
                              ? "Model"
                              : participantKind === "planning"
                                ? "Planning"
                                : participantKind === "buffer"
                                  ? "Buffer"
                                  : "Guest";
                          return (
                          <Box key={guest.id}>
                            <BodyText
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.65),
                                mb: 0.75,
                              }}
                            >
                              {sectionLabel}
                            </BodyText>
                            <Box
                              sx={{
                                borderRadius: "12px",
                                bgcolor: theme.palette.secondary.main,
                                border: `1px solid ${alpha(m.teal, 0.22)}`,
                                p: 1.5,
                              }}
                            >
                              <Stack spacing={1.25}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1}
                                >
                                  {participantKind === "planning" ? (
                                    <BodyText
                                      sx={{
                                        fontSize: 12.5,
                                        fontWeight: 900,
                                        color: alpha(m.navy, 0.82),
                                      }}
                                    >
                                      Planning
                                    </BodyText>
                                  ) : participantKind === "buffer" ? (
                                    <BodyText
                                      sx={{ fontSize: 12.5, lineHeight: 1.25 }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          color: alpha(m.navy, 0.52),
                                        }}
                                      >
                                        Buffer:{" "}
                                      </Box>
                                      <Box
                                        component="span"
                                        sx={{
                                          fontWeight: 900,
                                          color: alpha(m.navy, 0.82),
                                        }}
                                      >
                                        {guest.name}
                                      </Box>
                                    </BodyText>
                                  ) : (
                                    <BodyText
                                      sx={{ fontSize: 12.5, lineHeight: 1.25 }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          color: alpha(m.navy, 0.52),
                                        }}
                                      >
                                        {sectionLabel}:{" "}
                                      </Box>
                                      <Box
                                        component="span"
                                        sx={{
                                          fontWeight: 900,
                                          color: alpha(m.navy, 0.82),
                                        }}
                                      >
                                        {guest.name}
                                      </Box>
                                    </BodyText>
                                  )}
                                  {showClientRemoveButton ? (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setBookingGuests((prev) =>
                                          prev.filter(
                                            (item) => item.id !== guest.id,
                                          ),
                                        );
                                        if (addMenuTarget === guest.id)
                                          setSlotAddMenuAnchor(null);
                                      }}
                                      sx={{ color: alpha(m.navy, 0.35) }}
                                      aria-label={`Remove ${guest.name}`}
                                    >
                                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  ) : null}
                                </Stack>

                                {participantKind === "planning" ? (
                                  <Box
                                    sx={{
                                      borderRadius: "10px",
                                      bgcolor: "#fff",
                                      p: 1.25,
                                    }}
                                  >
                                    <BodyText
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: alpha(m.navy, 0.62),
                                        mb: 0.5,
                                      }}
                                    >
                                      Activity
                                    </BodyText>
                                    <AppTextField
                                      value={guest.planningActivity ?? ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setBookingGuests((prev) =>
                                          prev.map((item) =>
                                            item.id === guest.id
                                              ? {
                                                  ...item,
                                                  planningActivity: value,
                                                  name: "Planning",
                                                }
                                              : item,
                                          ),
                                        );
                                      }}
                                      placeholder="Photoshoot"
                                      fullWidth
                                      disabled={isViewingExisting}
                                      sx={{ mb: 1.5 }}
                                    />
                                    <BodyText
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: alpha(m.navy, 0.62),
                                        mb: 0.5,
                                      }}
                                    >
                                      Duration
                                    </BodyText>
                                    <AppTextField
                                      value={guest.planningDuration ?? ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setBookingGuests((prev) =>
                                          prev.map((item) =>
                                            item.id === guest.id
                                              ? {
                                                  ...item,
                                                  planningDuration: value,
                                                }
                                              : item,
                                          ),
                                        );
                                      }}
                                      placeholder="45 Mins"
                                      fullWidth
                                      disabled={isViewingExisting}
                                    />
                                  </Box>
                                ) : participantKind === "buffer" ? (
                                  <Stack spacing={0.75}>
                                    {guest.planningDuration ? (
                                      <BodyText
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.62),
                                        }}
                                      >
                                        Duration: {guest.planningDuration}
                                      </BodyText>
                                    ) : null}
                                    {guest.bufferEndTime ? (
                                      <BodyText
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.62),
                                        }}
                                      >
                                        End Time: {guest.bufferEndTime}
                                      </BodyText>
                                    ) : null}
                                  </Stack>
                                ) : (
                                  <>
                                <BookingDrawerSelectedItemsSection
                                  nested
                                  services={guest.services}
                                  products={guest.products}
                                  showRemoveButtons={showLineItemRemoveButton}
                                  resolveServiceEditTag={resolveServiceEditTag}
                                  resolveProductEditTag={resolveProductEditTag}
                                  onRemoveService={(serviceId) => {
                                    setBookingGuests((prev) =>
                                      prev.map((item) =>
                                        item.id === guest.id
                                          ? {
                                              ...item,
                                              services: item.services.filter(
                                                (svc) => svc.id !== serviceId,
                                              ),
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  onRemoveProduct={(productId) => {
                                    setBookingGuests((prev) =>
                                      prev.map((item) =>
                                        item.id === guest.id
                                          ? {
                                              ...item,
                                              products: item.products.filter(
                                                (prd) => prd.id !== productId,
                                              ),
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                />

                                <ButtonBase
                                  disabled={isViewingExisting}
                                  onClick={(e) => {
                                    const el = e.currentTarget;
                                    if (
                                      slotAddMenuAnchor &&
                                      addMenuTarget === guest.id
                                    ) {
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
                                    transition:
                                      "border-color 0.15s, background-color 0.15s",
                                    "&:hover": {
                                      bgcolor: isViewingExisting
                                        ? "#fff"
                                        : alpha(m.navy, 0.02),
                                      borderColor: isViewingExisting
                                        ? alpha(m.navy, 0.14)
                                        : m.teal,
                                    },
                                    "&.Mui-disabled": {
                                      opacity: 0.55,
                                      cursor: "not-allowed",
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.1,
                                      minWidth: 0,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "999px",
                                        bgcolor: m.addSoftBg,
                                        color: m.addSoftFg,
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
                                      color:
                                        slotAddMenuAnchor &&
                                        addMenuTarget === guest.id
                                          ? m.teal
                                          : alpha(m.navy, 0.45),
                                      flexShrink: 0,
                                      transform:
                                        slotAddMenuAnchor &&
                                        addMenuTarget === guest.id
                                          ? "rotate(180deg)"
                                          : "none",
                                      transition:
                                        "transform 0.15s, color 0.15s",
                                    }}
                                  />
                                </ButtonBase>
                                  </>
                                )}
                              </Stack>
                            </Box>
                          </Box>
                          );
                        })}

                        {showInlineGuestField ? (
                          <Box
                            sx={{
                              borderRadius: "12px",
                              bgcolor: alpha(m.navy, 0.025),
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              p: 1.5,
                            }}
                          >
                            <BodyText
                              sx={{
                                fontSize: 13,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.82),
                                mb: 1.25,
                              }}
                            >
                              {inlineGuestParticipantType === "model"
                                ? "Model"
                                : "Guest"}
                            </BodyText>
                            <Stack
                              direction="row"
                              spacing={1.25}
                              sx={{ mb: 1.25 }}
                            >
                              <AppTextField
                                label="First Name"
                                placeholder="Enter first name"
                                value={inlineGuestDraft.firstName}
                                onChange={(e) =>
                                  setInlineGuestDraft((prev) => ({
                                    ...prev,
                                    firstName: sanitizeNameInput(e.target.value),
                                  }))
                                }
                                fullWidth
                                disabled={isViewingExisting}
                              />
                              <AppTextField
                                label="Last Name"
                                placeholder="Enter last name"
                                value={inlineGuestDraft.lastName}
                                onChange={(e) =>
                                  setInlineGuestDraft((prev) => ({
                                    ...prev,
                                    lastName: sanitizeNameInput(e.target.value),
                                  }))
                                }
                                fullWidth
                                disabled={isViewingExisting}
                              />
                            </Stack>
                            <AppButton
                              tone="primary"
                              onClick={addInlineGuest}
                              disabled={isViewingExisting}
                              sx={{
                                height: 38,
                                minWidth: 96,
                              }}
                            >
                              Add
                            </AppButton>
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
                          <BodyText
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 900,
                              color: alpha(m.navy, 0.76),
                              mb: 1,
                            }}
                          >
                            Location
                          </BodyText>
                          {slotLocation === "FL" ? (
                            <Stack direction="row" spacing={4}>
                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.68),
                                }}
                              >
                                Fixed Location
                              </BodyText>
                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.42),
                                }}
                              >
                                {fixedLocationAddress ||
                                  "Fixed location address"}
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
                                    boxShadow:
                                      "0 10px 26px rgba(16, 35, 63, 0.08)",
                                    p: 1.5,
                                    mb: 1.25,
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                  >
                                    <BodyText
                                      sx={{
                                        flex: 1,
                                        fontSize: 13,
                                        fontWeight: 900,
                                        color: alpha(m.navy, 0.82),
                                      }}
                                    >
                                      Kilometer Allowance
                                    </BodyText>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setShowKilometerAllowance(false)
                                      }
                                      sx={{ color: alpha(m.navy, 0.35) }}
                                      aria-label="Remove kilometer allowance"
                                    >
                                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Stack>

                                  <BodyText
                                    sx={{
                                      fontSize: 12.25,
                                      fontWeight: 850,
                                      color: alpha(m.navy, 0.6),
                                      mt: 1,
                                      mb: 0.75,
                                    }}
                                  >
                                    Amount/Per Kilometer
                                  </BodyText>

                                  <Stack direction="row" spacing={1}>
                                    <AppTextField
                                      label="EUR/Km"
                                      placeholder="0"
                                      value={kilometerAllowanceDraft.eurPerKm}
                                      onChange={(e) =>
                                        setKilometerAllowanceDraft((p) => ({
                                          ...p,
                                          eurPerKm: sanitizeDecimalInput(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      fullWidth
                                      inputProps={{ inputMode: "decimal" }}
                                    />
                                    <AppTextField
                                      label="Total Kilometer"
                                      placeholder="0"
                                      value={
                                        kilometerAllowanceDraft.totalKilometer
                                      }
                                      onChange={(e) =>
                                        setKilometerAllowanceDraft((p) => ({
                                          ...p,
                                          totalKilometer: sanitizeDecimalInput(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      fullWidth
                                      inputProps={{ inputMode: "decimal" }}
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
                                    <BodyText
                                      sx={{
                                        fontSize: 12.5,
                                        fontWeight: 850,
                                        color: alpha(m.navy, 0.62),
                                      }}
                                    >
                                      Total Price
                                    </BodyText>
                                    <BodyText
                                      sx={{
                                        fontSize: 18,
                                        fontWeight: 950,
                                        color: alpha(m.navy, 0.84),
                                      }}
                                    >
                                      20€
                                    </BodyText>
                                  </Box>
                                </Box>
                              ) : null}

                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.68),
                                  mb: 1,
                                }}
                              >
                                Visit Address
                              </BodyText>
                              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <AppTextField
                                  label="Street"
                                  placeholder="Enter street"
                                  value={desiredLocationDraft.street}
                                  onChange={(e) =>
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      street: e.target.value,
                                    }))
                                  }
                                  disabled={isViewingExisting}
                                  fullWidth
                                />
                                <AppTextField
                                  label="Number"
                                  placeholder="Enter number"
                                  value={desiredLocationDraft.number}
                                  onChange={(e) =>
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      number: e.target.value,
                                    }))
                                  }
                                  disabled={isViewingExisting}
                                  fullWidth
                                />
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                <AppTextField
                                  label="Postal Code"
                                  placeholder="Enter postal code"
                                  value={desiredLocationDraft.postalCode}
                                  onChange={(e) =>
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      postalCode: e.target.value,
                                    }))
                                  }
                                  disabled={isViewingExisting}
                                  fullWidth
                                />
                                {isViewingExisting ? (
                                  <>
                                    <AppTextField
                                      label="Province"
                                      value={desiredLocationDraft.province}
                                      disabled
                                      fullWidth
                                    />
                                    <AppTextField
                                      label="Municipality"
                                      value={desiredLocationDraft.municipality}
                                      disabled
                                      fullWidth
                                    />
                                  </>
                                ) : (
                                  <>
                                <AppDropdown
                                  label="Province"
                                  value={desiredLocationDraft.province}
                                  onChange={(val) =>
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      province: val as string,
                                    }))
                                  }
                                  options={[
                                    { label: "Province", value: "" },
                                    ...(desiredLocationDraft.province
                                      ? [
                                          {
                                            label: desiredLocationDraft.province,
                                            value: desiredLocationDraft.province,
                                          },
                                        ]
                                      : []),
                                    {
                                      label: "Province 1",
                                      value: "Province 1",
                                    },
                                    {
                                      label: "Province 2",
                                      value: "Province 2",
                                    },
                                  ]}
                                  fullWidth
                                  placeholder="Select province"
                                />
                                <AppDropdown
                                  label="Municipality"
                                  value={desiredLocationDraft.municipality}
                                  onChange={(val) =>
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      municipality: val as string,
                                    }))
                                  }
                                  options={[
                                    { label: "Municipality", value: "" },
                                    ...(desiredLocationDraft.municipality
                                      ? [
                                          {
                                            label:
                                              desiredLocationDraft.municipality,
                                            value:
                                              desiredLocationDraft.municipality,
                                          },
                                        ]
                                      : []),
                                    {
                                      label: "Municipality 1",
                                      value: "Municipality 1",
                                    },
                                    {
                                      label: "Municipality 2",
                                      value: "Municipality 2",
                                    },
                                  ]}
                                  fullWidth
                                  placeholder="Select municipality"
                                />
                                  </>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Box>

                        <AppCountryPhoneFields
                          countryCode={bookingPhoneDraft.phoneCode}
                          phone={bookingPhoneDraft.phoneNumber}
                          onCountryCodeChange={(dialCode) =>
                            setBookingPhoneDraft((p) => ({
                              ...p,
                              phoneCode: dialCode,
                            }))
                          }
                          onPhoneChange={(phone) =>
                            setBookingPhoneDraft((p) => ({
                              ...p,
                              phoneNumber: phone,
                            }))
                          }
                          countryCodeError={slotErrors.bookingPhoneCode}
                          phoneError={slotErrors.bookingPhoneNumber}
                          phonePlaceholder="+442xxxxxxxxxx"
                          required={false}
                          disabled={isViewingExisting}
                        />

                        {isViewingBooking &&
                        canDiscardBookingRequest(viewingBookingEvent) ? (
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
                              transition:
                                "background-color 0.15s, border-color 0.15s",
                              "&:hover": {
                                bgcolor: alpha(m.navy, 0.07),
                                borderColor: alpha(m.navy, 0.18),
                              },
                            }}
                          >
                            <CloseRoundedIcon
                              sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }}
                            />
                            <BodyText
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "inherit",
                              }}
                            >
                              Discard BR
                            </BodyText>
                          </ButtonBase>
                        ) : null}

                        {isViewingBooking &&
                        viewingBookingEvent &&
                        resolveProfessionalBookingActions(viewingBookingEvent)
                          .restart_response ? (
                          <ButtonBase
                            onClick={() => void handleRestartResponseTime()}
                            sx={{
                              width: "100%",
                              borderRadius: "10px",
                              border: `1px solid ${alpha(m.teal, 0.35)}`,
                              bgcolor: alpha(m.teal, 0.06),
                              minHeight: 44,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.75,
                              color: m.tealDark ?? m.teal,
                              transition:
                                "background-color 0.15s, border-color 0.15s",
                              "&:hover": {
                                bgcolor: alpha(m.teal, 0.12),
                                borderColor: m.teal,
                              },
                            }}
                          >
                            <BodyText
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "inherit",
                              }}
                            >
                              Restart response time
                            </BodyText>
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
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <BodyText
                                sx={{
                                  flex: 1,
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: alpha(m.navy, 0.82),
                                }}
                              >
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

                            <BodyText
                              sx={{
                                mt: 0.5,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: alpha(m.navy, 0.48),
                                lineHeight: 1.35,
                              }}
                            >
                              {lateCancelNoticeLabel}
                            </BodyText>

                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.25}
                              sx={{ mt: 1.25 }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                sx={{ minWidth: 52 }}
                              >
                                <BodyText
                                  sx={{
                                    fontSize: 12.5,
                                    fontWeight: 850,
                                    color: alpha(m.navy, 0.62),
                                  }}
                                >
                                  Fee
                                </BodyText>
                                <InfoOutlinedIcon
                                  sx={{ fontSize: 15, color: m.teal }}
                                />
                              </Stack>
                              <AppTextField
                                placeholder="%"
                                value={lateCancellationFeePercent}
                                onChange={(e) =>
                                  setLateCancellationFeePercent(
                                    sanitizeDecimalInput(e.target.value),
                                  )
                                }
                                disabled={isViewingExisting}
                                inputProps={{ inputMode: "decimal" }}
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
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <BodyText
                                sx={{
                                  flex: 1,
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: alpha(m.navy, 0.82),
                                }}
                              >
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

                            <BodyText
                              sx={{
                                mt: 0.5,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: alpha(m.navy, 0.48),
                                lineHeight: 1.35,
                              }}
                            >
                              Fee applies when rescheduling after the allowed
                              notice period
                            </BodyText>

                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.25}
                              sx={{ mt: 1.25 }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                sx={{ minWidth: 52 }}
                              >
                                <BodyText
                                  sx={{
                                    fontSize: 12.5,
                                    fontWeight: 850,
                                    color: alpha(m.navy, 0.62),
                                  }}
                                >
                                  Fee
                                </BodyText>
                                <InfoOutlinedIcon
                                  sx={{ fontSize: 15, color: m.teal }}
                                />
                              </Stack>
                              <AppTextField
                                placeholder="%"
                                value={lateRescheduleFeePercent}
                                onChange={(e) =>
                                  setLateRescheduleFeePercent(
                                    sanitizeDecimalInput(e.target.value),
                                  )
                                }
                                disabled={isViewingExisting}
                                inputProps={{ inputMode: "decimal" }}
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
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <BodyText
                                  sx={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontWeight: 900,
                                    color: alpha(m.navy, 0.82),
                                  }}
                                >
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

                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mt: 1 }}
                              >
                                <BodyText
                                  sx={{
                                    flex: 1,
                                    fontSize: 12.5,
                                    fontWeight: 850,
                                    color: alpha(m.navy, 0.62),
                                  }}
                                >
                                  Prepayment:
                                </BodyText>
                                <AppTextField
                                  placeholder="%"
                                  value={prepaymentPercent}
                                  onChange={(e) =>
                                    setPrepaymentPercent(
                                      sanitizeDecimalInput(e.target.value),
                                    )
                                  }
                                  inputProps={{ inputMode: "decimal" }}
                                  sx={{ maxWidth: 86 }}
                                />
                                <BodyText
                                  sx={{
                                    fontSize: 16,
                                    fontWeight: 950,
                                    color: alpha(m.navy, 0.85),
                                  }}
                                >
                                  €{prepaymentAmount}
                                </BodyText>
                              </Stack>

                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mt: 1 }}
                              >
                                <BodyText
                                  sx={{
                                    flex: 1,
                                    fontSize: 12.5,
                                    fontWeight: 850,
                                    color: alpha(m.navy, 0.55),
                                  }}
                                >
                                  Remaining after prepayment
                                </BodyText>
                                <BodyText
                                  sx={{
                                    fontSize: 16,
                                    fontWeight: 950,
                                    color: alpha(m.navy, 0.85),
                                  }}
                                >
                                  €{remainingAfterPrepayment}
                                </BodyText>
                              </Stack>

                              <Box
                                sx={{
                                  mt: 1.25,
                                  pt: 1.25,
                                  borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                                }}
                              >
                                <BodyText
                                  sx={{
                                    fontSize: 12.5,
                                    fontWeight: 900,
                                    color: alpha(m.navy, 0.78),
                                    mb: 0.75,
                                  }}
                                >
                                  Payment method
                                </BodyText>

                                {[
                                  {
                                    key: "online" as const,
                                    label: "Online Direct",
                                  },
                                  {
                                    key: "offline" as const,
                                    label: "Offline Direct",
                                  },
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
                                        "&:hover": {
                                          bgcolor: alpha(m.navy, 0.03),
                                        },
                                      }}
                                    >
                                      <BodyText
                                        sx={{
                                          fontSize: 12.75,
                                          fontWeight: 850,
                                          color: alpha(m.navy, 0.74),
                                        }}
                                      >
                                        {pm.label}
                                      </BodyText>
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
                                        {active ? (
                                          <Box
                                            sx={{
                                              width: 8,
                                              height: 8,
                                              borderRadius: "999px",
                                              bgcolor: m.teal,
                                            }}
                                          />
                                        ) : null}
                                      </Box>
                                    </ButtonBase>
                                  );
                                })}
                              </Box>
                            </Box>
                          </>
                        ) : null}

                        {incomingClientNote &&
                        incomingClientNote !== (incomingErNote ?? "") ? (
                          <EditRequestIncomingNote
                            note={incomingClientNote}
                            from="client"
                          />
                        ) : null}

                        {showIncomingErActions && incomingErNote ? (
                          <EditRequestIncomingNote
                            note={incomingErNote}
                            from="client"
                          />
                        ) : null}

                        {showIncomingRequestActions || showIncomingErActions ? (
                          <BookingRequestResponseActions
                            onAccept={() => setIncomingConfirmAction("accept")}
                            onSuggestChange={() =>
                              setIncomingConfirmAction("suggest")
                            }
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
                              transition:
                                "background-color 0.15s, border-color 0.15s",
                              "&:hover": {
                                bgcolor: alpha(m.navy, 0.07),
                                borderColor: alpha(m.navy, 0.18),
                              },
                            }}
                          >
                            <CloseRoundedIcon
                              sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }}
                            />
                            <BodyText
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "inherit",
                              }}
                            >
                              Discard EBR
                            </BodyText>
                          </ButtonBase>
                        ) : null}

                        {showInternalNote ? (
                          <Box>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              sx={{ mb: 0.75 }}
                            >
                              <StickyNote2OutlinedIcon
                                sx={{ fontSize: 16, color: m.teal }}
                              />
                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 900,
                                  color: alpha(m.navy, 0.78),
                                }}
                              >
                                Internal Note
                              </BodyText>
                            </Stack>
                            <AppTextField
                              label="Internal Note"
                              placeholder="Enter description"
                              value={bookingInternalNote}
                              onChange={(e) =>
                                setBookingInternalNote(e.target.value)
                              }
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
                            <Box
                              sx={{
                                mt: 1.5,
                                borderTop: `1px solid ${alpha(m.navy, 0.1)}`,
                              }}
                            />
                          </Box>
                        ) : null}

                        {showManualBookingParticipantActions ? (
                        <Box
                          sx={{
                            borderRadius: "10px",
                            bgcolor: alpha(m.navy, 0.025),
                            p: 1.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                          >
                            {slotLocation === "DL" ? (
                              <>
                                <ButtonBase
                                  onClick={(e) => {
                                    if (showInlineGuestField) return;
                                    setDlGuestMenuAnchor(e.currentTarget);
                                  }}
                                  disabled={showInlineGuestField}
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
                                      bgcolor: m.addSoftBg,
                                      color: m.addSoftFg,
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
                                  <KeyboardArrowDownRoundedIcon
                                    sx={{
                                      fontSize: 18,
                                      color: alpha(m.navy, 0.45),
                                    }}
                                  />
                                </ButtonBase>
                                <Menu
                                  anchorEl={dlGuestMenuAnchor}
                                  open={Boolean(dlGuestMenuAnchor)}
                                  onClose={() => setDlGuestMenuAnchor(null)}
                                >
                                  <MenuItem
                                    onClick={() => {
                                      setDlGuestMenuAnchor(null);
                                      setInlineGuestParticipantType("guest");
                                      setShowInlineGuestField(true);
                                    }}
                                  >
                                    Add Guest
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      setDlGuestMenuAnchor(null);
                                      setInlineGuestParticipantType("model");
                                      setShowInlineGuestField(true);
                                    }}
                                  >
                                    Add Model
                                  </MenuItem>
                                </Menu>
                                <ButtonBase
                                  onClick={() => {
                                    addDlParticipant("planning");
                                  }}
                                  sx={{
                                    border: `1px solid ${alpha(m.navy, 0.14)}`,
                                    borderRadius: "10px",
                                    height: 44,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    px: 1.5,
                                    bgcolor: "#fff",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: "999px",
                                      bgcolor: m.addSoftBg,
                                      color: m.addSoftFg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
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
                                    }}
                                  >
                                    Planning
                                  </BodyText>
                                </ButtonBase>
                                <ButtonBase
                                  onClick={() => {
                                    addDlParticipant("buffer");
                                  }}
                                  sx={{
                                    border: `1px solid ${alpha(m.navy, 0.14)}`,
                                    borderRadius: "10px",
                                    height: 44,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    px: 1.5,
                                    bgcolor: "#fff",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: "999px",
                                      bgcolor: m.addSoftBg,
                                      color: m.addSoftFg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
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
                                    }}
                                  >
                                    Add Buffer
                                  </BodyText>
                                </ButtonBase>
                              </>
                            ) : (
                              <ButtonBase
                                onClick={() => {
                                  if (isViewingExisting || showInlineGuestField)
                                    return;
                                  setInlineGuestParticipantType("guest");
                                  setShowInlineGuestField(true);
                                }}
                                disabled={
                                  isViewingExisting || showInlineGuestField
                                }
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
                                  transition:
                                    "border-color 0.15s, background-color 0.15s",
                                  "&:hover": {
                                    bgcolor:
                                      isViewingExisting || showInlineGuestField
                                        ? "#fff"
                                        : alpha(m.navy, 0.02),
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
                                    bgcolor: m.addSoftBg,
                                    color: m.addSoftFg,
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
                            )}
                          </Stack>
                        </Box>
                        ) : null}

                        {isViewingBooking &&
                        (isBookingRequestAccepted(viewingBookingEvent) ||
                          Boolean(viewingBookingEvent?.details?.needsOk)) ? (
                          <BookingRequestAcceptedPanel
                            totalPrice={totalPrice}
                            prepaymentPercent={
                              Number(prepaymentPercent) || undefined
                            }
                            prepaymentAmount={prepaymentAmount}
                            remainingAmount={remainingAfterPrepayment}
                            onOk={handleAcknowledgeAcceptedBr}
                          />
                        ) : (
                          <BookingDrawerTotalPriceCard
                            payableTotal={totalPrice}
                            actualAmount={
                              lineActualAmount + kilometerAllowanceAmount
                            }
                            lineDiscountAmount={lineDiscountAmount}
                            bookingDiscountAmount={bookingDiscountAmount}
                            bookingTotalDiscount={bookingTotalDiscount}
                            lateCancellationFeeAmount={
                              bookingPrice.lateCancellationFeeAmount
                            }
                            lateRescheduleFeeAmount={
                              bookingPrice.lateRescheduleFeeAmount
                            }
                            prepaidApplied={bookingPrice.prepaidApplied}
                          />
                        )}

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
                          [
                            bookingPhoneDraft.phoneCode,
                            bookingPhoneDraft.phoneNumber,
                          ]
                            .filter(Boolean)
                            .join(" ")
                            .trim() ||
                          drawerSalesActivityContext.details?.phoneNumber ||
                          ""
                        }
                        fallbackResourceId={
                          drawerSalesActivityContext.resourceId ||
                          data.resources[0]?.id ||
                          "unassigned"
                        }
                        onBookingCompleted={(bookingId) => {
                          setEvents((prev) =>
                            prev.map((event) => {
                              const parsed = parseApiCalendarEventId(event.id);
                              if (parsed?.kind !== "booking" || parsed.id !== bookingId) {
                                return event;
                              }
                              return {
                                ...event,
                                status: "Completed",
                                details: {
                                  ...(event.details ?? {}),
                                  waitingForPayment: true,
                                },
                              };
                            }),
                          );
                          setSlotStatus("Completed");
                        }}
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
                    <BodyText
                      sx={{ fontSize: 12.5, color: alpha(m.navy, 0.6) }}
                    >
                      Add booking details to view{" "}
                      {slotDrawerTab === "sales" ? "sales" : "activity"}.
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
      </AppDrawer>
      {renderTeamActionPopover()}
      <CalendarFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        appliedFilters={appliedFilters}
        draftFilters={draftFilters}
        initialFilters={initialFilters}
        locations={locations}
        bookingTypes={bookingTypes}
        bookingStatuses={bookingStatuses}
        resources={data.resources}
        setDraftFilters={setDraftFilters}
        onApply={(filters) => {
          setAppliedFilters(filters);
          setFiltersOpen(false);
        }}
      />
      <CalendarBlockTimeModal
        availableLocations={data.supportedLocations}
        draft={blockDraft}
        onApply={async () => {
          if (!blockDraft.teamIds.length || !blockDraft.locations.length) {
            showSnackbar({
              severity: "warning",
              message: "Select team member and location.",
            });
            return;
          }
          const nextBlocks = buildBlocksFromDraft(
            blockDraft,
            blockDraft.teamIds,
          );
          if (!nextBlocks.length) {
            showSnackbar({
              severity: "warning",
              message:
                "No dates matched your selection. Check the date range and day filters.",
            });
            return;
          }

          setBlocks((prev) => {
            const seen = new Set(
              prev.map(
                (block) =>
                  `${block.resourceId}-${block.date}-${block.start}-${block.end}`,
              ),
            );
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
                  title: blockTitleFromDraft(blockDraft) || "Blocked time",
                  blocked_time_start: toDateTimeInput(
                    blockDraft.dateFrom,
                    blockDraft.startTime,
                  ),
                  blocked_time_end: toDateTimeInput(
                    blockDraft.dateTo || blockDraft.dateFrom,
                    blockDraft.endTime,
                  ),
                  start_date: blockDraft.dateFrom,
                  end_date: blockDraft.dateTo || blockDraft.dateFrom,
                  location_type: locationToApi(location),
                  notes:
                    `${blockDraft.dayFrom || ""}${blockDraft.dayTo ? ` - ${blockDraft.dayTo}` : ""}`.trim() ||
                    null,
                });
              }
            }
          } catch {
            showSnackbar({
              severity: "warning",
              message:
                "Blocked time shown on calendar, but it could not be saved to the server.",
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
            if (
              !publicBusinessHoursDraft.locations.length ||
              !publicBusinessHoursDraft.dateFrom ||
              !publicBusinessHoursDraft.dateTo ||
              (publicBusinessHoursDraft.dateFrom ===
                publicBusinessHoursDraft.dateTo &&
                !publicBusinessHoursDraft.day)
            ) {
              showSnackbar({
                severity: "error",
                message:
                  "Select location and a date (single day or full range) before applying.",
              });
              return;
            }
            if (
              publicBusinessHoursDraft.notAvailable &&
              !publicBusinessHoursDraft.note.trim()
            ) {
              showSnackbar({
                severity: "error",
                message:
                  "Note is required when Not Availability is selected.",
              });
              return;
            }
            await persistAvailabilitySettings({
              publicBusinessHours: [
                ...(Array.isArray(
                  calendarSettings?.availability.publicBusinessHours,
                )
                  ? calendarSettings.availability.publicBusinessHours
                  : []),
                ...expandPublicBusinessHoursDraft(publicBusinessHoursDraft),
              ],
            });
            showSnackbar({
              severity: "success",
              message: "Public business hours added.",
            });
            setPublicBusinessHoursOpen(false);
            setPublicBusinessHoursDraft({
              locations: publicBusinessHoursDraft.locations,
              schedule: publicBusinessHoursDraft.schedule,
              day: "",
              dateFrom: "",
              dateTo: "",
              startTime: "08:00",
              endTime: "18:00",
              notAvailable: false,
              note: "",
            });
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to save public business hours.",
            });
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
            // Persist only colours the professional explicitly chose (no defaults).
            const nextDesign: CalendarDesignDraft = {
              ...designDraft,
              colorsByCategory: Object.fromEntries(
                Object.entries(designDraft.colorsByCategory ?? {}).filter(
                  ([, color]) => Boolean(color?.trim()),
                ),
              ),
              colorsByService: Object.fromEntries(
                Object.entries(designDraft.colorsByService ?? {}).filter(
                  ([, color]) => Boolean(color?.trim()),
                ),
              ),
              colorsByStatus: Object.fromEntries(
                Object.entries(designDraft.colorsByStatus ?? {}).filter(
                  ([, color]) => Boolean(color?.trim()),
                ),
              ) as CalendarDesignDraft["colorsByStatus"],
              colorsByTeamMember: Object.fromEntries(
                Object.entries(designDraft.colorsByTeamMember ?? {}).filter(
                  ([, color]) => Boolean(color?.trim()),
                ),
              ),
            };
            setDesignDraft(nextDesign);
            setAppliedDesign(nextDesign);
            await persistAvailabilitySettings({ design: nextDesign });
            showSnackbar({ severity: "success", message: "Design saved." });
            setDesignOpen(false);
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to save design.",
            });
          }
        }}
        draft={designDraft}
        setDraft={setDesignDraft}
        serviceOptions={serviceOptions}
        teamMemberOptions={data.resources.map((resource) => ({
          id: resource.id,
          name: resource.name,
        }))}
      />
      <CalendarServiceOrderModal
        draft={serviceOrderDraft}
        onApply={async () => {
          try {
            await persistAvailabilitySettings({
              serviceOrder: serviceOrderDraft,
            });
            showSnackbar({
              severity: "success",
              message: "Service order saved.",
            });
            setServiceOrderOpen(false);
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to save service order.",
            });
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
              (item) =>
                !(
                  item.resourceId === editAvailabilityDraft.resourceId &&
                  item.date === editAvailabilityDraft.date
                ),
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
          showSnackbar({
            severity: "success",
            message: "Availability updated.",
          });
          setEditAvailabilityOpen(false);
        }}
        onClose={() => setEditAvailabilityOpen(false)}
        open={editAvailabilityOpen}
        resource={data.resources.find(
          (resource) => resource.id === editAvailabilityDraft.resourceId,
        )}
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
      <DiscardBrDialog
        open={discardBrOpen}
        onClose={() => setDiscardBrOpen(false)}
        onConfirm={handleDiscardBr}
      />
      <CatalogItemDeleteDialog
        open={Boolean(pendingCatalogDelete)}
        itemName={pendingCatalogDelete?.name}
        onClose={() => setPendingCatalogDelete(null)}
        onConfirm={confirmDeleteCatalogProduct}
      />
      <DiscardEbrDialog
        open={discardEbrOpen}
        onClose={() => setDiscardEbrOpen(false)}
        onConfirm={handleDiscardEbr}
      />
      <BookingRequestConfirmDialog
        open={Boolean(incomingConfirmAction)}
        action={incomingConfirmAction}
        scenario={viewingBookingEvent?.bookingScenario}
        onClose={() => setIncomingConfirmAction(null)}
        onConfirm={() => {
          if (showIncomingErActions) {
            if (incomingConfirmAction === "accept")
              void handleAcceptConfirmedEr();
            else if (incomingConfirmAction === "reject")
              void handleRejectConfirmedEr();
            else if (incomingConfirmAction === "suggest") {
              handleStartIncomingEdit();
            }
            return;
          }
          if (incomingConfirmAction === "accept")
            void handleAcceptIncomingRequest();
          else if (incomingConfirmAction === "reject")
            void handleRejectIncomingRequest();
          else if (incomingConfirmAction === "suggest")
            handleStartIncomingEdit();
        }}
      />
      <EditRequestNoteDialog
        open={erNoteDialogOpen}
        onClose={() => setErNoteDialogOpen(false)}
        onConfirm={(note) => void handleSendConfirmedEr(note)}
      />
      <CalendarNoShowModal
        open={noShowModalOpen}
        participants={noShowParticipants}
        onClose={() => setNoShowModalOpen(false)}
        onConfirm={(selectedIds) => void handleConfirmNoShow(selectedIds)}
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
