"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,  
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ModeEditOutlineRoundedIcon from "@mui/icons-material/ModeEditOutlineRounded";
import { AppDropdown, ClientPageTabsBar, clientTopTabsActiveLabel, MarketingSiteFooter, MollureMarketingHeader } from "../../../components/common";
import MessagingModalShell, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../../../components/common/messaging/MessagingModalShell";
import { ServiceSummaryMetaLine } from "../../../components/common/ServiceSummaryMetaLine";
import {
  CLIENT_BOOKING_MIN_LEAD_ERROR,
  CLIENT_BOOKING_MIN_LEAD_MINUTES,
  fmtMinutesToTimeLabel,
  getNowMinutesFromMidnight,
  isSameDayBookingTooSoon,
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "./booking-time";
import ClientBookingListView from "./ClientBookingListView";
import ClientBookingPageShell from "./ClientBookingPageShell";
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
import { getServicesForLocationMode, getTeamForLocationMode } from "../../../data/businessPublicProfile.data";
import { useBusinessPublicProfile } from "../../../hooks/useBusinessPublicProfile";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import { enrichClientBookingRecord } from "./clientBookingDraftCache";
import { parsePrepaymentPercent } from "../../../components/common/client-booking/parsePrepaymentPercent";
import { loadPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
  type CompanyProfile,
  type IndividualProfile,
  type ProfessionalProfile,
  type ProfileResponse,
} from "../../../store/services/profileApi";
import { useCreateBookingMutation, useUploadBookingAttachmentsMutation } from "../../../store/services/businessApi";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveNameFromProfileResponse(profile: ProfileResponse | null | undefined): string {
  if (!profile) return "";
  if (profile.user_type === "company") {
    const companyProfile = profile.profile as CompanyProfile | null;
    return (
      companyProfile?.legal_name?.trim() ||
      `${companyProfile?.contact_first_name ?? ""} ${companyProfile?.contact_last_name ?? ""}`.trim() ||
      ""
    );
  }
  if (profile.user_type === "professional") {
    const professionalProfile = profile.profile as ProfessionalProfile | null;
    return (
      `${professionalProfile?.contact_first_name ?? ""} ${professionalProfile?.contact_last_name ?? ""}`.trim() ||
      professionalProfile?.legal_name?.trim() ||
      ""
    );
  }
  const individualProfile = profile.profile as IndividualProfile | null;
  return (
    individualProfile?.display_name?.trim() ||
    `${individualProfile?.first_name ?? ""} ${individualProfile?.last_name ?? ""}`.trim() ||
    ""
  );
}

function resolveRequesterDisplayName(user: unknown, profileResponse?: ProfileResponse | null): string {
  const fromApi = resolveNameFromProfileResponse(profileResponse);
  if (fromApi) return fromApi;

  const u = user as { display_name?: string; first_name?: string; last_name?: string; email?: string } | null;
  const fromAuthUser =
    u?.display_name?.trim() || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();
  if (fromAuthUser) return fromAuthUser;

  return "Guest";
}

function isServiceTeamAssigned(service: { teamMemberId: string | null }) {
  return Boolean(service.teamMemberId);
}

const FIXED_LOCATION_MAX_GUESTS = 1;

function isAdditionalGuest(p: { isRequester: boolean; participantType?: "model" | "planning" | "guest" }) {
  return !p.isRequester && p.participantType === "guest";
}

function ClientBookingCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams?.get("from") === "profile";
  const profileHydrationToken = searchParams?.get("t") ?? "";
  const isEbrSuggest = searchParams?.get("ebrSuggest") === "1";
  const ebrFocus = searchParams?.get("ebrFocus") as "datetime" | "services" | "project" | null;
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

  const [shop, setShop] = React.useState<{
    shopId: string;
    shopName: string;
    municipalityLabel?: string;
    addressLabel?: string;
    locationMode?: "fixed" | "desired";
  } | null>(null);

  const { profile: businessProfile, setups: businessSetups } = useBusinessPublicProfile(shop?.shopId);
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
  const isPastDay = React.useCallback((d: Date) => startOfDay(d).getTime() < today0.getTime(), [today0]);

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
  const fmtDow = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short" });

  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const [monthPickerAnchor, setMonthPickerAnchor] = React.useState<HTMLElement | null>(null);
  const weekStart = React.useMemo(() => startOfWeekMon(selectedDate), [selectedDate]);
  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dt = addDays(weekStart, i);
        return { date: dt, key: toISO(dt), dow: fmtDow(dt), day: dt.getDate() };
      }),
    [weekStart],
  );
  const monthLabel = React.useMemo(
    () => selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
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

  const nowMinutes = React.useMemo(() => getNowMinutesFromMidnight(new Date(nowTick)), [nowTick, selectedDate]);
  const minBookableMinutes = nowMinutes + CLIENT_BOOKING_MIN_LEAD_MINUTES;

  const times = allDayTimes;

  const availableTimes = React.useMemo(() => {
    if (!isSelectedToday) return times;
    return times.filter((t) => parseTimeLabelToMinutes(t) > minBookableMinutes);
  }, [isSelectedToday, minBookableMinutes, times]);

  const isTimeUnavailable = React.useCallback(
    (t: string) => isSelectedToday && parseTimeLabelToMinutes(t) <= minBookableMinutes,
    [isSelectedToday, minBookableMinutes],
  );

  const timeScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeSlots = React.useCallback((direction: "left" | "right") => {
    const el = timeScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -180 : 180, behavior: "smooth" });
  }, []);

  type BookingPerson = {
    id: string;
    name: string;
    isRequester: boolean;
    participantType?: "model" | "planning" | "guest";
    planningActivity?: string;
    planningDuration?: string;
    planningIsLocked?: boolean;
  };
  const [people, setPeople] = React.useState<BookingPerson[]>(() => [
    { id: "p-requester", name: "Guest", isRequester: true },
  ]);
  const [draggingPersonId, setDraggingPersonId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPeople((prev) =>
      prev.map((p) => (p.isRequester ? { ...p, name: requesterDisplayName } : p)),
    );
  }, [requesterDisplayName]);

  type ShopTeamMember = { id: string; name: string; locationModes: Array<"fixed" | "desired"> };
  const [shopTeamMembers, setShopTeamMembers] = React.useState<ShopTeamMember[]>([]);

  type CatalogService = {
    id: string;
    name: string;
    durationMins: number;
    price: number;
    originalPrice?: number;
    discountPct?: number;
  };

  type Service = {
    id: string;
    /** Real subcategory UUID when known (profile / catalog). */
    catalogServiceId?: string | null;
    name: string;
    durationMins: number;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    guestId: string | null;
    teamMemberId: string | null;
  };

  const getPreferredServiceTab = React.useCallback((items: Service[]): "assigned" | "unassigned" => {
    const hasUnassigned = items.some((s) => !s.guestId);
    const hasAssigned = items.some((s) => Boolean(s.guestId));
    if (hasUnassigned && !hasAssigned) return "unassigned";
    return "assigned";
  }, []);

  const [services, setServices] = React.useState<Service[]>([]);
  const [profileHydrated, setProfileHydrated] = React.useState(false);
  const hydrationSignatureRef = React.useRef<string | null>(null);

  const [selectedTime, setSelectedTime] = React.useState(() => {
    const mins = getNowMinutesFromMidnight() + CLIENT_BOOKING_MIN_LEAD_MINUTES;
    const future = allDayTimes.filter((t) => parseTimeLabelToMinutes(t) > mins);
    return (future[0] ?? allDayTimes[0]) ?? "";
  });
  const [timeValidationError, setTimeValidationError] = React.useState<string | null>(null);
  const selectedTimeTooSoon = React.useMemo(
    () => isSelectedToday && isSameDayBookingTooSoon(selectedTime, new Date(nowTick)),
    [isSelectedToday, nowTick, selectedTime],
  );
  const [combineServices, setCombineServices] = React.useState(true);
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>("p-requester");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = React.useState<string>("");
  const [serviceTab, setServiceTab] = React.useState<"assigned" | "unassigned">("assigned");
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Record<string, boolean>>({});

  const [addServiceDialogOpen, setAddServiceDialogOpen] = React.useState(false);
  const [addServiceCatalogIds, setAddServiceCatalogIds] = React.useState<Record<string, boolean>>({});
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
    Array<{ id: string; name: string; previewUrl: string; file: File }>
  >([]);
  const [participantMenuAnchor, setParticipantMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [planningPersonId, setPlanningPersonId] = React.useState<string | null>(null);
  const [planningActivity, setPlanningActivity] = React.useState("");
  const [planningDuration, setPlanningDuration] = React.useState("");
  const projectFileInputRef = React.useRef<HTMLInputElement>(null);

  const locationMode = shop?.locationMode ?? "fixed";
  const isDesiredLocation = locationMode === "desired";
  const getParticipantLabel = React.useCallback(
    (person: BookingPerson) => {
      if (person.participantType === "planning" || person.name === "Planning") return "Planning";
      if (person.participantType === "guest" || person.name === "Guest") return "Guest";
      return isDesiredLocation ? "Model" : "Guest";
    },
    [isDesiredLocation],
  );

  const catalogByTeamMemberId = React.useMemo<Record<string, CatalogService[]>>(() => {
    if (!shop?.shopId || !profileHydrated || !businessProfile) return {};

    const locationCatalog = getServicesForLocationMode(businessProfile, locationMode);
    const fallbackItems: CatalogService[] = locationCatalog.map((s) => ({
      id: s.id,
      name: s.name,
      durationMins: s.durationMins,
      price: s.priceValue,
    }));
    const byId = new Map(locationCatalog.map((s) => [s.id, s]));
    const byName = new Map(locationCatalog.map((s) => [s.name.trim().toLowerCase(), s]));
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
            byId.get(opt.value) ?? byName.get(String(opt.label ?? "").trim().toLowerCase());
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
  }, [businessProfile, locationMode, profileHydrated, shop?.shopId, shopTeamMembers]);

  const isPlanningPerson = React.useCallback(
    (p: BookingPerson) => p.participantType === "planning" || p.name === "Planning",
    [],
  );

  const selectedPerson = React.useMemo(
    () => people.find((p) => p.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  const isPlanningCardSelected = Boolean(selectedPerson && isPlanningPerson(selectedPerson));

  const filteredTeamMembers = React.useMemo(
    () => shopTeamMembers.filter((tm) => tm.locationModes.includes(locationMode)),
    [locationMode, shopTeamMembers],
  );

  const additionalGuests = React.useMemo(() => people.filter(isAdditionalGuest), [people]);
  const canAddFixedLocationGuest =
    !isDesiredLocation && additionalGuests.length < FIXED_LOCATION_MAX_GUESTS;
  const serviceAssignees = React.useMemo(() => {
    // Jane / Model / Guest can all receive services; Planning cannot.
    return people.filter((p) => !isPlanningPerson(p));
  }, [isPlanningPerson, people]);
  const canAddService = serviceAssignees.length > 0 && Boolean(selectedTeamMemberId);

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

  const planningCardDetails = React.useCallback((person: BookingPerson) => {
    if (!person.planningIsLocked) return { duration: "" };
    return {
      duration: person.planningDuration?.trim() ?? "",
    };
  }, []);

  const renderPlanningCardSubtitle = (person: BookingPerson) => {
    const { duration } = planningCardDetails(person);
    if (!duration) return null;
    return (
      <Typography sx={{ fontWeight: 700, fontSize: 11, color: alpha(m.navy, 0.48), lineHeight: 1.2, mt: 0.2 }}>
        {duration}
      </Typography>
    );
  };

  const selectedServicesCount = React.useMemo(() => Object.values(selectedServiceIds).filter(Boolean).length, [selectedServiceIds]);
  const allServicesAssigned = React.useMemo(
    () =>
      services.length > 0 &&
      services.every((s) => Boolean(s.guestId) && Boolean(s.teamMemberId)),
    [services],
  );

  /** Services already given to the selected person (Jane / Model / Guest). */
  const assigned = React.useMemo(
    () => services.filter((s) => Boolean(s.guestId) && s.guestId === selectedPersonId),
    [selectedPersonId, services],
  );
  /** Pending rows without a person — catalog never lives here. */
  const unassigned = React.useMemo(() => services.filter((s) => !s.guestId), [services]);

  const isModelOrGuestSelected = Boolean(
    selectedPerson && !selectedPerson.isRequester && !isPlanningPerson(selectedPerson),
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
    } else if (unassigned.length === 0 && assigned.length > 0 && serviceTab === "unassigned") {
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
  const canDirectAssign = Boolean(selectedTeamMemberId) && selectedUnassignedServices.length > 0;
  const visible = serviceTab === "assigned" ? assigned : unassigned;
  const hasUnassigned = unassigned.length > 0;

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selectedServiceIds[s.id]);
  const someVisibleSelected = visible.some((s) => selectedServiceIds[s.id]) && !allVisibleSelected;

  const total = React.useMemo(() => services.reduce((sum, s) => sum + s.price, 0), [services]);

  const bookingStartMinutes = React.useMemo(() => parseTimeLabelToMinutes(selectedTime), [selectedTime]);
  const bookingDurationMinutes = React.useMemo(() => services.reduce((sum, s) => sum + s.durationMins, 0), [services]);
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
      const ids = [...new Set(items.map((s) => s.teamMemberId).filter((id): id is string => Boolean(id)))];
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
      const hasPlanning = Boolean(planningItem?.activity || planningItem?.duration);
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
    const activeBtn = el.querySelector<HTMLElement>(`[data-time-slot="${selectedTime}"]`);
    activeBtn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
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
        const addressSource = parsed?.shopId === profileSelection.shopId ? parsed : null;
        setShop({
          shopId: profileSelection.shopId,
          shopName: profileSelection.shopName ?? addressSource?.shopName ?? "Salon",
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
            shopName: session.shop.shopName,
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
    (profileSelection: NonNullable<ReturnType<typeof loadPublicProfileBookingSelection>>) => {
      if (profileSelection.teamMembers.length > 0) {
        setShopTeamMembers(profileSelection.teamMembers);
      }

      const profileServices = profileSelection.services.map((row) => ({
        id: row.id,
        catalogServiceId: row.catalogServiceId ?? extractUuidFromSyntheticId(row.id),
        name: row.name,
        durationMins: row.durationMins,
        price: row.price,
        // Desired: leave person + professional open so Model can pick services via Assign.
        guestId: profileSelection.locationMode === "desired" ? null : "p-requester",
        teamMemberId: profileSelection.locationMode === "desired" ? null : row.teamMemberId,
      }));

      setServices(profileServices);
      setServiceTab(getPreferredServiceTab(profileServices));
      setSelectedServiceIds({});

      if (profileSelection.locationMode === "desired" && profileSelection.projectEnabled) {
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
      selection: NonNullable<ReturnType<typeof loadPublicProfileBookingSelection>>,
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
      const existing = existingRaw ? enrichClientBookingRecord(existingRaw) : null;
      if (!existing?.draft?.services?.length) {
        // Session not ready yet — never fall through to blank catalog.
        return;
      }
      if (existing.shop?.shopId && existing.shop.shopId !== shop.shopId) {
        return;
      }

      const locationMode = existing.shop?.locationMode ?? shop.locationMode ?? "fixed";
      const signature = `ebrSuggest:${existing.bookingRef}:${existing.draft.people
        ?.map((p) => `${p.id}:${p.participantType ?? ""}`)
        .join(",")}:${existing.draft.services
        .map((row) => `${row.id}:${row.guestId ?? ""}:${row.teamMemberId ?? ""}`)
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

      const draftPeople =
        existing.draft.people?.length
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
        draftPeople.find((p) => draftServices.some((s) => s.guestId === p.id)) ??
        draftPeople.find((p) => p.isRequester) ??
        draftPeople[0];
      if (personWithServices?.id) setSelectedPersonId(personWithServices.id);

      if (existing.draft.teamMembers?.length) {
        setShopTeamMembers((prev) => {
          const fromDraft = existing.draft.teamMembers!.map((tm) => ({
            id: tm.id,
            name: tm.name,
            locationModes: (prev.find((p) => p.id === tm.id)?.locationModes ?? [
              locationMode,
            ]) as Array<"fixed" | "desired">,
          }));
          return fromDraft.length ? fromDraft : prev;
        });
      } else if (businessProfile) {
        const apiTeam = getTeamForLocationMode(businessProfile, locationMode).map((tm) => ({
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
      if (existing.draft.selectedTime) setSelectedTime(existing.draft.selectedTime);
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

    if (profileSelection?.shopId === shop.shopId && profileSelection.services.length > 0) {
      applyProfileIfNeeded(profileSelection);
      return;
    }

    if (fromProfile) return;

    if (!businessProfile) return;

    const defaultSignature = `default:${shop.shopId}`;
    if (hydrationSignatureRef.current === defaultSignature) return;
    hydrationSignatureRef.current = defaultSignature;

    const apiTeam = businessProfile
      ? getTeamForLocationMode(businessProfile, shop.locationMode ?? "fixed").map((tm) => ({
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
      teamMemberId: mode === "desired" ? null : apiTeam[0]?.id ?? null,
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
    if (filteredTeamMembers.some((tm) => tm.id === selectedTeamMemberId)) return;
    const fallbackId = filteredTeamMembers[0]?.id ?? "";
    setSelectedTeamMemberId(fallbackId);
    // Desired: keep every service on the single active professional.
    if (isDesiredLocation && fallbackId) {
      setServices((prev) => prev.map((s) => ({ ...s, teamMemberId: fallbackId })));
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

  const syncPlanningDraftToPerson = (personId: string, activity: string, duration: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId
          ? { ...p, planningActivity: activity.trim(), planningDuration: duration.trim() }
          : p,
      ),
    );
  };

  const selectPlanningCard = (person: BookingPerson) => {
    if (planningPersonId && planningPersonId !== person.id) {
      syncPlanningDraftToPerson(planningPersonId, planningActivity, planningDuration);
    }
    setPlanningPersonId(person.id);
    setPlanningActivity(person.planningActivity ?? "");
    setPlanningDuration(person.planningDuration ?? "");
    setSelectedPersonId(person.id);
    setServiceTab("assigned");
  };

  const selectNonPlanningPerson = (personId: string) => {
    if (planningPersonId) syncPlanningDraftToPerson(planningPersonId, planningActivity, planningDuration);
    setPlanningPersonId(null);
    setSelectedPersonId(personId);
    setSelectedServiceIds({});
    const person = people.find((p) => p.id === personId);
    const isModelOrGuest = Boolean(person && !person.isRequester && !isPlanningPerson(person));
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

    if (!isDesiredLocation && isGuest && additionalGuests.length >= FIXED_LOCATION_MAX_GUESTS) {
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
    syncPlanningDraftToPerson(planningPersonId, planningActivity, planningDuration);
    setPeople((prev) =>
      prev.map((p) => (p.id === planningPersonId ? { ...p, planningIsLocked: true } : p)),
    );
  };

  const startPlanningEdit = () => {
    if (!planningPersonId) return;
    setPeople((prev) =>
      prev.map((p) => (p.id === planningPersonId ? { ...p, planningIsLocked: false } : p)),
    );
  };

  const planningFormIsLocked = Boolean(selectedPerson?.planningIsLocked);

  const handleProjectFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProjectUploads((prev) => [
      ...prev,
      {
        id: `upload-${Date.now()}-${prev.length}`,
        name: file.name || `upload-${prev.length + 1}`,
        previewUrl,
        file,
      },
    ]);
    e.target.value = "";
  };

  const deleteProjectUpload = (uploadId: string) => {
    setProjectUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl);
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
      setSelectedPersonId(people.find((p) => p.isRequester)?.id ?? people[0]?.id ?? "");
    }
  };

  const updateGuestName = (guestId: string, name: string) => {
    setPeople((prev) => prev.map((p) => (p.id === guestId ? { ...p, name } : p)));
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
      serviceAssignees.find((p) => p.id === selectedPersonId)?.id ?? serviceAssignees[0]?.id ?? people[0]?.id ?? "";
    setAddServiceGuestId(preferredAssignee);
    setAddServiceDialogOpen(true);
  };

  const confirmAddService = () => {
    const catalog = catalogByTeamMemberId[selectedTeamMemberId] ?? [];
    const selectedIds = Object.entries(addServiceCatalogIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    if (!selectedIds.length || !addServiceGuestId || !selectedTeamMemberId) return;

    const stamped: Service[] = [];
    for (const catalogId of selectedIds) {
      const picked = catalog.find((c) => c.id === catalogId);
      if (!picked) continue;
      stamped.push({
        id: UUID_RE.test(picked.id) ? `${picked.id}-${Date.now()}-${stamped.length}` : `svc-${Date.now()}-${stamped.length}`,
        catalogServiceId: UUID_RE.test(picked.id) ? picked.id : extractUuidFromSyntheticId(picked.id),
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
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, teamMemberId } : s)));
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
    if (!shop?.shopId || services.length === 0 || !allServicesAssigned || isContinuing) return;

    if (isSelectedToday && isSameDayBookingTooSoon(selectedTime)) {
      setTimeValidationError(CLIENT_BOOKING_MIN_LEAD_ERROR);
      showSnackbar({ severity: "error", message: CLIENT_BOOKING_MIN_LEAD_ERROR });
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

    const requesterId = peopleForDraft.find((p) => p.isRequester)?.id ?? peopleForDraft[0]?.id ?? "p-requester";
    const servicesForDraft = services.map((s) => ({
      ...s,
      catalogServiceId: s.catalogServiceId ?? extractUuidFromSyntheticId(s.id),
      guestId: s.guestId ?? requesterId,
      // Desired location: every service must use the single selected professional.
      teamMemberId:
        isDesiredLocation && selectedTeamMemberId ? selectedTeamMemberId : s.teamMemberId,
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

    const prepaymentPercent = parsePrepaymentPercent(businessProfile?.prepaymentLabel);
    const requiresPrepayment = !isDesiredLocation && prepaymentPercent > 0;

    // EBR suggest-edit: update existing booking draft and return to details (no new booking).
    if (isEbrSuggest) {
      setIsContinuing(true);
      try {
        const existing = getActiveBookingSession();
        if (!existing?.bookingRef) {
          showSnackbar({ severity: "error", message: "Booking not found for suggested changes." });
          return;
        }

        const baseline = ebrSuggestBaselineRef.current ?? existing.draft?.services ?? [];
        const baselineById = new Map(baseline.map((s) => [s.id, s]));
        const editedServiceIds: string[] = [];
        for (const service of servicesForDraft) {
          const original = baselineById.get(service.id);
          if (
            !original ||
            original.name !== service.name ||
            original.price !== service.price ||
            original.durationMins !== service.durationMins ||
            (original.teamMemberId ?? null) !== (service.teamMemberId ?? null) ||
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
          prepaymentPercent: existing.prepaymentPercent ?? (requiresPrepayment ? prepaymentPercent : 0),
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
          requiresPrepayment: Boolean(existing.requiresPrepayment ?? requiresPrepayment),
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
      if (isDesiredLocation && projectUploads.length > 0) {
        const uploaded = await uploadBookingAttachments(projectUploads.map((u) => u.file)).unwrap();
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
      const checkoutPath = resolveCreateCheckoutPath({ locationMode, requiresPrepayment });
      router.push(`${checkoutPath}?tab=${listTab}`);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to create booking. Please try again."),
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
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [ebrFocus, isEbrSuggest, profileHydrated]);

  const planningFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: alpha(m.navy, 0.015),
      fontSize: 12,
      fontWeight: 700,
      "& fieldset": { borderColor: alpha(m.navy, 0.08) },
    },
    "& .MuiOutlinedInput-input": {
      color: alpha(m.navy, 0.55),
    },
  };

  const planningLockedFieldSx = {
    ...planningFieldSx,
    "& .MuiOutlinedInput-root": {
      ...planningFieldSx["& .MuiOutlinedInput-root"],
      pointerEvents: "none",
    },
  };

  const renderPlanningForm = () => (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        p: 1.5,
        borderRadius: "10px",
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5, minHeight: 32 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
          Activity
        </Typography>
        {planningFormIsLocked ? (
          <IconButton
            size="small"
            onClick={startPlanningEdit}
            aria-label="Edit planning"
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "999px",
              border: `1px solid ${alpha(m.navy, 0.12)}`,
              bgcolor: alpha(m.navy, 0.03),
              color: alpha(m.navy, 0.55),
              "&:hover": { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.72) },
            }}
          >
            <ModeEditOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Stack>
      <TextField
        value={planningActivity}
        onChange={(e) => setPlanningActivity(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "Photoshoot"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{ mb: 2, ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx) }}
      />

      <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 0.5 }}>
        Duration
      </Typography>
      <TextField
        value={planningDuration}
        onChange={(e) => setPlanningDuration(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "30 min"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{ mb: planningFormIsLocked ? 0 : 2, ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx) }}
      />

      {!planningFormIsLocked ? (
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={savePlanning}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 900,
            height: 42,
            bgcolor: m.teal,
            "&:hover": { bgcolor: m.tealDark },
          }}
        >
          Save
        </Button>
      ) : null}
    </Box>
  );

  const renderServicesDetails = () => (
    <Box sx={{ p: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
          Services Details
        </Typography>

        <Tabs
          value={serviceTab}
          onChange={(_, v: "assigned" | "unassigned") => {
            if (v === "assigned" && unassigned.length > 0) return;
            setServiceTab(v);
            setSelectedServiceIds({});
          }}
          sx={{
            minHeight: 28,
            "& .MuiTabs-indicator": { display: "none" },
            bgcolor: alpha(m.navy, 0.04),
            borderRadius: "10px",
            p: 0.35,
          }}
        >
          <Tab
            value="assigned"
            label={`Assigned(${assigned.length})`}
            disabled={unassigned.length > 0 && !isModelOrGuestSelected}
            sx={{
              minHeight: 28,
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 900,
              borderRadius: "8px",
              px: 1.25,
              color: alpha(m.navy, 0.62),
              "&.Mui-selected": { bgcolor: "#fff", color: alpha(m.navy, 0.78) },
              "&.Mui-disabled": { opacity: 0.45 },
            }}
          />
          <Tab
            value="unassigned"
            label={`Unassigned(${unassigned.length})`}
            sx={{
              minHeight: 28,
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 900,
              borderRadius: "8px",
              px: 1.25,
              color: alpha(m.navy, 0.62),
              "&.Mui-selected": { bgcolor: "#fff", color: alpha(m.navy, 0.78) },
            }}
          />
        </Tabs>
      </Stack>

      {/* Desired: one shared professional for all. Fixed assigned: per-service dropdown on each card. */}
      {filteredTeamMembers.length > 0 && (isDesiredLocation || serviceTab === "unassigned") ? (
        <Box sx={{ mb: 1.25 }} onClick={(e) => e.stopPropagation()}>
          <AppDropdown
            value={selectedTeamMemberId}
            onChange={(val) => applySharedTeamMember(String(val ?? ""))}
            options={filteredTeamMembers.map((tm) => ({
              value: tm.id,
              label: tm.name,
            }))}
            placeholder="Select team member"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <PersonOutlineRoundedIcon
                  sx={{ fontSize: 18, color: alpha(m.navy, 0.45), ml: 0.5, mr: 0.25 }}
                />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.62),
              },
            }}
          />
        </Box>
      ) : null}

      {hasUnassigned && serviceTab === "unassigned" ? (
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const next: Record<string, boolean> = {};
                  for (const s of visible) next[s.id] = checked;
                  setSelectedServiceIds(next);
                }}
                sx={{ "&.Mui-checked": { color: m.teal }, color: alpha(m.navy, 0.35) }}
              />
            }
            label={
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                Select All
              </Typography>
            }
            sx={{ mr: 0 }}
          />
        </Stack>
      ) : null}

      <Stack spacing={1}>
        {visible.map((s) => {
          const showFixedAssignedCard =
            !isDesiredLocation && serviceTab === "assigned" && Boolean(s.guestId);

          if (showFixedAssignedCard) {
            return (
              <Paper
                key={s.id}
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  px: 1.5,
                  py: 1.35,
                  bgcolor: "#fff",
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.88),
                        lineHeight: 1.2,
                      }}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.48), mt: 0.35 }}
                    >
                      {s.durationMins} Mins
                    </Typography>
                    <Box sx={{ mt: "20px", maxWidth: 220 }} onClick={(e) => e.stopPropagation()}>
                      <AppDropdown
                        value={s.teamMemberId ?? ""}
                        onChange={(val) => updateServiceTeamMember(s.id, String(val ?? ""))}
                        options={filteredTeamMembers.map((tm) => ({
                          value: tm.id,
                          label: tm.name,
                        }))}
                        placeholder="Select team member"
                        size="small"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <PersonOutlineRoundedIcon
                              sx={{ fontSize: 18, color: alpha(m.navy, 0.45), ml: 0.5, mr: 0.25 }}
                            />
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            bgcolor: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.72),
                            minHeight: 36,
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  <Stack alignItems="flex-end" spacing={0.35} sx={{ flexShrink: 0, pt: 0.1 }}>
                    <Stack direction="row" alignItems="flex-start" spacing={0.75}>
                      <Box sx={{ textAlign: "right" }}>
                        <Stack direction="row" alignItems="baseline" spacing={0.75} justifyContent="flex-end">
                          {typeof s.originalPrice === "number" ? (
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.4),
                                textDecoration: "line-through",
                              }}
                            >
                              {s.originalPrice} €
                            </Typography>
                          ) : null}
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: alpha(m.navy, 0.88),
                              lineHeight: 1.1,
                            }}
                          >
                            {s.price} €
                          </Typography>
                        </Stack>
                        {typeof s.discountPct === "number" ? (
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: m.teal, mt: 0.35 }}>
                            {s.discountPct}% Discount
                          </Typography>
                        ) : null}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setServicePendingRemove({ id: s.id, name: s.name });
                        }}
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "999px",
                          color: alpha(m.navy, 0.4),
                          "&:hover": { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.65) },
                        }}
                        aria-label={`Remove ${s.name}`}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            );
          }

          return (
            <Paper
              key={s.id}
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.10)}`,
                px: 1.25,
                py: 1.1,
                bgcolor: "#fff",
                cursor: "default",
                transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
                "&:hover": {
                  borderColor: alpha(m.teal, 0.35),
                  boxShadow: "0 6px 18px rgba(16, 35, 63, 0.06)",
                },
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                        lineHeight: 1.1,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                        lineHeight: 1.1,
                        flexShrink: 0,
                      }}
                    >
                      {s.price} €
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.45), mt: 0.25 }}>
                    {s.durationMins} Mins
                  </Typography>
                  {typeof s.originalPrice === "number" || typeof s.discountPct === "number" ? (
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.35 }}>
                      {typeof s.originalPrice === "number" ? (
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.45),
                            textDecoration: "line-through",
                          }}
                        >
                          {s.originalPrice} €
                        </Typography>
                      ) : null}
                      {typeof s.discountPct === "number" ? (
                        <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: m.teal }}>
                          {s.discountPct}% Discount
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Box>

                <Stack direction="row" alignItems="center" spacing={0.25}>
                  {serviceTab === "unassigned" ? (
                    <Checkbox
                      size="small"
                      checked={Boolean(selectedServiceIds[s.id])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => toggleServiceSelection(s.id, e.target.checked)}
                      sx={{ "&.Mui-checked": { color: m.teal }, color: alpha(m.navy, 0.35) }}
                    />
                  ) : null}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDesiredLocation) {
                        setServicePendingRemove({ id: s.id, name: s.name });
                        return;
                      }
                      setServices((prev) => prev.filter((x) => x.id !== s.id));
                    }}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.03),
                      color: alpha(m.navy, 0.45),
                    }}
                    aria-label={`Remove ${s.name}`}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {visible.length === 0 ? (
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.45), py: 1 }}>
            {serviceTab === "unassigned"
              ? "No unassigned services."
              : isModelOrGuestSelected
                ? "No services selected yet. Use Service to assignment list below."
                : "No services assigned to this person yet."}
          </Typography>
        ) : null}
      </Stack>

      {serviceTab === "unassigned" && canDirectAssign ? (
        <Box sx={{ mt: 1.25 }}>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={assignSelectedDirect}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 900,
              height: 40,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
            }}
          >
            Assign
          </Button>
        </Box>
      ) : null}

      <ButtonBase
        onClick={openAddServiceDialog}
        disabled={!canAddService}
        sx={{
          mt: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          borderRadius: "8px",
          opacity: canAddService ? 1 : 0.45,
          cursor: canAddService ? "pointer" : "not-allowed",
        }}
      >
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: "999px",
            bgcolor: m.teal,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
          Service to assignment list
        </Typography>
      </ButtonBase>
    </Box>
  );

  if (fromProfile && !profileHydrated) {
    return (
      <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB", py: { xs: 2, md: 3.5 } }}>
      <Container maxWidth="lg">
        <Dialog
          open={addServiceDialogOpen}
          onClose={() => setAddServiceDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: "14px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: alpha(m.navy, 0.82), pb: 1 }}>
            Add service to assignment list
          </DialogTitle>
          <DialogContent sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              Professional
            </Typography>
            <AppDropdown
              value={selectedTeamMemberId}
              onChange={(val) => {
                const nextId = String(val ?? "");
                // Desired: one TM for the whole booking. Fixed: only for this add action.
                if (isDesiredLocation) applySharedTeamMember(nextId);
                else setSelectedTeamMemberId(nextId);
                setAddServiceCatalogIds({});
              }}
              options={filteredTeamMembers.map((tm) => ({
                value: tm.id,
                label: tm.name,
              }))}
              placeholder="Select team member"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <PersonOutlineRoundedIcon
                    sx={{ fontSize: 18, color: alpha(m.navy, 0.45), ml: 0.5, mr: 0.25 }}
                  />
                ),
              }}
              sx={{
                mb: 1.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.015),
                  fontSize: 12,
                  fontWeight: 700,
                },
              }}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              Services
            </Typography>
            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              {(catalogByTeamMemberId[selectedTeamMemberId] ?? []).map((item) => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(addServiceCatalogIds[item.id])}
                      onChange={(e) =>
                        setAddServiceCatalogIds((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      sx={{ "&.Mui-checked": { color: m.teal }, color: alpha(m.navy, 0.35) }}
                    />
                  }
                  label={
                    <Stack direction="row" justifyContent="space-between" sx={{ width: "100%", pr: 1 }}>
                      <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                          {item.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
                          {item.durationMins} Mins
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                        {item.price} €
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    m: 0,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: alpha(m.navy, 0.015),
                    alignItems: "flex-start",
                    width: "100%",
                    "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
                  }}
                />
              ))}
            </Stack>

            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              Assign to
            </Typography>
            <AppDropdown
              value={addServiceGuestId}
              onChange={(val) => setAddServiceGuestId(String(val))}
              options={serviceAssignees.map((p) => ({
                value: p.id,
                label: p.isRequester
                  ? `${p.name} (Requester)`
                  : `${p.name} (${getParticipantLabel(p)})`,
              }))}
              placeholder="Select person"
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: alpha(m.navy, 0.015),
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
            <Button
              onClick={() => setAddServiceDialogOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                borderColor: alpha(m.navy, 0.12),
                color: alpha(m.navy, 0.72),
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddService}
              variant="contained"
              disableElevation
              disabled={
                !Object.values(addServiceCatalogIds).some(Boolean) || !addServiceGuestId || !selectedTeamMemberId
              }
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              Add service
            </Button>
          </DialogActions>
        </Dialog>

        <MessagingModalShell
          open={Boolean(servicePendingRemove)}
          title="Remove service"
          onClose={() => setServicePendingRemove(null)}
          footer={
            <>
              <MessagingModalCancelButton onClick={() => setServicePendingRemove(null)} />
              <MessagingModalPrimaryButton label="Confirm" onClick={confirmRemoveService} />
            </>
          }
        >
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.85) }}>
              Do you want to remove this service
              {servicePendingRemove?.name ? ` (${servicePendingRemove.name})` : ""}?
            </Typography>
          </Box>
        </MessagingModalShell>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
            <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.86), fontSize: 14 }}>
              Booking Details
            </Typography>
          </Box>
          <Divider />

          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Grid container spacing={2} alignItems="stretch">
              {/* LEFT */}
              <Grid item xs={12} md={8.2}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  {/* Month + day strip */}
                  <Box id="booking-calendar-section" sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 1.25 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setSelectedDate((d) => {
                            const next = addMonths(d, -1);
                            return isPastDay(next) ? today0 : next;
                          })
                        }
                        disabled={
                          (() => {
                            const prevMonth = addMonths(selectedDate, -1);
                            return isPastDay(prevMonth);
                          })()
                        }
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.45)}`,
                          color: m.teal,
                          ...(isPastDay(addMonths(selectedDate, -1))
                            ? { opacity: 0.45, borderColor: alpha(m.navy, 0.10), color: alpha(m.navy, 0.35) }
                            : null),
                        }}
                      >
                        <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <ButtonBase
                        onClick={(e) => setMonthPickerAnchor(e.currentTarget)}
                        sx={{
                          borderRadius: "10px",
                          px: 1.1,
                          py: 0.45,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.6,
                          "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), fontSize: 13 }}>
                          {monthLabel}
                        </Typography>
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }} />
                      </ButtonBase>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedDate((d) => addMonths(d, 1))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.45)}`,
                          color: m.teal,
                        }}
                      >
                        <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>

                    {/* Month/Year picker */}
                    <Box
                      component="div"
                      sx={{
                        position: "relative",
                      }}
                    />
                    {monthPickerAnchor ? (
                      <Box
                        component="div"
                        sx={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 1300,
                        }}
                        onClick={() => setMonthPickerAnchor(null)}
                      >
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            position: "absolute",
                            left: monthPickerAnchor.getBoundingClientRect().left,
                            top: monthPickerAnchor.getBoundingClientRect().bottom + 6,
                            width: 260,
                            borderRadius: "12px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            bgcolor: "#fff",
                            boxShadow: "0 18px 44px rgba(16,35,63,0.18)",
                            p: 1.25,
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const y = monthPickerYear - 1;
                                const m0 = monthPickerMonth;
                                const probe = new Date(selectedDate);
                                probe.setFullYear(y, m0, 1);
                                if (isPastDay(probe)) {
                                  setSelectedDate(today0);
                                  setMonthPickerAnchor(null);
                                  return;
                                }
                                setMonthYear(y, m0);
                              }}
                              disabled={(() => {
                                const probe = new Date(selectedDate);
                                probe.setFullYear(monthPickerYear - 1, monthPickerMonth, 1);
                                return isPastDay(probe);
                              })()}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.10)}`,
                              }}
                            >
                              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.8) }}>
                              {monthPickerYear}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => setMonthYear(monthPickerYear + 1, monthPickerMonth)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.10)}`,
                              }}
                            >
                              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>

                          <Grid container spacing={1}>
                            {Array.from({ length: 12 }, (_, i) => {
                              const label = new Date(monthPickerYear, i, 1).toLocaleDateString("en-US", { month: "short" });
                              const active = i === monthPickerMonth;
                              const probe = new Date(selectedDate);
                              probe.setFullYear(monthPickerYear, i, 1);
                              const disabled = isPastDay(probe);
                              return (
                                <Grid item xs={4} key={i}>
                                  <Button
                                    fullWidth
                                    variant={active ? "contained" : "outlined"}
                                    disableElevation
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      setMonthYear(monthPickerYear, i);
                                      setMonthPickerAnchor(null);
                                    }}
                                    sx={{
                                      borderRadius: "10px",
                                      textTransform: "none",
                                      fontWeight: 900,
                                      fontSize: 11.5,
                                      height: 34,
                                      ...(active
                                        ? { bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }
                                        : { borderColor: alpha(m.navy, 0.10), color: alpha(m.navy, 0.68) }),
                                      ...(disabled ? { opacity: 0.45 } : null),
                                    }}
                                  >
                                    {label}
                                  </Button>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      </Box>
                    ) : null}

                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setSelectedDate((d) => {
                            const next = addDays(d, -7);
                            return isPastDay(next) ? today0 : next;
                          })
                        }
                        disabled={isPastDay(addDays(selectedDate, -7))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.35)}`,
                          color: m.teal,
                          flexShrink: 0,
                          ...(isPastDay(addDays(selectedDate, -7))
                            ? { opacity: 0.45, borderColor: alpha(m.navy, 0.10), color: alpha(m.navy, 0.35) }
                            : null),
                        }}
                      >
                        <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Stack
                        direction="row"
                        spacing={0.9}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {weekDays.map((d) => {
                          const active = toISO(selectedDate) === d.key;
                          const disabled = isPastDay(d.date);
                          return (
                            <ButtonBase
                              key={d.key}
                              onClick={() => {
                                if (disabled) return;
                                setSelectedDate(d.date);
                              }}
                              disabled={disabled}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                borderRadius: "8px",
                                border: `1px solid ${active ? alpha(m.teal, 0.6) : alpha(m.navy, 0.10)}`,
                                bgcolor: active ? m.teal : "#fff",
                                py: 0.9,
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.35,
                                ...(disabled
                                  ? {
                                      opacity: 0.45,
                                      borderColor: alpha(m.navy, 0.08),
                                      bgcolor: alpha(m.navy, 0.015),
                                      cursor: "not-allowed",
                                    }
                                  : null),
                              }}
                            >
                              <Typography sx={{ fontSize: 10, fontWeight: 800, color: active ? "#fff" : alpha(m.navy, 0.55) }}>
                                {d.dow}
                              </Typography>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 900, color: active ? "#fff" : alpha(m.navy, 0.76) }}>
                                {d.day}
                              </Typography>
                            </ButtonBase>
                          );
                        })}
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedDate((d) => addDays(d, 7))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.35)}`,
                          color: m.teal,
                          flexShrink: 0,
                        }}
                      >
                        <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Select time */}
                  <Box sx={{ p: 1.5 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: "10px",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        bgcolor: alpha(m.navy, 0.015),
                        px: 1.25,
                        py: 1.1,
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                        Select Time
                      </Typography>
                      <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.08), mt: 1, mb: 1.25 }} />

                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <IconButton
                          size="small"
                          onClick={() => scrollTimeSlots("left")}
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            color: alpha(m.navy, 0.55),
                            bgcolor: "#fff",
                          }}
                        >
                          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        <Box
                          ref={timeScrollRef}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            flex: 1,
                            minWidth: 0,
                            overflowX: "auto",
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                            py: 0.25,
                          }}
                        >
                          {times.map((t) => {
                            const active = t === selectedTime;
                            const unavailable = isTimeUnavailable(t);
                            return (
                              <Button
                                key={t}
                                data-time-slot={t}
                                variant={active ? "contained" : "outlined"}
                                onClick={() => {
                                  if (unavailable) {
                                    setTimeValidationError(CLIENT_BOOKING_MIN_LEAD_ERROR);
                                    return;
                                  }
                                  setTimeValidationError(null);
                                  setSelectedTime(t);
                                }}
                                disabled={unavailable}
                                disableElevation
                                sx={{
                                  flexShrink: 0,
                                  minWidth: 76,
                                  px: 1.25,
                                  borderRadius: "8px",
                                  textTransform: "none",
                                  height: 32,
                                  fontSize: 11.5,
                                  fontWeight: 900,
                                  whiteSpace: "nowrap",
                                  ...(unavailable
                                    ? {
                                        borderColor: alpha(m.navy, 0.08),
                                        bgcolor: alpha(m.navy, 0.03),
                                        color: alpha(m.navy, 0.32),
                                        "&.Mui-disabled": {
                                          borderColor: alpha(m.navy, 0.08),
                                          bgcolor: alpha(m.navy, 0.03),
                                          color: alpha(m.navy, 0.32),
                                        },
                                      }
                                    : active
                                      ? { bgcolor: m.teal, color: "#fff", "&:hover": { bgcolor: m.tealDark } }
                                      : {
                                          borderColor: alpha(m.navy, 0.10),
                                          bgcolor: "#fff",
                                          color: alpha(m.navy, 0.65),
                                        }),
                                }}
                              >
                                {t}
                              </Button>
                            );
                          })}
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => scrollTimeSlots("right")}
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            color: alpha(m.navy, 0.55),
                            bgcolor: "#fff",
                          }}
                        >
                          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>

                      {(timeValidationError || selectedTimeTooSoon) && (
                        <Typography
                          sx={{
                            mt: 0.9,
                            px: 0.25,
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: "#C62828",
                            lineHeight: 1.35,
                          }}
                        >
                          {timeValidationError || CLIENT_BOOKING_MIN_LEAD_ERROR}
                        </Typography>
                      )}

                      <Stack alignItems="flex-end" sx={{ mt: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={combineServices}
                              onChange={(e) => setCombineServices(e.target.checked)}
                              size="small"
                              sx={{ color: alpha(m.navy, 0.35), "&.Mui-checked": { color: m.teal } }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                              Combine Services
                            </Typography>
                          }
                          sx={{ mr: 0 }}
                        />

                        {isDesiredLocation ? (
                          <Box id="booking-project-section" sx={{ width: "100%", mt: 1.25, textAlign: "left" }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78), mb: 1.25 }}>
                              Project Details
                            </Typography>
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 0.5 }}>
                                  Description
                                </Typography>
                                <TextField
                                  value={projectDescription}
                                  onChange={(e) => setProjectDescription(e.target.value)}
                                  placeholder="Project description"
                                  multiline
                                  minRows={3}
                                  fullWidth
                                  sx={{
                                    mb: 1.5,
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: "10px",
                                      bgcolor: "#fff",
                                      fontSize: 12,
                                    },
                                  }}
                                />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                                  Upload Section
                                </Typography>
                                <Box
                                  component="button"
                                  type="button"
                                  onClick={() => projectFileInputRef.current?.click()}
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
                                    cursor: "pointer",
                                    mb: 1.25,
                                    "&:hover": { bgcolor: alpha(m.teal, 0.04), borderColor: alpha(m.teal, 0.35) },
                                  }}
                                >
                                  <FileUploadOutlinedIcon sx={{ fontSize: 28, color: alpha(m.navy, 0.35) }} />
                                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
                                    Upload Image &amp; Documents
                                  </Typography>
                                </Box>
                                <input
                                  ref={projectFileInputRef}
                                  type="file"
                                  accept="image/*,.pdf"
                                  hidden
                                  onChange={handleProjectFilePick}
                                />
                                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                                  {projectUploads.map((img) => (
                                    <Box key={img.id} sx={{ flex: "0 0 88px", minWidth: 88, position: "relative" }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => deleteProjectUpload(img.id)}
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
                                          "&:hover": { bgcolor: alpha(m.navy, 0.72) },
                                        }}
                                      >
                                        <CloseRoundedIcon sx={{ fontSize: 12 }} />
                                      </IconButton>
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
                                        {img.file.type.startsWith("image/") ? (
                                          <Box
                                            component="img"
                                            src={img.previewUrl}
                                            alt={img.name}
                                            sx={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                              display: "block",
                                            }}
                                          />
                                        ) : (
                                          <Typography sx={{ fontSize: 10, fontWeight: 800, color: alpha(m.navy, 0.45) }}>
                                            PDF
                                          </Typography>
                                        )}
                                      </Box>
                                      <Typography
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
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                          </Box>
                        ) : null}
                      </Stack>
                    </Paper>

                    {!isDesiredLocation && canAddFixedLocationGuest ? (
                      <Stack alignItems="flex-end" sx={{ mt: 1 }}>
                        <Chip
                          icon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                          label="Guest"
                          variant="outlined"
                          clickable
                          onClick={() => addParticipant("Guest")}
                          sx={{
                            height: 28,
                            borderRadius: "10px",
                            fontSize: 11.5,
                            fontWeight: 900,
                            borderColor: alpha(m.navy, 0.12),
                            color: alpha(m.navy, 0.62),
                            "& .MuiChip-icon": { color: m.teal, ml: 0.8 },
                            "&:hover": { bgcolor: alpha(m.teal, 0.06), borderColor: alpha(m.teal, 0.35) },
                          }}
                        />
                      </Stack>
                    ) : null}
                  </Box>

                  <Divider />

                  {/* People */}
                  <Box id="booking-services-section" sx={{ p: 1.5 }}>
                    {isDesiredLocation ? (
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1 }}>
                        <Button
                          variant="outlined"
                          endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />}
                          startIcon={
                            <Box
                              component="span"
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "999px",
                                bgcolor: m.addSoftBg,
                                color: m.addSoftFg,
                                border: `1px solid ${m.addSoftBorder}`,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                lineHeight: 0,
                              }}
                            >
                              <AddRoundedIcon sx={{ fontSize: 14, display: "block" }} />
                            </Box>
                          }
                          onClick={(e) => setParticipantMenuAnchor(e.currentTarget)}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 11.5,
                            lineHeight: 1,
                            height: 32,
                            minHeight: 32,
                            py: 0,
                            px: 1.25,
                            borderColor: alpha(m.navy, 0.12),
                            color: alpha(m.navy, 0.62),
                            bgcolor: "#fff",
                            "& .MuiButton-startIcon, & .MuiButton-endIcon": {
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 0,
                              marginBottom: 0,
                            },
                            "& .MuiButton-startIcon": { mr: 0.75, ml: 0 },
                            "& .MuiButton-endIcon": { ml: 0.35, mr: 0 },
                            "& .MuiButton-startIcon > *:nth-of-type(1)": { fontSize: "inherit" },
                          }}
                        >
                          Add
                        </Button>
                        <Menu
                          anchorEl={participantMenuAnchor}
                          open={Boolean(participantMenuAnchor)}
                          onClose={() => setParticipantMenuAnchor(null)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          transformOrigin={{ vertical: "top", horizontal: "right" }}
                          PaperProps={{ sx: { borderRadius: "10px", minWidth: 140, mt: 0.5 } }}
                        >
                          <MenuItem
                            onClick={() => addParticipant("Guest")}
                            sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}
                          >
                            Guest
                          </MenuItem>
                          <MenuItem
                            onClick={() => addParticipant("Model")}
                            sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}
                          >
                            Model
                          </MenuItem>
                          <MenuItem
                            onClick={() => addParticipant("Planning")}
                            sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}
                          >
                            Planning
                          </MenuItem>
                        </Menu>
                      </Stack>
                    ) : null}

                    <Stack direction="row" spacing={1} alignItems="center">
                      {people.map((p) => {
                        const active = p.id === selectedPersonId;
                        return (
                          <Paper
                            key={p.id}
                            elevation={0}
                            draggable
                            onDragStart={(e) => {
                              setDraggingPersonId(p.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", p.id);
                            }}
                            onDragEnd={() => setDraggingPersonId(null)}
                            onDragOver={(e) => {
                              // Allow dropping.
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = e.dataTransfer.getData("text/plain") || draggingPersonId;
                              if (!from) return;
                              reorderPeople(from, p.id);
                              setDraggingPersonId(null);
                            }}
                            sx={{
                              flex: 1,
                              borderRadius: "10px",
                              border: `1px solid ${active ? alpha(m.teal, 0.7) : alpha(m.navy, 0.10)}`,
                              bgcolor: "#fff",
                              px: 1,
                              pt: 1.05,
                              pb: 0.75,
                              cursor: "pointer",
                              boxShadow: active ? `0 0 0 4px ${alpha(m.teal, 0.08)}` : "none",
                              position: "relative",
                              minHeight: 72,
                              overflow: "visible",
                              ...(draggingPersonId === p.id
                                ? { opacity: 0.7 }
                                : draggingPersonId
                                  ? { outline: `2px dashed ${alpha(m.teal, 0.45)}`, outlineOffset: "2px" }
                                  : null),
                            }}
                            onClick={() => {
                              if (isPlanningPerson(p)) {
                                selectPlanningCard(p);
                              } else {
                                selectNonPlanningPerson(p.id);
                              }
                            }}
                          >
                            {!p.isRequester ? (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGuest(p.id);
                                }}
                                sx={{
                                  position: "absolute",
                                  right: 4,
                                  bottom: 4,
                                  zIndex: 2,
                                  width: 22,
                                  height: 22,
                                  borderRadius: "999px",
                                  bgcolor: alpha(m.navy, 0.04),
                                  color: alpha(m.navy, 0.5),
                                  "&:hover": {
                                    bgcolor: alpha(m.navy, 0.08),
                                    color: alpha(m.navy, 0.72),
                                  },
                                }}
                                aria-label={`Remove ${p.name}`}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            ) : null}

                            <Stack spacing={0.55} sx={{ pb: p.isRequester ? 0 : 2.25, alignItems: "center" }}>
                              {p.isRequester ? (
                                <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.82) }}>
                                  {p.name}
                                </Typography>
                              ) : (
                                <Box
                                  sx={{ display: "flex", justifyContent: "center", width: "100%" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <TextField
                                    value={p.name}
                                    onChange={(e) => updateGuestName(p.id, e.target.value)}
                                    size="small"
                                    inputProps={{
                                      "aria-label": `${getParticipantLabel(p)} name`,
                                      sx: {
                                        py: 0.35,
                                        px: 0.5,
                                        fontSize: 11,
                                        fontWeight: 900,
                                        textAlign: "center",
                                      },
                                    }}
                                    sx={{
                                      width: "100%",
                                      maxWidth: 96,
                                      "& .MuiOutlinedInput-root": {
                                        height: 22,
                                        borderRadius: "8px",
                                        bgcolor: "#fff",
                                        fontSize: 11,
                                        fontWeight: 900,
                                      },
                                    }}
                                  />
                                </Box>
                              )}

                              {isPlanningPerson(p) ? (
                                renderPlanningCardSubtitle(p)
                              ) : (
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: alpha(m.navy, 0.48),
                                    mt: 0.2,
                                    textAlign: "center",
                                  }}
                                >
                                  {personCardSubtitle(p)}
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>

                    <Box
                      sx={{
                        mt: 1.25,
                        borderRadius: "10px",
                        bgcolor: alpha(m.teal, 0.08),
                        border: `1px solid ${alpha(m.teal, 0.18)}`,
                        px: 1.25,
                        py: 0.65,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.6), lineHeight: 1.2 }}>
                        Assign Services By Selecting The Person
                      </Typography>
                    </Box>

                  </Box>

                  {isDesiredLocation && isPlanningCardSelected ? (
                    renderPlanningForm()
                  ) : (
                    <>
                      <Divider />
                      {renderServicesDetails()}
                    </>
                  )}
                </Paper>
              </Grid>

              {/* RIGHT */}
              <Grid item xs={12} md={3.8}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 1.8, pt: 1.2, pb: 1.05 }}>
                    <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.72), fontSize: 13, textAlign: "center" }}>
                      Service Summary
                    </Typography>

                    <Box sx={{ mt: 0.8 }}>
                      <Chip
                        label={shop?.locationMode === "desired" ? "Desired Location" : "Fixed Location"}
                        size="small"
                        sx={{
                          height: 18,
                          borderRadius: "2px",
                          bgcolor: alpha(m.teal, 0.10),
                          color: m.teal,
                          fontSize: 9.5,
                          fontWeight: 900,
                          "& .MuiChip-label": { px: 0.8 },
                        }}
                      />
                    </Box>

                    <Typography sx={{ mt: 0.65, fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15, lineHeight: 1.2 }}>
                      {shop?.shopName ?? "Beyond Beauty Salon"}
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 0.65, gap: 1.25, minWidth: 0 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.55} sx={{ minWidth: 0, flex: 1 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 15, color: m.teal, flexShrink: 0 }} />
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: alpha(m.teal, 0.95),
                            fontSize: 10.25,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          ({fmtMinutesToTimeLabel(bookingStartMinutes)} – {fmtMinutesToTimeLabel(bookingEndMinutes)})
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.45}
                        sx={{ minWidth: 0, maxWidth: "46%", justifyContent: "flex-end", flexShrink: 0 }}
                      >
                        <LocationOnOutlinedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.45), flexShrink: 0 }} />
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: alpha(m.navy, 0.55),
                            fontSize: 10.25,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: "right",
                          }}
                        >
                          {shop?.addressLabel ?? shop?.municipalityLabel ?? ""}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Divider />

                  <Box sx={{ p: 1.6 }}>
                    <Stack spacing={1.25}>
                      {summarySections.map(({ key, title, items, planningItem, teamMemberLabel }) => {
                        const uniqueTeamMemberLabels = [
                          ...new Set(
                            items
                              .map((s) => teamMemberFirstName(s.teamMemberId))
                              .filter((name): name is string => Boolean(name)),
                          ),
                        ];
                        // Prefer section chips for every assigned professional (fixed may have several).
                        const sectionTeamLabels =
                          uniqueTeamMemberLabels.length > 0
                            ? uniqueTeamMemberLabels
                            : teamMemberLabel
                              ? [teamMemberLabel]
                              : [];

                        return (
                          <Box key={key}>
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.78), mb: 0.75 }}>
                              {title}
                            </Typography>
                            {sectionTeamLabels.length > 0 ? (
                              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.65} sx={{ mb: 0.75 }}>
                                {sectionTeamLabels.map((label) => (
                                  <Box
                                    key={label}
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 0.65,
                                      borderRadius: "999px",
                                      border: `1px solid ${alpha(m.navy, 0.12)}`,
                                      bgcolor: "#fff",
                                      px: 1,
                                      py: 0.45,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "999px",
                                        border: `1px solid ${alpha(m.navy, 0.14)}`,
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <PersonOutlineRoundedIcon sx={{ fontSize: 14, color: alpha(m.navy, 0.45) }} />
                                    </Box>
                                    <Typography
                                      sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62), lineHeight: 1 }}
                                    >
                                      {label}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            ) : null}
                            <Stack spacing={0.75}>
                              {planningItem ? (
                                <Box
                                  sx={{
                                    borderRadius: "10px",
                                    border: `1px solid ${alpha(m.navy, 0.06)}`,
                                    px: 1.2,
                                    py: 0.9,
                                    bgcolor: alpha(m.navy, 0.02),
                                  }}
                                >
                                  <Box sx={{ minWidth: 0 }}>
                                    {planningItem.activity ? (
                                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                                        {planningItem.activity}
                                      </Typography>
                                    ) : null}
                                    {planningItem.duration ? (
                                      <Typography
                                        sx={{
                                          mt: planningItem.activity ? 0.25 : 0,
                                          fontSize: 10.5,
                                          fontWeight: 700,
                                          color: alpha(m.navy, 0.48),
                                        }}
                                      >
                                        {planningItem.duration}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                </Box>
                              ) : null}
                              {items.map((s) => (
                                <Box
                                  key={s.id}
                                  sx={{
                                    borderRadius: "10px",
                                    border: `1px solid ${alpha(m.navy, 0.06)}`,
                                    px: 1.2,
                                    py: 0.9,
                                    bgcolor: alpha(m.navy, 0.02),
                                  }}
                                >
                                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                                        {s.name}
                                      </Typography>
                                      <ServiceSummaryMetaLine
                                        timeRange={serviceTimeRangeLabel(bookingStartMinutes, s.durationMins)}
                                        durationLabel={`${s.durationMins} Mins`}
                                      />
                                    </Box>
                                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.76) }}>
                                      {s.price} €
                                    </Typography>
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                            <Divider sx={{ mt: 1.1 }} />
                          </Box>
                        );
                      })}

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                          Total
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                          {total} €
                        </Typography>
                      </Stack>

                      {!allServicesAssigned && services.length > 0 ? (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#C67A00",
                            lineHeight: 1.35,
                          }}
                        >
                          {unassigned.length > 0
                            ? `${unassigned.length} service${unassigned.length === 1 ? "" : "s"} still need a person and team member.`
                            : "Every service needs a team member before you can continue."}
                        </Typography>
                      ) : null}

                      {allServicesAssigned && selectedTimeTooSoon ? (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#C62828",
                            lineHeight: 1.35,
                          }}
                        >
                          {CLIENT_BOOKING_MIN_LEAD_ERROR}
                        </Typography>
                      ) : null}

                      <Button
                        fullWidth
                        variant="contained"
                        disableElevation
                        disabled={!allServicesAssigned || isContinuing || selectedTimeTooSoon}
                        onClick={() => void onContinue()}
                        sx={{
                          mt: 1.25,
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 900,
                          height: 40,
                          bgcolor: m.teal,
                          "&:hover": { bgcolor: m.tealDark },
                          ...(allServicesAssigned && !isContinuing && !selectedTimeTooSoon
                            ? null
                            : {
                                bgcolor: alpha(m.navy, 0.10),
                                color: alpha(m.navy, 0.45),
                                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                              }),
                        }}
                      >
                        {isContinuing ? (
                          <>
                            <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                            {continueLabel}
                          </>
                        ) : (
                          continueLabel
                        )}
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default function ClientBookingPage() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode") ?? "";
  const showCreate = mode === "create";
  const tabParam = searchParams?.get("tab");
  const legacyView = searchParams?.get("view");
  const activeTab = parseBookingListTab(tabParam ?? (legacyView === "history" ? "ongoing" : undefined));

  if (showCreate) {
    return (
      <ClientBookingPageShell activeTab="upcoming">
        <ClientBookingCreateView />
      </ClientBookingPageShell>
    );
  }

  return (
    <ClientBookingPageShell activeTab={activeTab}>
      <ClientBookingListView listTab={activeTab} />
    </ClientBookingPageShell>
  );
}
