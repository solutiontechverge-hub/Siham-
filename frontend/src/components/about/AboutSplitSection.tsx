"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type AboutSplitSectionProps = {
  imageSrc: string;
  imageAlt: string;
  panelTitle: string;
  paragraphs: readonly string[];
};

const GUTTER_PX = 2;
const OUTER_RADIUS = "32px";

export default function AboutSplitSection({
  imageSrc,
  imageAlt,
  panelTitle,
  paragraphs,
}: AboutSplitSectionProps) {
  return (
    <Box
      id="about-split"
      component="section"
      aria-labelledby="about-split-heading"
      sx={{ py: { xs: 4, md: 6 }, bgcolor: "background.default" }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: `${GUTTER_PX}px`,
            bgcolor: "#0a0a0a",
            borderRadius: OUTER_RADIUS,
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(16, 35, 63, 0.08)",
          }}
        >
          {/* Photo column */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "1 / 1", md: "unset" },
              minHeight: { md: 380 },
              height: { md: "100%" },
            }}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </Box>

          {/* Teal copy column */}
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "common.white",
              display: "flex",
              flexDirection: "column",
              minHeight: { md: "100%" },
            }}
          >
            <Stack
              spacing={2.75}
              sx={{
                p: { xs: 3.5, sm: 4, md: 5, lg: 6 },
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={1}
                sx={{ width: "100%" }}
              >
                <Typography
                  id="about-split-heading"
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1.65rem", md: "2rem" },
                    color: "common.white",
                    lineHeight: 1.2,
                  }}
                >
                  {panelTitle}
                </Typography>
                <AutoAwesomeIcon
                  sx={{
                    fontSize: { xs: 22, md: 26 },
                    color: "common.white",
                    opacity: 0.95,
                  }}
                  aria-hidden
                />
              </Stack>

              <Stack spacing={2.25} sx={{ flex: 1 }}>
                {paragraphs.map((p) => (
                  <Typography
                    key={p.slice(0, 40)}
                    variant="body1"
                    sx={{
                      fontWeight: 400,
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.95)",
                      textAlign: "left",
                      fontSize: { xs: "0.9rem", md: "0.95rem" },
                    }}
                  >
                    {p}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
