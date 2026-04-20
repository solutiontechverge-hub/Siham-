"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container } from "@mui/material";
import { AboutHeroImage } from "../../../images";

type AboutHeroProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
};

const FRAME_RADIUS = "28px";

export default function AboutHero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
}: AboutHeroProps) {
  const scrollToNext = React.useCallback(() => {
    document.getElementById("about-split")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 4, md: 6 },
        pb: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        {/* ── Outer frame ── */}
        <Box
          sx={{
            position: "relative",
            borderRadius: FRAME_RADIUS,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(16, 35, 63, 0.10)",
            minHeight: { xs: 260, sm: 300, md: 375 },
          }}
        >
          {/* ── Background photo ── */}
          <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <Image
              src={AboutHeroImage}
              alt={imageAlt}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              style={{ objectFit: "cover", objectPosition: "center 45%" }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
