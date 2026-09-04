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
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
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
  InputAdornment,
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
import AppTimePicker, { AppTimePanel } from "../../AppTimePicker";
import AppTextField from "../../AppTextField";
import AppCountryPhoneFields from "../../AppCountryPhoneFields";
import AppDropdown from "../../AppDropdown";
import AppSearchField from "../../AppSearchField";
import CalendarAddMenu from "../CalendarAddMenu";
import CalendarSlotAddMenu, {
  type CalendarSlotAddAction,
} from "../CalendarSlotAddMenu";
import CalendarNoShowModal from "../CalendarNoShowModal";
import CalendarCancelBookingModal from "../CalendarCancelBookingModal";
import CalendarBookingActionConfirmDialog, {
  type CalendarBookingAction,
} from "../CalendarBookingActionConfirmDialog";
import CalendarScheduleConflictDialog from "../CalendarScheduleConflictDialog";
import CalendarBookingCard from "../CalendarBookingCard";
import CalendarTimelineHoverIndicator from "../CalendarTimelineHoverIndicator";
import CalendarTeamMemberBadge from "../CalendarTeamMemberBadge";
import CalendarTeamMemberBookingsPopover from "../CalendarTeamMemberBookingsPopover";
import CalendarTeamMemberProfileDrawer from "../CalendarTeamMemberProfileDrawer";
import CalendarClientNotInListHint from "../CalendarClientNotInListHint";
import ClientDetailsViewPanel from "../../../../app/professionals/fixed-location/client/ClientDetailsViewPanel";
import { useCalendarClientProfile } from "../useCalendarClientProfile";
import {
  canAddIdentityToClientList,
  getAddToClientListDisabledReason,
  identityFromCalendarEvent,
  type CalendarClientIdentity,
} from "../calendarClientProfile";
import {
  collectEventTeamMemberIds,
  eventBelongsToTeamMember,
  eventHasKnownTeamAssignment,
  getTeamMemberBookings,
  isTeamSharedBooking,
  rankResourcesForCalendarDay,
} from "../teamMemberBookings";
import BookingEditedTag from "../BookingEditedTag";
import CalendarBookingTicketStack from "../CalendarBookingTicketStack";
import {
  buildMultiServiceBookingTitle,
  clusterSameStartTimeEvents,
  findExternalStaffBookingOverlaps,
  findInternalStaffServiceOverlaps,
  getClusterTimeBounds,
  type StaffServiceInterval,
} from "../calendar-overlap.utils";
import type { CalendarScheduleConflictKind } from "../CalendarScheduleConflictDialog";
import { useMessagingWidget } from "../../messaging/MessagingWidgetContext";
import { prepareBookingMessagingOpen } from "../../messaging/openBookingMessaging";
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
  cancelledOriginalServicesForDisplay,
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
  createEmptyPublicBusinessHoursDraft,
  draftFromPublicBusinessHoursEntries,
  replacePublicBusinessHoursForLocations,
  type PublicBusinessHoursDraft,
  type PublicBusinessHoursEntry,
} from "../CalendarPublicBusinessHoursModal";
import CalendarFiltersDrawer from "../CalendarFiltersDrawer";
import CalendarSchedulePanel from "../CalendarSchedulePanel";
import CalendarHoursRulesPanel from "../CalendarHoursRulesPanel";
import CalendarEditAvailabilityModal, {
  type EditAvailabilityDraft,
} from "../CalendarEditAvailabilityModal";
import ManualEntryDiscountModal from "../../../sections/finance/ManualEntryDiscountModal";
import {
  parseFinancePrice,
  type ManualEntryDiscount,
} from "../../../sections/finance/manualEntry.data";
import {
  buildBookingPriceSummaryLines,
  computeBookingPrice,
  isUniqueItemId,
  partitionBookingProducts,
  resolveBookingPriceDisplay,
} from "../bookingTotal";
import {
  canAddLateCancellation,
  canAddLateRescheduling,
  canAddNoShowFee,
  canAddPrepayment,
  canCheckoutProtectiveFee,
  clampProtectiveFeePercent,
  parsePolicyPercentCeiling,
} from "../bookingGroupAddOns";
import { isLateCancellation } from "../../client-booking/settleCancellationFee";
import {
  removeFinanceProduct,
  removeFinanceUniqueItem,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "../../../sections/finance/financeCatalogPersist";
import { useFinanceInvoiceSettings } from "../../../sections/finance/useFinanceInvoiceSettings";
import BookingSelectServicesScreen from "../BookingSelectServicesScreen";
import DiscardBrDialog from "../DiscardBrDialog";
import DiscardEbrDialog from "../DiscardEbrDialog";
import DiscardErDialog from "../DiscardErDialog";
import BookingRequestConfirmDialog from "../BookingRequestConfirmDialog";
import BookingRequestResponseActions from "../BookingRequestResponseActions";
import InlineTimedSnackbar from "../../InlineTimedSnackbar";
import BookingDrawerSelectedItemsSection from "../BookingDrawerSelectedItemsSection";
import BookingDrawerClientSnapshotSection from "../BookingDrawerClientSnapshotSection";
import BookingClientTags, {
  bookingClientOptionLabel,
} from "../BookingClientTags";
import BookingActivityOverview from "../BookingActivityOverview";
import { buildBookingActivityTimeline } from "../buildBookingActivityTimeline";
import {
  ACTIVITY_COMPARISON_SIGNPOST,
  findActivityComparisonItem,
} from "../buildActivityComparison";
import type { BookingActivityItem } from "../bookingActivity.types";
import SalesOverview from "../SalesOverview";
import BookingEditServiceScreen from "../BookingEditServiceScreen";
import BookingSelectProductsScreen from "../BookingSelectProductsScreen";
import BookingAddUniqueItemScreen from "../BookingAddUniqueItemScreen";
import BookingEditCatalogItemScreen from "../BookingEditCatalogItemScreen";
import CatalogItemDeleteDialog from "../CatalogItemDeleteDialog";
import { useCalendarFilters } from "../useCalendarFilters";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import { buildOrderedBookingServiceCategories } from "../../../../data/bookingServiceCatalog.data";
import {
  resolveDesiredVisitAddressOptions,
  type BusinessPublicProfileDesiredLocation,
} from "../../../../data/businessPublicProfile.data";
import { isConfiguredColor } from "../../../../lib/calendarDesign.utils";
import type { TemplateCategoryRow } from "../../../../lib/businessTemplateCatalog";
import {
  addMinutesToTime,
  buildBookingServiceLineItem,
  buildServiceEditDraftFromCatalog,
  emptyBookingServiceEditDraft,
  getBookingServiceEditErrors,
  getEffectiveServicePrice,
  getLatestTimedEnd,
  lineItemToOverride,
  minutesBetweenTimes,
  parseDurationMinsLabel,
  formatDurationMinsLabel,
  placeServicesSequentially,
  recalculateGroupedServiceStartEndTimes,
  recalculateServiceStartEndTimes,
  sortServicesByStartTime,
  type BookingServiceEditDraft,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import {
  buildDrawerChronologicalBlocks,
  calendarEventToDisplaySegments,
  expandCalendarEventToChronologicalSegments,
  getBookingTimedSpanMins,
  resolveParentCalendarEventId,
  sortCalendarGuestsByStartTime,
} from "../../../../data/bookingChronologicalBlocks";
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
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import {
  archiveFullyPastScheduleRows,
  findBookingsInTimeslot,
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityBands,
  getLocationAvailabilityIntervals,
  locationAvailabilityKindAtMinute,
  locationAvailabilityTooltip,
  makeScheduleRowId,
  resourceHasScheduleOrBlockOnAnyDate,
  type LocationAvailabilityKind,
} from "../calendar-schedule.utils";
import {
  defaultBookingRules,
  normalizeServiceOrderSettings,
  withClampedDesiredLocationInterval,
  type BookingRules,
  type ParsedCalendarSettings,
  type ScheduleAvailabilityRow,
  type ServiceOrderSettings,
} from "../calendar-settings.types";
import {
  dedupeServiceOrderSettings,
  shouldPreferTemplateServiceOrderDefaults,
} from "../serviceOrder.utils";
import {
  addDaysIso,
  addMonthsIso,
  extractBookingId,
  fmtMinToTime,
  fmtTimeLabel,
  getDefaultCalendarResourceId,
  timelineGridSlotBg,
  type TimelineGridSlotColors,
  timelineHoverFromPointerY,
  formatLongDateUtc,
  formatMdyDate,
  formatMonthYearUtc,
  blockTitleFromDraft,
  buildBlocksFromDraft,
  createEmptyBlockTimeDraft,
  dedupeCalendarBlocks,
  bookingOverlapsAnyBlock,
  calendarBlockOverlapsBooking,
  getCalendarQueryDateRange,
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
  eventMatchesNonTeamCalendarFilters,
  calendarFiltersAreNarrowing,
} from "../calendar.utils";
import {
  BOOKING_SCENARIO_LABELS,
  calendarBookingStatusLabel,
  canDiscardBookingRequest,
  getBookingScenarioIndicators,
  isAllowedStatusForBookingType,
  isBookingRequestAccepted,
  scenarioIndicatorDisplayLabel,
  statusAccentColor,
} from "../bookingStatus";
import {
  resolveProfessionalBookingActions,
  showProfessionalActionMenu,
} from "../bookingStatusActions";
import BookingResponseExpiryBanner from "../BookingResponseExpiryBanner";
import BookingGuidelineIcon from "../BookingGuidelineIcon";
import {
  buildAcceptAckDetails,
  prepayBlocksConfirmation,
  professionalShouldAck,
} from "../bookingAcknowledgment";
import BookingRequestAcceptedPanel from "../BookingRequestAcceptedPanel";
import BookingDrawerTotalPriceCard from "../BookingDrawerTotalPriceCard";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
  useProfessionalBusinessOverride,
} from "../../finance-documents";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
  isOfflinePaymentMethod,
} from "../../client-booking/checkoutPaymentOptions";
import BookingDrawerParticipantActions, {
  type BookingDrawerParticipantKind,
} from "../BookingDrawerParticipantActions";
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
  CalendarBooking,
  CreateCalendarEntryRequest,
  CalendarEntry,
  UpsertCalendarSettingsRequest,
} from "../../../../store/services/businessApi";
import {
  useGetMyBookingsQuery,
  useGetBookingActivityQuery,
  useLazyLookupMollureClientByEmailQuery,
  useUploadBookingAttachmentsMutation,
  useManageBookingEditRequestMutation,
} from "../../../../store/services/businessApi";
import { GENDER_OPTIONS, type GenderOption } from "../../../../lib/gender-options";
import {
  sanitizeDecimalInput,
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
  categoryOptions?: readonly { key: string; label: string }[];
  /** Business Template category rows (categories that have ≥1 service). */
  templateCategoryRows?: readonly TemplateCategoryRow[];
  /** Exact service title → template category key for appearance colouring. */
  serviceNameToCategoryKey?: Readonly<Record<string, string>>;
  serviceCatalog?: readonly BookingCatalogService[];
  serviceOrderDefaults?: ServiceOrderSettings;
  fixedLocationAddress?: string;
  lateRescheduleFeePercentDefault?: string;
  lateCancellationFeePercentDefault?: string;
  noShowFeePercentDefault?: string;
  prepaymentPercentDefault?: string;
  cancellationBeforeHours?: number | null;
  cancellationBeforeMinutes?: number | null;
  responseTimeHours?: number | null;
  responseTimeMinutes?: number | null;
  desiredLocationSetup?: BusinessPublicProfileDesiredLocation | null;
  clientOptions?: readonly {
    name: string;
    email: string;
    mollureUserId?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    clientKind?: "individual" | "company";
    isMollure?: boolean;
  }[];
  professionalClients?: import("../../../../store/services/businessApi").ApiProfessionalClient[];
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
const AVAILABILITY_PATTERN_LINE = "#D0D5DD";
const locationAvailabilityPatternSx = (kind: LocationAvailabilityKind) => {
  if (kind === "desired") {
    return {
      backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 5px, ${AVAILABILITY_PATTERN_LINE} 5px, ${AVAILABILITY_PATTERN_LINE} 6px)`,
    };
  }
  if (kind === "both") {
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${AVAILABILITY_PATTERN_LINE} 0px, ${AVAILABILITY_PATTERN_LINE} 1px, transparent 1px, transparent 6px)`,
      maskImage:
        "repeating-linear-gradient(180deg, #000 0px, #000 3px, transparent 3px, transparent 7px)",
      WebkitMaskImage:
        "repeating-linear-gradient(180deg, #000 0px, #000 3px, transparent 3px, transparent 7px)",
    };
  }
  return {};
};
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
const WEEK_DAY_MIN_PX = 110;
const TEAM_NAV_VISIBLE_SLOTS = 3;
const TEAM_NAV_SCROLLBAR_PX = 10;

