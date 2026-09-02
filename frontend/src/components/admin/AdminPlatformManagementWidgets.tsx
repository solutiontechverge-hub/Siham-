"use client";

import * as React from "react";
import Link from "next/link";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Avatar,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton } from "../common";
import AdminSectionCard from "./AdminSectionCard";
import { AdminSectionLink } from "./AdminDashboardHeader";
import { useGetAdminListingRankingQuery } from "../../store/services/adminApi";
import {
  platformContactMessages,
  platformFlaggedReviews,
  platformRatingCategories,
  platformRecentReports,
  platformSeoLinks,
} from "./platformManagementData";

function CardFooterLink({ href, label }: { href: string; label: string }) {
  const tokens = useTheme().palette.mollure;

  return (
    <Typography
      component={Link}
      href={href}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        fontSize: 12,
        fontWeight: 600,
        color: tokens.teal,
        textDecoration: "none",
        mt: 1.5,
        "&:hover": { textDecoration: "underline" },
      }}
    >
      {label}
      <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
    </Typography>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="flex-start"
      sx={{
        mt: 2,
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(tokens.teal, 0.06),
        border: `1px solid ${alpha(tokens.teal, 0.15)}`,
      }}
    >
      <InfoOutlinedIcon
        sx={{ fontSize: 16, color: tokens.teal, mt: 0.15, flexShrink: 0 }}
      />
      <Typography
        sx={{ fontSize: 11.5, color: tokens.bodyText, lineHeight: 1.45 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

export function RankingWeightSummaryWidget() {
  const tokens = useTheme().palette.mollure;
  const { data } = useGetAdminListingRankingQuery();
  const rankingFactors = data?.data?.factors ?? [];

  return (
    <AdminSectionCard
      title="Ranking Weight Summary"
      actions={
        <AppButton
          component={Link}
          href="/admin/listing-ranking"
          size="small"
          variant="outlined"
          sx={{ textTransform: "none", fontSize: 12, fontWeight: 600 }}
        >
          Manage Weights
        </AppButton>
      }
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.75}>
        {rankingFactors.map((factor) => (
          <Box key={factor.id}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography
                sx={{ fontSize: 12, fontWeight: 500, color: tokens.navy }}
              >
                {factor.label}
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: tokens.tealDark }}
              >
                {factor.weight}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={factor.weight}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(tokens.teal, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  bgcolor: tokens.teal,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
      <InfoBox>
        Ranking weights determine how professionals are sorted in search
        results. Higher weights give more influence to that metric.
      </InfoBox>
    </AdminSectionCard>
  );
}

export function FlaggedReviewsWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="Flagged Reviews"
      actions={<AdminSectionLink href="/admin/reviews" label="View All" />}
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        {platformFlaggedReviews.map((review) => (
          <Stack
            key={review.id}
            direction="row"
            alignItems="center"
            spacing={1.25}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: alpha(tokens.teal, 0.12),
                color: tokens.tealDark,
              }}
            >
              {review.initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                noWrap
              >
                {review.professional}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
                {review.date}
              </Typography>
            </Box>
            <Chip
              label="Flagged"
              size="small"
              sx={{
                height: 22,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha("#D92D20", 0.1),
                color: "#D92D20",
                border: `1px solid ${alpha("#D92D20", 0.2)}`,
              }}
            />
          </Stack>
        ))}
      </Stack>
      <CardFooterLink href="/admin/reviews" label="View all flagged reviews" />
    </AdminSectionCard>
  );
}

const reportStatusStyles = {
  new: { label: "New", bg: "rgba(220, 104, 3, 0.14)", color: "#DC6803" },
  viewed: { label: "Viewed", bg: "rgba(59, 130, 246, 0.12)", color: "#2563EB" },
} as const;

