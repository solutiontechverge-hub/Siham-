"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import {
  useClientBookingCreateCalendarTime,
} from "./useClientBookingCreatePage.calendarTime";
import { useClientBookingCreateHydration } from "./useClientBookingCreatePage.hydration";
import { useClientBookingCreateContinue } from "./useClientBookingCreatePage.draftContinue";
import {
  getActiveBookingSession,
} from "./clientBookingSession";
import {
  writeClientBookingCreateUiDraft,
} from "./clientBookingCreateUiDraft";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import {
  getServicesForLocationMode,
  getTeamForLocationMode,
  pricePublicProfileServiceOnDate,
} from "../../../data/businessPublicProfile.data";
import { useBusinessPublicProfile } from "../../../hooks/useBusinessPublicProfile";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
} from "../../../store/services/profileApi";
import {
  useCreateBookingMutation,
  useGetPublicBusinessHoursQuery,
  useUploadBookingAttachmentsMutation,
} from "../../../store/services/businessApi";
import { joinBookingBusinessRoom } from "../../../lib/bookingSocketClient";
import {
  UUID_RE,
  isNotesPerson,
  resolveProfileCatalogService,
  resolveRequesterDisplayName,
  formatMinimumTimeslotNotice,
} from "./booking.page.data";
import { useClientBookingCreateAvailability } from "./useClientBookingCreatePage.availability";
import { useClientBookingCreateSummary } from "./useClientBookingCreatePage.summary";
import { useClientBookingCreatePeopleServices } from "./useClientBookingCreatePage.peopleServices";
import type {
  BookingPerson,
  CatalogService,
  EbrFocus,
  Service,
  ShopState,
  ShopTeamMember,
} from "./booking.page.types";

