"use client";

import * as React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import {
  formatTeamMemberReviewsLabel,
  teamMemberRatingFromApi,
} from "../../../lib/teamMemberReviews";
import { clientReviewsHref } from "../../../data/clientProfessionalReviews";
import AppButton from "../AppButton";
import AppDrawer from "../AppDrawer";
import RemoteAwareImage from "../RemoteAwareImage";

export type ClientTeamMemberPublicProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  /** Assigned / offered service labels from public profile (omit when unknown). */
  serviceLabels?: string[];
  /**
   * Completed / delivered service bookings when API exposes it.
   * Omit when unknown — never invent.
   */
  servicesDeliveredCount?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  shopId?: string | null;
  member: ClientTeamMemberPublicProfile | null;
};

/**
 * Client-safe team member profile — Mollure public fields only.
 * Never shows address, phone, email, or other private pro contact data.
 */
export default function ClientTeamMemberPublicProfileDrawer({
  open,
  onClose,
  shopId,
  member,
}: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const name = member?.name?.trim() || "";
  const reviewStats = teamMemberRatingFromApi(
    member?.rating,
    member?.reviewsCount,
  );
  const serviceLabels = (member?.serviceLabels ?? [])
    .map((label) => label.trim())
    .filter(Boolean);
  const photo = member?.avatarUrl?.trim() || undefined;
  const initials = name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={name ? `${name} Profile` : "Team member"}
      contentVariant="muted"
    >
      {!member ? null : (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "999px",
                overflow: "hidden",
                bgcolor: alpha(m.teal, 0.14),
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                flexShrink: 0,
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              {photo ? (
                <RemoteAwareImage
                  src={photo}
                  alt={name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: 22,
                    fontWeight: 800,
                    bgcolor: alpha(m.teal, 0.16),
                    color: m.teal,
                  }}
                >
                  {initials}
                </Avatar>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 16,
                  color: alpha(m.navy, 0.9),
                  lineHeight: 1.25,
                }}
              >
                {name || "Team member"}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.35}
                sx={{ mt: 0.55 }}
              >
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
                <Typography
                  sx={{
                    ml: 0.35,
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                  }}
                >
                  {reviewStats.reviewsLabel}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack spacing={0.35}>
            {Number(member.reviewsCount) > 0 ? (
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                }}
              >
                {reviewStats.rating.toFixed(1)} ·{" "}
                {formatTeamMemberReviewsLabel(Number(member.reviewsCount))}
              </Typography>
            ) : null}
            {Number(member.servicesDeliveredCount) > 0 ? (
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                }}
              >
                {Number(member.servicesDeliveredCount)} service
                {Number(member.servicesDeliveredCount) === 1 ? "" : "s"}{" "}
                delivered
              </Typography>
            ) : null}
            {serviceLabels.length > 0 ? (
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                }}
              >
                {serviceLabels.length} service
                {serviceLabels.length === 1 ? "" : "s"} offered
              </Typography>
            ) : null}
          </Stack>

          {serviceLabels.length > 0 ? (
            <Box
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                px: 1.5,
                py: 1.25,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.48),
                  mb: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                Services
              </Typography>
              <Stack spacing={0.55}>
                {serviceLabels.map((label) => (
                  <Typography
                    key={label}
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.82),
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ) : null}

          {shopId && member.id ? (
            <AppButton
              tone="secondary"
              fullWidth
              onClick={() => {
                router.push(
                  clientReviewsHref(shopId, member.id, {
                    returnTo:
                      typeof window !== "undefined"
                        ? `${window.location.pathname}${window.location.search}`
                        : undefined,
                  }),
                );
                onClose();
              }}
            >
              View reviews
            </AppButton>
          ) : null}
        </Stack>
      )}
    </AppDrawer>
  );
}
