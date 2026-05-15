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
  Radio,
  RadioGroup,
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
import { AppDropdown, ClientTopTabs, MarketingSiteFooter, MollureMarketingHeader } from "../../../components/common";
import { ServiceSummaryMetaLine } from "../../../components/common/ServiceSummaryMetaLine";
import { fmtMinutesToTimeLabel, parseTimeLabelToMinutes, serviceTimeRangeLabel } from "./booking-time";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { profilePageData } from "../profile/data-profile";
import { useAppSelector } from "../../../store/hooks";

function ClientBookingHistoryView() {
  const pathname = usePathname();
  const theme = useTheme();
  const m = theme.palette.mollure;
  const user = useAppSelector((s) => s.auth.user);

  const clientTopTabs = React.useMemo(
    () =>
      [
        { label: "Booking", href: "/clients/booking" },
        { label: "Favorites", href: "/clients/favourites" },
        { label: "Profile", href: "/clients/profile" },
      ] as const,
    [],
  );

  const [confirmedBookings, setConfirmedBookings] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:client_bookings");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setConfirmedBookings(Array.isArray(parsed) ? parsed : []);
    } catch {
      setConfirmedBookings([]);
    }
  }, []);

  const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: profilePageData.pageBg }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={user?.email ?? ""}
        userAvatarSrc={undefined}
        homeHref="/clients/listing"
      />

      <Box sx={{ mt: 2, bgcolor: "transparent" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5 }}>
          <ClientTopTabs
            tabs={clientTopTabs}
            activeLabel={pathname?.includes("/clients/booking") ? "Booking" : pathname?.includes("/clients/favourites") ? "Favorites" : "Profile"}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 5 }}>
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
          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.86), fontSize: 14 }}>Your Bookings</Typography>
            <Button
              component={Link}
              href="/clients/listing"
              variant="contained"
              disableElevation
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 900, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
            >
              New Booking
            </Button>
          </Box>
          <Divider />
          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            {confirmedBookings.length === 0 ? (
              <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                No bookings yet.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {confirmedBookings.map((b) => {
                  const shopName = b?.shop?.shopName ?? "Salon";
                  const address = b?.shop?.addressLabel ?? b?.shop?.municipalityLabel ?? fallbackAddress;
                  const date = b?.draft?.selectedDateISO ?? "";
                  const time = b?.draft?.selectedTime ?? "";
                  const total = b?.draft?.total ?? 0;
                  return (
                    <Paper
                      key={b?.id ?? `${shopName}-${date}-${time}`}
                      elevation={0}
                      sx={{
                        borderRadius: "12px",
                        border: `1px solid ${alpha(m.navy, 0.10)}`,
                        p: 1.6,
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.25}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}>{shopName}</Typography>
                          <Typography sx={{ mt: 0.25, fontWeight: 800, color: alpha(m.navy, 0.55), fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {address}
                          </Typography>
                          <Typography sx={{ mt: 0.35, fontWeight: 900, color: alpha(m.teal, 0.95), fontSize: 12 }}>
                            {date} {time ? `• ${time}` : ""}
                          </Typography>
                        </Box>
                        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
                          <Chip
                            label="Confirmed"
                            size="small"
                            sx={{ height: 22, fontWeight: 900, bgcolor: alpha(m.teal, 0.12), color: m.teal }}
                          />
                          <Typography sx={{ fontWeight: 1000, color: alpha(m.navy, 0.85) }}>{total} €</Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>
      </Container>

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}

function ClientBookingCreateView() {
  const router = useRouter();
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [shop, setShop] = React.useState<{
    shopId: string;
    shopName: string;
    municipalityLabel?: string;
    addressLabel?: string;
    locationMode?: "fixed" | "desired";
  } | null>(null);

  const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

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

  const times = React.useMemo(() => ["10:20 AM", "11:15 AM", "1:15 PM", "2:15 PM", "2:45 PM"], []);

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
    { id: "p-requester", name: "Elly", isRequester: true },
  ]);
  const [draggingPersonId, setDraggingPersonId] = React.useState<string | null>(null);

  type ShopTeamMember = { id: string; name: string; locationModes: Array<"fixed" | "desired"> };
  const shopTeamMembers = React.useMemo<ShopTeamMember[]>(
    () => [
      { id: "tm-elly", name: "Elly Elsavy", locationModes: ["fixed", "desired"] },
      { id: "tm-james", name: "James Cole", locationModes: ["fixed"] },
      { id: "tm-nina", name: "Nina Park", locationModes: ["desired"] },
      { id: "tm-omar", name: "Omar Haddad", locationModes: ["fixed", "desired"] },
    ],
    [],
  );

  type CatalogService = {
    id: string;
    name: string;
    durationMins: number;
    price: number;
    originalPrice?: number;
    discountPct?: number;
  };

  const catalogByTeamMemberId = React.useMemo<Record<string, CatalogService[]>>(
    () => ({
      "tm-elly": [
        { id: "cat-buzz", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50 },
        { id: "cat-nose", name: "Nose Wax", durationMins: 15, price: 5 },
        { id: "cat-dry", name: "Hair Dry", durationMins: 30, price: 15 },
      ],
      "tm-james": [
        { id: "cat-beard", name: "Beard Trim", durationMins: 20, price: 12 },
        { id: "cat-buzz", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50 },
      ],
      "tm-nina": [
        { id: "cat-color", name: "Root Color", durationMins: 60, price: 45 },
        { id: "cat-dry", name: "Hair Dry", durationMins: 30, price: 15 },
      ],
      "tm-omar": [
        { id: "cat-buzz", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50 },
        { id: "cat-nose", name: "Nose Wax", durationMins: 15, price: 5 },
      ],
    }),
    [],
  );

  type Service = {
    id: string;
    name: string;
    durationMins: number;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    guestId: string | null;
    teamMemberId: string | null;
  };

  const [services, setServices] = React.useState<Service[]>([
    {
      id: "svc-1",
      name: "Buzz Cut",
      durationMins: 45,
      price: 25,
      originalPrice: 50,
      discountPct: 50,
      guestId: "p-requester",
      teamMemberId: "tm-elly",
    },
    {
      id: "svc-2",
      name: "Buzz Cut",
      durationMins: 45,
      price: 25,
      originalPrice: 50,
      discountPct: 50,
      guestId: null,
      teamMemberId: "tm-elly",
    },
    { id: "svc-4", name: "Nose Wax", durationMins: 15, price: 5, guestId: "p-requester", teamMemberId: "tm-elly" },
  ]);

  const [selectedTime, setSelectedTime] = React.useState(times[1]!);
  const [combineServices, setCombineServices] = React.useState(true);
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>("p-requester");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = React.useState<string>("tm-elly");
  const [serviceTab, setServiceTab] = React.useState<"assigned" | "unassigned">("unassigned");
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Record<string, boolean>>({});

  const [addServiceDialogOpen, setAddServiceDialogOpen] = React.useState(false);
  const [addServiceCatalogId, setAddServiceCatalogId] = React.useState("");
  const [addServiceGuestId, setAddServiceGuestId] = React.useState("");

  const [projectDescription, setProjectDescription] = React.useState("");
  const [projectUploads, setProjectUploads] = React.useState<Array<{ id: string; name: string; previewUrl: string }>>(
    [],
  );
  const [participantMenuAnchor, setParticipantMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [planningPersonId, setPlanningPersonId] = React.useState<string | null>(null);
  const [planningActivity, setPlanningActivity] = React.useState("");
  const [planningDuration, setPlanningDuration] = React.useState("");
  const projectFileInputRef = React.useRef<HTMLInputElement>(null);

  const locationMode = shop?.locationMode ?? "fixed";
  const isDesiredLocation = locationMode === "desired";
  const participantLabel = isDesiredLocation ? "Model" : "Guest";

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

  const guests = React.useMemo(() => people.filter((p) => !p.isRequester), [people]);
  const hasGuests = guests.length > 0;

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
    if (!person.planningIsLocked) return { activity: "", duration: "" };
    return {
      activity: person.planningActivity?.trim() ?? "",
      duration: person.planningDuration?.trim() ?? "",
    };
  }, []);

  const renderPlanningCardSubtitle = (person: BookingPerson) => {
    const { activity, duration } = planningCardDetails(person);
    if (!activity && !duration) return null;
    return (
      <Stack spacing={0.15} sx={{ mt: 0.2 }}>
        {activity ? (
          <Typography sx={{ fontWeight: 700, fontSize: 11, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
            {activity}
          </Typography>
        ) : null}
        {duration ? (
          <Typography sx={{ fontWeight: 700, fontSize: 11, color: alpha(m.navy, 0.48), lineHeight: 1.2 }}>
            {duration}
          </Typography>
        ) : null}
      </Stack>
    );
  };

  const selectedServicesCount = React.useMemo(() => Object.values(selectedServiceIds).filter(Boolean).length, [selectedServiceIds]);
  const allServicesAssigned = React.useMemo(() => services.length > 0 && services.every((s) => Boolean(s.guestId)), [services]);

  const assigned = services.filter((s) => s.guestId);
  const unassigned = services.filter((s) => !s.guestId);

  const selectedUnassignedServices = React.useMemo(
    () => unassigned.filter((s) => selectedServiceIds[s.id]),
    [unassigned, selectedServiceIds],
  );
  const canDirectAssign =
    selectedUnassignedServices.length > 0 && selectedUnassignedServices.every((s) => Boolean(s.teamMemberId));
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
      if (ids.length !== 1) return undefined;
      const fullName = teamMemberNameById.get(ids[0]);
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
    try {
      const raw = window.localStorage.getItem("mollure:selected_shop");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        shopId: string;
        shopName: string;
        municipalityLabel?: string;
        addressLabel?: string;
        locationMode?: "fixed" | "desired";
      };
      if (parsed?.shopId && parsed?.shopName) setShop(parsed);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (!people.some((p) => p.id === selectedPersonId)) {
      setSelectedPersonId(people[0]?.id ?? "");
    }
  }, [people, selectedPersonId]);

  React.useEffect(() => {
    if (!filteredTeamMembers.some((tm) => tm.id === selectedTeamMemberId)) {
      setSelectedTeamMemberId(filteredTeamMembers[0]?.id ?? "");
    }
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
  };

  const addParticipant = (cardName: string) => {
    const id = `p-guest-${Date.now()}`;
    const isPlanning = cardName === "Planning";
    const nextPerson: BookingPerson = {
      id,
      name: cardName,
      isRequester: false,
      participantType: isPlanning ? "planning" : isDesiredLocation ? "model" : "guest",
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
    const nextIndex = projectUploads.length + 1;
    setProjectUploads((prev) => [
      ...prev,
      {
        id: `upload-${Date.now()}`,
        name: `Img.jpg ${String(nextIndex).padStart(3, "0")}`,
        previewUrl,
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
    setServices((prev) => prev.map((s) => (s.guestId === guestId ? { ...s, guestId: null } : s)));
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
    if (!canDirectAssign) return;
    const ids = new Set(selectedUnassignedServices.map((s) => s.id));
    setServices((prev) => prev.map((s) => (ids.has(s.id) ? { ...s, guestId: selectedPersonId } : s)));
    setSelectedServiceIds({});
    setServiceTab("assigned");
  };

  const openAddServiceDialog = () => {
    const catalog = catalogByTeamMemberId[selectedTeamMemberId] ?? [];
    setAddServiceCatalogId(catalog[0]?.id ?? "");
    setAddServiceGuestId(guests[0]?.id ?? people[0]?.id ?? "");
    setAddServiceDialogOpen(true);
  };

  const confirmAddService = () => {
    const catalog = catalogByTeamMemberId[selectedTeamMemberId] ?? [];
    const picked = catalog.find((c) => c.id === addServiceCatalogId);
    if (!picked || !addServiceGuestId) return;
    const newService: Service = {
      id: `svc-${Date.now()}`,
      name: picked.name,
      durationMins: picked.durationMins,
      price: picked.price,
      originalPrice: picked.originalPrice,
      discountPct: picked.discountPct,
      guestId: addServiceGuestId,
      teamMemberId: selectedTeamMemberId,
    };
    setServices((prev) => [...prev, newService]);
    setAddServiceDialogOpen(false);
  };

  const updateServiceTeamMember = (serviceId: string, teamMemberId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, teamMemberId: teamMemberId || null } : s)),
    );
  };

  const toggleServiceSelection = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((prev) => ({ ...prev, [serviceId]: checked }));
    if (!checked) updateServiceTeamMember(serviceId, "");
  };

  const onContinue = () => {
    try {
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

      const payload = {
        selectedDateISO: toISO(selectedDate),
        selectedTime,
        combineServices,
        people: peopleForDraft,
        services,
        teamMembers: shopTeamMembers.map(({ id, name }) => ({ id, name })),
        total,
        ...(isDesiredLocation
          ? {
              projectDetails: {
                description: projectDescription,
                uploads: projectUploads.map((u) => ({ id: u.id, name: u.name })),
              },
            }
          : {}),
      };
      window.localStorage.setItem("mollure:booking_draft", JSON.stringify(payload));
    } catch {
      // ignore
    }
    router.push("/clients/booking/checkout");
  };

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
          onChange={(_, v) => {
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
        {visible.map((s) => (
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
                <Box sx={{ mt: 0.85 }} onClick={(e) => e.stopPropagation()}>
                  <AppDropdown
                    value={s.teamMemberId ?? ""}
                    onChange={(val) => updateServiceTeamMember(s.id, String(val))}
                    options={filteredTeamMembers.map((tm) => ({
                      value: tm.id,
                      label: tm.name,
                    }))}
                    placeholder="Select team member"
                    size="small"
                    fullWidth
                    disabled={serviceTab === "unassigned" && !selectedServiceIds[s.id]}
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
                        bgcolor: alpha(m.navy, 0.015),
                        fontSize: 11.5,
                        fontWeight: 800,
                      },
                    }}
                  />
                </Box>
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
        ))}
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
        disabled={!hasGuests}
        sx={{
          mt: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          borderRadius: "8px",
          opacity: hasGuests ? 1 : 0.45,
          cursor: hasGuests ? "pointer" : "not-allowed",
        }}
      >
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: "999px",
            bgcolor: m.teal,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          +
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
          Service to assignment list
        </Typography>
      </ButtonBase>
    </Box>
  );

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
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 1.25 }}>
              {`Professional: ${teamMemberNameById.get(selectedTeamMemberId) ?? "—"}`}
            </Typography>

            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              Services
            </Typography>
            <RadioGroup
              value={addServiceCatalogId}
              onChange={(e) => setAddServiceCatalogId(e.target.value)}
              sx={{ gap: 0.5, mb: 1.5 }}
            >
              {(catalogByTeamMemberId[selectedTeamMemberId] ?? []).map((item) => (
                <FormControlLabel
                  key={item.id}
                  value={item.id}
                  control={<Radio size="small" sx={{ "&.Mui-checked": { color: m.teal } }} />}
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
                  }}
                />
              ))}
            </RadioGroup>

            <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              {isDesiredLocation ? "Assign to model" : "Assign to guest"}
            </Typography>
            <AppDropdown
              value={addServiceGuestId}
              onChange={(val) => setAddServiceGuestId(String(val))}
              options={people.map((p) => ({
                value: p.id,
                label: p.isRequester ? `${p.name} (Requester)` : p.name,
              }))}
              placeholder={isDesiredLocation ? "Select model" : "Select guest"}
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
              disabled={!addServiceCatalogId || !addServiceGuestId}
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
                  <Box sx={{ p: 1.5 }}>
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

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        {times.map((t) => {
                          const active = t === selectedTime;
                          return (
                            <Button
                              key={t}
                              variant={active ? "contained" : "outlined"}
                              onClick={() => setSelectedTime(t)}
                              disableElevation
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                borderRadius: "8px",
                                textTransform: "none",
                                height: 32,
                                fontSize: 11.5,
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                ...(active
                                  ? { bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }
                                  : { borderColor: alpha(m.navy, 0.10), bgcolor: "#fff", color: alpha(m.navy, 0.65) }),
                              }}
                            >
                              {t}
                            </Button>
                          );
                        })}
                        <IconButton
                          size="small"
                          sx={{
                            width: 32,
                            height: 32,
                            flex: "0 0 32px",
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.10)}`,
                            color: alpha(m.navy, 0.55),
                            bgcolor: "#fff",
                          }}
                        >
                          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

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
                          <Box sx={{ width: "100%", mt: 1.25, textAlign: "left" }}>
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
                                        component="img"
                                        src={img.previewUrl}
                                        alt={img.name}
                                        sx={{
                                          width: 88,
                                          height: 62,
                                          borderRadius: "8px",
                                          objectFit: "cover",
                                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                                          display: "block",
                                        }}
                                      />
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
                        ) : (
                          <Chip
                            icon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                            label="Guest"
                            variant="outlined"
                            clickable
                            onClick={() => addParticipant("Guest")}
                            sx={{
                              mt: 0.75,
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
                        )}
                      </Stack>
                    </Paper>
                  </Box>

                  <Divider />

                  {/* People */}
                  <Box sx={{ p: 1.5 }}>
                    {isDesiredLocation ? (
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1 }}>
                        <Button
                          variant="outlined"
                          endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />}
                          startIcon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "999px",
                                bgcolor: m.teal,
                                color: "#fff",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 14,
                                fontWeight: 900,
                                lineHeight: 1,
                                mr: -0.25,
                              }}
                            >
                              +
                            </Box>
                          }
                          onClick={(e) => setParticipantMenuAnchor(e.currentTarget)}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 11.5,
                            height: 32,
                            borderColor: alpha(m.navy, 0.12),
                            color: alpha(m.navy, 0.62),
                            bgcolor: "#fff",
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
                              px: 1.25,
                              py: 1.05,
                              cursor: "pointer",
                              boxShadow: active ? `0 0 0 4px ${alpha(m.teal, 0.08)}` : "none",
                              position: "relative",
                              minHeight: 66,
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
                                  right: 8,
                                  top: 8,
                                  width: 26,
                                  height: 26,
                                  borderRadius: "999px",
                                  bgcolor: alpha(m.navy, 0.03),
                                  color: alpha(m.navy, 0.45),
                                }}
                                aria-label={`Remove ${p.name}`}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            ) : null}

                            <Stack spacing={0.55}>
                              {p.isRequester ? (
                                <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.82) }}>
                                  {p.name}
                                </Typography>
                              ) : (
                                <Box sx={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                                  <TextField
                                    value={p.name}
                                    onChange={(e) => updateGuestName(p.id, e.target.value)}
                                    size="small"
                                    inputProps={{
                                      "aria-label": `${participantLabel} name`,
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
                                      maxWidth: 120,
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
                                <Typography sx={{ fontWeight: 700, fontSize: 11, color: alpha(m.navy, 0.48), mt: 0.2 }}>
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
                  ) : isDesiredLocation ? (
                    <>
                      <Divider />
                      {renderServicesDetails()}
                    </>
                  ) : null}
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
                          {shop?.addressLabel ?? shop?.municipalityLabel ?? fallbackAddress}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Divider />

                  <Box sx={{ p: 1.6 }}>
                    <Stack spacing={1.25}>
                      {summarySections.map(({ key, title, items, planningItem, teamMemberLabel }) => {
                        return (
                          <Box key={key}>
                            {teamMemberLabel ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.65,
                                  borderRadius: "999px",
                                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                                  bgcolor: "#fff",
                                  px: 1,
                                  py: 0.45,
                                  mb: 0.65,
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
                                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62), lineHeight: 1 }}>
                                  {teamMemberLabel}
                                </Typography>
                              </Box>
                            ) : null}
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.78), mb: 0.75 }}>
                              {title}
                            </Typography>
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

                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                          Total
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                          {total} €
                        </Typography>
                      </Stack>

                      <Button
                        fullWidth
                        variant="contained"
                        disableElevation
                        disabled={!allServicesAssigned}
                        onClick={onContinue}
                        sx={{
                          mt: 1.25,
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 900,
                          height: 40,
                          bgcolor: m.teal,
                          "&:hover": { bgcolor: m.tealDark },
                          ...(allServicesAssigned
                            ? null
                            : {
                                bgcolor: alpha(m.navy, 0.10),
                                color: alpha(m.navy, 0.45),
                                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                              }),
                        }}
                      >
                        Continue
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
  const view = searchParams?.get("view") ?? "";
  const mode = searchParams?.get("mode") ?? "";
  const showHistory = view === "history" || mode !== "create";
  if (showHistory) return <ClientBookingHistoryView />;
  return <ClientBookingCreateView />;
}
