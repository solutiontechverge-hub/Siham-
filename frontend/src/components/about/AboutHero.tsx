"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container, IconButton, Typography } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

type AboutHeroProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
};

const FRAME_RADIUS = "28px";
const PANEL_INNER_RADIUS = "28px";

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
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        {/* ── Outer frame ── */}
        <Box
          sx={{
            position: "relative",
            borderRadius: FRAME_RADIUS,
            overflow: "hidden",
            border: "2px solid #A5D4DC",
            boxShadow: "0 20px 60px rgba(16, 35, 63, 0.10)",
            /* height comes from the image aspect on desktop */
            minHeight: { xs: 260, sm: 300, md: 340 },
          }}
        >
          {/* ── Background photo ── */}
          <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              style={{ objectFit: "cover", objectPosition: "center 45%" }}
            />
          </Box>

          {/* ═══ DESKTOP layout ═══ */}

          {/* Left white panel — title wraps to 2 lines */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              zIndex: 2,
              top: 0,
              left: 0,
              bgcolor: "common.white",
              /* Width ~37 % forces "Our Story, Vision," / "And Values" wrap */
              maxWidth: { md: "37%", lg: "38%" },
              pt: 3,
              pb: 3,
              pl: 3.5,
              pr: 4,
              borderBottomRightRadius: PANEL_INNER_RADIUS,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontWeight: 600,
                color: "mollure.textcolorgrey700",
                fontSize: { md: "1.65rem", lg: "1.85rem" },
                lineHeight: 1.22,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Right white panel — subtitle */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              zIndex: 2,
              top: 0,
              right: 0,
              bgcolor: "common.white",
              maxWidth: { md: "31%", lg: "30%" },
              pt: 2.5,
              pb: 2.5,
              pl: 4,
              pr: 3.5,
              borderBottomLeftRadius: PANEL_INNER_RADIUS,
              textAlign: "right",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 400,
                color: "text.secondary",
                fontSize: { md: "0.82rem", lg: "0.875rem" },
                lineHeight: 1.7,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* ═══ MOBILE layout ═══ */}
          <Box
            sx={{
              display: { xs: "block", md: "none" },
              position: "absolute",
              zIndex: 2,
              top: 0,
              left: 0,
              bgcolor: "common.white",
              maxWidth: { xs: "80%", sm: "68%" },
              pt: 2.5,
              pb: 2.5,
              pl: 2.5,
              pr: 3,
              borderBottomRightRadius: PANEL_INNER_RADIUS,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontWeight: 600,
                color: "mollure.textcolorgrey700",
                fontSize: { xs: "1.25rem", sm: "1.4rem" },
                lineHeight: 1.22,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Mobile subtitle — top-right */}
          <Box
            sx={{
              display: { xs: "block", md: "none" },
              position: "absolute",
              zIndex: 2,
              top: 0,
              right: 0,
              bgcolor: "common.white",
              maxWidth: { xs: "42%", sm: "36%" },
              pt: 2,
              pb: 2,
              pl: 2,
              pr: 2.5,
              borderBottomLeftRadius: PANEL_INNER_RADIUS,
              textAlign: "right",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                color: "text.secondary",
                lineHeight: 1.6,
                display: "block",
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Bottom-right nook + teal arrow */}
          <Box
            sx={{
              position: "absolute",
              zIndex: 2,
              bottom: 0,
              right: 0,
              bgcolor: "common.white",
              p: { xs: 2, md: 2.5 },
              borderTopLeftRadius: PANEL_INNER_RADIUS,
            }}
          >
            <IconButton
              type="button"
              onClick={scrollToNext}
              aria-label="Scroll to About Us section"
              sx={{
                width: { xs: 44, md: 50 },
                height: { xs: 44, md: 50 },
                bgcolor: "primary.main",
                color: "common.white",
                boxShadow: "0 8px 24px rgba(33, 184, 191, 0.45)",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
