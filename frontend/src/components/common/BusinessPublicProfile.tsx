"use client";

import * as React from "react";
import Image from "next/image";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { alpha, useTheme } from "@mui/material/styles";
import "swiper/css";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  ClickAwayListener,
  Divider,
  Grid,
  IconButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { BusinessPublicProfileData } from "../../data/businessPublicProfile.data";
import {
  buildDesiredProvinceDisplays,
  getServicesForLocationMode,
  getTeamForLocationMode,
} from "../../data/businessPublicProfile.data";
import ServiceCategorySliderCard from "./ServiceCategorySliderCard";
import AppDropdown from "./AppDropdown";

function toImageSrc(img: unknown) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null) {
    const o = img as { src?: string; default?: unknown };
    if (typeof o.src === "string") return o.src;
    if (o.default) return toImageSrc(o.default);
  }
  return String(img);
}

function SectionCard({
  title,
  children,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.82) }}>{title}</Typography>
        {headerAction ?? null}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function ProjectReadOnlyField({ value }: { value: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.5,
        py: 1.25,
        minHeight: 88,
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: alpha(m.navy, 0.42), lineHeight: 1.55 }}>
        {value}
      </Typography>
    </Box>
  );
}

function MutedInstructionBox({ children }: { children: React.ReactNode }) {
  const m = useTheme().palette.mollure;
  return (
    <Box sx={{ mt: 1, px: 1.5, py: 1.15, borderRadius: "8px", bgcolor: m.fxGrayF2F4F7 }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: alpha(m.navy, 0.42), lineHeight: 1.55 }}>
        {children}
      </Typography>
    </Box>
  );
}

function PolicyFieldRow({ label, value }: { label: string; value: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ py: 0.25 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.78), whiteSpace: "nowrap" }}>{value}</Typography>
    </Stack>
  );
}

const SERVICE_FOR_ICONS = {
  men: MaleRoundedIcon,
  women: FemaleRoundedIcon,
  kids: ChildCareRoundedIcon,
} as const;

