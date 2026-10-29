"use client";

import * as React from "react";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import BookingIndicatorIcon, {
  BOOKING_INDICATOR_LABELS,
  type BookingIndicatorVariant,
} from "../calendar/BookingIndicatorIcon";
import { actionRequiredBookingIndicators } from "../calendar/bookingResponseStatus";
import { actionRequiredPrepaymentIconVariant } from "../calendar/prepaymentStatus";
import BookingRequestBadge, {
  type BookingRequestDirection,
} from "../calendar/BookingRequestBadge";
import BookingRequestReceivedIcon from "../calendar/BookingRequestReceivedIcon";
import BookingRequestSentIcon from "../calendar/BookingRequestSentIcon";
import PrepaymentStatusIcon, {
  type PrepaymentStatusIconVariant,
} from "../calendar/PrepaymentStatusIcon";
import { PREPAYMENT_STATUS_LABELS } from "../calendar/PrepaymentStatusIcon";
import PaymentDueIcon from "../client-booking/PaymentDueIcon";

/** Icon size for status/prepayment indicators on calendar booking cards. */
const CARD_INDICATOR_ICON_SIZE = 16;

export type BookingTimelineCardPattern = "lines" | "dots" | "none";

export type BookingTimelineCardStatus = {
  label: React.ReactNode;
  sx?: SxProps<Theme>;
};

export type BookingTimelineCardScenarioBadge = {
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  showAcceptedIcon?: boolean;
  showPaymentIcon?: boolean;
  prepaymentStatus?: PrepaymentStatusIconVariant;
  responseIndicators?: readonly BookingIndicatorVariant[];
  showRequestSentIcon?: boolean;
  requestDirection?: BookingRequestDirection;
  requestAccepted?: boolean;
  requestRejected?: boolean;
  showExternalLink?: boolean;
  bold?: boolean;
  sx?: SxProps<Theme>;
};

export type BookingTimelineCardRequestBadge =
  | boolean
  | {
      label?: React.ReactNode;
      showAcceptedIcon?: boolean;
      showPaymentIcon?: boolean;
      sx?: SxProps<Theme>;
    };

export type BookingTimelineCardAction = {
  show?: boolean;
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  count?: number;
};

export type BookingTimelineCardProfileAction = BookingTimelineCardAction & {
  name?: React.ReactNode;
};

export type BookingTimelineCardPaymentDue = {
  /** e.g. Reissue Invoice */
  label?: string;
  /** Formatted due/reissue date, e.g. 25/07/2026 */
  dateLabel: string;
  showIcon?: boolean;
  /** Due date before today — red badge (matches calendar drawer). */
  pastDue?: boolean;
};

export type BookingTimelineCardProps = {
  idLabel: React.ReactNode;
  title: React.ReactNode;
  timeLabel: React.ReactNode;
  locationLabel?: React.ReactNode;
  status?: BookingTimelineCardStatus;
  accentColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  pattern?: BookingTimelineCardPattern;
  requestBadge?: BookingTimelineCardRequestBadge;
  scenarioBadges?: readonly BookingTimelineCardScenarioBadge[];
  prepaymentStatus?: PrepaymentStatusIconVariant;
  responseIndicators?: readonly BookingIndicatorVariant[];
  /** Payment due / reissued invoice hint shown on the card body. */
  paymentDue?: BookingTimelineCardPaymentDue | null;
  /**
   * Incoming edit-request note preview (receiver only), shown under the time row.
   * e.g. "Note from client: …"
   */
  notePreview?: string | null;
  /** Teal "Updated" pill near status when the other party changed the booking. */
  showUpdated?: boolean;
  /** Tooltip / click target for the Updated pill (Activity comparison signpost). */
  updatedSignpostTitle?: string;
  onUpdatedClick?: React.MouseEventHandler;
  calendarAction?: BookingTimelineCardAction;
  notesAction?: BookingTimelineCardAction;
  messageAction?: BookingTimelineCardAction & { count?: number };
  profileAction?: BookingTimelineCardProfileAction;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actionRailSx?: SxProps<Theme>;
  titleLineClamp?: number;
  titleBold?: boolean;
  /**
   * Optional body slot (e.g. multi-service sub-cards). When set, title/time
   * body text is skipped; header badges, location, and action rail stay as-is.
   */
  bodyContent?: React.ReactNode;
  /** Place action rail on the start (left) or end (right) edge. */
  actionRailSide?: "start" | "end";
};

