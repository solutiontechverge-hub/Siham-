"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import AdminSectionCard from "../AdminSectionCard";
import {
  rankingFactors as liveRankingFactors,
  type RankingFactor,
  type RankingImpact,
} from "../adminMockData";
import { ADMIN_CARD_PADDING as pad } from "../adminCardPadding";

const FACTOR_ICONS: Record<
  string,
  { icon: SvgIconComponent; bg: string; color: string }
> = {
  onlineBooking: {
    icon: EventAvailableOutlinedIcon,
    bg: "rgba(76, 175, 80, 0.12)",
    color: "#2E7D32",
  },
  onlineTransaction: {
    icon: PaymentsOutlinedIcon,
    bg: "rgba(127, 86, 217, 0.12)",
    color: "#6941C6",
  },
  avgRating: {
    icon: StarOutlineOutlinedIcon,
    bg: "rgba(255, 181, 71, 0.16)",
    color: "#DC6803",
  },
  totalReviews: {
    icon: RateReviewOutlinedIcon,
    bg: "rgba(33, 184, 191, 0.12)",
    color: "#149CA7",
  },
  activity: {
    icon: ScheduleOutlinedIcon,
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#2563EB",
  },
};

const IMPACT_STYLES: Record<
  RankingImpact,
  { bg: string; fg: string; label: string }
> = {
  high: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "High" },
  medium: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803", label: "Medium" },
  low: { bg: "rgba(59, 130, 246, 0.12)", fg: "#2563EB", label: "Low" },
};

/** Live app weights — read-only; only display order can be changed. */
const LIVE_FACTORS_BY_ID = Object.fromEntries(
  liveRankingFactors.map((f) => [f.id, f]),
);

function reorderIds(ids: string[], from: number, to: number) {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type AdminListingRankingPageProps = {
  embedded?: boolean;
};

export default function AdminListingRankingPage({
  embedded = false,
}: AdminListingRankingPageProps) {
  const tokens = useTheme().palette.mollure;
  const [orderedIds, setOrderedIds] = React.useState(
    liveRankingFactors.map((f) => f.id),
  );
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const factors = orderedIds
    .map((id) => LIVE_FACTORS_BY_ID[id])
    .filter((f): f is RankingFactor => Boolean(f));

  const total = factors.reduce((sum, f) => sum + f.weight, 0);

  const inactiveTrack = alpha(tokens.slate, 0.28);
  const inactiveRail = alpha(tokens.slate, 0.12);
  const inactiveThumb = alpha(tokens.slate, 0.55);

  const handleDrop = (targetIndex: number) => {
    if (!draggingId) return;
    const from = orderedIds.indexOf(draggingId);
    if (from < 0 || from === targetIndex) return;
    setOrderedIds((prev) => reorderIds(prev, from, targetIndex));
    setDraggingId(null);
  };

  return (
    <>
      {!embedded ? (
        <>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ mb: 1.5 }}
          >
            <Typography
              component={Link}
              href="/admin/dashboard"
              sx={{
                fontSize: 12,
                color: tokens.bodyText,
                textDecoration: "none",
                "&:hover": { color: tokens.teal },
              }}
            >
              Home
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
              /
            </Typography>
            <Typography
              sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}
            >
              Listing & Ranking Management
            </Typography>
          </Stack>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="mainHeading"
              sx={{
                fontSize: { xs: 24, md: 28 },
                color: tokens.textcolorgrey700,
                mb: 0.5,
              }}
            >
              Listing & Ranking Management
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: tokens.bodyText, maxWidth: 640 }}
            >
              Ranking weights are set by the platform. Drag rows to adjust
              factor priority order.
            </Typography>
          </Box>
        </>
      ) : null}

      <AdminSectionCard
        noPadding
        title="Ranking Factors"
        actions={
          <Chip
            label={`Total Weight: ${total}%`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: 12,
              bgcolor: tokens.mintSoft,
              color: tokens.tealDark,
              border: `1px solid ${alpha(tokens.teal, 0.25)}`,
            }}
          />
        }
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: tokens.mintSoft }}>
                {["#", "Factor", "Description", "Weight (%)", "Impact", ""].map(
                  (col, i) => (
                    <TableCell
                      key={col || "drag"}
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        color: tokens.slate,
                        py: 1.5,
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                        width: i === 0 ? 44 : i === 5 ? 48 : undefined,
                      }}
                    >
                      {col}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {factors.map((factor, index) => {
                const meta = FACTOR_ICONS[factor.id];
                const Icon = meta?.icon ?? EventAvailableOutlinedIcon;
                const impact = IMPACT_STYLES[factor.impact];
                const isDragging = draggingId === factor.id;

                return (
                  <TableRow
                    key={factor.id}
                    hover
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    sx={{
                      opacity: isDragging ? 0.55 : 1,
                      bgcolor: isDragging
                        ? alpha(tokens.teal, 0.04)
                        : undefined,
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell
                      sx={{
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                        color: tokens.slate,
                        fontSize: 13,
                      }}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                        minWidth: 180,
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: meta?.bg ?? tokens.surface,
                            color: meta?.color ?? tokens.teal,
                            flexShrink: 0,
                          }}
                        >
                          <Icon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: tokens.navy,
                          }}
                        >
                          {factor.label}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                        minWidth: 200,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: tokens.bodyText,
                          lineHeight: 1.45,
                        }}
                      >
                        {factor.description}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                        minWidth: 200,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Slider
                          value={factor.weight}
                          min={0}
                          max={100}
                          size="small"
                          disabled
                          sx={{
                            flex: 1,
                            color: inactiveThumb,
                            "& .MuiSlider-track": {
                              bgcolor: inactiveTrack,
                              border: "none",
                            },
                            "& .MuiSlider-rail": {
                              bgcolor: inactiveRail,
                              opacity: 1,
                            },
                            "& .MuiSlider-thumb": {
                              width: 14,
                              height: 14,
                              bgcolor: inactiveThumb,
                              boxShadow: "none",
                            },
                            "&.Mui-disabled": {
                              color: inactiveThumb,
                              opacity: 1,
                            },
                          }}
                        />
                        <Box
                          sx={{
                            minWidth: 52,
                            px: 1.25,
                            py: 0.65,
                            borderRadius: 1.5,
                            border: `1px solid ${alpha(tokens.slate, 0.22)}`,
                            bgcolor: alpha(tokens.slate, 0.06),
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: tokens.slate,
                            }}
                          >
                            {factor.weight}%
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        px: pad.tableCellX,
                        borderColor: tokens.cardBorder,
                      }}
                    >
                      <Chip
                        label={impact.label}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: impact.bg,
                          color: impact.fg,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{ px: 1, borderColor: tokens.cardBorder, width: 48 }}
                    >
                      <Box
                        draggable
                        aria-label={`Drag to reorder ${factor.label}`}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", factor.id);
                          setDraggingId(factor.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        sx={{
                          display: "grid",
                          placeItems: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          cursor: "grab",
                          color: alpha(tokens.slate, 0.55),
                          "&:active": { cursor: "grabbing" },
                          "&:hover": { bgcolor: alpha(tokens.slate, 0.06) },
                        }}
                      >
                        <DragIndicatorRoundedIcon sx={{ fontSize: 20 }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </AdminSectionCard>
    </>
  );
}