export function useClientBookingCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams?.get("from") === "profile";
  const profileHydrationToken = searchParams?.get("t") ?? "";
  const isEbrSuggest = searchParams?.get("ebrSuggest") === "1";
  const ebrFocus = searchParams?.get("ebrFocus") as EbrFocus;
  const isConfirmedEbrEdit =
    isEbrSuggest && getActiveBookingSession()?.status === "confirmed";
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const m = theme.palette.mollure;
  const user = useAppSelector((s) => s.auth.user);
  const { data: profileQueryData } = useGetProfileQuery();
  const requesterDisplayName = React.useMemo(
    () => resolveRequesterDisplayName(user, profileQueryData?.data),
    [profileQueryData?.data, user],
  );

  const [shop, setShop] = React.useState<ShopState | null>(null);

  const { profile: businessProfile, setups: businessSetups } =
    useBusinessPublicProfile(shop?.shopId);
  const bookingSetup = React.useMemo(
    () => businessSetups.find((row) => row.id === shop?.shopId) ?? null,
    [businessSetups, shop?.shopId],
  );
  const setupIdForHours =
    (bookingSetup?.id && UUID_RE.test(bookingSetup.id)
      ? bookingSetup.id
      : extractUuidFromSyntheticId(shop?.shopId)) ?? "";
  const { data: publicHoursResponse } = useGetPublicBusinessHoursQuery(
    setupIdForHours,
    { skip: !setupIdForHours },
  );

  React.useEffect(() => {
    if (setupIdForHours) joinBookingBusinessRoom(setupIdForHours);
  }, [setupIdForHours]);

  const minimumTimeslotNotice = React.useMemo(
    () => formatMinimumTimeslotNotice(publicHoursResponse?.data?.bookingRules),
    [publicHoursResponse?.data?.bookingRules],
  );
  const bookingLocationCode = React.useMemo(
    () => ((shop?.locationMode ?? "fixed") === "desired" ? "DL" : "FL"),
    [shop?.locationMode],
  );
  const [createBooking] = useCreateBookingMutation();
  const [uploadBookingAttachments] = useUploadBookingAttachmentsMutation();
  const [isContinuing, setIsContinuing] = React.useState(false);

  const {
    startOfDay,
    today0,
    isPastDay,
    clampToBookableDay,
    toISO,
    addDays,
    addMonths,
    startOfWeekMon,
    fmtDow,
    selectedDate,
    setSelectedDate,
    monthPickerAnchor,
    setMonthPickerAnchor,
    weekStart,
    weekDays,
    monthLabel,
    monthPickerYear,
    monthPickerMonth,
    setMonthYear,
    allDayTimes,
    isDayNotAvailable,
    isDayUnselectable,
    getDayClosedNote,
    selectedDayNotAvailable,
    selectedDayClosedNote,
    isSelectedToday,
    nowTick,
    setNowTick,
    nowMinutes,
    minBookableMinutes,
    times,
    baseAvailableTimes,
    isTimeUnavailable,
    timeScrollRef,
    scrollTimeSlots,
    selectedTime,
    setSelectedTime,
    timeValidationError,
    setTimeValidationError,
    selectedTimeTooSoon,
  } = useClientBookingCreateCalendarTime();

    const [people, setPeople] = React.useState<BookingPerson[]>(() => [
    { id: "p-requester", name: "Guest", isRequester: true },
  ]);
  const [draggingPersonId, setDraggingPersonId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    setPeople((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        if (!p.isRequester || p.name === requesterDisplayName) return p;
        changed = true;
        return { ...p, name: requesterDisplayName };
      });
      return changed ? next : prev;
    });
  }, [requesterDisplayName]);

  const [shopTeamMembers, setShopTeamMembers] = React.useState<
    ShopTeamMember[]
  >([]);



  const getPreferredServiceTab = React.useCallback(
    (items: Service[]): "assigned" | "unassigned" => {
      const hasUnassigned = items.some((s) => !s.guestId);
      const hasAssigned = items.some((s) => Boolean(s.guestId));
      if (hasUnassigned && !hasAssigned) return "unassigned";
      return "assigned";
    },
    [],
  );

  const [services, setServices] = React.useState<Service[]>([]);
  const [profileHydrated, setProfileHydrated] = React.useState(false);
  const hydrationSignatureRef = React.useRef<string | null>(null);

  const [combineServices, setCombineServices] = React.useState(true);
  const [selectedPersonId, setSelectedPersonId] =
    React.useState<string>("p-requester");
  const [selectedTeamMemberId, setSelectedTeamMemberId] =
    React.useState<string>("");
  const [serviceTab, setServiceTab] = React.useState<"assigned" | "unassigned">(
    "assigned",
  );
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<
    Record<string, boolean>
  >({});

  const [addServiceDialogOpen, setAddServiceDialogOpen] = React.useState(false);
  const [addServiceCatalogIds, setAddServiceCatalogIds] = React.useState<
    Record<string, boolean>
  >({});
  const [addServiceCatalogQty, setAddServiceCatalogQty] = React.useState<
    Record<string, number>
  >({});
  /** Baseline services when opening EBR suggest-edit — used to mark Edited lines. */
  const ebrSuggestBaselineRef = React.useRef<Service[] | null>(null);
  const [projectDescription, setProjectDescription] = React.useState("");
  const [projectUploads, setProjectUploads] = React.useState<
    Array<{ id: string; name: string; previewUrl: string; file?: File }>
  >([]);
  /** Desired + company project mode (from profile toggle or restored project draft). */
  const [bookingProjectEnabled, setBookingProjectEnabled] =
    React.useState(false);
  const [desiredVisitAddress, setDesiredVisitAddress] = React.useState({
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  });
  const [participantMenuAnchor, setParticipantMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [planningPersonId, setPlanningPersonId] = React.useState<string | null>(
    null,
  );
  const [planningActivity, setPlanningActivity] = React.useState("");
  const [planningDuration, setPlanningDuration] = React.useState("");
  const [clientNote, setClientNote] = React.useState("");
  const projectFileInputRef = React.useRef<HTMLInputElement>(null);

  const locationMode = shop?.locationMode ?? "fixed";
  const isDesiredLocation = locationMode === "desired";
  const isCompanyClient =
    user?.user_type === "company" ||
    profileQueryData?.data?.user_type === "company";
  const showProjectDetails =
    isDesiredLocation && isCompanyClient && bookingProjectEnabled;
  const canAddPlanningParticipant = showProjectDetails;
  const bookServicesAtSameTime = !isDesiredLocation && combineServices;
  const servicesDurationMins = React.useMemo(() => {
    if (!services.length) return 0;
    if (bookServicesAtSameTime) {
      return Math.max(...services.map((service) => service.durationMins), 0);
    }
    return services.reduce((sum, service) => sum + service.durationMins, 0);
  }, [bookServicesAtSameTime, services]);
  const desiredVisitAddressLabel = React.useMemo(() => {
    if (!isDesiredLocation) return "";
    return [
      desiredVisitAddress.street,
      desiredVisitAddress.number,
      desiredVisitAddress.postalCode,
      desiredVisitAddress.municipality,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }, [desiredVisitAddress, isDesiredLocation]);
  const getParticipantLabel = React.useCallback(
    (person: BookingPerson) => {
      if (person.isRequester) return "Client";
      if (person.participantType === "planning" || person.name === "Planning")
        return "Planning";
      if (isNotesPerson(person)) return "Note";
      if (person.participantType === "model") return "Model";
      if (person.participantType === "guest" || person.name === "Guest")
        return "Guest";
      return isDesiredLocation ? "Model" : "Guest";
    },
    [isDesiredLocation],
  );

  const selectedDateISO = toISO(selectedDate);

  const catalogByTeamMemberId = React.useMemo<
    Record<string, CatalogService[]>
  >(() => {
    if (!shop?.shopId || !profileHydrated || !businessProfile) return {};

    const locationCatalog = getServicesForLocationMode(
      businessProfile,
      locationMode,
    );
    const fallbackItems: CatalogService[] = locationCatalog.map((s) => ({
      id: s.id,
      name: s.name,
      durationMins: s.durationMins,
      ...pricePublicProfileServiceOnDate(s, selectedDateISO),
    }));
    const fallbackByName = new Map(
      fallbackItems.map((item) => [item.name.trim().toLowerCase(), item]),
    );
    const profileTeam = getTeamForLocationMode(businessProfile, locationMode);

    const map: Record<string, CatalogService[]> = {};
    for (const tm of shopTeamMembers) {
      const profileMember = profileTeam.find((m) => m.id === tm.id);
      const slots = profileMember?.serviceSlots ?? [];
      if (slots.length === 0) {
        map[tm.id] = fallbackItems;
        continue;
      }

      const seen = new Set<string>();
      const items: CatalogService[] = [];
      for (const slot of slots) {
        for (const opt of slot.options) {
          const matched = resolveProfileCatalogService(opt, locationCatalog);
          const id = matched?.id ?? String(opt.value ?? "").trim();
          if (!id || seen.has(id)) continue;
          seen.add(id);
          const fallbackMatch = fallbackByName.get(
            String(opt.label ?? "")
              .trim()
              .toLowerCase(),
          );
          const priced = matched
            ? pricePublicProfileServiceOnDate(matched, selectedDateISO)
            : {
                price: fallbackMatch?.price ?? 0,
                originalPrice: fallbackMatch?.originalPrice,
                discountPct: fallbackMatch?.discountPct,
              };
          items.push({
            id,
            name: matched?.name ?? fallbackMatch?.name ?? opt.label,
            durationMins:
              matched?.durationMins ?? fallbackMatch?.durationMins ?? 30,
            ...priced,
          });
        }
      }
      map[tm.id] = items.length > 0 ? items : fallbackItems;
    }
    return map;
  }, [
    businessProfile,
    locationMode,
    profileHydrated,
    shop?.shopId,
    shopTeamMembers,
    selectedDateISO,
  ]);

  /** Location catalog when the pro has no selectable team members for this mode. */
  const locationServiceCatalog = React.useMemo<CatalogService[]>(() => {
    if (!shop?.shopId || !profileHydrated || !businessProfile) return [];
    return getServicesForLocationMode(businessProfile, locationMode).map(
      (s) => ({
        id: s.id,
        name: s.name,
        durationMins: s.durationMins,
        ...pricePublicProfileServiceOnDate(s, selectedDateISO),
      }),
    );
  }, [
    businessProfile,
    locationMode,
    profileHydrated,
    selectedDateISO,
    shop?.shopId,
  ]);

  // Content key — catalog array identity churn must not re-fire price sync.
  const locationCatalogPriceKey = React.useMemo(
    () =>
      locationServiceCatalog
        .map(
          (s) =>
            `${s.id}:${s.price}:${s.originalPrice ?? ""}:${s.discountPct ?? ""}`,
        )
        .join("|"),
    [locationServiceCatalog],
  );
  const locationServiceCatalogRef = React.useRef(locationServiceCatalog);
  locationServiceCatalogRef.current = locationServiceCatalog;

  React.useEffect(() => {
    const catalogList = locationServiceCatalogRef.current;
    if (!catalogList.length) return;
    setServices((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((service) => {
        const catalogId =
          service.catalogServiceId ||
          extractUuidFromSyntheticId(service.id) ||
          service.id;
        const catalog =
          catalogList.find((item) => item.id === catalogId) ||
          catalogList.find((item) => item.id === service.id) ||
          catalogList.find((item) => item.name === service.name);
        if (!catalog) return service;
        if (
          catalog.price === service.price &&
          catalog.originalPrice === service.originalPrice &&
          catalog.discountPct === service.discountPct
        ) {
          return service;
        }
        changed = true;
        return {
          ...service,
          price: catalog.price,
          originalPrice: catalog.originalPrice,
          discountPct: catalog.discountPct,
        };
      });
      return changed ? next : prev;
    });
  }, [locationCatalogPriceKey]);

  const isPlanningPerson = React.useCallback(
    (p: BookingPerson) =>
      p.participantType === "planning" || p.name === "Planning",
    [],
  );

  const isNonServicePerson = React.useCallback(
    (p: BookingPerson) => isPlanningPerson(p) || isNotesPerson(p),
    [isPlanningPerson],
  );

  const selectedPerson = React.useMemo(
    () => people.find((p) => p.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  const isPlanningCardSelected = Boolean(
    selectedPerson && isPlanningPerson(selectedPerson),
  );
  const isNotesCardSelected = Boolean(
    selectedPerson && isNotesPerson(selectedPerson),
  );
  const hasNotesPerson = React.useMemo(
    () => people.some(isNotesPerson),
    [people],
  );

  const filteredTeamMembers = React.useMemo(() => {
    const matching = shopTeamMembers.filter(
      (tm) =>
        !tm.locationModes?.length || tm.locationModes.includes(locationMode),
    );
    return matching.length ? matching : shopTeamMembers;
  }, [locationMode, shopTeamMembers]);
  /** Client can pick / assign staff only when the pro exposed team members for this mode. */
  const hasAssignableTeamMembers = filteredTeamMembers.length > 0;

  const {
    availabilitySnapshot,
    availableTimes,
    sharedTeamMemberOptions,
    getServiceTeamMemberOptions,
    addServiceTeamMemberId,
    scheduleAvailableTeamMembers,
    bookableServiceCatalog,
  } = useClientBookingCreateAvailability({
    setupIdForHours,
    selectedDate,
    bookingLocationCode,
    hasAssignableTeamMembers,
    profileHydrated,
    filteredTeamMembers,
    servicesDurationMins,
    isSelectedToday,
    minBookableMinutes,
    baseAvailableTimes,
    services,
    setServices,
    selectedTime,
    locationServiceCatalog,
    isDesiredLocation,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    selectedPersonId,
    bookServicesAtSameTime,
  });

  /** Leave-filtered roster for UI (Any / dropdowns); solo path untouched when empty. */
  const visibleTeamMembers = scheduleAvailableTeamMembers;

  const {
    addServiceCatalog,
    additionalGuests,
    canAddFixedLocationGuest,
    serviceAssignees,
    canAddService,
    serviceCountLabel,
    personCardSubtitle,
    selectedServicesCount,
    requiresPersonAssignment,
    allServicesAssigned,
    needsTeamMemberProvidedByPro,
    assigned,
    unassigned,
    isModelOrGuestSelected,
    selectedUnassignedServices,
    canDirectAssign,
    visible,
    hasUnassigned,
    allVisibleSelected,
    someVisibleSelected,
    total,
    reorderPeople,
    planningWindowFromDraft,
    syncPlanningDraftToPerson,
    selectPlanningCard,
    selectNonPlanningPerson,
    addParticipant,
    savePlanning,
    startPlanningEdit,
    planningFormIsLocked,
    handleProjectFilePick,
    deleteProjectUpload,
    setBookingProjectEnabledWithCleanup,
    deleteGuest,
    updateGuestName,
    assignSelectedDirect,
    unassignService,
    removeService,
    openAddServiceDialog,
    toggleAddServiceCatalog,
    adjustAddServiceCatalogQty,
    confirmAddService,
    applySharedTeamMember,
    updateServiceTeamMember,
    toggleServiceSelection,
  } = useClientBookingCreatePeopleServices({
    people,
    setPeople,
    services,
    setServices,
    selectedPersonId,
    setSelectedPersonId,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    serviceTab,
    setServiceTab,
    selectedServiceIds,
    setSelectedServiceIds,
    selectedTime,
    isDesiredLocation,
    isCompanyClient,
    bookingProjectEnabled,
    setBookingProjectEnabled,
    clientNote,
    setClientNote,
    isNonServicePerson,
    isPlanningPerson,
    isPlanningCardSelected,
    selectedPerson,
    locationServiceCatalog: bookableServiceCatalog,
    hasAssignableTeamMembers,
    addServiceTeamMemberId,
    profileHydrated,
    fromProfile,
    planningPersonId,
    setPlanningPersonId,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    setParticipantMenuAnchor,
    setProjectDescription,
    setProjectUploads,
    setAddServiceDialogOpen,
    addServiceCatalogIds,
    setAddServiceCatalogIds,
    addServiceCatalogQty,
    setAddServiceCatalogQty,
  });

  const {
    bookingStartMinutes,
    bookingDurationMinutes,
    bookingEndMinutes,
    summaryGroups,
    teamMemberNameById,
    guestNameById,
    teamMemberChipLabelForItems,
    teamMemberFirstName,
    resolveServiceTeamMemberId,
    resolveServiceTeamMemberName,
    summarySections,
  } = useClientBookingCreateSummary({
    services,
    people,
    shopTeamMembers,
    availabilitySnapshot,
    selectedTeamMemberId,
    filteredTeamMembers: visibleTeamMembers,
    selectedDate,
    selectedTime,
    bookServicesAtSameTime,
    servicesDurationMins,
    total,
  });

  React.useEffect(() => {
    if (!profileHydrated) return;
    // Jump once to the next day that actually has bookable slots.
    // Avoids briefly selecting closed/empty days (red flash / glitch).
    if (isDayUnselectable(selectedDate)) {
      let cursor = isPastDay(selectedDate)
        ? today0
        : startOfDay(selectedDate);
      for (let i = 0; i < 60; i += 1) {
        if (!isDayUnselectable(cursor)) {
          if (toISO(cursor) !== toISO(selectedDate)) {
            setSelectedDate(cursor);
          }
          return;
        }
        cursor = addDays(cursor, 1);
      }
    }
  }, [
    isDayUnselectable,
    isPastDay,
    selectedDate,
    today0,
    profileHydrated,
  ]);

  // Default / repair selection: first available slot when empty or disabled.
  // Does not override a user-chosen time that is still in availableTimes.
  React.useEffect(() => {
    if (availableTimes.length === 0) return;
    if (selectedTime && availableTimes.includes(selectedTime)) return;
    setSelectedTime(availableTimes[0]);
    setTimeValidationError(null);
  }, [availableTimes, selectedTime]);

  const isSlotUnavailable = React.useCallback(
    (t: string) =>
      isTimeUnavailable(t) ||
      (availableTimes.length > 0 && !availableTimes.includes(t)),
    [availableTimes, isTimeUnavailable],
  );

  const { applyProfileSelection } = useClientBookingCreateHydration({
    fromProfile,
    isEbrSuggest,
    profileHydrationToken,
    shop,
    setShop,
    businessProfile,
    requesterDisplayName,
    isCompanyClient,
    selectedDate,
    clampToBookableDay,
    getPreferredServiceTab,
    setShopTeamMembers,
    setServices,
    setServiceTab,
    setSelectedServiceIds,
    setBookingProjectEnabled,
    setProjectDescription,
    setSelectedTeamMemberId,
    setProfileHydrated,
    setPeople,
    setSelectedPersonId,
    setSelectedDate,
    setSelectedTime,
    setCombineServices,
    setProjectUploads,
    setClientNote,
    setDesiredVisitAddress,
    ebrSuggestBaselineRef,
    hydrationSignatureRef,
  });

  // Autosave create UI so reload / leave restores the same Booking Details state.
  React.useEffect(() => {
    if (!profileHydrated || isEbrSuggest || !shop?.shopId) return;
    if (!services.length && people.length <= 1) return;
    writeClientBookingCreateUiDraft({
      shopId: shop.shopId,
      shopName: shop.shopName,
      municipalityLabel: shop.municipalityLabel,
      addressLabel: shop.addressLabel,
      locationMode: shop.locationMode,
      hydrationToken: profileHydrationToken,
      selectedDateISO: toISO(selectedDate),
      selectedTime,
      combineServices,
      people,
      services,
      shopTeamMembers,
      selectedPersonId,
      selectedTeamMemberId,
      serviceTab,
      selectedServiceIds,
      bookingProjectEnabled,
      projectDescription,
      projectUploads: projectUploads.map((u) => ({
        id: u.id,
        name: u.name,
        previewUrl: u.previewUrl,
      })),
      clientNote,
      desiredVisitAddress,
      total,
      savedAt: new Date().toISOString(),
    });
  }, [
    bookingProjectEnabled,
    clientNote,
    combineServices,
    desiredVisitAddress,
    isEbrSuggest,
    people,
    profileHydrated,
    profileHydrationToken,
    projectDescription,
    projectUploads,
    selectedDate,
    selectedPersonId,
    selectedServiceIds,
    selectedTeamMemberId,
    selectedTime,
    serviceTab,
    services,
    shop,
    shopTeamMembers,
    total,
  ]);

    React.useEffect(() => {
    if (!businessProfile || !profileHydrated) return;
    const apiTeam = getTeamForLocationMode(businessProfile, locationMode).map(
      (tm) => ({
        id: tm.id,
        name: tm.name,
        locationModes: tm.locationModes,
      }),
    );
    if (!apiTeam.length) return;
    setShopTeamMembers((prev) => {
      if (!prev.length) return apiTeam;
      const have = new Set(prev.map((tm) => tm.id));
      const missing = apiTeam.filter((tm) => tm.id && !have.has(tm.id));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [businessProfile, locationMode, profileHydrated]);

  React.useEffect(() => {
    if (!people.some((p) => p.id === selectedPersonId)) {
      setSelectedPersonId(people[0]?.id ?? "");
    }
  }, [people, selectedPersonId]);

  React.useEffect(() => {
    if (visibleTeamMembers.some((tm) => tm.id === selectedTeamMemberId))
      return;
    // Picker default only — never stamp services with first TM (may be off-schedule).
    const fallbackId = visibleTeamMembers[0]?.id ?? "";
    if (!fallbackId) {
      if (selectedTeamMemberId) setSelectedTeamMemberId("");
      return;
    }
    setSelectedTeamMemberId(fallbackId);
  }, [visibleTeamMembers, selectedTeamMemberId]);

  const { onContinue } = useClientBookingCreateContinue({
    router,
    searchParams,
    showSnackbar,
    shop,
    services,
    allServicesAssigned,
    isContinuing,
    setIsContinuing,
    isSelectedToday,
    selectedTime,
    setTimeValidationError,
    planningPersonId,
    people,
    planningActivity,
    planningDuration,
    planningWindowFromDraft,
    isDesiredLocation,
    selectedTeamMemberId,
    projectDescription,
    selectedDate,
    combineServices,
    shopTeamMembers,
    total,
    clientNote,
    isCompanyClient,
    bookingProjectEnabled,
    projectUploads,
    desiredVisitAddress,
    desiredVisitAddressLabel,
    businessProfile,
    isEbrSuggest,
    isConfirmedEbrEdit,
    ebrSuggestBaselineRef,
    locationMode,
    fromProfile,
    uploadBookingAttachments,
  });

  const continueLabel = isConfirmedEbrEdit
    ? "Save changes"
    : isEbrSuggest
      ? "Save & return"
      : "Continue";

  React.useEffect(() => {
    if (!isEbrSuggest || !ebrFocus || !profileHydrated) return;
    const id =
      ebrFocus === "location"
        ? "booking-location-section"
        : ebrFocus === "project"
          ? "booking-project-section"
          : ebrFocus === "services"
            ? "booking-services-section"
            : "booking-calendar-section";
    const timer = window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [ebrFocus, isEbrSuggest, profileHydrated]);


  return {
    router,
    searchParams,
    fromProfile,
    profileHydrationToken,
    isEbrSuggest,
    ebrFocus,
    isConfirmedEbrEdit,
    showSnackbar,
    theme,
    m,
    user,
    profileQueryData,
    requesterDisplayName,
    shop,
    setShop,
    businessProfile,
    businessSetups,
    bookingSetup,
    createBooking,
    uploadBookingAttachments,
    isContinuing,
    setIsContinuing,
    startOfDay,
    today0,
    isPastDay,
    toISO,
    addDays,
    addMonths,
    startOfWeekMon,
    fmtDow,
    selectedDate,
    setSelectedDate,
    monthPickerAnchor,
    setMonthPickerAnchor,
    weekStart,
    weekDays,
    monthLabel,
    monthPickerYear,
    monthPickerMonth,
    setMonthYear,
    allDayTimes,
    isDayNotAvailable,
    isDayUnselectable,
    getDayClosedNote,
    selectedDayNotAvailable,
    selectedDayClosedNote,
    isSelectedToday,
    nowTick,
    setNowTick,
    nowMinutes,
    minBookableMinutes,
    times,
    availableTimes,
    isTimeUnavailable: isSlotUnavailable,
    timeScrollRef,
    scrollTimeSlots,
    people,
    setPeople,
    draggingPersonId,
    setDraggingPersonId,
    shopTeamMembers,
    setShopTeamMembers,
    getPreferredServiceTab,
    services,
    setServices,
    profileHydrated,
    setProfileHydrated,
    hydrationSignatureRef,
    selectedTime,
    setSelectedTime,
    timeValidationError,
    setTimeValidationError,
    selectedTimeTooSoon,
    combineServices,
    setCombineServices,
    bookServicesAtSameTime,
    selectedPersonId,
    setSelectedPersonId,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    serviceTab,
    setServiceTab,
    selectedServiceIds,
    setSelectedServiceIds,
    addServiceDialogOpen,
    setAddServiceDialogOpen,
    addServiceCatalogIds,
    setAddServiceCatalogIds,
    addServiceCatalogQty,
    toggleAddServiceCatalog,
    adjustAddServiceCatalogQty,
    ebrSuggestBaselineRef,
    projectDescription,
    setProjectDescription,
    projectUploads,
    setProjectUploads,
    desiredVisitAddress,
    setDesiredVisitAddress,
    desiredVisitAddressLabel,
    participantMenuAnchor,
    setParticipantMenuAnchor,
    planningPersonId,
    setPlanningPersonId,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    clientNote,
    setClientNote,
    projectFileInputRef,
    locationMode,
    isDesiredLocation,
    minimumTimeslotNotice,
    isCompanyClient,
    bookingProjectEnabled,
    setBookingProjectEnabled: setBookingProjectEnabledWithCleanup,
    showProjectDetails,
    canAddPlanningParticipant,
    getParticipantLabel,
    catalogByTeamMemberId,
    isPlanningPerson,
    isNotesPerson,
    selectedPerson,
    isPlanningCardSelected,
    isNotesCardSelected,
    hasNotesPerson,
    filteredTeamMembers: visibleTeamMembers,
    sharedTeamMemberOptions,
    getServiceTeamMemberOptions,
    hasAssignableTeamMembers,
    additionalGuests,
    canAddFixedLocationGuest,
    serviceAssignees,
    canAddService,
    addServiceCatalog,
    serviceCountLabel,
    personCardSubtitle,
    updateGuestName,
    selectedServicesCount,
    requiresPersonAssignment,
    allServicesAssigned,
    needsTeamMemberProvidedByPro,
    assigned,
    unassigned,
    isModelOrGuestSelected,
    selectedUnassignedServices,
    canDirectAssign,
    visible,
    assignSelectedDirect,
    openAddServiceDialog,
    confirmAddService,
    applySharedTeamMember,
    updateServiceTeamMember,
    unassignService,
    removeService,
    toggleServiceSelection,
    onContinue,
    continueLabel,
    hasUnassigned,
    allVisibleSelected,
    someVisibleSelected,
    total,
    bookingStartMinutes,
    bookingDurationMinutes,
    bookingEndMinutes,
    summaryGroups,
    teamMemberNameById,
    guestNameById,
    teamMemberChipLabelForItems,
    teamMemberFirstName,
    resolveServiceTeamMemberId,
    resolveServiceTeamMemberName,
    summarySections,
    applyProfileSelection,
    reorderPeople,
    syncPlanningDraftToPerson,
    selectPlanningCard,
    selectNonPlanningPerson,
    addParticipant,
    savePlanning,
    startPlanningEdit,
    planningFormIsLocked,
    handleProjectFilePick,
    deleteProjectUpload,
    deleteGuest,
  };
}