function resolvePattern(
  pattern: BookingTimelineCardPattern,
  accentColor: string,
  bg: string,
  navy: string,
) {
  if (pattern === "dots") {
    return {
      backgroundColor: bg,
      backgroundImage: [
        `radial-gradient(${alpha(navy, 0.14)} 1px, transparent 1.35px)`,
        `linear-gradient(180deg, ${alpha("#fff", 0.62)} 0%, transparent 100%)`,
      ].join(", "),
      backgroundSize: "17px 17px, 100% 100%",
      backgroundPosition: "0 0, 0 0",
    };
  }

  if (pattern === "lines") {
    return {
      backgroundColor: bg,
      backgroundImage: [
        `repeating-linear-gradient(90deg, ${alpha(accentColor, 0.1)} 0 2px, transparent 2px 13px)`,
        `linear-gradient(180deg, ${alpha("#fff", 0.68)} 0%, transparent 100%)`,
      ].join(", "),
      backgroundSize: "15px 100%, 100% 100%",
      backgroundPosition: "0 0, 0 0",
    };
  }

  return { backgroundColor: bg };
}

function stopCardClick(handler?: React.MouseEventHandler<HTMLElement>) {
  return (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handler?.(event);
  };
}

function prepaymentVariantToIndicator(
  variant: PrepaymentStatusIconVariant,
): BookingIndicatorVariant {
  if (variant === "confirmed") return "prepaid";
  if (variant === "pending") return "waiting_for_prepayment";
  return "refund_pending";
}

function uniqueIndicators(
  indicators: readonly BookingIndicatorVariant[],
): BookingIndicatorVariant[] {
  return [...new Set(indicators)];
}

function renderResponseIndicators(
  indicators: readonly BookingIndicatorVariant[],
  size = CARD_INDICATOR_ICON_SIZE,
) {
  return uniqueIndicators(indicators).map((indicator) => (
    <Tooltip
      key={indicator}
      title={BOOKING_INDICATOR_LABELS[indicator]}
      placement="top"
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          lineHeight: 0,
          flexShrink: 0,
        }}
      >
        <BookingIndicatorIcon variant={indicator} size={size} />
      </Box>
    </Tooltip>
  ));
}

function renderScenarioBadge(
  badge: BookingTimelineCardScenarioBadge,
  m: { navy: string; success: string },
  key: React.Key,
) {
  const node =
    badge.showRequestSentIcon && badge.label === "BR" ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.35,
          flexShrink: 0,
          pointerEvents: "auto",
        }}
      >
        <BookingRequestBadge
          variant="compact"
          state={
            badge.requestRejected
              ? "rejected"
              : badge.requestAccepted
                ? "accepted"
                : "sent"
          }
          direction={badge.requestDirection ?? "outgoing"}
          sx={badge.sx}
        />
      </Box>
    ) : (
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.35}
        sx={[
          {
            height: 16,
            minHeight: 16,
            maxHeight: 16,
            boxSizing: "border-box",
            borderRadius: "4px",
            border: "none",
            borderWidth: 0,
            bgcolor: "#F2F4F7",
            color: alpha(m.navy, 0.62),
            px: 0.55,
            pointerEvents: "auto",
            flexShrink: 0,
          },
          ...(Array.isArray(badge.sx) ? badge.sx : [badge.sx]),
        ]}
      >
      <BodyText
        sx={{
          fontSize: 9.5,
          fontWeight: badge.bold ? 900 : 700,
          color: "inherit",
          lineHeight: 1,
        }}
      >
        {badge.label}
      </BodyText>
      {badge.showRequestSentIcon && badge.label === "EBR" ? (
        badge.requestDirection === "incoming" ? (
          <BookingRequestReceivedIcon size={10} />
        ) : (
          <BookingRequestSentIcon size={10} />
        )
      ) : null}
      {!badge.showRequestSentIcon && badge.responseIndicators?.length
        ? renderResponseIndicators(badge.responseIndicators)
        : !badge.showRequestSentIcon && badge.showAcceptedIcon
          ? renderResponseIndicators(["suggestion_for_change"])
          : null}
      {badge.prepaymentStatus === "canceled_or_invalid" &&
      !badge.responseIndicators?.includes(
        prepaymentVariantToIndicator(badge.prepaymentStatus),
      ) ? (
        <Tooltip
          title={PREPAYMENT_STATUS_LABELS[badge.prepaymentStatus]}
          placement="top"
        >
          <Box sx={{ display: "grid", placeItems: "center", lineHeight: 0 }}>
            <PrepaymentStatusIcon
              variant={badge.prepaymentStatus}
              size={CARD_INDICATOR_ICON_SIZE}
            />
          </Box>
        </Tooltip>
      ) : badge.showPaymentIcon &&
        !badge.responseIndicators?.includes("waiting_for_prepayment") ? (
        renderResponseIndicators(["waiting_for_prepayment"])
      ) : null}
      {badge.showExternalLink ? (
        <OpenInNewRoundedIcon sx={{ fontSize: 11, color: "inherit" }} />
      ) : badge.label === "ER" &&
        !badge.responseIndicators?.includes("suggestion_for_change") &&
        !badge.showAcceptedIcon &&
        badge.requestDirection === "incoming" ? (
        <BookingRequestReceivedIcon size={10} />
      ) : badge.label === "ER" &&
        !badge.responseIndicators?.includes("suggestion_for_change") &&
        !badge.showAcceptedIcon &&
        badge.requestDirection === "outgoing" ? (
        <BookingRequestSentIcon size={10} />
      ) : null}
    </Stack>
    );

  // BookingRequestBadge already has its own tooltip — don't stack a second hover.
  if (
    !badge.tooltip ||
    (badge.showRequestSentIcon && badge.label === "BR")
  ) {
    return <React.Fragment key={key}>{node}</React.Fragment>;
  }

  return (
    <Tooltip
      key={key}
      title={badge.tooltip}
      placement="top"
      enterDelay={200}
      describeChild
    >
      <Box sx={{ display: "flex", flexShrink: 0, cursor: "help" }}>{node}</Box>
    </Tooltip>
  );
}

