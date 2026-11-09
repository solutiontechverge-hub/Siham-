"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureSectionTitleSx, mollureBodySx, mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import {
  groupActivityComparisonSections,
  type ActivityComparison,
  type ActivityComparisonRow,
} from "./buildActivityComparison";
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
  const ActivityIcon = item.kind === "booking_in_progress"
    ? PlayCircleOutlineRoundedIcon
    : item.kind === "booking_completed"
      ? CheckCircleOutlineRoundedIcon
      : item.kind === "post_booking_paid"
        ? PaymentsOutlinedIcon
        : null;

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
            <Stack direction="row" alignItems="center" spacing={0.75}>
              {ActivityIcon ? <ActivityIcon sx={{ fontSize: 18, color: m.teal }} /> : null}
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
            </Stack>
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
                sx={mollureSectionTitleSx(m.navy, { color: alpha(m.navy, 0.4) })}
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
                sx={mollureSectionTitleSx(m.navy, { color: alpha(m.navy, 0.4) })}
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
            sx={mollureBodySx(m.navy)}
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
                ...mollureBodySx(m.navy),
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

function isBlankComparisonValue(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  return (
    !trimmed ||
    trimmed === "—" ||
    trimmed === "---" ||
    trimmed === "–" ||
    trimmed.toLowerCase() === "removed"
  );
}

function ComparisonSide({
  caption,
  label,
  value,
  tone,
  emptyNote,
}: {
  caption: string;
  label: "Before" | "After";
  value: string;
  tone: "before" | "after" | "removed" | "empty";
  emptyNote?: string;
}) {
  const m = useTheme().palette.mollure;
  const blank = isBlankComparisonValue(value);
  const display = blank ? "—" : value;

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor:
          tone === "after"
            ? alpha(m.teal, 0.06)
            : tone === "removed"
              ? alpha("#C45C5C", 0.04)
              : alpha(m.navy, 0.03),
        px: 1.15,
        py: 0.95,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.2,
          color: alpha(m.navy, 0.55),
          mb: 0.35,
          lineHeight: 1.35,
        }}
      >
        <Box
          component="span"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.3,
            color: alpha(m.navy, 0.42),
          }}
        >
          {label}
        </Box>
        {" "}
        ({caption})
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: tone === "after" && !blank ? 800 : 700,
          lineHeight: 1.4,
          color:
            tone === "after" && !blank
              ? m.teal
              : tone === "removed" && !blank
                ? alpha("#C45C5C", 0.9)
                : alpha(m.navy, blank ? 0.38 : 0.82),
          wordBreak: "break-word",
        }}
      >
        {display}
      </Typography>
      {blank && emptyNote ? (
        <Typography
          sx={{
            mt: 0.2,
            fontSize: 10.5,
            fontWeight: 600,
            color: alpha(m.navy, 0.42),
          }}
        >
          {emptyNote}
        </Typography>
      ) : null}
    </Box>
  );
}

function ComparisonRowView({
  row,
  baselineCaption,
  proposedCaption,
}: {
  row: ActivityComparisonRow;
  baselineCaption: string;
  proposedCaption: string;
}) {
  const m = useTheme().palette.mollure;
  const originalBlank = isBlankComparisonValue(row.originalValue);
  const newBlank = isBlankComparisonValue(row.newValue);
  const kindLabel =
    row.changeKind === "added"
      ? "Added"
      : row.changeKind === "removed"
        ? "Removed"
        : row.changeKind === "updated"
          ? "Updated"
          : "Changed";

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.25,
        py: 1.15,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 900,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.3,
          }}
        >
          {row.label}
        </Typography>
        <Typography
          sx={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.2,
            textTransform: "uppercase",
            px: 0.75,
            py: 0.2,
            borderRadius: "999px",
            bgcolor:
              row.changeKind === "added"
                ? alpha(m.teal, 0.12)
                : row.changeKind === "removed"
                  ? alpha("#C45C5C", 0.12)
                  : alpha(m.navy, 0.06),
            color:
              row.changeKind === "added"
                ? m.teal
                : row.changeKind === "removed"
                  ? alpha("#C45C5C", 0.95)
                  : alpha(m.navy, 0.55),
          }}
        >
          {kindLabel}
        </Typography>
      </Stack>
      <Stack spacing={0.85}>
        <ComparisonSide
          label="Before"
          caption={baselineCaption}
          value={row.originalValue}
          emptyNote={
            originalBlank && row.changeKind !== "removed"
              ? "Did not exist"
              : undefined
          }
          tone={
            row.changeKind === "removed" || row.changeKind === "changed"
              ? "before"
              : originalBlank
                ? "empty"
                : "before"
          }
        />
        <ComparisonSide
          label="After"
          caption={proposedCaption}
          value={row.newValue}
          emptyNote={
            newBlank && row.changeKind === "removed"
              ? "No longer present"
              : undefined
          }
          tone={row.changeKind === "removed" ? "removed" : "after"}
        />
      </Stack>
    </Box>
  );
}

function ComparisonPanel({ comparison }: { comparison: ActivityComparison }) {
  const m = useTheme().palette.mollure;
  const grouped = groupActivityComparisonSections(comparison.rows);

  return (
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
          mb: 0.35,
        }}
      >
        {comparison.headline}
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: alpha(m.navy, 0.48),
          mb: 1.25,
          lineHeight: 1.4,
        }}
      >
        {comparison.baselineCaption}
        <Box component="span" sx={{ mx: 0.5, color: alpha(m.navy, 0.3) }}>
          →
        </Box>
        {comparison.proposedCaption}
      </Typography>
      <Stack spacing={1.5}>
        {grouped.map((group) => (
          <Box key={group.key}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: alpha(m.navy, 0.55),
                mb: 0.85,
              }}
            >
              {group.label}
            </Typography>
            <Stack spacing={1.15}>
              {group.rows.map((row) => (
                <ComparisonRowView
                  key={row.id}
                  row={row}
                  baselineCaption={comparison.baselineCaption}
                  proposedCaption={comparison.proposedCaption}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function ComparisonEventHeader({ item }: { item: BookingActivityItem }) {
  const m = useTheme().palette.mollure;
  const meta = [item.dateLabel, item.timeLabel].filter(Boolean).join(" · ");

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        px: 1.75,
        py: 1.25,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: alpha(m.navy, 0.48),
          mb: 0.2,
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
        {meta ? (
          <Box
            component="span"
            sx={{ fontWeight: 700, color: alpha(m.navy, 0.48) }}
          >
            {" · "}
            {meta}
          </Box>
        ) : null}
      </Typography>
    </Box>
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
  const comparison = item.comparison;

  // Comparison drill-in: compact event header + change rows only (no full timeline).
  if (comparison) {
    return (
      <Stack spacing={1.5}>
        <ComparisonEventHeader item={item} />
        <ComparisonPanel comparison={comparison} />
        <Typography
          sx={{ fontSize: 11.5, color: alpha(m.navy, 0.45), lineHeight: 1.45 }}
        >
          Read-only details. No actions are available on this screen.
        </Typography>
      </Stack>
    );
  }

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
        sx={mollureSectionTitleSx(m.navy)}
      >
        {title}
      </Typography>

      {!items.length ? (
        <Typography sx={mollureBodyMutedSx(m.navy, { py: 2 })}>
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
