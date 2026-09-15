"use client";

import * as React from "react";
import RemoteAwareImage from "../RemoteAwareImage";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { alpha, useTheme } from "@mui/material/styles";
import "swiper/css";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, IconButton } from "@mui/material";

export function ProfileHeroSwiper({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
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
        onSlideChange={(swiper: SwiperInstance) =>
          setActiveIndex(swiper.realIndex)
        }
      >
        {images.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 220, md: 280 },
              }}
            >
              <RemoteAwareImage
                src={src}
                alt={alt}
                fill
                style={{ objectFit: "cover" }}
                priority={index === 0}
                draggable={false}
              />
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
                  border: "1.5px solid #fff",
                  borderRadius: "50%",
                  cursor: "pointer",
                  bgcolor: index === activeIndex ? "#fff" : "transparent",
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
