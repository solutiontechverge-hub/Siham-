"use client";

import * as React from "react";
import RemoteAwareImage from "./RemoteAwareImage";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "swiper/css";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventSeatRoundedIcon from "@mui/icons-material/EventSeatRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonPinCircleRoundedIcon from "@mui/icons-material/PersonPinCircleRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  ClickAwayListener,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { BusinessPublicProfileData, BusinessPublicProfileServiceForItem } from "../../data/businessPublicProfile.data";
import {
  buildDesiredMunicipalityList,
  buildDesiredProvinceDisplays,
  getServicesForLocationMode,
  getTeamForLocationMode,
} from "../../data/businessPublicProfile.data";
import {
  buildPublicProfileBookingSelection,
  type PublicProfileBookingSelection,
} from "../../data/publicProfileBookingSelection";
import ServiceCategoryBar from "./ServiceCategoryBar";
import AppDropdown from "./AppDropdown";
import { serviceMatchesCategoryTab } from "../../data/businessServiceCategorySlider.data";
import { clientReviewsHref } from "../../data/clientProfessionalReviews";
import { KidsIcon } from "../../../images";

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
          py: 1.5,
          borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
        }}
      >
        <Typography variant="mainHeading" sx={{ lineHeight: 1, letterSpacing: 0 }}>
          {title}
        </Typography>
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
} as const;

function ServiceForIcon({ item }: { item: BusinessPublicProfileServiceForItem }) {
  const m = useTheme().palette.mollure;

  if (item.id === "kids") {
    return (
      <Box sx={{ width: 16, height: 16, flexShrink: 0, display: "grid", placeItems: "center" }}>
        <Image src={KidsIcon} alt="" width={13} height={13} />
      </Box>
    );
  }

  const Icon = SERVICE_FOR_ICONS[item.id];
  return <Icon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />;
}

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
              <RemoteAwareImage src={src} alt={alt} fill style={{ objectFit: "cover" }} priority={index === 0} draggable={false} />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 ? (
        <>
          <IconButton
            aria-label="Previous image"
            onClick={() => swiperRef.current?.slidePrev()}
            size="small"
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              bgcolor: alpha("#fff", 0.9),
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              "&:hover": { bgcolor: "#fff" },
            }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Next image"
            onClick={() => swiperRef.current?.slideNext()}
            size="small"
            sx={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              bgcolor: alpha("#fff", 0.9),
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              "&:hover": { bgcolor: "#fff" },
            }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
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
        </>
      ) : null}
    </Box>
  );
}

export type BusinessPublicProfileProps = {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  onLocationModeChange?: (mode: "fixed" | "desired") => void;
  onBookNow: (selection: PublicProfileBookingSelection) => void;
  pageTitle?: string;
  publicProfileTitle?: string;
};

type DesiredLocationView = "areas" | "municipalities";

function ProfileLocationSection({
  data,
  locationMode,
  supportsFixed,
  supportsDesired,
}: {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  supportsFixed: boolean;
  supportsDesired: boolean;
}) {
  const showFixed = supportsFixed && (!supportsDesired || locationMode === "fixed");
  const showDesired = supportsDesired && (!supportsFixed || locationMode === "desired");
  const m = useTheme().palette.mollure;
  const [viewMode, setViewMode] = React.useState<DesiredLocationView>("areas");
  const [listOpen, setListOpen] = React.useState(false);
  const listAnchorRef = React.useRef<HTMLButtonElement>(null);

  const provinceDisplays = React.useMemo(
    () => buildDesiredProvinceDisplays(data.desiredLocation),
    [data.desiredLocation],
  );
  const municipalityList = React.useMemo(
    () => buildDesiredMunicipalityList(data.desiredLocation),
    [data.desiredLocation],
  );

  const activeItems = viewMode === "areas" ? provinceDisplays.map((item) => item.label) : municipalityList;
  const dropdownLabel =
    viewMode === "areas"
      ? `Service areas(${provinceDisplays.length})`
      : `Municipalities(${municipalityList.length})`;

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
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
                {(
                  [
                    { label: "Service areas", value: "areas" },
                    { label: "Municipalities", value: "municipalities" },
                  ] as const
                ).map((option) => {
                  const active = viewMode === option.value;
                  return (
                    <ButtonBase
                      key={option.value}
                      onClick={() => {
                        setViewMode(option.value);
                        setListOpen(false);
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: "999px",
                        px: 1.75,
                        py: 0.75,
                        color: active ? "#fff" : alpha(m.navy, 0.72),
                        bgcolor: active ? m.teal : alpha(m.navy, 0.06),
                        border: `1px solid ${active ? m.teal : alpha(m.navy, 0.08)}`,
                        "&:hover": { bgcolor: active ? m.tealDark : alpha(m.teal, 0.1) },
                      }}
                    >
                      {option.label}
                    </ButtonBase>
                  );
                })}
              </Box>

              <ButtonBase
                ref={listAnchorRef}
                onClick={() => setListOpen((open) => !open)}
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  minHeight: 40,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  textAlign: "left",
                }}
              >
                <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: alpha(m.navy, 0.78) }}>
                  {dropdownLabel}
                </Typography>
                <KeyboardArrowDownRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: alpha(m.navy, 0.35),
                    flexShrink: 0,
                    transform: listOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                />
              </ButtonBase>

              <Popper
                open={listOpen}
                anchorEl={listAnchorRef.current}
                placement="bottom-start"
                modifiers={[{ name: "offset", options: { offset: [0, 6] } }]}
                sx={{ zIndex: (theme) => theme.zIndex.modal, width: listAnchorRef.current?.offsetWidth }}
              >
                <ClickAwayListener onClickAway={() => setListOpen(false)}>
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 0.25,
                      width: "100%",
                      maxHeight: 220,
                      overflowY: "auto",
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      boxShadow: "0 12px 28px rgba(16, 24, 40, 0.12)",
                      p: 0.75,
                    }}
                  >
                    <Stack spacing={0.5}>
                      {activeItems.map((label) => (
                        <Box
                          key={label}
                          sx={{
                            px: 1.1,
                            py: 0.85,
                            borderRadius: "8px",
                            bgcolor: alpha(m.navy, 0.02),
                          }}
                        >
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.78) }}>
                            {label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </ClickAwayListener>
              </Popper>
            </>
          )}
        </Box>
      ) : null}
    </Stack>
  );
}

