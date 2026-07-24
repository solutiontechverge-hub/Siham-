"use client";

import * as React from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ServiceCategorySliderCard, {
  SERVICE_CATEGORY_SLIDER_CARD_WIDTH,
} from "./ServiceCategorySliderCard";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";
import "swiper/css";
import "swiper/css/navigation";

export type ServiceCategoryBarItem = {
  id: string;
  label: string;
  iconId: ServiceCategorySliderIconId;
};

export type ServiceCategoryBarProps = {
  items: ServiceCategoryBarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
};

const SLIDE_GAP = 8;

/** Shared full-width service category strip (business setup, public profile, etc.) */
export default function ServiceCategoryBar({
  items,
  activeId,
  onSelect,
  ariaLabel = "Service categories",
}: ServiceCategoryBarProps) {
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );

  React.useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;
    swiper.slideTo(activeIndex, 280);
  }, [activeIndex]);

  return (
    <Box
      sx={{
        width: "100%",
        // Responsive width so cards fit without overlapping on small screens.
        "--serviceCategoryCardWidth": {
          xs: "84px",
          sm: "96px",
          md: `${SERVICE_CATEGORY_SLIDER_CARD_WIDTH}px`,
        },
        position: "relative",
        px: { xs: 0, sm: 4.5 },
        "& .service-category-swiper": {
          width: "100%",
          overflow: "hidden",
        },
        "& .swiper": { overflow: "hidden" },
        "& .swiper-slide": {
          width: "var(--serviceCategoryCardWidth)",
          height: "auto",
          boxSizing: "border-box",
        },
      }}
    >
      <IconButton
        aria-label="Scroll categories left"
        ref={prevRef}
        sx={{
          display: { xs: "none", sm: "flex" },
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          bgcolor: "#fff",
          border: `1px solid ${alpha("#0B1220", 0.12)}`,
          boxShadow: `0 10px 22px ${alpha("#0B1220", 0.08)}`,
          "&:hover": { bgcolor: "#fff" },
          "&.swiper-button-disabled": { opacity: 0.35 },
        }}
      >
        <ChevronLeftRoundedIcon />
      </IconButton>

      <IconButton
        aria-label="Scroll categories right"
        ref={nextRef}
        sx={{
          display: { xs: "none", sm: "flex" },
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          bgcolor: "#fff",
          border: `1px solid ${alpha("#0B1220", 0.12)}`,
          boxShadow: `0 10px 22px ${alpha("#0B1220", 0.08)}`,
          "&:hover": { bgcolor: "#fff" },
          "&.swiper-button-disabled": { opacity: 0.35 },
        }}
      >
        <ChevronRightRoundedIcon />
      </IconButton>

      <Box role="tablist" aria-label={ariaLabel}>
        <Swiper
          className="service-category-swiper"
          modules={[Navigation]}
          onBeforeInit={(swiper: SwiperInstance) => {
            // Swiper needs actual elements for navigation on init.
            // eslint-disable-next-line no-param-reassign
            swiper.params.navigation =
              typeof swiper.params.navigation === "boolean"
                ? { enabled: true }
                : (swiper.params.navigation ?? {});
            const navigation = swiper.params.navigation as Exclude<
              typeof swiper.params.navigation,
              boolean | undefined
            >;
            navigation.prevEl = prevRef.current;
            navigation.nextEl = nextRef.current;
          }}
          onSwiper={(swiper: SwiperInstance) => {
            swiperRef.current = swiper;
          }}
          navigation
          slidesPerView="auto"
          spaceBetween={SLIDE_GAP}
          grabCursor
          watchOverflow
          slideToClickedSlide
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <ServiceCategorySliderCard
                label={item.label}
                iconId={item.iconId}
                active={item.id === activeId}
                equalWidth
                onSelect={() => onSelect(item.id)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
}
