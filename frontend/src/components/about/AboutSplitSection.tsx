"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container, Stack } from "@mui/material";
import { AboutStarIcon, AboutUsImage } from "../../../images";
import { BodyText, SubHeading } from "../ui/typography";
import {
  MOLLURE_HEADING_BODY_GAP_PX,
  MOLLURE_SECTION_GAP_PX,
} from "../../theme/spacing";

type AboutSplitSectionProps = {
  imageSrc: string;
  imageAlt: string;
  panelTitle: string;
  paragraphs: readonly string[];
};

const GAP_PX = 16;
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
      sx={{ py: `${MOLLURE_SECTION_GAP_PX}px` }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "35fr 65fr" },
            gap: `${GAP_PX}px`,
            alignItems: "stretch",
          }}
        >
          {/* Photo column — 35% */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "1 / 1", md: "unset" },
              minHeight: { md: 380 },
              height: { md: "100%" },
              borderRadius: OUTER_RADIUS,
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(16, 35, 63, 0.08)",
            }}
          >
            <Image
              src={AboutUsImage}
              alt={imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 35vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </Box>

          {/* Teal copy column — 65% */}
          <Box
            sx={{
              bgcolor: "primary.main",
              display: "flex",
              flexDirection: "column",
              minHeight: { md: "100%" },
              borderRadius: OUTER_RADIUS,
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(16, 35, 63, 0.08)",
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
                <SubHeading
                  id="about-split-heading"
                  sx={{
                    fontSize: 20,
                    color: "common.white",
                    lineHeight: 1.2,
                  }}
                >
                  {panelTitle}
                </SubHeading>
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: { xs: 22, md: 26 },
                    height: { xs: 22, md: 26 },
                    display: "inline-flex",
                    flexShrink: 0,
                    "& img": {
                      width: "100%",
                      height: "100%",
                      display: "block",
                    },
                  }}
                >
                  <Image src={AboutStarIcon} alt="" width={26} height={26} />
                </Box>
              </Stack>

              <Stack
                spacing={`${MOLLURE_HEADING_BODY_GAP_PX}px`}
                sx={{ flex: 1 }}
              >
                {paragraphs.map((p) => (
                  <BodyText
                    key={p.slice(0, 40)}
                    sx={{
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.95)",
                      textAlign: "left",
                      fontSize: { xs: "0.9rem", md: "0.95rem" },
                    }}
                  >
                    {p}
                  </BodyText>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