function PublicProfilePageShell({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        bgcolor: "#fff",
        overflow: "hidden",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
      }}
    >
      {children}
    </Paper>
  );
}

function PublicProfileDetailsGroup({ children }: { children: React.ReactNode }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        bgcolor: m.fxGrayF2F4F7,
        p: { xs: 1.25, md: 1.5 },
      }}
    >
      <Stack spacing={2}>{children}</Stack>
    </Box>
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

function ProfileLocationChoiceCard({
  mode,
  active,
  canSwitch,
  onSelect,
}: {
  mode: "fixed" | "desired";
  active: boolean;
  canSwitch: boolean;
  onSelect?: () => void;
}) {
  const m = useTheme().palette.mollure;
  const Icon = mode === "fixed" ? EventSeatRoundedIcon : PersonPinCircleRoundedIcon;
  const label = mode === "fixed" ? "Fixed Location" : "Desired Location";

  return (
    <ButtonBase
      onClick={() => {
        if (canSwitch) onSelect?.();
      }}
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.5,
        py: 1.15,
        borderRadius: "10px",
        bgcolor: m.fxGrayF2F4F7,
        border: `1px solid ${active ? alpha(m.teal, 0.35) : alpha(m.navy, 0.08)}`,
        textAlign: "left",
        cursor: canSwitch ? "pointer" : "default",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Icon sx={{ fontSize: 20, color: alpha(m.navy, 0.55), flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78) }} noWrap>
          {label}
        </Typography>
      </Stack>
      <Checkbox
        checked={active}
        size="small"
        tabIndex={-1}
        disableRipple
        sx={{
          p: 0.25,
          color: alpha(m.navy, 0.28),
          "&.Mui-checked": { color: m.teal },
        }}
      />
    </ButtonBase>
  );
}

