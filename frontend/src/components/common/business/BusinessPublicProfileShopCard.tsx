"use client";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  ButtonBase,
  ClickAwayListener,
  Divider,
  Grid,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import { businessPublicProfileUiCopy } from "../../../data/businessPublicProfile.data";
import { clientReviewsHref } from "../../../data/clientProfessionalReviews";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";
import { ProfileHeroSwiper } from "./BusinessPublicProfileHero";
import { ProfileLocationChoiceCards } from "./BusinessPublicProfileLocation";

export function BusinessPublicProfileShopCard(props: {
  data: BusinessPublicProfileData;
  pageTitle: string;
  effectiveLocationMode: "fixed" | "desired";
  onLocationModeChange?: (mode: "fixed" | "desired") => void;
  heroSlides: string[];
  visibleTeamMembers: BusinessPublicProfileData["teamMembers"];
  scheduleLabel: string;
  selectedScheduleLabel: string;
  scheduleOpen: boolean;
  setScheduleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleAnchorRef: React.RefObject<HTMLButtonElement | null>;
  selectedScheduleId: string;
  setSelectedScheduleId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const {
    data,
    pageTitle,
    effectiveLocationMode,
    onLocationModeChange,
    heroSlides,
    visibleTeamMembers,
    scheduleLabel,
    selectedScheduleLabel,
    scheduleOpen,
    setScheduleOpen,
    scheduleAnchorRef,
    selectedScheduleId,
    setSelectedScheduleId,
  } = props;
  const m = useTheme().palette.mollure;
  const router = useRouter();

  return (
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
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 1.75 } }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 20,
              color: alpha(m.navy, 0.88),
              lineHeight: 1.2,
              minWidth: 0,
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
              <ButtonBase
                onClick={() => {
                  const firstMember = visibleTeamMembers[0];
                  router.push(
                    clientReviewsHref(data.shopId, firstMember?.id, {
                      returnTo: `/clients/listing/${encodeURIComponent(data.shopId)}`,
                    }),
                  );
                }}
                sx={{
                  borderRadius: "6px",
                  px: 0.35,
                  py: 0.25,
                  "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                }}
                aria-label="View reviews and ratings"
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarRoundedIcon
                      key={i}
                      sx={{
                        fontSize: 18,
                        color:
                          i < Math.round(Math.min(5, Math.max(0, data.rating)))
                            ? m.star
                            : alpha(m.navy, 0.15),
                      }}
                    />
                  ))}
                  <Typography
                    sx={mollureLabelSx(m.navy, { ml: 0.5, color: alpha(m.navy, 0.55) })}
                  >
                    {data.reviewsCount > 0
                      ? `${data.rating.toFixed(1)} · (${data.reviewsCount} Reviews)`
                      : businessPublicProfileUiCopy.noReviewsYet}
                  </Typography>
                </Stack>
              </ButtonBase>
              <Typography sx={mollurePageTitleSx(m.navy, { mt: 1, lineHeight: 1.2 })}>
                {data.shopName}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  ...mollureBodyMutedSx(m.navy),
                  lineHeight: 1.5,
                }}
              >
                {data.about}
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.75}
                sx={{ mt: 1.25 }}
              >
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
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ mt: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}
              >
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
                    ...mollureBodyMutedSx(m.navy),
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {scheduleLabel}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: { xs: "100%", sm: 200 },
                    maxWidth: 320,
                  }}
                >
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
                    <Typography
                      sx={{
                        ...mollureBodySx(m.navy),
                      }}
                    >
                      {selectedScheduleLabel}
                    </Typography>
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        fontSize: 20,
                        color: alpha(m.navy, 0.45),
                        transform: scheduleOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 150ms ease",
                      }}
                    />
                  </ButtonBase>
                  <Popper
                    open={scheduleOpen}
                    anchorEl={scheduleAnchorRef.current}
                    placement="bottom-start"
                    disablePortal={false}
                    modifiers={[
                      { name: "offset", options: { offset: [0, 6] } },
                    ]}
                    sx={{ zIndex: (theme) => theme.zIndex.modal }}
                  >
                    <ClickAwayListener
                      onClickAway={() => setScheduleOpen(false)}
                    >
                      <Paper
                        elevation={0}
                        role="listbox"
                        sx={{
                          minWidth:
                            scheduleAnchorRef.current?.offsetWidth ?? 200,
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
                                bgcolor: active
                                  ? alpha(m.teal, 0.08)
                                  : "transparent",
                                "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                              }}
                            >
                              <Typography
                                sx={mollureBodySx(m.navy, { fontWeight: active ? 800 : 700, color: active
                                    ? alpha(m.teal, 0.95)
                                    : alpha(m.navy, 0.72) })}
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
  );
}
