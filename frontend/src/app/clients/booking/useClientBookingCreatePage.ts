"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import {
  CLIENT_BOOKING_MIN_LEAD_ERROR,
  CLIENT_BOOKING_MIN_LEAD_MINUTES,
  fmtMinutesToTimeLabel,
  getNowMinutesFromMidnight,
  isSameDayBookingTooSoon,
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "./booking-time";
import { parseBookingListTab } from "./bookingPillTabs";
import {
  ACTIVE_BOOKING_ID_KEY,
  CHECKOUT_REF_KEY,
  createBookingRef,
  getActiveBookingSession,
  isReturningToCreateDraft,
  lockEbrDraft,
  rememberCreateReturnHref,
  setActiveBookingSession,
} from "./clientBookingSession";
import { resolveCreateCheckoutPath } from "./resolveCreateBookingStatus";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  fileFromProjectUpload,
  inferProjectUploadKind,
} from "../../../lib/projectUploadMedia";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";
import {
  getServicesForLocationMode,
  getTeamForLocationMode,
  pricePublicProfileServiceOnDate,
} from "../../../data/businessPublicProfile.data";
import { useBusinessPublicProfile } from "../../../hooks/useBusinessPublicProfile";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { enrichClientBookingRecord } from "./clientBookingDraftCache";
import { parsePrepaymentPercent } from "../../../components/common/client-booking/parsePrepaymentPercent";
import { buildBookingSummarySections } from "../../../components/common/client-booking/buildBookingSummarySections";
import { loadPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
} from "../../../store/services/profileApi";
import {
  useCreateBookingMutation,
  useGetPublicBusinessHoursQuery,
  useGetSetupAvailabilityQuery,
  useUploadBookingAttachmentsMutation,
} from "../../../store/services/businessApi";
import { joinBookingBusinessRoom } from "../../../lib/bookingSocketClient";
import type {
  ScheduleAvailabilityRow,
  ScheduleDateOverride,
} from "../../../components/common/calendar/calendar-settings.types";
import type { PublicBusinessHoursLike } from "../../../components/common/calendar/calendar.utils";
import {
  autoAssignServicesByAvailability,
  computeUnionBookableSlots,
  getMemberSlotStatus,
  type SetupAvailabilitySnapshot,
} from "./clientAvailability.utils";

