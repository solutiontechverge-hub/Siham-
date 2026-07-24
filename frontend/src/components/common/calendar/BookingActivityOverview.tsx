"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingActivityItem } from "./bookingActivity.types";

type BookingActivityOverviewProps = {
  title?: string;
  items: BookingActivityItem[];
  emptyMessage?: string;
  /** Controlled detail selection — parent AppDrawer owns back/title */
  selectedDetail?: BookingActivityItem | null;
  onSelectedDetailChange?: (item: BookingActivityItem | null) => void;
};

function ActivityCard({
  item,
  clickable,
  onOpen,
}: {
  item: BookingActivityItem;
  clickable: boolean;
  onOpen?: () => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box sx={{ position: "relative", pl: 2 }}>
      <Box
        sx={{
          position: "absolute",
          left: -12,
          top: 18,
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: m.teal,
          border: `2px solid #fff`,
          boxShadow: `0 0 0 1px ${alpha(m.teal, 0.35)}`,
        }}
      />
      <Box
        component={clickable ? "button" : "div"}
        type={clickable ? "button" : undefined}
        onClick={clickable ? onOpen : undefined}
        sx={{
          width: "100%",
          textAlign: "left",
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: "#fff",
          px: 1.5,
          py: 1.25,
          cursor: clickable ? "pointer" : "default",
          font: "inherit",
          display: "block",
          transition: "background-color 0.15s ease",
          "&:hover": clickable ? { bgcolor: alpha(m.navy, 0.02) } : undefined,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: alpha(m.navy, 0.48),
                mb: 0.25,
              }}
            >
              {item.actorLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 900,
                color: alpha(m.navy, 0.88),
                lineHeight: 1.3,
              }}
            >
              {item.title}
            </Typography>
            {item.subtitle ? (
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.52),
                }}
              >
                {item.subtitle}
              </Typography>
            ) : null}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mt: 0.85 }}
            >
              <Stack direction="row" spacing={0.45} alignItems="center">
                <CalendarMonthRoundedIcon
                  sx={{ fontSize: 13, color: alpha(m.navy, 0.38) }}
                />
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.48),
                  }}
                >
                  {item.dateLabel}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.45} alignItems="center">
                <AccessTimeRoundedIcon
                  sx={{ fontSize: 13, color: alpha(m.navy, 0.38) }}
                />
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.48),
                  }}
                >
                  {item.timeLabel}
                </Typography>
              </Stack>
            </Stack>
          </Box>
          {clickable ? (
            <ChevronRightRoundedIcon
              sx={{ fontSize: 22, color: alpha(m.navy, 0.35), mt: 0.5 }}
            />
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

function TimelineList({
  items,
  allowArrows,
  onOpen,
}: {
  items: BookingActivityItem[];
  allowArrows: boolean;
  onOpen?: (item: BookingActivityItem) => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box sx={{ position: "relative", pl: 1.5 }}>
      <Box
        sx={{
          position: "absolute",
          left: 5,
          top: 8,
          bottom: 8,
          width: 2,
          bgcolor: alpha(m.teal, 0.35),
          borderRadius: 1,
        }}
      />
      <Stack spacing={1.25}>
        {items.map((item) => {
          const clickable = allowArrows && item.hasDetailArrow;
          return (
            <ActivityCard
              key={item.id}
              item={item}
              clickable={clickable}
              onOpen={clickable && onOpen ? () => onOpen(item) : undefined}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

function CancellationActivityDetails({ item }: { item: BookingActivityItem }) {
  const m = useTheme().palette.mollure;

  return (
    <Stack spacing={1.75}>
      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 900,
            color: alpha(m.navy, 0.88),
            mb: 1,
          }}
        >
          Booking Details
        </Typography>
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.5,
          }}
        >
          <Typography
            sx={{ fontSize: 13.5, fontWeight: 800, color: m.teal, mb: 1 }}
          >
            Booking Cancelled
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 1.25 }}
          >
            <Stack direction="row" spacing={0.45} alignItems="center">
              <CalendarMonthRoundedIcon
                sx={{ fontSize: 15, color: alpha(m.navy, 0.4) }}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.55),
                }}
              >
                {item.dateLabel}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.45} alignItems="center">
              <AccessTimeRoundedIcon
                sx={{ fontSize: 15, color: alpha(m.navy, 0.4) }}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.55),
                }}
              >
                {item.timeLabel}
              </Typography>
            </Stack>
          </Stack>
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}
          >
            {item.professionalName || "Professional"}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 900,
            color: alpha(m.navy, 0.88),
            mb: 1,
          }}
        >
          Reason
        </Typography>
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            px: 1.5,
            py: 1.25,
          }}
        >
          <Box
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: alpha(m.navy, 0.02),
              px: 1.25,
              py: 1.1,
              minHeight: 48,
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.72),
                lineHeight: 1.5,
              }}
            >
              {item.cancellationReason}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}

function EbrActivityDetails({
  item,
  relatedItems,
}: {
  item: BookingActivityItem;
  relatedItems: BookingActivityItem[];
}) {
  const m = useTheme().palette.mollure;

  return (
    <Stack spacing={1.5}>
      <TimelineList items={relatedItems} allowArrows={false} />

      {(item.detailLines?.length ?? 0) > 0 ? (
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.78),
              mb: 1,
            }}
          >
            Details
          </Typography>
          <Stack spacing={1}>
            {item.detailLines!.map((line) => (
              <Stack
                key={line.label}
                direction="row"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.5),
                  }}
                >
                  {line.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {line.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Typography
        sx={{ fontSize: 11.5, color: alpha(m.navy, 0.45), lineHeight: 1.45 }}
      >
        Read-only details. No actions are available on this screen.
      </Typography>
    </Stack>
  );
}

export default function BookingActivityOverview({
  title = "Activity Overview",
  items,
  emptyMessage = "No activity yet for this client.",
  selectedDetail = null,
  onSelectedDetailChange,
}: BookingActivityOverviewProps) {
  const m = useTheme().palette.mollure;

  React.useEffect(() => {
    if (!selectedDetail) return;
    const stillExists = items.some((item) => item.id === selectedDetail.id);
    if (!stillExists) onSelectedDetailChange?.(null);
  }, [items, onSelectedDetailChange, selectedDetail]);

  const detailItems = React.useMemo(() => {
    if (!selectedDetail) return [];
    const sameBooking = items.filter(
      (item) => item.bookingId === selectedDetail.bookingId,
    );
    return sameBooking.length ? sameBooking : [selectedDetail];
  }, [items, selectedDetail]);

  if (selectedDetail?.detailType === "cancellation") {
    return <CancellationActivityDetails item={selectedDetail} />;
  }

  if (selectedDetail) {
    return (
      <EbrActivityDetails item={selectedDetail} relatedItems={detailItems} />
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography
        sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}
      >
        {title}
      </Typography>

      {!items.length ? (
        <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.55), py: 2 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <TimelineList
          items={items}
          allowArrows
          onOpen={(item) => onSelectedDetailChange?.(item)}
        />
      )}
    </Stack>
  );
}
