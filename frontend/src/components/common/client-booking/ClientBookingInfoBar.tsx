"use client";

import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureBodySx } from "../../../theme/mollureHierarchy";
import {
  formatTeamMemberReviewsLabel,
  teamMemberRatingFromApi,
} from "../../../lib/teamMemberReviews";
import { BodyText } from "../../ui/typography";
import { locationModeChipSx } from "./locationModeChipSx";

type MollureStats = {
  rating?: number | null;
  reviewsCount?: number | null;
  servicesOfferedCount?: number | null;
};

type Props = {
  professionalName: string;
  professionalRole?: string;
  address?: string;
  locationMode: "fixed" | "desired";
  phone?: string;
  /**
   * When set, Location address + Contact phone are hidden and Mollure public
   * stats are shown instead (rating / reviews / offered services).
   */
  mollureStats?: MollureStats | null;
};

const LABEL_ROW_MIN_H = 20; // matches Fixed Location chip lineHeight

export default function ClientBookingInfoBar({
  professionalName,
  professionalRole,
  address,
  locationMode,
  phone,
  mollureStats,
}: Props) {
  const m = useTheme().palette.mollure;
  const isDesired = locationMode === "desired";
  const locationBadge = isDesired ? "Desired Location" : "Fixed Location";
  const showMollureStats = Boolean(mollureStats);
  const reviewStats = teamMemberRatingFromApi(
    mollureStats?.rating,
    mollureStats?.reviewsCount,
  );
  const servicesOffered =
    typeof mollureStats?.servicesOfferedCount === "number" &&
    mollureStats.servicesOfferedCount > 0
      ? mollureStats.servicesOfferedCount
      : null;

  const colSx = {
    px: { xs: 0, md: 2.5 },
    py: { xs: 1.35, md: 1.5 },
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    minWidth: 0,
    borderRight: { xs: "none", md: `1px solid ${alpha(m.navy, 0.1)}` },
    borderBottom: { xs: `1px solid ${alpha(m.navy, 0.08)}`, md: "none" },
    "&:last-of-type": { borderRight: "none", borderBottom: "none" },
  } as const;

  const labelSx = {
    m: 0,
    fontSize: 13,
    fontWeight: 800,
    color: alpha(m.navy, 0.48),
    lineHeight: `${LABEL_ROW_MIN_H}px`,
  } as const;

  const labelRowSx = {
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    mb: 0.65,
    minHeight: LABEL_ROW_MIN_H,
  } as const;

  const metaTextSx = {
    m: 0,
    fontWeight: 700,
    fontSize: 12.5,
    color: alpha(m.navy, 0.62),
    lineHeight: 1.25,
    minWidth: 0,
  } as const;

  const iconSx = {
    fontSize: 16,
    width: 16,
    height: 16,
    color: alpha(m.navy, 0.45),
    flexShrink: 0,
    display: "block",
    // optical: 16px icon vs ~15.6px first line (12.5 * 1.25)
    mt: "0.5px",
  } as const;

  const iconRowSx = {
    display: "flex",
    alignItems: "flex-start",
    gap: 0.5,
    minWidth: 0,
  } as const;

  return (
    <Box
      sx={{
        mb: 2,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        alignItems: "stretch",
      }}
    >
      <Box sx={colSx}>
        <Box sx={labelRowSx}>
          <BodyText sx={labelSx}>Professional</BodyText>
        </Box>
        <BodyText
          sx={{
            m: 0,
            fontWeight: 900,
            fontSize: 14,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.25,
          }}
        >
          {professionalName}
        </BodyText>
        {professionalRole ? (
          <BodyText
            sx={{
              m: 0,
              fontSize: 12,
              fontWeight: 600,
              color: alpha(m.navy, 0.48),
              mt: 0.2,
              lineHeight: 1.25,
            }}
          >
            {professionalRole}
          </BodyText>
        ) : null}
      </Box>

      <Box sx={colSx}>
        <Box sx={labelRowSx}>
          <BodyText sx={labelSx}>
            {showMollureStats ? "Rating" : "Location"}
          </BodyText>
          {!showMollureStats ? (
            <Chip label={locationBadge} size="small" sx={locationModeChipSx} />
          ) : null}
        </Box>
        {showMollureStats ? (
          <Stack direction="row" alignItems="center" spacing={0.35}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarRoundedIcon
                key={i}
                sx={{
                  fontSize: 16,
                  color:
                    i < Math.round(reviewStats.rating)
                      ? m.star
                      : alpha(m.navy, 0.15),
                }}
              />
            ))}
            <BodyText
              sx={{
                m: 0,
                ml: 0.35,
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.62),
              }}
            >
              {reviewStats.reviewsLabel}
            </BodyText>
          </Stack>
        ) : (
          <Box sx={iconRowSx}>
            <LocationOnOutlinedIcon sx={iconSx} />
            <BodyText component="span" sx={metaTextSx}>
              {address?.trim() || "—"}
            </BodyText>
          </Box>
        )}
      </Box>

      <Box sx={colSx}>
        <Box sx={labelRowSx}>
          <BodyText sx={labelSx}>
            {showMollureStats ? "Services" : "Contact number"}
          </BodyText>
        </Box>
        {showMollureStats ? (
          <BodyText
            sx={mollureBodySx(m.navy, { m: 0, color: alpha(m.navy, 0.62) })}
          >
            {servicesOffered != null
              ? `${servicesOffered} offered`
              : Number(mollureStats?.reviewsCount) > 0
                ? formatTeamMemberReviewsLabel(
                    Number(mollureStats?.reviewsCount),
                  )
                : "—"}
          </BodyText>
        ) : (
          <Box sx={iconRowSx}>
            <PhoneOutlinedIcon sx={iconSx} />
            <BodyText component="span" sx={metaTextSx}>
              {phone?.trim() || "—"}
            </BodyText>
          </Box>
        )}
      </Box>
    </Box>
  );
}