function ProfileHeroSwiper({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const m = useTheme().palette.mollure;

  if (images.length === 0) {
    return (
      <Box
        sx={{
          minHeight: { xs: 220, md: 280 },
          bgcolor: alpha(m.navy, 0.06),
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 220, md: 280 },
        height: "100%",
        overflow: "hidden",
        "& .profile-hero-swiper": {
          height: "100%",
          width: "100%",
          touchAction: "pan-x",
          overflow: "hidden",
        },
        "& .swiper-wrapper": {
          flexDirection: "row",
        },
        "& .swiper-slide": {
          height: { xs: 220, md: 280 },
          flexShrink: 0,
        },
      }}
    >
      <Swiper
        className="profile-hero-swiper"
        direction="horizontal"
        slidesPerView={1}
        spaceBetween={0}
        loop={images.length > 1}
        speed={450}
        grabCursor
        touchAngle={30}
        threshold={8}
        resistanceRatio={0.85}
        allowTouchMove
        onSwiper={(swiper: SwiperInstance) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper: SwiperInstance) => setActiveIndex(swiper.realIndex)}
      >
        {images.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`}>
            <Box sx={{ position: "relative", width: "100%", height: { xs: 220, md: 280 } }}>
              <Image src={src} alt={alt} fill style={{ objectFit: "cover" }} priority={index === 0} draggable={false} />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 ? (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 12,
            zIndex: 2,
            display: "flex",
            justifyContent: "center",
            gap: 0.75,
            pointerEvents: "none",
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              component="button"
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => swiperRef.current?.slideToLoop(index)}
              sx={{
                pointerEvents: "auto",
                width: 8,
                height: 8,
                p: 0,
                border: 0,
                borderRadius: "999px",
                cursor: "pointer",
                bgcolor: index === activeIndex ? "#fff" : "rgba(255,255,255,0.55)",
                transition: "background-color 150ms ease",
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

export type BusinessPublicProfileProps = {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  onLocationModeChange?: (mode: "fixed" | "desired") => void;
  onBookNow: () => void;
  pageTitle?: string;
  publicProfileTitle?: string;
};

function DesiredProvinceChip({ label }: { label: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        minHeight: 36,
        minWidth: { xs: "100%", sm: 200 },
        px: 1.25,
        py: 0.5,
        borderRadius: "10px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: alpha(m.navy, 0.78) }} noWrap>
        {label}
      </Typography>
      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.35), flexShrink: 0 }} />
    </Box>
  );
}

function ProfileLocationSection({
  data,
  showFixed,
  showDesired,
}: {
  data: BusinessPublicProfileData;
  showFixed: boolean;
  showDesired: boolean;
}) {
  const m = useTheme().palette.mollure;
  const provinceDisplays = React.useMemo(
    () => buildDesiredProvinceDisplays(data.desiredLocation),
    [data.desiredLocation],
  );

  return (
    <Stack spacing={2}>
      {showFixed ? (
        <Box>
          {showDesired ? (
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 0.75 }}>
              Fixed Location
            </Typography>
          ) : null}
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.62), lineHeight: 1.55 }}>
            {data.fixedLocation.formattedAddress}
          </Typography>
        </Box>
      ) : null}

      {showFixed && showDesired ? <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} /> : null}

      {showDesired ? (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 1 }}>
            Specific Provinces
          </Typography>
          {data.desiredLocation.areaMode === "All Netherlands" ? (
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Services available across the Netherlands.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {provinceDisplays.map((item) => (
                <DesiredProvinceChip key={item.id} label={item.label} />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </Stack>
  );
}

function PublicProfileTopBar({ title }: { title: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Box
        sx={{
          mx: { xs: 1.5, md: 2 },
          my: { xs: 1.5, md: 1.75 },
          px: { xs: 1.75, md: 2 },
          py: { xs: 1.25, md: 1.5 },
          borderRadius: "8px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: m.fxGrayF2F4F7,
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, md: 16 }, color: alpha(m.navy, 0.88) }}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

function ProfileLocationToggle({
  locationMode,
  supportsFixed,
  supportsDesired,
  onChange,
}: {
  locationMode: "fixed" | "desired";
  supportsFixed: boolean;
  supportsDesired: boolean;
  onChange?: (mode: "fixed" | "desired") => void;
}) {
  const m = useTheme().palette.mollure;
  const canSwitch = supportsFixed && supportsDesired;
  const fixedActive = locationMode === "fixed";
  const desiredActive = locationMode === "desired";

  const segmentSx = (active: boolean, offered: boolean) => ({
    flex: 1,
    minWidth: { xs: 100, sm: 118 },
    py: 1,
    px: { xs: 1.25, sm: 1.75 },
    textTransform: "none" as const,
    fontWeight: 700,
    fontSize: { xs: 13, sm: 14 },
    lineHeight: 1.2,
    borderRadius: 0,
    color: active ? "#fff" : m.slate,
    bgcolor: active ? m.teal : "transparent",
    "&:hover": {
      bgcolor: !canSwitch || !offered ? (active ? m.teal : "transparent") : active ? m.tealDark : alpha(m.teal, 0.08),
    },
    "&.Mui-disabled": {
      color: active ? "#fff" : alpha(m.navy, 0.32),
      bgcolor: active ? m.teal : "transparent",
    },
  });

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "stretch",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: "#fff",
        flexShrink: 0,
      }}
      role="group"
      aria-label="Location type"
    >
      <Button
        disabled={!canSwitch || !supportsFixed}
        onClick={() => {
          if (canSwitch) onChange?.("fixed");
        }}
        sx={segmentSx(fixedActive, supportsFixed)}
      >
        Fixed Location
      </Button>
      <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(m.navy, 0.12) }} />
      <Button
        disabled={!canSwitch || !supportsDesired}
        onClick={() => {
          if (canSwitch) onChange?.("desired");
        }}
        sx={segmentSx(desiredActive, supportsDesired)}
      >
        Desired Location
      </Button>
    </Box>
  );
}

export default function BusinessPublicProfile({
  data,
  locationMode,
  onLocationModeChange,
  onBookNow,
  pageTitle = "Profile",
  publicProfileTitle = "Public Profile",
}: BusinessPublicProfileProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const heroSlides = React.useMemo(() => {
    if (data.heroImages.length > 0) {
      return data.heroImages.map((img) => toImageSrc(img)).filter(Boolean);
    }
    const fallback = toImageSrc(data.heroImage);
    return fallback ? [fallback] : [];
  }, [data.heroImage, data.heroImages]);

  const effectiveLocationMode = React.useMemo<"fixed" | "desired">(() => {
    if (!data.supportsFixedLocation) return "desired";
    if (!data.supportsDesiredLocation) return "fixed";
    return locationMode;
  }, [data.supportsDesiredLocation, data.supportsFixedLocation, locationMode]);

  const isDesiredLocation = effectiveLocationMode === "desired";
  // Professional setup: project + km apply when offering is Desired or Both (not Fixed-only).
  const showDesiredOfferingContent =
    data.supportsDesiredLocation && (!data.supportsFixedLocation || isDesiredLocation);
  const showKilometerAllowance = data.supportsDesiredLocation;
  const showProjectHeader = data.supportsDesiredLocation;

  const [projectEnabled, setProjectEnabled] = React.useState(data.projectEnabled);
  const showProjectSection = showDesiredOfferingContent && projectEnabled;

  const [activeCategory, setActiveCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const scheduleAnchorRef = React.useRef<HTMLButtonElement>(null);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(data.defaultScheduleOptionId);
  const [serviceQty, setServiceQty] = React.useState<Record<string, number>>({});
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Record<string, boolean>>({});
  const [selectedComboIds, setSelectedComboIds] = React.useState<Record<string, boolean>>({});
  const [teamAssignments, setTeamAssignments] = React.useState<Record<string, readonly string[]>>({});
  const [teamDraftAssignments, setTeamDraftAssignments] = React.useState<Record<string, readonly string[]>>({});
  const [teamAssignLocked, setTeamAssignLocked] = React.useState<Record<string, boolean>>({});

  const activeServices = React.useMemo(
    () => getServicesForLocationMode(data, effectiveLocationMode),
    [data, effectiveLocationMode],
  );

  const visibleTeamMembers = React.useMemo(
    () => getTeamForLocationMode(data, effectiveLocationMode),
    [data, effectiveLocationMode],
  );

  React.useEffect(() => {
    setProjectEnabled(data.projectEnabled);
  }, [data.projectEnabled, data.shopId]);

  React.useEffect(() => {
    setActiveCategory("all");
    setSearch("");
    setSelectedServiceIds({});
    setSelectedComboIds({});
    setServiceQty({});
    setTeamAssignments({});
    setTeamDraftAssignments({});
    setTeamAssignLocked({});
  }, [locationMode]);

  React.useEffect(() => {
    if (!projectEnabled) {
      setSelectedComboIds({});
    }
  }, [projectEnabled]);

  React.useEffect(() => {
    setSelectedScheduleId(data.defaultScheduleOptionId);
    setScheduleOpen(false);
  }, [data.defaultScheduleOptionId, data.shopId]);

  const selectedScheduleLabel =
    data.scheduleOptions.find((opt) => opt.id === selectedScheduleId)?.label ??
    data.scheduleOptions[0]?.label ??
    "Today(8:00 - 18:00)";

  const scheduleLabel = isDesiredLocation ? "Desired Schedule" : "Fixed Schedule";

  const filteredServices = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeServices.filter((s) => {
      if (activeCategory !== "all" && s.categoryId !== activeCategory) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q);
    });
  }, [activeCategory, activeServices, search]);

  const selectedServices = React.useMemo(
    () => activeServices.filter((s) => selectedServiceIds[s.id]),
    [activeServices, selectedServiceIds],
  );

  const selectedCombos = React.useMemo(
    () => data.bookCombos.filter((combo) => selectedComboIds[combo.id]),
    [data.bookCombos, selectedComboIds],
  );

  const selectionSummary = React.useMemo(() => {
    const serviceCount = selectedServices.reduce((sum, s) => sum + (serviceQty[s.id] ?? 1), 0);
    const comboCount = selectedCombos.length;
    const count = serviceCount + comboCount;
    const totalMins =
      selectedServices.reduce((sum, s) => sum + s.durationMins * (serviceQty[s.id] ?? 1), 0) +
      selectedCombos.reduce((sum, c) => sum + c.durationMins, 0);
    const totalPrice =
      selectedServices.reduce((sum, s) => sum + s.priceValue * (serviceQty[s.id] ?? 1), 0) +
      selectedCombos.reduce((sum, c) => sum + c.priceValue, 0);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const durationLabel =
      hours > 0 && mins > 0 ? `${hours} hour${hours > 1 ? "s" : ""}, ${mins} mins` : hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : `${mins} mins`;
    return { count, durationLabel, totalPrice };
  }, [selectedCombos, selectedServices, serviceQty]);

  const toggleService = (id: string, checked: boolean) => {
    setSelectedServiceIds((prev) => ({ ...prev, [id]: checked }));
    if (checked) {
      setServiceQty((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
    }
  };

  const toggleCombo = (id: string, checked: boolean) => {
    setSelectedComboIds((prev) => ({ ...prev, [id]: checked }));
  };

  const adjustQty = (id: string, delta: number) => {
    setServiceQty((prev) => {
      const next = Math.max(1, (prev[id] ?? 1) + delta);
      return { ...prev, [id]: next };
    });
  };

  const assignmentOptions = React.useMemo(() => {
    const comboOptions = selectedCombos.map((combo) => ({
      value: `combo:${combo.id}`,
      label: `${combo.categoryLabel} + ${combo.serviceLabel}`,
    }));
    const serviceOptions = selectedServices.map((service) => ({
      value: `svc:${service.id}`,
      label: service.name,
    }));
    return [...comboOptions, ...serviceOptions];
  }, [selectedCombos, selectedServices]);

  const hasAssignableSelection = assignmentOptions.length > 0;

  const getClaimedByOtherMembers = React.useCallback(
    (memberId: string, assignments: Record<string, readonly string[]>) => {
      const claimed = new Set<string>();
      for (const [id, ids] of Object.entries(assignments)) {
        if (id !== memberId) ids.forEach((value) => claimed.add(value));
      }
      return claimed;
    },
    [],
  );

  const getAssignmentOptionsForMember = React.useCallback(
    (memberId: string) => {
      const claimedByOthers = getClaimedByOtherMembers(memberId, teamAssignments);
      const memberDraft = teamDraftAssignments[memberId] ?? teamAssignments[memberId] ?? [];
      const keepVisible = new Set(memberDraft);
      return assignmentOptions.filter(
        (opt) => keepVisible.has(opt.value) || !claimedByOthers.has(opt.value),
      );
    },
    [assignmentOptions, getClaimedByOtherMembers, teamAssignments, teamDraftAssignments],
  );

  const commitAssignToMember = (memberId: string) => {
    const draft = [...(teamDraftAssignments[memberId] ?? [])];
    if (!draft.length) return;
    const claimed = new Set(draft);

    setTeamAssignments((prev) => {
      const next: Record<string, readonly string[]> = { ...prev, [memberId]: draft };
      for (const id of Object.keys(next)) {
        if (id === memberId) continue;
        next[id] = (next[id] ?? []).filter((value) => !claimed.has(value));
      }

      setTeamAssignLocked((locks) => {
        const lockNext: Record<string, boolean> = { ...locks, [memberId]: true };
        for (const id of Object.keys(prev)) {
          if (id === memberId) continue;
          const hadOverlap = (prev[id] ?? []).some((value) => claimed.has(value));
          if (hadOverlap) lockNext[id] = false;
        }
        return lockNext;
      });

      return next;
    });

    setTeamDraftAssignments((prev) => {
      const next: Record<string, readonly string[]> = { ...prev, [memberId]: draft };
      for (const id of Object.keys(prev)) {
        if (id === memberId) continue;
        next[id] = (prev[id] ?? []).filter((value) => !claimed.has(value));
      }
      return next;
    });
  };

  React.useEffect(() => {
    const validIds = new Set(assignmentOptions.map((opt) => opt.value));
    const cleanRecord = (record: Record<string, readonly string[]>) => {
      const next: Record<string, readonly string[]> = {};
      let changed = false;
      for (const [memberId, ids] of Object.entries(record)) {
        const filtered = ids.filter((id) => validIds.has(id));
        next[memberId] = filtered;
        if (filtered.length !== ids.length) changed = true;
      }
      return changed ? next : record;
    };

    setTeamAssignments((prev) => cleanRecord(prev));
    setTeamDraftAssignments((prev) => cleanRecord(prev));
    setTeamAssignLocked({});
  }, [assignmentOptions]);

  return (
    <Box>
      <PublicProfileTopBar title={publicProfileTitle} />

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          mb: 2,
          boxShadow: "0 10px 22px rgba(16, 24, 40, 0.06)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 1.75 } }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: 17, md: 18 },
              color: alpha(m.navy, 0.88),
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </Typography>
          <ProfileLocationToggle
            locationMode={effectiveLocationMode}
            supportsFixed={data.supportsFixedLocation}
            supportsDesired={data.supportsDesiredLocation}
            onChange={onLocationModeChange}
          />
        </Stack>

        <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />

        <Grid container>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 220, md: 280 },
                overflow: "hidden",
                borderRadius: { xs: 0, md: "0 0 0 0" },
              }}
            >
              <ProfileHeroSwiper images={heroSlides} alt={data.shopName} />
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarRoundedIcon key={i} sx={{ fontSize: 18, color: m.star }} />
                ))}
                <Typography sx={{ ml: 0.5, fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                  ({data.reviewsCount} Reviews)
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 900, fontSize: 22, color: alpha(m.navy, 0.9), lineHeight: 1.2 }}>
                {data.shopName}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.55), lineHeight: 1.5 }}>
                {data.about}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
                {data.specialties.map((tag) => (
                  <Box
                    key={tag}
                    sx={{
                      px: 1.1,
                      py: 0.45,
                      borderRadius: "8px",
                      bgcolor: m.fxGrayF2F4F7,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.72),
                      lineHeight: 1.2,
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: "999px",
                    border: `1px solid ${alpha(m.teal, 0.45)}`,
                    bgcolor: alpha(m.teal, 0.06),
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <AccessTimeRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
                </Box>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {scheduleLabel}
                </Typography>
                <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 200 }, maxWidth: 320 }}>
                  <ButtonBase
                    ref={scheduleAnchorRef}
                    onClick={() => setScheduleOpen((p) => !p)}
                    aria-haspopup="listbox"
                    aria-expanded={scheduleOpen}
                    sx={{
                      width: "100%",
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.14)}`,
                      bgcolor: "#fff",
                      px: 1.5,
                      py: 0.95,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      textAlign: "left",
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                      {selectedScheduleLabel}
                    </Typography>
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        fontSize: 20,
                        color: alpha(m.navy, 0.45),
                        transform: scheduleOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 150ms ease",
                      }}
                    />
                  </ButtonBase>
                  <Popper
                    open={scheduleOpen}
                    anchorEl={scheduleAnchorRef.current}
                    placement="bottom-start"
                    disablePortal={false}
                    modifiers={[{ name: "offset", options: { offset: [0, 6] } }]}
                    sx={{ zIndex: (theme) => theme.zIndex.modal }}
                  >
                    <ClickAwayListener onClickAway={() => setScheduleOpen(false)}>
                      <Paper
                        elevation={0}
                        role="listbox"
                        sx={{
                          minWidth: scheduleAnchorRef.current?.offsetWidth ?? 200,
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.1)}`,
                          boxShadow: "0 12px 28px rgba(16,35,63,0.12)",
                          py: 0.5,
                          maxHeight: 240,
                          overflowY: "auto",
                        }}
                      >
                        {data.scheduleOptions.map((opt) => {
                          const active = opt.id === selectedScheduleId;
                          return (
                            <ButtonBase
                              key={opt.id}
                              role="option"
                              aria-selected={active}
                              onClick={() => {
                                setSelectedScheduleId(opt.id);
                                setScheduleOpen(false);
                              }}
                              sx={{
                                width: "100%",
                                display: "block",
                                px: 1.5,
                                py: 0.85,
                                textAlign: "left",
                                bgcolor: active ? alpha(m.teal, 0.08) : "transparent",
                                "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12.5,
                                  fontWeight: active ? 800 : 700,
                                  color: active ? alpha(m.teal, 0.95) : alpha(m.navy, 0.72),
                                }}
                              >
                                {opt.label}
                              </Typography>
                            </ButtonBase>
                          );
                        })}
                      </Paper>
                    </ClickAwayListener>
                  </Popper>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Stack spacing={2}>
        {data.supportsFixedLocation || data.supportsDesiredLocation ? (
          <SectionCard title="Location">
            <ProfileLocationSection
              data={data}
              showFixed={data.supportsFixedLocation}
              showDesired={data.supportsDesiredLocation}
            />
          </SectionCard>
        ) : null}

        <SectionCard title="Services For">
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.45), mb: 1.1 }}>
            We love to serve
          </Typography>
          <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap spacing={1.25}>
            {data.serviceFor
              .filter((item) => item.enabled)
              .map((item, index, arr) => {
                const Icon = SERVICE_FOR_ICONS[item.id];
                return (
                  <React.Fragment key={item.id}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Icon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    {index < arr.length - 1 ? (
                      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: alpha(m.navy, 0.28) }}>|</Typography>
                    ) : null}
                  </React.Fragment>
                );
              })}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Services Details"
          headerAction={
            showProjectHeader ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                sx={{ flexShrink: 0, cursor: "pointer" }}
                onClick={() => setProjectEnabled((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setProjectEnabled((prev) => !prev);
                  }
                }}
              >
                <Checkbox
                  checked={projectEnabled}
                  size="small"
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    p: 0.35,
                    color: alpha(m.navy, 0.28),
                    "&.Mui-checked": { color: m.teal },
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    setProjectEnabled(e.target.checked);
                  }}
                />
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}>Project</Typography>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: m.teal, ml: 0.15 }} />
              </Stack>
            ) : null
          }
        >
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, mb: 1.5 }}>
            {data.categories.map((cat) => (
              <ServiceCategorySliderCard
                key={cat.id}
                label={cat.label}
                iconId={cat.iconId}
                active={activeCategory === cat.id}
                onSelect={() => setActiveCategory(cat.id)}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search services"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.4), mr: 0.5 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: alpha(m.navy, 0.02), fontSize: 12.5 },
              }}
            />
            <IconButton
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "10px",
                bgcolor: m.teal,
                color: "#fff",
                "&:hover": { bgcolor: m.tealDark },
              }}
              aria-label="Add service"
            >
              <AddRoundedIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1}>
            {filteredServices.map((service) => {
              const checked = Boolean(selectedServiceIds[service.id]);
              const qty = serviceQty[service.id] ?? 1;
              return (
                <Box
                  key={service.id}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    px: 1.25,
                    py: 1,
                    bgcolor: alpha(m.navy, 0.015),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                        {service.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: m.teal }}>{service.durationLabel}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), mr: 0.5 }}>
                      {service.priceLabel}
                    </Typography>
                    <Stack direction="row" alignItems="center" sx={{ border: `1px solid ${alpha(m.navy, 0.12)}`, borderRadius: "8px" }}>
                      <IconButton size="small" onClick={() => adjustQty(service.id, -1)} disabled={!checked || qty <= 1}>
                        <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography sx={{ width: 22, textAlign: "center", fontSize: 12, fontWeight: 900 }}>{qty}</Typography>
                      <IconButton size="small" onClick={() => adjustQty(service.id, 1)} disabled={!checked}>
                        <AddRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => toggleService(service.id, e.target.checked)}
                      sx={{ p: 0.25, "&.Mui-checked": { color: m.teal } }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </SectionCard>

        {showProjectSection ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: m.fxGrayF2F4F7,
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.88), mb: 1.25 }}>
                Project
              </Typography>
              <ProjectReadOnlyField
                value={data.projectInstructions || data.projectPlaceholder || ""}
              />
            </Box>
          </Paper>
        ) : null}

        {showProjectSection ? (
        <SectionCard title="Book Service">
          <Stack spacing={1}>
            {data.bookCombos.map((combo) => {
              const checked = Boolean(selectedComboIds[combo.id]);
              return (
                <Box
                  key={combo.id}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    px: 1.25,
                    py: 1,
                    bgcolor: alpha(m.navy, 0.015),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                        {combo.categoryLabel} + {combo.serviceLabel}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: m.teal }}>
                        {combo.durationLabel}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), mr: 0.5 }}>
                      {combo.priceLabel}
                    </Typography>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => toggleCombo(combo.id, e.target.checked)}
                      sx={{ p: 0.25, "&.Mui-checked": { color: m.teal } }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
          {data.bookComboInstructions ? (
            <Box sx={{ mt: 1.25 }}>
              <MutedInstructionBox>{data.bookComboInstructions}</MutedInstructionBox>
            </Box>
          ) : null}
          <Typography sx={{ mt: 1.25, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
            {isDesiredLocation
              ? "Appointment at your location — Monday – Saturday, 10 AM – 8 PM"
              : "Appointment at the salon — Monday – Saturday, 10 AM – 8 PM"}
          </Typography>
        </SectionCard>
        ) : null}

        <SectionCard title="Our Professional Team">
          {!hasAssignableSelection ? (
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.5), mb: 1.25 }}>
              Select services in Services Details or combos in Book Service, then use Assign on a team member.
            </Typography>
          ) : null}
          <Stack spacing={1.25}>
            {visibleTeamMembers.length === 0 ? (
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                No team members available for this location type.
              </Typography>
            ) : null}
            {visibleTeamMembers.map((member) => (
              <Paper
                key={member.id}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: "#fff",
                  px: { xs: 1.25, sm: 2 },
                  py: 1.5,
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={{ xs: 1.25, md: 0 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{
                      flex: "0 0 auto",
                      minWidth: 0,
                      maxWidth: { md: 240 },
                      pr: { md: 2 },
                      borderRight: { md: `1px solid ${alpha(m.navy, 0.1)}` },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "999px",
                        overflow: "hidden",
                        bgcolor: alpha(m.navy, 0.06),
                        border: `1px solid ${alpha(m.navy, 0.1)}`,
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {member.avatarUrl ? (
                        <Image src={member.avatarUrl} alt={member.name} fill style={{ objectFit: "cover" }} />
                      ) : null}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 500, fontSize: 14, color: alpha(m.navy, 0.88), lineHeight: 1.35 }}>
                        {member.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.35 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarRoundedIcon
                            key={i}
                            sx={{
                              fontSize: 14,
                              color: i < Math.round(member.rating) ? m.star : alpha(m.navy, 0.15),
                            }}
                          />
                        ))}
                        <Typography sx={{ fontSize: 10.5, fontWeight: 500, color: alpha(m.navy, 0.5), ml: 0.25 }}>
                          ({member.reviewsCount} Reviews)
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Box sx={{ flex: 1, minWidth: 0, px: { md: 2 }, py: { xs: 0, md: 0.25 } }}>
                    {hasAssignableSelection ? (
                      (() => {
                        const memberOptions = getAssignmentOptionsForMember(member.id);
                        const draftValues = teamDraftAssignments[member.id] ?? teamAssignments[member.id] ?? [];
                        const committedValues = teamAssignments[member.id] ?? [];
                        const draftKey = [...draftValues].sort().join("|");
                        const committedKey = [...committedValues].sort().join("|");
                        const hasPendingChanges = draftKey !== committedKey;
                        const isAssignConfirmed =
                          Boolean(teamAssignLocked[member.id]) && committedValues.length > 0 && !hasPendingChanges;
                        const canAssign = draftValues.length > 0 && hasPendingChanges;

                        return (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                            <Box sx={{ flex: 1, width: "100%" }}>
                              <AppDropdown
                                multiple
                                value={draftValues}
                                onChange={(val) => {
                                  const next = Array.isArray(val) ? val : val ? [String(val)] : [];
                                  setTeamDraftAssignments((prev) => ({ ...prev, [member.id]: next }));
                                  setTeamAssignLocked((prev) => ({ ...prev, [member.id]: false }));
                                }}
                                options={memberOptions}
                                placeholder={member.allCategoriesPlaceholder ?? "Select service or combo"}
                                size="small"
                                fullWidth
                                renderValue={(selected) => {
                                  const ids = Array.isArray(selected) ? selected : [];
                                  if (!ids.length) {
                                    return (
                                      <span style={{ opacity: 0.6 }}>
                                        {member.allCategoriesPlaceholder ?? "Select service or combo"}
                                      </span>
                                    );
                                  }
                                  return ids
                                    .map((id) => assignmentOptions.find((opt) => opt.value === id)?.label)
                                    .filter(Boolean)
                                    .join(", ");
                                }}
                              />
                            </Box>
                            <Button
                              variant="contained"
                              disableElevation
                              disabled={!canAssign && !isAssignConfirmed}
                              onClick={() => commitAssignToMember(member.id)}
                              sx={{
                                flexShrink: 0,
                                alignSelf: { xs: "flex-start", sm: "center" },
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 900,
                                fontSize: 12.5,
                                minWidth: 96,
                                height: 40,
                                px: 2,
                                bgcolor: isAssignConfirmed ? m.fxGrayDCDFE3 : m.teal,
                                color: isAssignConfirmed ? alpha(m.navy, 0.55) : "#fff",
                                boxShadow: "none",
                                "&:hover": {
                                  bgcolor: isAssignConfirmed ? m.fxGrayF2F4F7 : m.tealDark,
                                  boxShadow: "none",
                                },
                                "&.Mui-disabled": {
                                  bgcolor: isAssignConfirmed ? m.fxGrayDCDFE3 : alpha(m.teal, 0.35),
                                  color: isAssignConfirmed ? alpha(m.navy, 0.55) : alpha("#fff", 0.85),
                                },
                              }}
                            >
                              {isAssignConfirmed ? "Assigned" : "Assign"}
                            </Button>
                          </Stack>
                        );
                      })()
                    ) : (
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.42) }}>
                        {member.allCategoriesPlaceholder ?? "Select services above to assign"}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="General Note">
          <Box sx={{ borderRadius: "10px", bgcolor: m.fxGrayF2F4F7, p: 1.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.72), mb: 0.75 }}>
              {data.generalNoteLabel}
            </Typography>
            <Box
              sx={{
                borderRadius: "8px",
                bgcolor: "#fff",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                px: 1.25,
                py: 1,
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.62), lineHeight: 1.55 }}>
                Additional Notes: {data.generalNote}
              </Typography>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title="Price">
          <Stack spacing={1.5}>
            <Box>
              <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.78), lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 800 }}>
                  Price Range:
                </Box>{" "}
                <Box component="span" sx={{ fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                  {data.priceRangeLabel}
                </Box>
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.78), lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 900 }}>
                  Prepayment
                </Box>{" "}
                {data.prepaymentLabel}
              </Typography>
            </Box>
            {showKilometerAllowance ? (
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                Kilometer allowance: {data.kilometerAllowanceLabel}
              </Typography>
            ) : null}
            {data.priceDescription ? <MutedInstructionBox>{data.priceDescription}</MutedInstructionBox> : null}
            {showKilometerAllowance && data.kilometerAllowanceInstructions ? (
              <MutedInstructionBox>{data.kilometerAllowanceInstructions}</MutedInstructionBox>
            ) : null}
          </Stack>
        </SectionCard>

        <SectionCard title="Policy">
          <Stack spacing={2}>
            {data.policySections.map((section) => (
              <Box key={section.title}>
                {section.fields?.length === 1 && section.fields[0].label === section.title ? (
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ mb: 0.25 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>
                      {section.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                      {section.fields[0].value}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78), mb: 0.5 }}>
                    {section.title}
                  </Typography>
                )}
                {section.fields && section.fields.length > 0 && !(section.fields.length === 1 && section.fields[0].label === section.title)
                  ? section.fields.map((field) => (
                      <PolicyFieldRow key={`${section.title}-${field.label}`} label={field.label} value={field.value} />
                    ))
                  : null}
                {section.description ? <MutedInstructionBox>{section.description}</MutedInstructionBox> : null}
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Portfolio">
          <Grid container spacing={1.25}>
            {data.portfolioImages.map((img, idx) => {
              const src = toImageSrc(img);
              return (
                <Grid item xs={6} sm={3} key={`${idx}-${src}`}>
                  <Box sx={{ position: "relative", borderRadius: "10px", overflow: "hidden", pt: "100%" }}>
                    {src ? (
                      <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ position: "absolute", inset: 0, bgcolor: alpha(m.navy, 0.06) }} />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </SectionCard>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(16,35,63,0.08)",
            px: { xs: 2, sm: 2.5 },
            py: 1.35,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
              {selectionSummary.count > 0
                ? `${selectionSummary.count} service${selectionSummary.count > 1 ? "s" : ""} selected - Total: ${selectionSummary.durationLabel} for ${selectionSummary.totalPrice} EUR`
                : "Select services to continue"}
            </Typography>
            <Button
              variant="contained"
              disableElevation
              disabled={selectionSummary.count === 0}
              onClick={onBookNow}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                fontSize: 13,
                minWidth: 132,
                height: 40,
                px: 2.5,
                bgcolor: m.teal,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { bgcolor: m.tealDark, boxShadow: "none" },
                "&.Mui-disabled": {
                  bgcolor: alpha(m.teal, 0.35),
                  color: alpha("#fff", 0.85),
                },
              }}
            >
              Book Now
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