import {
  FIXED_LOCATION_MAX_GUESTS,
  UUID_RE,
  createNotesPerson,
  isAdditionalGuest,
  isNotesPerson,
  buildAddServiceCatalog,
  resolveProfileCatalogService,
  servicesMissingTeamMember,
  withTeamMemberProvidedByProNote,
  resolveRequesterDisplayName,
  formatMinimumTimeslotNotice,
} from "./booking.page.data";
import type {
  BookingPerson,
  CatalogService,
  EbrFocus,
  Service,
  ShopState,
  ShopTeamMember,
  TeamMemberSlotOption,
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

  const startOfDay = (d: Date) => {
    const next = new Date(d);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const today0 = React.useMemo(() => startOfDay(new Date()), []);
  const isPastDay = React.useCallback(
    (d: Date) => startOfDay(d).getTime() < today0.getTime(),
    [today0],
  );
  const clampToBookableDay = React.useCallback(
    (d: Date) => (isPastDay(d) ? today0 : startOfDay(d)),
    [isPastDay, today0],
  );

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const addDays = (d: Date, days: number) => {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
  };
  const addMonths = (d: Date, months: number) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + months);
    return next;
  };
  const startOfWeekMon = (d: Date) => {
    const next = new Date(d);
    const dow0Sun = next.getDay(); // 0..6
    const dowMon0 = (dow0Sun + 6) % 7; // Mon=0
    next.setDate(next.getDate() - dowMon0);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const fmtDow = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short" });

  const [selectedDate, setSelectedDate] = React.useState<Date>(
    () => new Date(),
  );
  const [monthPickerAnchor, setMonthPickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const weekStart = React.useMemo(
    () => startOfWeekMon(selectedDate),
    [selectedDate],
  );
  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dt = addDays(weekStart, i);
        return { date: dt, key: toISO(dt), dow: fmtDow(dt), day: dt.getDate() };
      }),
    [weekStart],
  );
  const monthLabel = React.useMemo(
    () =>
      selectedDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [selectedDate],
  );
  const monthPickerYear = selectedDate.getFullYear();
  const monthPickerMonth = selectedDate.getMonth(); // 0-11

  const setMonthYear = (year: number, month0: number) => {
    setSelectedDate((prev) => {
      const day = prev.getDate();
      const next = new Date(prev);
      next.setFullYear(year, month0, 1);
      const daysInTargetMonth = new Date(year, month0 + 1, 0).getDate();
      next.setDate(Math.min(day, daysInTargetMonth));
      return clampToBookableDay(next);
    });
  };

  const allDayTimes = React.useMemo(() => {
    // Public Hours are display-only; slot grid uses a wide day window, then
    // Schedule availability (availabilityBookableTimes) filters real bookable times.
    const hours = { startMin: 9 * 60, endMin: 18 * 60 + 1 };
    const slots: string[] = [];
    for (
      let minutes = hours.startMin;
      minutes < hours.endMin;
      minutes += 30
    ) {
      slots.push(fmtMinutesToTimeLabel(minutes));
    }
    return slots;
  }, []);

  const isDayNotAvailable = React.useCallback((_d: Date) => false, []);

  const getDayClosedNote = React.useCallback((_d: Date) => null as string | null, []);

  const selectedDayNotAvailable = React.useMemo(
    () => isDayNotAvailable(selectedDate),
    [isDayNotAvailable, selectedDate],
  );

  const selectedDayClosedNote = React.useMemo(
    () => getDayClosedNote(selectedDate),
    [getDayClosedNote, selectedDate],
  );

  const isSelectedToday = React.useMemo(
    () => startOfDay(selectedDate).getTime() === today0.getTime(),
    [selectedDate, today0],
  );

  const [nowTick, setNowTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!isSelectedToday) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [isSelectedToday]);

  const nowMinutes = React.useMemo(
    () => getNowMinutesFromMidnight(new Date(nowTick)),
    [nowTick, selectedDate],
  );
  const minBookableMinutes = nowMinutes + CLIENT_BOOKING_MIN_LEAD_MINUTES;

  const getBookableTimesForDate = React.useCallback(
    (d: Date) => {
      if (isPastDay(d)) return [] as string[];
      const hours = { startMin: 9 * 60, endMin: 18 * 60 + 1 };
      const slots: string[] = [];
      for (
        let minutes = hours.startMin;
        minutes < hours.endMin;
        minutes += 30
      ) {
        slots.push(fmtMinutesToTimeLabel(minutes));
      }
      const isToday = startOfDay(d).getTime() === today0.getTime();
      if (!isToday) return slots;
      return slots.filter(
        (t) => parseTimeLabelToMinutes(t) > minBookableMinutes,
      );
    },
    [isPastDay, minBookableMinutes, today0],
  );

  /** Day cannot be chosen: past, or no bookable times in the day window. */
  const isDayUnselectable = React.useCallback(
    (d: Date) => {
      if (isPastDay(d)) return true;
      return getBookableTimesForDate(d).length === 0;
    },
    [getBookableTimesForDate, isPastDay],
  );

  const times = allDayTimes;

  const baseAvailableTimes = React.useMemo(() => {
    if (!isSelectedToday) return times;
    return times.filter((t) => parseTimeLabelToMinutes(t) > minBookableMinutes);
  }, [isSelectedToday, minBookableMinutes, times]);

  const isTimeUnavailable = React.useCallback(
    (t: string) =>
      isSelectedToday && parseTimeLabelToMinutes(t) <= minBookableMinutes,
    [isSelectedToday, minBookableMinutes],
  );

  const timeScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeSlots = React.useCallback((direction: "left" | "right") => {
    const el = timeScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }, []);

  const [people, setPeople] = React.useState<BookingPerson[]>(() => [
    { id: "p-requester", name: "Guest", isRequester: true },
  ]);
  const [draggingPersonId, setDraggingPersonId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    setPeople((prev) =>
      prev.map((p) =>
        p.isRequester ? { ...p, name: requesterDisplayName } : p,
      ),
    );
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

  const [selectedTime, setSelectedTime] = React.useState(() => {
    const mins = getNowMinutesFromMidnight() + CLIENT_BOOKING_MIN_LEAD_MINUTES;
    const future = allDayTimes.filter((t) => parseTimeLabelToMinutes(t) > mins);
    return future[0] ?? allDayTimes[0] ?? "";
  });
  const [timeValidationError, setTimeValidationError] = React.useState<
    string | null
  >(null);
  const selectedTimeTooSoon = React.useMemo(
    () =>
      isSelectedToday &&
      isSameDayBookingTooSoon(selectedTime, new Date(nowTick)),
    [isSelectedToday, nowTick, selectedTime],
  );
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

  const catalogByTeamMemberId = React.useMemo<
    Record<string, CatalogService[]>
  >(() => {
    if (!shop?.shopId || !profileHydrated || !businessProfile) return {};

    const bookingDateIso = toISO(selectedDate);
    const locationCatalog = getServicesForLocationMode(
      businessProfile,
      locationMode,
    );
    const fallbackItems: CatalogService[] = locationCatalog.map((s) => ({
      id: s.id,
      name: s.name,
      durationMins: s.durationMins,
      ...pricePublicProfileServiceOnDate(s, bookingDateIso),
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
            ? pricePublicProfileServiceOnDate(matched, bookingDateIso)
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
    selectedDate,
  ]);

  /** Location catalog when the pro has no selectable team members for this mode. */
  const locationServiceCatalog = React.useMemo<CatalogService[]>(() => {
    if (!shop?.shopId || !profileHydrated || !businessProfile) return [];
    return getServicesForLocationMode(businessProfile, locationMode).map(
      (s) => ({
        id: s.id,
        name: s.name,
        durationMins: s.durationMins,
        ...pricePublicProfileServiceOnDate(s, toISO(selectedDate)),
      }),
    );
  }, [businessProfile, locationMode, profileHydrated, selectedDate, shop?.shopId]);

  React.useEffect(() => {
    if (!locationServiceCatalog.length) return;
    setServices((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((service) => {
        const catalogId =
          service.catalogServiceId ||
          extractUuidFromSyntheticId(service.id) ||
          service.id;
        const catalog =
          locationServiceCatalog.find((item) => item.id === catalogId) ||
          locationServiceCatalog.find((item) => item.id === service.id) ||
          locationServiceCatalog.find((item) => item.name === service.name);
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
  }, [locationServiceCatalog]);

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

  const { data: setupAvailabilityResponse } = useGetSetupAvailabilityQuery(
    {
      setupId: setupIdForHours,
      date: toISO(selectedDate),
      location: bookingLocationCode as "FL" | "DL",
    },
    {
      skip: !setupIdForHours || !hasAssignableTeamMembers || !profileHydrated,
    },
  );

  const availabilitySnapshot = React.useMemo((): SetupAvailabilitySnapshot | null => {
    const raw = setupAvailabilityResponse?.data;
    if (!raw) return null;
    return {
      date: raw.date,
      location: raw.location,
      slotStepMinutes: raw.slotStepMinutes,
      scheduleAvailability: raw.scheduleAvailability as ScheduleAvailabilityRow[],
      dateOverrides: raw.dateOverrides as ScheduleDateOverride[],
      publicBusinessHours: raw.publicBusinessHours as PublicBusinessHoursLike[],
      teamMembers: raw.teamMembers,
      busyByMember: raw.busyByMember,
    };
  }, [setupAvailabilityResponse?.data]);

  const candidateMemberIds = React.useMemo(
    () => filteredTeamMembers.map((member) => member.id),
    [filteredTeamMembers],
  );

  const availabilityBookableTimes = React.useMemo(() => {
    if (!availabilitySnapshot || !hasAssignableTeamMembers) return null;
    const duration =
      servicesDurationMins ||
      availabilitySnapshot.slotStepMinutes;
    const minStart = isSelectedToday ? minBookableMinutes : undefined;
    return computeUnionBookableSlots(
      availabilitySnapshot,
      candidateMemberIds,
      duration,
      minStart,
    );
  }, [
    availabilitySnapshot,
    candidateMemberIds,
    hasAssignableTeamMembers,
    isSelectedToday,
    minBookableMinutes,
    servicesDurationMins,
  ]);

  const availableTimes = React.useMemo(() => {
    if (!availabilityBookableTimes?.length) return baseAvailableTimes;
    const allowed = new Set(availabilityBookableTimes);
    const filtered = baseAvailableTimes.filter((time) => allowed.has(time));
    return filtered.length > 0 ? filtered : baseAvailableTimes;
  }, [availabilityBookableTimes, baseAvailableTimes]);

  const lastAutoAssignRef = React.useRef("");

  React.useEffect(() => {
    if (
      !availabilitySnapshot ||
      !hasAssignableTeamMembers ||
      !selectedTime ||
      services.length === 0
    ) {
      return;
    }

    const startMin = parseTimeLabelToMinutes(selectedTime);
    if (!startMin) return;

    const contextKey = [
      toISO(selectedDate),
      selectedTime,
      services.map((service) => `${service.id}:${service.durationMins}`).join(","),
    ].join("|");

    const assignments = autoAssignServicesByAvailability({
      snapshot: availabilitySnapshot,
      services: services.map((service) => ({
        id: service.id,
        catalogServiceId:
          service.catalogServiceId ?? extractUuidFromSyntheticId(service.id),
        durationMins: service.durationMins,
        teamMemberId: service.teamMemberId,
      })),
      candidateMemberIds,
      fallbackCatalogIds: locationServiceCatalog.map((service) => service.id),
      startMin,
      assignOneMemberForAll: isDesiredLocation,
    });

    const assignKey = `${contextKey}|${assignments
      .map((row) => `${row.id}:${row.teamMemberId ?? ""}`)
      .join(",")}`;
    if (lastAutoAssignRef.current === assignKey) return;
    lastAutoAssignRef.current = assignKey;

    setServices((prev) => {
      let changed = false;
      const next = prev.map((service) => {
        const assignment = assignments.find((row) => row.id === service.id);
        if (
          !assignment ||
          (assignment.teamMemberId ?? null) === (service.teamMemberId ?? null)
        ) {
          return service;
        }
        changed = true;
        return { ...service, teamMemberId: assignment.teamMemberId };
      });
      return changed ? next : prev;
    });

    if (isDesiredLocation) {
      const sharedMember =
        assignments.find((row) => row.teamMemberId)?.teamMemberId ?? "";
      if (sharedMember && sharedMember !== selectedTeamMemberId) {
        setSelectedTeamMemberId(sharedMember);
      }
    }
  }, [
    availabilitySnapshot,
    candidateMemberIds,
    hasAssignableTeamMembers,
    isDesiredLocation,
    locationServiceCatalog,
    selectedDate,
    selectedTeamMemberId,
    selectedTime,
    services,
  ]);

  const getServiceStartMin = React.useCallback(
    (serviceId: string) => {
      const start = parseTimeLabelToMinutes(selectedTime);
      if (!start) return 0;
      if (bookServicesAtSameTime) return start;
      let cursor = start;
      for (const service of services) {
        if (service.id === serviceId) return cursor;
        cursor += service.durationMins || 0;
      }
      return start;
    },
    [bookServicesAtSameTime, selectedTime, services],
  );

  const buildSlotTeamMemberOptions = React.useCallback(
    (
      currentId: string,
      startMin: number,
      durationMins: number,
    ): TeamMemberSlotOption[] => {
      const options: TeamMemberSlotOption[] = [];
      const slotById = new Map(
        filteredTeamMembers.map((tm) => [
          tm.id,
          availabilitySnapshot && startMin > 0
            ? getMemberSlotStatus(
                availabilitySnapshot,
                tm.id,
                startMin,
                durationMins || 30,
              )
            : { withinWorking: true, booked: false, available: true },
        ]),
      );
      const anyWorking = [...slotById.values()].some((slot) => slot.withinWorking);

      for (const tm of filteredTeamMembers) {
        const slot = slotById.get(tm.id) ?? {
          withinWorking: true,
          booked: false,
          available: true,
        };
        const isCurrent = tm.id === currentId;
        if (anyWorking && !slot.withinWorking && !isCurrent) continue;
        const unavailable = anyWorking && (slot.booked || !slot.withinWorking);
        options.push({
          value: tm.id,
          label: tm.name,
          disabled: unavailable,
          tooltip: slot.booked ? "Team member is booked" : undefined,
        });
      }
      const hasOtherAvailable = options.some(
        (option) => !option.disabled && option.value !== currentId,
      );
      if (!hasOtherAvailable) {
        options.push({
          value: "__no_other_team_member__",
          label: "No other team member available",
          disabled: true,
        });
      }
      return options;
    },
    [availabilitySnapshot, filteredTeamMembers],
  );

  const sharedTeamMemberOptions = React.useMemo(
    () =>
      buildSlotTeamMemberOptions(
        selectedTeamMemberId,
        parseTimeLabelToMinutes(selectedTime),
        servicesDurationMins || 30,
      ),
    [
      buildSlotTeamMemberOptions,
      selectedTeamMemberId,
      selectedTime,
      servicesDurationMins,
    ],
  );

  const getServiceTeamMemberOptions = React.useCallback(
    (service: Service): TeamMemberSlotOption[] =>
      buildSlotTeamMemberOptions(
        service.teamMemberId ?? "",
        getServiceStartMin(service.id),
        bookServicesAtSameTime
          ? servicesDurationMins || service.durationMins || 30
          : service.durationMins || 30,
      ),
    [
      bookServicesAtSameTime,
      buildSlotTeamMemberOptions,
      getServiceStartMin,
      servicesDurationMins,
    ],
  );

  const addServiceTeamMemberId = React.useMemo(() => {
    if (!hasAssignableTeamMembers) return "";

    const isValidMember = (id: string | null | undefined) =>
      Boolean(id && filteredTeamMembers.some((tm) => tm.id === id));

    const personAssigned = services.filter(
      (s) => s.guestId === selectedPersonId && s.teamMemberId,
    );
    if (personAssigned.length > 0) {
      const counts = new Map<string, number>();
      for (const row of personAssigned) {
        const id = row.teamMemberId!;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      let bestId = "";
      let bestCount = 0;
      for (const [id, count] of counts) {
        if (count > bestCount) {
          bestId = id;
          bestCount = count;
        }
      }
      if (isValidMember(bestId)) return bestId;
    }

    if (isValidMember(selectedTeamMemberId)) return selectedTeamMemberId;

    const bookingAssigned = services.find((s) => isValidMember(s.teamMemberId));
    if (bookingAssigned?.teamMemberId) return bookingAssigned.teamMemberId;

    return filteredTeamMembers[0]?.id ?? "";
  }, [
    filteredTeamMembers,
    hasAssignableTeamMembers,
    selectedPersonId,
    selectedTeamMemberId,
    services,
  ]);

  const addServiceCatalog = React.useMemo(() => {
    const memberItems = hasAssignableTeamMembers
      ? catalogByTeamMemberId[addServiceTeamMemberId]
      : undefined;
    return buildAddServiceCatalog(locationServiceCatalog, memberItems);
  }, [
    addServiceTeamMemberId,
    catalogByTeamMemberId,
    hasAssignableTeamMembers,
    locationServiceCatalog,
  ]);

  const additionalGuests = React.useMemo(
    () => people.filter(isAdditionalGuest),
    [people],
  );
  const canAddFixedLocationGuest =
    !isCompanyClient &&
    !isDesiredLocation &&
    additionalGuests.length < FIXED_LOCATION_MAX_GUESTS;
  const serviceAssignees = React.useMemo(() => {
    // Jane / Model / Guest can all receive services; Planning / Notes cannot.
    return people.filter((p) => !isNonServicePerson(p));
  }, [isNonServicePerson, people]);
  /** Add-to-list stays available even when the pro has no selectable team members. */
  const canAddService = serviceAssignees.length > 0;

  const serviceCountLabel = React.useCallback(
    (personId: string) => {
      const n = services.filter((s) => s.guestId === personId).length;
      return n === 1 ? "1 Service" : `${n} Services`;
    },
    [services],
  );

  const personCardSubtitle = React.useCallback(
    (person: BookingPerson) => {
      if (isNotesPerson(person)) {
        return clientNote.trim() ? "Added" : "Add a note";
      }
      return serviceCountLabel(person.id);
    },
    [clientNote, serviceCountLabel],
  );

  const selectedServicesCount = React.useMemo(
    () => Object.values(selectedServiceIds).filter(Boolean).length,
    [selectedServiceIds],
  );

  const requiresPersonAssignment = React.useMemo(() => {
    const assignees = people.filter((p) => !isNonServicePerson(p));
    return (
      assignees.length > 1 || assignees.some((p) => !p.isRequester)
    );
  }, [isNonServicePerson, people]);

  /**
   * Multi-person / Model / Guest: every service needs a person.
   * Solo requester with no staff pick: Continue can default person to requester.
   */
  const allServicesAssigned = React.useMemo(() => {
    if (services.length === 0) return false;
    if (requiresPersonAssignment || selectedTeamMemberId) {
      return services.every((s) => Boolean(s.guestId));
    }
    return true;
  }, [requiresPersonAssignment, selectedTeamMemberId, services]);
  const needsTeamMemberProvidedByPro = React.useMemo(
    () =>
      services.length > 0 &&
      (!selectedTeamMemberId || servicesMissingTeamMember(services)),
    [services, selectedTeamMemberId],
  );

  /** Services already given to the selected person (Jane / Model / Guest). */
  const assigned = React.useMemo(
    () =>
      services.filter(
        (s) => Boolean(s.guestId) && s.guestId === selectedPersonId,
      ),
    [selectedPersonId, services],
  );
  /** Pending rows without a person — catalog never lives here. */
  const unassigned = React.useMemo(
    () => services.filter((s) => !s.guestId),
    [services],
  );

  const isModelOrGuestSelected = Boolean(
    selectedPerson &&
    !selectedPerson.isRequester &&
    !isNonServicePerson(selectedPerson),
  );

  React.useEffect(() => {
    if (!profileHydrated && fromProfile) return;
    if (
      unassigned.length === 0 &&
      assigned.length > 0 &&
      serviceTab === "unassigned"
    ) {
      setServiceTab("assigned");
    }
  }, [
    assigned.length,
    fromProfile,
    profileHydrated,
    serviceTab,
    unassigned.length,
  ]);

  const selectedUnassignedServices = React.useMemo(
    () => unassigned.filter((s) => selectedServiceIds[s.id]),
    [unassigned, selectedServiceIds],
  );
  /** Assign selected unassigned rows to the current person (staff is optional). */
  const canDirectAssign =
    !isPlanningCardSelected &&
    Boolean(selectedPersonId) &&
    selectedUnassignedServices.length > 0;
  const visible = serviceTab === "assigned" ? assigned : unassigned;
  const hasUnassigned = unassigned.length > 0;

  const allVisibleSelected =
    visible.length > 0 && visible.every((s) => selectedServiceIds[s.id]);
  const someVisibleSelected =
    visible.some((s) => selectedServiceIds[s.id]) && !allVisibleSelected;

  const total = React.useMemo(
    () => services.reduce((sum, s) => sum + s.price, 0),
    [services],
  );

  const bookingStartMinutes = React.useMemo(
    () => parseTimeLabelToMinutes(selectedTime),
    [selectedTime],
  );
  const bookingDurationMinutes = React.useMemo(
    () => servicesDurationMins,
    [servicesDurationMins],
  );
  const bookingEndMinutes = bookingStartMinutes + bookingDurationMinutes;

  const summaryGroups = React.useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      if (!s.guestId) continue;
      const prev = map.get(s.guestId) ?? [];
      prev.push(s);
      map.set(s.guestId, prev);
    }
    return map;
  }, [services]);

  const teamMemberNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const tm of shopTeamMembers) {
      const id = String(tm.id ?? "").trim();
      const name = tm.name?.trim();
      if (id && name) map.set(id, name);
    }
    for (const tm of availabilitySnapshot?.teamMembers ?? []) {
      const id = String(tm.id ?? "").trim();
      const name = tm.name?.trim();
      if (id && name && !map.has(id)) map.set(id, name);
    }
    return map;
  }, [availabilitySnapshot?.teamMembers, shopTeamMembers]);

  const guestNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  const teamMemberChipLabelForItems = React.useCallback(
    (items: Service[]) => {
      const ids = [
        ...new Set(
          items
            .map((s) => s.teamMemberId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      if (ids.length === 0) return undefined;
      // One shared professional — single chip. Multiple different TMs — per-service labels instead.
      if (ids.length !== 1) return undefined;
      const fullName = teamMemberNameById.get(ids[0]);
      if (!fullName) return undefined;
      return fullName.split(/\s+/)[0];
    },
    [teamMemberNameById],
  );

  const teamMemberFirstName = React.useCallback(
    (teamMemberId: string | null | undefined) => {
      const id = String(teamMemberId ?? "").trim();
      if (!id) return undefined;
      const fullName = teamMemberNameById.get(id);
      if (!fullName) return undefined;
      return fullName.split(/\s+/)[0] || fullName;
    },
    [teamMemberNameById],
  );

  const resolveServiceTeamMemberName = React.useCallback(
    (service: { teamMemberId?: string | null }) => {
      const id =
        String(service.teamMemberId ?? "").trim() ||
        String(selectedTeamMemberId ?? "").trim() ||
        filteredTeamMembers[0]?.id ||
        "";
      if (!id) return undefined;
      return (
        teamMemberFirstName(id) ||
        teamMemberNameById.get(id) ||
        filteredTeamMembers.find((tm) => tm.id === id)?.name
      );
    },
    [
      filteredTeamMembers,
      selectedTeamMemberId,
      teamMemberFirstName,
      teamMemberNameById,
    ],
  );

  const summarySections = React.useMemo(() => {
    const draft = {
      selectedDateISO: toISO(selectedDate),
      selectedTime,
      combineServices: bookServicesAtSameTime,
      people,
      services,
      teamMembers: shopTeamMembers.map((member) => ({
        id: String(member.id),
        name: member.name,
      })),
      total,
    };
    return buildBookingSummarySections(draft).map((section) => ({
      ...section,
      roleLabel:
        section.participantType === "requester"
          ? "Client"
          : section.participantType === "planning"
            ? "Planning"
            : section.participantType === "model"
              ? "Model"
              : section.participantType === "buffer"
                ? "Buffer"
                : "Guest",
    }));
  }, [
    bookServicesAtSameTime,
    people,
    selectedDate,
    selectedTime,
    services,
    shopTeamMembers,
    total,
  ]);

  React.useEffect(() => {
    // Safety: never allow a past date to remain selected.
    if (isPastDay(selectedDate)) setSelectedDate(today0);
  }, [isPastDay, selectedDate, today0]);

  React.useEffect(() => {
    if (!selectedTimeTooSoon) setTimeValidationError(null);
  }, [selectedTimeTooSoon]);

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
      return;
    }
    // Keep selection on a bookable future slot (nearest by default).
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
      setTimeValidationError(null);
    }
  }, [
    availableTimes,
    isDayUnselectable,
    isPastDay,
    selectedDate,
    selectedTime,
    today0,
    profileHydrated,
  ]);

  React.useEffect(() => {
    const el = timeScrollRef.current;
    if (!el || !selectedTime) return;
    const activeBtn = el.querySelector<HTMLElement>(
      `[data-time-slot="${selectedTime}"]`,
    );
    activeBtn?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedTime, selectedDate]);

  React.useEffect(() => {
    try {
      const profileSelection = loadPublicProfileBookingSelection();
      const raw = window.sessionStorage.getItem("mollure:selected_shop");
      const parsed = raw
        ? (JSON.parse(raw) as {
            shopId?: string;
            shopName?: string;
            municipalityLabel?: string;
            addressLabel?: string;
            locationMode?: "fixed" | "desired";
          })
        : null;

      if (fromProfile && profileSelection?.shopId) {
        const addressSource =
          parsed?.shopId === profileSelection.shopId ? parsed : null;
        setShop({
          shopId: profileSelection.shopId,
          shopName:
            profileSelection.shopName ?? addressSource?.shopName ?? "Salon",
          municipalityLabel: addressSource?.municipalityLabel,
          addressLabel: addressSource?.addressLabel,
          locationMode: profileSelection.locationMode,
        });
        return;
      }

      // Confirmed EBR edit: prefer the booking session shop (Desired needs locationMode + people).
      if (isEbrSuggest) {
        const session = getActiveBookingSession();
        if (session?.shop?.shopId) {
          setShop({
            shopId: session.shop.shopId,
            shopName: session.shop.shopName ?? "Salon",
            municipalityLabel: session.shop.municipalityLabel,
            addressLabel: session.shop.addressLabel,
            locationMode: session.shop.locationMode,
          });
          return;
        }
      }

      if (parsed?.shopId && parsed?.shopName) {
        setShop({
          shopId: parsed.shopId,
          shopName: parsed.shopName,
          municipalityLabel: parsed.municipalityLabel,
          addressLabel: parsed.addressLabel,
          locationMode: parsed.locationMode,
        });
      }
    } catch {
      // ignore
    }
  }, [fromProfile, isEbrSuggest, profileHydrationToken]);

  const applyProfileSelection = React.useCallback(
    (
      profileSelection: NonNullable<
        ReturnType<typeof loadPublicProfileBookingSelection>
      >,
    ) => {
      setShopTeamMembers(profileSelection.teamMembers);

      const isDesired = profileSelection.locationMode === "desired";
      const firstMember = profileSelection.teamMembers.find((tm) =>
        tm.locationModes.includes(profileSelection.locationMode),
      );
      const noSelectableTeam = !firstMember;
      const defaultTeamMemberId = firstMember?.id ?? null;

      const profileServices = profileSelection.services.map((row) => ({
        id: row.id,
        catalogServiceId:
          row.catalogServiceId ?? extractUuidFromSyntheticId(row.id),
        name: row.name,
        durationMins: row.durationMins,
        price: row.price,
        // New Book Now: always Unassigned for every professional. Edit/EBR keeps draft guestId.
        guestId: null,
        // Keep default TM on the picker while Unassigned so assign can stamp it.
        teamMemberId: noSelectableTeam
          ? null
          : (row.teamMemberId || defaultTeamMemberId),
      }));

      setServices(profileServices);
      setServiceTab(getPreferredServiceTab(profileServices));
      setSelectedServiceIds({});

      if (isDesired && isCompanyClient && profileSelection.projectEnabled) {
        setBookingProjectEnabled(true);
        setProjectDescription(profileSelection.projectInstructions);
      } else {
        setBookingProjectEnabled(false);
      }

      setShop((prev) => ({
        shopId: profileSelection.shopId,
        shopName: profileSelection.shopName ?? prev?.shopName ?? "Salon",
        municipalityLabel: prev?.municipalityLabel,
        addressLabel: prev?.addressLabel,
        locationMode: profileSelection.locationMode,
      }));

      // First load: pre-select team member from backend roster when available.
      if (noSelectableTeam) {
        setSelectedTeamMemberId("");
      } else {
        const fromServices =
          profileServices.find((s) => s.teamMemberId)?.teamMemberId ?? null;
        setSelectedTeamMemberId(fromServices || defaultTeamMemberId || "");
      }

      setProfileHydrated(true);
    },
    [getPreferredServiceTab, isCompanyClient],
  );

  React.useEffect(() => {
    const profileSelection = loadPublicProfileBookingSelection();

    const applyProfileIfNeeded = (
      selection: NonNullable<
        ReturnType<typeof loadPublicProfileBookingSelection>
      >,
    ) => {
      const signature = `${profileHydrationToken}:${selection.savedAt ?? ""}:${selection.services
        .map((row) => `${row.id}:${row.teamMemberId ?? ""}`)
        .join("|")}`;
      if (hydrationSignatureRef.current === signature) return;
      hydrationSignatureRef.current = signature;
      applyProfileSelection(selection);
    };

    const hydrateFromActiveDraft = (
      existing: NonNullable<ReturnType<typeof enrichClientBookingRecord>>,
      options: { signaturePrefix: string; forceRequesterGuestId: boolean },
    ) => {
      const locationMode =
        existing.shop?.locationMode ?? shop?.locationMode ?? "fixed";
      const signature = `${options.signaturePrefix}:${existing.bookingRef}:${existing.draft?.people
        ?.map((p) => `${p.id}:${p.participantType ?? ""}`)
        .join(",")}:${(existing.draft?.services ?? [])
        .map(
          (row) => `${row.id}:${row.guestId ?? ""}:${row.teamMemberId ?? ""}`,
        )
        .join("|")}:${existing.draft?.projectDetails?.description ?? ""}:${
        existing.draft?.combineServices === false ? "0" : "1"
      }:${[
        existing.draft?.desiredLocation?.street,
        existing.draft?.desiredLocation?.number,
        existing.draft?.desiredLocation?.postalCode,
        existing.draft?.desiredLocation?.province,
        existing.draft?.desiredLocation?.municipality,
      ].join("|")}`;
      if (hydrationSignatureRef.current === signature) return;
      hydrationSignatureRef.current = signature;

      const draftServices: Service[] = (existing.draft?.services ?? []).map(
        (row) => ({
          id: row.id,
          catalogServiceId:
            (row as Service).catalogServiceId ??
            extractUuidFromSyntheticId(row.id) ??
            row.id,
          name: row.name,
          durationMins: row.durationMins,
          price: row.price,
          guestId: options.forceRequesterGuestId
            ? row.guestId != null && row.guestId !== ""
              ? row.guestId
              : "p-requester"
            : (row.guestId ?? null),
          teamMemberId: row.teamMemberId ?? null,
        }),
      );

      setServices(draftServices);
      if (options.signaturePrefix === "ebrSuggest") {
        ebrSuggestBaselineRef.current = draftServices.map((s) => ({ ...s }));
      }

      const draftPeople: BookingPerson[] = existing.draft?.people?.length
        ? existing.draft.people.map((p) => ({
            id: p.id,
            name: p.name,
            isRequester: Boolean(p.isRequester),
            participantType: p.participantType,
            planningActivity: p.planningActivity,
            planningDuration: p.planningDuration,
            planningIsLocked: p.planningIsLocked,
          }))
        : [
            {
              id: "p-requester",
              name: requesterDisplayName,
              isRequester: true as const,
            },
          ];
      if (
        existing.draft?.clientNote?.trim() &&
        !draftPeople.some(isNotesPerson)
      ) {
        draftPeople.push(createNotesPerson());
      }
      setPeople(draftPeople);

      const personWithServices =
        draftPeople.find((p) =>
          draftServices.some((s) => s.guestId === p.id),
        ) ??
        draftPeople.find((p) => p.isRequester) ??
        draftPeople[0];
      if (personWithServices?.id) setSelectedPersonId(personWithServices.id);

      const draftTeamMembers = existing.draft?.teamMembers;
      if (draftTeamMembers?.length) {
        setShopTeamMembers((prev) => {
          const fromDraft = draftTeamMembers.map((tm) => ({
            id: tm.id,
            name: tm.name,
            locationModes: (prev.find((p) => p.id === tm.id)?.locationModes ?? [
              locationMode,
            ]) as Array<"fixed" | "desired">,
          }));
          return fromDraft.length ? fromDraft : prev;
        });
      } else if (businessProfile) {
        const apiTeam = getTeamForLocationMode(
          businessProfile,
          locationMode,
        ).map((tm) => ({
          id: tm.id,
          name: tm.name,
          locationModes: tm.locationModes,
        }));
        if (apiTeam.length) setShopTeamMembers(apiTeam);
      }

      if (existing.draft?.selectedDateISO) {
        const parsed = new Date(`${existing.draft.selectedDateISO}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          setSelectedDate(clampToBookableDay(parsed));
        }
      }
      if (existing.draft?.selectedTime) {
        setSelectedTime(existing.draft.selectedTime);
      }
      if (typeof existing.draft?.combineServices === "boolean") {
        setCombineServices(existing.draft.combineServices);
      }
      if (existing.draft?.projectDetails) {
        const desc = existing.draft.projectDetails.description ?? "";
        const uploads = existing.draft.projectDetails.uploads ?? [];
        setProjectDescription(desc);
        setProjectUploads(
          uploads.map((u) => ({
            id: u.id,
            name: u.name,
            previewUrl:
              resolveMediaUrl(u.previewUrl) ||
              resolveMediaUrl(u.url) ||
              u.previewUrl ||
              "",
          })),
        );
        if (
          existing.shop?.locationMode === "desired" &&
          (desc.trim() || uploads.length > 0)
        ) {
          setBookingProjectEnabled(true);
        }
      }
      // Restore project mode if draft already has a Planning participant.
      if (
        existing.shop?.locationMode === "desired" &&
        (existing.draft?.people ?? []).some(
          (p) => p.participantType === "planning" || p.name === "Planning",
        )
      ) {
        setBookingProjectEnabled(true);
      }
      if (existing.draft?.clientNote) {
        setClientNote(existing.draft.clientNote);
      }
      const savedVisit = existing.draft?.desiredLocation;
      if (
        savedVisit &&
        (savedVisit.street?.trim() ||
          savedVisit.number?.trim() ||
          savedVisit.postalCode?.trim() ||
          savedVisit.province?.trim() ||
          savedVisit.municipality?.trim())
      ) {
        setDesiredVisitAddress({
          street: savedVisit.street ?? "",
          number: savedVisit.number ?? "",
          postalCode: savedVisit.postalCode ?? "",
          province: savedVisit.province ?? "",
          municipality: savedVisit.municipality ?? "",
        });
      }
      const firstTm =
        draftServices.find((s) => s.teamMemberId)?.teamMemberId ?? "";
      setSelectedTeamMemberId(firstTm);
      setServiceTab(getPreferredServiceTab(draftServices));
      setProfileHydrated(true);
    };

    // Confirmed Edit / EBR must win over leftover profile-selection cache.
    // Desired bookings often still have mollure:profile_booking_selection from create,
    // which used to wipe Models/Guests/Planning before we restored the draft.
    if (isEbrSuggest) {
      if (!shop?.shopId) return;
      const existingRaw = getActiveBookingSession();
      const existing = existingRaw
        ? enrichClientBookingRecord(existingRaw)
        : null;
      if (!existing?.draft?.services?.length) {
        // Session not ready yet — never fall through to blank catalog.
        return;
      }
      if (existing.shop?.shopId && existing.shop.shopId !== shop.shopId) {
        return;
      }
      hydrateFromActiveDraft(existing, {
        signaturePrefix: "ebrSuggest",
        forceRequesterGuestId: true,
      });
      return;
    }

    // Summary back (browser or arrow): restore guests/models/planning/date/time
    // instead of re-applying Book Now profile selection.
    if (
      isReturningToCreateDraft({
        fromProfile,
        hydrationToken: profileHydrationToken,
        shopId: shop?.shopId,
      })
    ) {
      const existingRaw = getActiveBookingSession();
      const existing = existingRaw
        ? enrichClientBookingRecord(existingRaw)
        : null;
      if (existing?.draft?.services?.length) {
        hydrateFromActiveDraft(existing, {
          signaturePrefix: "createReturn",
          forceRequesterGuestId: false,
        });
        return;
      }
    }

    if (fromProfile && profileSelection?.services.length) {
      applyProfileIfNeeded(profileSelection);
      return;
    }

    if (!shop?.shopId) return;

    if (
      profileSelection?.shopId === shop.shopId &&
      profileSelection.services.length > 0
    ) {
      applyProfileIfNeeded(profileSelection);
      return;
    }

    if (fromProfile) return;

    if (!businessProfile) return;

    const defaultSignature = `default:${shop.shopId}`;
    if (hydrationSignatureRef.current === defaultSignature) return;
    hydrationSignatureRef.current = defaultSignature;

    const apiTeam = businessProfile
      ? getTeamForLocationMode(
          businessProfile,
          shop.locationMode ?? "fixed",
        ).map((tm) => ({
          id: tm.id,
          name: tm.name,
          locationModes: tm.locationModes,
        }))
      : [];

    const mode = shop.locationMode ?? "fixed";
    const defaultTeamMemberId = apiTeam[0]?.id ?? null;
    const catalogServices = getServicesForLocationMode(
      businessProfile,
      mode,
    ).map((s) => {
      const priced = pricePublicProfileServiceOnDate(s, toISO(selectedDate));
      return {
        id: s.id,
        catalogServiceId: s.id,
        name: s.name,
        durationMins: s.durationMins,
        price: priced.price,
        originalPrice: priced.originalPrice,
        discountPct: priced.discountPct,
        guestId: null as string | null,
        teamMemberId: defaultTeamMemberId,
      };
    });

    setServices(catalogServices.slice(0, 3));
    setShopTeamMembers(apiTeam);
    // First load: team member comes from backend roster when present.
    setSelectedTeamMemberId(defaultTeamMemberId ?? "");
    setServiceTab(getPreferredServiceTab(catalogServices.slice(0, 3)));
    setProfileHydrated(true);
  }, [
    applyProfileSelection,
    businessProfile,
    fromProfile,
    getPreferredServiceTab,
    isEbrSuggest,
    profileHydrationToken,
    requesterDisplayName,
    shop?.locationMode,
    shop?.shopId,
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
    if (filteredTeamMembers.some((tm) => tm.id === selectedTeamMemberId))
      return;
    // First load / roster ready: pick backend team member (Desired + Fixed).
    const fallbackId = filteredTeamMembers[0]?.id ?? "";
    if (!fallbackId) {
      if (selectedTeamMemberId) setSelectedTeamMemberId("");
      return;
    }
    setSelectedTeamMemberId(fallbackId);
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        // Stamp TM without moving Unassigned → Assigned.
        teamMemberId: s.teamMemberId || fallbackId,
      })),
    );
  }, [filteredTeamMembers, selectedTeamMemberId]);

  const reorderPeople = React.useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setPeople((prev) => {
      const fromIdx = prev.findIndex((p) => p.id === fromId);
      const toIdx = prev.findIndex((p) => p.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const syncPlanningDraftToPerson = (
    personId: string,
    activity: string,
    duration: string,
  ) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId
          ? {
              ...p,
              planningActivity: activity.trim(),
              planningDuration: duration.trim(),
            }
          : p,
      ),
    );
  };

  const selectPlanningCard = (person: BookingPerson) => {
    if (planningPersonId && planningPersonId !== person.id) {
      syncPlanningDraftToPerson(
        planningPersonId,
        planningActivity,
        planningDuration,
      );
    }
    setPlanningPersonId(person.id);
    setPlanningActivity(person.planningActivity ?? "");
    setPlanningDuration(person.planningDuration ?? "");
    setSelectedPersonId(person.id);
    setServiceTab("assigned");
  };

  const selectNonPlanningPerson = (personId: string) => {
    if (planningPersonId)
      syncPlanningDraftToPerson(
        planningPersonId,
        planningActivity,
        planningDuration,
      );
    setPlanningPersonId(null);

    const selectedIds = Object.entries(selectedServiceIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    const selectedPending = services.filter(
      (s) => !s.guestId && selectedIds.includes(s.id),
    );

    // Banner flow: select services in Unassigned, then tap a person to assign them.
    if (selectedPending.length > 0) {
      const idSet = new Set(selectedPending.map((s) => s.id));
      setServices((prev) =>
        prev.map((s) =>
          idSet.has(s.id)
            ? {
                ...s,
                guestId: personId,
                teamMemberId: selectedTeamMemberId || s.teamMemberId || null,
              }
            : s,
        ),
      );
      setSelectedServiceIds({});
      setSelectedPersonId(personId);
      setServiceTab("assigned");
      return;
    }

    setSelectedPersonId(personId);
    setSelectedServiceIds({});
    const person = people.find((p) => p.id === personId);
    const isModelOrGuest = Boolean(
      person && !person.isRequester && !isNonServicePerson(person),
    );
    if (isModelOrGuest) {
      const hasPending = services.some((s) => !s.guestId);
      const personHasAssigned = services.some((s) => s.guestId === personId);
      setServiceTab(
        hasPending && !personHasAssigned ? "unassigned" : "assigned",
      );
      return;
    }
    const personHasAssigned = services.some((s) => s.guestId === personId);
    const hasPending = services.some((s) => !s.guestId);
    setServiceTab(hasPending && !personHasAssigned ? "unassigned" : "assigned");
  };

  const addParticipant = (cardName: string) => {
    const isPlanning = cardName === "Planning";
    const isModel = cardName === "Model";
    const isGuest = cardName === "Guest";
    const isNotes = cardName === "Notes";

    if (isModel && !isCompanyClient) return;
    if (isPlanning && (!isCompanyClient || !bookingProjectEnabled)) return;
    if (isGuest && isCompanyClient) return;

    if (isNotes) {
      const existing = people.find(isNotesPerson);
      setParticipantMenuAnchor(null);
      if (existing) {
        setSelectedPersonId(existing.id);
        return;
      }
      const nextPerson = createNotesPerson();
      setPeople((prev) => [...prev, nextPerson]);
      setSelectedPersonId(nextPerson.id);
      return;
    }

    if (
      !isDesiredLocation &&
      isGuest &&
      additionalGuests.length >= FIXED_LOCATION_MAX_GUESTS
    ) {
      return;
    }

    const id = `p-guest-${Date.now()}`;
    const nextPerson: BookingPerson = {
      id,
      name: cardName,
      isRequester: false,
      participantType: isPlanning ? "planning" : isModel ? "model" : "guest",
    };
    setPeople((prev) => [...prev, nextPerson]);
    setParticipantMenuAnchor(null);
    if (isPlanning) {
      selectPlanningCard(nextPerson);
    } else {
      selectNonPlanningPerson(id);
      if (isModel || isGuest) setServiceTab("unassigned");
    }
  };

  const savePlanning = () => {
    if (!planningPersonId) return;
    syncPlanningDraftToPerson(
      planningPersonId,
      planningActivity,
      planningDuration,
    );
    setPeople((prev) =>
      prev.map((p) =>
        p.id === planningPersonId ? { ...p, planningIsLocked: true } : p,
      ),
    );
  };

  const startPlanningEdit = () => {
    if (!planningPersonId) return;
    setPeople((prev) =>
      prev.map((p) =>
        p.id === planningPersonId ? { ...p, planningIsLocked: false } : p,
      ),
    );
  };

  const planningFormIsLocked = Boolean(selectedPerson?.planningIsLocked);

  const handleProjectFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const stamp = Date.now();
    setProjectUploads((prev) => [
      ...prev,
      ...files.map((file, index) => ({
        id: `upload-${stamp}-${prev.length + index}`,
        name: file.name || `upload-${prev.length + index + 1}`,
        previewUrl: URL.createObjectURL(file),
        file,
      })),
    ]);
    e.target.value = "";
  };

  const deleteProjectUpload = (uploadId: string) => {
    setProjectUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target?.previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(target.previewUrl);
      return prev.filter((u) => u.id !== uploadId);
    });
  };

  const deleteGuest = (guestId: string) => {
    const person = people.find((p) => p.id === guestId);
    if (!person || person.isRequester) return;
    if (isNotesPerson(person)) setClientNote("");
    setPeople((prev) => prev.filter((p) => p.id !== guestId));
    // Remove this guest's services from the booking (do not send them to Unassigned).
    setServices((prev) => prev.filter((s) => s.guestId !== guestId));
    if (planningPersonId === guestId) {
      setPlanningPersonId(null);
      setPlanningActivity("");
      setPlanningDuration("");
    }
    if (selectedPersonId === guestId) {
      setSelectedPersonId(
        people.find((p) => p.isRequester)?.id ?? people[0]?.id ?? "",
      );
    }
  };

  const updateGuestName = (guestId: string, name: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === guestId ? { ...p, name } : p)),
    );
  };

  const assignSelectedDirect = () => {
    if (!canDirectAssign) return;
    const ids = new Set(selectedUnassignedServices.map((s) => s.id));
    setServices((prev) =>
      prev.map((s) => {
        if (!ids.has(s.id)) return s;
        return {
          ...s,
          guestId: selectedPersonId,
          teamMemberId: selectedTeamMemberId || s.teamMemberId || null,
        };
      }),
    );
    setSelectedServiceIds({});
    setServiceTab("assigned");
  };

  const unassignService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, guestId: null } : s)),
    );
    setSelectedServiceIds((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
    setServiceTab("unassigned");
  };

  const removeService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    setSelectedServiceIds((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const openAddServiceDialog = () => {
    setAddServiceCatalogIds({});
    setAddServiceCatalogQty({});
    setAddServiceDialogOpen(true);
  };

  const toggleAddServiceCatalog = (id: string, checked: boolean) => {
    setAddServiceCatalogIds((prev) => ({ ...prev, [id]: checked }));
    if (checked) {
      setAddServiceCatalogQty((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
    }
  };

  const adjustAddServiceCatalogQty = (id: string, delta: number) => {
    setAddServiceCatalogQty((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  };

  const confirmAddService = () => {
    const catalog = addServiceCatalog;
    const selectedIds = Object.entries(addServiceCatalogIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    if (!selectedIds.length) return;

    const stamped: Service[] = [];
    for (const catalogId of selectedIds) {
      const picked = catalog.find((c) => c.id === catalogId);
      if (!picked) continue;
      const quantity = Math.max(1, addServiceCatalogQty[catalogId] ?? 1);
      for (let index = 0; index < quantity; index += 1) {
        stamped.push({
          id: UUID_RE.test(picked.id)
            ? `${picked.id}-${Date.now()}-${stamped.length}`
            : `svc-${Date.now()}-${stamped.length}`,
          catalogServiceId: UUID_RE.test(picked.id)
            ? picked.id
            : extractUuidFromSyntheticId(picked.id),
          name: picked.name,
          durationMins: picked.durationMins,
          price: picked.price,
          originalPrice: picked.originalPrice,
          discountPct: picked.discountPct,
          guestId: null,
          teamMemberId: hasAssignableTeamMembers
            ? (isDesiredLocation
                ? selectedTeamMemberId || addServiceTeamMemberId
                : addServiceTeamMemberId) || null
            : null,
        });
      }
    }
    if (!stamped.length) return;

    setServices((prev) => [...prev, ...stamped]);
    setServiceTab("unassigned");
    setAddServiceDialogOpen(false);
    setAddServiceCatalogIds({});
    setAddServiceCatalogQty({});
  };

  /** Desired: one team member for the whole booking. Fixed: picker for Unassigned assign only. */
  const applySharedTeamMember = (teamMemberId: string) => {
    if (teamMemberId.startsWith("__")) return;
    setSelectedTeamMemberId(teamMemberId);
    if (!isDesiredLocation) return;
    setServices((prev) =>
      prev.map((s) => ({ ...s, teamMemberId: teamMemberId || null })),
    );
  };

  const updateServiceTeamMember = (serviceId: string, teamMemberId: string) => {
    if (!teamMemberId || teamMemberId.startsWith("__")) return;
    if (isDesiredLocation) {
      setSelectedTeamMemberId(teamMemberId);
      setServices((prev) => prev.map((s) => ({ ...s, teamMemberId })));
      return;
    }
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, teamMemberId } : s)),
    );
  };

  const toggleServiceSelection = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((prev) => ({ ...prev, [serviceId]: checked }));
  };

  const onContinue = async () => {
    if (
      !shop?.shopId ||
      services.length === 0 ||
      !allServicesAssigned ||
      isContinuing
    )
      return;

    if (isSelectedToday && isSameDayBookingTooSoon(selectedTime)) {
      setTimeValidationError(CLIENT_BOOKING_MIN_LEAD_ERROR);
      showSnackbar({
        severity: "error",
        message: CLIENT_BOOKING_MIN_LEAD_ERROR,
      });
      return;
    }
    setTimeValidationError(null);

    const peopleForDraft = (
      planningPersonId != null
        ? people.map((p) =>
            p.id === planningPersonId
              ? {
                  ...p,
                  planningActivity: planningActivity.trim(),
                  planningDuration: planningDuration.trim(),
                }
              : p,
          )
        : people
    ).filter((p) => !isNotesPerson(p));

    const requesterId =
      peopleForDraft.find((p) => p.isRequester)?.id ??
      peopleForDraft[0]?.id ??
      "p-requester";
    const servicesForDraft = services.map((s) => ({
      ...s,
      catalogServiceId: s.catalogServiceId ?? extractUuidFromSyntheticId(s.id),
      guestId: s.guestId ?? requesterId,
      teamMemberId:
        isDesiredLocation && selectedTeamMemberId
          ? selectedTeamMemberId
          : s.teamMemberId,
    }));
    const missingTeamMember = servicesMissingTeamMember(servicesForDraft);
    const projectDescriptionForDraft = missingTeamMember
      ? withTeamMemberProvidedByProNote(projectDescription)
      : projectDescription.trim();

    const payload = {
      selectedDateISO: toISO(selectedDate),
      selectedTime,
      combineServices,
      people: peopleForDraft,
      services: servicesForDraft,
      teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
      total,
      ...(clientNote.trim() ? { clientNote: clientNote.trim() } : {}),
      ...(isDesiredLocation
        ? {
            ...(isCompanyClient
              ? {
                  projectDetails: {
                    description: projectDescriptionForDraft,
                    uploads: projectUploads.map((u) => ({
                      id: u.id,
                      name: u.name,
                      previewUrl: u.previewUrl,
                      mimeType: u.file?.type,
                      kind: inferProjectUploadKind(u.name, u.file?.type),
                    })),
                  },
                }
              : {}),
            desiredLocation: {
              street: desiredVisitAddress.street.trim(),
              number: desiredVisitAddress.number.trim(),
              postalCode: desiredVisitAddress.postalCode.trim(),
              province: desiredVisitAddress.province.trim(),
              municipality: desiredVisitAddress.municipality.trim(),
            },
          }
        : missingTeamMember
          ? {
              projectDetails: {
                description: projectDescriptionForDraft,
                uploads: [],
              },
            }
          : {}),
    };

    const prepaymentPercent = parsePrepaymentPercent(
      businessProfile?.prepaymentLabel,
    );
    // Fixed location: client must prepay before booking when the pro requires it.
    // Desired location: % is shown as "after acceptance" (pay after pro accepts).
    const requiresPrepayment = !isDesiredLocation && prepaymentPercent > 0;

    // EBR suggest-edit: update existing booking draft and return to details (no new booking).
    if (isEbrSuggest) {
      setIsContinuing(true);
      try {
        const existing = getActiveBookingSession();
        if (!existing?.bookingRef) {
          showSnackbar({
            severity: "error",
            message: "Booking not found for suggested changes.",
          });
          return;
        }

        const baseline =
          ebrSuggestBaselineRef.current ?? existing.draft?.services ?? [];
        const baselineById = new Map(baseline.map((s) => [s.id, s]));
        const editedServiceIds: string[] = [];
        for (const service of servicesForDraft) {
          const original = baselineById.get(service.id);
          if (
            !original ||
            original.name !== service.name ||
            original.price !== service.price ||
            original.durationMins !== service.durationMins ||
            (original.teamMemberId ?? null) !==
              (service.teamMemberId ?? null) ||
            (original.guestId ?? null) !== (service.guestId ?? null)
          ) {
            editedServiceIds.push(service.id);
          }
        }
        for (const original of baseline) {
          if (!servicesForDraft.some((s) => s.id === original.id)) {
            editedServiceIds.push(original.id);
          }
        }

        setActiveBookingSession({
          ...existing,
          draft: payload,
          requiresPrepayment: existing.requiresPrepayment ?? requiresPrepayment,
          prepaymentPercent:
            existing.prepaymentPercent ??
            (prepaymentPercent > 0 ? prepaymentPercent : 0),
        });
        if (typeof window !== "undefined") {
          lockEbrDraft();
          window.sessionStorage.setItem("mollure:ebr_suggest_return", "1");
          window.sessionStorage.setItem(
            "mollure:ebr_suggest_edited_ids",
            JSON.stringify([...new Set(editedServiceIds)]),
          );
        }
        const listTab = parseBookingListTab(searchParams?.get("tab"));
        const checkoutPath = resolveCreateCheckoutPath({
          locationMode,
          requiresPrepayment: Boolean(
            existing.requiresPrepayment ?? requiresPrepayment,
          ),
        });
        rememberCreateReturnHref();
        router.push(`${checkoutPath}?tab=${listTab}`);
      } finally {
        setIsContinuing(false);
      }
      return;
    }

    const bookingRef = createBookingRef();

    setIsContinuing(true);
    try {
      if (fromProfile && typeof window !== "undefined") {
        window.sessionStorage.removeItem(ACTIVE_BOOKING_ID_KEY);
        window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
      }

      const localUploads: Array<{
        id: string;
        name: string;
        url?: string;
        previewUrl?: string;
        mimeType?: string;
        kind?: "image" | "document";
      }> = projectUploads.map((u) => ({
        id: u.id,
        name: u.name,
        previewUrl: u.previewUrl,
        mimeType: u.file?.type,
        kind: inferProjectUploadKind(u.name, u.file?.type),
      }));
      let projectDetailsUploads = localUploads;
      if (isDesiredLocation && isCompanyClient && projectUploads.length > 0) {
        const filesToUpload = (
          await Promise.all(projectUploads.map((u) => fileFromProjectUpload(u)))
        ).filter((file): file is File => Boolean(file));
        if (filesToUpload.length > 0) {
          const uploaded = await uploadBookingAttachments(filesToUpload).unwrap();
          const attachments = uploaded.data?.attachments ?? [];
          const durableByName = new Map(
            attachments.map((att) => [att.name, att]),
          );
          projectDetailsUploads = projectUploads.map((upload, index) => {
            const matched =
              (upload.file && durableByName.get(upload.file.name)) ||
              durableByName.get(upload.name) ||
              attachments[index];
            if (!matched) return localUploads[index];
            const durable = resolveMediaUrl(matched.url) ?? matched.url;
            return {
              id: matched.id || upload.id,
              name: upload.name || matched.name,
              url: matched.url,
              previewUrl: durable,
              mimeType: matched.mimeType || upload.file?.type,
              kind:
                matched.kind ||
                inferProjectUploadKind(
                  upload.name || matched.name,
                  matched.mimeType || upload.file?.type,
                ),
            };
          });
        }
      }

      const payload = {
        selectedDateISO: toISO(selectedDate),
        selectedTime,
        combineServices,
        people: peopleForDraft,
        services: servicesForDraft,
        teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
        total,
        ...(clientNote.trim() ? { clientNote: clientNote.trim() } : {}),
        ...(isDesiredLocation
          ? {
              ...(isCompanyClient
                ? {
                    projectDetails: {
                      description: projectDescriptionForDraft,
                      uploads: projectDetailsUploads,
                    },
                  }
                : {}),
              desiredLocation: {
                street: desiredVisitAddress.street.trim(),
                number: desiredVisitAddress.number.trim(),
                postalCode: desiredVisitAddress.postalCode.trim(),
                province: desiredVisitAddress.province.trim(),
                municipality: desiredVisitAddress.municipality.trim(),
              },
            }
          : missingTeamMember
            ? {
                projectDetails: {
                  description: projectDescriptionForDraft,
                  uploads: [],
                },
              }
            : {}),
      };

      const shopForSession = shop
        ? {
            ...shop,
            ...(isDesiredLocation && desiredVisitAddressLabel
              ? {
                  addressLabel: desiredVisitAddressLabel,
                  municipalityLabel:
                    desiredVisitAddress.municipality.trim() || shop.municipalityLabel,
                }
              : {}),
          }
        : shop;

      const draftRecord = {
        id: `bk_draft_${Date.now()}`,
        bookingRef,
        status: "draft" as const,
        shop: shopForSession,
        draft: payload,
        createdAt: new Date().toISOString(),
        requiresPrepayment,
        // Keep % for desired "after acceptance" note even when pay-before is off.
        prepaymentPercent: prepaymentPercent > 0 ? prepaymentPercent : 0,
        prepaid: false,
        bookingRequestSent: false,
      };
      setActiveBookingSession(draftRecord);

      const listTab = parseBookingListTab(searchParams?.get("tab"));
      const checkoutPath = resolveCreateCheckoutPath({
        locationMode,
        requiresPrepayment,
      });
      rememberCreateReturnHref();
      router.push(`${checkoutPath}?tab=${listTab}`);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to create booking. Please try again.",
        ),
      });
    } finally {
      setIsContinuing(false);
    }
  };

  const continueLabel = isConfirmedEbrEdit
    ? "Send EBR to professional"
    : isEbrSuggest
      ? "Save & return"
      : "Continue";

  React.useEffect(() => {
    if (!isEbrSuggest || !ebrFocus || !profileHydrated) return;
    const id =
      ebrFocus === "project"
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
    isTimeUnavailable,
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
    filteredTeamMembers,
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
