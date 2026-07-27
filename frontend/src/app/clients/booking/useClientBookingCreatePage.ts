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
  setActiveBookingSession,
} from "./clientBookingSession";
import { resolveCreateCheckoutPath } from "./resolveCreateBookingStatus";
import { submitClientBookingRequest } from "./submitClientBookingRequest";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  getServicesForLocationMode,
  getTeamForLocationMode,
} from "../../../data/businessPublicProfile.data";
import { useBusinessPublicProfile } from "../../../hooks/useBusinessPublicProfile";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { enrichClientBookingRecord } from "./clientBookingDraftCache";
import { parsePrepaymentPercent } from "../../../components/common/client-booking/parsePrepaymentPercent";
import { loadPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
} from "../../../store/services/profileApi";
import {
  useCreateBookingMutation,
  useUploadBookingAttachmentsMutation,
} from "../../../store/services/businessApi";

import {
  FIXED_LOCATION_MAX_GUESTS,
  UUID_RE,
  isAdditionalGuest,
  resolveRequesterDisplayName,
} from "./booking.page.data";
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
      return next;
    });
  };

  const allDayTimes = React.useMemo(() => {
    const slots: string[] = [];
    for (let minutes = 9 * 60; minutes <= 18 * 60; minutes += 30) {
      slots.push(fmtMinutesToTimeLabel(minutes));
    }
    return slots;
  }, []);

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

  const times = allDayTimes;

  const availableTimes = React.useMemo(() => {
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
  const [addServiceGuestId, setAddServiceGuestId] = React.useState("");
  /** Fixed location: confirm before removing a service card. */
  const [servicePendingRemove, setServicePendingRemove] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  /** Baseline services when opening EBR suggest-edit — used to mark Edited lines. */
  const ebrSuggestBaselineRef = React.useRef<Service[] | null>(null);
  const [projectDescription, setProjectDescription] = React.useState("");
  const [projectUploads, setProjectUploads] = React.useState<
    Array<{ id: string; name: string; previewUrl: string; file?: File }>
  >([]);
  const [participantMenuAnchor, setParticipantMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [planningPersonId, setPlanningPersonId] = React.useState<string | null>(
    null,
  );
  const [planningActivity, setPlanningActivity] = React.useState("");
  const [planningDuration, setPlanningDuration] = React.useState("");
  const projectFileInputRef = React.useRef<HTMLInputElement>(null);

  const locationMode = shop?.locationMode ?? "fixed";
  const isDesiredLocation = locationMode === "desired";
  const getParticipantLabel = React.useCallback(
    (person: BookingPerson) => {
      if (person.participantType === "planning" || person.name === "Planning")
        return "Planning";
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

    const locationCatalog = getServicesForLocationMode(
      businessProfile,
      locationMode,
    );
    const fallbackItems: CatalogService[] = locationCatalog.map((s) => ({
      id: s.id,
      name: s.name,
      durationMins: s.durationMins,
      price: s.priceValue,
    }));
    const byId = new Map(locationCatalog.map((s) => [s.id, s]));
    const byName = new Map(
      locationCatalog.map((s) => [s.name.trim().toLowerCase(), s]),
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
          const matched =
            byId.get(opt.value) ??
            byName.get(
              String(opt.label ?? "")
                .trim()
                .toLowerCase(),
            );
          const id = matched?.id ?? opt.value;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          items.push({
            id,
            name: matched?.name ?? opt.label,
            durationMins: matched?.durationMins ?? 30,
            price: matched?.priceValue ?? 0,
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
  ]);

  const isPlanningPerson = React.useCallback(
    (p: BookingPerson) =>
      p.participantType === "planning" || p.name === "Planning",
    [],
  );

  const selectedPerson = React.useMemo(
    () => people.find((p) => p.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  const isPlanningCardSelected = Boolean(
    selectedPerson && isPlanningPerson(selectedPerson),
  );

  const filteredTeamMembers = React.useMemo(
    () =>
      shopTeamMembers.filter((tm) => tm.locationModes.includes(locationMode)),
    [locationMode, shopTeamMembers],
  );

  const additionalGuests = React.useMemo(
    () => people.filter(isAdditionalGuest),
    [people],
  );
  const canAddFixedLocationGuest =
    !isDesiredLocation && additionalGuests.length < FIXED_LOCATION_MAX_GUESTS;
  const serviceAssignees = React.useMemo(() => {
    // Jane / Model / Guest can all receive services; Planning cannot.
    return people.filter((p) => !isPlanningPerson(p));
  }, [isPlanningPerson, people]);
  const canAddService =
    serviceAssignees.length > 0 && Boolean(selectedTeamMemberId);

  const serviceCountLabel = React.useCallback(
    (personId: string) => {
      const n = services.filter((s) => s.guestId === personId).length;
      return n === 1 ? "1 Service" : `${n} Services`;
    },
    [services],
  );

  const personCardSubtitle = React.useCallback(
    (person: BookingPerson) => serviceCountLabel(person.id),
    [serviceCountLabel],
  );

  const selectedServicesCount = React.useMemo(
    () => Object.values(selectedServiceIds).filter(Boolean).length,
    [selectedServiceIds],
  );
  const allServicesAssigned = React.useMemo(
    () =>
      services.length > 0 &&
      services.every((s) => Boolean(s.guestId) && Boolean(s.teamMemberId)),
    [services],
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
    !isPlanningPerson(selectedPerson),
  );

  React.useEffect(() => {
    if (!profileHydrated && fromProfile) return;
    // Model/Guest: stay on Assigned — add services via Service to assignment list.
    if (isModelOrGuestSelected) {
      if (serviceTab !== "assigned") setServiceTab("assigned");
      return;
    }
    if (unassigned.length > 0 && serviceTab === "assigned") {
      setServiceTab("unassigned");
    } else if (
      unassigned.length === 0 &&
      assigned.length > 0 &&
      serviceTab === "unassigned"
    ) {
      setServiceTab("assigned");
    }
  }, [
    assigned.length,
    fromProfile,
    isModelOrGuestSelected,
    profileHydrated,
    serviceTab,
    unassigned.length,
  ]);

  const selectedUnassignedServices = React.useMemo(
    () => unassigned.filter((s) => selectedServiceIds[s.id]),
    [unassigned, selectedServiceIds],
  );
  const canDirectAssign =
    Boolean(selectedTeamMemberId) && selectedUnassignedServices.length > 0;
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
    () => services.reduce((sum, s) => sum + s.durationMins, 0),
    [services],
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
    for (const tm of shopTeamMembers) map.set(tm.id, tm.name);
    return map;
  }, [shopTeamMembers]);

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
      if (!teamMemberId) return undefined;
      const fullName = teamMemberNameById.get(teamMemberId);
      if (!fullName) return undefined;
      return fullName.split(/\s+/)[0];
    },
    [teamMemberNameById],
  );

  const summarySections = React.useMemo(() => {
    const sections: Array<{
      key: string;
      title: string;
      items: Service[];
      planningItem?: { activity: string; duration: string };
      teamMemberLabel?: string;
    }> = [];
    for (const p of people) {
      const items = summaryGroups.get(p.id) ?? [];
      const planningItem =
        isPlanningPerson(p) && p.planningIsLocked
          ? {
              activity: p.planningActivity?.trim() ?? "",
              duration: p.planningDuration?.trim() ?? "",
            }
          : undefined;
      const hasPlanning = Boolean(
        planningItem?.activity || planningItem?.duration,
      );
      if (!items.length && !hasPlanning) continue;
      const teamMemberLabel = teamMemberChipLabelForItems(items);
      sections.push({
        key: p.id,
        title: p.name,
        items,
        ...(hasPlanning ? { planningItem } : {}),
        ...(teamMemberLabel ? { teamMemberLabel } : {}),
      });
    }
    return sections;
  }, [people, summaryGroups, isPlanningPerson, teamMemberChipLabelForItems]);

  React.useEffect(() => {
    // Safety: never allow a past date to remain selected.
    if (isPastDay(selectedDate)) setSelectedDate(today0);
  }, [isPastDay, selectedDate, today0]);

  React.useEffect(() => {
    if (!selectedTimeTooSoon) setTimeValidationError(null);
  }, [selectedTimeTooSoon]);

  React.useEffect(() => {
    // If today has no remaining slots, move to tomorrow.
    if (isSelectedToday && availableTimes.length === 0) {
      setSelectedDate(addDays(today0, 1));
      return;
    }
    // Keep selection on a bookable future slot (nearest by default).
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
      setTimeValidationError(null);
    }
  }, [availableTimes, isSelectedToday, selectedTime, today0]);

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
      if (profileSelection.teamMembers.length > 0) {
        setShopTeamMembers(profileSelection.teamMembers);
      }

      const profileServices = profileSelection.services.map((row) => ({
        id: row.id,
        catalogServiceId:
          row.catalogServiceId ?? extractUuidFromSyntheticId(row.id),
        name: row.name,
        durationMins: row.durationMins,
        price: row.price,
        // Desired: leave person + professional open so Model can pick services via Assign.
        guestId:
          profileSelection.locationMode === "desired" ? null : "p-requester",
        teamMemberId:
          profileSelection.locationMode === "desired" ? null : row.teamMemberId,
      }));

      setServices(profileServices);
      setServiceTab(getPreferredServiceTab(profileServices));
      setSelectedServiceIds({});

      if (
        profileSelection.locationMode === "desired" &&
        profileSelection.projectEnabled
      ) {
        setProjectDescription(profileSelection.projectInstructions);
      }

      setShop((prev) => ({
        shopId: profileSelection.shopId,
        shopName: profileSelection.shopName ?? prev?.shopName ?? "Salon",
        municipalityLabel: prev?.municipalityLabel,
        addressLabel: prev?.addressLabel,
        locationMode: profileSelection.locationMode,
      }));

      if (profileSelection.teamMembers.length > 0) {
        const firstMember = profileSelection.teamMembers.find((tm) =>
          tm.locationModes.includes(profileSelection.locationMode),
        );
        if (firstMember) setSelectedTeamMemberId(firstMember.id);
      }

      setProfileHydrated(true);
    },
    [getPreferredServiceTab],
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

      const locationMode =
        existing.shop?.locationMode ?? shop.locationMode ?? "fixed";
      const signature = `ebrSuggest:${existing.bookingRef}:${existing.draft.people
        ?.map((p) => `${p.id}:${p.participantType ?? ""}`)
        .join(",")}:${existing.draft.services
        .map(
          (row) => `${row.id}:${row.guestId ?? ""}:${row.teamMemberId ?? ""}`,
        )
        .join("|")}:${existing.draft.projectDetails?.description ?? ""}`;
      if (hydrationSignatureRef.current === signature) return;
      hydrationSignatureRef.current = signature;

      const draftServices: Service[] = existing.draft.services.map((row) => ({
        id: row.id,
        catalogServiceId: extractUuidFromSyntheticId(row.id) ?? row.id,
        name: row.name,
        durationMins: row.durationMins,
        price: row.price,
        guestId:
          row.guestId != null && row.guestId !== ""
            ? row.guestId
            : locationMode === "desired"
              ? null
              : "p-requester",
        teamMemberId: row.teamMemberId ?? null,
      }));

      setServices(draftServices);
      ebrSuggestBaselineRef.current = draftServices.map((s) => ({ ...s }));

      const draftPeople = existing.draft.people?.length
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
      setPeople(draftPeople);

      const personWithServices =
        draftPeople.find((p) =>
          draftServices.some((s) => s.guestId === p.id),
        ) ??
        draftPeople.find((p) => p.isRequester) ??
        draftPeople[0];
      if (personWithServices?.id) setSelectedPersonId(personWithServices.id);

      const draftTeamMembers = existing.draft.teamMembers;
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

      if (existing.draft.selectedDateISO) {
        const parsed = new Date(`${existing.draft.selectedDateISO}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) setSelectedDate(parsed);
      }
      if (existing.draft.selectedTime)
        setSelectedTime(existing.draft.selectedTime);
      setCombineServices(Boolean(existing.draft.combineServices));
      if (existing.draft.projectDetails) {
        setProjectDescription(existing.draft.projectDetails.description ?? "");
        setProjectUploads(
          (existing.draft.projectDetails.uploads ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            previewUrl: u.previewUrl ?? "",
          })),
        );
      }
      const firstTm =
        draftServices.find((s) => s.teamMemberId)?.teamMemberId ??
        existing.draft.teamMembers?.[0]?.id ??
        "";
      if (firstTm) setSelectedTeamMemberId(firstTm);
      setServiceTab(getPreferredServiceTab(draftServices));
      setProfileHydrated(true);
      return;
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
    const catalogServices = getServicesForLocationMode(
      businessProfile,
      mode,
    ).map((s) => ({
      id: s.id,
      catalogServiceId: s.id,
      name: s.name,
      durationMins: s.durationMins,
      price: s.priceValue,
      guestId: (mode === "desired" ? null : "p-requester") as string | null,
      teamMemberId: mode === "desired" ? null : (apiTeam[0]?.id ?? null),
    }));

    setServices(catalogServices.slice(0, 3));
    setShopTeamMembers(apiTeam);
    if (apiTeam[0]?.id) setSelectedTeamMemberId(apiTeam[0].id);
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
    if (!people.some((p) => p.id === selectedPersonId)) {
      setSelectedPersonId(people[0]?.id ?? "");
    }
  }, [people, selectedPersonId]);

  React.useEffect(() => {
    if (filteredTeamMembers.some((tm) => tm.id === selectedTeamMemberId))
      return;
    const fallbackId = filteredTeamMembers[0]?.id ?? "";
    setSelectedTeamMemberId(fallbackId);
    // Desired: keep every service on the single active professional.
    if (isDesiredLocation && fallbackId) {
      setServices((prev) =>
        prev.map((s) => ({ ...s, teamMemberId: fallbackId })),
      );
    }
  }, [filteredTeamMembers, isDesiredLocation, selectedTeamMemberId]);

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
    setSelectedPersonId(personId);
    setSelectedServiceIds({});
    const person = people.find((p) => p.id === personId);
    const isModelOrGuest = Boolean(
      person && !person.isRequester && !isPlanningPerson(person),
    );
    if (isModelOrGuest) {
      setServiceTab("assigned");
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
    if (!canDirectAssign || !selectedTeamMemberId) return;
    const ids = new Set(selectedUnassignedServices.map((s) => s.id));
    setServices((prev) =>
      prev.map((s) => {
        if (!ids.has(s.id)) return s;
        return {
          ...s,
          guestId: selectedPersonId,
          teamMemberId: selectedTeamMemberId,
        };
      }),
    );
    setSelectedServiceIds({});
  };

  const openAddServiceDialog = () => {
    if (!selectedTeamMemberId && filteredTeamMembers[0]?.id) {
      setSelectedTeamMemberId(filteredTeamMembers[0].id);
    }
    setAddServiceCatalogIds({});
    const preferredAssignee =
      serviceAssignees.find((p) => p.id === selectedPersonId)?.id ??
      serviceAssignees[0]?.id ??
      people[0]?.id ??
      "";
    setAddServiceGuestId(preferredAssignee);
    setAddServiceDialogOpen(true);
  };

  const confirmAddService = () => {
    const catalog = catalogByTeamMemberId[selectedTeamMemberId] ?? [];
    const selectedIds = Object.entries(addServiceCatalogIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    if (!selectedIds.length || !addServiceGuestId || !selectedTeamMemberId)
      return;

    const stamped: Service[] = [];
    for (const catalogId of selectedIds) {
      const picked = catalog.find((c) => c.id === catalogId);
      if (!picked) continue;
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
        guestId: addServiceGuestId,
        teamMemberId: selectedTeamMemberId,
      });
    }
    if (!stamped.length) return;

    setServices((prev) => [...prev, ...stamped]);
    setSelectedPersonId(addServiceGuestId);
    setServiceTab("assigned");
    setAddServiceDialogOpen(false);
    setAddServiceCatalogIds({});
  };

  /** Desired: one professional for the whole booking. Fixed: only updates the picker for the next assign. */
  const applySharedTeamMember = (teamMemberId: string) => {
    setSelectedTeamMemberId(teamMemberId);
    if (!teamMemberId || !isDesiredLocation) return;
    setServices((prev) => prev.map((s) => ({ ...s, teamMemberId })));
  };

  const updateServiceTeamMember = (serviceId: string, teamMemberId: string) => {
    if (!teamMemberId) return;
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, teamMemberId } : s)),
    );
  };

  const confirmRemoveService = () => {
    if (!servicePendingRemove) return;
    setServices((prev) => prev.filter((x) => x.id !== servicePendingRemove.id));
    setServicePendingRemove(null);
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

    const peopleForDraft =
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
        : people;

    const requesterId =
      peopleForDraft.find((p) => p.isRequester)?.id ??
      peopleForDraft[0]?.id ??
      "p-requester";
    const servicesForDraft = services.map((s) => ({
      ...s,
      catalogServiceId: s.catalogServiceId ?? extractUuidFromSyntheticId(s.id),
      guestId: s.guestId ?? requesterId,
      // Desired location: every service must use the single selected professional.
      teamMemberId:
        isDesiredLocation && selectedTeamMemberId
          ? selectedTeamMemberId
          : s.teamMemberId,
    }));

    const payload = {
      selectedDateISO: toISO(selectedDate),
      selectedTime,
      combineServices,
      people: peopleForDraft,
      services: servicesForDraft,
      teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
      total,
      ...(isDesiredLocation
        ? {
            projectDetails: {
              description: projectDescription,
              uploads: projectUploads.map((u) => ({
                id: u.id,
                name: u.name,
                previewUrl: u.previewUrl,
              })),
            },
          }
        : {}),
    };

    const prepaymentPercent = parsePrepaymentPercent(
      businessProfile?.prepaymentLabel,
    );
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
            (requiresPrepayment ? prepaymentPercent : 0),
        });
        if (typeof window !== "undefined") {
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

      let projectDetailsUploads: Array<{
        id: string;
        name: string;
        url?: string;
        mimeType?: string;
        kind?: "image" | "document";
      }> = projectUploads.map((u) => ({ id: u.id, name: u.name }));
      const filesToUpload = projectUploads
        .map((u) => u.file)
        .filter((file): file is File => Boolean(file));
      if (isDesiredLocation && filesToUpload.length > 0) {
        const uploaded = await uploadBookingAttachments(filesToUpload).unwrap();
        const attachments = uploaded.data?.attachments ?? [];
        projectDetailsUploads = attachments.map((att) => ({
          id: att.id,
          name: att.name,
          url: att.url,
          mimeType: att.mimeType,
          kind: att.kind,
        }));
      }

      const payload = {
        selectedDateISO: toISO(selectedDate),
        selectedTime,
        combineServices,
        people: peopleForDraft,
        services: servicesForDraft,
        teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
        total,
        ...(isDesiredLocation
          ? {
              projectDetails: {
                description: projectDescription,
                uploads: projectDetailsUploads,
              },
            }
          : {}),
      };

      const draftRecord = {
        id: `bk_draft_${Date.now()}`,
        bookingRef,
        status: "draft" as const,
        shop,
        draft: payload,
        createdAt: new Date().toISOString(),
        requiresPrepayment,
        prepaymentPercent: requiresPrepayment ? prepaymentPercent : 0,
        prepaid: false,
      };
      setActiveBookingSession(draftRecord);

      const result = await submitClientBookingRequest({
        record: draftRecord,
        locationMode,
        setup: bookingSetup,
        createBooking,
      });

      if (!result.ok) {
        showSnackbar({ severity: "error", message: result.message });
        return;
      }

      setActiveBookingSession(result.record);
      showSnackbar({ severity: "success", message: "Booking request created" });

      const listTab = parseBookingListTab(searchParams?.get("tab"));
      const checkoutPath = resolveCreateCheckoutPath({
        locationMode,
        requiresPrepayment,
      });
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
    addServiceGuestId,
    setAddServiceGuestId,
    servicePendingRemove,
    setServicePendingRemove,
    ebrSuggestBaselineRef,
    projectDescription,
    setProjectDescription,
    projectUploads,
    setProjectUploads,
    participantMenuAnchor,
    setParticipantMenuAnchor,
    planningPersonId,
    setPlanningPersonId,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    projectFileInputRef,
    locationMode,
    isDesiredLocation,
    getParticipantLabel,
    catalogByTeamMemberId,
    isPlanningPerson,
    selectedPerson,
    isPlanningCardSelected,
    filteredTeamMembers,
    additionalGuests,
    canAddFixedLocationGuest,
    serviceAssignees,
    canAddService,
    serviceCountLabel,
    personCardSubtitle,
    updateGuestName,
    selectedServicesCount,
    allServicesAssigned,
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
    confirmRemoveService,
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
