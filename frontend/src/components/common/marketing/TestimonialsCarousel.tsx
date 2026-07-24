"use client";

import * as React from "react";
import Image from "next/image";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Card, CardContent, Stack } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { ClientTestimonial } from "../../../app/clients/clients.data";
import { useClientsPageTokens } from "../../../app/clients/clients.use";
import { Profile as AvatarImage } from "../../../../images";
import { BodyText as Typography } from "../../ui/typography";
import "swiper/css";
import "swiper/css/pagination";

export type TestimonialsCarouselProps = {
  items: ClientTestimonial[];
  agencyLabel?: string;
};

export default function TestimonialsCarousel({
  items,
  agencyLabel = "TheWebagency",
}: TestimonialsCarouselProps) {
  const tokens = useClientsPageTokens();
  const canLoop = items.length > 1;

  return (
    <Box
      sx={{
        position: "relative",
        px: { xs: 0, md: 0.5 },
        "& .testimonials-swiper": { pb: 4.5 },
        "& .swiper-pagination": { bottom: 0 },
        "& .swiper-pagination-bullet": {
          width: 8,
          height: 8,
          bgcolor: tokens.border,
          opacity: 1,
        },
        "& .swiper-pagination-bullet-active": {
          bgcolor: tokens.teal,
          width: 22,
          borderRadius: 999,
        },
        "& .swiper-slide": { height: "auto" },
      }}
    >
      <Swiper
        className="testimonials-swiper"
        modules={[Autoplay, Pagination]}
        slidesPerView={1.08}
        spaceBetween={16}
        grabCursor
        loop={canLoop}
        speed={550}
        autoplay={
          canLoop
            ? {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        pagination={{ clickable: true }}
        breakpoints={{
          600: { slidesPerView: 2, spaceBetween: 20 },
          900: { slidesPerView: 3, spaceBetween: 20 },
          1200: { slidesPerView: 3, spaceBetween: 24 },
        }}
      >
        {items.map((testimonial) => (
          <SwiperSlide key={testimonial.id}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "18px",
                border: `1px solid ${tokens.border}`,
                bgcolor: "#fff",
                overflow: "hidden",
                boxShadow: "0 12px 24px rgba(16, 24, 40, 0.08)",
              }}
            >
              <CardContent sx={{ p: 0, height: "100%" }}>
                <Box
                  sx={{
                    bgcolor: tokens.mintSoft,
                    px: 2.25,
                    pt: 2.25,
                    pb: 3.25,
                    position: "relative",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        bgcolor: "#fff",
                        border: `1px solid ${tokens.border}`,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={AvatarImage}
                        alt={testimonial.name}
                        width={52}
                        height={52}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: tokens.navy,
                          fontSize: 14,
                          lineHeight: 1.2,
                        }}
                      >
                        {testimonial.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: tokens.bodyText,
                          lineHeight: 1.25,
                        }}
                      >
                        {testimonial.role}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: tokens.slate,
                          lineHeight: 1.25,
                        }}
                      >
                        {agencyLabel}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.3}
                      sx={{
                        px: 1.5,
                        py: 0.55,
                        borderRadius: 999,
                        bgcolor: "#fff",
                        border: `1px solid ${tokens.border}`,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                      }}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarRoundedIcon
                          key={i}
                          sx={{ fontSize: 16, color: tokens.star }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
                <Box sx={{ px: 2.5, pt: 3.75, pb: 2.5, textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: 13, color: tokens.slate, lineHeight: 1.7 }}
                  >
                    {testimonial.text}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