function renderIconAction(
  action: BookingTimelineCardAction | undefined,
  fallbackIcon: React.ReactNode,
) {
  if (!action?.show) return null;

  return (
    <Tooltip title={action.tooltip ?? ""} placement="left">
      <IconButton
        size="small"
        onClick={stopCardClick(action.onClick)}
        sx={(theme) => ({
          position: "relative",
          p: 0.05,
          borderRadius: "5px",
          color: alpha(theme.palette.mollure.navy, 0.58),
          "&:hover": {
            bgcolor: alpha(theme.palette.mollure.navy, 0.06),
            color: theme.palette.mollure.navy,
          },
        })}
      >
        {action.icon ?? fallbackIcon}
        {action.count ? (
          <Box
            sx={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 12,
              height: 12,
              px: 0.25,
              borderRadius: "999px",
              bgcolor: "#EF4444",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 7,
              fontWeight: 900,
              lineHeight: 1,
              border: `1px solid ${alpha("#fff", 0.9)}`,
            }}
          >
            {action.count}
          </Box>
        ) : null}
      </IconButton>
    </Tooltip>
  );
}

export default function BookingTimelineCard({
  accentColor,
  actionRailSx,
  backgroundColor,
  borderColor,
  contentSx,
  idLabel,
  locationLabel,
  messageAction,
  notesAction,
  notePreview,
  showUpdated = false,
  updatedSignpostTitle,
  onUpdatedClick,
  onClick,
  pattern = "lines",
  paymentDue = null,
  profileAction,
  requestBadge = false,
  scenarioBadges,
  prepaymentStatus,
  responseIndicators,
  status,
  sx,
  timeLabel,
  title,
  titleLineClamp = 2,
  titleBold = false,
  bodyContent,
  actionRailSide = "end",
}: BookingTimelineCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const lineColor = accentColor ?? m.teal;
  const bg = backgroundColor ?? alpha(lineColor, 0.08);
  const resolvedBorder = borderColor ?? alpha(lineColor, 0.34);
  const surface = resolvePattern(pattern, lineColor, bg, m.navy);
  const requestBadgeOptions =
    typeof requestBadge === "object" ? requestBadge : {};
  const showRequestBadge = Boolean(requestBadge) && !scenarioBadges?.length;
  const visibleScenarioBadges = scenarioBadges ?? [];
  const embeddedIndicatorKeys = new Set<BookingIndicatorVariant>();
  for (const badge of visibleScenarioBadges) {
    for (const item of badge.responseIndicators ?? []) {
      embeddedIndicatorKeys.add(item);
    }
    if (badge.showAcceptedIcon) {
      embeddedIndicatorKeys.add("suggestion_for_change");
    }
    if (badge.showPaymentIcon) {
      embeddedIndicatorKeys.add("waiting_for_prepayment");
    }
    if (badge.prepaymentStatus) {
      embeddedIndicatorKeys.add(
        prepaymentVariantToIndicator(badge.prepaymentStatus),
      );
    }
  }
  const standaloneResponseList = uniqueIndicators(
    actionRequiredBookingIndicators(responseIndicators).filter(
      (item) => !embeddedIndicatorKeys.has(item),
    ),
  );
  const actionPrepayment = actionRequiredPrepaymentIconVariant(prepaymentStatus);
  const prepaymentIndicator = actionPrepayment
    ? prepaymentVariantToIndicator(actionPrepayment)
    : null;
  const showStandalonePrepayment =
    Boolean(prepaymentIndicator) &&
    !embeddedIndicatorKeys.has(prepaymentIndicator!) &&
    !standaloneResponseList.includes(prepaymentIndicator!);
  const showStandaloneResponse = uniqueIndicators(
    standaloneResponseList.filter(
      (item) => item !== prepaymentIndicator,
    ),
  ).length > 0;
  const standaloneResponseVisible = standaloneResponseList.filter(
    (item) => item !== prepaymentIndicator,
  );
  const showPaymentDueIcon =
    paymentDue?.showIcon !== false && Boolean(paymentDue?.dateLabel);
  const paymentDueOverlaps =
    showPaymentDueIcon &&
    (standaloneResponseVisible.includes("waiting_for_payment") ||
      standaloneResponseVisible.includes("overdue_payment") ||
      embeddedIndicatorKeys.has("waiting_for_payment") ||
      embeddedIndicatorKeys.has("overdue_payment"));
  const showProfile =
    profileAction?.show !== false &&
    Boolean(profileAction?.name || profileAction?.icon);
  const visibleMessageAction = messageAction?.show ? messageAction : null;

  const railAtStart = actionRailSide === "start";

  return (
    <Box
      onClick={onClick}
      sx={[
        {
          height: 78,
          minHeight: 78,
          width: "100%",
          borderRadius: "4px",
          border: `1px solid ${resolvedBorder}`,
          borderLeft: railAtStart ? undefined : `4px solid ${lineColor}`,
          borderRight: railAtStart ? `4px solid ${lineColor}` : undefined,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: railAtStart ? "66px 1fr" : "1fr 66px",
          cursor: onClick ? "pointer" : "default",
          boxShadow: "0 3px 10px rgba(16, 35, 63, 0.045)",
          transition:
            "box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease",
          ...surface,
          "&:hover": onClick
            ? {
                boxShadow: "0 7px 18px rgba(16, 35, 63, 0.1)",
                borderColor: alpha(lineColor, 0.48),
                transform: "translateY(-1px)",
              }
            : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={[
          {
            flex: 1,
            minWidth: 0,
            position: "relative",
            pt: "6px",
            pr: "8px",
            pb: "6px",
            pl: "8px",
            pointerEvents: "none",
            overflow: "hidden",
            order: 1,
          },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        <Stack
          direction="row"
          spacing="6px"
          alignItems="center"
          sx={{
            position: "absolute",
            top: 6,
            left: 8,
            right: 6,
            minWidth: 0,
            minHeight: 20,
            overflow: "visible",
          }}
        >
          <BodyText
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            sx={{
              fontSize: 12,
              fontWeight: 400,
              color: "#3B3E45",
              lineHeight: "16px",
              whiteSpace: "nowrap",
              pointerEvents: "auto",
            }}
          >
            {idLabel}
          </BodyText>
          {status ? (
            <Chip
              size="small"
              label={status.label}
              sx={[
                {
                  height: 16,
                  borderRadius: "4px",
                  fontSize: 7.5,
                  fontWeight: 600,
                  border: "none",
                  "& .MuiChip-label": { px: 0.55, py: 0, lineHeight: 1.15 },
                },
                ...(Array.isArray(status.sx) ? status.sx : [status.sx]),
              ]}
            />
          ) : null}
          {showUpdated ? (
            <Tooltip
              title={updatedSignpostTitle || "Updated"}
              placement="top"
            >
              <Chip
                size="small"
                label="Updated"
                onClick={
                  onUpdatedClick
                    ? (event) => {
                        event.stopPropagation();
                        onUpdatedClick(event);
                      }
                    : undefined
                }
                sx={{
                  height: 16,
                  minHeight: 16,
                  maxHeight: 16,
                  boxSizing: "border-box",
                  borderRadius: "4px",
                  fontSize: 7.5,
                  fontWeight: 800,
                  border: "none",
                  borderWidth: 0,
                  bgcolor: "#F2F4F7",
                  color: alpha(m.navy, 0.62),
                  cursor: onUpdatedClick ? "pointer" : "default",
                  "& .MuiChip-label": { px: 0.55, py: 0, lineHeight: "16px" },
                }}
              />
            </Tooltip>
          ) : null}
          {showRequestBadge ? (
            <BookingRequestBadge
              variant="compact"
              sx={requestBadgeOptions.sx}
              key="legacy-request-badge"
            />
          ) : null}
          {visibleScenarioBadges.map((badge, index) =>
            renderScenarioBadge(badge, m, `scenario-${index}`),
          )}
          {showStandalonePrepayment && actionPrepayment ? (
            <Tooltip
              title={PREPAYMENT_STATUS_LABELS[actionPrepayment]}
              placement="top"
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  lineHeight: 0,
                  flexShrink: 0,
                }}
              >
                <PrepaymentStatusIcon
                  variant={actionPrepayment}
                  size={CARD_INDICATOR_ICON_SIZE}
                />
              </Box>
            </Tooltip>
          ) : null}
          {showStandaloneResponse
            ? renderResponseIndicators(standaloneResponseVisible)
            : null}
          {showPaymentDueIcon && !paymentDueOverlaps ? (
            <Tooltip title="Waiting for payment" placement="top">
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  lineHeight: 0,
                  flexShrink: 0,
                }}
              >
                <PaymentDueIcon size={CARD_INDICATOR_ICON_SIZE + 2} />
              </Box>
            </Tooltip>
          ) : null}
          {bodyContent && timeLabel ? (
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: "#667085",
                lineHeight: "16px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {timeLabel}
            </BodyText>
          ) : null}
          {bodyContent && locationLabel ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                ml: "auto",
                color: "#667085",
                fontSize: 12,
                lineHeight: "16px",
              }}
            >
              {locationLabel}
            </Box>
          ) : null}
        </Stack>

        {bodyContent ? (
          <Box
            sx={{
              position: "absolute",
              top: 28,
              left: 8,
              right: 6,
              bottom: locationLabel ? 18 : 6,
              minHeight: 0,
              overflow: "hidden",
              pointerEvents: "auto",
            }}
          >
            {bodyContent}
          </Box>
        ) : (
          <Stack
            spacing={0.2}
            sx={{
              position: "absolute",
              top: 28,
              left: 8,
              right: paymentDue?.dateLabel ? 118 : 6,
              bottom: locationLabel ? 18 : 6,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <BodyText
              title={typeof title === "string" ? title : undefined}
              sx={{
                fontSize: 14,
                fontWeight: titleBold ? 900 : 500,
                color: "#3B3E45",
                lineHeight: "16px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: titleLineClamp,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                flexShrink: 0,
              }}
            >
              {title}
            </BodyText>
            {timeLabel ? (
              <BodyText
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#3B3E45",
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flexShrink: 0,
                  minWidth: 0,
                }}
              >
                {timeLabel}
              </BodyText>
            ) : null}
            {notePreview?.trim() ? (
              <BodyText
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.62),
                  lineHeight: "14px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  flexShrink: 0,
                }}
              >
                {notePreview.trim()}
              </BodyText>
            ) : null}
          </Stack>
        )}
        {paymentDue?.dateLabel && !bodyContent ? (
          <Tooltip
            title={`${paymentDue.label || "Reissue Invoice"} · ${paymentDue.dateLabel}`}
            placement="top"
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.45}
              sx={{
                position: "absolute",
                top: 42,
                right: 6,
                maxWidth: 118,
                height: 20,
                px: 0.7,
                borderRadius: "999px",
                bgcolor: alpha(
                  paymentDue.pastDue ? "#E85D5D" : m.teal,
                  paymentDue.pastDue ? 0.1 : 0.12,
                ),
                border: `1px solid ${alpha(
                  paymentDue.pastDue ? "#E85D5D" : m.teal,
                  0.28,
                )}`,
                boxShadow: `0 1px 4px ${alpha(
                  paymentDue.pastDue ? "#E85D5D" : m.teal,
                  0.08,
                )}`,
                pointerEvents: "auto",
              }}
            >
              <BodyText
                sx={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: paymentDue.pastDue ? "#E85D5D" : m.teal,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {paymentDue.label || "Reissue Invoice"}
              </BodyText>
              <Box
                sx={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  bgcolor: alpha(
                    paymentDue.pastDue ? "#E85D5D" : m.teal,
                    0.55,
                  ),
                  flexShrink: 0,
                }}
              />
              <BodyText
                sx={{
                  fontSize: 8.5,
                  fontWeight: 900,
                  color: paymentDue.pastDue
                    ? "#E85D5D"
                    : alpha(m.navy, 0.72),
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {paymentDue.dateLabel}
              </BodyText>
            </Stack>
          </Tooltip>
        ) : null}
        {locationLabel ? (
          <Box
            sx={{
              position: "absolute",
              left: 8,
              bottom: 1,
              height: 16,
              zIndex: 2,
              display: "inline-flex",
              alignItems: "center",
              color: "#667085",
              fontSize: 12,
              lineHeight: "16px",
            }}
          >
            {locationLabel}
          </Box>
        ) : null}
      </Box>

      <Box
        sx={[
          {
            width: 66,
            flexShrink: 0,
            display: "grid",
            gridTemplateRows: "1fr",
            justifyItems: "center",
            alignItems: "center",
            py: "9px",
            order: railAtStart ? 0 : 2,
            borderLeft: railAtStart
              ? undefined
              : `1px solid ${alpha(m.navy, 0.06)}`,
            borderRight: railAtStart
              ? `1px solid ${alpha(m.navy, 0.06)}`
              : undefined,
            bgcolor: alpha("#fff", 0.24),
            pointerEvents: "auto",
          },
          ...(Array.isArray(actionRailSx) ? actionRailSx : [actionRailSx]),
        ]}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0.35}
          sx={{ minWidth: 0, height: "100%" }}
        >
          {renderIconAction(
            notesAction,
            <StickyNote2OutlinedIcon sx={{ fontSize: 15, color: m.teal }} />,
          )}
          {showProfile ? (
            <Tooltip
              title={profileAction?.tooltip ?? ""}
              placement={railAtStart ? "right" : "left"}
            >
              <Box
                component="button"
                onClick={stopCardClick(profileAction?.onClick)}
                sx={{
                  all: "unset",
                  cursor: profileAction?.onClick ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.35,
                  maxWidth: 60,
                  px: 0.2,
                  py: 0.1,
                  borderRadius: "5px",
                  "&:hover": profileAction?.onClick
                    ? { bgcolor: alpha(m.navy, 0.06) }
                    : undefined,
                }}
              >
                {profileAction?.icon ?? (
                  <PersonOutlineRoundedIcon
                    sx={{
                      fontSize: 16,
                      color: alpha(m.navy, 0.58),
                      flexShrink: 0,
                    }}
                  />
                )}
                {profileAction?.name ? (
                  <BodyText
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: alpha(m.navy, 0.62),
                      lineHeight: 1,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {profileAction.name}
                  </BodyText>
                ) : null}
              </Box>
            </Tooltip>
          ) : null}
          {visibleMessageAction ? (
            <Tooltip
              title={visibleMessageAction.tooltip ?? ""}
              placement={railAtStart ? "right" : "left"}
            >
              <Box
                component="button"
                onClick={stopCardClick(visibleMessageAction.onClick)}
                sx={{
                  all: "unset",
                  position: "relative",
                  cursor: visibleMessageAction.onClick ? "pointer" : "default",
                  display: "grid",
                  placeItems: "center",
                  width: 21,
                  height: 17,
                  borderRadius: "5px",
                  color: alpha(m.navy, 0.58),
                  "&:hover": visibleMessageAction.onClick
                    ? { bgcolor: alpha(m.navy, 0.06), color: m.navy }
                    : undefined,
                }}
              >
                {visibleMessageAction.icon ?? (
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                )}
                {visibleMessageAction.count ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 10,
                      height: 10,
                      borderRadius: "999px",
                      bgcolor: "#EF4444",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 6,
                      fontWeight: 900,
                      lineHeight: 1,
                      border: `1px solid ${alpha("#fff", 0.9)}`,
                    }}
                  >
                    {visibleMessageAction.count}
                  </Box>
                ) : null}
              </Box>
            </Tooltip>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