export function RecentReportsWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="Recent Reports"
      actions={<AdminSectionLink href="/admin/reports" label="View All" />}
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        {platformRecentReports.map((report) => {
          const statusStyle = reportStatusStyles[report.status];
          return (
            <Stack
              key={report.id}
              direction="row"
              alignItems="center"
              spacing={1.25}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(tokens.navy, 0.08),
                  color: tokens.navy,
                }}
              >
                {report.initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 500, color: tokens.navy }}
                  noWrap
                >
                  Reported: {report.reported}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
                  {report.reporter}
                </Typography>
              </Box>
              <Chip
                label={statusStyle.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                }}
              />
            </Stack>
          );
        })}
      </Stack>
      <CardFooterLink href="/admin/reports" label="View all reports" />
    </AdminSectionCard>
  );
}

const messageStatusStyles = {
  new: { label: "New", bg: "rgba(76, 175, 80, 0.12)", color: "#2E7D32" },
  replied: {
    label: "Replied",
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#2563EB",
  },
} as const;

export function RecentContactMessagesWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="Recent Contact Messages"
      actions={<AdminSectionLink href="/admin/messaging" label="View All" />}
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        {platformContactMessages.map((message) => {
          const statusStyle = messageStatusStyles[message.status];
          return (
            <Stack
              key={message.id}
              direction="row"
              alignItems="flex-start"
              spacing={1.25}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(tokens.teal, 0.1),
                  color: tokens.teal,
                  flexShrink: 0,
                }}
              >
                <EmailOutlinedIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                >
                  {message.category}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
                  {message.sender}
                </Typography>
                <Typography
                  sx={{ fontSize: 10.5, color: tokens.slate, mt: 0.25 }}
                >
                  {message.date} · {message.time}
                </Typography>
              </Box>
              <Chip
                label={statusStyle.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                  flexShrink: 0,
                }}
              />
            </Stack>
          );
        })}
      </Stack>
      <CardFooterLink href="/admin/messaging" label="View all messages" />
    </AdminSectionCard>
  );
}

export function ReviewRatingCategoriesWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="Review Rating Categories"
      actions={
        <AppButton
          component={Link}
          href="/admin/reviews"
          size="small"
          variant="outlined"
          sx={{ textTransform: "none", fontSize: 12, fontWeight: 600 }}
        >
          Edit Ranges
        </AppButton>
      }
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        {platformRatingCategories.map((cat) => (
          <Stack
            key={cat.id}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: cat.bg,
              border: `1px solid ${alpha(cat.color, 0.15)}`,
            }}
          >
            <Typography sx={{ fontSize: 20, lineHeight: 1 }}>
              {cat.emoji}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
              >
                {cat.label}
              </Typography>
              <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
                {cat.min.toFixed(1)} – {cat.max.toFixed(1)}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
      <InfoBox>
        Rating categories define how star ratings are grouped and displayed
        across the platform.
      </InfoBox>
    </AdminSectionCard>
  );
}

export function SeoQuickLinksWidget() {
  const tokens = useTheme().palette.mollure;

  return (
    <AdminSectionCard
      title="SEO Quick Links"
      description="Connect and monitor your SEO tools"
      compact
      sx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        {platformSeoLinks.map((link) => (
          <Box
            key={link.href}
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "block",
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${tokens.cardBorder}`,
              textDecoration: "none",
              transition: "border-color 160ms ease, box-shadow 160ms ease",
              "&:hover": {
                borderColor: alpha(tokens.teal, 0.35),
                boxShadow: `0 4px 16px ${alpha(tokens.teal, 0.08)}`,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                sx={{ flex: 1, minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: link.logoBg,
                    color: link.logoColor,
                    fontSize: link.logoLabel.length > 1 ? 9 : 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {link.logoLabel}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.navy,
                      lineHeight: 1.3,
                    }}
                  >
                    {link.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: tokens.bodyText,
                      mt: 0.35,
                      lineHeight: 1.4,
                    }}
                  >
                    {link.description}
                  </Typography>
                </Box>
              </Stack>
              <OpenInNewOutlinedIcon
                sx={{ fontSize: 16, color: tokens.slate, flexShrink: 0, ml: 1 }}
              />
            </Stack>
          </Box>
        ))}
      </Stack>
    </AdminSectionCard>
  );
}