export default function ProfessionalFixedLocationCalendar({
  data,
  calendarSettings,
  serviceOptions = [],
  categoryOptions = [],
  templateCategoryRows = [],
  serviceNameToCategoryKey = {},
  serviceCatalog = [],
  serviceOrderDefaults,
  fixedLocationAddress,
  lateRescheduleFeePercentDefault,
  lateCancellationFeePercentDefault,
  noShowFeePercentDefault,
  prepaymentPercentDefault,
  cancellationBeforeHours,
  cancellationBeforeMinutes,
  responseTimeHours,
  responseTimeMinutes,
  desiredLocationSetup = null,
  clientOptions = [],
  professionalClients = [],
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
  const timelineGridSlotColors = React.useMemo<TimelineGridSlotColors>(
    () => ({
      hour: m.timelineGridHourSlotBg,
      halfHour: m.timelineGridHalfHourSlotBg,
      normal: m.timelineGridNormalSlotBg,
    }),
    [
      m.timelineGridHourSlotBg,
      m.timelineGridHalfHourSlotBg,
      m.timelineGridNormalSlotBg,
    ],
  );
  const { showSnackbar } = useSnackbar();
  const businessResponseWindowInput = React.useMemo(
    () => ({
      hours: responseTimeHours,
      minutes: responseTimeMinutes,
    }),
    [responseTimeHours, responseTimeMinutes],
  );
  const { settings: financeSettings, setSettings: setFinanceSettings } =
    useFinanceInvoiceSettings();
  const professionalBusinessOverride = useProfessionalBusinessOverride();
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
      void (async () => {
        try {
          const result = await openMessagingForBooking({ bookingRef }).unwrap();
          openMessaging(prepareBookingMessagingOpen(result));
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              "Unable to open chat for this booking.",
            ),
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
  /** Booking-scoped line edit (never mutates master catalog definitions). */
  const [editingBookingLine, setEditingBookingLine] = React.useState<null | {
    kind: "product" | "unique";
    id: string;
    owner: "client" | string;
  }>(null);

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
  const userPickedTeamMemberRef = React.useRef(false);
  const [teamActionAnchor, setTeamActionAnchor] =
    React.useState<HTMLElement | null>(null);
  const [teamMenuResourceId, setTeamMenuResourceId] = React.useState("");
  const [splitScreen, setSplitScreen] = React.useState<{
    primaryId: string;
    partnerId: string;
  } | null>(null);
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
    React.useState<CalendarBookingType>("Online");
  const [slotStatus, setSlotStatus] =
    React.useState<CalendarBookingStatus>("Requested");
  const [slotClientAdded, setSlotClientAdded] = React.useState(false);
  const [slotCalendarOpen, setSlotCalendarOpen] = React.useState(false);
  const [slotCalendarTouched, setSlotCalendarTouched] = React.useState(false);
  /** When false, drawer was opened from a calendar slot click — hide manual time picker. */
  const [allowDrawerTimeSelection, setAllowDrawerTimeSelection] =
    React.useState(false);
  const [discardBrOpen, setDiscardBrOpen] = React.useState(false);
  const [discardEbrOpen, setDiscardEbrOpen] = React.useState(false);
  const [discardErOpen, setDiscardErOpen] = React.useState(false);
  const [erNoteDialogOpen, setErNoteDialogOpen] = React.useState(false);
  const [incomingConfirmAction, setIncomingConfirmAction] = React.useState<
    "accept" | "suggest" | "reject" | null
  >(null);
  const [responseActionsDismissed, setResponseActionsDismissed] =
    React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const restoreIncomingActions = React.useCallback(() => {
    setResponseActionsDismissed(false);
    setActionFeedback(null);
  }, []);
  React.useEffect(() => {
    setResponseActionsDismissed(false);
    setActionFeedback(null);
  }, [editingEventId]);
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
  const [serviceEditOrigin, setServiceEditOrigin] = React.useState<
    "select-services" | "new-booking"
  >("select-services");
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
    "products" | "unique"
  >("unique");
  const [editingCatalogProductId, setEditingCatalogProductId] = React.useState<
    string | null
  >(null);
  const [pendingCatalogDelete, setPendingCatalogDelete] =
    React.useState<BookingCatalogProduct | null>(null);
  const [bookingUniqueItems, setBookingUniqueItems] = React.useState<
    BookingUniqueItemLine[]
  >([]);
  const [customBookingProducts, setCustomBookingProducts] = React.useState<
    BookingCatalogProduct[]
  >([]);
  const mergedCustomBookingProducts = React.useMemo(() => {
    const byId = new Map<string, BookingCatalogProduct>();
    customBookingProducts.forEach((product) => {
      if (!isUniqueItemId(product.id)) byId.set(product.id, product);
    });
    return Array.from(byId.values());
  }, [customBookingProducts]);
  const [uniqueItemSelectionDraft, setUniqueItemSelectionDraft] =
    React.useState<BookingProductSelectionDraft>(() =>
      createEmptyProductSelectionDraft(),
    );
  const [showInlineGuestField, setShowInlineGuestField] = React.useState(false);
  const [inlineGuestDraft, setInlineGuestDraft] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  });
  const [editingInlineGuestId, setEditingInlineGuestId] = React.useState<
    string | null
  >(null);
  const [inlineGuestParticipantType, setInlineGuestParticipantType] =
    React.useState<"guest" | "model">("guest");
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
    teamMemberIds: [] as string[],
    durationMins: "",
    startTime: "",
    endTime: "",
  });
  const [editingBufferId, setEditingBufferId] = React.useState<string | null>(
    null,
  );
  const [bookingGuests, setBookingGuests] = React.useState<
    Array<{
      id: string;
      name: string;
      email?: string;
      phoneCode?: string;
      phoneNumber?: string;
      services: BookingServiceLineItem[];
      products: BookingProductLineItem[];
      participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
      planningActivity?: string;
      planningDuration?: string;
      planningStartTime?: string;
      planningEndTime?: string;
      bufferTeamMemberId?: string;
      bufferStartTime?: string;
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
  const desiredVisitAddressOptions = React.useMemo(
    () =>
      resolveDesiredVisitAddressOptions(
        desiredLocationSetup,
        desiredLocationDraft.province,
      ),
    [desiredLocationDraft.province, desiredLocationSetup],
  );
  const [showPrepayment, setShowPrepayment] = React.useState(false);
  const [prepaymentPercent, setPrepaymentPercent] = React.useState("");
  const [bookingTotalDiscount, setBookingTotalDiscount] =
    React.useState<ManualEntryDiscount | null>(null);
  const [bookingDiscountModalOpen, setBookingDiscountModalOpen] =
    React.useState(false);
  const [showLateCancellation, setShowLateCancellation] = React.useState(false);
  const [lateCancellationFeePercent, setLateCancellationFeePercent] =
    React.useState("");
  const [lateCancellationFeePercentCeiling, setLateCancellationFeePercentCeiling] =
    React.useState("");
  const [showLateRescheduling, setShowLateRescheduling] = React.useState(false);
  const [lateRescheduleFeePercent, setLateRescheduleFeePercent] =
    React.useState("");
  const [lateRescheduleFeePercentCeiling, setLateRescheduleFeePercentCeiling] =
    React.useState("");
  const [showNoShowFee, setShowNoShowFee] = React.useState(false);
  const [noShowFeePercent, setNoShowFeePercent] = React.useState("");
  const [noShowFeePercentCeiling, setNoShowFeePercentCeiling] =
    React.useState("");
  const [cancellationFeeAt, setCancellationFeeAt] = React.useState<
    string | undefined
  >(undefined);
  const [exceededCancellationWindow, setExceededCancellationWindow] =
    React.useState<boolean | undefined>(undefined);
  const [showInternalNote, setShowInternalNote] = React.useState(false);
  const [bookingInternalNote, setBookingInternalNote] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "online" | "offline"
  >("online");
  const [drawerDocOpen, setDrawerDocOpen] = React.useState(false);
  const [drawerDocType, setDrawerDocType] = React.useState<"invoice" | "receipt">(
    "invoice",
  );
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
    | "select-unique-items"
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
    setClientListSelectedEmail("");
    setPlatformEmailInput("");
    setPlatformEmailMatch(null);
    setPlatformLookupStatus("idle");
  }, [slotBookingScreen]);

  const clientList = clientOptions;

  const {
    viewClient,
    closeClientDetailsDrawer,
    handleClientNameClick,
    notInListPopover,
    closeNotInListPopover,
    bookingDrawerNotListedIdentity,
    clearBookingDrawerNotListedHint,
    addIdentityToClientList,
    isAddingClient,
    saveClientTechnicalNote,
    findListedClient,
  } = useCalendarClientProfile(professionalClients);

  const [teamProfileMemberId, setTeamProfileMemberId] = React.useState<
    string | null
  >(null);

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
      slotLocation === "DL" && showKilometerAllowance
        ? resolveKilometerAllowanceAmount(kilometerAllowanceDraft)
        : 0,
    [kilometerAllowanceDraft, showKilometerAllowance, slotLocation],
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
        showNoShowFee,
        noShowFeePercent,
        showPrepayment,
        prepaymentPercent,
        prepaymentPaid: false,
        prepaymentOffline: paymentMethod === "offline",
      }),
    [
      bookingTotalDiscount,
      kilometerAllowanceAmount,
      lateCancellationFeePercent,
      lateRescheduleFeePercent,
      noShowFeePercent,
      paymentMethod,
      prepaymentPercent,
      showLateCancellation,
      showLateRescheduling,
      showNoShowFee,
      showPrepayment,
      subtotalPrice,
    ],
  );
  const bookingDiscountAmount = bookingPrice.discountAmount;
  const lateCancellationFeeAmount = bookingPrice.lateCancellationFeeAmount;
  const lateRescheduleFeeAmount = bookingPrice.lateRescheduleFeeAmount;
  const noShowFeeAmount = bookingPrice.noShowFeeAmount;
  const prepaymentAmount = bookingPrice.prepaymentAmount;
  const remainingAfterPrepayment = bookingPrice.remainingAfterPrepayment;
  /** Amount due in the drawer (discount + fees + prepaid applied). */
  const totalPrice = bookingPrice.payableTotal;
  /** Persisted booking value (discount + fees, before prepaid deduction). */
  const bookingTotalForSave = bookingPrice.bookingTotal;
  const priceSummaryLines = React.useMemo(
    () =>
      buildBookingPriceSummaryLines({
        servicesTotal,
        guestsTotal,
        productsTotal,
        uniqueItemsTotal,
        extrasAmount: kilometerAllowanceAmount,
        discountAmount: bookingDiscountAmount,
        lateCancellationFeeAmount,
        lateRescheduleFeeAmount,
        noShowFeeAmount,
      }),
    [
      bookingDiscountAmount,
      guestsTotal,
      kilometerAllowanceAmount,
      lateCancellationFeeAmount,
      lateRescheduleFeeAmount,
      noShowFeeAmount,
      productsTotal,
      servicesTotal,
      uniqueItemsTotal,
    ],
  );
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
    applyFilters,
    bookingTypes,
    bookingStatuses,
    draftFilters,
    filteredResources: filterDrawerResources,
    initialFilters,
    locations,
    setDraftFilters,
  } = useCalendarFilters(data.resources, data.supportedLocations);

  const knownTeamMemberIds = React.useMemo(
    () => new Set(data.resources.map((resource) => String(resource.id))),
    [data.resources],
  );
  const fallbackTeamMemberId = String(data.resources[0]?.id ?? "");

  React.useEffect(() => {
    if (!data.supportedLocations.includes(slotLocation)) {
      setSlotLocation(data.supportedLocations[0] ?? "FL");
    }
  }, [data.supportedLocations, slotLocation]);
  const [blockTimeOpen, setBlockTimeOpen] = React.useState(false);
  const [slotAddAnchor, setSlotAddAnchor] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [pendingSlotPayload, setPendingSlotPayload] =
    React.useState<SelectedSlot | null>(null);
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

  const viewingBookingOverlapsBlockTime = React.useMemo(
    () =>
      viewingBookingEvent
        ? bookingOverlapsAnyBlock(viewingBookingEvent, blocks)
        : false,
    [blocks, viewingBookingEvent],
  );

  const viewingBookingChatRef =
    viewingBookingEvent?.bookingCode ??
    (viewingBookingEvent ? extractBookingId(viewingBookingEvent.id) : undefined);
  const viewingBookingUnread = useProfessionalMessagingUnread(viewingBookingChatRef);

  const viewingBookingPaymentDue = useBookingPaymentDueMeta(viewingBookingEvent);
  const isDrawerPrepaymentPaid =
    viewingBookingEvent != null &&
    resolveCalendarPrepaymentStatus(viewingBookingEvent) === "confirmed";
  const prepaymentSectionTitle = isDrawerPrepaymentPaid
    ? "Prepaid"
    : "Prepayment";
  const drawerPriceDisplay = resolveBookingPriceDisplay({
    breakdown: {
      ...bookingPrice,
      prepaidApplied: isDrawerPrepaymentPaid ? prepaymentAmount : 0,
      payableTotal: isDrawerPrepaymentPaid
        ? remainingAfterPrepayment
        : bookingTotalForSave,
    },
    prepaymentPaid: isDrawerPrepaymentPaid,
  });

  const drawerPaymentMethod =
    viewingBookingEvent?.details?.paymentMethod ?? paymentMethod;
  // Paid-like unlocks (accept bypass / receipt) only after Offline is persisted — not on draft select.
  const persistedPaymentIsOffline = isOfflinePaymentMethod(
    viewingBookingEvent?.details?.paymentMethod,
  );
  const drawerPaymentIsOffline = persistedPaymentIsOffline;
  const onlinePrepayBlocksAccept = prepayBlocksConfirmation({
    prepayRequired:
      showPrepayment &&
      ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0),
    prepayPaid: isDrawerPrepaymentPaid || drawerPaymentIsOffline,
  });

  const isMollureClientPath =
    addClientSource === "mollure-platform" ||
    Boolean(selectedClient?.mollureUserId) ||
    Boolean(viewingBookingEvent?.details?.customerId);
  const isGuestClientPath =
    addClientSource === "guest" ||
    (viewingBookingEvent != null &&
      viewingBookingEvent.bookingType === "Offline" &&
      !String(
        selectedClient?.email ?? viewingBookingEvent.details?.clientEmail ?? "",
      ).trim());
  const paymentMethodPolicy: "online-only" | "offline-only" | "either" =
    viewingBookingEvent
      ? viewingBookingEvent.bookingType === "Offline"
        ? isGuestClientPath
          ? "offline-only"
          : "either"
        : "online-only"
      : isGuestClientPath
        ? "offline-only"
        : isMollureClientPath
          ? "online-only"
          : "either";

  React.useEffect(() => {
    if (viewingBookingEvent) return;
    if (paymentMethodPolicy === "online-only" && paymentMethod !== "online") {
      setPaymentMethod("online");
    } else if (
      paymentMethodPolicy === "offline-only" &&
      paymentMethod !== "offline"
    ) {
      setPaymentMethod("offline");
    }
  }, [paymentMethod, paymentMethodPolicy, viewingBookingEvent]);

  const drawerDocumentDraft = React.useMemo(() => {
    if (!selectedServices.length) return null;
    return {
      selectedDateISO: viewingBookingEvent?.date ?? selectedSlot?.date ?? "",
      selectedTime: viewingBookingEvent?.start ?? selectedSlot?.start ?? "",
      combineServices: false,
      services: selectedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price) || 0,
        durationMins: Number(service.durationMins) || 30,
      })),
      total: bookingTotalForSave,
    };
  }, [
    bookingTotalForSave,
    selectedServices,
    selectedSlot?.date,
    selectedSlot?.start,
    viewingBookingEvent?.date,
    viewingBookingEvent?.start,
  ]);

  const drawerInvoiceRow = React.useMemo(() => {
    if (!drawerDocumentDraft) return null;
    const bookingRef =
      viewingBookingEvent?.bookingCode ??
      editingEventId ??
      "booking";
    return buildClientBookingTransactionRow({
      bookingRef,
      draft: drawerDocumentDraft,
      requesterName: selectedClient?.name ?? "Client",
      requesterEmail: selectedClient?.email,
      financeSettings,
      prepaymentAmount:
        showPrepayment && prepaymentAmount > 0 ? prepaymentAmount : undefined,
      methodTitle: checkoutPaymentMethodTitle(drawerPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(drawerPaymentMethod),
    });
  }, [
    drawerDocumentDraft,
    drawerPaymentMethod,
    editingEventId,
    financeSettings,
    prepaymentAmount,
    selectedClient?.email,
    selectedClient?.name,
    showPrepayment,
    viewingBookingEvent?.bookingCode,
  ]);

  const drawerReceiptRow = React.useMemo(() => {
    if (!drawerDocumentDraft || !(prepaymentAmount > 0)) return null;
    if (!isDrawerPrepaymentPaid && !drawerPaymentIsOffline) return null;
    const bookingRef =
      viewingBookingEvent?.bookingCode ??
      editingEventId ??
      "booking";
    return buildClientBookingTransactionRow({
      bookingRef: `${bookingRef}-prepay`,
      draft: drawerDocumentDraft,
      requesterName: selectedClient?.name ?? "Client",
      requesterEmail: selectedClient?.email,
      financeSettings,
      documentAmount: prepaymentAmount,
      prepaymentAmount,
      asPrepaymentReceipt: true,
      methodTitle: checkoutPaymentMethodTitle(drawerPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(drawerPaymentMethod),
    });
  }, [
    drawerDocumentDraft,
    drawerPaymentIsOffline,
    drawerPaymentMethod,
    editingEventId,
    financeSettings,
    isDrawerPrepaymentPaid,
    prepaymentAmount,
    selectedClient?.email,
    selectedClient?.name,
    viewingBookingEvent?.bookingCode,
  ]);

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
        lateCancellationFeePercentCeiling,
        showLateRescheduling,
        lateRescheduleFeePercent,
        lateRescheduleFeePercentCeiling,
        showNoShowFee,
        noShowFeePercent,
        noShowFeePercentCeiling,
        cancellationFeeAt,
        exceededCancellationWindow,
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
    lateCancellationFeePercentCeiling,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showNoShowFee,
    noShowFeePercent,
    noShowFeePercentCeiling,
    cancellationFeeAt,
    exceededCancellationWindow,
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
    const matched = all.filter((booking) => {
      if (currentId && String(booking.id) === String(currentId)) return true;
      if (
        currentCode &&
        booking.unique_code &&
        booking.unique_code === currentCode
      )
        return true;
      return false;
    });

    // Offline calendar entries often have no bookings row — synthesize one for fallback.
    if (
      matched.length === 0 &&
      drawerSalesActivityContext &&
      (currentId || currentCode)
    ) {
      const ev = drawerSalesActivityContext;
      let totalPrice: number | null = null;
      const details = ev.details;
      if (details) {
        let total = 0;
        for (const service of details.services ?? []) {
          total += Number(service.price) || 0;
        }
        for (const product of details.products ?? []) {
          total += Number(product.price) || 0;
        }
        for (const guest of details.guests ?? []) {
          for (const service of guest.services ?? []) {
            total += Number(service.price) || 0;
          }
          for (const product of guest.products ?? []) {
            total += Number(product.price) || 0;
          }
        }
        if (total > 0) totalPrice = total;
      }
      const bookingType = ev.bookingType?.toLowerCase();
      const synthetic: CalendarBooking = {
        id: String(currentId || currentCode || ev.id),
        unique_code: currentCode,
        status: String(ev.status || "confirmed")
          .toLowerCase()
          .replace(/\s+/g, "_"),
        prepayment_status:
          ev.details?.prepaymentStatus === "confirmed"
            ? "paid"
            : ev.details?.prepaymentStatus || null,
        total_price: totalPrice,
        booking_type:
          bookingType === "online" ||
          bookingType === "offline" ||
          bookingType === "project" ||
          bookingType === "request"
            ? bookingType
            : null,
        customer_name: ev.showClientName || null,
        customer_email: ev.details?.clientEmail || null,
        client_name: ev.showClientName || null,
        service_title: ev.title || null,
        notes: ev.notes || null,
        created_at: ev.start || null,
        updated_at: ev.start || null,
        booking_date: ev.date || ev.start?.slice(0, 10) || "",
        start_time: ev.start || null,
        end_time: ev.end || null,
        business_setup_id: "",
        customer_id: ev.details?.customerId || "",
        service_id: null,
        team_member_id: ev.resourceId || null,
        location_type: ev.location === "DL" ? "desired" : "fixed",
      };
      return [synthetic];
    }

    return matched;
  }, [drawerSalesActivityContext, myBookingsResponse?.data]);

  const activityBookingId = drawerSalesActivityContext
    ? (parseApiCalendarEventId(drawerSalesActivityContext.id)?.id ?? null)
    : null;
  const activityBookingCode = drawerSalesActivityContext?.bookingCode ?? null;

  const { data: bookingActivityResponse } = useGetBookingActivityQuery(
    {
      bookingId: activityBookingId,
      bookingCode: activityBookingCode,
    },
    {
      skip: !activityBookingId && !activityBookingCode,
    },
  );

  const activityTimelineItems = React.useMemo(
    () =>
      buildBookingActivityTimeline({
        bookings: clientBookingsForActivity,
        clientEmail: clientActivityIdentity.email,
        clientName: clientActivityIdentity.name,
        currentBookingId: activityBookingId,
        currentBookingCode: activityBookingCode,
        currentScenario: drawerSalesActivityContext?.bookingScenario ?? null,
        currentStatus: drawerSalesActivityContext?.status ?? null,
        currentCancellationReason:
          drawerSalesActivityContext?.details?.cancellationReason ?? null,
        currentProfessionalName:
          data.resources.find(
            (r) => r.id === drawerSalesActivityContext?.resourceId,
          )?.name ?? null,
        currentBookingType: drawerSalesActivityContext?.bookingType ?? null,
        currentDetails: drawerSalesActivityContext?.details ?? null,
        currentDateISO: drawerSalesActivityContext?.date ?? null,
        currentStart: drawerSalesActivityContext?.start ?? null,
        apiEvents: bookingActivityResponse?.data ?? null,
        mode: "activity",
      }),
    [
      activityBookingCode,
      activityBookingId,
      bookingActivityResponse?.data,
      clientActivityIdentity.email,
      clientActivityIdentity.name,
      clientBookingsForActivity,
      data.resources,
      drawerSalesActivityContext,
    ],
  );

  const openActivityComparison = React.useCallback(
    (mode?: "ebr" | "er" | "silent_updated") => {
      const bookingRef =
        drawerSalesActivityContext?.bookingCode ||
        (drawerSalesActivityContext
          ? parseApiCalendarEventId(drawerSalesActivityContext.id)?.id
          : null) ||
        null;
      const target = findActivityComparisonItem(activityTimelineItems, {
        bookingRef,
        mode,
      });
      setSlotDrawerTab("activity");
      setActivityDetailItem(target);
    },
    [activityTimelineItems, drawerSalesActivityContext],
  );

  const drawerLineTagComparisonMode = React.useMemo(():
    | "ebr"
    | "er"
    | "silent_updated" => {
    if (viewingBookingEvent?.details?.silentUpdated) return "silent_updated";
    if (viewingBookingEvent?.bookingScenario === "EBR") return "ebr";
    return "er";
  }, [
    viewingBookingEvent?.bookingScenario,
    viewingBookingEvent?.details?.silentUpdated,
  ]);

  const openDrawerLineTagComparison = React.useCallback(() => {
    openActivityComparison(drawerLineTagComparisonMode);
  }, [drawerLineTagComparisonMode, openActivityComparison]);

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
      return getServiceEditTag(serviceId, negotiationDetails, ebr);
    },
    [negotiationDetails, viewingBookingEvent],
  );

  const cancelledServicesForDrawer = React.useMemo(() => {
    const cancelledIds = negotiationDetails?.cancelledServiceIds ?? [];
    const currentIds = new Set([
      ...selectedServices.map((service) => service.id),
      ...bookingGuests.flatMap((guest) =>
        guest.services.map((service) => service.id),
      ),
    ]);
    return cancelledOriginalServicesForDisplay(
      negotiationDetails?.originalServices ??
        viewingBookingEvent?.details?.originalServices,
      currentIds,
      cancelledIds,
    ).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMins: service.durationMins,
      startTime: service.startTime,
      endTime: service.endTime,
      staffResourceId: service.staffResourceId,
      guestId: service.guestId,
    }));
  }, [
    bookingGuests,
    negotiationDetails?.cancelledServiceIds,
    negotiationDetails?.originalServices,
    selectedServices,
    viewingBookingEvent,
  ]);
  const mainCancelledServices = cancelledServicesForDrawer.filter(
    (service) =>
      !service.guestId ||
      !bookingGuests.some((guest) => guest.id === service.guestId),
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
  const resolvedSelectedClientKind:
    | "individual"
    | "company"
    | undefined = (() => {
    if (selectedClient?.clientKind) return selectedClient.clientKind;
    const email = selectedClient?.email?.trim().toLowerCase();
    if (email) {
      const listed = clientList.find(
        (c) => c.email.trim().toLowerCase() === email,
      );
      if (listed?.clientKind) return listed.clientKind;
    }
    return (
      viewingBookingEvent?.clientKind ??
      viewingBookingEvent?.details?.clientKind
    );
  })();
  const isSelectedCompanyClient = resolvedSelectedClientKind === "company";
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
        lateCancellationFeePercentCeiling,
        showLateRescheduling,
        lateRescheduleFeePercent,
        lateRescheduleFeePercentCeiling,
        showNoShowFee,
        noShowFeePercent,
        noShowFeePercentCeiling,
        cancellationFeeAt,
        exceededCancellationWindow,
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
      lateCancellationFeePercentCeiling,
      showLateRescheduling,
      lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling,
      showNoShowFee,
      noShowFeePercent,
      noShowFeePercentCeiling,
      cancellationFeeAt,
      exceededCancellationWindow,
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
  const showManualBookingParticipantActions = !isViewingExisting;
  const drawerParticipantKinds = React.useMemo<
    BookingDrawerParticipantKind[]
  >(() => {
    if (!showManualBookingParticipantActions) return [];
    // Fixed Location (standard): Add Guest only.
    if (slotLocation === "FL") return ["guest"];
    if (slotLocation !== "DL") return [];
    // Desired Location: company = Model, individual = Guest; Buffer always.
    // Planning is project-only (never on DL standard).
    if (isSelectedCompanyClient) {
      return bookingProjectEnabled
        ? ["model", "planning", "buffer"]
        : ["model", "buffer"];
    }
    return ["guest", "buffer"];
  }, [
    bookingProjectEnabled,
    isSelectedCompanyClient,
    showManualBookingParticipantActions,
    slotLocation,
  ]);
  const openInlineGuestForm = React.useCallback(
    (participantType: "guest" | "model") => {
      setInlineGuestParticipantType(participantType);
      setEditingInlineGuestId(null);
      setInlineGuestDraft({
        firstName: "",
        lastName: "",
        email: "",
        phoneCode: "",
        phoneNumber: "",
      });
      setShowInlineGuestField(true);
    },
    [],
  );
  const showLineItemRemoveButton = !isViewingExisting;
  const showClientRemoveButton =
    showLineItemRemoveButton && !lockClientIdentity;
  const hideClientBookingFooterActions =
    slotBookingScreen === "new-booking" && showIncomingRequestActions;
  const hideClientBookingEditButton = showIncomingRequestActions;
  const isBookingSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "select-unique-items" ||
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

  const [blockDraft, setBlockDraft] = React.useState<BlockTimeDraft>(() =>
    createEmptyBlockTimeDraft(
      data.resources.map((r) => r.id),
      data.supportedLocations,
      "2025-04-06",
    ),
  );
  const pendingOverviewBlockRef = React.useRef<BlockTimeDraft | null>(null);
  const [blockOverlapOpen, setBlockOverlapOpen] = React.useState(false);
  const [staffConflictOpen, setStaffConflictOpen] = React.useState(false);
  const [staffConflictMessage, setStaffConflictMessage] = React.useState<
    string | null
  >(null);
  const staffConflictAckRef = React.useRef(false);
  const inlineGuestFormRef = React.useRef<HTMLDivElement | null>(null);
  const emptyInlineGuestDraft = React.useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      phoneCode: "",
      phoneNumber: "",
    }),
    [],
  );

  React.useEffect(() => {
    if (!showInlineGuestField) return;
    inlineGuestFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [showInlineGuestField, editingInlineGuestId]);

  const persistOverviewBlockedTime = async (draft: BlockTimeDraft) => {
    const nextBlocks = buildBlocksFromDraft(draft, draft.teamIds);
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
    setActiveDateIso(draft.dateFrom);
    if (draft.teamIds.length === 1) {
      setSelectedResourceId(draft.teamIds[0]);
    }
    setBlockTimeOpen(false);
    showSnackbar({ severity: "success", message: "Blocked time added." });

    if (!onCreateCalendarEntry) return;

    try {
      for (const teamId of draft.teamIds) {
        const teamMemberId = String(teamId).trim() || null;
        for (const location of draft.locations) {
          await onCreateCalendarEntry({
            team_member_id: teamMemberId,
            status: "blocked",
            title: blockTitleFromDraft(draft) || "Blocked time",
            blocked_time_start: toDateTimeInput(draft.dateFrom, draft.startTime),
            blocked_time_end: toDateTimeInput(
              draft.dateTo || draft.dateFrom,
              draft.endTime,
            ),
            start_date: draft.dateFrom,
            end_date: draft.dateTo || draft.dateFrom,
            location_type: locationToApi(location),
            notes:
              `${draft.dayFrom || ""}${draft.dayTo ? ` - ${draft.dayTo}` : ""}`.trim() ||
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
  };

  const [publicBusinessHoursDraft, setPublicBusinessHoursDraft] =
    React.useState<PublicBusinessHoursDraft>(() =>
      createEmptyPublicBusinessHoursDraft(),
    );

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
  const autoArchivePersistedRef = React.useRef<string | null>(null);
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
    const rawSchedule =
      calendarSettings.availability.scheduleAvailability ?? [];
    setScheduleRows(archiveFullyPastScheduleRows(rawSchedule));
    setDateOverrides(calendarSettings.availability.dateOverrides ?? []);
    setAppliedDesign(calendarSettings.design);
    setDesignDraft(calendarSettings.design);
    if (
      calendarSettings.availability.serviceOrder &&
      !shouldPreferTemplateServiceOrderDefaults(
        calendarSettings.availability.serviceOrder,
      )
    ) {
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

  React.useEffect(() => {
    if (!calendarSettings || !onSaveCalendarSettings) return;
    const raw = calendarSettings.availability.scheduleAvailability ?? [];
    const next = archiveFullyPastScheduleRows(raw);
    if (next === raw) return;
    const fingerprint = next
      .map((row) => `${row.id}:${row.archived ? 1 : 0}`)
      .join("|");
    if (autoArchivePersistedRef.current === fingerprint) return;
    autoArchivePersistedRef.current = fingerprint;
    void persistAvailabilitySettings({ scheduleAvailability: next });
  }, [calendarSettings, onSaveCalendarSettings, persistAvailabilitySettings]);

  const resolveEventCategoryKey = React.useCallback(
    (event: CalendarEvent) => {
      const candidates = [
        ...(event.details?.services?.map((service) => service.name) ?? []),
        event.title,
      ]
        .map((text) => String(text ?? "").trim())
        .filter(Boolean);

      for (const name of candidates) {
        const direct = serviceNameToCategoryKey[name];
        if (direct) return direct;
        const lower = name.toLowerCase();
        const matched = Object.entries(serviceNameToCategoryKey).find(
          ([serviceTitle]) => serviceTitle.toLowerCase() === lower,
        );
        if (matched) return matched[1];
      }
      return null;
    },
    [serviceNameToCategoryKey],
  );

  const lookupCategoryColor = React.useCallback(
    (categoryKey: string | null | undefined) => {
      if (!categoryKey) return undefined;
      const colors = appliedDesign.colorsByCategory ?? {};
      const color = colors[categoryKey];
      return isConfiguredColor(color) ? color : undefined;
    },
    [appliedDesign.colorsByCategory],
  );

  const resolveEventColors = React.useCallback(
    (event: CalendarEvent) => {
      const categoryKey = resolveEventCategoryKey(event);
      const categoryColor = lookupCategoryColor(categoryKey);
      const serviceNames = [
        ...(event.details?.services?.map((service) => service.name) ?? []),
        event.title,
      ].filter(Boolean);
      const namedServiceColor = serviceNames
        .map((name) => appliedDesign.colorsByService?.[String(name)])
        .find((color) => isConfiguredColor(color));

      const cardColor =
        appliedDesign.scope === "Services"
          ? namedServiceColor ?? categoryColor
          : categoryColor;

      return {
        serviceColor: cardColor,
        statusColor: undefined,
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
      const current =
        events.find((event) => event.id === eventId) ?? viewingBookingEvent;
      if (
        current &&
        !isAllowedStatusForBookingType(status, current.bookingType)
      ) {
        showSnackbar({
          severity: "warning",
          message: "This status is not allowed for offline bookings.",
        });
        return;
      }
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
    [
      events,
      onUpdateBookingStatus,
      onUpdateCalendarEntryStatus,
      showSnackbar,
      viewingBookingEvent,
    ],
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
        | "ok"
        | "discard",
    ) => {
      setBookingActionAnchor(null);
      if (!editingEventId) return;

      if (action === "discard") {
        const current =
          viewingBookingEvent ??
          events.find((event) => event.id === editingEventId);
        if (
          current?.status === "Confirmed" &&
          current.bookingScenario === "ER"
        ) {
          setDiscardErOpen(true);
          return;
        }
        if (canDiscardEbr(current)) {
          setDiscardEbrOpen(true);
          return;
        }
        setDiscardBrOpen(true);
        return;
      }

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
        const status = current?.status;
        const feeCheckout = canCheckoutProtectiveFee({
          status,
          showLateCancellation,
          lateCancellationFeeAmount,
          showNoShowFee,
          noShowFeeAmount,
        });

        // Cancelled / No Show: invoice protective fee only — keep status, open Sales.
        if (
          feeCheckout &&
          (status === "Cancelled" || status === "No Show")
        ) {
          const feeAmount =
            status === "Cancelled"
              ? lateCancellationFeeAmount
              : noShowFeeAmount;
          const nextDetails = {
            ...(current?.details ?? {}),
            showLateCancellation:
              status === "Cancelled"
                ? showLateCancellation
                : current?.details?.showLateCancellation,
            lateCancellationFeePercent:
              status === "Cancelled"
                ? lateCancellationFeePercent
                : current?.details?.lateCancellationFeePercent,
            lateCancellationFeePercentCeiling:
              status === "Cancelled"
                ? lateCancellationFeePercentCeiling
                : current?.details?.lateCancellationFeePercentCeiling,
            showNoShowFee:
              status === "No Show"
                ? showNoShowFee
                : current?.details?.showNoShowFee,
            noShowFeePercent:
              status === "No Show"
                ? noShowFeePercent
                : current?.details?.noShowFeePercent,
            noShowFeePercentCeiling:
              status === "No Show"
                ? noShowFeePercentCeiling
                : current?.details?.noShowFeePercentCeiling,
            cancellationFeeAt:
              cancellationFeeAt ?? new Date().toISOString(),
            ...(typeof exceededCancellationWindow === "boolean"
              ? { exceededCancellationWindow }
              : {}),
            waitingForPayment: feeAmount > 0,
            invoiceDueDate: new Date().toISOString().slice(0, 10),
          };
          const nextNotes = serializeCalendarEntryNotes(
            nextDetails.internalNote ?? "",
            nextDetails,
            parseStoredEbrFromNotes(current?.notes),
            parseStoredErFromNotes(current?.notes),
          );
          try {
            await persistEventStatus(editingEventId, status, {
              notes: nextNotes,
              total_price: feeAmount,
            });
            setEvents((prev) =>
              prev.map((event) =>
                event.id === editingEventId
                  ? {
                      ...event,
                      notes: nextNotes,
                      details: nextDetails,
                    }
                  : event,
              ),
            );
            setCancellationFeeAt(nextDetails.cancellationFeeAt);
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to send fee checkout.",
            });
            return;
          }
          setSlotDrawerTab("sales");
          showSnackbar({
            severity: "success",
            message:
              status === "Cancelled"
                ? "Cancellation fee checkout opened in Sales."
                : "No-show fee checkout opened in Sales.",
          });
          return;
        }

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

      setPendingBookingAction(action);
    },
    [editingEventId, events, persistEventStatus, remainingAfterPrepayment, showSnackbar, viewingBookingEvent, showLateCancellation, lateCancellationFeeAmount, showNoShowFee, noShowFeeAmount, lateCancellationFeePercent, lateCancellationFeePercentCeiling, noShowFeePercent, noShowFeePercentCeiling, cancellationFeeAt, exceededCancellationWindow],
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
    data.resources.forEach((r) => {
      map.set(r.id, r.name);
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

  // Overview calendar: hide members with neither availability nor block on visible dates.
  // When a drawer filter is applied, also keep members who have matching bookings
  // so results are searched across the whole team, not only the focused person.
  const locationFilterAvailable = data.supportedLocations.length > 1;
  const filtersAreNarrowing = calendarFiltersAreNarrowing(appliedFilters, {
    locationFilterAvailable,
  });
  const eventsMatchingDrawerFilters = React.useMemo(
    () =>
      events.filter((event) => {
        if (appliedFilters.teamAll === false) {
          const selectedIds = Object.entries(appliedFilters.teamIds)
            .filter(([, checked]) => checked)
            .map(([id]) => id);
          if (
            selectedIds.length &&
            !selectedIds.some((id) => eventBelongsToTeamMember(event, id))
          ) {
            return false;
          }
        }
        return eventMatchesNonTeamCalendarFilters(event, appliedFilters);
      }),
    [appliedFilters, events],
  );
  const filteredResources = React.useMemo(
    () =>
      filterDrawerResources.filter((resource) => {
        if (
          resourceHasScheduleOrBlockOnAnyDate(
            resource.id,
            visibleDates,
            scheduleRows,
            blocks,
          )
        ) {
          return true;
        }
        if (!filtersAreNarrowing) return false;
        return eventsMatchingDrawerFilters.some(
          (event) =>
            visibleDates.includes(event.date) &&
            eventBelongsToTeamMember(event, resource.id),
        );
      }),
    [
      blocks,
      eventsMatchingDrawerFilters,
      filterDrawerResources,
      filtersAreNarrowing,
      scheduleRows,
      visibleDates,
    ],
  );

  const alphabeticalResources = React.useMemo(
    () =>
      [...filteredResources].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [filteredResources],
  );
  const dayRankedResources = React.useMemo(
    () =>
      rankResourcesForCalendarDay(
        filteredResources,
        filtersAreNarrowing ? eventsMatchingDrawerFilters : events,
        activeDateIso,
        {
          fallbackTeamMemberId,
          knownTeamIds: knownTeamMemberIds,
        },
      ),
    [
      activeDateIso,
      events,
      eventsMatchingDrawerFilters,
      fallbackTeamMemberId,
      filteredResources,
      filtersAreNarrowing,
      knownTeamMemberIds,
    ],
  );
  const teamNavResources =
    viewMode === "day" ? dayRankedResources : alphabeticalResources;
  const defaultDaySelectedResourceId =
    getDefaultCalendarResourceId(dayRankedResources);
  const defaultWeekSelectedResourceId =
    getDefaultCalendarResourceId(alphabeticalResources);

  React.useLayoutEffect(() => {
    if (viewMode !== "day") return;
    userPickedTeamMemberRef.current = false;
  }, [activeDateIso, viewMode]);

  React.useLayoutEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId("");
      return;
    }
    const defaultResourceId =
      viewMode === "day"
        ? defaultDaySelectedResourceId
        : defaultWeekSelectedResourceId;
    setSelectedResourceId((current) => {
      const stillValid =
        Boolean(current) &&
        filteredResources.some((resource) => resource.id === current);
      if (!stillValid) {
        userPickedTeamMemberRef.current = false;
        return defaultResourceId;
      }
      if (!userPickedTeamMemberRef.current && viewMode === "day") {
        return defaultDaySelectedResourceId;
      }
      return current;
    });
  }, [
    defaultDaySelectedResourceId,
    defaultWeekSelectedResourceId,
    filteredResources,
    viewMode,
  ]);

  const getAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const fromSchedule = getCombinedAvailabilityIntervals(
        resourceId,
        iso,
        scheduleRows,
        dateOverrides ?? [],
      );
      if (fromSchedule.length) return mergeIntervals(fromSchedule);

      const av = data.availability.find((a) => a.resourceId === resourceId);
      if (!av) return [];
      const dow = parseIsoDate(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const windows = av.weekly[dow] ?? [];
      return mergeIntervals(
        windows.map((w) => ({
          startMin: minutesSinceMidnight(w.start),
          endMin: minutesSinceMidnight(w.end),
        })),
      );
    },
    [data.availability, dateOverrides, scheduleRows],
  );

  const getLocationAvailability = React.useCallback(
    (
      resourceId: string,
      iso: string,
      location: CalendarBookingLocation,
    ): Interval[] =>
      mergeIntervals(
        getLocationAvailabilityIntervals(
          resourceId,
          iso,
          location,
          scheduleRows,
          dateOverrides ?? [],
        ),
      ),
    [dateOverrides, scheduleRows],
  );

  const getFilteredAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      if (appliedFilters.locationAll) return getAvailabilityFor(resourceId, iso);
      const selected = (["FL", "DL"] as const).filter(
        (location) => appliedFilters.locations[location],
      );
      if (!selected.length) return getAvailabilityFor(resourceId, iso);
      return mergeIntervals(
        selected.flatMap((location) =>
          getLocationAvailability(resourceId, iso, location),
        ),
      );
    },
    [
      appliedFilters.locationAll,
      appliedFilters.locations,
      getAvailabilityFor,
      getLocationAvailability,
    ],
  );

  /** Grid height follows schedule, bookings, and blocks on visible days. */
  const { startMin, endMin } = React.useMemo(() => {
    const step = grid.stepMinutes;
    let start = Number.POSITIVE_INFINITY;
    let end = Number.NEGATIVE_INFINITY;
    const resourceIds = (
      filteredResources.length ? filteredResources : data.resources
    ).map((resource) => resource.id);
    for (const iso of visibleDates) {
      for (const resourceId of resourceIds) {
        for (const hours of getFilteredAvailabilityFor(resourceId, iso)) {
          start = Math.min(start, hours.startMin);
          end = Math.max(end, hours.endMin);
        }
      }
      for (const event of filtersAreNarrowing
        ? eventsMatchingDrawerFilters
        : events) {
        if (event.date !== iso || event.status === "Cancelled") continue;
        start = Math.min(start, minutesSinceMidnight(event.start));
        end = Math.max(end, minutesSinceMidnight(event.end));
      }
      for (const block of blocks) {
        if (block.date !== iso) continue;
        start = Math.min(start, minutesSinceMidnight(block.start));
        end = Math.max(end, minutesSinceMidnight(block.end));
      }
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
    blocks,
    data.resources,
    events,
    eventsMatchingDrawerFilters,
    filteredResources,
    filtersAreNarrowing,
    getFilteredAvailabilityFor,
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
  const dayViewMemberColumnSource = React.useMemo(() => {
    if (viewMode !== "day") return [] as typeof filteredResources;

    if (splitScreen) {
      const resolveResource = (resourceId: string) =>
        filteredResources.find((resource) => resource.id === resourceId);
      const primary = resolveResource(splitScreen.primaryId);
      const partner = resolveResource(splitScreen.partnerId);
      return [primary, partner].filter(
        (resource): resource is (typeof filteredResources)[number] =>
          Boolean(resource),
      );
    }

    // Drawer filters search the whole team: show every matching member as a column.
    if (filtersAreNarrowing && filteredResources.length > 0) {
      return filteredResources;
    }

    const selectedMember =
      filteredResources.find((resource) => resource.id === selectedResourceId) ??
      filteredResources.find(
        (resource) => resource.id === defaultDaySelectedResourceId,
      ) ??
      dayRankedResources[0] ??
      filteredResources[0];
    const selectedId = String(selectedMember?.id ?? "");
    const sharedColumnIds = new Set<string>();
    for (const event of eventsMatchingDrawerFilters) {
      if (event.date !== activeDateIso) continue;
      const teamIds = [
        ...new Set(
          [
            ...collectEventTeamMemberIds(event),
            String(event.resourceId ?? "").trim(),
          ].filter(Boolean),
        ),
      ];
      if (teamIds.length <= 1) continue;
      const involvesSelected =
        !selectedId ||
        teamIds.includes(selectedId) ||
        eventBelongsToTeamMember(event, selectedId);
      if (!involvesSelected) continue;
      for (const teamId of teamIds) {
        if (
          filteredResources.some(
            (resource) => String(resource.id) === String(teamId),
          )
        ) {
          sharedColumnIds.add(String(teamId));
        }
      }
    }
    if (sharedColumnIds.size > 1) {
      const ranked = dayRankedResources.filter((resource) =>
        sharedColumnIds.has(String(resource.id)),
      );
      const extras = filteredResources.filter(
        (resource) =>
          sharedColumnIds.has(String(resource.id)) &&
          !ranked.some((row) => row.id === resource.id),
      );
      const columns = [...ranked, ...extras];
      if (columns.length > 1) return columns;
    }

    if (selectedMember) return [selectedMember];

    if (data.resources.length === 0) {
      return [
        {
          id: "unassigned",
          name: "Unassigned",
          avatarText: "U",
        } as (typeof filteredResources)[number],
      ];
    }
    return [] as typeof filteredResources;
  }, [
    activeDateIso,
    data.resources.length,
    dayRankedResources,
    defaultDaySelectedResourceId,
    eventsMatchingDrawerFilters,
    filteredResources,
    filtersAreNarrowing,
    selectedResourceId,
    splitScreen,
    viewMode,
  ]);
  const dayViewBodyGridTemplateColumns =
    dayViewMemberColumnSource.length > 1
      ? `repeat(${dayViewMemberColumnSource.length}, minmax(0, 1fr))`
      : "1fr";
  // Week always needs the date header row; day only needs a header when staff exist.
  const timelineHeaderRows =
    viewMode === "week" ? (hasTeamMembers ? 2 : 1) : hasTeamMembers ? 1 : 0;
  const timelineHeaderPx =
    laneHeaderPx * timelineHeaderRows +
    (filteredResources.length > TEAM_NAV_VISIBLE_SLOTS
      ? TEAM_NAV_SCROLLBAR_PX
      : 0);

  const slotLines = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < rows; i++) out.push(startMin + i * grid.stepMinutes);
    return out;
  }, [rows, startMin, grid.stepMinutes]);

  const resetToDefaultTeamMember = React.useCallback(() => {
    userPickedTeamMemberRef.current = false;
    setSelectedResourceId("");
  }, []);

  const activeResource = React.useMemo(
    () =>
      filteredResources.find((r) => r.id === selectedResourceId) ??
      filteredResources.find((r) =>
        viewMode === "day"
          ? r.id === defaultDaySelectedResourceId
          : r.id === defaultWeekSelectedResourceId,
      ) ??
      (viewMode === "day" ? dayRankedResources[0] : alphabeticalResources[0]) ??
      filteredResources[0],
    [
      alphabeticalResources,
      dayRankedResources,
      defaultDaySelectedResourceId,
      defaultWeekSelectedResourceId,
      filteredResources,
      selectedResourceId,
      viewMode,
    ],
  );

  const closeTeamMenu = React.useCallback(() => {
    setTeamActionAnchor(null);
    setTeamMenuResourceId("");
  }, []);

  const discardSplitScreen = React.useCallback(() => {
    setSplitScreen(null);
  }, []);

  React.useEffect(() => {
    if (viewMode !== "day") {
      setSplitScreen(null);
    }
  }, [viewMode]);

  React.useEffect(() => {
    if (!splitScreen) return;
    const isValid = (resourceId: string) =>
      filteredResources.some((resource) => resource.id === resourceId);
    if (!isValid(splitScreen.primaryId) || !isValid(splitScreen.partnerId)) {
      setSplitScreen(null);
    }
  }, [filteredResources, splitScreen]);

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

      userPickedTeamMemberRef.current = true;
      setSelectedResourceId(normalizedId);
    },
    [data.resources],
  );

  const handleTeamMemberBadgeClick = React.useCallback(
    (resourceId: string, anchor: HTMLElement, isAlreadySelected: boolean) => {
      if (!isAlreadySelected) {
        setSplitScreen((current) => {
          if (!current) return null;
          const normalizedId = String(resourceId);
          if (
            current.primaryId === normalizedId ||
            current.partnerId === normalizedId
          ) {
            return current;
          }
          return null;
        });
        selectTeamMember(resourceId);
        closeTeamMenu();
        return;
      }

      openTeamMenu(resourceId, anchor);
    },
    [closeTeamMenu, openTeamMenu, selectTeamMember],
  );

  const teamMenuResource = React.useMemo(
    () =>
      data.resources.find((resource) => resource.id === teamMenuResourceId) ??
      activeResource,
    [activeResource, data.resources, teamMenuResourceId],
  );

  const teamMenuBookings = React.useMemo(() => {
    if (!teamMenuResource) return [];
    return getTeamMemberBookings(events, teamMenuResource.id, visibleDates);
  }, [events, teamMenuResource, visibleDates]);

  const splitScreenCandidates = React.useMemo(() => {
    if (!teamMenuResource) return [];
    return filteredResources
      .filter((resource) => resource.id !== teamMenuResource.id)
      .map((resource) => ({
        id: resource.id,
        name: resource.name,
        avatarText: resource.avatarText,
        photoSrc: resource.photoSrc,
      }));
  }, [filteredResources, teamMenuResource]);

  const openSplitScreenWith = React.useCallback(
    (partnerId: string) => {
      if (!teamMenuResourceId) return;
      setSplitScreen({
        primaryId: teamMenuResourceId,
        partnerId,
      });
      selectTeamMember(teamMenuResourceId);
      closeTeamMenu();
    },
    [closeTeamMenu, selectTeamMember, teamMenuResourceId],
  );

  const splitScreenMembers = React.useMemo(() => {
    if (!splitScreen) return null;
    const primary = filteredResources.find(
      (resource) => resource.id === splitScreen.primaryId,
    );
    const partner = filteredResources.find(
      (resource) => resource.id === splitScreen.partnerId,
    );
    if (!primary || !partner) return null;
    return { primary, partner };
  }, [filteredResources, splitScreen]);

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
    // Day view: one outer lane; selected member full width (split screen = two columns).
    if (viewMode === "day") {
      if (dayViewMemberColumnSource.length === 0) return [];
      return [
        {
          id: "__day_view_lane__",
          name: "",
          avatarText: "",
        } as (typeof filteredResources)[number],
      ];
    }
    return filteredResources;
  }, [
    activeResource,
    data.resources.length,
    dayViewMemberColumnSource.length,
    filteredResources,
    viewMode,
  ]);

  const knownResourceIds = React.useMemo(
    () => new Set(data.resources.map((resource) => String(resource.id))),
    [data.resources],
  );

  const eventsInRange = React.useMemo(() => {
    const base = eventsMatchingDrawerFilters.filter((e) =>
      visibleDates.includes(e.date),
    );
    const scoped = (() => {
      if (filtersAreNarrowing || viewMode === "day") return base;
      const focusedTeamId = String(
        selectedResourceId || activeResource?.id || "",
      );
      const fallbackTeamId = String(data.resources[0]?.id ?? "");
      if (!focusedTeamId) return base;
      return base.filter((event) => {
        if (eventBelongsToTeamMember(event, focusedTeamId)) return true;
        return (
          !eventHasKnownTeamAssignment(event, knownResourceIds) &&
          focusedTeamId === fallbackTeamId
        );
      });
    })();
    return scoped.flatMap((event) =>
      calendarEventToDisplaySegments(event, resourceNameById),
    );
  }, [
    activeResource?.id,
    data.resources,
    eventsMatchingDrawerFilters,
    filtersAreNarrowing,
    knownResourceIds,
    resourceNameById,
    selectedResourceId,
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
  const timelineGridRef = React.useRef<HTMLDivElement | null>(null);
  const [timelineHover, setTimelineHover] = React.useState<{
    absoluteTop: number;
    timeMin: number;
  } | null>(null);
  const [availabilityHoverTitle, setAvailabilityHoverTitle] =
    React.useState("");
  const handleTimelineHoverMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const gridEl = timelineGridRef.current;
      if (!gridEl) return;
      const laneRect = e.currentTarget.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();
      const yInBody = e.clientY - laneRect.top;
      const { topPx, timeMin } = timelineHoverFromPointerY(yInBody, {
        rowPx,
        startMin,
        endMin,
        stepMinutes: grid.stepMinutes,
      });
      setTimelineHover({
        absoluteTop: laneRect.top - gridRect.top + topPx,
        timeMin,
      });
    },
    [endMin, grid.stepMinutes, rowPx, startMin],
  );
  const clearTimelineHover = React.useCallback(() => {
    setTimelineHover(null);
    setAvailabilityHoverTitle("");
  }, []);
  React.useEffect(() => {
    setTimelineHover(null);
  }, [activeDateIso, viewMode]);
  const activeMonthIso = React.useMemo(
    () => toMonthIso(activeDateIso),
    [activeDateIso],
  );
  const monthEvents = React.useMemo(() => {
    const base = eventsMatchingDrawerFilters.filter(
      (e) => toMonthIso(e.date) === activeMonthIso,
    );
    if (filtersAreNarrowing) return base;
    const focusedTeamId = String(
      selectedResourceId || activeResource?.id || "",
    );
    const fallbackTeamId = String(data.resources[0]?.id ?? "");
    if (!focusedTeamId) return base;
    return base.filter((event) => {
      if (eventBelongsToTeamMember(event, focusedTeamId)) return true;
      const hasKnownTeam = Boolean(
        event.resourceId &&
          data.resources.some(
            (resource) => String(resource.id) === String(event.resourceId),
          ),
      );
      return !hasKnownTeam && focusedTeamId === fallbackTeamId;
    });
  }, [
    activeMonthIso,
    activeResource?.id,
    data.resources,
    eventsMatchingDrawerFilters,
    filtersAreNarrowing,
    selectedResourceId,
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
        | "guestEmail"
        | "bookingClientEmail"
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
        | "bufferDuration"
        | "bufferStartTime"
        | "bufferEndTime"
        | "bufferTeamMembers",
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

    if (slotBookingScreen === "select-unique-items") {
      const hasSelected = Object.values(uniqueItemSelectionDraft).some(
        (item) => item.selected,
      );
      if (!hasSelected) {
        isValid = false;
        errors.bookingClient = "Select at least one unique item.";
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
      if (isBlank(bufferDraft.startTime)) {
        isValid = false;
        errors.bufferStartTime = "Start time is required.";
      }
      if (isBlank(bufferDraft.endTime)) {
        isValid = false;
        errors.bufferEndTime = "End time is required.";
      } else if (
        bufferDraft.startTime &&
        minutesSinceMidnight(bufferDraft.endTime) <=
          minutesSinceMidnight(bufferDraft.startTime)
      ) {
        isValid = false;
        errors.bufferEndTime = "End time must be after start time.";
      }
      if (!bufferDraft.teamMemberIds.length) {
        isValid = false;
        errors.bufferTeamMembers = "Select at least one team member.";
      }
      return { isValid, errors };
    }

    if (slotBookingScreen === "guest") {
      if (isBlank(guestDraft.firstName)) {
        isValid = false;
        errors.guestFirstName = "First name is required.";
      }
      const guestPhoneErrors = getPhoneValidationErrors(
        guestDraft.phoneCode,
        guestDraft.phoneNumber,
        { required: true },
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
    // Primary guest path keeps phone mandatory after attach; other clients stay optional.
    const bookingPhoneErrors =
      addClientSource === "guest"
        ? getPhoneValidationErrors(
            bookingPhoneDraft.phoneCode,
            bookingPhoneDraft.phoneNumber,
            { required: true },
          )
        : getOptionalPhoneValidationErrors(
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
    if (
      paymentMethod === "online" &&
      isBlank(selectedClient?.email ?? "")
    ) {
      isValid = false;
      errors.bookingClientEmail =
        "Email is required for online payment.";
    }
    return { isValid, errors };
  }, [
    addClientSource,
    bookingPhoneDraft.phoneCode,
    bookingPhoneDraft.phoneNumber,
    guestDraft.firstName,
    guestDraft.phoneCode,
    guestDraft.phoneNumber,
    nonMollureClientType,
    nonMollureDraft,
    paymentMethod,
    selectedClient?.email,
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
    uniqueItemSelectionDraft,
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
    resetToDefaultTeamMember();
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

  const getBusyFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const busy: Interval[] = [];
      for (const e of events) {
        if (e.date !== iso) continue;
        // Cancelled slots stay visually shown but are free to rebook.
        if (e.status === "Cancelled") continue;
        const segments = expandCalendarEventToChronologicalSegments(e);
        for (const segment of segments) {
          const assignedId = String(segment.resourceId || e.resourceId);
          const belongs =
            assignedId === String(resourceId) ||
            (resourceId === fallbackTeamMemberId &&
              !eventHasKnownTeamAssignment(e, knownTeamMemberIds) &&
              assignedId === String(e.resourceId));
          if (!belongs) continue;
          busy.push({
            startMin: minutesSinceMidnight(segment.start),
            endMin: minutesSinceMidnight(segment.end),
          });
        }
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
    const span = getBookingTimedSpanMins({
      bookingStart: selectedSlot?.start,
      requesterPerson: {
        id: "client",
        name: selectedClient?.name ?? "Client",
        isRequester: true,
      },
      mainServices: selectedServices,
      guests: bookingGuests.map((guest) => ({
        person: {
          id: guest.id,
          name: guest.name,
          participantType: guest.participantType,
          planningActivity: guest.planningActivity,
          planningDuration: guest.planningDuration,
          planningStartTime: guest.planningStartTime,
          planningEndTime: guest.planningEndTime,
          bufferStartTime: guest.bufferStartTime,
          bufferEndTime: guest.bufferEndTime,
          bufferTeamMemberId: guest.bufferTeamMemberId,
        },
        services: guest.services,
      })),
    });
    if (span > 0) return span;
    const fromServices = selectedServices.reduce(
      (sum, service) => sum + (service.durationMins || 0),
      0,
    );
    const fromGuests = bookingGuests.reduce((sum, guest) => {
      const serviceMins = guest.services.reduce(
        (inner, service) => inner + (service.durationMins || 0),
        0,
      );
      const planningMins =
        parseDurationMinsLabel(guest.planningDuration) ??
        (guest.planningStartTime && guest.planningEndTime
          ? minutesSinceMidnight(guest.planningEndTime) -
            minutesSinceMidnight(guest.planningStartTime)
          : guest.bufferStartTime && guest.bufferEndTime
            ? minutesSinceMidnight(guest.bufferEndTime) -
              minutesSinceMidnight(guest.bufferStartTime)
            : 0);
      return sum + serviceMins + Math.max(0, planningMins);
    }, 0);
    const total = fromServices + fromGuests;
    return total > 0 ? total : grid.stepMinutes;
  }, [
    bookingGuests,
    grid.stepMinutes,
    selectedClient?.name,
    selectedServices,
    selectedSlot?.start,
  ]);

  const drawerChronologicalBlocks = React.useMemo(
    () =>
      buildDrawerChronologicalBlocks({
        bookingStart: selectedSlot?.start,
        requesterPerson: {
          id: "client",
          name: selectedClient?.name ?? "Client",
          isRequester: true,
        },
        mainServices: selectedServices,
        guests: bookingGuests,
      }),
    [bookingGuests, selectedClient?.name, selectedServices, selectedSlot?.start],
  );

  const primaryMainClientServices = React.useMemo(() => {
    const firstMainBlock = drawerChronologicalBlocks.find(
      (block) => block.isMainClient,
    );
    return firstMainBlock?.services ?? selectedServices;
  }, [drawerChronologicalBlocks, selectedServices]);

  const additionalDrawerBlocks = React.useMemo(
    () =>
      drawerChronologicalBlocks.filter(
        (block) => !block.isMainClient || block.blockIndex > 0,
      ),
    [drawerChronologicalBlocks],
  );

  const chronologicalDrawerGuests = React.useMemo(
    () => sortCalendarGuestsByStartTime(bookingGuests),
    [bookingGuests],
  );

  const hasScheduleAvailabilityOnDate = React.useCallback(
    (isoDate: string, resourceId?: string) => {
      const id = resourceId || activeResource?.id || data.resources[0]?.id;
      if (!id) return false;
      return getAvailabilityFor(id, isoDate).length > 0;
    },
    [activeResource?.id, data.resources, getAvailabilityFor],
  );

  const drawerAvailableTimeSlots = React.useMemo(() => {
    if (!selectedSlot?.resourceId || !selectedSlot.date) {
      return [] as Array<{ time: string; disabled: boolean }>;
    }

    const date = selectedSlot.date;
    const hourWindows = slotLocation
      ? getLocationAvailability(selectedSlot.resourceId, date, slotLocation)
      : [];
    const resolvedWindows = hourWindows.length
      ? hourWindows
      : getAvailabilityFor(selectedSlot.resourceId, date);

    // Professional has not set hours/availability for this date.
    if (!resolvedWindows.length) {
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

    const slots: Array<{ time: string; disabled: boolean }> = [];
    for (const hours of resolvedWindows) {
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
        // Add → Booking can pick any open slot today, including earlier times.
        slots.push({ time: fmtMinToTime(min), disabled: isPastDate });
      }
    }
    return slots;
  }, [
    drawerBookingDurationMins,
    editingEventId,
    getAvailabilityFor,
    getBusyFor,
    getLocationAvailability,
    grid.stepMinutes,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.resourceId,
    selectedSlot?.start,
    slotLocation,
    todayIso,
  ]);

  const drawerSelectableTimes = React.useMemo(
    () =>
      drawerAvailableTimeSlots
        .filter((slot) => !slot.disabled)
        .map((slot) => slot.time),
    [drawerAvailableTimeSlots],
  );

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

    const date = selectedSlot.date;
    const locationWindows = slotLocation
      ? getLocationAvailability(resourceId, date, slotLocation)
      : [];
    const hourWindows = locationWindows.length
      ? locationWindows
      : getAvailabilityFor(resourceId, date);
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
    for (const hours of hourWindows) {
      for (
        let min = hours.startMin;
        min < hours.endMin;
        min += grid.stepMinutes
      ) {
        if (isPastDate) continue;
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
    drawerBookingDurationMins,
    editingEventId,
    getAvailabilityFor,
    getBusyFor,
    getLocationAvailability,
    grid.stepMinutes,
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
      const newStart = fmtMinToTime(minutesSinceMidnight(startTime));
      const [nextSelectedServices, ...nextGuestServiceGroups] =
        recalculateGroupedServiceStartEndTimes(
          [selectedServices, ...bookingGuests.map((guest) => guest.services)],
          newStart,
        );
      const nextGuests = bookingGuests.map((guest, index) => ({
        ...guest,
        services: nextGuestServiceGroups[index] ?? [],
      }));
      const allServices = [
        ...nextSelectedServices,
        ...nextGuests.flatMap((guest) => guest.services),
      ];

      if (allServices.length > 0) {
        const overridePatch: Record<
          string,
          Partial<BookingServiceLineItem>
        > = {};
        for (const service of allServices) {
          overridePatch[service.id] = lineItemToOverride(service);
        }
        setServiceOverridesDraft((prev) => ({ ...prev, ...overridePatch }));
        setSelectedServices(nextSelectedServices);
        setBookingGuests(nextGuests);
      }

      const durationMins =
        allServices.reduce(
          (sum, service) => sum + (service.durationMins || 0),
          0,
        ) || drawerBookingDurationMins;
      const start = minutesSinceMidnight(newStart);
      const end = start + durationMins;
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start: newStart,
              end: fmtMinToTime(end),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    },
    [
      bookingGuests,
      drawerBookingDurationMins,
      isViewingExisting,
      selectedServices,
      selectedSlot,
    ],
  );

  const getDailyBookingRatio = React.useCallback(
    (resourceId: string, iso: string) => {
      const busy = getBusyFor(resourceId, iso);
      const bookedMins = sumIntervalsMins(mergeIntervals(busy));
      const availability = getAvailabilityFor(resourceId, iso);
      const availableMins = sumIntervalsMins(availability);
      if (availableMins <= 0) {
        return bookedMins > 0 ? 1 : 0;
      }
      return Math.max(0, Math.min(1, bookedMins / availableMins));
    },
    [getAvailabilityFor, getBusyFor],
  );

  /**
   * Client-like “most available” pick: lowest day occupancy, free at the slot.
   * Falls back to lowest occupancy when nobody is free (still assign someone).
   */
  const pickMostAvailableTeamMemberId = React.useCallback(
    (
      dateIso: string,
      startMin: number,
      durationMins: number,
      extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
    ): string => {
      const candidates = [...data.resources].sort((a, b) => {
        const diff =
          getDailyBookingRatio(a.id, dateIso) -
          getDailyBookingRatio(b.id, dateIso);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      if (!candidates.length) return "";

      const endMin = startMin + Math.max(1, durationMins || 0);
      const free = candidates.find((resource) => {
        const locationWindows = slotLocation
          ? getLocationAvailability(resource.id, dateIso, slotLocation)
          : [];
        const working = locationWindows.length
          ? locationWindows
          : getAvailabilityFor(resource.id, dateIso);
        if (!working.length) return false;
        const withinWorking = working.some(
          (window) => startMin >= window.startMin && endMin <= window.endMin,
        );
        if (!withinWorking) return false;
        const busy = [
          ...getBusyFor(resource.id, dateIso),
          ...(extraBusyByMember?.get(resource.id) ?? []),
        ];
        return !busy.some((interval) =>
          intervalsOverlap({ startMin, endMin }, interval),
        );
      });
      return free?.id ?? candidates[0]?.id ?? "";
    },
    [
      data.resources,
      getAvailabilityFor,
      getBusyFor,
      getDailyBookingRatio,
      getLocationAvailability,
      slotLocation,
    ],
  );

  const teamNavMemberCount = teamNavResources.length;
  const teamNavNeedsScroll = teamNavMemberCount > TEAM_NAV_VISIBLE_SLOTS;
  const teamNavScrollContentWidth = teamNavNeedsScroll
    ? `calc(100% * ${teamNavMemberCount} / ${TEAM_NAV_VISIBLE_SLOTS})`
    : "100%";
  const teamNavGridTemplateColumns =
    teamNavMemberCount > 0
      ? `repeat(${teamNavMemberCount}, minmax(0, 1fr))`
      : "1fr";
  const teamNavScrollOverflowSx = {
    overflowX: teamNavNeedsScroll ? ("auto" as const) : ("hidden" as const),
    overflowY: "hidden" as const,
    WebkitOverflowScrolling: "touch" as const,
    ...(teamNavNeedsScroll
      ? {
          scrollbarWidth: "thin" as const,
          "&::-webkit-scrollbar": {
            height: 8,
            display: "block",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: alpha(m.navy, 0.06),
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(m.navy, 0.32),
            borderRadius: "999px",
          },
        }
      : {
          scrollbarWidth: "none" as const,
          "&::-webkit-scrollbar": { display: "none" },
        }),
  };

  const dayViewMemberColumns = dayViewMemberColumnSource;

  const weekTeamHeaderScrollRef = React.useRef<HTMLDivElement>(null);
  const [weekTeamHeaderScrollEdges, setWeekTeamHeaderScrollEdges] =
    React.useState({
      canLeft: false,
      canRight: false,
    });

  const refreshHorizontalScrollEdges = React.useCallback(
    (
      el: HTMLDivElement | null,
      setter: React.Dispatch<
        React.SetStateAction<{ canLeft: boolean; canRight: boolean }>
      >,
    ) => {
      if (!el) {
        setter({ canLeft: false, canRight: false });
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      setter({
        canLeft: el.scrollLeft > 2,
        canRight: maxScroll > 2 && el.scrollLeft < maxScroll - 2,
      });
    },
    [],
  );

  const refreshWeekTeamHeaderScrollEdges = React.useCallback(() => {
    refreshHorizontalScrollEdges(
      weekTeamHeaderScrollRef.current,
      setWeekTeamHeaderScrollEdges,
    );
  }, [refreshHorizontalScrollEdges]);

  React.useEffect(() => {
    const el = weekTeamHeaderScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => refreshWeekTeamHeaderScrollEdges());
    observer.observe(el);
    refreshWeekTeamHeaderScrollEdges();
    return () => observer.disconnect();
  }, [teamNavResources, teamNavScrollContentWidth, refreshWeekTeamHeaderScrollEdges]);

  const scrollTeamNav = React.useCallback(
    (el: HTMLDivElement | null, direction: -1 | 1) => {
      if (!el) return;
      const step = el.clientWidth / TEAM_NAV_VISIBLE_SLOTS;
      el.scrollBy({ left: direction * step, behavior: "smooth" });
    },
    [],
  );

  const scrollWeekTeamHeader = React.useCallback(
    (direction: -1 | 1) => {
      scrollTeamNav(weekTeamHeaderScrollRef.current, direction);
    },
    [scrollTeamNav],
  );

  const weekDayCount = visibleDates.length;
  const weekDaysViewportRef = React.useRef<HTMLDivElement>(null);
  const weekDaysScrollRef = React.useRef<HTMLDivElement>(null);
  const [weekDaysVisibleSlots, setWeekDaysVisibleSlots] =
    React.useState(weekDayCount);
  const [weekDaysScrollEdges, setWeekDaysScrollEdges] = React.useState({
    canLeft: false,
    canRight: false,
  });

  const refreshWeekDaysScrollEdges = React.useCallback(() => {
    refreshHorizontalScrollEdges(
      weekDaysScrollRef.current,
      setWeekDaysScrollEdges,
    );
  }, [refreshHorizontalScrollEdges]);

  const updateWeekDaysLayout = React.useCallback(() => {
    const viewport = weekDaysViewportRef.current;
    if (!viewport || weekDayCount <= 0) {
      setWeekDaysVisibleSlots(1);
      refreshWeekDaysScrollEdges();
      return;
    }
    const slots = Math.min(
      weekDayCount,
      Math.max(1, Math.floor(viewport.clientWidth / WEEK_DAY_MIN_PX)),
    );
    setWeekDaysVisibleSlots(slots);
    refreshWeekDaysScrollEdges();
  }, [refreshWeekDaysScrollEdges, weekDayCount]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    const viewport = weekDaysViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => updateWeekDaysLayout());
    observer.observe(viewport);
    updateWeekDaysLayout();
    return () => observer.disconnect();
  }, [
    displayedResources.length,
    updateWeekDaysLayout,
    viewMode,
    weekDayCount,
  ]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    refreshWeekDaysScrollEdges();
  }, [
    refreshWeekDaysScrollEdges,
    viewMode,
    weekDayCount,
    weekDaysVisibleSlots,
  ]);

  React.useLayoutEffect(() => {
    if (viewMode !== "week") return;
    const scroller = weekDaysScrollRef.current;
    if (!scroller) return;
    const active = scroller.querySelector('[aria-pressed="true"]');
    if (!(active instanceof HTMLElement)) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < scroller.scrollLeft) {
      scroller.scrollTo({ left, behavior: "smooth" });
      return;
    }
    if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({
        left: right - scroller.clientWidth,
        behavior: "smooth",
      });
    }
  }, [activeDateIso, viewMode, weekDaysVisibleSlots]);

  const weekDaysNeedScroll = weekDayCount > weekDaysVisibleSlots;
  const weekDaysScrollContentWidth = weekDaysNeedScroll
    ? `calc(100cqw * ${weekDayCount} / ${weekDaysVisibleSlots})`
    : "100%";
  const weekDaysGridTemplateColumns =
    weekDayCount > 0
      ? weekDaysNeedScroll
        ? `repeat(${weekDayCount}, calc(100cqw / ${weekDaysVisibleSlots}))`
        : `repeat(${weekDayCount}, minmax(0, 1fr))`
      : "1fr";
  const weekDaysScrollOverflowSx = {
    overflowX: weekDaysNeedScroll ? ("auto" as const) : ("hidden" as const),
    overflowY: "hidden" as const,
    WebkitOverflowScrolling: "touch" as const,
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
    "&::-webkit-scrollbar": { display: "none" },
  };

  const scrollWeekDays = React.useCallback(
    (direction: -1 | 1) => {
      const el = weekDaysScrollRef.current;
      if (!el) return;
      const step = el.clientWidth / Math.max(1, weekDaysVisibleSlots);
      el.scrollBy({ left: direction * step, behavior: "smooth" });
    },
    [weekDaysVisibleSlots],
  );

  const teamNavArrowWidthPx = 28;

  const renderTeamMemberScrollButton = (
    direction: "left" | "right",
    onClick: () => void,
    disabled: boolean,
    label: string,
  ) => (
    <IconButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: teamNavArrowWidthPx,
        minWidth: teamNavArrowWidthPx,
        maxWidth: teamNavArrowWidthPx,
        height: "100%",
        minHeight: laneHeaderPx,
        p: "0 !important",
        m: 0,
        borderRadius: 0,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: alpha(m.navy, 0.58),
        bgcolor: "#fff",
        flexShrink: 0,
        borderRight:
          direction === "left"
            ? `1px solid ${alpha(m.navy, 0.08)}`
            : "none",
        borderLeft:
          direction === "right"
            ? `1px solid ${alpha(m.navy, 0.08)}`
            : "none",
        "&.Mui-disabled": {
          opacity: 1,
          color: alpha(m.navy, 0.28),
        },
        "& .MuiSvgIcon-root": {
          fontSize: 22,
          display: "block",
        },
      }}
    >
      {direction === "left" ? (
        <ChevronLeftRoundedIcon />
      ) : (
        <ChevronRightRoundedIcon />
      )}
    </IconButton>
  );

  const timeColumnAvailability = React.useMemo(() => {
    if (viewMode !== "day") return [];
    const members = dayViewMemberColumnSource.length
      ? dayViewMemberColumnSource
      : activeResource
        ? [activeResource]
        : [];
    const intervals: Interval[] = [];
    for (const member of members) {
      intervals.push(...getFilteredAvailabilityFor(member.id, activeDateIso));
    }
    return mergeIntervals(intervals);
  }, [
    activeDateIso,
    activeResource,
    dayViewMemberColumnSource,
    getFilteredAvailabilityFor,
    viewMode,
  ]);

  const addMenuBookingResourceId = React.useMemo(
    () =>
      activeResource?.id ??
      selectedResourceId ??
      data.resources[0]?.id ??
      "",
    [activeResource?.id, data.resources, selectedResourceId],
  );

  /** Add → Booking disabled when the selected team member has no Schedule that day. */
  const isAddMenuBookingDisabled = !hasScheduleAvailabilityOnDate(
    activeDateIso,
    addMenuBookingResourceId,
  );

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

  const renderTeamMemberNavScrollArea = (
    scrollRef: React.RefObject<HTMLDivElement | null>,
    onScroll: () => void,
  ) => {
    const focusedId = selectedResourceId || activeResource?.id;
    const isHighlighted = (resourceId: string) => {
      if (splitScreen) {
        return (
          resourceId === splitScreen.primaryId ||
          resourceId === splitScreen.partnerId
        );
      }
      return String(resourceId) === String(focusedId);
    };

    return (
      <Box
        ref={scrollRef}
        onScroll={onScroll}
        sx={{
          ...teamNavScrollOverflowSx,
          flex: 1,
          minWidth: 0,
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: teamNavGridTemplateColumns,
            width: teamNavScrollContentWidth,
            minWidth: "100%",
          }}
        >
          {teamNavResources.map((resource, colIdx) => (
            <Box
              key={resource.id}
              sx={{
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                px: 1,
                borderLeft:
                  colIdx > 0
                    ? `1px solid ${alpha(m.navy, 0.07)}`
                    : undefined,
              }}
            >
              <CalendarTeamMemberBadge
                name={resource.name}
                avatarText={resource.avatarText}
                photoSrc={resource.photoSrc}
                bookedPercent={
                  getDailyBookingRatio(resource.id, activeDateIso) * 100
                }
                selected={isHighlighted(resource.id)}
                onClick={(anchor) =>
                  handleTeamMemberBadgeClick(
                    resource.id,
                    anchor,
                    isHighlighted(resource.id),
                  )
                }
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderTeamMemberNavBar = ({
    scrollRef,
    onScroll,
    onScrollLeft,
    onScrollRight,
    canScrollLeft,
    canScrollRight,
    spanFullGrid = false,
  }: {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    onScrollLeft: () => void;
    onScrollRight: () => void;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    spanFullGrid?: boolean;
  }) => {
    const arrowReservePx = 0;

    return (
      <Box
        sx={{
          position: "relative",
          minHeight: laneHeaderPx + (teamNavNeedsScroll ? TEAM_NAV_SCROLLBAR_PX : 0),
          height: laneHeaderPx + (teamNavNeedsScroll ? TEAM_NAV_SCROLLBAR_PX : 0),
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
          width: "100%",
          minWidth: 0,
          ...(spanFullGrid ? { gridColumn: "1 / -1" } : null),
        }}
      >
        <Box sx={{ px: `${arrowReservePx}px`, height: "100%" }}>
          {renderTeamMemberNavScrollArea(scrollRef, onScroll)}
        </Box>
      </Box>
    );
  };

  const renderTeamMemberHeader = () =>
    renderTeamMemberNavBar({
      scrollRef: weekTeamHeaderScrollRef,
      onScroll: refreshWeekTeamHeaderScrollEdges,
      onScrollLeft: () => scrollWeekTeamHeader(-1),
      onScrollRight: () => scrollWeekTeamHeader(1),
      canScrollLeft: weekTeamHeaderScrollEdges.canLeft,
      canScrollRight: weekTeamHeaderScrollEdges.canRight,
    });

  const renderSplitScreenBanner = () => {
    if (!splitScreenMembers) return null;

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.25,
          py: 0.65,
          bgcolor: alpha(m.teal, 0.06),
          borderBottom: `1px solid ${alpha(m.teal, 0.14)}`,
        }}
      >
        <BodyText
          sx={{
            fontWeight: 700,
            fontSize: 11.5,
            color: alpha(m.navy, 0.72),
          }}
        >
          Split view: {splitScreenMembers.primary.name} &{" "}
          {splitScreenMembers.partner.name}
        </BodyText>
        <ButtonBase
          onClick={discardSplitScreen}
          aria-label="Discard split screen"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.45,
            px: 0.85,
            py: 0.35,
            borderRadius: "999px",
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            bgcolor: "#fff",
            "&:hover": { bgcolor: alpha(m.navy, 0.03) },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14, color: alpha(m.navy, 0.62) }} />
          <BodyText
            sx={{
              fontWeight: 700,
              fontSize: 11,
              color: alpha(m.navy, 0.72),
            }}
          >
            Discard split screen
          </BodyText>
        </ButtonBase>
      </Box>
    );
  };

  const openTeamMemberAvailabilityEditor = React.useCallback(() => {
    if (!teamMenuResource) return;
    const intervals = getCombinedAvailabilityIntervals(
      teamMenuResource.id,
      activeDateIso,
      scheduleRows,
      dateOverrides ?? [],
    );
    const shifts =
      intervals.length > 0
        ? intervals.map((interval) => ({
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
  }, [
    activeDateIso,
    closeTeamMenu,
    data.supportedLocations,
    dateOverrides,
    scheduleRows,
    teamMenuResource,
  ]);

  const openBookingDrawer = React.useCallback(
    (payload: SelectedSlot, options?: { allowTimeSelection?: boolean }) => {
      const allowTimeSelection = Boolean(options?.allowTimeSelection);
      setSelectedSlot(payload);
      setSlotDrawerTab("booking");
      setSlotBookingScreen("new-booking");
      setSlotLocation(data.supportedLocations[0] ?? "FL");
      setSlotBookingType("Online");
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
      setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setUniqueItemOrigin("unique");
      setEditingCatalogProductId(null);
      setPendingCatalogDelete(null);
      setBookingUniqueItems([]);
      setCustomBookingProducts([]);
      setEditingBookingLine(null);
      setEditingEventId(null);
      setIsEditingExisting(false);
      setBookingGuests([]);
      setShowInlineGuestField(false);
      setEditingInlineGuestId(null);
      setInlineGuestDraft(emptyInlineGuestDraft);
      setInlineGuestParticipantType("guest");
      staffConflictAckRef.current = false;
      setBookingProjectEnabled(false);
      setBookingProjectDescription("");
      setBookingProjectUploads([]);
      setBookingTotalDiscount(null);
      setBookingDiscountModalOpen(false);
      setShowLateCancellation(false);
      setLateCancellationFeePercent("");
      setLateCancellationFeePercentCeiling("");
      setShowLateRescheduling(false);
      setLateRescheduleFeePercent(lateRescheduleFeePercentDefault ?? "");
      setLateRescheduleFeePercentCeiling("");
      setShowNoShowFee(false);
      setNoShowFeePercent("");
      setNoShowFeePercentCeiling("");
      setCancellationFeeAt(undefined);
      setExceededCancellationWindow(undefined);
      setShowInternalNote(false);
      setBookingInternalNote("");
      setShowPrepayment(false);
      setPrepaymentPercent("");
      setPaymentMethod("online");
      setShowKilometerAllowance(false);
      setKilometerAllowanceDraft({ eurPerKm: "", totalKilometer: "" });
      setDesiredLocationDraft(emptyDesiredLocation());
      setInlineGuestDraft(emptyInlineGuestDraft);
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
      setDiscardErOpen(false);
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
    clearBookingDrawerNotListedHint();
    const parentId = resolveParentCalendarEventId(ev.id);
    const resolved =
      events.find((item) => item.id === parentId) ??
      (parentId !== ev.id ? { ...ev, id: parentId } : ev);
    const hydration = hydrateBookingDrawerFromEvent(resolved);

    setSelectedSlot({
      resourceId: resolved.resourceId,
      date: resolved.date,
      start: resolved.start,
      end: resolved.end,
      freeStart: resolved.start,
      freeEnd: resolved.end,
    });
    setSlotDrawerTab("booking");
    setSlotBookingScreen("new-booking");
    setSlotLocation(ev.location);
    setSlotBookingType(ev.bookingType ?? "Online");
    setSlotClientAdded(true);
    setAllowDrawerTimeSelection(false);
    setSlotCalendarOpen(false);
    setSlotCalendarTouched(true);
    const hydratedEmail = String(hydration.clientEmail ?? "")
      .trim()
      .toLowerCase();
    setSelectedClient({
      name: ev.showClientName ?? "Client",
      email: hydration.clientEmail,
      mollureUserId: ev.details?.customerId ?? null,
      clientKind:
        ev.clientKind ??
        ev.details?.clientKind ??
        (hydratedEmail
          ? clientOptions.find(
              (c) => c.email.trim().toLowerCase() === hydratedEmail,
            )?.clientKind
          : undefined),
    });
    if (ev.details?.customerId) {
      setAddClientSource("client-list");
    } else if (ev.bookingType === "Offline" && !String(hydration.clientEmail ?? "").trim()) {
      setAddClientSource("guest");
    } else if (ev.bookingType === "Offline") {
      setAddClientSource("non-mollure");
    } else {
      setAddClientSource("client-list");
    }
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
    setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemOrigin("unique");
    setEditingCatalogProductId(null);
    setPendingCatalogDelete(null);
    setCustomBookingProducts([]);
    setEditingBookingLine(null);
      setBookingGuests(hydration.guests);
      setShowInlineGuestField(false);
      {
        const snap = resolved.details?.clientSnapshot;
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
                email: person.email,
                phoneCode: person.phoneCode,
                phoneNumber: person.phoneNumber,
                services: (snap.services ?? [])
                  .filter(
                    (service) =>
                      String(service.guestId ?? "").trim() === String(person.id),
                  )
                  .map((service) => ({
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    durationMins: service.durationMins,
                    staffResourceId: service.teamMemberId ?? undefined,
                    guestId: service.guestId ?? person.id,
                  })),
                products: (resolved.details?.products ?? []).filter(
                  (product) =>
                    String(product.guestId ?? "").trim() === String(person.id),
                ),
                participantType: person.participantType ?? "guest",
                planningActivity: person.planningActivity,
                planningDuration: person.planningDuration,
                planningStartTime: person.planningStartTime,
                planningEndTime: person.planningEndTime,
                bufferTeamMemberId: person.bufferTeamMemberId,
                bufferStartTime: person.bufferStartTime,
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
    setLateCancellationFeePercentCeiling(
      hydration.lateCancellationFeePercentCeiling,
    );
    setShowLateRescheduling(hydration.showLateRescheduling);
    setLateRescheduleFeePercent(hydration.lateRescheduleFeePercent);
    setLateRescheduleFeePercentCeiling(
      hydration.lateRescheduleFeePercentCeiling,
    );
    setShowNoShowFee(hydration.showNoShowFee);
    setNoShowFeePercent(hydration.noShowFeePercent);
    setNoShowFeePercentCeiling(hydration.noShowFeePercentCeiling);
    setCancellationFeeAt(resolved.details?.cancellationFeeAt);
    setExceededCancellationWindow(resolved.details?.exceededCancellationWindow);
    setShowInternalNote(hydration.showInternalNote);
    setBookingInternalNote(hydration.internalNote);
    setBookingTotalDiscount(hydration.totalDiscount);
    setBookingDiscountModalOpen(false);
    setShowKilometerAllowance(hydration.showKilometerAllowance);
    setKilometerAllowanceDraft(hydration.kilometerAllowance);
    setEditingEventId(resolved.id);
    setSlotStatus(resolved.status);
    setIsEditingExisting(false);
    setIncomingRequestEditMode(false);
    setOriginalServicesSnapshot([
      ...resolveOriginalServices(resolved, hydration.services),
      ...hydration.guests.flatMap((guest) => guest.services),
    ]);
    setSlotSaveAttempted(false);
    setAddMenuTarget("client");
    setSelectionTarget("client");
    setSlotAddMenuAnchor(null);
    setBookingMoreAnchor(null);
    setSlotDrawerOpen(true);
    lastLiveHydratedEventKeyRef.current = bookingEventLiveKey(resolved);
    markBookingUpdateSeen(
      "professional",
      resolved.bookingCode ?? extractBookingId(resolved.id),
      resolved.updatedAt,
    );
  }, [bookingEventLiveKey, clearBookingDrawerNotListedHint, clientOptions, events]);

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
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    restoreIncomingActions,
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
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to reject edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    restoreIncomingActions,
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

  const handleDiscardConfirmedEr = React.useCallback(async () => {
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
      const details = { ...(viewingBookingEvent.details ?? {}) };
      delete details.requestDirection;
      const nextNotes = serializeCalendarEntryNotes(
        details.internalNote ?? "",
        details,
        parseStoredEbrFromNotes(viewingBookingEvent.notes),
        null,
      );
      await persistEventStatus(editingEventId, "Confirmed", {
        notes: nextNotes,
      });
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "Confirmed",
                bookingScenario: undefined,
                notes: nextNotes,
                details,
              }
            : event,
        ),
      );
      showSnackbar({
        severity: "success",
        message: "Edit request discarded.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to discard edit request."),
      });
    }
  }, [
    editingEventId,
    manageBookingEditRequest,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleRestartResponseTime = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const details = viewingBookingEvent.details ?? {};
    const deadline = restartResponseDeadline(
      details,
      businessResponseWindowInput,
    );
    if (!deadline) {
      showSnackbar({
        severity: "info",
        message: "No response time is configured for this business.",
      });
      return;
    }
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
    businessResponseWindowInput,
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
      ackRecipient: undefined,
    };
    const nextNotes = serializeCalendarEntryNotes(
      nextDetails.internalNote ?? "",
      nextDetails,
      parseStoredEbrFromNotes(current?.notes),
      parseStoredErFromNotes(current?.notes),
    );
    const parsed = parseApiCalendarEventId(editingEventId);
    try {
      if (parsed?.kind === "booking" && onUpdateBookingStatus) {
        await onUpdateBookingStatus(parsed.id, "confirmed", {
          notes: nextNotes ?? undefined,
        });
      } else {
        await persistEventStatus(editingEventId, "Confirmed", {
          notes: nextNotes,
        });
      }
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
              status: "Confirmed",
              bookingScenario: undefined,
              notes: nextNotes,
              details: {
                ...(event.details ?? {}),
                needsOk: false,
                ackScenario: undefined,
                ackRecipient: undefined,
              },
            }
          : event,
      ),
    );
    setSlotStatus("Confirmed");
    showSnackbar({
      severity: "success",
      message: "Booking request acknowledged.",
    });
  }, [
    editingEventId,
    events,
    onUpdateBookingStatus,
    persistEventStatus,
    showSnackbar,
    viewingBookingEvent,
  ]);

  const handleAcceptIncomingRequest = React.useCallback(async () => {
    if (!editingEventId || !viewingBookingEvent) return;
    const parsed = parseApiCalendarEventId(editingEventId);
    const prepayRequired =
      showPrepayment &&
      ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0);
    const prepayPaid = isDrawerPrepaymentPaid || drawerPaymentIsOffline;
    const ackScenario =
      viewingBookingEvent.bookingScenario === "EBR" ? "EBR" : "BR";
    const ackDetails = buildAcceptAckDetails({
      prepayRequired,
      prepayPaid,
      requestDirection: viewingBookingEvent.details?.requestDirection ?? "incoming",
      ackScenario,
      base: viewingBookingEvent.details,
    });

    if (!parsed || parsed.kind !== "booking" || !onUpdateBookingStatus) {
      const nextNotes = serializeCalendarEntryNotes(
        ackDetails.internalNote ?? "",
        ackDetails,
        parseStoredEbrFromNotes(viewingBookingEvent.notes),
        parseStoredErFromNotes(viewingBookingEvent.notes),
      );
      try {
        await persistEventStatus(editingEventId, "BR Accepted", {
          notes: nextNotes,
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to accept booking request.",
          ),
        });
        restoreIncomingActions();
        return;
      }
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                status: "BR Accepted",
                bookingScenario: ackDetails.needsOk ? ackScenario : undefined,
                notes: nextNotes,
                details: ackDetails,
              }
            : event,
        ),
      );
      setSlotStatus("BR Accepted");
      setIncomingRequestEditMode(false);
      setIsEditingExisting(false);
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
          guestId: null as string | null,
        })),
        ...bookingUniqueItems.map((product) => ({
          ...product,
          guestId: null as string | null,
        })),
        ...bookingGuests.flatMap((guest) =>
          guest.products.map((product) => ({
            ...product,
            guestId: guest.id,
          })),
        ),
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
      // Suggested schedule wins: re-sequence the lines from the accepted start.
      const resolvedSuggestedServices =
        suggestedStart && suggestedServices?.length
          ? recalculateServiceStartEndTimes(suggestedServices, suggestedStart)
          : suggestedServices;
      const originalServices =
        viewingBookingEvent.details?.originalServices ??
        viewingBookingEvent.details?.services ??
        [];
      const lineChanges = detectServiceLineChanges(
        originalServices,
        resolvedSuggestedServices ?? [],
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
          services: resolvedSuggestedServices,
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
            ...(resolvedSuggestedServices?.length
              ? {
                  services: resolvedSuggestedServices.map((s) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    durationMins: s.durationMins,
                    startTime: s.startTime,
                    endTime: s.endTime,
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
        ...(isClientEbr || professionalAddedLines
          ? { total_price: bookingTotalForSave }
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
              ...(resolvedSuggestedServices?.length
                ? { services: resolvedSuggestedServices }
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
    } catch (error) {
      restoreIncomingActions();
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to accept booking request."),
      });
    }
  }, [
    bookingGuests,
    bookingUniqueItems,
    drawerPaymentIsOffline,
    editingEventId,
    isDrawerPrepaymentPaid,
    onUpdateBookingStatus,
    persistEventStatus,
    prepaymentAmount,
    prepaymentPercent,
    restoreIncomingActions,
    selectedProducts,
    selectedServices,
    selectedSlot,
    showPrepayment,
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
        restoreIncomingActions();
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
      } catch (error) {
        restoreIncomingActions();
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
      restoreIncomingActions();
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
  }, [
    editingEventId,
    onUpdateBookingStatus,
    persistEventStatus,
    restoreIncomingActions,
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
    (
      service: BookingCatalogService,
      lineItemOverride?: Partial<BookingServiceLineItem>,
      target: string = selectionTarget,
      origin: "select-services" | "new-booking" = "select-services",
    ) => {
      if (target !== selectionTarget) {
        setSelectionTarget(target);
      }
      const override = {
        ...serviceOverridesDraft[service.id],
        ...lineItemOverride,
      };
      const existingOnBooking =
        target === "client"
          ? selectedServices.find((item) => item.id === service.id)
          : bookingGuests
              .find((guest) => guest.id === target)
              ?.services.find((item) => item.id === service.id);
      const assignedStaff =
        override?.staffResourceId?.trim() ||
        existingOnBooking?.staffResourceId?.trim() ||
        "";
      const timedEnds: Array<{ endTime?: string }> = [
        ...selectedServices.map((service) => ({ endTime: service.endTime })),
        ...bookingGuests.flatMap((guest) => [
          ...guest.services.map((service) => ({ endTime: service.endTime })),
          { endTime: guest.planningEndTime || guest.bufferEndTime },
        ]),
      ];
      const defaultStartAfterPrevious =
        getLatestTimedEnd(timedEnds, selectedSlot?.start) ||
        selectedSlot?.start;
      setServiceEditDraft(
        buildServiceEditDraftFromCatalog(service, {
          override: {
            ...override,
            staffResourceId: assignedStaff || undefined,
          },
          defaultStartTime:
            override?.startTime ??
            existingOnBooking?.startTime ??
            defaultStartAfterPrevious,
          defaultStaffResourceId: assignedStaff,
        }),
      );
      setServiceEditAttempted(false);
      setServiceEditOrigin(origin);
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

  const openEditServiceFromLineItem = React.useCallback(
    (service: BookingServiceLineItem, target: string = selectionTarget) => {
      const catalogService =
        selectableServiceCatalog.find((item) => item.id === service.id) ??
        selectableServiceCatalog.find((item) => item.name === service.name);
      if (!catalogService) return;
      openEditService(
        catalogService,
        {
          staffResourceId: service.staffResourceId,
          startTime: service.startTime,
          endTime: service.endTime,
          durationMins: service.durationMins,
          name: service.name,
          price: service.price,
          priceType: service.priceType,
          discount: service.discount,
        },
        target,
        "new-booking",
      );
    },
    [openEditService, selectableServiceCatalog, selectionTarget],
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
      return sortServicesByStartTime(
        services.map((service) =>
          service.id === lineItem.id ? { ...service, ...lineItem } : service,
        ),
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
    setSlotBookingScreen(serviceEditOrigin);
    void dispatchBookingEventIfApi(editingEventId, "service_edited", {
      initiated_by: "professional",
    });
    return true;
  }, [
    dispatchBookingEventIfApi,
    editingEventId,
    selectableServiceCatalog,
    serviceEditDraft,
    serviceEditOrigin,
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

    const pickedServicesRaw = serviceSelectionDraft
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
          const existing = currentById.get(id);
          // Sequential placement below; preserve staff only unless edited via override.
          return {
            id: catalogService.id,
            name: catalogService.name,
            price: catalogService.price,
            durationMins: catalogService.durationMins,
            staffResourceId: existing?.staffResourceId,
          } satisfies BookingServiceLineItem;
        }
        return currentById.get(id) ?? null;
      })
      .filter((service): service is BookingServiceLineItem => Boolean(service));

    const pickedServices = placeServicesSequentially(
      pickedServicesRaw,
      selectedSlot?.start,
    );

    // Auto-assign most-available team member (client-like):
    // Desired Location → one shared member; Fixed → per service.
    const dateIso = selectedSlot?.date;
    if (dateIso && data.resources.length > 0) {
      const assignOneForAll = slotLocation === "DL";
      const virtualBusy = new Map<string, Interval[]>();

      if (assignOneForAll) {
        const existingShared =
          currentServices.find((service) => service.staffResourceId)
            ?.staffResourceId ||
          pickedServices.find((service) => service.staffResourceId)
            ?.staffResourceId;
        const totalDuration = Math.max(
          1,
          pickedServices.reduce(
            (sum, service) => sum + (service.durationMins || 0),
            0,
          ),
        );
        const startMin = minutesSinceMidnight(
          pickedServices.find((service) => service.startTime)?.startTime ??
            selectedSlot?.start ??
            "00:00",
        );
        const sharedId =
          existingShared ||
          pickMostAvailableTeamMemberId(dateIso, startMin, totalDuration);
        for (let i = 0; i < pickedServices.length; i += 1) {
          if (!pickedServices[i].staffResourceId) {
            pickedServices[i] = {
              ...pickedServices[i],
              staffResourceId: sharedId || undefined,
            };
          }
        }
      } else {
        for (let i = 0; i < pickedServices.length; i += 1) {
          const service = pickedServices[i];
          const duration = Math.max(1, service.durationMins || 0);
          const startMin = minutesSinceMidnight(
            service.startTime ?? selectedSlot?.start ?? "00:00",
          );
          if (service.staffResourceId) {
            const memberId = service.staffResourceId;
            const busy = virtualBusy.get(memberId) ?? [];
            busy.push({ startMin, endMin: startMin + duration });
            virtualBusy.set(memberId, busy);
            continue;
          }
          const memberId = pickMostAvailableTeamMemberId(
            dateIso,
            startMin,
            duration,
            virtualBusy,
          );
          if (memberId) {
            const busy = virtualBusy.get(memberId) ?? [];
            busy.push({ startMin, endMin: startMin + duration });
            virtualBusy.set(memberId, busy);
          }
          pickedServices[i] = {
            ...service,
            staffResourceId: memberId || undefined,
          };
        }
      }
    }

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
    const nextServices = sortServicesByStartTime(Array.from(mergedById.values()));

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
      const last = timedServices[timedServices.length - 1];
      const start = first.startTime!;
      const end =
        last.endTime ||
        addMinutesToTime(
          last.startTime ?? start,
          last.durationMins,
        );
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
    data.resources.length,
    originalServicesSnapshot,
    pickMostAvailableTeamMemberId,
    selectedServices,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.start,
    selectionTarget,
    selectableServiceCatalog,
    serviceOverridesDraft,
    serviceSelectionDraft,
    slotLocation,
  ]);

  const openSelectProducts = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    // Add flow: nothing preselected — only what the user picks is added.
    setProductSelectionDraft(createEmptyProductSelectionDraft());

    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-products");
  }, [addMenuTarget]);

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

    const nextProducts = [...catalogProducts, ...customProducts].filter(
      (product) => !isUniqueItemId(product.id),
    );
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

    // Section 2.9: stamp onto the person's earliest chronological service block.
    const ownerServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);
    const stampedProducts = stampProductsToEarliestBlock(
      mergedProducts,
      ownerServices,
      selectionTarget === "client" ? null : selectionTarget,
    );

    if (selectionTarget === "client") {
      setSelectedProducts(stampedProducts);
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, products: stampedProducts }
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
    selectedServices,
    selectionTarget,
  ]);

  const openSelectUniqueItems = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    setUniqueItemSelectionDraft(createEmptyProductSelectionDraft());
    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-unique-items");
  }, [addMenuTarget]);

  const toggleUniqueItemSelectionDraft = React.useCallback(
    (productId: string) => {
      if (isViewingExisting) return;
      setUniqueItemSelectionDraft((prev) => {
        const current = prev[productId] ?? { selected: false, quantity: 1 };
        return {
          ...prev,
          [productId]: { ...current, selected: !current.selected },
        };
      });
    },
    [isViewingExisting],
  );

  const adjustUniqueItemQuantityDraft = React.useCallback(
    (productId: string, delta: number) => {
      if (isViewingExisting) return;
      setUniqueItemSelectionDraft((prev) => {
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

  const applyUniqueItemSelection = React.useCallback(() => {
    const nextItems = persistedUniqueCatalog
      .filter((item) => uniqueItemSelectionDraft[item.id]?.selected)
      .map((item) => {
        const quantity = uniqueItemSelectionDraft[item.id]?.quantity ?? 1;
        const line = buildBookingProductLine(item, quantity);
        const id = isUniqueItemId(line.id) ? line.id : `unique-${line.id}`;
        return { ...line, id };
      });

    const ownerServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);

    if (selectionTarget === "client") {
      const mergedById = new Map(
        bookingUniqueItems.map((item) => [item.id, item]),
      );
      for (const item of nextItems) {
        mergedById.set(item.id, item);
      }
      setBookingUniqueItems(
        stampProductsToEarliestBlock(
          Array.from(mergedById.values()),
          ownerServices,
          null,
        ),
      );
    } else {
      const current =
        bookingGuests.find((item) => item.id === selectionTarget)?.products ??
        [];
      const mergedById = new Map(current.map((item) => [item.id, item]));
      for (const item of nextItems) {
        mergedById.set(item.id, item);
      }
      const stamped = stampProductsToEarliestBlock(
        Array.from(mergedById.values()),
        ownerServices,
        selectionTarget,
      );
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? { ...guest, products: stamped }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    bookingUniqueItems,
    persistedUniqueCatalog,
    selectedServices,
    selectionTarget,
    uniqueItemSelectionDraft,
  ]);

  const resetUniqueItemForm = React.useCallback(() => {
    setEditingBookingLine(null);
    setEditingCatalogProductId(null);
    setUniqueItemOrigin("unique");
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
  }, []);

  const leaveUniqueItemScreen = React.useCallback(() => {
    if (editingBookingLine) {
      resetUniqueItemForm();
      setSlotBookingScreen("new-booking");
      return;
    }
    const back =
      uniqueItemOrigin === "products"
        ? "select-products"
        : "select-unique-items";
    resetUniqueItemForm();
    setSlotBookingScreen(back);
  }, [editingBookingLine, resetUniqueItemForm, uniqueItemOrigin]);

  const openAddUniqueItem = React.useCallback(
    (origin: "products" | "unique" = "unique") => {
      setEditingBookingLine(null);
      setEditingCatalogProductId(null);
      setUniqueItemOrigin(origin);
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("add-unique-item");
    },
    [],
  );

  const openEditCatalogProduct = React.useCallback(
    (
      product: BookingCatalogProduct,
      origin: "products" | "unique" = "products",
    ) => {
      if (isViewingExisting) return;
      setEditingBookingLine(null);
      setEditingCatalogProductId(product.id);
      setUniqueItemOrigin(origin);
      setUniqueItemDraft(buildUniqueItemDraftFromProduct(product));
      setSlotBookingScreen("add-unique-item");
    },
    [isViewingExisting],
  );

  const draftFromBookingLine = React.useCallback(
    (line: {
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      vat?: string;
      discount?: { type: "fixed" | "percentage"; amount: number } | null;
    }) => {
      const catalogMatch = productCatalog.find((product) => product.id === line.id);
      return buildUniqueItemDraftFromProduct({
        name: getProductBaseName(line.name, line.quantity),
        price: line.unitPrice,
        vat: line.vat ?? catalogMatch?.vat,
        unit: line.quantity,
        discountType: line.discount?.type ?? "fixed",
        discountAmount: line.discount
          ? String(line.discount.amount)
          : "0",
      });
    },
    [productCatalog],
  );

  const openEditBookingProductLine = React.useCallback(
    (
      product: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        vat?: string;
        discount?: { type: "fixed" | "percentage"; amount: number } | null;
      },
      owner: "client" | string,
    ) => {
      if (isViewingExisting && !incomingRequestEditMode) return;
      setUniqueItemOrigin("products");
      setEditingBookingLine({ kind: "product", id: product.id, owner });
      setUniqueItemDraft(draftFromBookingLine(product));
      setSlotBookingScreen("add-unique-item");
    },
    [draftFromBookingLine, incomingRequestEditMode, isViewingExisting],
  );

  const openEditBookingUniqueLine = React.useCallback(
    (
      item: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        vat?: string;
        discount?: { type: "fixed" | "percentage"; amount: number } | null;
      },
      owner: "client" | string = "client",
    ) => {
      if (isViewingExisting && !incomingRequestEditMode) return;
      setEditingCatalogProductId(null);
      setUniqueItemOrigin("unique");
      setEditingBookingLine({ kind: "unique", id: item.id, owner });
      setUniqueItemDraft(draftFromBookingLine(item));
      setSlotBookingScreen("add-unique-item");
    },
    [draftFromBookingLine, incomingRequestEditMode, isViewingExisting],
  );

  const persistBookingUniqueCatalogItem = React.useCallback(
    (product: BookingCatalogProduct) => {
      const payload = toFinanceCatalogProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      });
      setFinanceSettings((prev) => upsertFinanceUniqueItem(prev, payload));
    },
    [setFinanceSettings],
  );

  const persistBookingCatalogProduct = React.useCallback(
    (product: BookingCatalogProduct) => {
      const payload = toFinanceCatalogProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        vat: product.vat,
        unit: product.unit,
        discountType: product.discountType,
        discountAmount: product.discountAmount,
      });
      setFinanceSettings((prev) => upsertFinanceProduct(prev, payload));
    },
    [setFinanceSettings],
  );

  const confirmCatalogDelete = React.useCallback(() => {
    if (!pendingCatalogDelete) return;
    const id = pendingCatalogDelete.id;
    const inProductCatalog = productCatalog.some((product) => product.id === id);
    if (inProductCatalog) {
      setFinanceSettings((prev) => removeFinanceProduct(prev, id));
    } else {
      setFinanceSettings((prev) => removeFinanceUniqueItem(prev, id));
      setCustomBookingProducts((prev) =>
        prev.filter((product) => product.id !== id),
      );
    }
    setProductSelectionDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setUniqueItemSelectionDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPendingCatalogDelete(null);
  }, [pendingCatalogDelete, productCatalog, setFinanceSettings]);

  const applyUniqueItem = React.useCallback(() => {
    // Booking-scoped edit: update only this booking's line, never the master catalog.
    if (editingBookingLine) {
      const line = buildUniqueItemLine(uniqueItemDraft, editingBookingLine.id);
      if (!line) return;

      const ownerServices =
        editingBookingLine.owner === "client"
          ? selectedServices
          : (bookingGuests.find((guest) => guest.id === editingBookingLine.owner)
              ?.services ?? []);
      const [stamped] = stampProductsToEarliestBlock(
        [line],
        ownerServices,
        editingBookingLine.owner === "client" ? null : editingBookingLine.owner,
      );

      if (editingBookingLine.kind === "unique") {
        if (editingBookingLine.owner === "client") {
          setBookingUniqueItems((prev) =>
            prev.map((item) =>
              item.id === editingBookingLine.id ? stamped : item,
            ),
          );
        } else {
          const ownerId = editingBookingLine.owner;
          setBookingGuests((prev) =>
            prev.map((guest) =>
              guest.id === ownerId
                ? {
                    ...guest,
                    products: guest.products.map((product) =>
                      product.id === editingBookingLine.id ? stamped : product,
                    ),
                  }
                : guest,
            ),
          );
        }
      } else if (editingBookingLine.owner === "client") {
        setSelectedProducts((prev) =>
          prev.map((product) =>
            product.id === editingBookingLine.id ? stamped : product,
          ),
        );
      } else {
        const ownerId = editingBookingLine.owner;
        setBookingGuests((prev) =>
          prev.map((guest) =>
            guest.id === ownerId
              ? {
                  ...guest,
                  products: guest.products.map((product) =>
                    product.id === editingBookingLine.id ? stamped : product,
                  ),
                }
              : guest,
          ),
        );
      }

      setEditingBookingLine(null);
      setUniqueItemDraft(emptyBookingUniqueItemDraft());
      setSlotBookingScreen("new-booking");
      setSlotSaveAttempted(false);
      void dispatchBookingEventIfApi(editingEventId, "unique_item_edited", {
        initiated_by: "professional",
      });
      return;
    }

    if (editingCatalogProductId) {
      const next = buildCatalogProductFromUniqueItemDraft(
        uniqueItemDraft,
        editingCatalogProductId,
      );
      if (!next) return;
      const editingProduct = uniqueItemOrigin === "products";
      if (editingProduct) {
        persistBookingCatalogProduct(next);
        setProductSelectionDraft((prev) => {
          const current = prev[next.id];
          if (!current) return prev;
          return {
            ...prev,
            [next.id]: {
              ...current,
              quantity: Math.max(1, next.unit ?? current.quantity),
            },
          };
        });
      } else {
        persistBookingUniqueCatalogItem(next);
        setUniqueItemSelectionDraft((prev) => {
          const current = prev[next.id];
          if (!current) return prev;
          return {
            ...prev,
            [next.id]: {
              ...current,
              quantity: Math.max(1, next.unit ?? current.quantity),
            },
          };
        });
      }
      resetUniqueItemForm();
      setSlotBookingScreen(
        editingProduct ? "select-products" : "select-unique-items",
      );
      setSlotSaveAttempted(false);
      return;
    }

    if (uniqueItemOrigin === "products") {
      const next = buildCatalogProductFromUniqueItemDraft(
        uniqueItemDraft,
        `prod-${Date.now()}`,
      );
      if (!next) return;
      persistBookingCatalogProduct(next);
      setProductSelectionDraft((prev) => ({
        ...prev,
        [next.id]: { selected: true, quantity: Math.max(1, next.unit ?? 1) },
      }));
      resetUniqueItemForm();
      setSlotBookingScreen("select-products");
      setSlotSaveAttempted(false);
      return;
    }

    const next = buildCatalogProductFromUniqueItemDraft(
      uniqueItemDraft,
      `unique-${Date.now()}`,
    );
    if (!next) return;
    persistBookingUniqueCatalogItem(next);
    setUniqueItemSelectionDraft((prev) => ({
      ...prev,
      [next.id]: { selected: true, quantity: Math.max(1, next.unit ?? 1) },
    }));
    resetUniqueItemForm();
    setSlotBookingScreen("select-unique-items");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    dispatchBookingEventIfApi,
    editingBookingLine,
    editingCatalogProductId,
    editingEventId,
    persistBookingCatalogProduct,
    persistBookingUniqueCatalogItem,
    resetUniqueItemForm,
    selectedServices,
    uniqueItemDraft,
    uniqueItemOrigin,
  ]);

  const isBookingDetailsSubScreen =
    slotBookingScreen === "select-services" ||
    slotBookingScreen === "edit-service" ||
    slotBookingScreen === "select-products" ||
    slotBookingScreen === "select-unique-items" ||
    slotBookingScreen === "add-unique-item" ||
    slotBookingScreen === "add-buffer";

  const uniqueItemFlowIsProduct =
    uniqueItemOrigin === "products" || editingBookingLine?.kind === "product";
  const uniqueItemFlowTitle = editingBookingLine || editingCatalogProductId
    ? uniqueItemFlowIsProduct
      ? "Edit Product"
      : "Edit Unique Item"
    : uniqueItemFlowIsProduct
      ? "Add Product"
      : "Add Unique Item";
  const uniqueItemFlowNamePlaceholder = uniqueItemFlowIsProduct
    ? "Product Name"
    : "Unique Name";

  const serviceEditErrors = React.useMemo(
    () =>
      serviceEditAttempted ? getBookingServiceEditErrors(serviceEditDraft) : {},
    [serviceEditAttempted, serviceEditDraft],
  );

  const addInlineGuest = React.useCallback(() => {
    const guestName =
      `${inlineGuestDraft.firstName.trim()} ${inlineGuestDraft.lastName.trim()}`.trim();
    const email = inlineGuestDraft.email.trim();
    const phoneCode = inlineGuestDraft.phoneCode;
    const phoneNumber = inlineGuestDraft.phoneNumber.trim();
    const phoneErrors = getOptionalPhoneValidationErrors(phoneCode, phoneNumber);
    if (phoneErrors.countryCode || phoneErrors.phone) {
      showSnackbar({
        severity: "warning",
        message: phoneErrors.phone || phoneErrors.countryCode || "Invalid phone.",
      });
      return;
    }

    if (editingInlineGuestId) {
      setBookingGuests((prev) =>
        prev.map((guest) => {
          if (guest.id !== editingInlineGuestId) return guest;
          const fallback =
            guest.participantType === "model" ? "Model" : "Guest";
          return {
            ...guest,
            name: guestName || guest.name || fallback,
            email,
            phoneCode,
            phoneNumber,
          };
        }),
      );
      setInlineGuestDraft(emptyInlineGuestDraft);
      setEditingInlineGuestId(null);
      setInlineGuestParticipantType("guest");
      setShowInlineGuestField(false);
      return;
    }

    const modelCount =
      bookingGuests.filter((g) => g.participantType === "model").length + 1;
    const guestCount =
      bookingGuests.filter((g) => (g.participantType ?? "guest") === "guest")
        .length + 1;
    const fallbackName =
      inlineGuestParticipantType === "model"
        ? `Model ${modelCount}`
        : `Guest ${guestCount}`;
    setBookingGuests((prev) => [
      ...prev,
      {
        id: `guest-${Date.now()}`,
        name: guestName || fallbackName,
        email,
        phoneCode,
        phoneNumber,
        services: [],
        products: [],
        participantType: inlineGuestParticipantType,
      },
    ]);
    setInlineGuestDraft(emptyInlineGuestDraft);
    setEditingInlineGuestId(null);
    setInlineGuestParticipantType("guest");
    setShowInlineGuestField(false);
  }, [
    bookingGuests,
    editingInlineGuestId,
    emptyInlineGuestDraft,
    inlineGuestDraft.email,
    inlineGuestDraft.firstName,
    inlineGuestDraft.lastName,
    inlineGuestDraft.phoneCode,
    inlineGuestDraft.phoneNumber,
    inlineGuestParticipantType,
    showSnackbar,
  ]);

  const beginEditInlineGuest = React.useCallback(
    (guest: {
      id: string;
      name: string;
      email?: string;
      phoneCode?: string;
      phoneNumber?: string;
      participantType?: string;
    }) => {
      const parts = guest.name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      setInlineGuestDraft({
        firstName,
        lastName,
        email: guest.email ?? "",
        phoneCode: guest.phoneCode ?? "",
        phoneNumber: guest.phoneNumber ?? "",
      });
      setEditingInlineGuestId(guest.id);
      setInlineGuestParticipantType(
        guest.participantType === "model" ? "model" : "guest",
      );
      setShowInlineGuestField(true);
    },
    [],
  );

  const addDlParticipant = React.useCallback(
    (kind: "planning" | "buffer") => {
      const timedEnds: Array<{ endTime?: string }> = [
        ...selectedServices.map((service) => ({ endTime: service.endTime })),
        ...bookingGuests.flatMap((guest) => [
          ...guest.services.map((service) => ({ endTime: service.endTime })),
          {
            endTime: guest.planningEndTime || guest.bufferEndTime,
          },
        ]),
      ];
      const defaultStart =
        getLatestTimedEnd(timedEnds, selectedSlot?.start) ||
        selectedSlot?.start?.slice(0, 5) ||
        "";

      if (kind === "buffer") {
        const defaultMemberId =
          selectedSlot?.resourceId || data.resources[0]?.id || "";
        setEditingBufferId(null);
        setBufferDraft({
          title: "",
          teamMemberIds: defaultMemberId ? [defaultMemberId] : [],
          durationMins: "",
          startTime: defaultStart,
          endTime: "",
        });
        setSlotBookingScreen("add-buffer");
        return;
      }
      const id = `planning-${Date.now()}`;
      setBookingGuests((prev) =>
        sortCalendarGuestsByStartTime([
          ...prev,
          {
            id,
            name: "Planning",
            services: [],
            products: [],
            participantType: "planning",
            planningActivity: "Photoshoot",
            planningDuration: "",
            planningStartTime: defaultStart || undefined,
            planningEndTime: undefined,
          },
        ]),
      );
    },
    [
      bookingGuests,
      data.resources,
      selectedServices,
      selectedSlot?.end,
      selectedSlot?.resourceId,
      selectedSlot?.start,
    ],
  );

  const applyBufferDraft = React.useCallback(() => {
    const title = bufferDraft.title.trim() || "Buffer";
    const startTime = bufferDraft.startTime.trim();
    const endTime = bufferDraft.endTime.trim();
    const durationMins =
      minutesBetweenTimes(startTime, endTime) ||
      parseDurationMinsLabel(bufferDraft.durationMins);
    const memberIds = bufferDraft.teamMemberIds.filter(Boolean);
    if (!memberIds.length) return;
    const makeBufferGuest = (
      id: string,
      memberId: string,
    ): (typeof bookingGuests)[number] => ({
      id,
      name: title,
      services: [] as BookingServiceLineItem[],
      products: [] as BookingProductLineItem[],
      participantType: "buffer",
      planningActivity: title,
      planningDuration: durationMins
        ? formatDurationMinsLabel(durationMins)
        : undefined,
      planningStartTime: undefined,
      planningEndTime: undefined,
      bufferTeamMemberId: memberId,
      bufferStartTime: startTime || undefined,
      bufferEndTime: endTime || undefined,
    });
    const nextGuests = (() => {
      if (!editingBufferId) {
        const stamp = Date.now();
        return [
          ...bookingGuests,
          ...memberIds.map((memberId) =>
            makeBufferGuest(`buffer-${stamp}-${memberId}`, memberId),
          ),
        ];
      }
      const insertAt = bookingGuests.findIndex(
        (item) => item.id === editingBufferId,
      );
      const stamp = Date.now();
      const next = memberIds.map((memberId, index) =>
        makeBufferGuest(
          index === 0 && insertAt >= 0
            ? editingBufferId
            : `buffer-${stamp}-${memberId}`,
          memberId,
        ),
      );
      if (insertAt < 0) return [...bookingGuests, ...next];
      const rest = bookingGuests.filter((item) => item.id !== editingBufferId);
      return [...rest.slice(0, insertAt), ...next, ...rest.slice(insertAt)];
    })();
    setBookingGuests(sortCalendarGuestsByStartTime(nextGuests));
    setSelectedSlot((prev) => {
      if (!prev) return prev;
      let startMin = minutesSinceMidnight(prev.start);
      let endMin = minutesSinceMidnight(prev.end);
      const bump = (start?: string, finish?: string) => {
        if (start?.trim()) {
          startMin = Math.min(startMin, minutesSinceMidnight(start));
        }
        if (finish?.trim()) {
          endMin = Math.max(endMin, minutesSinceMidnight(finish));
        }
      };
      for (const service of selectedServices) {
        bump(service.startTime, service.endTime);
      }
      for (const guest of nextGuests) {
        for (const service of guest.services) {
          bump(service.startTime, service.endTime);
        }
        bump(guest.planningStartTime, guest.planningEndTime);
        bump(guest.bufferStartTime, guest.bufferEndTime);
      }
      return {
        ...prev,
        start: fmtMinToTime(startMin),
        end: fmtMinToTime(endMin),
      };
    });
    setEditingBufferId(null);
    setSlotBookingScreen("new-booking");
  }, [
    bookingGuests,
    bufferDraft,
    editingBufferId,
    selectedServices,
  ]);

  const beginEditBuffer = React.useCallback(
    (guest: {
      id: string;
      name: string;
      planningDuration?: string;
      bufferTeamMemberId?: string;
      bufferStartTime?: string;
      bufferEndTime?: string;
    }) => {
      const durationMins =
        parseDurationMinsLabel(guest.planningDuration) ??
        (guest.bufferStartTime && guest.bufferEndTime
          ? minutesSinceMidnight(guest.bufferEndTime) -
            minutesSinceMidnight(guest.bufferStartTime)
          : null);
      setBufferDraft({
        title: guest.name.trim() === "Buffer" ? "" : guest.name.trim(),
        teamMemberIds: guest.bufferTeamMemberId
          ? [guest.bufferTeamMemberId]
          : [],
        durationMins:
          durationMins && durationMins > 0 ? String(durationMins) : "",
        startTime: guest.bufferStartTime?.trim() || "",
        endTime: guest.bufferEndTime?.trim() || "",
      });
      setEditingBufferId(guest.id);
      setSlotSaveAttempted(false);
      setSlotBookingScreen("add-buffer");
    },
    [],
  );

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
  const hasUniqueItemDraftSelection = React.useMemo(
    () => Object.values(uniqueItemSelectionDraft).some((item) => item.selected),
    [uniqueItemSelectionDraft],
  );

  const onEmptyClick = React.useCallback(
    (
      resourceId: string,
      iso: string,
      minutes: number,
      anchor: { top: number; left: number },
    ) => {
      if (iso < todayIso) {
        showSnackbar({
          severity: "info",
          message: "Cannot create a new booking on a past date.",
        });
        return;
      }
      const availability = getAvailabilityFor(resourceId, iso);
      if (!availability.length) {
        showSnackbar({
          severity: "info",
          message: "No schedule availability for this team member on this day.",
        });
        return;
      }
      const busy = getBusyFor(resourceId, iso);
      const free = subtractIntervals(availability, busy);
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

      const start = Math.max(
        segment.startMin,
        Math.min(
          minutes,
          Math.max(segment.startMin, segment.endMin - grid.stepMinutes),
        ),
      );
      const end = Math.min(segment.endMin, start + grid.stepMinutes);

      const payload: SelectedSlot = {
        resourceId,
        date: iso,
        start: fmtMinToTime(start),
        end: fmtMinToTime(end),
        freeStart: fmtMinToTime(segment.startMin),
        freeEnd: fmtMinToTime(segment.endMin),
      };
      // Timeline slot click: show Booking / Blocked time on-screen menu.
      setPendingSlotPayload(payload);
      setSlotAddAnchor(anchor);
    },
    [
      getAvailabilityFor,
      getBusyFor,
      grid.stepMinutes,
      showSnackbar,
      todayIso,
    ],
  );

  const handleSlotAddContinue = React.useCallback(
    (action: CalendarSlotAddAction) => {
      const payload = pendingSlotPayload;
      setSlotAddAnchor(null);
      setPendingSlotPayload(null);
      if (!payload) return;

      if (action === "booking") {
        openBookingDrawer(payload, { allowTimeSelection: false });
        return;
      }

      const draft = createEmptyBlockTimeDraft(
        [payload.resourceId],
        data.supportedLocations,
        payload.date,
      );
      setBlockDraft({
        ...draft,
        startTime: payload.start.slice(0, 5),
        endTime: payload.end.slice(0, 5),
      });
      setBlockTimeOpen(true);
    },
    [data.supportedLocations, openBookingDrawer, pendingSlotPayload],
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
          lateCancellationFeePercentCeiling,
          showLateRescheduling,
          lateRescheduleFeePercent,
          lateRescheduleFeePercentCeiling,
          showNoShowFee,
          noShowFeePercent,
          noShowFeePercentCeiling,
          cancellationFeeAt,
          exceededCancellationWindow,
          showInternalNote,
          bookingInternalNote,
          bookingTotalDiscount,
          showKilometerAllowance: slotLocation === "DL" && showKilometerAllowance,
          kilometerAllowanceDraft:
            slotLocation === "DL"
              ? kilometerAllowanceDraft
              : { eurPerKm: "", totalKilometer: "" },
          clientNote: existingEvent.details?.clientNote,
          // Persist as outgoing EBR so Discard EBR and client EBR pill stay in sync.
          requestDirection: "outgoing",
          originalServices,
          editedServiceIds: editedIds,
          clientEditedServiceIds: [],
          lastEditedBy: "professional",
        });
        nextDetails.responseStatus = "suggestion_for_change";
        const responseDeadline = buildResponseDeadline(businessResponseWindowInput);
        if (responseDeadline) {
          Object.assign(nextDetails, responseDeadline);
        }
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
            guestId: null as string | null,
          })),
          ...bookingUniqueItems.map((product) => ({
            ...product,
            guestId: null as string | null,
          })),
          ...bookingGuests.flatMap((guest) =>
            guest.products.map((product) => ({
              ...product,
              guestId: guest.id,
            })),
          ),
        ];
        const originalProductIds = new Set(
          (existingEvent.details?.products ?? []).map((product) => product.id),
        );
        const editedProductIds = selectedProducts
          .filter((product) => !originalProductIds.has(product.id))
          .map((product) => product.id);
        const bookingRef = existingEvent.bookingCode ?? editingEventId;
        const ebrTotal = bookingTotalForSave;
        if (nextDetails.clientSnapshot) {
          nextDetails.clientSnapshot = {
            ...nextDetails.clientSnapshot,
            services: suggestedServices.map((service) => ({
              id: service.id,
              name: service.name,
              price: service.price,
              durationMins: service.durationMins,
              startTime: service.startTime,
              endTime: service.endTime,
              guestId: service.guestId ?? null,
              teamMemberId: service.teamMemberId ?? service.staffResourceId ?? null,
            })),
          };
        }
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

      const title = buildMultiServiceBookingTitle(
        [
          ...selectedServices.map((service) => service.name),
          ...bookingGuests.flatMap((guest) =>
            guest.services.map((service) => service.name),
          ),
        ],
        "Booking",
      );

      if (!staffConflictAckRef.current) {
        const slotStart = selectedSlot.start.slice(0, 5);
        const slotEnd = selectedSlot.end.slice(0, 5);
        const staffIntervals: StaffServiceInterval[] = [
          ...selectedServices.map((service) => ({
            id: service.id,
            name: service.name,
            staffId: service.staffResourceId || selectedSlot.resourceId,
            start: (service.startTime || slotStart).slice(0, 5),
            end: (service.endTime || slotEnd).slice(0, 5),
          })),
          ...bookingGuests.flatMap((guest) =>
            guest.services.map((service) => ({
              id: `${guest.id}-${service.id}`,
              name: service.name,
              staffId: service.staffResourceId || selectedSlot.resourceId,
              start: (service.startTime || slotStart).slice(0, 5),
              end: (service.endTime || slotEnd).slice(0, 5),
            })),
          ),
          ...bookingGuests
            .filter(
              (guest) =>
                guest.participantType === "buffer" &&
                Boolean(guest.bufferStartTime) &&
                Boolean(guest.bufferEndTime),
            )
            .map((guest) => ({
              id: guest.id,
              name: guest.name || "Buffer",
              staffId: guest.bufferTeamMemberId || selectedSlot.resourceId,
              start: guest.bufferStartTime!.slice(0, 5),
              end: guest.bufferEndTime!.slice(0, 5),
            })),
        ];
        const internalOverlaps =
          findInternalStaffServiceOverlaps(staffIntervals);
        const externalOverlaps = findExternalStaffBookingOverlaps({
          bookingId: editingEventId,
          date: selectedSlot.date,
          services: staffIntervals,
          events,
        });
        if (internalOverlaps.length || externalOverlaps.length) {
          const parts: string[] = [];
          if (internalOverlaps.length) {
            parts.push(
              `Same team member has overlapping services (${internalOverlaps
                .map(({ a, b }) => `${a.name} & ${b.name}`)
                .join(", ")})`,
            );
          }
          if (externalOverlaps.length) {
            parts.push(
              `Overlaps another booking (${externalOverlaps
                .map(({ service, event }) => `${service.name} / ${event.title}`)
                .slice(0, 3)
                .join(", ")})`,
            );
          }
          setStaffConflictMessage(
            `${parts.join(". ")}. You can still save this booking.`,
          );
          setStaffConflictOpen(true);
          return false;
        }
      } else {
        staffConflictAckRef.current = false;
      }

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
          lateCancellationFeePercentCeiling,
          showLateRescheduling,
          lateRescheduleFeePercent,
          lateRescheduleFeePercentCeiling,
          showNoShowFee,
          noShowFeePercent,
          noShowFeePercentCeiling,
          cancellationFeeAt,
          exceededCancellationWindow,
          showInternalNote,
          bookingInternalNote,
          bookingTotalDiscount,
          showKilometerAllowance: slotLocation === "DL" && showKilometerAllowance,
          kilometerAllowanceDraft:
            slotLocation === "DL"
              ? kilometerAllowanceDraft
              : { eurPerKm: "", totalKilometer: "" },
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
        ...selectedProducts.map((product) => ({
          ...product,
          guestId: null as string | null,
        })),
        ...bookingUniqueItems.map((product) => ({
          ...product,
          guestId: null as string | null,
        })),
        ...bookingGuests.flatMap((guest) =>
          guest.products.map((product) => ({
            ...product,
            guestId: guest.id,
          })),
        ),
      ];

      const existingClientSnapshot = existingEvent?.details?.clientSnapshot;
      const shouldWriteClientSnapshot =
        Boolean(existingClientSnapshot) ||
        slotLocation === "DL" ||
        bookingGuests.length > 0;
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
              id:
                existingClientSnapshot?.people?.find((person) => person.isRequester)
                  ?.id ??
                existingClientSnapshot?.people?.[0]?.id ??
                "p-requester",
              name:
                existingClientSnapshot?.people?.find((person) => person.isRequester)
                  ?.name || clientName,
              isRequester: true,
            },
            ...bookingGuests.map((guest) => {
              const existingPerson = existingClientSnapshot?.people?.find(
                (person) => person.id === guest.id,
              );
              return {
                id: guest.id,
                name: guest.name,
                email: guest.email,
                phoneCode: guest.phoneCode,
                phoneNumber: guest.phoneNumber,
                isRequester: false as const,
                participantType:
                  guest.participantType ??
                  existingPerson?.participantType ??
                  ("guest" as const),
                planningActivity: guest.planningActivity,
                planningDuration: guest.planningDuration,
                planningStartTime: guest.planningStartTime,
                planningEndTime: guest.planningEndTime,
                bufferTeamMemberId: guest.bufferTeamMemberId,
                bufferStartTime: guest.bufferStartTime,
                bufferEndTime: guest.bufferEndTime,
              };
            }),
            ...(existingClientSnapshot?.people ?? []).filter(
              (person) =>
                !person.isRequester &&
                person.participantType === "planning" &&
                !bookingGuests.some((guest) => guest.id === person.id),
            ),
          ],
          services: details.services.map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            durationMins: service.durationMins,
            startTime: service.startTime,
            endTime: service.endTime,
            guestId: service.guestId ?? null,
            teamMemberId: service.staffResourceId ?? service.teamMemberId ?? null,
            originalPrice: service.price,
            discount: service.discount ?? null,
          })),
          teamMembers: existingClientSnapshot?.teamMembers,
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
          details.silentUpdateSnapshot = {
            phoneCode: existingEvent.details?.phoneCode,
            phoneNumber: existingEvent.details?.phoneNumber,
            guests: existingEvent.details?.guests,
            desiredLocation: existingEvent.details?.desiredLocation,
          };
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
              : "Online"
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

          if (
            addClientSource === "mollure-platform" ||
            addClientSource === "non-mollure"
          ) {
            const identity = {
              name: selectedClient?.name,
              email: selectedClient?.email,
              customerId: selectedClient?.mollureUserId,
              clientKind: selectedClient?.clientKind,
              phone: [bookingPhoneDraft.phoneCode, bookingPhoneDraft.phoneNumber]
                .map((part) => String(part ?? "").trim())
                .filter(Boolean)
                .join(" "),
            };
            if (!findListedClient(identity)) {
              void addIdentityToClientList(identity, { silent: true });
            }
          }

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
      lateCancellationFeePercentCeiling,
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
      lateRescheduleFeePercentCeiling,
      showNoShowFee,
      noShowFeePercent,
      noShowFeePercentCeiling,
      cancellationFeeAt,
      exceededCancellationWindow,
      showPrepayment,
      showSnackbar,
      slotBookingType,
      slotLocation,
      slotStatus,
      canUseBookingProject,
      resourceNameById,
      addIdentityToClientList,
      findListedClient,
      bookingPhoneDraft.phoneCode,
      bookingPhoneDraft.phoneNumber,
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
          <Box sx={{ px: { xs: 1.25, md: 2 }, py: 1.25, bgcolor: "#fff" }}>
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
                      resetToDefaultTeamMember();
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
                        if (v === "day") {
                          resetToDefaultTeamMember();
                        } else {
                          userPickedTeamMemberRef.current = false;
                          setSelectedResourceId("");
                        }
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
                  setBlockDraft(
                    createEmptyBlockTimeDraft(
                      activeResource
                        ? [activeResource.id]
                        : data.resources.map((r) => r.id),
                      data.supportedLocations,
                      activeDateIso,
                    ),
                  );
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
                  const segment = availability[0] ?? {
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
                onPublicBusinessHours={() => {
                  setPublicBusinessHoursDraft(
                    createEmptyPublicBusinessHoursDraft("FL"),
                  );
                  setPublicBusinessHoursOpen(true);
                }}
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
          <Box sx={{ px: { xs: 1.25, md: 2 }, pb: 2, bgcolor: "#fff" }}>
            {viewMode === "month" ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "6px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  overflowX: "auto",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(7, minmax(0, 1fr))",
                      sm: "repeat(7, minmax(80px, 1fr))",
                      md: "repeat(7, minmax(118px, 1fr))",
                    },
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: alpha(m.navy, 0.02),
                  }}
                >
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <Box
                        key={day}
                        sx={{
                          px: { xs: 0.5, md: 1.25 },
                          py: { xs: 0.75, md: 1 },
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
                    gridTemplateColumns: {
                      xs: "repeat(7, minmax(0, 1fr))",
                      sm: "repeat(7, minmax(80px, 1fr))",
                      md: "repeat(7, minmax(118px, 1fr))",
                    },
                  }}
                >
                  {monthCells.map((cell, idx) => {
                    const hasBookings = cell.dayEvents.length > 0;
                    const showClosed =
                      !cell.isPast &&
                      !hasScheduleAvailabilityOnDate(cell.iso);
                    const closedNote = showClosed
                      ? "No schedule availability"
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
                          resetToDefaultTeamMember();
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
                              const eventIsShared = isTeamSharedBooking(event);

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
                                    {eventIsShared ? (
                                      <Chip
                                        size="small"
                                        label="Shared"
                                        sx={{
                                          height: 15,
                                          borderRadius: "4px",
                                          fontSize: 8,
                                          fontWeight: 900,
                                          color: m.teal,
                                          bgcolor: alpha(m.teal, 0.12),
                                          border: `1px solid ${alpha(m.teal, 0.35)}`,
                                          "& .MuiChip-label": { px: 0.55 },
                                        }}
                                      />
                                    ) : null}
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
                {viewMode === "day" && hasTeamMembers
                  ? renderSplitScreenBanner()
                  : null}
                <Box
                  ref={timelineGridRef}
                  onMouseLeave={clearTimelineHover}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "48px minmax(0, 1fr)",
                    bgcolor: m.fxSurface,
                    position: "relative",
                    minWidth: 0,
                  }}
                >
                  {timelineHover ? (
                    <CalendarTimelineHoverIndicator
                      top={timelineHover.absoluteTop}
                      timeLabel={fmtTimeLabel(timelineHover.timeMin)}
                    />
                  ) : null}
                  {showNowLine ? (
                    <>
                      <Box
                        sx={{
                          position: "absolute",
                          gridColumn: "1 / -1",
                          gridRow: 1,
                          left: 36,
                          top: timelineHeaderPx + nowLineTop - 4,
                          width: 8,
                          height: 8,
                          borderRadius: "999px",
                          bgcolor: "#FF2F64",
                          border: "1px solid #fff",
                          zIndex: 20,
                          pointerEvents: "none",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          gridColumn: "1 / -1",
                          gridRow: 1,
                          left: 48,
                          right: 0,
                          top: timelineHeaderPx + nowLineTop,
                          height: 2,
                          bgcolor: "#FF2F64",
                          zIndex: 19,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  ) : null}
                  {/* Time column — stays above booking cards so labels never get covered */}
                  <Box
                    sx={{
                      gridColumn: 1,
                      gridRow: 1,
                      position: "relative",
                      zIndex: 12,
                      bgcolor: "#fff",
                      borderRight: `1px solid ${alpha(m.navy, 0.08)}`,
                    }}
                  >
                    {timelineHeaderPx > 0 ? (
                      <Box
                        sx={{
                          height: timelineHeaderPx,
                          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                        }}
                      />
                    ) : null}
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
                            bgcolor: isAvailable
                              ? timelineGridSlotBg(t, timelineGridSlotColors)
                              : m.timelineGridHourSlotBg,
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
                      gridColumn: 2,
                      gridRow: 1,
                      position: "relative",
                      zIndex: 1,
                      bgcolor: m.fxSurface,
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    {displayedResources.map((res, laneIdx) => {
                      const laneDates =
                        viewMode === "week" ? visibleDates : [activeDateIso];
                      const fallbackTeamId = String(data.resources[0]?.id ?? "");
                      const laneColumns =
                        viewMode === "day"
                          ? dayViewMemberColumns.map((resource) => ({
                              key: resource.id,
                              resource,
                              date: activeDateIso,
                            }))
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
                          {hasTeamMembers &&
                          (viewMode === "week" || viewMode === "day")
                            ? renderTeamMemberHeader()
                            : null}
                          {viewMode === "week" ? (
                            <Box
                              ref={weekDaysViewportRef}
                              sx={{
                                position: "relative",
                                height: laneHeaderPx,
                                bgcolor: "#fff",
                                borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                                minWidth: 0,
                                width: "100%",
                              }}
                            >
                              {weekDaysNeedScroll ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    left: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                  }}
                                >
                                  {renderTeamMemberScrollButton(
                                    "left",
                                    () => scrollWeekDays(-1),
                                    !weekDaysScrollEdges.canLeft,
                                    "Scroll week days left",
                                  )}
                                </Box>
                              ) : null}
                              <Box
                                ref={weekDaysScrollRef}
                                onScroll={refreshWeekDaysScrollEdges}
                                sx={{
                                  ...weekDaysScrollOverflowSx,
                                  height: "100%",
                                  minWidth: 0,
                                  containerType: "inline-size",
                                  scrollSnapType: weekDaysNeedScroll
                                    ? "x mandatory"
                                    : "none",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    display: "grid",
                                    gridTemplateColumns:
                                      weekDaysGridTemplateColumns,
                                    width: weekDaysScrollContentWidth,
                                    minWidth: "100%",
                                  }}
                                >
                              {laneDates.map((date, colIdx) => {
                                const isActiveDay = date === activeDateIso;
                                const isPastDay = date < todayIso;
                                const showClosed =
                                  !isPastDay &&
                                  getFilteredAvailabilityFor(res.id, date)
                                    .length === 0;
                                const closedNote = showClosed
                                  ? "No schedule availability"
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
                                      minWidth: 0,
                                      scrollSnapAlign: "start",
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
                                        width: "70%",
                                        maxWidth: 58,
                                        minWidth: 28,
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
                              </Box>
                              {weekDaysNeedScroll ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    right: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                  }}
                                >
                                  {renderTeamMemberScrollButton(
                                    "right",
                                    () => scrollWeekDays(1),
                                    !weekDaysScrollEdges.canRight,
                                    "Scroll week days right",
                                  )}
                                </Box>
                              ) : null}
                            </Box>
                          ) : null}

                          {/* Lane body */}
                          <Box
                            sx={{
                              position: "relative",
                              display: "grid",
                              gridTemplateColumns:
                                viewMode === "day"
                                  ? dayViewBodyGridTemplateColumns
                                  : "1fr",
                              width: "100%",
                              bgcolor: "#fff",
                            }}
                          >
                            {laneColumns.map(
                              ({ key, resource, date }, colIdx) => {
                                const laneEvents = eventsInRange.filter(
                                  (event) => {
                                    if (event.date !== date) return false;
                                    if (event.id.includes("::segment-")) {
                                      if (
                                        String(event.resourceId) ===
                                        String(resource.id)
                                      ) {
                                        return true;
                                      }
                                      const hasKnownTeam =
                                        knownResourceIds.has(
                                          String(event.resourceId),
                                        );
                                      return (
                                        !hasKnownTeam &&
                                        resource.id === fallbackTeamId
                                      );
                                    }
                                    if (viewMode === "day") {
                                      if (
                                        eventBelongsToTeamMember(
                                          event,
                                          resource.id,
                                        )
                                      ) {
                                        return true;
                                      }
                                      const hasKnownTeam =
                                        Boolean(
                                          event.resourceId &&
                                            knownResourceIds.has(
                                              String(event.resourceId),
                                            ),
                                        ) ||
                                        Boolean(
                                          event.details?.services?.some(
                                            (service) =>
                                              service.teamMemberId &&
                                              knownResourceIds.has(
                                                String(service.teamMemberId),
                                              ),
                                          ),
                                        );
                                      return (
                                        !hasKnownTeam &&
                                        resource.id === fallbackTeamId
                                      );
                                    }
                                    if (viewMode === "week") {
                                      if (date !== activeDateIso) return false;
                                      if (
                                        eventBelongsToTeamMember(
                                          event,
                                          resource.id,
                                        )
                                      ) {
                                        return true;
                                      }
                                      const hasKnownTeam =
                                        eventHasKnownTeamAssignment(
                                          event,
                                          knownResourceIds,
                                        );
                                      return (
                                        !hasKnownTeam &&
                                        resource.id === fallbackTeamId
                                      );
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
                                    if (viewMode === "day") {
                                      if (
                                        !block.resourceId ||
                                        !knownResourceIds.has(block.resourceId)
                                      ) {
                                        return resource.id === fallbackTeamId;
                                      }
                                      return block.resourceId === resource.id;
                                    }
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

                                // Availability comes from the team member's Schedule.
                                const availability = getFilteredAvailabilityFor(
                                  resource.id,
                                  date,
                                );
                                const locationBands =
                                  getLocationAvailabilityBands(
                                    resource.id,
                                    date,
                                    data.supportedLocations,
                                    scheduleRows,
                                    dateOverrides ?? [],
                                    availability,
                                  ).filter((band) => {
                                    if (appliedFilters.locationAll) return true;
                                    if (band.kind === "fixed") {
                                      return Boolean(appliedFilters.locations.FL);
                                    }
                                    if (band.kind === "desired") {
                                      return Boolean(appliedFilters.locations.DL);
                                    }
                                    return (
                                      Boolean(appliedFilters.locations.FL) ||
                                      Boolean(appliedFilters.locations.DL)
                                    );
                                  });
                                const unavailableIntervals = subtractIntervals(
                                  [{ startMin, endMin }],
                                  availability,
                                );
                                const offersBothLocations =
                                  data.supportedLocations.includes("FL") &&
                                  data.supportedLocations.includes("DL");
                                const isPastDay = date < todayIso;
                                const bookingAddDisabled =
                                  isPastDay || availability.length === 0;

                                return (
                                  <Box
                                    key={key}
                                    onMouseMoveCapture={handleTimelineHoverMove}
                                    onMouseLeave={clearTimelineHover}
                                    sx={{
                                      position: "relative",
                                      borderLeft:
                                        colIdx > 0
                                          ? `1px solid ${alpha(m.navy, 0.07)}`
                                          : undefined,
                                      height: rows * rowPx,
                                      bgcolor: "transparent",
                                      overflow: "visible",
                                      ...(isPastDay
                                        ? { opacity: 0.72 }
                                        : null),
                                    }}
                                  >
                                    {/* Click layer — below booking cards */}
                                    <Tooltip
                                      title={availabilityHoverTitle}
                                      followCursor
                                      disableHoverListener={
                                        !availabilityHoverTitle
                                      }
                                      arrow
                                      placement="top"
                                    >
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
                                          { top: e.clientY, left: e.clientX },
                                        );
                                      }}
                                      onMouseMove={(e) => {
                                        const rect = (
                                          e.currentTarget as HTMLDivElement
                                        ).getBoundingClientRect();
                                        const y = e.clientY - rect.top;
                                        const minutes =
                                          startMin +
                                          (y / rowPx) * grid.stepMinutes;
                                        const kind =
                                          locationAvailabilityKindAtMinute(
                                            locationBands,
                                            minutes,
                                          );
                                        setAvailabilityHoverTitle(
                                          kind
                                            ? locationAvailabilityTooltip(kind)
                                            : "",
                                        );
                                      }}
                                      sx={{
                                        position: "absolute",
                                        inset: 0,
                                        cursor: bookingAddDisabled
                                          ? "default"
                                          : "pointer",
                                        zIndex: 2,
                                      }}
                                    />
                                    </Tooltip>

                                    {/* Per-slot row backgrounds (:00 dark, :30 light, :15/:45 normal) */}
                                    {slotLines.map((t) => (
                                            <Box
                                              key={`slot-bg-${resource.id}-${date}-${t}`}
                                              sx={{
                                                position: "absolute",
                                                left: 0,
                                                right: 0,
                                                top:
                                                  ((t - startMin) /
                                                    grid.stepMinutes) *
                                                  rowPx,
                                                height: rowPx,
                                                bgcolor: timelineGridSlotBg(
                                                  t,
                                                  timelineGridSlotColors,
                                                ),
                                                pointerEvents: "none",
                                                zIndex: 0,
                                              }}
                                            />
                                          ))}

                                    {/* Unavailable = dark gray (outside this member's Schedule) */}
                                    {unavailableIntervals.map((interval, idx) => {
                                      const top =
                                        ((interval.startMin - startMin) /
                                          grid.stepMinutes) *
                                        rowPx;
                                      const height =
                                        ((interval.endMin - interval.startMin) /
                                          grid.stepMinutes) *
                                        rowPx;
                                      if (height <= 0) return null;
                                      return (
                                        <Box
                                          key={`unavail-${resource.id}-${date}-${idx}`}
                                          sx={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top,
                                            height,
                                            bgcolor: m.timelineGridHourSlotBg,
                                            pointerEvents: "none",
                                            zIndex: 1,
                                          }}
                                        />
                                      );
                                    })}

                                    {locationBands.map((band, bandIdx) => {
                                      const top =
                                        ((band.interval.startMin - startMin) /
                                          grid.stepMinutes) *
                                        rowPx;
                                      const height =
                                        ((band.interval.endMin -
                                          band.interval.startMin) /
                                          grid.stepMinutes) *
                                        rowPx;
                                      if (height <= 0) return null;
                                      const patternSx =
                                        offersBothLocations &&
                                        band.kind !== "fixed"
                                          ? locationAvailabilityPatternSx(
                                              band.kind,
                                            )
                                          : {};
                                      return (
                                        <Box
                                          key={`avail-${band.kind}-${bandIdx}`}
                                          sx={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top,
                                            height,
                                            pointerEvents: "none",
                                            zIndex: 1,
                                            ...patternSx,
                                          }}
                                        />
                                      );
                                    })}

                                    {/* Block Time — gray band below bookings; labels omitted on booking overlap */}
                                    {dedupeCalendarBlocks(laneBlocks).map((b) => {
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
                                      const overlapsBooking = laneEvents.some(
                                        (event) =>
                                          calendarBlockOverlapsBooking(b, event),
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
                                            zIndex: 2,
                                            bgcolor: m.blockTimeBandBg,
                                            boxSizing: "border-box",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {overlapsBooking ? null : (
                                            <Box
                                              sx={{
                                                position: "absolute",
                                                left: 8,
                                                top: 4,
                                                right: 6,
                                                pointerEvents: "none",
                                              }}
                                            >
                                              <BodyText
                                                sx={{
                                                  fontWeight: 900,
                                                  fontSize: 10,
                                                  color: m.blockTimeBandFg,
                                                  lineHeight: 1.1,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {b.start} to {b.end}
                                              </BodyText>
                                              <BodyText
                                                sx={{
                                                  fontSize: 10.5,
                                                  fontWeight: 800,
                                                  color: m.blockTimeBandFg,
                                                  lineHeight: 1.1,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {b.title}
                                              </BodyText>
                                            </Box>
                                          )}
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
                                            anchorEl: HTMLElement,
                                          ) =>
                                            handleClientNameClick(
                                              ev,
                                              anchorEl,
                                              "overview",
                                            ),
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
                                              teamMemberNameById={
                                                resourceNameById
                                              }
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
                                            left={6}
                                            right={6}
                                            teamMemberNameById={
                                              resourceNameById
                                            }
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
                                            onOpenClient={(anchorEl) =>
                                              eventHandlers.onOpenClient(
                                                ev,
                                                anchorEl,
                                              )
                                            }
                                            onOpenMessages={() =>
                                              eventHandlers.onOpenMessages(ev)
                                            }
                                          />
                                        );
                                      },
                                    )}
                                  </Box>
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
          onDeleteBlockedEntry={
            onDeleteCalendarEntry
              ? async (entryId) => {
                  await onDeleteCalendarEntry(entryId);
                  setBlocks((prev) =>
                    prev.filter((block) => {
                      const raw = block.id.replace(/^blk-/, "");
                      return raw !== entryId && block.id !== entryId;
                    }),
                  );
                }
              : undefined
          }
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
          categoryOptions={categoryOptions}
          templateCategoryRows={templateCategoryRows}
          isSaving={isSaving}
          onBookingRulesChange={setBookingRules}
          onServiceOrderChange={setServiceOrderDraft}
          onOpenDesign={() => {
            setDesignDraft(appliedDesign);
            setDesignOpen(true);
          }}
          onOpenPublicHours={(location) => {
            const existing = Array.isArray(
              calendarSettings?.availability.publicBusinessHours,
            )
              ? calendarSettings.availability.publicBusinessHours
              : [];
            if (location === "FL" || location === "DL") {
              setPublicBusinessHoursDraft(
                draftFromPublicBusinessHoursEntries(existing, location),
              );
            } else {
              setPublicBusinessHoursDraft(createEmptyPublicBusinessHoursDraft());
            }
            setPublicBusinessHoursOpen(true);
          }}
          onSaveBookingRules={async (next) => {
            const rules = withClampedDesiredLocationInterval(
              next ?? bookingRules,
            );
            setBookingRules(rules);
            await persistAvailabilitySettings({ bookingRules: rules });
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
              : activityDetailItem.detailType === "comparison" ||
                  activityDetailItem.comparison
                ? "Comparison"
                : "Edit request details"
            : slotBookingScreen === "select-services"
              ? "Select Service"
              : slotBookingScreen === "edit-service"
                ? "Edit service"
                : slotBookingScreen === "select-products"
                  ? "Select Product"
                  : slotBookingScreen === "select-unique-items"
                    ? "Select Unique Item"
                    : slotBookingScreen === "add-unique-item"
                      ? uniqueItemFlowTitle
                    : slotBookingScreen === "add-buffer"
                      ? editingBufferId
                        ? "Edit Buffer"
                        : "Add Buffer"
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
              ? () => {
                  if (slotBookingScreen === "add-unique-item") {
                    leaveUniqueItemScreen();
                    return;
                  }
                  if (slotBookingScreen === "add-buffer") {
                    setEditingBufferId(null);
                    setSlotBookingScreen("new-booking");
                    return;
                  }
                  setSlotBookingScreen(
                    slotBookingScreen === "edit-service"
                      ? serviceEditOrigin
                      : "new-booking",
                  );
                }
              : undefined
        }
        footer={
          selectedSlot && slotDrawerTab === "booking" && !activityDetailItem ? (
            <Box
              sx={{
                px: 2.5,
                pt: 1.25,
                pb: 2,
                borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
              }}
            >
              {slotBookingScreen === "new-booking" && slotClientAdded ? (
                <Box sx={{ mb: 1.25 }}>
                  {(() => {
                    if (!selectedSlot || isViewingExisting) return null;
                    const slotStart = selectedSlot.start.slice(0, 5);
                    const slotEnd = selectedSlot.end.slice(0, 5);
                    const staffIntervals: StaffServiceInterval[] = [
                      ...selectedServices.map((service) => ({
                        id: service.id,
                        name: service.name,
                        staffId:
                          service.staffResourceId || selectedSlot.resourceId,
                        start: (service.startTime || slotStart).slice(0, 5),
                        end: (service.endTime || slotEnd).slice(0, 5),
                      })),
                      ...bookingGuests.flatMap((guest) =>
                        guest.services.map((service) => ({
                          id: `${guest.id}-${service.id}`,
                          name: service.name,
                          staffId:
                            service.staffResourceId || selectedSlot.resourceId,
                          start: (service.startTime || slotStart).slice(0, 5),
                          end: (service.endTime || slotEnd).slice(0, 5),
                        })),
                      ),
                      ...bookingGuests
                        .filter(
                          (guest) =>
                            guest.participantType === "buffer" &&
                            Boolean(guest.bufferStartTime) &&
                            Boolean(guest.bufferEndTime),
                        )
                        .map((guest) => ({
                          id: guest.id,
                          name: guest.name || "Buffer",
                          staffId:
                            guest.bufferTeamMemberId || selectedSlot.resourceId,
                          start: guest.bufferStartTime!.slice(0, 5),
                          end: guest.bufferEndTime!.slice(0, 5),
                        })),
                    ];
                    const hasInternal =
                      findInternalStaffServiceOverlaps(staffIntervals).length >
                      0;
                    const hasExternal =
                      findExternalStaffBookingOverlaps({
                        bookingId: editingEventId,
                        date: selectedSlot.date,
                        services: staffIntervals,
                        events,
                      }).length > 0;
                    if (!hasInternal && !hasExternal) return null;
                    return (
                      <Box
                        sx={{
                          mb: 1,
                          px: 1.25,
                          py: 1,
                          borderRadius: "10px",
                          bgcolor: alpha(m.statusOrangeFg, 0.1),
                          border: `1px solid ${alpha(m.statusOrangeFg, 0.28)}`,
                        }}
                      >
                        <BodyText
                          sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: m.statusOrangeFg,
                            lineHeight: 1.35,
                          }}
                        >
                          Overlapping staff time detected. You can still save —
                          you will be asked to confirm.
                        </BodyText>
                      </Box>
                    );
                  })()}
                  <BookingDrawerParticipantActions
                    kinds={drawerParticipantKinds}
                    nameFieldOpen={
                      showInlineGuestField && !editingInlineGuestId
                    }
                    onAddGuest={() => openInlineGuestForm("guest")}
                    onAddModel={() => openInlineGuestForm("model")}
                    onAddPlanning={() => {
                      addDlParticipant("planning");
                    }}
                    onAddBuffer={() => {
                      addDlParticipant("buffer");
                    }}
                  />
                </Box>
              ) : null}
              <Stack direction="row" alignItems="center" spacing={1.25}>
                {(slotBookingScreen === "new-booking" || isViewingExisting) &&
                slotClientAdded ? (
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
                    aria-label="Group add-ons"
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
                    {(
                      [
                        canAddPrepayment({ alreadyShown: showPrepayment })
                          ? {
                              label: "Add Prepayment",
                              onClick: () => {
                                setShowPrepayment(true);
                                setPrepaymentPercent((prev) =>
                                  prev.trim()
                                    ? prev
                                    : (prepaymentPercentDefault ?? ""),
                                );
                                showSnackbar({
                                  severity: "info",
                                  message: "Prepayment enabled.",
                                });
                              },
                            }
                          : null,
                        !isViewingExisting &&
                        slotLocation === "DL" &&
                        !showKilometerAllowance
                          ? {
                              label: "Add Kilometer Allowance",
                              onClick: () => {
                                setShowKilometerAllowance(true);
                                showSnackbar({
                                  severity: "info",
                                  message: "Kilometer Allowance enabled.",
                                });
                              },
                            }
                          : null,
                        !isViewingExisting
                          ? {
                              label: "Add Discount to Total",
                              onClick: () => {
                                setBookingDiscountModalOpen(true);
                              },
                            }
                          : null,
                        canAddLateCancellation({
                          policyPercent: lateCancellationFeePercentDefault,
                          status: viewingBookingEvent?.status ?? slotStatus,
                          cancelledServiceIds:
                            viewingBookingEvent?.details?.cancelledServiceIds ??
                            negotiationDetails?.cancelledServiceIds,
                          alreadyShown: showLateCancellation,
                        })
                          ? {
                              label: "Add Late Cancellation",
                              onClick: () => {
                                const ceiling =
                                  lateCancellationFeePercentDefault ?? "";
                                setShowLateCancellation(true);
                                setLateCancellationFeePercentCeiling(ceiling);
                                setLateCancellationFeePercent((prev) =>
                                  prev.trim() ? prev : ceiling,
                                );
                                const nowIso = new Date().toISOString();
                                setCancellationFeeAt(nowIso);
                                const startMs = viewingBookingEvent
                                  ? Date.parse(
                                      `${viewingBookingEvent.date}T${viewingBookingEvent.start}:00`,
                                    )
                                  : selectedSlot
                                    ? Date.parse(
                                        `${selectedSlot.date}T${selectedSlot.start}:00`,
                                      )
                                    : NaN;
                                setExceededCancellationWindow(
                                  isLateCancellation({
                                    appointmentStartMs: startMs,
                                    noticeHours: cancellationBeforeHours,
                                    noticeMinutes: cancellationBeforeMinutes,
                                  }),
                                );
                                showSnackbar({
                                  severity: "info",
                                  message: "Late cancellation fee enabled.",
                                });
                              },
                            }
                          : null,
                        canAddLateRescheduling({
                          policyPercent: lateRescheduleFeePercentDefault,
                          scheduleEdited: Boolean(
                            viewingBookingEvent?.details?.scheduleEdited,
                          ),
                          alreadyShown: showLateRescheduling,
                        })
                          ? {
                              label: "Add Late Rescheduling",
                              onClick: () => {
                                const ceiling =
                                  lateRescheduleFeePercentDefault ?? "";
                                setShowLateRescheduling(true);
                                setLateRescheduleFeePercentCeiling(ceiling);
                                setLateRescheduleFeePercent((prev) =>
                                  prev.trim() ? prev : ceiling,
                                );
                                showSnackbar({
                                  severity: "info",
                                  message: "Late rescheduling fee enabled.",
                                });
                              },
                            }
                          : null,
                        canAddNoShowFee({
                          policyPercent: noShowFeePercentDefault,
                          status: viewingBookingEvent?.status ?? slotStatus,
                          alreadyShown: showNoShowFee,
                        })
                          ? {
                              label: "Add No-Show Fee",
                              onClick: () => {
                                const ceiling = noShowFeePercentDefault ?? "";
                                setShowNoShowFee(true);
                                setNoShowFeePercentCeiling(ceiling);
                                setNoShowFeePercent((prev) =>
                                  prev.trim() ? prev : ceiling,
                                );
                                showSnackbar({
                                  severity: "info",
                                  message: "No-show fee enabled.",
                                });
                              },
                            }
                          : null,
                        !showInternalNote
                          ? {
                              label: "Add Note",
                              onClick: () => {
                                setShowInternalNote(true);
                              },
                            }
                          : null,
                      ] as Array<{
                        label: string;
                        onClick: () => void;
                      } | null>
                    )
                      .filter(
                        (
                          item,
                        ): item is { label: string; onClick: () => void } =>
                          Boolean(item),
                      )
                      .map((item) => (
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
                        leaveUniqueItemScreen();
                        return;
                      }
                      if (slotBookingScreen === "add-buffer") {
                        setEditingBufferId(null);
                        setSlotBookingScreen("new-booking");
                        return;
                      }
                      if (slotBookingScreen === "edit-service") {
                        setSlotBookingScreen(serviceEditOrigin);
                        return;
                      }
                      if (
                        slotBookingScreen === "select-services" ||
                        slotBookingScreen === "select-products" ||
                        slotBookingScreen === "select-unique-items"
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
                !isViewingBooking &&
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
                              : slotBookingScreen === "select-unique-items"
                                ? isViewingExisting || !hasUniqueItemDraftSelection
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
                        if (slotBookingScreen === "select-unique-items") {
                          if (isViewingExisting || !hasUniqueItemDraftSelection)
                            return;
                          applyUniqueItemSelection();
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
                          setPaymentMethod("online");
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
                            email: guestDraft.email.trim(),
                            mollureUserId: null,
                            clientKind: "individual",
                          });
                          setBookingPhoneDraft({
                            phoneCode: guestDraft.phoneCode,
                            phoneNumber: guestDraft.phoneNumber,
                          });
                          setPaymentMethod("offline");
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
                        photoSrc: resource.photoSrc,
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
                    showStaffAssign={!isViewingExisting || incomingRequestEditMode}
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
                ) : slotBookingScreen === "select-unique-items" ? (
                  <BookingSelectProductsScreen
                    draft={uniqueItemSelectionDraft}
                    catalog={persistedUniqueCatalog}
                    heading="Select Unique Item"
                    searchPlaceholder="Search unique items..."
                    addButtonLabel="Add new unique item"
                    onToggle={(item) =>
                      toggleUniqueItemSelectionDraft(item.id)
                    }
                    onQuantityChange={adjustUniqueItemQuantityDraft}
                    onAddProduct={
                      isViewingExisting
                        ? undefined
                        : () => openAddUniqueItem("unique")
                    }
                    onEdit={
                      isViewingExisting
                        ? undefined
                        : (item) => openEditCatalogProduct(item, "unique")
                    }
                    onDelete={
                      isViewingExisting
                        ? undefined
                        : (item) => setPendingCatalogDelete(item)
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
                      heading={uniqueItemFlowTitle}
                      namePlaceholder={uniqueItemFlowNamePlaceholder}
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
                      heading={uniqueItemFlowTitle}
                      namePlaceholder={uniqueItemFlowNamePlaceholder}
                      onChange={(patch) =>
                        setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
                      }
                      disabled={isViewingExisting}
                    />
                  )
                ) : slotBookingScreen === "add-buffer" ? (
                  <Stack spacing={1.5} sx={{ px: 0.25 }}>
                    <Stack direction="row" alignItems="baseline" spacing={0.75}>
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          color: alpha(m.navy, 0.88),
                          fontSize: 15,
                        }}
                      >
                        {editingBufferId ? "Edit Buffer" : "Buffer"}
                      </BodyText>
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.48),
                        }}
                      >
                        (Internal only)
                      </BodyText>
                    </Stack>
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
                      multiple
                      selectAll
                      value={bufferDraft.teamMemberIds}
                      renderValue={(selected) => {
                        const ids = (selected as readonly string[]).filter(
                          Boolean,
                        );
                        if (!ids.length) return "Select team member";
                        if (
                          data.resources.length > 0 &&
                          ids.length === data.resources.length
                        ) {
                          return "All";
                        }
                        return ids
                          .map(
                            (id) =>
                              data.resources.find(
                                (resource) => resource.id === id,
                              )?.name ?? id,
                          )
                          .join(", ");
                      }}
                      onChange={(value) => {
                        setBufferDraft((prev) => ({
                          ...prev,
                          teamMemberIds: (value as string[]).filter(Boolean),
                        }));
                      }}
                      options={data.resources.map((resource) => ({
                        label: resource.name,
                        value: resource.id,
                      }))}
                      fullWidth
                      disabled={isViewingExisting}
                      error={Boolean(slotErrors.bufferTeamMembers)}
                      helperText={slotErrors.bufferTeamMembers}
                    />
                    <Stack direction="row" spacing={1.25}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <AppTimePicker
                          label="Start Time"
                          value={bufferDraft.startTime}
                          onChange={(startTime) => {
                            setBufferDraft((prev) => {
                              const mins = minutesBetweenTimes(
                                startTime,
                                prev.endTime,
                              );
                              return {
                                ...prev,
                                startTime,
                                durationMins: mins > 0 ? String(mins) : "",
                              };
                            });
                          }}
                          minuteStep={15}
                          fullWidth
                          disabled={isViewingExisting}
                          error={Boolean(slotErrors.bufferStartTime)}
                          helperText={slotErrors.bufferStartTime}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <AppTimePicker
                          label="End Time"
                          value={bufferDraft.endTime}
                          onChange={(endTime) => {
                            setBufferDraft((prev) => {
                              const mins = minutesBetweenTimes(
                                prev.startTime,
                                endTime,
                              );
                              return {
                                ...prev,
                                endTime,
                                durationMins: mins > 0 ? String(mins) : "",
                              };
                            });
                          }}
                          minuteStep={15}
                          fullWidth
                          disabled={isViewingExisting}
                          error={Boolean(slotErrors.bufferEndTime)}
                          helperText={slotErrors.bufferEndTime}
                        />
                      </Box>
                    </Stack>
                    <AppTextField
                      label="Duration"
                      placeholder="—"
                      value={
                        formatDurationMinsLabel(
                          minutesBetweenTimes(
                            bufferDraft.startTime,
                            bufferDraft.endTime,
                          ) || Number.parseInt(bufferDraft.durationMins, 10),
                        ) || ""
                      }
                      fullWidth
                      disabled
                      error={Boolean(slotErrors.bufferDuration)}
                      helperText={slotErrors.bufferDuration}
                      InputProps={{ readOnly: true }}
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
                              if (item.key === "client-list") {
                                setClientListSelectedEmail("");
                              }
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
                              setPaymentMethod("online");
                              setAddClientSource("client-list");
                              setSlotClientAdded(true);
                              setSlotBookingScreen("new-booking");
                            }}
                            options={clientList.map((c) => ({
                              label: bookingClientOptionLabel({
                                name: c.name,
                                isMollure: Boolean(c.mollureUserId),
                                clientKind: c.clientKind,
                              }),
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
                                  setPaymentMethod("online");
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
                                      {platformEmailMatch.name}
                                    </BodyText>
                                    <BookingClientTags
                                      isMollure
                                      clientKind={
                                        platformEmailMatch.userType ===
                                          "company" ||
                                        clientList.find(
                                          (x) =>
                                            x.email.toLowerCase() ===
                                              platformEmailMatch.email.toLowerCase() ||
                                            (platformEmailMatch.id &&
                                              x.mollureUserId ===
                                                platformEmailMatch.id),
                                        )?.clientKind === "company"
                                          ? "company"
                                          : "individual"
                                      }
                                    />
                                  </Stack>
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
                      phonePlaceholder="+316xxxxxxxx"
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
                      phonePlaceholder="+316xxxxxxxx"
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
                        placeholder="Enter last name (optional)"
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
                      label="Contact Number"
                      phonePlaceholder="Phone number"
                      required
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
                          {(() => {
                            return showProfessionalActionMenu(viewingBookingEvent) ? (
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
                                Actions
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
                                  const protectiveFeeCheckoutApplicable =
                                    canCheckoutProtectiveFee({
                                      status: viewingBookingEvent.status,
                                      showLateCancellation,
                                      lateCancellationFeeAmount,
                                      showNoShowFee,
                                      noShowFeeAmount,
                                    });
                                  const actions =
                                    resolveProfessionalBookingActions(
                                      viewingBookingEvent,
                                      { protectiveFeeCheckoutApplicable },
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
                                    const checkoutLabel =
                                      viewingBookingEvent.status ===
                                        "Cancelled" ||
                                      viewingBookingEvent.status === "No Show"
                                        ? "Send fee checkout"
                                        : "Checkout";
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
                                        {checkoutLabel}
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
                            ) : null;
                          })()}
                        </Stack>

                        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                          {viewingBookingOverlapsBlockTime ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1,
                                px: 1.25,
                                py: 1.15,
                                borderRadius: "10px",
                                bgcolor: m.statusOrangeBg,
                                border: `1px solid ${alpha(m.statusOrangeFg, 0.28)}`,
                              }}
                            >
                              <WarningAmberRoundedIcon
                                sx={{
                                  fontSize: 18,
                                  color: m.statusOrangeFg,
                                  mt: "1px",
                                  flexShrink: 0,
                                }}
                              />
                              <BodyText
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: alpha(m.navy, 0.82),
                                  lineHeight: 1.45,
                                }}
                              >
                                This booking overlaps Block Time. Reschedule or
                                cancel and notify the client.
                              </BodyText>
                            </Box>
                          ) : null}
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
                              {viewingBookingEvent.details?.silentUpdated &&
                              viewingBookingEvent.bookingScenario !== "EBR" &&
                              viewingBookingEvent.bookingScenario !== "ER" ? (
                                <Tooltip
                                  title={ACTIVITY_COMPARISON_SIGNPOST}
                                  placement="top"
                                >
                                  <Chip
                                    size="small"
                                    label="Updated"
                                    onClick={() =>
                                      openActivityComparison("silent_updated")
                                    }
                                    sx={{
                                      height: 18,
                                      fontSize: 9,
                                      fontWeight: 800,
                                      borderRadius: "6px",
                                      border: `1px solid ${alpha(m.teal, 0.4)}`,
                                      bgcolor: alpha(m.teal, 0.12),
                                      color: m.teal,
                                      cursor: "pointer",
                                      "& .MuiChip-label": {
                                        px: 0.7,
                                        py: 0,
                                        lineHeight: 1.2,
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : null}
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
                                const comparisonSignpost =
                                  indicator === "EBR" || indicator === "ER";

                                return (
                                  <Tooltip
                                    key={indicator}
                                    title={
                                      comparisonSignpost
                                        ? ACTIVITY_COMPARISON_SIGNPOST
                                        : BOOKING_SCENARIO_LABELS[indicator]
                                    }
                                    placement="top"
                                  >
                                    <Chip
                                      size="small"
                                      onClick={
                                        comparisonSignpost
                                          ? () =>
                                              openActivityComparison(
                                                indicator === "ER"
                                                  ? "er"
                                                  : "ebr",
                                              )
                                          : undefined
                                      }
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
                                        cursor: comparisonSignpost
                                          ? "pointer"
                                          : "default",
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
                          </Box>
                        </Paper>
                      ) : null}

                      {!isViewingExisting && allowDrawerTimeSelection ? (
                        <Box sx={{ mt: 1.5 }}>
                          <BodyText
                            sx={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "primary.light",
                              mb: 0.85,
                            }}
                          >
                            Select time
                          </BodyText>
                          {drawerSelectableTimes.length ? (
                            <AppTimePanel
                              compact
                              hideHeader
                              variant="clock"
                              value={
                                selectedSlot?.start?.slice(0, 5) ||
                                drawerSelectableTimes[0] ||
                                "09:00"
                              }
                              onChange={applyDrawerTimeSlot}
                              minuteStep={grid.stepMinutes}
                              allowedTimes={drawerSelectableTimes}
                            />
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
                                  <ButtonBase
                                    onClick={(e) => {
                                      const identity = viewingBookingEvent
                                        ? identityFromCalendarEvent(viewingBookingEvent)
                                        : {
                                            name: selectedClient?.name,
                                            email: selectedClient?.email,
                                            customerId: selectedClient?.mollureUserId,
                                            clientKind: selectedClient?.clientKind,
                                          };
                                      handleClientNameClick(
                                        identity,
                                        e.currentTarget,
                                        "booking-drawer",
                                      );
                                    }}
                                    sx={{
                                      textAlign: "left",
                                      borderRadius: "6px",
                                      px: 0.25,
                                      py: 0.15,
                                      "&:hover": {
                                        bgcolor: alpha(m.navy, 0.05),
                                      },
                                    }}
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
                                  </ButtonBase>
                                  {selectedClient ? (
                                    <BookingClientTags
                                      isMollure={
                                        Boolean(selectedClient.mollureUserId) ||
                                        addClientSource === "mollure-platform"
                                      }
                                      clientKind={resolvedSelectedClientKind}
                                    />
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
                              {isViewingBooking &&
                              viewingBookingEvent &&
                              Boolean(viewingBookingEvent.details?.customerId) ? (
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

                            {bookingDrawerNotListedIdentity ? (
                              <CalendarClientNotInListHint
                                adding={isAddingClient}
                                addDisabled={
                                  !canAddIdentityToClientList(
                                    bookingDrawerNotListedIdentity,
                                  ).ok
                                }
                                addDisabledReason={getAddToClientListDisabledReason(
                                  bookingDrawerNotListedIdentity,
                                )}
                                onAdd={() =>
                                  void addIdentityToClientList(
                                    bookingDrawerNotListedIdentity,
                                  )
                                }
                              />
                            ) : null}

                            <BookingDrawerSelectedItemsSection
                              nested
                              services={selectedServices}
                              products={selectedProducts}
                              uniqueItems={bookingUniqueItems}
                              cancelledServices={mainCancelledServices}
                              showRemoveButtons={showLineItemRemoveButton}
                              resolveStaffName={(staffResourceId) =>
                                staffResourceId
                                  ? resourceNameById.get(staffResourceId)
                                  : undefined
                              }
                              resolveServiceEditTag={resolveServiceEditTag}
                              resolveProductEditTag={resolveProductEditTag}
                              editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                              onEditTagSignpostClick={openDrawerLineTagComparison}
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
                              onEditProduct={
                                !isViewingExisting || incomingRequestEditMode
                                  ? (product) =>
                                      openEditBookingProductLine(
                                        product,
                                        "client",
                                      )
                                  : undefined
                              }
                              onEditUniqueItem={
                                !isViewingExisting || incomingRequestEditMode
                                  ? (item) =>
                                      openEditBookingUniqueLine(item, "client")
                                  : undefined
                              }
                              onEditService={
                                !isViewingExisting || incomingRequestEditMode
                                  ? (service) =>
                                      openEditServiceFromLineItem(
                                        service,
                                        "client",
                                      )
                                  : undefined
                              }
                              onServiceClick={
                                incomingRequestEditMode
                                  ? (service) => {
                                      openEditServiceFromLineItem(
                                        service,
                                        "client",
                                      );
                                    }
                                  : undefined
                              }
                            />

                            {/* Guest / model / buffer stay in the drawer footer, not beside Add. */}
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
                                Product
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
                                openSelectUniqueItems();
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
                                Unique item
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

                        {chronologicalDrawerGuests.map((guest) => {
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
                          const guestCatalog = partitionBookingProducts(
                            guest.products,
                          );
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
                                ...(participantKind === "buffer"
                                  ? {
                                      "&:hover .booking-buffer-edit-btn": {
                                        opacity: 1,
                                        pointerEvents: "auto",
                                      },
                                    }
                                  : {}),
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
                                      <Box
                                        component="span"
                                        sx={{
                                          ml: 0.75,
                                          fontWeight: 700,
                                          color: alpha(m.navy, 0.45),
                                          fontSize: 11.5,
                                        }}
                                      >
                                        (Internal only)
                                      </Box>
                                    </BodyText>
                                  ) : (
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={1.15}
                                      sx={{ minWidth: 0, flex: 1 }}
                                    >
                                      <Avatar
                                        sx={{
                                          width: 34,
                                          height: 34,
                                          bgcolor: alpha(m.teal, 0.12),
                                          color: m.teal,
                                          fontWeight: 900,
                                          fontSize: 14,
                                        }}
                                      >
                                        {(guest.name || sectionLabel)
                                          .slice(0, 1)
                                          .toUpperCase()}
                                      </Avatar>
                                      <BodyText
                                        sx={{
                                          fontSize: 12.5,
                                          fontWeight: 900,
                                          color: alpha(m.navy, 0.82),
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        {guest.name || sectionLabel}
                                      </BodyText>
                                    </Stack>
                                  )}
                                  {showClientRemoveButton &&
                                  (participantKind === "guest" ||
                                    participantKind === "model") ? (
                                    <Stack direction="row" spacing={0.25}>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          beginEditInlineGuest(guest)
                                        }
                                        sx={{ color: alpha(m.navy, 0.45) }}
                                        aria-label={`Edit ${guest.name}`}
                                      >
                                        <EditRoundedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setBookingGuests((prev) =>
                                            prev.filter(
                                              (item) => item.id !== guest.id,
                                            ),
                                          );
                                          if (
                                            editingInlineGuestId === guest.id
                                          ) {
                                            setEditingInlineGuestId(null);
                                            setInlineGuestDraft(
                                              emptyInlineGuestDraft,
                                            );
                                            setShowInlineGuestField(false);
                                          }
                                          if (addMenuTarget === guest.id)
                                            setSlotAddMenuAnchor(null);
                                        }}
                                        sx={{ color: alpha(m.navy, 0.35) }}
                                        aria-label={`Remove ${guest.name}`}
                                      >
                                        <CloseRoundedIcon
                                          sx={{ fontSize: 17 }}
                                        />
                                      </IconButton>
                                    </Stack>
                                  ) : participantKind === "buffer" &&
                                    (!isViewingExisting ||
                                      showClientRemoveButton) ? (
                                    <Stack direction="row" spacing={0.25}>
                                      {!isViewingExisting ? (
                                        <IconButton
                                          className="booking-buffer-edit-btn"
                                          size="small"
                                          onClick={() => beginEditBuffer(guest)}
                                          sx={{
                                            color: alpha(m.navy, 0.42),
                                            opacity: 0,
                                            pointerEvents: "none",
                                            transition:
                                              "opacity 0.15s, color 0.15s, background-color 0.15s",
                                            "&:hover": {
                                              color: m.teal,
                                              bgcolor: alpha(m.teal, 0.08),
                                            },
                                          }}
                                          aria-label={`Edit ${guest.name || "buffer"}`}
                                        >
                                          <EditRoundedIcon
                                            sx={{ fontSize: 17 }}
                                          />
                                        </IconButton>
                                      ) : null}
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
                                          <CloseRoundedIcon
                                            sx={{ fontSize: 17 }}
                                          />
                                        </IconButton>
                                      ) : null}
                                    </Stack>
                                  ) : showClientRemoveButton ? (
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
                                    <Stack
                                      direction="row"
                                      spacing={1.25}
                                      sx={{ mb: 1.5 }}
                                    >
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <AppTimePicker
                                          label="Start Time"
                                          value={guest.planningStartTime ?? ""}
                                          onChange={(startTime) => {
                                            setBookingGuests((prev) =>
                                              sortCalendarGuestsByStartTime(
                                                prev.map((item) => {
                                                  if (item.id !== guest.id)
                                                    return item;
                                                  const endTime =
                                                    item.planningEndTime ?? "";
                                                  const mins =
                                                    minutesBetweenTimes(
                                                      startTime,
                                                      endTime,
                                                    );
                                                  return {
                                                    ...item,
                                                    planningStartTime:
                                                      startTime,
                                                    planningDuration:
                                                      mins > 0
                                                        ? formatDurationMinsLabel(
                                                            mins,
                                                          )
                                                        : "",
                                                  };
                                                }),
                                              ),
                                            );
                                          }}
                                          minuteStep={15}
                                          fullWidth
                                          disabled={isViewingExisting}
                                        />
                                      </Box>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <AppTimePicker
                                          label="End Time"
                                          value={guest.planningEndTime ?? ""}
                                          onChange={(endTime) => {
                                            setBookingGuests((prev) =>
                                              sortCalendarGuestsByStartTime(
                                                prev.map((item) => {
                                                  if (item.id !== guest.id)
                                                    return item;
                                                  const startTime =
                                                    item.planningStartTime ?? "";
                                                  const mins =
                                                    minutesBetweenTimes(
                                                      startTime,
                                                      endTime,
                                                    );
                                                  return {
                                                    ...item,
                                                    planningEndTime: endTime,
                                                    planningDuration:
                                                      mins > 0
                                                        ? formatDurationMinsLabel(
                                                            mins,
                                                          )
                                                        : "",
                                                  };
                                                }),
                                              ),
                                            );
                                          }}
                                          minuteStep={15}
                                          fullWidth
                                          disabled={isViewingExisting}
                                        />
                                      </Box>
                                    </Stack>
                                    <AppTextField
                                      label="Duration"
                                      placeholder="—"
                                      value={
                                        formatDurationMinsLabel(
                                          minutesBetweenTimes(
                                            guest.planningStartTime ?? "",
                                            guest.planningEndTime ?? "",
                                          ) ||
                                            parseDurationMinsLabel(
                                              guest.planningDuration,
                                            ) ||
                                            0,
                                        ) || ""
                                      }
                                      fullWidth
                                      disabled
                                      InputProps={{ readOnly: true }}
                                    />
                                  </Box>
                                ) : participantKind === "buffer" ? (
                                  <Stack spacing={0.75}>
                                    {guest.bufferStartTime ? (
                                      <BodyText
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.62),
                                        }}
                                      >
                                        Start Time: {guest.bufferStartTime}
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
                                    {guest.planningDuration ? (
                                      <BodyText
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.62),
                                        }}
                                      >
                                        Duration:{" "}
                                        {formatDurationMinsLabel(
                                          parseDurationMinsLabel(
                                            guest.planningDuration,
                                          ) ?? 0,
                                        ) || guest.planningDuration}
                                      </BodyText>
                                    ) : null}
                                    {guest.bufferTeamMemberId ? (
                                      <BodyText
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.62),
                                        }}
                                      >
                                        {resourceNameById.get(
                                          guest.bufferTeamMemberId,
                                        ) ?? "Unassigned"}
                                      </BodyText>
                                    ) : null}
                                  </Stack>
                                ) : (
                                  <>
                                <BookingDrawerSelectedItemsSection
                                  nested
                                  services={guest.services}
                                  products={guestCatalog.products}
                                  uniqueItems={guestCatalog.uniqueItems}
                                  cancelledServices={cancelledServicesForDrawer.filter(
                                    (service) => service.guestId === guest.id,
                                  )}
                                  showRemoveButtons={showLineItemRemoveButton}
                                  resolveStaffName={(staffResourceId) =>
                                    staffResourceId
                                      ? resourceNameById.get(staffResourceId)
                                      : undefined
                                  }
                                  resolveServiceEditTag={resolveServiceEditTag}
                                  resolveProductEditTag={resolveProductEditTag}
                                  editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                                  onEditTagSignpostClick={openDrawerLineTagComparison}
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
                                  onRemoveUniqueItem={(itemId) => {
                                    setBookingGuests((prev) =>
                                      prev.map((item) =>
                                        item.id === guest.id
                                          ? {
                                              ...item,
                                              products: item.products.filter(
                                                (prd) => prd.id !== itemId,
                                              ),
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  onEditService={
                                    !isViewingExisting ||
                                    incomingRequestEditMode
                                      ? (service) =>
                                          openEditServiceFromLineItem(
                                            service,
                                            guest.id,
                                          )
                                      : undefined
                                  }
                                  onEditProduct={
                                    !isViewingExisting ||
                                    incomingRequestEditMode
                                      ? (product) =>
                                          openEditBookingProductLine(
                                            product,
                                            guest.id,
                                          )
                                      : undefined
                                  }
                                  onEditUniqueItem={
                                    !isViewingExisting ||
                                    incomingRequestEditMode
                                      ? (item) =>
                                          openEditBookingUniqueLine(
                                            item,
                                            guest.id,
                                          )
                                      : undefined
                                  }
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
                            ref={inlineGuestFormRef}
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
                              {editingInlineGuestId
                                ? inlineGuestParticipantType === "model"
                                  ? "Edit Model"
                                  : "Edit Guest"
                                : inlineGuestParticipantType === "model"
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
                                placeholder="Optional"
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
                            <AppTextField
                              label="Email"
                              placeholder="Email (optional)"
                              value={inlineGuestDraft.email}
                              onChange={(e) =>
                                setInlineGuestDraft((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              fullWidth
                              disabled={isViewingExisting}
                              sx={{ mb: 1.25 }}
                            />
                            <AppCountryPhoneFields
                              countryCode={inlineGuestDraft.phoneCode}
                              phone={inlineGuestDraft.phoneNumber}
                              onCountryCodeChange={(dialCode) =>
                                setInlineGuestDraft((prev) => ({
                                  ...prev,
                                  phoneCode: dialCode,
                                }))
                              }
                              onPhoneChange={(phone) =>
                                setInlineGuestDraft((prev) => ({
                                  ...prev,
                                  phoneNumber: phone,
                                }))
                              }
                              label="Contact Number (optional)"
                              phonePlaceholder="Phone number"
                              required={false}
                              disabled={isViewingExisting}
                            />
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ mt: 1.25 }}
                            >
                              <AppButton
                                tone="primary"
                                onClick={addInlineGuest}
                                disabled={isViewingExisting}
                                sx={{
                                  height: 38,
                                  minWidth: 96,
                                }}
                              >
                                {editingInlineGuestId ? "Save" : "Add"}
                              </AppButton>
                              {editingInlineGuestId || showInlineGuestField ? (
                                <AppButton
                                  tone="secondary"
                                  onClick={() => {
                                    setShowInlineGuestField(false);
                                    setEditingInlineGuestId(null);
                                    setInlineGuestDraft(emptyInlineGuestDraft);
                                  }}
                                  disabled={isViewingExisting}
                                  sx={{ height: 38, minWidth: 96 }}
                                >
                                  Cancel
                                </AppButton>
                              ) : null}
                            </Stack>
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
                                        fontSize: 16,
                                        fontWeight: 900,
                                        color: m.headingText,
                                      }}
                                    >
                                      Amount
                                    </BodyText>
                                    <BodyText
                                      sx={{
                                        fontSize: 18,
                                        fontWeight: 900,
                                        color: m.headingText,
                                      }}
                                    >
                                      {`${
                                        Number.isInteger(kilometerAllowanceAmount)
                                          ? kilometerAllowanceAmount
                                          : kilometerAllowanceAmount.toFixed(2)
                                      }€`}
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
                                  onChange={(val) => {
                                    const nextProvince = String(val ?? "");
                                    const nextOptions =
                                      resolveDesiredVisitAddressOptions(
                                        desiredLocationSetup,
                                        nextProvince,
                                      );
                                    setDesiredLocationDraft((p) => ({
                                      ...p,
                                      province: nextProvince,
                                      municipality:
                                        nextOptions.municipalityOptions.includes(
                                          p.municipality,
                                        )
                                          ? p.municipality
                                          : "",
                                    }));
                                  }}
                                  options={[
                                    ...(desiredLocationDraft.province &&
                                    !desiredVisitAddressOptions.provinceOptions.includes(
                                      desiredLocationDraft.province,
                                    )
                                      ? [
                                          {
                                            label: desiredLocationDraft.province,
                                            value: desiredLocationDraft.province,
                                          },
                                        ]
                                      : []),
                                    ...desiredVisitAddressOptions.provinceOptions.map(
                                      (province) => ({
                                        label: province,
                                        value: province,
                                      }),
                                    ),
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
                                      municipality: String(val ?? ""),
                                    }))
                                  }
                                  options={[
                                    ...(desiredLocationDraft.municipality &&
                                    !desiredVisitAddressOptions.municipalityOptions.includes(
                                      desiredLocationDraft.municipality,
                                    )
                                      ? [
                                          {
                                            label:
                                              desiredLocationDraft.municipality,
                                            value:
                                              desiredLocationDraft.municipality,
                                          },
                                        ]
                                      : []),
                                    ...desiredVisitAddressOptions.municipalityOptions.map(
                                      (municipality) => ({
                                        label: municipality,
                                        value: municipality,
                                      }),
                                    ),
                                  ]}
                                  fullWidth
                                  placeholder="Select municipality"
                                  disabled={!desiredLocationDraft.province}
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
                          label={
                            addClientSource === "guest"
                              ? "Contact Number"
                              : "Contact Number (optional)"
                          }
                          phonePlaceholder="+316xxxxxxxx"
                          required={addClientSource === "guest"}
                          disabled={isViewingExisting}
                        />

                        {paymentMethod === "online" &&
                        !isDrawerPrepaymentPaid &&
                        !isViewingExisting ? (
                          <AppTextField
                            label="Email"
                            placeholder="Email for online payment"
                            value={selectedClient?.email ?? ""}
                            onChange={(e) =>
                              setSelectedClient((prev) =>
                                prev
                                  ? { ...prev, email: e.target.value }
                                  : prev,
                              )
                            }
                            fullWidth
                            error={Boolean(slotErrors.bookingClientEmail)}
                            helperText={
                              slotErrors.bookingClientEmail ||
                              (selectedClient?.email?.trim()
                                ? undefined
                                : "Required for online payment")
                            }
                          />
                        ) : paymentMethod === "online" &&
                          selectedClient?.email?.trim() ? (
                          <BodyText
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 650,
                              color: alpha(m.navy, 0.55),
                            }}
                          >
                            Email: {selectedClient.email.trim()}
                          </BodyText>
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
                                  setShowLateCancellation(false);
                                  setLateCancellationFeePercent("");
                                  setLateCancellationFeePercentCeiling("");
                                  setCancellationFeeAt(undefined);
                                  setExceededCancellationWindow(undefined);
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove late cancellation"
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
                              {typeof exceededCancellationWindow === "boolean"
                                ? exceededCancellationWindow
                                  ? " · Outside notice window"
                                  : " · Within notice window"
                                : null}
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
                                    clampProtectiveFeePercent(
                                      sanitizeDecimalInput(e.target.value),
                                      lateCancellationFeePercentCeiling ||
                                        lateCancellationFeePercentDefault,
                                    ),
                                  )
                                }
                                inputProps={{
                                  inputMode: "decimal",
                                  max: parsePolicyPercentCeiling(
                                    lateCancellationFeePercentCeiling ||
                                      lateCancellationFeePercentDefault,
                                  ),
                                }}
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
                                  setShowLateRescheduling(false);
                                  setLateRescheduleFeePercent("");
                                  setLateRescheduleFeePercentCeiling("");
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove late rescheduling"
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
                                    clampProtectiveFeePercent(
                                      sanitizeDecimalInput(e.target.value),
                                      lateRescheduleFeePercentCeiling ||
                                        lateRescheduleFeePercentDefault,
                                    ),
                                  )
                                }
                                inputProps={{
                                  inputMode: "decimal",
                                  max: parsePolicyPercentCeiling(
                                    lateRescheduleFeePercentCeiling ||
                                      lateRescheduleFeePercentDefault,
                                  ),
                                }}
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

                        {showNoShowFee ? (
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
                                No-Show Fee
                              </BodyText>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setShowNoShowFee(false);
                                  setNoShowFeePercent("");
                                  setNoShowFeePercentCeiling("");
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Remove no-show fee"
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
                              Fee for a guest tagged No Show. You may only
                              decrease or remove this fee.
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
                                value={noShowFeePercent}
                                onChange={(e) =>
                                  setNoShowFeePercent(
                                    clampProtectiveFeePercent(
                                      sanitizeDecimalInput(e.target.value),
                                      noShowFeePercentCeiling ||
                                        noShowFeePercentDefault,
                                    ),
                                  )
                                }
                                inputProps={{
                                  inputMode: "decimal",
                                  max: parsePolicyPercentCeiling(
                                    noShowFeePercentCeiling ||
                                      noShowFeePercentDefault,
                                  ),
                                }}
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
                                €{noShowFeeAmount}
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
                                  {prepaymentSectionTitle}
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
                                  {prepaymentSectionTitle}:
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
                                  {isDrawerPrepaymentPaid
                                    ? "Remaining after prepaid"
                                    : "Remaining after prepayment"}
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

                                {isDrawerPrepaymentPaid ? (
                                  <BodyText
                                    sx={{
                                      fontSize: 12.75,
                                      fontWeight: 850,
                                      color: alpha(m.navy, 0.74),
                                      py: 0.65,
                                    }}
                                  >
                                    {persistedPaymentIsOffline ||
                                    drawerPaymentMethod === "offline"
                                      ? "Prepaid – Offline Direct"
                                      : "Prepaid – Online Direct"}
                                  </BodyText>
                                ) : (
                                  (
                                    [
                                      {
                                        key: "online" as const,
                                        label: "Online Direct",
                                      },
                                      {
                                        key: "offline" as const,
                                        label: "Offline Direct",
                                      },
                                    ] as const
                                  )
                                    .filter((pm) => {
                                      if (paymentMethodPolicy === "online-only") {
                                        return pm.key === "online";
                                      }
                                      if (paymentMethodPolicy === "offline-only") {
                                        return pm.key === "offline";
                                      }
                                      return true;
                                    })
                                    .map((pm) => {
                                      const active = paymentMethod === pm.key;
                                      return (
                                        <ButtonBase
                                          key={pm.key}
                                          onClick={() =>
                                            setPaymentMethod(pm.key)
                                          }
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
                                    })
                                )}
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

                        {showIncomingRequestActions || showIncomingErActions
                        ? (
                          <>
                            {!responseActionsDismissed ? (
                              <BookingRequestResponseActions
                                onAccept={() =>
                                  setIncomingConfirmAction("accept")
                                }
                                onSuggestChange={() =>
                                  setIncomingConfirmAction("suggest")
                                }
                                onReject={() =>
                                  setIncomingConfirmAction("reject")
                                }
                                showAccept={
                                  showIncomingErActions ||
                                  !onlinePrepayBlocksAccept
                                }
                              />
                            ) : null}
                            <InlineTimedSnackbar
                              open={Boolean(actionFeedback)}
                              message={actionFeedback?.message}
                              severity={actionFeedback?.severity}
                              onClose={() => setActionFeedback(null)}
                            />
                          </>
                        ) : actionFeedback ? (
                          <InlineTimedSnackbar
                            open
                            message={actionFeedback.message}
                            severity={actionFeedback.severity}
                            onClose={() => setActionFeedback(null)}
                          />
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

                        {isViewingBooking &&
                        (isBookingRequestAccepted(viewingBookingEvent) ||
                          Boolean(viewingBookingEvent?.details?.needsOk)) ? (
                          <BookingRequestAcceptedPanel
                            totalPrice={drawerPriceDisplay.displayTotal}
                            originalPrice={drawerPriceDisplay.originalPrice}
                            prepaymentPercent={
                              Number(prepaymentPercent) || undefined
                            }
                            prepaymentAmount={prepaymentAmount}
                            remainingAmount={remainingAfterPrepayment}
                            lines={priceSummaryLines}
                            discountAmount={bookingDiscountAmount}
                            onOk={handleAcknowledgeAcceptedBr}
                          />
                        ) : (
                          <BookingDrawerTotalPriceCard
                            payableTotal={
                              showPrepayment
                                ? bookingTotalForSave
                                : drawerPriceDisplay.displayTotal
                            }
                            actualAmount={
                              drawerPriceDisplay.originalPrice ??
                              bookingTotalForSave
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
                            noShowFeeAmount={bookingPrice.noShowFeeAmount}
                            prepaidApplied={
                              isDrawerPrepaymentPaid ? prepaymentAmount : 0
                            }
                            showPrepayment={showPrepayment}
                            prepaymentPaid={isDrawerPrepaymentPaid}
                            prepaymentPercent={Number(prepaymentPercent) || 0}
                            prepaymentAmount={prepaymentAmount}
                            remainingAmount={remainingAfterPrepayment}
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
                        emptyMessage="No activity for this booking yet."
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
      <CalendarTeamMemberBookingsPopover
        open={Boolean(teamActionAnchor)}
        anchorEl={teamActionAnchor}
        memberName={teamMenuResource?.name ?? ""}
        bookings={teamMenuBookings}
        showDate={viewMode !== "day"}
        showEditAvailability={viewMode === "day"}
        editAvailabilityDisabled={!teamMenuResource}
        splitScreenEnabled={viewMode === "day"}
        splitScreenActive={Boolean(splitScreen)}
        splitScreenCandidates={splitScreenCandidates}
        onClose={closeTeamMenu}
        onSelectBooking={(booking) => {
          closeTeamMenu();
          openExistingBooking(booking);
        }}
        onViewProfile={() => {
          const memberId = teamMenuResource?.id;
          closeTeamMenu();
          if (memberId) {
            setTeamProfileMemberId(String(memberId));
          }
        }}
        onEditAvailability={openTeamMemberAvailabilityEditor}
        onSplitScreenWith={openSplitScreenWith}
        onDiscardSplitScreen={() => {
          discardSplitScreen();
          closeTeamMenu();
        }}
      />
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
          applyFilters(filters);
          if (
            calendarFiltersAreNarrowing(filters, { locationFilterAvailable }) &&
            filters.teamAll
          ) {
            setSplitScreen(null);
          }
          setFiltersOpen(false);
        }}
      />
      <CalendarSlotAddMenu
        anchorPosition={slotAddAnchor}
        onClose={() => {
          setSlotAddAnchor(null);
          setPendingSlotPayload(null);
        }}
        onSelect={handleSlotAddContinue}
      />
      <CalendarBlockTimeModal
        availableLocations={data.supportedLocations}
        draft={blockDraft}
        onApply={async () => {
          if (!blockDraft.title) {
            showSnackbar({
              severity: "warning",
              message: "Select a title.",
            });
            return;
          }
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
          const colliding = findBookingsInTimeslot(
            events.map((event) => ({
              id: event.id,
              resourceId: event.resourceId,
              date: event.date,
              start: event.start,
              end: event.end,
              status: event.status,
            })),
            blockDraft.teamIds,
            blockDraft.dateFrom,
            blockDraft.dateTo || blockDraft.dateFrom,
            blockDraft.startTime,
            blockDraft.endTime,
          );
          if (colliding.length) {
            pendingOverviewBlockRef.current = blockDraft;
            setBlockOverlapOpen(true);
            return;
          }
          await persistOverviewBlockedTime(blockDraft);
        }}
        onClose={() => setBlockTimeOpen(false)}
        open={blockTimeOpen}
        resources={data.resources}
        setDraft={setBlockDraft}
        teamLabelById={teamLabelById}
      />
      <CalendarScheduleConflictDialog
        open={blockOverlapOpen}
        kind={blockOverlapOpen ? "overlap_booking" : null}
        onClose={() => {
          setBlockOverlapOpen(false);
          pendingOverviewBlockRef.current = null;
        }}
        onConfirm={() => {
          const draft = pendingOverviewBlockRef.current;
          pendingOverviewBlockRef.current = null;
          setBlockOverlapOpen(false);
          if (!draft) return;
          void persistOverviewBlockedTime(draft);
        }}
      />
      <CalendarScheduleConflictDialog
        open={staffConflictOpen}
        kind={
          staffConflictOpen
            ? ("staff_double_book" satisfies CalendarScheduleConflictKind)
            : null
        }
        messageOverride={staffConflictMessage}
        onClose={() => {
          setStaffConflictOpen(false);
          setStaffConflictMessage(null);
          staffConflictAckRef.current = false;
        }}
        onConfirm={() => {
          staffConflictAckRef.current = true;
          setStaffConflictOpen(false);
          setStaffConflictMessage(null);
          void persistBookingFromDrawer().then((saved) => {
            if (saved) closeBookingDrawer();
          });
        }}
      />
      <CalendarPublicBusinessHoursModal
        open={publicBusinessHoursOpen}
        onClose={() => setPublicBusinessHoursOpen(false)}
        onApply={async () => {
          try {
            const location =
              publicBusinessHoursDraft.location ||
              publicBusinessHoursDraft.locations[0];
            if (!location || !publicBusinessHoursDraft.schedule) {
              showSnackbar({
                severity: "error",
                message: "Select location and schedule before applying.",
              });
              return;
            }
            if (
              !publicBusinessHoursDraft.days?.length ||
              publicBusinessHoursDraft.days.length !== 7
            ) {
              showSnackbar({
                severity: "error",
                message: "Configure hours for each weekday before applying.",
              });
              return;
            }
            const existing = Array.isArray(
              calendarSettings?.availability.publicBusinessHours,
            )
              ? calendarSettings.availability.publicBusinessHours
              : [];
            await persistAvailabilitySettings({
              publicBusinessHours: replacePublicBusinessHoursForLocations(
                existing,
                publicBusinessHoursDraft,
              ),
            });
            showSnackbar({
              severity: "success",
              message: "Public business hours saved.",
            });
            setPublicBusinessHoursOpen(false);
            setPublicBusinessHoursDraft(
              createEmptyPublicBusinessHoursDraft(location),
            );
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
            // Persist only colours the professional explicitly chose (no defaults / gray).
            const nextDesign: CalendarDesignDraft = {
              ...designDraft,
              colorsByCategory: Object.fromEntries(
                Object.entries(designDraft.colorsByCategory ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ),
              colorsByService: Object.fromEntries(
                Object.entries(designDraft.colorsByService ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ),
              colorsByStatus: Object.fromEntries(
                Object.entries(designDraft.colorsByStatus ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ) as CalendarDesignDraft["colorsByStatus"],
              colorsByTeamMember: Object.fromEntries(
                Object.entries(designDraft.colorsByTeamMember ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
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
        categoryOptions={categoryOptions}
        templateCategoryRows={templateCategoryRows}
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
        onConfirm={confirmCatalogDelete}
      />
      <DiscardEbrDialog
        open={discardEbrOpen}
        onClose={() => setDiscardEbrOpen(false)}
        onConfirm={handleDiscardEbr}
      />
      <DiscardErDialog
        open={discardErOpen}
        onClose={() => setDiscardErOpen(false)}
        onConfirm={handleDiscardConfirmedEr}
      />
      <BookingRequestConfirmDialog
        open={Boolean(incomingConfirmAction)}
        action={incomingConfirmAction}
        scenario={viewingBookingEvent?.bookingScenario}
        onClose={() => setIncomingConfirmAction(null)}
        onConfirm={() => {
          const action = incomingConfirmAction;
          const prepayRequired =
            showPrepayment &&
            ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0);
          if (
            action === "accept" &&
            !showIncomingErActions &&
            prepayRequired &&
            !isDrawerPrepaymentPaid &&
            !drawerPaymentIsOffline
          ) {
            setIncomingConfirmAction(null);
            showSnackbar({
              severity: "warning",
              message:
                "Prepayment is required. The client must pay before you can accept this booking.",
            });
            return;
          }
          setResponseActionsDismissed(true);
          setActionFeedback({
            severity: "success",
            message:
              action === "accept"
                ? showIncomingErActions
                  ? "Edit request accepted. Client can edit once."
                  : "Booking request accepted."
                : action === "reject"
                  ? showIncomingErActions
                    ? "Edit request rejected. Booking stays Confirmed."
                    : "Booking request rejected."
                  : "You can now suggest a change.",
          });
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
      <FinanceDocumentPreviewDrawer
        open={drawerDocOpen}
        onClose={() => setDrawerDocOpen(false)}
        documentType={drawerDocType}
        invoiceType={
          selectedClient?.clientKind === "company" ||
          viewingBookingEvent?.clientKind === "company" ||
          viewingBookingEvent?.details?.clientKind === "company"
            ? "company"
            : "individual"
        }
        settings={financeSettings}
        row={
          drawerDocType === "receipt"
            ? (drawerReceiptRow ?? drawerInvoiceRow)
            : drawerInvoiceRow
        }
        professionalBusinessOverride={professionalBusinessOverride}
      />
      <Popover
        open={Boolean(notInListPopover)}
        anchorEl={notInListPopover?.anchorEl ?? null}
        onClose={closeNotInListPopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              p: 1.5,
              borderRadius: "10px",
              maxWidth: 280,
              boxShadow: "0 12px 32px rgba(16,35,63,0.14)",
            },
          },
        }}
      >
        {notInListPopover ? (
          <CalendarClientNotInListHint
            adding={isAddingClient}
            addDisabled={
              !canAddIdentityToClientList(notInListPopover.identity).ok
            }
            addDisabledReason={getAddToClientListDisabledReason(
              notInListPopover.identity,
            )}
            onAdd={() =>
              void addIdentityToClientList(notInListPopover.identity)
            }
          />
        ) : null}
      </Popover>
      <AppDrawer
        anchor="right"
        open={Boolean(viewClient)}
        onClose={closeClientDetailsDrawer}
        title="Client Details"
        contentSx={{
          bgcolor: alpha(m.navy, 0.03),
          p: 0,
        }}
      >
        {viewClient ? (
          <ClientDetailsViewPanel
            client={viewClient}
            onSaveTechnicalNote={saveClientTechnicalNote}
          />
        ) : null}
      </AppDrawer>
      <CalendarTeamMemberProfileDrawer
        open={Boolean(teamProfileMemberId)}
        memberId={teamProfileMemberId}
        onClose={() => setTeamProfileMemberId(null)}
      />
    </Stack>
  );
}