function ProfileLocationChoiceCards({
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
  const canSwitch = supportsFixed && supportsDesired;

  if (!supportsFixed && !supportsDesired) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1,
        width: { xs: "100%", sm: "auto" },
        minWidth: { sm: canSwitch ? 420 : 210 },
        maxWidth: "100%",
      }}
      role="group"
      aria-label="Location type"
    >
      {supportsFixed ? (
        <ProfileLocationChoiceCard
          mode="fixed"
          active={locationMode === "fixed"}
          canSwitch={canSwitch}
          onSelect={() => onChange?.("fixed")}
        />
      ) : null}
      {supportsDesired ? (
        <ProfileLocationChoiceCard
          mode="desired"
          active={locationMode === "desired"}
          canSwitch={canSwitch}
          onSelect={() => onChange?.("desired")}
        />
      ) : null}
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
  const router = useRouter();
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
  const showKilometerAllowance = showDesiredOfferingContent;
  const showProjectHeader = showDesiredOfferingContent;

  const [projectEnabled, setProjectEnabled] = React.useState(data.projectEnabled);
  const showProjectSection = showDesiredOfferingContent && projectEnabled;
  const showBookCombosSection = data.bookCombos.length > 0;

  const [portfolioLightboxIndex, setPortfolioLightboxIndex] = React.useState<number | null>(null);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const scheduleAnchorRef = React.useRef<HTMLButtonElement>(null);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(data.defaultScheduleOptionId);
  const [serviceQty, setServiceQty] = React.useState<Record<string, number>>({});
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Record<string, boolean>>({});
  const [selectedComboIds, setSelectedComboIds] = React.useState<Record<string, boolean>>({});
  const [memberSlotSelections, setMemberSlotSelections] = React.useState<Record<string, string>>({});

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
    if (!showDesiredOfferingContent) {
      setProjectEnabled(false);
    }
  }, [showDesiredOfferingContent]);

  React.useEffect(() => {
    setActiveCategory("all");
    setSearch("");
    setSelectedServiceIds({});
    setSelectedComboIds({});
    setServiceQty({});
  }, [locationMode]);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    for (const member of visibleTeamMembers) {
      for (const slot of member.serviceSlots) {
        next[`${member.id}:${slot.id}`] = slot.defaultValue;
      }
    }
    setMemberSlotSelections(next);
  }, [visibleTeamMembers]);

  React.useEffect(() => {
    setSelectedScheduleId(data.defaultScheduleOptionId);
    setScheduleOpen(false);
  }, [data.defaultScheduleOptionId, data.shopId]);

  const selectedScheduleLabel =
    data.scheduleOptions.find((opt) => opt.id === selectedScheduleId)?.label ??
    data.scheduleOptions[0]?.label ??
    "Today(8:00 - 18:00)";

  const scheduleLabel = isDesiredLocation ? "Desired Schedule" : "Fixed Schedule";

  const categoryRecords = React.useMemo(
    () => data.categories.map((c) => ({ id: c.id, title: c.label })),
    [data.categories],
  );

  const filteredServices = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeServices.filter((s) => {
      if (!serviceMatchesCategoryTab(s, activeCategory, data.categories, categoryRecords)) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q);
    });
  }, [activeCategory, activeServices, categoryRecords, data.categories, search]);

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

  return (
    <PublicProfilePageShell>
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
          <ProfileLocationChoiceCards
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
                <ButtonBase
                  onClick={() => {
                    const firstMember = visibleTeamMembers[0];
                    router.push(clientReviewsHref(data.shopId, firstMember?.id));
                  }}
                  sx={{
                    ml: 0.5,
                    borderRadius: "6px",
                    px: 0.35,
                    "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                    ({data.reviewsCount} Reviews)
                  </Typography>
                </ButtonBase>
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
              locationMode={effectiveLocationMode}
              supportsFixed={data.supportsFixedLocation}
              supportsDesired={data.supportsDesiredLocation}
            />
          </SectionCard>
        ) : null}

        <SectionCard title="Services For">
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.45), mb: 1.1 }}>
            We love to serve
          </Typography>
          <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap spacing={1.25}>
            {data.serviceFor.map((item, index, arr) => (
                  <React.Fragment key={item.id}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ServiceForIcon item={item} />
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    {index < arr.length - 1 ? (
                      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: alpha(m.navy, 0.28) }}>|</Typography>
                    ) : null}
                  </React.Fragment>
                ))}
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
          <Box sx={{ mb: 1.5 }}>
            <ServiceCategoryBar
              items={data.categories}
              activeId={activeCategory}
              onSelect={setActiveCategory}
            />
          </Box>
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
                bgcolor: m.addSoftBg,
                color: m.addSoftFg,
                border: `1px solid ${m.addSoftBorder}`,
                "&:hover": { bgcolor: m.addSoftBgHover },
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
                      <IconButton
                        size="small"
                        onClick={() => adjustQty(service.id, 1)}
                        disabled={!checked}
                        sx={{
                          "&:hover": { bgcolor: m.addSoftBgHover },
                          "&.Mui-disabled": { color: alpha(m.navy, 0.35) },
                        }}
                      >
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
              <Typography variant="subHeading" sx={{ lineHeight: 1, letterSpacing: 0, mb: 1.25 }}>
                Project
              </Typography>
              <ProjectReadOnlyField
                value={data.projectInstructions || data.projectPlaceholder || ""}
              />
            </Box>
          </Paper>
        ) : null}

        {showBookCombosSection ? (
        <SectionCard title="Services combo">
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
                        <RemoteAwareImage src={member.avatarUrl} alt={member.name} fill style={{ objectFit: "cover" }} />
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
                        <ButtonBase
                          onClick={() => router.push(clientReviewsHref(data.shopId, member.id))}
                          sx={{
                            ml: 0.25,
                            borderRadius: "6px",
                            px: 0.25,
                            "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                          }}
                        >
                          <Typography sx={{ fontSize: 10.5, fontWeight: 500, color: alpha(m.navy, 0.5) }}>
                            ({member.reviewsCount} Reviews)
                          </Typography>
                        </ButtonBase>
                      </Stack>
                    </Box>
                  </Stack>

                  <Box sx={{ flex: 1, minWidth: 0, px: { md: 2 }, py: { xs: 0, md: 0.25 } }}>
                    {member.serviceSlots.length > 0 ? (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {member.serviceSlots.map((slot) => {
                          const slotKey = `${member.id}:${slot.id}`;
                          return (
                            <Box
                              key={slot.id}
                              sx={{
                                flex: { sm: member.serviceSlots.length > 1 ? "1 1 calc(50% - 8px)" : "1 1 100%" },
                                minWidth: { sm: member.serviceSlots.length > 1 ? 0 : "100%" },
                                width: "100%",
                              }}
                            >
                              <AppDropdown
                                value={memberSlotSelections[slotKey] ?? slot.defaultValue}
                                onChange={(val) => {
                                  const next = Array.isArray(val) ? val[0] : String(val ?? "");
                                  setMemberSlotSelections((prev) => ({ ...prev, [slotKey]: next }));
                                }}
                                options={slot.options}
                                placeholder={slot.label}
                                size="small"
                                fullWidth
                                renderValue={() => (
                                  <span style={{ color: alpha(m.navy, 0.62) }}>{slot.label}</span>
                                )}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <AppDropdown
                        value=""
                        onChange={() => {}}
                        options={[]}
                        placeholder={member.allCategoriesPlaceholder ?? "All Categories and services"}
                        size="small"
                        fullWidth
                        disabled
                      />
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>

        <PublicProfileDetailsGroup>
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
        </PublicProfileDetailsGroup>

        <SectionCard title="Portfolio">
          <Grid container spacing={1.25}>
            {data.portfolioImages.map((img, idx) => {
              const src = toImageSrc(img);
              return (
                <Grid item xs={6} sm={3} key={`${idx}-${src}`}>
                  <Box
                    component={src ? "button" : "div"}
                    type={src ? "button" : undefined}
                    onClick={src ? () => setPortfolioLightboxIndex(idx) : undefined}
                    sx={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      p: 0,
                      m: 0,
                      border: "none",
                      borderRadius: "10px",
                      overflow: "hidden",
                      pt: "100%",
                      bgcolor: "transparent",
                      cursor: src ? "pointer" : "default",
                      appearance: "none",
                      WebkitAppearance: "none",
                      "&:focus-visible": {
                        outline: `2px solid ${m.teal}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {src ? (
                      <RemoteAwareImage src={src} alt={`Portfolio ${idx + 1}`} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ position: "absolute", inset: 0, bgcolor: alpha(m.navy, 0.06) }} />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </SectionCard>

        <Dialog
          open={portfolioLightboxIndex !== null}
          onClose={() => setPortfolioLightboxIndex(null)}
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: "rgba(0,0,0,0.92)",
              boxShadow: "none",
            },
          }}
        >
          <IconButton
            aria-label="Close"
            onClick={() => setPortfolioLightboxIndex(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          {data.portfolioImages.length > 1 ? (
            <>
              <IconButton
                aria-label="Previous image"
                onClick={() =>
                  setPortfolioLightboxIndex((current) => {
                    if (current === null) return current;
                    const total = data.portfolioImages.length;
                    return (current - 1 + total) % total;
                  })
                }
                sx={{
                  position: "absolute",
                  left: { xs: 8, sm: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <IconButton
                aria-label="Next image"
                onClick={() =>
                  setPortfolioLightboxIndex((current) => {
                    if (current === null) return current;
                    return (current + 1) % data.portfolioImages.length;
                  })
                }
                sx={{
                  position: "absolute",
                  right: { xs: 8, sm: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </>
          ) : null}

          <Box
            onClick={() => setPortfolioLightboxIndex(null)}
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 5, sm: 8 },
              py: 6,
            }}
          >
            {portfolioLightboxIndex !== null && toImageSrc(data.portfolioImages[portfolioLightboxIndex]) ? (
              <Box
                onClick={(event) => event.stopPropagation()}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  maxWidth: 1100,
                }}
              >
                <RemoteAwareImage
                  src={toImageSrc(data.portfolioImages[portfolioLightboxIndex])}
                  alt={`Portfolio ${portfolioLightboxIndex + 1}`}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            ) : null}
          </Box>
        </Dialog>

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
              onClick={() => {
                onBookNow(
                  buildPublicProfileBookingSelection({
                    data,
                    locationMode: effectiveLocationMode,
                    selectedServiceIds,
                    serviceQty,
                    selectedComboIds,
                    teamAssignments: {},
                    projectEnabled,
                  }),
                );
              }}
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
    </PublicProfilePageShell>
  );
}
