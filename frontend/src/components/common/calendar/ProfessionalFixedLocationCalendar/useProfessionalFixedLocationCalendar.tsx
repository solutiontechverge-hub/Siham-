"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "../../AppSnackbar";
import { useCalendarClientProfile } from "../useCalendarClientProfile";
import { resolveKilometerAllowanceAmount } from "../bookingEventDetails";
import { useFinanceInvoiceSettings } from "../../../sections/finance/useFinanceInvoiceSettings";
import { useCalendarFilters } from "../useCalendarFilters";
import {
  getBookingServiceEditErrors,
} from "../../../../data/bookingServiceEdit.data";
import {
  getCombinedAvailabilityIntervals,
  hasScheduleWindowsOnDate as resourceHasScheduleWindowsOnDate,
  shopNotAcceptingBookingTooltip,
} from "../calendar-schedule.utils";
import {
  fmtMinToTime,
  formatMdyDate,
  calendarFiltersAreNarrowing,
  minutesSinceMidnight,
  type TimelineGridSlotColors,
} from "../calendar.utils";
import { useProfessionalBusinessOverride } from "../../finance-documents";
import {
  type CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { useUploadBookingAttachmentsMutation, useManageBookingEditRequestMutation } from "../../../../store/services/businessApi";
import {
  useCreateFinanceTransactionMutation,
  useProcessFinanceInvoiceReissuesMutation,
  useRestartPrepaymentDueMutation,
} from "../../../../store/services/financeApi";
import type { ProfessionalFixedLocationCalendarProps } from "./useProfessionalFixedLocationCalendar.types";
import {
  applyPendingInlineGuestEdit,
  calendarStatusToApiValue,
  clockHm,
  computeSlotValidation,
  filterEventsMatchingDrawerFilters,
  findFocusBookingMatch,
  formatLateCancelNoticeLabel,
  isIsoDateTime,
  isMinuteInAvailability,
  locationToApi,
  toDateTimeInput,
} from "./useProfessionalFixedLocationCalendar.helpers";
import { useProfessionalFixedLocationCalendarScheduleSettings } from "./useProfessionalFixedLocationCalendar.scheduleSettings";
import { useProfessionalFixedLocationCalendarTeam } from "./useProfessionalFixedLocationCalendar.team";
import { useProfessionalFixedLocationCalendarHorizontalScroll } from "./useProfessionalFixedLocationCalendar.horizontalScroll";
import { useProfessionalFixedLocationCalendarViewNavigation } from "./useProfessionalFixedLocationCalendar.viewNavigation";
import { useProfessionalFixedLocationCalendarAvailability } from "./useProfessionalFixedLocationCalendar.availability";
import { useProfessionalFixedLocationCalendarBlockTime } from "./useProfessionalFixedLocationCalendar.blockTime";
import { useProfessionalFixedLocationCalendarServiceProductScreens } from "./useProfessionalFixedLocationCalendar.serviceProductScreens";
import { useProfessionalFixedLocationCalendarDrawerGuests } from "./useProfessionalFixedLocationCalendar.drawerGuests";
import { useProfessionalFixedLocationCalendarDrawerLineTags } from "./useProfessionalFixedLocationCalendar.drawerLineTags";
import { useProfessionalFixedLocationCalendarDrawerSchedule } from "./useProfessionalFixedLocationCalendar.drawerSchedule";
import { useProfessionalFixedLocationCalendarDrawerEditDirty } from "./useProfessionalFixedLocationCalendar.drawerEditDirty";
import { useProfessionalFixedLocationCalendarFeeState } from "./useProfessionalFixedLocationCalendar.feeState";
import { useProfessionalFixedLocationCalendarTeamMemberPicker } from "./useProfessionalFixedLocationCalendar.teamMemberPicker";
import { useProfessionalFixedLocationCalendarOpenExistingBooking } from "./useProfessionalFixedLocationCalendar.openExistingBooking";
import { useProfessionalFixedLocationCalendarBookingPersist } from "./useProfessionalFixedLocationCalendar.bookingPersist";
import { useProfessionalFixedLocationCalendarBookingActions } from "./useProfessionalFixedLocationCalendar.bookingActions";
import { useProfessionalFixedLocationCalendarOpenBookingDrawer } from "./useProfessionalFixedLocationCalendar.openBookingDrawer";
import { useProfessionalBookingDrawerDraft } from "./useProfessionalBookingDrawerDraft";
import { useProfessionalFixedLocationCalendarPersistBookingFromDrawer } from "./useProfessionalFixedLocationCalendar.persistBookingFromDrawer";
import { useProfessionalFixedLocationCalendarRenderHelpers } from "./useProfessionalFixedLocationCalendar.renderHelpers";
import { useProfessionalFixedLocationCalendarProjectUploads } from "./useProfessionalFixedLocationCalendar.projectUploads";
import { useProfessionalFixedLocationCalendarPersistOverviewBlockedTime } from "./useProfessionalFixedLocationCalendar.persistOverviewBlockedTime";
import { useProfessionalFixedLocationCalendarDrawerScrollFocus } from "./useProfessionalFixedLocationCalendar.drawerScrollFocus";
import { useProfessionalFixedLocationCalendarAddClientLookup } from "./useProfessionalFixedLocationCalendar.addClientLookup";
import { useProfessionalFixedLocationCalendarBookingTotals } from "./useProfessionalFixedLocationCalendar.bookingTotals";
import { useProfessionalFixedLocationCalendarSlotAdd } from "./useProfessionalFixedLocationCalendar.slotAdd";
import { useProfessionalFixedLocationCalendarDrawerPaymentDocs } from "./useProfessionalFixedLocationCalendar.drawerPaymentDocs";
import { useProfessionalFixedLocationCalendarDrawerUiGates } from "./useProfessionalFixedLocationCalendar.drawerUiGates";
import { useProfessionalFixedLocationCalendarOverviewSync } from "./useProfessionalFixedLocationCalendar.overviewSync";
import { useProfessionalFixedLocationCalendarNoShowParticipants } from "./useProfessionalFixedLocationCalendar.noShowParticipants";
import { useProfessionalFixedLocationCalendarDrawerLineItemsState } from "./useProfessionalFixedLocationCalendar.drawerLineItemsState";
import { useProfessionalFixedLocationCalendarDrawerParticipantState } from "./useProfessionalFixedLocationCalendar.drawerParticipantState";
import { useProfessionalFixedLocationCalendarIncomingUiState } from "./useProfessionalFixedLocationCalendar.incomingUiState";
import { useProfessionalFixedLocationCalendarClientIdentityDrafts } from "./useProfessionalFixedLocationCalendar.clientIdentityDrafts";
import { useProfessionalFixedLocationCalendarDrawerShellState } from "./useProfessionalFixedLocationCalendar.drawerShellState";
import { useProfessionalFixedLocationCalendarViewRange } from "./useProfessionalFixedLocationCalendar.viewRange";
import { useProfessionalFixedLocationCalendarViewingBooking } from "./useProfessionalFixedLocationCalendar.viewingBooking";
import { useProfessionalFixedLocationCalendarMessaging } from "./useProfessionalFixedLocationCalendar.messaging";

export type {
  InlineGuestDraftState,
  ProfessionalFixedLocationCalendarProps,
} from "./useProfessionalFixedLocationCalendar.types";
export {
  applyPendingInlineGuestEdit,
  calendarStatusToApiValue,
  clockHm,
  isIsoDateTime,
  isMinuteInAvailability,
  locationToApi,
  toDateTimeInput,
} from "./useProfessionalFixedLocationCalendar.helpers";

export function useProfessionalFixedLocationCalendar({
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
  kilometerAllowanceEurPerKmDefault,
  appointmentBeforeHours,
  appointmentBeforeMinutes,
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
  // Flat 30-minute default always applies for new requests.
  const responseTimeConfigured = true;
  const { settings: financeSettings, setSettings: setFinanceSettings } =
    useFinanceInvoiceSettings();
  const professionalBusinessOverride = useProfessionalBusinessOverride();
  const shopDisplayName =
    professionalBusinessOverride?.shopName?.trim() || "This shop";
  const unavailableBookingTooltip = React.useMemo(
    () => shopNotAcceptingBookingTooltip(shopDisplayName),
    [shopDisplayName],
  );
  const [uploadBookingAttachments] = useUploadBookingAttachmentsMutation();
  const [manageBookingEditRequest] = useManageBookingEditRequestMutation();

  const {
    baseServiceCatalog,
    serviceCatalogPatches,
    setServiceCatalogPatches,
    selectableServiceCatalog,
    productCatalog,
    setProductCatalog,
    editingBookingLine,
    setEditingBookingLine,
    persistedUniqueCatalog,
    selectedServices,
    setSelectedServices,
    serviceSelectionDraft,
    setServiceSelectionDraft,
    serviceOverridesDraft,
    setServiceOverridesDraft,
    serviceEditDraft,
    setServiceEditDraft,
    serviceEditAttempted,
    setServiceEditAttempted,
    serviceEditOrigin,
    setServiceEditOrigin,
    selectedProducts,
    setSelectedProducts,
    productSelectionDraft,
    setProductSelectionDraft,
    uniqueItemDraft,
    setUniqueItemDraft,
    uniqueItemOrigin,
    setUniqueItemOrigin,
    editingCatalogProductId,
    setEditingCatalogProductId,
    bookingUniqueItems,
    setBookingUniqueItems,
    customBookingProducts,
    setCustomBookingProducts,
    mergedCustomBookingProducts,
    uniqueItemSelectionDraft,
    setUniqueItemSelectionDraft,
  } = useProfessionalFixedLocationCalendarDrawerLineItemsState({
    serviceCatalog,
    financeProducts: financeSettings.products,
    financeUniqueItems: financeSettings.uniqueItems ?? [],
  });
  const { openMessaging, openMessagingForBooking, openBookingMessages } =
    useProfessionalFixedLocationCalendarMessaging(showSnackbar);

  const [editingEventId, setEditingEventId] = React.useState<string | null>(
    null,
  );
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);
  const {
    events,
    setEvents,
    blocks,
    setBlocks,
    overviewEventKey,
  } = useProfessionalFixedLocationCalendarOverviewSync({
    overviewEvents: data.events,
    overviewBlocks: data.blocks,
    isEditingExisting,
  });

  const {
    activeDateIso,
    activeMonthIso,
    defaultDateIso,
    goToday,
    nowMin,
    onNext,
    onPrev,
    prevCandidateIso,
    setActiveDateIso,
    setNowMin,
    setTodayIso,
    setViewMode,
    todayIso,
    viewMode,
    visibleDates,
  } = useProfessionalFixedLocationCalendarViewNavigation({
    onDateRangeChange,
  });
  const [createFinanceTransaction] = useCreateFinanceTransactionMutation();
  const [restartPrepaymentDue] = useRestartPrepaymentDueMutation();
  const drawerShellState = useProfessionalFixedLocationCalendarDrawerShellState({
    initialSubTab: data.initialSubTab,
    supportedLocations: data.supportedLocations,
    editingEventId,
  });
  const {
    addMenuButtonRef,
    activeSubTab,
    setActiveSubTab,
    datePickerAnchor,
    setDatePickerAnchor,
    addAnchor,
    setAddAnchor,
    filtersOpen,
    setFiltersOpen,
    slotDrawerTab,
    setSlotDrawerTab,
    bookingCheckoutOpen,
    setBookingCheckoutOpen,
    focusSalesCardId,
    setFocusSalesCardId,
    reopenBookingAfterSaveRef,
    bookingCheckoutOpenRef,
    editingEventIdRef,
    activityDetailItem,
    setActivityDetailItem,
    slotLocation,
    setSlotLocation,
    slotBookingType,
    setSlotBookingType,
    slotStatus,
    setSlotStatus,
    slotClientAdded,
    setSlotClientAdded,
    slotCalendarOpen,
    setSlotCalendarOpen,
    slotCalendarTouched,
    setSlotCalendarTouched,
    allowDrawerTimeSelection,
    setAllowDrawerTimeSelection,
    slotAddMenuAnchor,
    setSlotAddMenuAnchor,
    bookingActionAnchor,
    setBookingActionAnchor,
    addMenuTarget,
    setAddMenuTarget,
    selectionTarget,
    setSelectionTarget,
    bookingMoreAnchor,
    setBookingMoreAnchor,
    slotBookingScreen,
    setSlotBookingScreen,
    slotSaveAttempted,
    setSlotSaveAttempted,
    teamProfileMemberId,
    setTeamProfileMemberId,
    publicBusinessHoursOpen,
    setPublicBusinessHoursOpen,
    designOpen,
    setDesignOpen,
    slotDrawerOpen,
    setSlotDrawerOpen,
    showSilentFieldTags,
    setShowSilentFieldTags,
    selectedSlot,
    setSelectedSlot,
    staffConflictOpen,
    setStaffConflictOpen,
    staffConflictMessage,
    setStaffConflictMessage,
    staffConflictAckRef,
    slotTabs,
  } = drawerShellState;
  const {
    discardBrOpen,
    setDiscardBrOpen,
    discardEbrOpen,
    setDiscardEbrOpen,
    discardErOpen,
    setDiscardErOpen,
    erNoteDialogOpen,
    setErNoteDialogOpen,
    incomingConfirmAction,
    setIncomingConfirmAction,
    responseActionsDismissed,
    setResponseActionsDismissed,
    actionFeedback,
    setActionFeedback,
    restoreIncomingActions,
    incomingRequestEditMode,
    setIncomingRequestEditMode,
    originalServicesSnapshot,
    setOriginalServicesSnapshot,
    noShowModalOpen,
    setNoShowModalOpen,
    cancelModalOpen,
    setCancelModalOpen,
    pendingBookingAction,
    setPendingBookingAction,
  } = useProfessionalFixedLocationCalendarIncomingUiState({
    editingEventId,
  });
  const {
    showInlineGuestField,
    setShowInlineGuestField,
    inlineGuestDraft,
    setInlineGuestDraft,
    editingInlineGuestId,
    setEditingInlineGuestId,
    inlineGuestParticipantType,
    setInlineGuestParticipantType,
    bookingProjectEnabled,
    setBookingProjectEnabled,
    bookingProjectDescription,
    setBookingProjectDescription,
    bookingProjectUploads,
    setBookingProjectUploads,
    projectFileInputRef,
    bufferDraft,
    setBufferDraft,
    editingBufferId,
    setEditingBufferId,
    bookingGuests,
    setBookingGuests,
    desiredLocationDraft,
    setDesiredLocationDraft,
    desiredVisitMunicipalityOptions,
    showInternalNote,
    setShowInternalNote,
    bookingInternalNote,
    setBookingInternalNote,
    drawerDocOpen,
    setDrawerDocOpen,
    drawerDocType,
    setDrawerDocType,
    showKilometerAllowance,
    setShowKilometerAllowance,
    kilometerAllowanceDraft,
    setKilometerAllowanceDraft,
    applyDesiredLocationKilometerDefaults,
  } = useProfessionalFixedLocationCalendarDrawerParticipantState({
    desiredLocationSetup,
    kilometerAllowanceEurPerKmDefault,
  });
  const clientIdentityDrafts =
    useProfessionalFixedLocationCalendarClientIdentityDrafts();
  const {
    bookingPhoneDraft,
    setBookingPhoneDraft,
    guestDraft,
    setGuestDraft,
    nonMollureClientType,
    setNonMollureClientType,
    nonMollureDraft,
    setNonMollureDraft,
    selectedClient,
    setSelectedClient,
  } = clientIdentityDrafts;
  const {
    addClientSource,
    clientListSelectedEmail,
    lookupMollureClientByEmail,
    platformEmailComplete,
    platformEmailInput,
    platformEmailMatch,
    platformEmailQuery,
    platformLookupStatus,
    setAddClientSource,
    setClientListSelectedEmail,
    setPlatformEmailInput,
    setPlatformEmailMatch,
    setPlatformLookupStatus,
  } = useProfessionalFixedLocationCalendarAddClientLookup({
    slotBookingScreen,
  });

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

  const {
    guestsTotal,
    lineActualAmount,
    lineDiscountAmount,
    productsTotal,
    servicesTotal,
    subtotalPrice,
    uniqueItemsTotal,
  } = useProfessionalFixedLocationCalendarBookingTotals({
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    bookingGuests,
  });
  const openBookingLocation = editingEventId
    ? events.find((event) => event.id === editingEventId)?.location
    : undefined;
  const isDesiredLocationBooking =
    slotLocation === "DL" || openBookingLocation === "DL";
  const kilometerAllowanceAmount = React.useMemo(
    () =>
      isDesiredLocationBooking && showKilometerAllowance
        ? resolveKilometerAllowanceAmount(kilometerAllowanceDraft)
        : 0,
    [
      isDesiredLocationBooking,
      kilometerAllowanceDraft,
      showKilometerAllowance,
    ],
  );
  const {
    showPrepayment,
    setShowPrepayment,
    prepaymentPercent,
    setPrepaymentPercent,
    bookingTotalDiscount,
    setBookingTotalDiscount,
    bookingDiscountModalOpen,
    setBookingDiscountModalOpen,
    showLateCancellation,
    setShowLateCancellation,
    lateCancellationFeePercent,
    setLateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    setLateCancellationFeePercentCeiling,
    showLateRescheduling,
    setShowLateRescheduling,
    lateRescheduleFeePercent,
    setLateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    setLateRescheduleFeePercentCeiling,
    showNoShowFee,
    setShowNoShowFee,
    noShowFeePercent,
    setNoShowFeePercent,
    noShowFeePercentCeiling,
    setNoShowFeePercentCeiling,
    cancellationFeeAt,
    setCancellationFeeAt,
    exceededCancellationWindow,
    setExceededCancellationWindow,
    paymentMethod,
    setPaymentMethod,
    bookingPrice,
    bookingDiscountAmount,
    lateCancellationFeeAmount,
    lateRescheduleFeeAmount,
    noShowFeeAmount,
    prepaymentAmount,
    remainingAfterPrepayment,
    totalPrice,
    bookingTotalForSave,
    priceSummaryLines,
    feeDrawerApply,
  } = useProfessionalFixedLocationCalendarFeeState({
    subtotalPrice,
    kilometerAllowanceAmount,
    servicesTotal,
    guestsTotal,
    productsTotal,
    uniqueItemsTotal,
  });

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

  const {
    blockDraft,
    blockOverlapOpen,
    blockTimeOpen,
    pendingOverviewBlockRef,
    setBlockDraft,
    setBlockOverlapOpen,
    setBlockTimeOpen,
  } = useProfessionalFixedLocationCalendarBlockTime({
    resourceIds: data.resources.map((r) => r.id),
    supportedLocations: data.supportedLocations,
  });

  const viewingBookingBag = useProfessionalFixedLocationCalendarViewingBooking({
    editingEventId,
    events,
    blocks,
    slotLocation,
    setShowKilometerAllowance,
    setKilometerAllowanceDraft,
    selectedSlot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    slotStatus,
    slotBookingType,
    selectedClient,
    guestDraft,
    nonMollureDraft,
    addClientSource,
    snapshot: {
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
    },
    slotDrawerOpen,
    slotDrawerTab,
    resources: data.resources,
    setSlotDrawerTab,
    setActivityDetailItem,
  });
  const {
    isViewingBooking,
    viewingBookingEvent,
    openActivityComparison,
    drawerLineTagComparisonMode,
  } = viewingBookingBag;
  const [processFinanceInvoiceReissues] =
    useProcessFinanceInvoiceReissuesMutation();
  const drawerReissueRunRef = React.useRef("");

  React.useEffect(() => {
    if (!slotDrawerOpen || !viewingBookingEvent) {
      drawerReissueRunRef.current = "";
      return;
    }
    if (drawerReissueRunRef.current === viewingBookingEvent.id) return;
    drawerReissueRunRef.current = viewingBookingEvent.id;
    void processFinanceInvoiceReissues();
  }, [processFinanceInvoiceReissues, slotDrawerOpen, viewingBookingEvent]);

  const {
    postBookingPendingPayment,
    isDrawerPrepaymentPaid,
    confirmDrawerPrepayment,
    clearDrawerPrepaymentPaidOverride,
    prepaymentSectionTitle,
    drawerPriceDisplay,
    drawerPaymentMethod,
    persistedPaymentIsOffline,
    drawerPaymentIsOffline,
    onlinePrepayBlocksAccept,
    isGuestClientPath,
    isMollureClientPath,
    paymentMethodPolicy,
    drawerDocumentDraft,
    drawerInvoiceRow,
    drawerReceiptRow,
  } = useProfessionalFixedLocationCalendarDrawerPaymentDocs({
    viewingBookingEvent,
    bookingPrice,
    prepaymentAmount,
    remainingAfterPrepayment,
    bookingTotalForSave,
    kilometerAllowanceAmount,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    setPaymentMethod,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    selectedSlot,
    editingEventId,
    setEvents,
    selectedClient,
    financeSettings,
    addClientSource,
  });

  const {
    isCompletedBooking,
    isCancelledOrInvalidBooking,
    noShowParticipants,
  } = useProfessionalFixedLocationCalendarNoShowParticipants({
    viewingBookingEvent,
  });

  const {
    showIncomingRequestActions,
    showIncomingErActions,
    incomingClientNote,
    incomingErNote,
    showDiscardBr,
    showDiscardEbr,
    showWithdrawEr,
    showExpiredResponseBanner,
    negotiationDetails,
    drawerEbrNotes,
    awaitingClientChangeApproval,
    awaitingLineApproval,
    savedBookingDetails,
    drawerScheduleChangedForSilent,
    silentSafeDrawerEdit,
    silentFieldUpdates,
    drawerLineChangeSets,
    resolveServiceEditTag,
    cancelledServicesForDrawer,
    mainCancelledServices,
    resolveProductEditTag,
    clientEbrSuggestion,
    requestedScheduleLabel,
    scheduleChangeTags,
  } = useProfessionalFixedLocationCalendarDrawerLineTags({
    viewingBookingEvent,
    isViewingBooking,
    isEditingExisting,
    businessResponseWindowInput,
    selectedSlot,
    selectedServices,
    bookingGuests,
    bookingPhoneDraft,
    selectedProducts,
    bookingUniqueItems,
    showSilentFieldTags,
  });
  const {
    isViewingExisting,
    resolvedSelectedClientKind,
    isSelectedCompanyClient,
    canUseBookingProject,
    bookingEditSignature,
    editBaselineSignature,
    setEditBaselineSignature,
    isBookingDirty,
    silentEditBaselineRef,
    beginExistingBookingEdit,
  } = useProfessionalFixedLocationCalendarDrawerEditDirty({
    isCompletedBooking,
    isCancelledOrInvalidBooking,
    editingEventId,
    isEditingExisting,
    setIsEditingExisting,
    selectedClient,
    clientList,
    viewingBookingEvent,
    slotLocation,
    slotClientAdded,
    setBookingProjectEnabled,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    selectedSlot,
    bookingGuests,
    showInlineGuestField,
    editingInlineGuestId,
    inlineGuestDraft,
    bookingPhoneDraft,
    desiredLocationDraft,
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
    showIncomingRequestActions,
    showIncomingErActions,
    setIncomingRequestEditMode,
    setAllowDrawerTimeSelection,
  });

  const {
    lockClientIdentity,
    showManualBookingParticipantActions,
    extraGuestCount,
    drawerParticipantKinds,
    openInlineGuestForm,
    showLineItemRemoveButton,
    showClientRemoveButton,
    canEditBookingLineItems,
    canMutateDrawerContents,
    hideClientBookingFooterActions,
    isBookingSubScreen,
    drawerPrimaryActionLabel,
  } = useProfessionalFixedLocationCalendarDrawerUiGates({
    viewingBookingEvent,
    isViewingBooking,
    isCompletedBooking,
    isCancelledOrInvalidBooking,
    showIncomingRequestActions,
    showIncomingErActions,
    isViewingExisting,
    incomingRequestEditMode,
    bookingGuests,
    slotLocation,
    bookingProjectEnabled,
    isSelectedCompanyClient,
    slotBookingScreen,
    editingEventId,
    isGuestClientPath,
    isMollureClientPath,
    addClientSource,
    showPrepayment,
    prepaymentAmount,
    paymentMethod,
    setInlineGuestParticipantType,
    setEditingInlineGuestId,
    setInlineGuestDraft,
    setShowInlineGuestField,
  });

  const closeBookingDrawer = React.useCallback(() => {
    setSlotDrawerOpen(false);
    setEditingEventId(null);
    setIsEditingExisting(false);
    setActivityDetailItem(null);
    setBookingCheckoutOpen(false);
    setFocusSalesCardId(null);
    clearDrawerPrepaymentPaidOverride();
  }, [clearDrawerPrepaymentPaidOverride]);

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

  const inlineGuestFormRef = React.useRef<HTMLDivElement | null>(null);
  const {
    bookingDrawerBodyRef,
    bookingDrawerScreenRef,
    focusBookingDrawerSection,
    pendingBookingDrawerFocusRef,
    restoreBookingDrawerScrollRef,
    savedBookingDrawerScrollTopRef,
  } = useProfessionalFixedLocationCalendarDrawerScrollFocus({
    slotBookingScreen,
    addMenuTarget,
    showInlineGuestField,
    editingInlineGuestId,
    bookingGuests,
  });
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

  const {
    appliedDesign,
    autoArchivePersistedRef,
    bookingRules,
    dateOverrides,
    designDraft,
    editAvailabilityDraft,
    editAvailabilityOpen,
    lookupCategoryColor,
    persistAvailabilitySettings,
    publicBusinessHoursDraft,
    resolveEventCategoryKey,
    resolveEventColors,
    scheduleHydratedRef,
    scheduleResourceFilter,
    scheduleRows,
    selectableServiceCategories,
    serviceOrderDraft,
    setAppliedDesign,
    setBookingRules,
    setDateOverrides,
    setDesignDraft,
    setEditAvailabilityDraft,
    setEditAvailabilityOpen,
    setPublicBusinessHoursDraft,
    setScheduleResourceFilter,
    setScheduleRows,
    setServiceOrderDraft,
  } = useProfessionalFixedLocationCalendarScheduleSettings({
    calendarSettings,
    serviceOrderDefaults,
    serviceNameToCategoryKey,
    selectableServiceCatalog,
    supportedLocations: data.supportedLocations,
    onSaveCalendarSettings,
  });

  const {
    persistEventStatus,
    dispatchBookingEventIfApi,
    handleBookingActionSelect,
    handleConfirmCancel,
    handleConfirmBookingAction,
    handleConfirmNoShow,
  } = useProfessionalFixedLocationCalendarBookingActions({
    events,
    viewingBookingEvent,
    editingEventId,
    pendingBookingAction,
    showLateCancellation,
    lateCancellationFeeAmount,
    showNoShowFee,
    noShowFeeAmount,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    noShowFeePercent,
    noShowFeePercentCeiling,
    lateCancellationFeePercentDefault,
    noShowFeePercentDefault,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    cancellationFeeAt,
    exceededCancellationWindow,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setShowNoShowFee,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setExceededCancellationWindow,
    beginExistingBookingEdit,
    onUpdateBookingStatus,
    onUpdateCalendarEntryStatus,
    onDispatchBookingNotification,
    showSnackbar,
    setBookingActionAnchor,
    setDiscardErOpen,
    setDiscardEbrOpen,
    setDiscardBrOpen,
    setNoShowModalOpen,
    setCancelModalOpen,
    setEvents,
    setCancellationFeeAt,
    setSlotDrawerTab,
    setBookingCheckoutOpen,
    setSlotStatus,
    setEditingEventId,
    setSlotDrawerOpen,
    setIsEditingExisting,
    setAllowDrawerTimeSelection,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setSlotClientAdded,
    setPendingBookingAction,
  });

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

  // Overview calendar: prefer members with schedule/block on visible dates, but
  // always keep anyone who has a booking that day so past / unscheduled bookings
  // still render (auto-archive alone must not wipe columns).
  const locationFilterAvailable = data.supportedLocations.length > 1;
  const filtersAreNarrowing = calendarFiltersAreNarrowing(appliedFilters, {
    locationFilterAvailable,
  });
  const eventsMatchingDrawerFilters = React.useMemo(
    () => filterEventsMatchingDrawerFilters(events, appliedFilters),
    [appliedFilters, events],
  );

  const {
    activeResource,
    alphabeticalResources,
    closeTeamMenu,
    dayRankedResources,
    dayViewBodyGridTemplateColumns,
    dayViewBodyNeedsScroll,
    dayViewBodyScrollContentWidth,
    dayViewMemberColumnSource,
    dayViewMemberColumns,
    defaultDaySelectedResourceId,
    defaultWeekSelectedResourceId,
    discardSplitScreen,
    displayedResources,
    fallbackTeamMemberId,
    filteredResources,
    handleTeamMemberBadgeClick,
    hasTeamMembers,
    knownTeamMemberIds,
    openSplitScreenFromBooking,
    openSplitScreenWith,
    openTeamMenu,
    resetToDefaultTeamMember,
    selectTeamMember,
    selectedResourceId,
    setSelectedResourceId,
    setSplitScreen,
    setTeamActionAnchor,
    splitScreen,
    splitScreenCandidates,
    splitScreenMembers,
    teamActionAnchor,
    teamHeaderGridTemplateColumns,
    teamHeaderMemberCount,
    teamHeaderNeedsScroll,
    teamHeaderResources,
    teamHeaderScrollContentWidth,
    teamHeaderScrollOverflowSx,
    teamHeaderScrollReservePx,
    teamHeaderVisibleSlots,
    teamMenuBookings,
    teamMenuResource,
    teamMenuResourceId,
    setTeamMenuResourceId,
    teamNavResources,
    timelineHeaderMemberCount,
    timelineHeaderPx,
    timelineHeaderRows,
    userPickedTeamMemberRef,
  } = useProfessionalFixedLocationCalendarTeam({
    resources: data.resources,
    events,
    blocks,
    scheduleRows,
    dateOverrides,
    dataAvailability: data.availability,
    filterDrawerResources,
    eventsMatchingDrawerFilters,
    teamAll: appliedFilters.teamAll,
    filtersAreNarrowing,
    visibleDates,
    viewMode,
    activeDateIso,
    locationAll: appliedFilters.locationAll,
    locations: appliedFilters.locations,
    setViewMode,
    navy: m.navy,
    laneHeaderPx: 48,
  });

  const { persistOverviewBlockedTime } =
    useProfessionalFixedLocationCalendarPersistOverviewBlockedTime({
      showSnackbar,
      setActiveDateIso,
      setSelectedResourceId,
      onCreateCalendarEntry,
      setBlocks,
      setBlockTimeOpen,
    });

  const knownResourceIds = React.useMemo(
    () => new Set(data.resources.map((resource) => String(resource.id))),
    [data.resources],
  );

  const viewRange = useProfessionalFixedLocationCalendarViewRange({
    grid,
    eventsMatchingDrawerFilters,
    blocks,
    appliedFilters,
    filtersAreNarrowing,
    viewMode,
    visibleDates,
    selectedResourceId,
    activeResourceId: activeResource?.id,
    fallbackTeamMemberId,
    knownResourceIds,
    resourceNameById,
    dayViewMemberColumnSource,
    resources: data.resources,
    activeMonthIso,
    activeDateIso,
    todayIso,
    nowMin,
  });
  const {
    startMin,
    endMin,
    rows,
    rowPx,
    laneHeaderPx,
    slotLines,
    eventsInRange,
    showNowLine,
    nowLineTop,
    monthEvents,
    monthCells,
    blocksInRange,
  } = viewRange;

  const {
    availabilityHoverTitle,
    clearTimelineHover,
    getAvailabilityFor,
    getBusyFor,
    getFilteredAvailabilityFor,
    getLocationAvailability,
    handleTimelineHoverMove,
    setAvailabilityHoverTitle,
    setTimelineHover,
    timelineGridRef,
    timelineHover,
  } = useProfessionalFixedLocationCalendarAvailability({
    scheduleRows,
    dateOverrides,
    dataAvailability: data.availability,
    events,
    blocks,
    fallbackTeamMemberId,
    knownTeamMemberIds,
    activeResourceId: activeResource?.id,
    knownResourceIds,
    locationAll: appliedFilters.locationAll,
    locations: appliedFilters.locations,
    activeDateIso,
    viewMode,
    startMin,
    endMin,
    stepMinutes: grid.stepMinutes,
    rowPx,
  });

  const slotValidation = React.useMemo(
    () =>
      computeSlotValidation({
        slotDrawerTab,
        slotBookingScreen,
        serviceEditDraft,
        serviceSelectionDraft,
        productSelectionDraft,
        uniqueItemSelectionDraft,
        uniqueItemDraft,
        bufferDraft,
        guestDraft,
        nonMollureDraft,
        slotClientAdded,
        selectedServicesLength: selectedServices.length,
        selectedProductsLength: selectedProducts.length,
        bookingUniqueItemsLength: bookingUniqueItems.length,
        guestsTotal,
        addClientSource,
        bookingPhoneDraft,
        paymentMethod,
        selectedClientEmail: selectedClient?.email,
      }),
    [
      addClientSource,
      bookingPhoneDraft.phoneCode,
      bookingPhoneDraft.phoneNumber,
      guestDraft,
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
    ],
  );

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

  const onToday = () => {
    goToday();
    resetToDefaultTeamMember();
  };

  const {
    drawerBookingDurationMins,
    primaryMainClientServices,
    chronologicalDrawerGuests,
    isDrawerPlanningGuest,
    drawerOrderedBlocks,
    drawerParticipantOrdinals,
    drawerPlanningGuests,
    firstDrawerPlanningId,
    hasScheduleAvailabilityOnDate,
    drawerAvailableTimeSlots,
    drawerSelectableTimes,
    editServiceAvailabilitySlots,
    applyDrawerTimeSlot,
  } = useProfessionalFixedLocationCalendarDrawerSchedule({
    selectedSlot,
    selectedClient,
    selectedServices,
    bookingGuests,
    grid,
    activeResource,
    resources: data.resources,
    getAvailabilityFor,
    getBusyFor,
    getLocationAvailability,
    slotLocation,
    editingEventId,
    todayIso,
    serviceEditDraft,
    isViewingExisting,
    allowDrawerTimeSelection,
    setServiceOverridesDraft,
    setSelectedServices,
    setBookingGuests,
    setSelectedSlot,
    setSlotCalendarTouched,
  });

  const { getDailyBookingRatio, listAvailableTeamMembersForWindow, pickMostAvailableTeamMemberId } =
    useProfessionalFixedLocationCalendarTeamMemberPicker({
      resources: data.resources,
      getAvailabilityFor,
      getBusyFor,
      getLocationAvailability,
      slotLocation,
    });

  const hasScheduleWindowsOnDate = React.useCallback(
    (resourceId: string, iso: string) => {
      const selected =
        appliedFilters.locationAll === false
          ? (["FL", "DL"] as const).filter(
              (loc) => appliedFilters.locations[loc],
            )
          : null;
      return resourceHasScheduleWindowsOnDate(
        resourceId,
        iso,
        scheduleRows,
        dateOverrides ?? [],
        selected?.length ? selected : null,
      );
    },
    [
      appliedFilters.locationAll,
      appliedFilters.locations,
      dateOverrides,
      scheduleRows,
    ],
  );

  const resourceById = React.useMemo(() => {
    const map = new Map<string, (typeof data.resources)[number]>();
    data.resources.forEach((resource) => map.set(String(resource.id), resource));
    return map;
  }, [data.resources]);

  const resolveBookingStaff = React.useCallback(
    (staffResourceId?: string) => {
      const id = String(staffResourceId || "").trim();
      if (!id) return undefined;
      const resource = resourceById.get(id);
      if (!resource) return undefined;
      return {
        name: resource.name,
        photoSrc: resource.photoSrc ?? null,
        avatarText: resource.avatarText,
      };
    },
    [resourceById],
  );

  const getServiceStaffOptions = React.useCallback(
    (service: {
      id?: string;
      staffResourceId?: string;
      teamMemberId?: string | null;
      startTime?: string;
      durationMins?: number;
    }) => {
      const dateIso = selectedSlot?.date;
      if (!dateIso) return [];
      const currentId = String(
        service.staffResourceId || service.teamMemberId || "",
      ).trim();
      const startMin = minutesSinceMidnight(
        service.startTime ?? selectedSlot?.start ?? "00:00",
      );
      const durationMins = Math.max(1, service.durationMins || 0);

      const siblingIds = new Set<string>();
      const extraBusyByMember = new Map<string, { startMin: number; endMin: number }[]>();
      const considerSibling = (row: {
        id?: string;
        staffResourceId?: string;
        teamMemberId?: string | null;
        startTime?: string;
        durationMins?: number;
      }) => {
        const id = String(row.staffResourceId || row.teamMemberId || "").trim();
        if (!id) return;
        siblingIds.add(id);
        // Don't treat this service's own window as blocking its current assignee.
        if (service.id && row.id === service.id) return;
        if (!row.startTime?.trim()) return;
        const siblingStart = minutesSinceMidnight(row.startTime);
        const siblingDuration = Math.max(1, row.durationMins || 0);
        const busy = extraBusyByMember.get(id) ?? [];
        busy.push({
          startMin: siblingStart,
          endMin: siblingStart + siblingDuration,
        });
        extraBusyByMember.set(id, busy);
      };
      for (const row of selectedServices) considerSibling(row);
      for (const guest of bookingGuests) {
        for (const row of guest.services ?? []) considerSibling(row);
      }

      // FL: max 3 distinct members — once at cap, only those three are assignable.
      const atCap = slotLocation === "FL" && siblingIds.size >= 3;
      const members = listAvailableTeamMembersForWindow(
        dateIso,
        startMin,
        durationMins,
        {
          onlyMemberIds: atCap ? [...siblingIds] : undefined,
          includeMemberIds: currentId ? [currentId] : undefined,
          extraBusyByMember,
        },
      );

      return members.map((member) => ({
        id: member.id,
        name: member.name,
        photoSrc: member.photoSrc ?? null,
        avatarText: member.avatarText,
      }));
    },
    [
      bookingGuests,
      listAvailableTeamMembersForWindow,
      selectedServices,
      selectedSlot?.date,
      selectedSlot?.start,
      slotLocation,
    ],
  );

  const openBookingStaffProfile = React.useCallback(
    (staffResourceId: string) => {
      const id = String(staffResourceId || "").trim();
      if (id) setTeamProfileMemberId(id);
    },
    [setTeamProfileMemberId],
  );

  const {
    dayBodyScrollRef,
    dayScrollSyncLockRef,
    onTeamHeaderScroll,
    refreshHorizontalScrollEdges,
    refreshWeekDaysScrollEdges,
    refreshWeekTeamHeaderScrollEdges,
    scrollTeamNav,
    scrollWeekDays,
    scrollWeekTeamHeader,
    setWeekDaysScrollEdges,
    setWeekDaysVisibleSlots,
    setWeekTeamHeaderScrollEdges,
    syncDayTeamHorizontalScroll,
    syncWeekHorizontalScroll,
    updateWeekDaysLayout,
    weekBodyScrollRef,
    weekDayCount,
    weekDaysGridTemplateColumns,
    weekDaysNeedScroll,
    weekDaysScrollContentWidth,
    weekDaysScrollEdges,
    weekDaysScrollOverflowSx,
    weekDaysScrollRef,
    weekDaysViewportRef,
    weekDaysVisibleSlots,
    weekScrollSyncLockRef,
    weekTeamHeaderScrollEdges,
    weekTeamHeaderScrollRef,
  } = useProfessionalFixedLocationCalendarHorizontalScroll({
    viewMode,
    activeDateIso,
    teamHeaderNeedsScroll,
    teamHeaderVisibleSlots,
    teamHeaderResources,
    teamHeaderScrollContentWidth,
    dayViewBodyColumnCount: dayViewMemberColumns.length,
    visibleDatesLength: visibleDates.length,
    displayedResourcesLength: displayedResources.length,
  });

  const addMenuBookingResourceId = React.useMemo(
    () =>
      activeResource?.id ??
      selectedResourceId ??
      data.resources[0]?.id ??
      "",
    [activeResource?.id, data.resources, selectedResourceId],
  );

  const isSelectedDatePast = activeDateIso < todayIso;
  /** Add → Booking: past day or selected team member has no Schedule that day. */
  const isAddMenuBookingDisabled =
    isSelectedDatePast ||
    !hasScheduleAvailabilityOnDate(activeDateIso, addMenuBookingResourceId);
  /** Add → Blocked time: past selected day only (schedule not required). */
  const isAddMenuBlockedDisabled = isSelectedDatePast;

  const lateCancelNoticeLabel = React.useMemo(
    () =>
      formatLateCancelNoticeLabel(
        cancellationBeforeHours,
        cancellationBeforeMinutes,
      ),
    [cancellationBeforeHours, cancellationBeforeMinutes],
  );

  const teamNavArrowWidthPx = 28;

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

  const { openBookingDrawer } =
    useProfessionalFixedLocationCalendarOpenBookingDrawer({
      supportedLocations: data.supportedLocations,
      kilometerAllowanceEurPerKmDefault,
      lateRescheduleFeePercentDefault,
      prepaymentPercentDefault,
      emptyInlineGuestDraft,
      staffConflictAckRef,
      apply: {
        setSelectedSlot,
        setSlotDrawerTab,
        setSlotBookingScreen,
        setSlotLocation,
        setSlotBookingType,
        setSlotStatus,
        setSlotClientAdded,
        setAllowDrawerTimeSelection,
        setSlotCalendarOpen,
        setSlotCalendarTouched,
        setSelectedClient,
        setSelectedServices,
        setSelectedProducts,
        setServiceSelectionDraft,
        setServiceOverridesDraft,
        setServiceEditDraft,
        setServiceEditAttempted,
        setProductSelectionDraft,
        setUniqueItemSelectionDraft,
        setUniqueItemDraft,
        setUniqueItemOrigin,
        setEditingCatalogProductId,
        setBookingUniqueItems,
        setCustomBookingProducts,
        setEditingBookingLine,
        setEditingEventId,
        setIsEditingExisting,
        setBookingGuests,
        setShowInlineGuestField,
        setEditingInlineGuestId,
        setInlineGuestDraft,
        setInlineGuestParticipantType,
        setBookingProjectEnabled,
        setBookingProjectDescription,
        setBookingProjectUploads,
        ...feeDrawerApply,
        clearDrawerPrepaymentPaidOverride,
        setShowInternalNote,
        setBookingInternalNote,
        setShowKilometerAllowance,
        setKilometerAllowanceDraft,
        setDesiredLocationDraft,
        setAddMenuTarget,
        setSelectionTarget,
        setSlotAddMenuAnchor,
        setGuestDraft,
        setBookingPhoneDraft,
        setNonMollureClientType,
        setNonMollureDraft,
        setIncomingRequestEditMode,
        setOriginalServicesSnapshot,
        setDiscardBrOpen,
        setDiscardEbrOpen,
        setDiscardErOpen,
        setSlotDrawerOpen,
      },
    });

  useProfessionalBookingDrawerDraft({
    editingEventId,
    slotDrawerOpen,
    selectedSlot,
    slotLocation,
    slotBookingType,
    slotStatus,
    slotClientAdded,
    allowDrawerTimeSelection,
    slotCalendarTouched,
    selectedClient,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    bookingGuests,
    bookingProjectEnabled,
    bookingProjectDescription,
    bookingProjectUploads,
    desiredLocationDraft,
    showInternalNote,
    bookingInternalNote,
    showKilometerAllowance,
    kilometerAllowanceDraft,
    showPrepayment,
    prepaymentPercent,
    paymentMethod,
    bookingTotalDiscount,
    showLateCancellation,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    showLateRescheduling,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    showNoShowFee,
    noShowFeePercent,
    noShowFeePercentCeiling,
    guestDraft,
    bookingPhoneDraft,
    nonMollureClientType,
    nonMollureDraft,
    selectionTarget,
    addMenuTarget,
    setSelectedSlot,
    setSlotLocation,
    setSlotBookingType,
    setSlotStatus,
    setSlotClientAdded,
    setAllowDrawerTimeSelection,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setSelectedClient,
    setSelectedServices,
    setSelectedProducts,
    setBookingUniqueItems,
    setBookingGuests,
    setBookingProjectEnabled,
    setBookingProjectDescription,
    setBookingProjectUploads,
    setDesiredLocationDraft,
    setShowInternalNote,
    setBookingInternalNote,
    setShowKilometerAllowance,
    setKilometerAllowanceDraft,
    setShowPrepayment,
    setPrepaymentPercent,
    setPaymentMethod,
    setBookingTotalDiscount,
    setShowLateCancellation,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setShowLateRescheduling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setShowNoShowFee,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setGuestDraft,
    setBookingPhoneDraft,
    setNonMollureClientType,
    setNonMollureDraft,
    setSelectionTarget,
    setAddMenuTarget,
    setSlotBookingScreen,
    setSlotDrawerTab,
    setEditingEventId,
    setIsEditingExisting,
    setSlotDrawerOpen,
  });


  const router = useRouter();
  const searchParams = useSearchParams();

  const { openExistingBooking, focusBookingHandledRef, lastLiveHydratedEventKeyRef } =
    useProfessionalFixedLocationCalendarOpenExistingBooking({
      events,
      clientOptions,
      kilometerAllowanceEurPerKmDefault,
      clearBookingDrawerNotListedHint,
      viewingBookingEvent,
      slotDrawerOpen,
      isEditingExisting,
      incomingRequestEditMode,
      isViewingExisting,
      activeDateIso,
      setActiveDateIso,
      apply: {
        setSelectedSlot,
        setSlotDrawerTab,
        setSlotBookingScreen,
        setSlotLocation,
        setSlotBookingType,
        setSlotClientAdded,
        setAllowDrawerTimeSelection,
        setSlotCalendarOpen,
        setSlotCalendarTouched,
        setSelectedClient,
        setAddClientSource,
        setSelectedServices,
        setSelectedProducts,
        setBookingUniqueItems,
        setServiceSelectionDraft,
        setProductSelectionDraft,
        setUniqueItemSelectionDraft,
        setUniqueItemDraft,
        setUniqueItemOrigin,
        setEditingCatalogProductId,
        setCustomBookingProducts,
        setEditingBookingLine,
        setBookingGuests,
        setShowInlineGuestField,
        setBookingProjectEnabled,
        setBookingProjectDescription,
        setBookingProjectUploads,
        setBookingPhoneDraft,
        setDesiredLocationDraft,
        ...feeDrawerApply,
        clearDrawerPrepaymentPaidOverride,
        setShowInternalNote,
        setBookingInternalNote,
        setShowKilometerAllowance,
        setKilometerAllowanceDraft,
        setEditingEventId,
        setSlotStatus,
        setIsEditingExisting,
        setIncomingRequestEditMode,
        setOriginalServicesSnapshot,
        setSlotSaveAttempted,
        setAddMenuTarget,
        setSelectionTarget,
        setSlotAddMenuAnchor,
        setBookingMoreAnchor,
        setSlotDrawerOpen,
        setBookingCheckoutOpen,
        setShowSilentFieldTags,
        silentEditBaselineRef,
        bookingCheckoutOpenRef,
        editingEventIdRef,
      },
    });

  const deepLinkedBookingRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const linkedDate = searchParams.get("date");
    if (/^\d{4}-\d{2}-\d{2}$/.test(linkedDate ?? "")) {
      setActiveDateIso(linkedDate!);
    }
  }, [searchParams, setActiveDateIso]);

  React.useEffect(() => {
    const bookingId = searchParams.get("booking");
    const tab = searchParams.get("tab");
    const cardId = searchParams.get("cardId")?.trim() || "";
    const deepKey = `${bookingId}|${tab ?? ""}|${cardId}`;
    if (
      !bookingId ||
      !events.length ||
      slotDrawerOpen ||
      deepLinkedBookingRef.current === deepKey
    ) return;
    // Match UUID (`b-<uuid>`), unique_code, or exact event id — same as focus deep-links.
    const event = findFocusBookingMatch(events, bookingId, bookingId);
    if (!event) return;
    deepLinkedBookingRef.current = deepKey;
    if (event.date) setActiveDateIso(event.date);
    openExistingBooking(event);
    // Finance overdue Review: invoice → Sales banner; prepay response → booking tab banner.
    if (tab === "sales") {
      setSlotDrawerTab("sales");
      if (cardId) setFocusSalesCardId(cardId);
    }
    router.replace("/professionals/calendar", { scroll: false });
  }, [
    events,
    openExistingBooking,
    router,
    searchParams,
    setActiveDateIso,
    setFocusSalesCardId,
    setSlotDrawerTab,
    slotDrawerOpen,
  ]);

  const {
    handleAcceptConfirmedEr,
    handleRejectConfirmedEr,
    handleDiscardBr,
    handleDiscardConfirmedEr,
    handleWithdrawEr,
    isWithdrawingEr,
    handleRestartResponseTime,
    handleAcceptIncomingRequest,
    handleRejectIncomingRequest,
    handleStartIncomingEdit,
    handleDiscardEbr,
    handleBookingCheckoutSave,
  } = useProfessionalFixedLocationCalendarBookingPersist({
    editingEventId,
    viewingBookingEvent,
    selectedSlot,
    selectedServices,
    selectedProducts,
    bookingUniqueItems,
    bookingGuests,
    selectedClient,
    bookingPhoneDraft,
    showPrepayment,
    prepaymentPercent,
    prepaymentAmount,
    isDrawerPrepaymentPaid,
    drawerPaymentIsOffline,
    bookingTotalForSave,
    businessResponseWindowInput,
    manageBookingEditRequest,
    createFinanceTransaction,
    restartPrepaymentDue,
    onUpdateBookingStatus,
    persistEventStatus,
    restoreIncomingActions,
    showSnackbar,
    setEvents,
    setSlotStatus,
    setIncomingRequestEditMode,
    setIsEditingExisting,
    setAllowDrawerTimeSelection,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setOriginalServicesSnapshot,
    setSelectedSlot,
  });


  const {
    adjustProductQuantityDraft,
    adjustUniqueItemQuantityDraft,
    applyProductSelection,
    applyServiceEdit,
    applyServiceSelection,
    applyUniqueItem,
    applyUniqueItemSelection,
    draftFromBookingLine,
    isBookingDetailsSubScreen,
    leaveUniqueItemScreen,
    openAddUniqueItem,
    openEditBookingProductLine,
    openEditBookingUniqueLine,
    openEditService,
    openEditServiceFromLineItem,
    openSelectProducts,
    openSelectServices,
    openSelectUniqueItems,
    persistBookingCatalogProduct,
    persistBookingUniqueCatalogItem,
    resetUniqueItemForm,
    toggleProductSelectionDraft,
    toggleServiceSelectionDraft,
    toggleUniqueItemSelectionDraft,
    uniqueItemFlowIsProduct,
    uniqueItemFlowNamePlaceholder,
    uniqueItemFlowTitle,
  } = useProfessionalFixedLocationCalendarServiceProductScreens({
    addMenuTarget,
    selectionTarget,
    setSelectionTarget,
    serviceOverridesDraft,
    setServiceOverridesDraft,
    selectedServices,
    setSelectedServices,
    bookingGuests,
    setBookingGuests,
    selectedSlot,
    setSelectedSlot,
    selectableServiceCatalog,
    serviceEditDraft,
    setServiceEditDraft,
    serviceEditOrigin,
    setServiceEditOrigin,
    setServiceEditAttempted,
    isViewingExisting,
    serviceSelectionDraft,
    setServiceSelectionDraft,
    setServiceCatalogPatches,
    originalServicesSnapshot,
    pickMostAvailableTeamMemberId,
    resourceCount: data.resources.length,
    slotLocation,
    dispatchBookingEventIfApi,
    editingEventId,
    productCatalog,
    productSelectionDraft,
    setProductSelectionDraft,
    selectedProducts,
    setSelectedProducts,
    mergedCustomBookingProducts,
    persistedUniqueCatalog,
    uniqueItemSelectionDraft,
    setUniqueItemSelectionDraft,
    bookingUniqueItems,
    setBookingUniqueItems,
    editingBookingLine,
    setEditingBookingLine,
    uniqueItemOrigin,
    setUniqueItemOrigin,
    editingCatalogProductId,
    setEditingCatalogProductId,
    uniqueItemDraft,
    setUniqueItemDraft,
    setSlotAddMenuAnchor,
    setSlotBookingScreen,
    setSlotCalendarTouched,
    setSlotSaveAttempted,
    setFinanceSettings,
    slotBookingScreen,
  });

  const {
    addDlParticipant,
    addInlineGuest,
    applyBufferDraft,
    assignServiceStaff,
    beginEditBuffer,
    beginEditInlineGuest,
    bumpSlotFromServices,
    cancelInlineGuestForm,
    patchServiceTimeOverrides,
    removeClientService,
    removeGuestService,
    reorderClientServices,
    reorderDrawerPlanning,
    reorderGuestServices,
  } = useProfessionalFixedLocationCalendarDrawerGuests({
    inlineGuestDraft,
    setInlineGuestDraft,
    emptyInlineGuestDraft,
    editingInlineGuestId,
    setEditingInlineGuestId,
    inlineGuestParticipantType,
    setInlineGuestParticipantType,
    setShowInlineGuestField,
    bookingGuests,
    setBookingGuests,
    selectedServices,
    setSelectedServices,
    setSelectedProducts,
    setBookingUniqueItems,
    setServiceSelectionDraft,
    setServiceOverridesDraft,
    selectedSlot,
    setSelectedSlot,
    setSlotCalendarTouched,
    setSlotBookingScreen,
    setSlotSaveAttempted,
    bufferDraft,
    setBufferDraft,
    editingBufferId,
    setEditingBufferId,
    slotLocation,
    resources: data.resources,
    resourceNameById,
    focusBookingDrawerSection,
    isDrawerPlanningGuest,
    showSnackbar,
  });

  const changeBookingServiceStaff = React.useCallback(
    (serviceId: string, staffResourceId: string) => {
      if (!canEditBookingLineItems) return;
      beginExistingBookingEdit();
      assignServiceStaff(serviceId, staffResourceId);
    },
    [assignServiceStaff, beginExistingBookingEdit, canEditBookingLineItems],
  );

  const {
    renderInlineGuestFields,
    renderSplitScreenBanner,
    renderTeamMemberHeader,
    renderTeamMemberNavBar,
    renderTeamMemberNavScrollArea,
    renderTeamMemberScrollButton,
  } = useProfessionalFixedLocationCalendarRenderHelpers({
    m,
    laneHeaderPx,
    viewMode,
    selectedResourceId,
    activeResourceId: activeResource?.id,
    splitScreen,
    splitScreenMembers,
    discardSplitScreen,
    teamHeaderScrollOverflowSx,
    teamHeaderGridTemplateColumns,
    teamHeaderScrollContentWidth,
    teamHeaderResources,
    teamHeaderNeedsScroll,
    activeDateIso,
    getDailyBookingRatio,
    hasScheduleWindowsOnDate,
    handleTeamMemberBadgeClick,
    weekTeamHeaderScrollRef,
    onTeamHeaderScroll,
    scrollWeekTeamHeader,
    weekTeamHeaderScrollEdges,
    inlineGuestFormRef,
    inlineGuestParticipantType,
    inlineGuestDraft,
    setInlineGuestDraft,
    isViewingExisting,
    editingInlineGuestId,
    addInlineGuest,
    cancelInlineGuestForm,
  });

  const { handleProjectFilePick, deleteProjectUpload } =
    useProfessionalFixedLocationCalendarProjectUploads(setBookingProjectUploads);

  const serviceEditErrors = React.useMemo(
    () =>
      serviceEditAttempted ? getBookingServiceEditErrors(serviceEditDraft) : {},
    [serviceEditAttempted, serviceEditDraft],
  );

  const hasProductDraftSelection = React.useMemo(
    () => Object.values(productSelectionDraft).some((item) => item.selected),
    [productSelectionDraft],
  );
  const hasUniqueItemDraftSelection = React.useMemo(
    () => Object.values(uniqueItemSelectionDraft).some((item) => item.selected),
    [uniqueItemSelectionDraft],
  );

  const {
    handleSlotAddContinue,
    onEmptyClick,
    pendingSlotPayload,
    setPendingSlotPayload,
    setSlotAddAnchor,
    slotAddAnchor,
  } = useProfessionalFixedLocationCalendarSlotAdd({
    todayIso,
    stepMinutes: grid.stepMinutes,
    supportedLocations: data.supportedLocations,
    showSnackbar,
    getAvailabilityFor,
    getBusyFor,
    openBookingDrawer,
    setBlockDraft,
    setBlockTimeOpen,
  });

  const { persistBookingFromDrawer } =
    useProfessionalFixedLocationCalendarPersistBookingFromDrawer({
      selectedSlot,
      bookingGuests,
      editingInlineGuestId,
      inlineGuestDraft,
      emptyInlineGuestDraft,
      editingEventId,
      events,
      slotLocation,
      incomingRequestEditMode,
      originalServicesSnapshot,
      selectedServices,
      selectedProducts,
      bookingUniqueItems,
      selectedClient,
      addClientSource,
      bookingPhoneDraft,
      desiredLocationDraft,
      showPrepayment,
      prepaymentPercent,
      prepaymentAmount,
      paymentMethod,
      confirmPrepayment: isDrawerPrepaymentPaid,
      showLateCancellation,
      lateCancellationFeePercent,
      lateCancellationFeePercentCeiling,
      showLateRescheduling,
      lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling,
      lateRescheduleFeePercentDefault,
      appointmentBeforeHours,
      appointmentBeforeMinutes,
      setShowLateRescheduling,
      setLateRescheduleFeePercent,
      setLateRescheduleFeePercentCeiling,
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
      bookingTotalForSave,
      businessResponseWindowInput,
      resourceNameById,
      guestDraft,
      nonMollureDraft,
      bookingProjectDescription,
      bookingProjectEnabled,
      bookingProjectUploads,
      canUseBookingProject,
      slotStatus,
      slotBookingType,
      onCreateCalendarEntry,
      onUpdateBookingStatus,
      onUpdateCalendarEntry,
      dispatchBookingEventIfApi,
      uploadBookingAttachments,
      showSnackbar,
      addIdentityToClientList,
      findListedClient,
      apply: {
        setBookingGuests,
        setEditingInlineGuestId,
        setShowInlineGuestField,
        setInlineGuestDraft,
        setEvents,
        setIncomingRequestEditMode,
        setIsEditingExisting,
        setSlotStatus,
        setStaffConflictMessage,
        setStaffConflictOpen,
        setSlotSaveAttempted,
        setActiveDateIso,
        setBookingProjectUploads,
        setEditingEventId,
        staffConflictAckRef,
        silentEditBaselineRef,
        reopenBookingAfterSaveRef,
      },
    });



  return {
    ...drawerShellState,
    ...clientIdentityDrafts,
    ...viewRange,
    ...viewingBookingBag,
    actionFeedback,
    activeDateIso,
    activeMonthIso,
    activeResource,
    addClientSource,
    addDlParticipant,
    addIdentityToClientList,
    addInlineGuest,
    addMenuBookingResourceId,
    adjustProductQuantityDraft,
    adjustUniqueItemQuantityDraft,
    alphabeticalResources,
    appliedDesign,
    appliedFilters,
    applyBufferDraft,
    applyDesiredLocationKilometerDefaults,
    applyDrawerTimeSlot,
    applyFilters,
    applyProductSelection,
    applyServiceEdit,
    applyServiceSelection,
    applyUniqueItem,
    applyUniqueItemSelection,
    autoArchivePersistedRef,
    availabilityHoverTitle,
    awaitingClientChangeApproval,
    awaitingLineApproval,
    baseServiceCatalog,
    beginEditBuffer,
    beginEditInlineGuest,
    beginExistingBookingEdit,
    blockDraft,
    blockOverlapOpen,
    blockTimeOpen,
    blocks,
    bookingDiscountAmount,
    bookingDiscountModalOpen,
    bookingDrawerBodyRef,
    bookingDrawerNotListedIdentity,
    bookingDrawerScreenRef,
    bookingEditSignature,
    bookingGuests,
    bookingInternalNote,
    bookingPrice,
    bookingProjectDescription,
    bookingProjectEnabled,
    bookingProjectUploads,
    bookingRules,
    bookingStatuses,
    bookingTotalDiscount,
    bookingTotalForSave,
    bookingTypes,
    bookingUniqueItems,
    bufferDraft,
    bumpSlotFromServices,
    businessResponseWindowInput,
    calendarFieldLabel,
    calendarSettings,
    canEditBookingLineItems,
    canMutateDrawerContents,
    canUseBookingProject,
    cancelInlineGuestForm,
    cancelModalOpen,
    appointmentBeforeHours,
    appointmentBeforeMinutes,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    cancellationFeeAt,
    cancelledServicesForDrawer,
    categoryOptions,
    changeBookingServiceStaff,
    chronologicalDrawerGuests,
    clearBookingDrawerNotListedHint,
    clearTimelineHover,
    clientEbrSuggestion,
    clientList,
    clientListSelectedEmail,
    closeBookingDrawer,
    closeClientDetailsDrawer,
    closeNotInListPopover,
    closeTeamMenu,
    confirmDrawerPrepayment,
    createFinanceTransaction,
    customBookingProducts,
    data,
    dateOverrides,
    dayBodyScrollRef,
    dayRankedResources,
    dayScrollSyncLockRef,
    dayViewBodyGridTemplateColumns,
    dayViewBodyNeedsScroll,
    dayViewBodyScrollContentWidth,
    dayViewMemberColumnSource,
    dayViewMemberColumns,
    defaultDateIso,
    defaultDaySelectedResourceId,
    defaultWeekSelectedResourceId,
    deleteProjectUpload,
    designDraft,
    desiredLocationDraft,
    desiredVisitMunicipalityOptions,
    discardBrOpen,
    discardEbrOpen,
    discardErOpen,
    discardSplitScreen,
    dispatchBookingEventIfApi,
    displayedResources,
    draftFilters,
    draftFromBookingLine,
    drawerAvailableTimeSlots,
    drawerBookingDurationMins,
    drawerDocOpen,
    drawerDocType,
    drawerDocumentDraft,
    drawerEbrNotes,
    drawerInvoiceRow,
    drawerLineChangeSets,
    drawerOrderedBlocks,
    drawerParticipantKinds,
    drawerParticipantOrdinals,
    drawerPaymentIsOffline,
    drawerPaymentMethod,
    drawerPlanningGuests,
    drawerPriceDisplay,
    drawerPrimaryActionLabel,
    drawerReceiptRow,
    drawerScheduleChangedForSilent,
    drawerSelectableTimes,
    editAvailabilityDraft,
    editAvailabilityOpen,
    editBaselineSignature,
    editServiceAvailabilitySlots,
    editingBookingLine,
    editingBufferId,
    editingCatalogProductId,
    editingEventId,
    editingInlineGuestId,
    emptyInlineGuestDraft,
    erNoteDialogOpen,
    events,
    eventsMatchingDrawerFilters,
    exceededCancellationWindow,
    extraGuestCount,
    fallbackTeamMemberId,
    filterDrawerResources,
    filteredResources,
    filtersAreNarrowing,
    financeSettings,
    findListedClient,
    firstDrawerPlanningId,
    fixedLocationAddress,
    focusBookingDrawerSection,
    focusBookingHandledRef,
    getAvailabilityFor,
    getBusyFor,
    getDailyBookingRatio,
    getFilteredAvailabilityFor,
    getLocationAvailability,
    getServiceStaffOptions,
    grid,
    guestsTotal,
    handleAcceptConfirmedEr,
    handleAcceptIncomingRequest,
    handleBookingActionSelect,
    handleBookingCheckoutSave,
    handleClientNameClick,
    handleConfirmBookingAction,
    handleConfirmCancel,
    handleConfirmNoShow,
    handleDiscardBr,
    handleDiscardConfirmedEr,
    handleWithdrawEr,
    isWithdrawingEr,
    handleDiscardEbr,
    handleProjectFilePick,
    handleRejectConfirmedEr,
    handleRejectIncomingRequest,
    handleRestartResponseTime,
    handleSlotAddContinue,
    handleStartIncomingEdit,
    handleTeamMemberBadgeClick,
    handleTimelineHoverMove,
    hasProductDraftSelection,
    hasScheduleAvailabilityOnDate,
    hasTeamMembers,
    hasUniqueItemDraftSelection,
    hideClientBookingFooterActions,
    incomingClientNote,
    incomingConfirmAction,
    incomingErNote,
    incomingRequestEditMode,
    initialFilters,
    inlineGuestDraft,
    inlineGuestFormRef,
    inlineGuestParticipantType,
    isAddMenuBookingDisabled,
    isAddMenuBlockedDisabled,
    isAddingClient,
    isBookingDetailsSubScreen,
    isBookingDirty,
    isBookingSubScreen,
    isCancelledOrInvalidBooking,
    isCompletedBooking,
    isDesiredLocationBooking,
    isDrawerPlanningGuest,
    isDrawerPrepaymentPaid,
    isEditingExisting,
    isGuestClientPath,
    isMollureClientPath,
    isSaving,
    isSelectedCompanyClient,
    isViewingExisting,
    kilometerAllowanceAmount,
    kilometerAllowanceDraft,
    knownResourceIds,
    knownTeamMemberIds,
    lastLiveHydratedEventKeyRef,
    lateCancelNoticeLabel,
    lateCancellationFeeAmount,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    lateCancellationFeePercentDefault,
    lateRescheduleFeeAmount,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    lateRescheduleFeePercentDefault,
    leaveUniqueItemScreen,
    lineActualAmount,
    lineDiscountAmount,
    locationFilterAvailable,
    locationToApi,
    locations,
    lockClientIdentity,
    lookupCategoryColor,
    lookupMollureClientByEmail,
    m,
    mainCancelledServices,
    manageBookingEditRequest,
    mergedCustomBookingProducts,
    negotiationDetails,
    noShowFeeAmount,
    noShowFeePercent,
    noShowFeePercentCeiling,
    noShowFeePercentDefault,
    noShowModalOpen,
    noShowParticipants,
    notInListPopover,
    nowMin,
    onCreateCalendarEntry,
    onDeleteCalendarEntry,
    onEmptyClick,
    onNext,
    onPrev,
    onSyncServiceOrderToSetup,
    onTeamHeaderScroll,
    onToday,
    onlinePrepayBlocksAccept,
    openAddUniqueItem,
    openBookingDrawer,
    openBookingLocation,
    openBookingMessages,
    openBookingStaffProfile,
    openEditBookingProductLine,
    openEditBookingUniqueLine,
    openEditService,
    openEditServiceFromLineItem,
    openExistingBooking,
    openInlineGuestForm,
    openMessaging,
    openMessagingForBooking,
    openSelectProducts,
    openSelectServices,
    openSelectUniqueItems,
    openSplitScreenFromBooking,
    openSplitScreenWith,
    openTeamMemberAvailabilityEditor,
    openTeamMenu,
    originalServicesSnapshot,
    overviewEventKey,
    patchServiceTimeOverrides,
    paymentMethod,
    paymentMethodPolicy,
    pendingBookingAction,
    pendingBookingDrawerFocusRef,
    pendingOverviewBlockRef,
    pendingSlotPayload,
    persistAvailabilitySettings,
    persistBookingCatalogProduct,
    persistBookingFromDrawer,
    persistBookingUniqueCatalogItem,
    persistEventStatus,
    persistOverviewBlockedTime,
    persistedPaymentIsOffline,
    persistedUniqueCatalog,
    pickMostAvailableTeamMemberId,
    platformEmailComplete,
    platformEmailInput,
    platformEmailMatch,
    platformEmailQuery,
    platformLookupStatus,
    postBookingPendingPayment,
    prepaymentAmount,
    prepaymentPercent,
    prepaymentPercentDefault,
    prepaymentSectionTitle,
    prevCandidateIso,
    priceSummaryLines,
    primaryMainClientServices,
    productCatalog,
    productSelectionDraft,
    productsTotal,
    professionalBusinessOverride,
    projectFileInputRef,
    publicBusinessHoursDraft,
    refreshHorizontalScrollEdges,
    refreshWeekDaysScrollEdges,
    refreshWeekTeamHeaderScrollEdges,
    remainingAfterPrepayment,
    removeClientService,
    removeGuestService,
    renderInlineGuestFields,
    renderSplitScreenBanner,
    renderTeamMemberHeader,
    renderTeamMemberNavBar,
    renderTeamMemberNavScrollArea,
    renderTeamMemberScrollButton,
    reorderClientServices,
    reorderDrawerPlanning,
    reorderGuestServices,
    requestedScheduleLabel,
    resetToDefaultTeamMember,
    resetUniqueItemForm,
    resolveBookingStaff,
    resolveEventCategoryKey,
    resolveEventColors,
    resolveProductEditTag,
    resolveServiceEditTag,
    resolvedSelectedClientKind,
    resourceNameById,
    responseActionsDismissed,
    responseTimeConfigured,
    restoreBookingDrawerScrollRef,
    restoreIncomingActions,
    router,
    saveClientTechnicalNote,
    savedBookingDetails,
    savedBookingDrawerScrollTopRef,
    scheduleChangeTags,
    scheduleHydratedRef,
    scheduleResourceFilter,
    scheduleRows,
    scrollTeamNav,
    scrollWeekDays,
    scrollWeekTeamHeader,
    searchParams,
    selectTeamMember,
    selectableServiceCatalog,
    selectableServiceCategories,
    selectedProducts,
    selectedResourceId,
    selectedServices,
    serviceCatalogPatches,
    serviceEditAttempted,
    serviceEditDraft,
    serviceEditErrors,
    serviceEditOrigin,
    serviceOptions,
    serviceOrderDraft,
    serviceOverridesDraft,
    serviceSelectionDraft,
    servicesTotal,
    setActionFeedback,
    setActiveDateIso,
    setAddClientSource,
    setAppliedDesign,
    setAvailabilityHoverTitle,
    setBlockDraft,
    setBlockOverlapOpen,
    setBlockTimeOpen,
    setBlocks,
    setBookingDiscountModalOpen,
    setBookingGuests,
    setBookingInternalNote,
    setBookingProjectDescription,
    setBookingProjectEnabled,
    setBookingProjectUploads,
    setBookingRules,
    setBookingTotalDiscount,
    setBookingUniqueItems,
    setBufferDraft,
    setCancelModalOpen,
    setCancellationFeeAt,
    setClientListSelectedEmail,
    setCustomBookingProducts,
    setDateOverrides,
    setDesignDraft,
    setDesiredLocationDraft,
    setDiscardBrOpen,
    setDiscardEbrOpen,
    setDiscardErOpen,
    setDraftFilters,
    setDrawerDocOpen,
    setDrawerDocType,
    setEditAvailabilityDraft,
    setEditAvailabilityOpen,
    setEditBaselineSignature,
    setEditingBookingLine,
    setEditingBufferId,
    setEditingCatalogProductId,
    setEditingEventId,
    setEditingInlineGuestId,
    setErNoteDialogOpen,
    setEvents,
    setExceededCancellationWindow,
    setFinanceSettings,
    setIncomingConfirmAction,
    setIncomingRequestEditMode,
    setInlineGuestDraft,
    setInlineGuestParticipantType,
    setIsEditingExisting,
    setKilometerAllowanceDraft,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setNoShowModalOpen,
    setNowMin,
    setOriginalServicesSnapshot,
    setPaymentMethod,
    setPendingBookingAction,
    setPendingSlotPayload,
    setPlatformEmailInput,
    setPlatformEmailMatch,
    setPlatformLookupStatus,
    setPrepaymentPercent,
    setProductCatalog,
    setProductSelectionDraft,
    setPublicBusinessHoursDraft,
    setResponseActionsDismissed,
    setScheduleResourceFilter,
    setScheduleRows,
    setSelectedProducts,
    setSelectedResourceId,
    setSelectedServices,
    setServiceCatalogPatches,
    setServiceEditAttempted,
    setServiceEditDraft,
    setServiceEditOrigin,
    setServiceOrderDraft,
    setServiceOverridesDraft,
    setServiceSelectionDraft,
    setShowInlineGuestField,
    setShowInternalNote,
    setShowKilometerAllowance,
    setShowLateCancellation,
    setShowLateRescheduling,
    setShowNoShowFee,
    setShowPrepayment,
    setSlotAddAnchor,
    setSplitScreen,
    setTeamActionAnchor,
    setTeamMenuResourceId,
    setTimelineHover,
    setTodayIso,
    setUniqueItemDraft,
    setUniqueItemOrigin,
    setUniqueItemSelectionDraft,
    setViewMode,
    setWeekDaysScrollEdges,
    setWeekDaysVisibleSlots,
    setWeekTeamHeaderScrollEdges,
    shopDisplayName,
    showClientRemoveButton,
    showDiscardBr,
    showDiscardEbr,
    showWithdrawEr,
    showExpiredResponseBanner,
    showIncomingErActions,
    showIncomingRequestActions,
    showInlineGuestField,
    showInternalNote,
    showKilometerAllowance,
    showLateCancellation,
    showLateRescheduling,
    showLineItemRemoveButton,
    showManualBookingParticipantActions,
    showNoShowFee,
    showPrepayment,
    showSnackbar,
    silentEditBaselineRef,
    silentFieldUpdates,
    silentSafeDrawerEdit,
    slotAddAnchor,
    slotErrors,
    slotValidation,
    splitScreen,
    splitScreenCandidates,
    splitScreenMembers,
    subtotalPrice,
    syncDayTeamHorizontalScroll,
    syncWeekHorizontalScroll,
    teamActionAnchor,
    teamHeaderGridTemplateColumns,
    teamHeaderMemberCount,
    teamHeaderNeedsScroll,
    teamHeaderResources,
    teamHeaderScrollContentWidth,
    teamHeaderScrollOverflowSx,
    teamHeaderScrollReservePx,
    teamHeaderVisibleSlots,
    teamLabelById,
    teamMenuBookings,
    teamMenuResource,
    teamMenuResourceId,
    teamNavArrowWidthPx,
    teamNavResources,
    templateCategoryRows,
    theme,
    timelineGridRef,
    timelineGridSlotColors,
    timelineHeaderMemberCount,
    timelineHeaderPx,
    timelineHeaderRows,
    timelineHover,
    toDateTimeInput,
    todayIso,
    toggleProductSelectionDraft,
    toggleServiceSelectionDraft,
    toggleUniqueItemSelectionDraft,
    totalPrice,
    unavailableBookingTooltip,
    uniqueItemDraft,
    uniqueItemFlowIsProduct,
    uniqueItemFlowNamePlaceholder,
    uniqueItemFlowTitle,
    uniqueItemOrigin,
    uniqueItemSelectionDraft,
    uniqueItemsTotal,
    updateWeekDaysLayout,
    uploadBookingAttachments,
    userPickedTeamMemberRef,
    viewClient,
    viewMode,
    visibleDates,
    weekBodyScrollRef,
    weekDayCount,
    weekDaysGridTemplateColumns,
    weekDaysNeedScroll,
    weekDaysScrollContentWidth,
    weekDaysScrollEdges,
    weekDaysScrollOverflowSx,
    weekDaysScrollRef,
    weekDaysViewportRef,
    weekDaysVisibleSlots,
    weekScrollSyncLockRef,
    weekTeamHeaderScrollEdges,
    weekTeamHeaderScrollRef,
  };
}
