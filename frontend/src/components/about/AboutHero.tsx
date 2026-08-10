"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container, IconButton } from "@mui/material";
import { AboutHeroImage } from "../../../images";

type AboutHeroProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
};

/**
 * Exact Figma banner (`about-header.svg`): photo cutouts, title, subtitle, teal CTA.
 * HTML overlay only for the clickable scroll hit-area over the baked-in button.
 */
export default function AboutHero({ imageAlt }: AboutHeroProps) {
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
        bgcolor: "common.white",
        pt: { xs: 3, md: 5 },
        pb: { xs: 2.5, md: 3.5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            // Native artboard ratio from about-header.svg (1302×423)
            aspectRatio: "1302 / 423",
            lineHeight: 0,
          }}
        >
          <Image
            src={AboutHeroImage}
            alt={imageAlt}
            fill
            sizes="(max-width: 1200px) 100vw, 1128px"
            priority
            style={{
              objectFit: "contain",
              objectPosition: "left top",
            }}
          />

          {/* Invisible hit target aligned to SVG teal circle (80×80 @ bottom-right) */}
          <IconButton
            onClick={scrollToNext}
            aria-label="Scroll to about content"
            disableRipple
            sx={{
              position: "absolute",
              zIndex: 2,
              // SVG: circle at x=1179..1259, y=343..423 within 1302×423
              right: "calc(100% * 43 / 1302)",
              bottom: 0,
              width: "calc(100% * 80 / 1302)",
              height: "calc(100% * 80 / 423)",
              minWidth: 0,
              p: 0,
              borderRadius: "50%",
              bgcolor: "transparent",
              color: "transparent",
              "&:hover": { bgcolor: "transparent" },
            }}
          />
        </Box>
      </Container>
    </Box>
  );
}
