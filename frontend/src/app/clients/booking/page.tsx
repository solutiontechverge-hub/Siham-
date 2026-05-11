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
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { ClientTopTabs, MarketingSiteFooter, MollureMarketingHeader } from "../../../components/common";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { profilePageData } from "../profile/data-profile";
import { useAppSelector } from "../../../store/hooks";

export default function ClientBookingPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const m = theme.palette.mollure;

  const clientTopTabs = React.useMemo(
    () =>
      [
        { label: "Booking", href: "/clients/booking" },
        { label: "Favorites", href: "/clients/favourites" },
        { label: "Profile", href: "/clients/profile" },
      ] as const,
    [],
  );

  const view = searchParams?.get("view") ?? "";
  const mode = searchParams?.get("mode") ?? "";
  const showHistory = view === "history" || mode !== "create";
  const user = useAppSelector((s) => s.auth.user);

  const [shop, setShop] = React.useState<{
    shopId: string;
    shopName: string;
    municipalityLabel?: string;
    addressLabel?: string;
    locationMode?: "fixed" | "desired";
  } | null>(null);

  const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

  const [confirmedBookings, setConfirmedBookings] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!showHistory) return;
    try {
      const raw = window.localStorage.getItem("mollure:client_bookings");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setConfirmedBookings(Array.isArray(parsed) ? parsed : []);
    } catch {
      setConfirmedBookings([]);
    }
  }, [showHistory]);

  if (showHistory) {
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

  const [people, setPeople] = React.useState(() => [
    { id: "p-elly", name: "Elly", pill: "Elly", tag: "5 Services" },
    { id: "p-sara", name: "Sara", pill: "Sara", tag: "2 Services" },
    { id: "p-mary", name: "Mary", pill: "Mary", tag: "1 Service" },
  ]);
  const [draggingPersonId, setDraggingPersonId] = React.useState<string | null>(null);

  type TeamMember = { id: string; name: string };
  const teamMembersByProfessionalId = React.useMemo<Record<string, TeamMember[]>>(
    () => ({
      "p-elly": [
        { id: "p-elly", name: "Elly" },
        { id: "tm-elly-1", name: "Elly • Member 1" },
        { id: "tm-elly-2", name: "Elly • Member 2" },
      ],
      "p-sara": [
        { id: "p-sara", name: "Sara" },
        { id: "tm-sara-1", name: "Sara • Member 1" },
        { id: "tm-sara-2", name: "Sara • Member 2" },
      ],
      "p-mary": [
        { id: "p-mary", name: "Mary" },
        { id: "tm-mary-1", name: "Mary • Member 1" },
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
    assignedTo: string | null;
  };
  const [services, setServices] = React.useState<Service[]>([
    { id: "svc-1", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50, assignedTo: "p-elly" },
    { id: "svc-2", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50, assignedTo: null },
    { id: "svc-3", name: "Buzz Cut", durationMins: 45, price: 25, originalPrice: 50, discountPct: 50, assignedTo: "p-sara" },
    { id: "svc-4", name: "Nose Wax", durationMins: 45, price: 5, assignedTo: "p-elly" },
    { id: "svc-5", name: "Hair Dry", durationMins: 45, price: 15, assignedTo: "p-mary" },
  ]);

  const [selectedTime, setSelectedTime] = React.useState(times[1]!);
  const [combineServices, setCombineServices] = React.useState(true);
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>(people[0]!.id);
  const [serviceTab, setServiceTab] = React.useState<"assigned" | "unassigned">("assigned");
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Record<string, boolean>>({});
  const [expandedServiceId, setExpandedServiceId] = React.useState<string | null>(null);
  // Assignee picker intentionally hidden for now (requested).

  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignToMemberId, setAssignToMemberId] = React.useState<string>("");
  const [assignMemberSearch, setAssignMemberSearch] = React.useState("");

  const selectedServicesCount = React.useMemo(() => Object.values(selectedServiceIds).filter(Boolean).length, [selectedServiceIds]);
  const allServicesAssigned = React.useMemo(() => services.length > 0 && services.every((s) => Boolean(s.assignedTo)), [services]);

  const assigned = services.filter((s) => s.assignedTo);
  const unassigned = services.filter((s) => !s.assignedTo);
  const visible = serviceTab === "assigned" ? assigned : unassigned;
  const hasUnassigned = unassigned.length > 0;

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selectedServiceIds[s.id]);
  const someVisibleSelected = visible.some((s) => selectedServiceIds[s.id]) && !allVisibleSelected;

  const total = React.useMemo(() => services.reduce((sum, s) => sum + s.price, 0), [services]);

  const parseTimeLabelToMinutes = (label: string) => {
    // e.g. "11:15 AM"
    const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return 0;
    let hh = Number(m[1]);
    const mm = Number(m[2]);
    const ampm = m[3].toUpperCase();
    if (ampm === "AM") {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
    return hh * 60 + mm;
  };
  const fmtMinutesToTimeLabel = (mins: number) => {
    const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh24 = Math.floor(m / 60);
    const mm = m % 60;
    const ampm = hh24 >= 12 ? "PM" : "AM";
    const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
    return `${hh12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  const bookingStartMinutes = React.useMemo(() => parseTimeLabelToMinutes(selectedTime), [selectedTime]);
  const bookingDurationMinutes = React.useMemo(() => services.reduce((sum, s) => sum + s.durationMins, 0), [services]);
  const bookingEndMinutes = bookingStartMinutes + bookingDurationMinutes;

  const summaryGroups = React.useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const key = s.assignedTo ?? "guest";
      const prev = map.get(key) ?? [];
      prev.push(s);
      map.set(key, prev);
    }
    return map;
  }, [services]);

  const assigneeNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    for (const members of Object.values(teamMembersByProfessionalId)) {
      for (const tm of members) map.set(tm.id, tm.name);
    }
    return map;
  }, [people, teamMembersByProfessionalId]);

  const summarySections = React.useMemo(() => {
    const sections: Array<{ key: string; title: string; items: Service[] }> = [];

    const guestItems = summaryGroups.get("guest") ?? [];

    // Order by professionals (people), but include their team members too.
    for (const p of people) {
      const members = teamMembersByProfessionalId[p.id] ?? [{ id: p.id, name: p.name }];
      for (const tm of members) {
        const items = summaryGroups.get(tm.id);
        if (!items?.length) continue;
        sections.push({ key: tm.id, title: tm.name, items });
      }
    }

    if (guestItems.length) {
      sections.push({ key: "guest", title: "Guest", items: guestItems });
    }

    return sections;
  }, [people, summaryGroups, teamMembersByProfessionalId]);

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
    // Keep selection valid if list order changes or items are removed (mock).
    if (!people.some((p) => p.id === selectedPersonId)) {
      setSelectedPersonId(people[0]?.id ?? "");
    }
  }, [people, selectedPersonId]);

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

  const openAssignDialog = () => {
    const members = teamMembersByProfessionalId[selectedPersonId] ?? [];
    const defaultMemberId = members[0]?.id ?? selectedPersonId;
    setAssignToMemberId(defaultMemberId);
    setAssignMemberSearch("");
    setAssignDialogOpen(true);
  };

  const confirmAssignSelected = () => {
    const ids = new Set(Object.entries(selectedServiceIds).filter(([, v]) => v).map(([k]) => k));
    if (!ids.size) {
      setAssignDialogOpen(false);
      return;
    }
    const assigneeId = assignToMemberId || selectedPersonId;
    setServices((prev) => prev.map((s) => (ids.has(s.id) ? { ...s, assignedTo: assigneeId } : s)));
    setSelectedServiceIds({});
    setAssignDialogOpen(false);
  };

  const closeAssigneeMenu = () => {};

  const onContinue = () => {
    try {
      const payload = {
        selectedDateISO: toISO(selectedDate),
        selectedTime,
        combineServices,
        services,
        total,
      };
      window.localStorage.setItem("mollure:booking_draft", JSON.stringify(payload));
    } catch {
      // ignore
    }
    router.push("/clients/booking/checkout");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB", py: { xs: 2, md: 3.5 } }}>
      <Container maxWidth="lg">
        <Dialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: "14px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: alpha(m.navy, 0.82), pb: 1 }}>
            Assign to team member
          </DialogTitle>
          <DialogContent sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 1.25 }}>
              {`Professional: ${people.find((p) => p.id === selectedPersonId)?.name ?? "—"}`}
            </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 1.25 }}>
            {`Selected services: ${selectedServicesCount}`}
          </Typography>

          <TextField
            value={assignMemberSearch}
            onChange={(e) => setAssignMemberSearch(e.target.value)}
            placeholder="Search team member..."
            size="small"
            fullWidth
            sx={{
              mb: 1.25,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: alpha(m.navy, 0.015),
              },
            }}
          />

            <RadioGroup
              value={assignToMemberId}
              onChange={(e) => setAssignToMemberId(e.target.value)}
              sx={{ gap: 0.5 }}
            >
            {(teamMembersByProfessionalId[selectedPersonId] ?? [{ id: selectedPersonId, name: assigneeNameById.get(selectedPersonId) ?? "Member" }])
              .filter((tm) => tm.name.toLowerCase().includes(assignMemberSearch.trim().toLowerCase()))
              .map((tm) => (
                  <FormControlLabel
                    key={tm.id}
                    value={tm.id}
                    control={<Radio size="small" sx={{ "&.Mui-checked": { color: m.teal } }} />}
                    label={
                      <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>{tm.name}</Typography>
                    }
                    sx={{
                      m: 0,
                      px: 0.75,
                      py: 0.4,
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                      bgcolor: alpha(m.navy, 0.015),
                    }}
                  />
                ))}
            </RadioGroup>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
            <Button
              onClick={() => setAssignDialogOpen(false)}
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
              onClick={confirmAssignSelected}
              variant="contained"
              disableElevation
              disabled={selectedServicesCount === 0}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              {selectedServicesCount ? `Assign (${selectedServicesCount})` : "Assign"}
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
                        <Chip
                          icon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                          label="Guest"
                          variant="outlined"
                          sx={{
                            mt: 0.75,
                            height: 28,
                            borderRadius: "10px",
                            fontSize: 11.5,
                            fontWeight: 900,
                            borderColor: alpha(m.navy, 0.12),
                            color: alpha(m.navy, 0.62),
                            "& .MuiChip-icon": { color: m.teal, ml: 0.8 },
                          }}
                        />
                      </Stack>
                    </Paper>
                  </Box>

                  <Divider />

                  {/* People */}
                  <Box sx={{ p: 1.5 }}>
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
                            onClick={() => setSelectedPersonId(p.id)}
                          >
                            {!active ? (
                              <IconButton
                                size="small"
                                onClick={(e) => e.stopPropagation()}
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
                              {active ? (
                                <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.82) }}>
                                  {p.name}
                                </Typography>
                              ) : (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                  <Box
                                    sx={{
                                      px: 1.25,
                                      height: 22,
                                      borderRadius: "8px",
                                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                                      bgcolor: "#fff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 11,
                                      fontWeight: 900,
                                      color: alpha(m.navy, 0.7),
                                      minWidth: 64,
                                    }}
                                  >
                                    {p.pill}
                                  </Box>
                                </Box>
                              )}

                              <Typography sx={{ fontWeight: 700, fontSize: 11, color: alpha(m.navy, 0.48), mt: 0.2 }}>
                                {p.tag}
                              </Typography>
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

                  <Divider />

                  {/* Services */}
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

                    {hasUnassigned ? (
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
                              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.1 }}>
                                {s.name}
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.45), mt: 0.25 }}>
                                {s.durationMins} Mins
                              </Typography>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mt: 0.25 }}>
                          {s.assignedTo ? `Assigned to: ${assigneeNameById.get(s.assignedTo) ?? "Team member"}` : "Unassigned"}
                        </Typography>
                            </Box>

                            <Box sx={{ textAlign: "right", minWidth: 70 }}>
                              {typeof s.originalPrice === "number" ? (
                                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.45), textDecoration: "line-through" }}>
                                  {s.originalPrice} €
                                </Typography>
                              ) : null}
                              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                                {s.price} €
                              </Typography>
                              {typeof s.discountPct === "number" ? (
                                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: m.teal }}>
                                  {s.discountPct}% Discount
                                </Typography>
                              ) : null}
                            </Box>

                            <Stack direction="row" alignItems="center" spacing={0.25}>
                              <IconButton
                                size="small"
                                onClick={() => setExpandedServiceId((p) => (p === s.id ? null : s.id))}
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "999px",
                                  bgcolor: alpha(m.navy, 0.03),
                                  color: alpha(m.navy, 0.45),
                                }}
                                aria-label={expandedServiceId === s.id ? "Collapse service" : "Expand service"}
                              >
                                <ExpandMoreRoundedIcon
                                  sx={{
                                    fontSize: 18,
                                    transform: expandedServiceId === s.id ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 150ms ease",
                                  }}
                                />
                              </IconButton>
                              <Checkbox
                                size="small"
                                checked={Boolean(selectedServiceIds[s.id])}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setSelectedServiceIds((p) => ({ ...p, [s.id]: e.target.checked }))}
                                sx={{ "&.Mui-checked": { color: m.teal }, color: alpha(m.navy, 0.35) }}
                              />
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

                          {expandedServiceId === s.id ? (
                            <Box sx={{ mt: 1.1, display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                                {s.assignedTo ? `Assigned to: ${assigneeNameById.get(s.assignedTo) ?? "Team member"}` : "Unassigned"}
                              </Typography>
                            </Box>

                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedServiceId(null);
                                }}
                                sx={{ color: alpha(m.navy, 0.35) }}
                                aria-label="Collapse"
                              >
                                <CloseRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          ) : null}
                        </Paper>
                      ))}
                    </Stack>

                    {hasUnassigned ? (
                      <>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{ mt: 1.25, color: alpha(m.navy, 0.45) }}
                        >
                          <AddRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
                            Service to assignment list
                          </Typography>
                        </Stack>

                        <Box sx={{ mt: 1.25 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            disableElevation
                            onClick={openAssignDialog}
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
                      </>
                    ) : null}
                  </Box>
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
                      {summarySections.map(({ key, title, items }) => {
                        return (
                          <Box key={key}>
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.78), mb: 0.75 }}>
                              {title}
                            </Typography>
                            <Stack spacing={0.75}>
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
                                      <Typography sx={{ mt: 0.25, fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
                                        {fmtMinutesToTimeLabel(bookingStartMinutes)}–{fmtMinutesToTimeLabel(bookingStartMinutes + s.durationMins)} •{" "}
                                        {s.durationMins} Mins
                                      </Typography>
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
