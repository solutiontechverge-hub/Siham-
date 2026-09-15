"use client";

import * as React from "react";
import { Avatar, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import Image from "next/image";
import BookingTimelineCard from "../BookingTimelineCard";
import { BodyText } from "../../ui/typography";
import { useProfessionalMessagingUnread } from "../messaging/useProfessionalMessagingUnread";
import {
  DesiredLocationIcon,
  FixedLocationIcon,
} from "../../../../images";
import { minutesSinceMidnight } from "./calendar.utils";
import {
  calendarEventCanChat,
  calendarEventIsGuest,
  type CalendarEvent,
  type CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extractBookingId } from "./calendar.utils";
import {
  getActionRequiredScenarioIndicators,
  professionalCalendarDisplayStatus,
  professionalCalendarStatusLabel,
  professionalWaitingForClientPrepay,
  scenarioIndicatorDisplayLabel,
  statusCardAccent,
  statusChipSxWithOverride,
  type BookingScenarioIndicator,
} from "./bookingStatus";
import {
  actionRequiredBookingIndicators,
  resolveBookingResponseIndicators,
} from "./bookingResponseStatus";
import type { ResponseWindowInput } from "./bookingResponseDeadline";
import { resolveProfessionalBookingRequestDirection } from "./BookingRequestBadge";
import {
  actionRequiredPrepaymentIconVariant,
  resolveCalendarPrepaymentStatus,
  toPrepaymentIconVariant,
} from "./prepaymentStatus";
import { useBookingPaymentDueMeta } from "./resolveBookingPaymentDueMeta";
import {
  shouldShowSilentUpdatedTag,
  useBookingUpdateSeenVersion,
} from "./bookingUpdateSeen";
import { sanitizeInternalNoteText } from "./bookingEventDetails";
import BookingIdTooltipLabel from "./BookingIdTooltipLabel";
import { BookingCardTeamGroupIcon } from "./CalendarBookingCardTeamGroup";
import {
  getCalendarCardGapLines,
  getCalendarCardServiceLines,
  getOtherAssignedTeamMembers,
  layoutCalendarCardTimeline,
} from "./calendarBookingCardServices";

/** Single-service cards stay compact on the 24h grid. */
const SINGLE_CARD_MIN_HEIGHT = 64;

function CalendarLocationLabel({
  location,
}: {
  location: string;
}) {
  const isDesired = location === "DL";
  const icon = isDesired ? DesiredLocationIcon : FixedLocationIcon;
  const label = isDesired ? "DL" : location === "FL" ? "FL" : location;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.35,
        lineHeight: 1,
      }}
    >
      <Box
        sx={{
          width: 14,
          height: 14,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Image src={icon} alt="" width={14} height={14} />
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: 12,
          fontWeight: 400,
          color: "#667085",
          lineHeight: "16px",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function firstNameLabel(value: string | undefined) {
  const name = value?.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

function avatarInitials(name: string, avatarText?: string) {
  const fromAvatar = avatarText?.trim();
  if (fromAvatar) return fromAvatar.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function formatServiceDurationLabel(start: string, end: string) {
  const mins =
    minutesSinceMidnight(end) - minutesSinceMidnight(start);
  if (!Number.isFinite(mins) || mins <= 0) return "";
  return `${mins} Mins`;
}

export type CalendarBookingCardProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  left: string | number;
  right: string | number;
  serviceColor?: string;
  statusColor?: string;
  variant?: "default" | "ticket";
  positioned?: boolean;
  dense?: boolean;
  /** Week grid: exact start–end height, no nested service sub-cards. */
  weekSimple?: boolean;
  teamMemberNameById?: ReadonlyMap<string, string>;
  teamResources?: readonly CalendarResource[];
  containerSx?: SxProps<Theme>;
  onOpen: () => void;
  /** Kept for callers; calendar glyph is not shown (interactive-only icons). */
  onOpenCalendar?: () => void;
  onOpenNotes: () => void;
  onOpenClient: (anchorEl: HTMLElement) => void;
  onOpenMessages: () => void;
  /** Open day split-view with this partner team member. */
  onOpenSplitWithTeamMember?: (partnerId: string) => void;
  /** Place profile/actions on the lane's outer edge (split-view aware). */
  actionRailSide?: "start" | "end";
  responseTimeConfigured?: boolean;
  /** Live business-template response window (drives dynamic overdue). */
  responseTime?: ResponseWindowInput | null;
};

function scenarioBadgeResponseIndicators(
  label: BookingScenarioIndicator,
  responseIndicators: ReturnType<typeof resolveBookingResponseIndicators>,
) {
  if (label === "BR" || label === "EBR") return responseIndicators;
  if (label === "ER" || label === "E") {
    return responseIndicators.filter(
      (indicator) => indicator === "overdue_response",
    );
  }
  return [];
}

export default function CalendarBookingCard({
  event,
  top,
  height,
  left,
  right,
  serviceColor,
  statusColor,
  variant = "default",
  positioned = true,
  dense = false,
  weekSimple = false,
  teamMemberNameById,
  teamResources,
  containerSx,
  onOpen,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
  onOpenSplitWithTeamMember,
  actionRailSide = "end",
  responseTimeConfigured,
  responseTime,
}: CalendarBookingCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isTicket = variant === "ticket";
  const serviceLines = React.useMemo(
    () => getCalendarCardServiceLines(event),
    [event],
  );
  const gapLines = React.useMemo(
    () => getCalendarCardGapLines(event),
    [event],
  );
  const timelineLayouts = React.useMemo(
    () =>
      layoutCalendarCardTimeline(
        serviceLines,
        gapLines,
        event.start,
        event.end,
      ),
    [event.end, event.start, gapLines, serviceLines],
  );
  const otherTeamMembers = React.useMemo(
    () =>
      getOtherAssignedTeamMembers(event, {
        resources: teamResources,
        nameById: teamMemberNameById,
      }),
    [event, teamMemberNameById, teamResources],
  );
  const isMultiService =
    !weekSimple &&
    (serviceLines.length > 1 ||
      (serviceLines.length >= 1 && gapLines.length > 0));
  const isIncomingEbr =
    event.bookingScenario === "EBR" &&
    event.details?.requestDirection !== "outgoing";
  const isIncomingEr =
    event.bookingScenario === "ER" &&
    event.details?.requestDirection === "incoming";
  const incomingErNote = isIncomingEr
    ? sanitizeInternalNoteText(
        event.details?.editRequestNote || event.details?.internalNote,
      )
    : "";
  const cardHeight = weekSimple
    ? Math.max(4, height)
    : isTicket
      ? Math.max(34, height)
      : Math.max(
          isMultiService
            ? 78
            : incomingErNote
              ? 96
              : SINGLE_CARD_MIN_HEIGHT,
          height,
        );
  const isCompactTicket = dense || (isTicket && cardHeight < 48);
  const bookingRef = event.bookingCode ?? extractBookingId(event.id);
  const unreadCount = useProfessionalMessagingUnread(bookingRef);
  const displayStatus = professionalCalendarDisplayStatus(event);
  const waitingForClientPrepay = professionalWaitingForClientPrepay(event);
  const accent = statusCardAccent(displayStatus, statusColor);
  const scenarioIndicators = getActionRequiredScenarioIndicators(event);
  const responseIndicators = actionRequiredBookingIndicators(
    resolveBookingResponseIndicators(event, {
      responseTimeConfigured,
      responseTime,
    }),
  );
  const prepaymentStatus = resolveCalendarPrepaymentStatus(event);
  const prepaymentIconVariant = waitingForClientPrepay
    ? undefined
    : actionRequiredPrepaymentIconVariant(
        prepaymentStatus ? toPrepaymentIconVariant(prepaymentStatus) : undefined,
      );
  const paymentDueMeta = useBookingPaymentDueMeta(event);
  const isDesiredLocation = event.location === "DL";
  const isFixedLocation = event.location === "FL";
  const hasNote =
    Boolean(sanitizeInternalNoteText(event.details?.internalNote)) ||
    Boolean(incomingErNote);
  const accentColor = serviceColor ?? accent.color;
  // Keep custom appearance colors readable on the grid until the user changes them.
  const backgroundColor = serviceColor
    ? alpha(serviceColor, isDesiredLocation ? 0.22 : 0.2)
    : accent.bg;
  const borderColor = serviceColor
    ? alpha(serviceColor, 0.55)
    : event.status === "Requested" || waitingForClientPrepay
      ? accent.border
      : isIncomingEr
        ? alpha(m.teal, 0.65)
        : accent.border;
  const cardPattern = isDesiredLocation
    ? "dots"
    : isFixedLocation
      ? "lines"
      : "none";
  const emphasizeRequest =
    isIncomingEbr ||
    isIncomingEr ||
    waitingForClientPrepay ||
    (event.bookingScenario === "BR" && event.status === "Requested");
  useBookingUpdateSeenVersion();
  const showUpdated =
    event.bookingScenario !== "EBR" &&
    event.bookingScenario !== "ER" &&
    event.status !== "Requested" &&
    shouldShowSilentUpdatedTag({
      silentUpdated: event.details?.silentUpdated,
      viewer: "professional",
      bookingRef,
      updatedAt: event.updatedAt,
      lastEditedBy: event.details?.lastEditedBy ?? null,
    });

  const primaryService = serviceLines[0];
  const singleTitle = weekSimple
    ? event.title
    : isMultiService
      ? event.title
      : primaryService?.name || event.title;
  const singleTimeLabel = dense
    ? ""
    : weekSimple
      ? `(${event.start} to ${event.end})`
      : isMultiService
        ? `(${event.start} to ${event.end})`
        : `(${primaryService?.start || event.start} to ${primaryService?.end || event.end})`;

  const sharedCardProps = {
    idLabel: <BookingIdTooltipLabel bookingId={bookingRef} />,
    titleBold: emphasizeRequest,
    locationLabel: <CalendarLocationLabel location={event.location} />,
    notePreview: incomingErNote
      ? (`Note from client: ${incomingErNote}` as string)
      : (null as string | null),
    showUpdated,
    status: {
      label: professionalCalendarStatusLabel(event),
      sx: {
        ...statusChipSxWithOverride(displayStatus, statusColor),
        ...(emphasizeRequest ? { fontWeight: 900 } : null),
      },
    },
    accentColor,
    borderColor,
    backgroundColor: isIncomingEr ? alpha(m.teal, 0.14) : backgroundColor,
    pattern: cardPattern as "lines" | "dots" | "none",
    scenarioBadges: [
      ...(calendarEventIsGuest(event)
        ? [
            {
              label: "Guest",
              tooltip: "Guest booking — no profile",
              bold: true,
              sx: {
                border: `1px solid ${alpha(m.navy, 0.18)}`,
                bgcolor: alpha(m.navy, 0.06),
                color: alpha(m.navy, 0.72),
              },
            },
          ]
        : []),
      ...scenarioIndicators.map((indicator) => ({
        label: scenarioIndicatorDisplayLabel(indicator),
        showRequestSentIcon: indicator === "BR",
        requestDirection:
          indicator === "BR" || indicator === "ER"
            ? resolveProfessionalBookingRequestDirection(event)
            : undefined,
        responseIndicators:
          indicator === "EBR"
            ? scenarioBadgeResponseIndicators(indicator, responseIndicators)
            : [],
        prepaymentStatus:
          indicator === "EBR" &&
          prepaymentIconVariant === "canceled_or_invalid"
            ? prepaymentIconVariant
            : undefined,
        showExternalLink: false,
        bold:
          indicator === "EBR" ||
          indicator === "BR" ||
          indicator === "ER",
        sx:
          indicator === "ER" && isIncomingEr
            ? {
                border: `1px solid ${alpha(m.teal, 0.45)}`,
                bgcolor: alpha(m.teal, 0.12),
                color: m.teal,
              }
            : undefined,
      })),
    ],
    prepaymentStatus: prepaymentIconVariant,
    paymentDue: paymentDueMeta
      ? {
          label: paymentDueMeta.reissued
            ? "Reissue Invoice"
            : "Payment Due",
          dateLabel: paymentDueMeta.dateLabel,
          showIcon: true,
        }
      : null,
    responseIndicators: (() => {
      const raw =
        scenarioIndicators.includes("BR")
          ? responseIndicators
          : scenarioIndicators.length
            ? undefined
            : responseIndicators;
      if (!raw?.length) return raw;
      const skip = new Set<string>();
      if (prepaymentIconVariant === "pending") skip.add("waiting_for_prepayment");
      if (prepaymentIconVariant === "canceled_or_invalid") {
        skip.add("refund_pending");
      }
      return raw.filter((item) => !skip.has(item));
    })(),
    notesAction: {
      show: hasNote,
      tooltip: incomingErNote ? "Edit request note" : "Note added",
      onClick: onOpenNotes,
      count: hasNote ? 1 : undefined,
    },
    profileAction: {
      show: !calendarEventIsGuest(event),
      name: event.showClientName ?? "Client",
      tooltip: `Open profile: ${event.showClientName ?? "Client"}`,
      onClick: (e: React.MouseEvent<HTMLElement>) =>
        onOpenClient(e.currentTarget as HTMLElement),
    },
    messageAction: {
      show: calendarEventCanChat(event),
      count: unreadCount > 0 ? unreadCount : undefined,
      tooltip: `Messages: ${event.showClientName ?? "Client"}`,
      onClick: onOpenMessages,
    },
    onClick: onOpen,
  };

  const positionSx = positioned
    ? {
        position: "absolute" as const,
        top,
        left,
        right,
        height: cardHeight,
        minHeight: cardHeight,
        zIndex: 10,
      }
    : {
        position: "relative" as const,
        width: "100%",
        height: cardHeight,
        minHeight: cardHeight,
      };

  const teamGroup = (
    <BookingCardTeamGroupIcon
      members={otherTeamMembers}
      onSelectMember={onOpenSplitWithTeamMember}
      side={actionRailSide}
      totalMemberCount={
        otherTeamMembers.length
          ? otherTeamMembers.length + 1
          : undefined
      }
      bookingId={bookingRef}
    />
  );

  if (isMultiService) {
    const mainBg = isIncomingEr ? alpha(m.teal, 0.14) : backgroundColor;
    const subCardSurface =
      cardPattern === "dots"
        ? {
            backgroundColor: mainBg,
            backgroundImage: [
              `radial-gradient(${alpha(m.navy, 0.14)} 1px, transparent 1.35px)`,
              `linear-gradient(180deg, ${alpha("#fff", 0.45)} 0%, transparent 100%)`,
            ].join(", "),
            backgroundSize: "17px 17px, 100% 100%",
            backgroundPosition: "0 0, 0 0",
          }
        : cardPattern === "lines"
          ? {
              backgroundColor: mainBg,
              backgroundImage: [
                `repeating-linear-gradient(90deg, ${alpha(accentColor, 0.12)} 0 2px, transparent 2px 13px)`,
                `linear-gradient(180deg, ${alpha("#fff", 0.5)} 0%, transparent 100%)`,
              ].join(", "),
              backgroundSize: "15px 100%, 100% 100%",
              backgroundPosition: "0 0, 0 0",
            }
          : { backgroundColor: mainBg };

    const bodyContent = (
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {timelineLayouts.map((block) => {
          const widthPct = 100 / block.columnCount;
          const leftPct = widthPct * block.column;
          const top = `${block.topRatio * 100}%`;
          const height = `max(${
            block.kind === "service" ? 40 : 16
          }px, ${block.heightRatio * 100}%)`;
          const left = block.columnCount > 1 ? `${leftPct}%` : 0;
          const width = block.columnCount > 1 ? `${widthPct}%` : "100%";

          if (block.kind !== "service") {
            return (
              <Box
                key={block.key}
                title={`${block.name} (${block.start}–${block.end})`}
                sx={{
                  position: "absolute",
                  top,
                  height,
                  left: 0,
                  width: "100%",
                  minHeight: 16,
                  zIndex: 0,
                  borderRadius: "3px",
                  border: `1px dashed ${alpha(accentColor, 0.4)}`,
                  bgcolor: alpha(m.navy, 0.04),
                  display: "flex",
                  alignItems: "center",
                  px: 0.6,
                  pointerEvents: "none",
                }}
              >
                <BodyText
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.52),
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {block.kind === "buffer" ? "Buffer" : "Planning"}
                  {block.name &&
                  block.name !== "Buffer" &&
                  block.name !== "Planning"
                    ? ` · ${block.name}`
                    : ""}{" "}
                  ({block.start}–{block.end})
                </BodyText>
              </Box>
            );
          }

          return (
            <Box
              key={block.key}
              onClick={(event_) => {
                event_.stopPropagation();
                onOpen();
              }}
              sx={{
                position: "absolute",
                top,
                height,
                left,
                width,
                minHeight: 40,
                zIndex: 1,
                boxSizing: "border-box",
                borderRadius: "3px",
                border: `1px solid ${borderColor}`,
                borderLeft:
                  block.column === 0
                    ? `3px solid ${accentColor}`
                    : `1px solid ${borderColor}`,
                borderRight:
                  block.column > 0
                    ? `3px solid ${accentColor}`
                    : `1px solid ${borderColor}`,
                px: 0.55,
                py: 0.4,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: block.column > 0 ? "flex-end" : "flex-start",
                gap: 0.2,
                cursor: "pointer",
                textAlign: block.column > 0 ? "right" : "left",
                ...subCardSurface,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: emphasizeRequest ? 800 : 700,
                  color: "#3B3E45",
                  lineHeight: 1.15,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  width: "100%",
                }}
              >
                {block.name}
              </BodyText>
              <BodyText
                sx={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.72),
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {block.start}–{block.end}
                {(() => {
                  const duration = formatServiceDurationLabel(
                    block.start,
                    block.end,
                  );
                  return duration ? ` • ${duration}` : "";
                })()}
              </BodyText>
              {(() => {
                const memberId = String(block.teamMemberId ?? "").trim();
                const resource = memberId
                  ? teamResources?.find(
                      (item) => String(item.id) === memberId,
                    )
                  : undefined;
                const memberName =
                  firstNameLabel(resource?.name) ||
                  firstNameLabel(block.teamMemberName) ||
                  firstNameLabel(
                    memberId ? teamMemberNameById?.get(memberId) : undefined,
                  );
                if (!memberName) return null;
                const photoSrc = resource?.photoSrc?.trim() || undefined;
                const initials = avatarInitials(
                  memberName,
                  resource?.avatarText,
                );
                const onRight = block.column > 0;
                return (
                  <Stack
                    direction={onRight ? "row-reverse" : "row"}
                    alignItems="center"
                    spacing={0.45}
                    sx={{ minWidth: 0, mt: 0.1, width: "100%" }}
                  >
                    <Avatar
                      src={photoSrc}
                      alt=""
                      sx={{
                        width: 16,
                        height: 16,
                        fontSize: 8,
                        fontWeight: 800,
                        bgcolor: alpha(m.teal, 0.16),
                        color: m.teal,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <BodyText
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.68),
                        lineHeight: 1.1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                      }}
                    >
                      {memberName}
                    </BodyText>
                  </Stack>
                );
              })()}
            </Box>
          );
        })}
      </Box>
    );

    return (
      <Box
        sx={[
          positionSx,
          isTicket
            ? {
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 18,
                  height: 7,
                  borderRadius: "0 0 10px 10px",
                  bgcolor: alpha(m.navy, 0.08),
                  zIndex: 2,
                  pointerEvents: "none",
                },
              }
            : undefined,
          ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
        ]}
      >
        {teamGroup}
        <BookingTimelineCard
          {...sharedCardProps}
          title=""
          timeLabel={`${event.start}–${event.end}`}
          locationLabel={<CalendarLocationLabel location={event.location} />}
          pattern="none"
          backgroundColor={mainBg}
          bodyContent={bodyContent}
          actionRailSide={actionRailSide}
          sx={{
            width: "100%",
            height: cardHeight,
            minHeight: cardHeight,
            borderRadius: isTicket ? "8px" : "4px",
            boxShadow: isTicket
              ? "0 8px 20px rgba(16, 35, 63, 0.12)"
              : undefined,
          }}
          contentSx={
            otherTeamMembers.length
              ? actionRailSide === "start"
                ? { pl: "30px" }
                : { pr: "30px" }
              : undefined
          }
        />
      </Box>
    );
  }

  return (
    <Box
      sx={[
        positionSx,
        isTicket
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 18,
                height: 7,
                borderRadius: "0 0 10px 10px",
                bgcolor: alpha(m.navy, 0.08),
                zIndex: 2,
                pointerEvents: "none",
              },
            }
          : undefined,
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
    >
      {teamGroup}
      <BookingTimelineCard
        {...sharedCardProps}
        title={singleTitle}
        titleLineClamp={
          weekSimple || dense ? 1 : singleTitle.includes(" · ") ? 3 : 2
        }
        timeLabel={singleTimeLabel}
        actionRailSide={actionRailSide}
        sx={{
          width: "100%",
          height: cardHeight,
          minHeight: cardHeight,
          borderRadius: isTicket ? "8px" : "4px",
          boxShadow: isTicket ? "0 8px 20px rgba(16, 35, 63, 0.12)" : undefined,
        }}
        contentSx={
          isTicket
            ? {
                pt: isCompactTicket ? "4px" : "8px",
                pb: isCompactTicket ? "3px" : "5px",
                pl:
                  otherTeamMembers.length && actionRailSide === "start"
                    ? isCompactTicket
                      ? "28px"
                      : "30px"
                    : isCompactTicket
                      ? "6px"
                      : "7px",
                pr:
                  otherTeamMembers.length && actionRailSide === "end"
                    ? isCompactTicket
                      ? "28px"
                      : "30px"
                    : isCompactTicket
                      ? "5px"
                      : "6px",
              }
            : otherTeamMembers.length
              ? actionRailSide === "start"
                ? { pl: "30px" }
                : { pr: "30px" }
              : undefined
        }
        actionRailSx={
          dense
            ? { width: 40 }
            : isTicket
              ? { width: isCompactTicket ? 44 : 52 }
              : undefined
        }
      />
    </Box>
  );
}
