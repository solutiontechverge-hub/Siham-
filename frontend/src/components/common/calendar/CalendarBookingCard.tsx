"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import BookingTimelineCard from "../BookingTimelineCard";
import { useProfessionalMessagingUnread } from "../messaging/useProfessionalMessagingUnread";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extractBookingId } from "./calendar.utils";
import {
  getBookingScenarioIndicators,
  calendarBookingStatusLabel,
  scenarioIndicatorDisplayLabel,
  statusCardAccent,
  statusChipSxWithOverride,
  isBookingRequestAccepted,
  isBookingRequestRejected,
} from "./bookingStatus";
import { resolveBookingResponseIndicators } from "./bookingResponseStatus";
import { resolveProfessionalBookingRequestDirection } from "./BookingRequestBadge";
import {
  resolveCalendarPrepaymentStatus,
  toPrepaymentIconVariant,
} from "./prepaymentStatus";
import { useBookingPaymentDueMeta } from "./resolveBookingPaymentDueMeta";
import { hasUnseenBookingUpdate } from "./bookingUpdateSeen";
import { sanitizeInternalNoteText } from "./bookingEventDetails";
import BookingIdTooltipLabel from "./BookingIdTooltipLabel";

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
  containerSx?: SxProps<Theme>;
  onOpen: () => void;
  onOpenCalendar: () => void;
  onOpenNotes: () => void;
  onOpenClient: (anchorEl: HTMLElement) => void;
  onOpenMessages: () => void;
};

function scenarioBadgeResponseIndicators(
  label: ReturnType<typeof getBookingScenarioIndicators>[number],
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
  containerSx,
  onOpen,
  onOpenCalendar,
  onOpenNotes,
  onOpenClient,
  onOpenMessages,
}: CalendarBookingCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isTicket = variant === "ticket";
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
  const cardHeight = isTicket
    ? Math.max(34, height)
    : Math.max(incomingErNote ? 96 : 78, height);
  const isCompactTicket = dense || (isTicket && cardHeight < 48);
  const bookingRef = event.bookingCode ?? extractBookingId(event.id);
  const unreadCount = useProfessionalMessagingUnread(bookingRef);
  const accent = statusCardAccent(event.status, statusColor);
  const scenarioIndicators = getBookingScenarioIndicators(event);
  const responseIndicators = resolveBookingResponseIndicators(event);
  const prepaymentStatus = resolveCalendarPrepaymentStatus(event);
  const prepaymentIconVariant = prepaymentStatus
    ? toPrepaymentIconVariant(prepaymentStatus)
    : undefined;
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
    : event.status === "Requested"
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
    (event.bookingScenario === "BR" && event.status === "Requested");
  const showUpdated =
    event.bookingScenario !== "EBR" &&
    event.bookingScenario !== "ER" &&
    event.status !== "Requested" &&
    hasUnseenBookingUpdate({
      viewer: "professional",
      bookingRef,
      updatedAt: event.updatedAt,
      lastEditedBy: event.details?.lastEditedBy ?? null,
    });

  return (
    <Box
      sx={[
        positioned
          ? {
              position: "absolute",
              top,
              left,
              right,
              height: cardHeight,
              minHeight: cardHeight,
              zIndex: 10,
            }
          : {
              position: "relative",
              width: "100%",
              height: cardHeight,
              minHeight: cardHeight,
            },
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
      <BookingTimelineCard
        idLabel={<BookingIdTooltipLabel bookingId={bookingRef} />}
        title={event.title}
        titleBold={emphasizeRequest}
        timeLabel={dense ? "" : `(${event.start} to ${event.end})`}
        locationLabel={event.location}
        notePreview={
          incomingErNote
            ? `Note from client: ${incomingErNote}`
            : null
        }
        showUpdated={showUpdated}
        status={{
          label: calendarBookingStatusLabel(event),
          sx: {
            ...statusChipSxWithOverride(event.status, statusColor),
            ...(emphasizeRequest ? { fontWeight: 900 } : null),
          },
        }}
        accentColor={accentColor}
        borderColor={borderColor}
        backgroundColor={
          isIncomingEr ? alpha(m.teal, 0.14) : backgroundColor
        }
        pattern={cardPattern}
        scenarioBadges={[
          ...(event.clientKind === "company" ||
          event.details?.clientKind === "company"
            ? [
                {
                  label: "CC",
                  bold: true,
                  sx: {
                    border: `1px solid ${alpha(m.teal, 0.45)}`,
                    bgcolor: alpha(m.teal, 0.16),
                    color: m.teal,
                  },
                },
              ]
            : []),
          ...scenarioIndicators
            .filter((indicator) => indicator !== "E")
            .map((indicator) => ({
          label: scenarioIndicatorDisplayLabel(indicator),
          showRequestSentIcon: indicator === "BR",
          requestDirection:
            indicator === "BR" || indicator === "ER"
              ? resolveProfessionalBookingRequestDirection(event)
              : undefined,
          requestAccepted: indicator === "BR" && isBookingRequestAccepted(event),
          requestRejected: indicator === "BR" && isBookingRequestRejected(event),
          responseIndicators:
            indicator === "EBR"
              ? scenarioBadgeResponseIndicators(indicator, responseIndicators)
              : [],
          prepaymentStatus:
            indicator === "EBR"
              ? prepaymentIconVariant === "pending"
                ? undefined
                : prepaymentIconVariant
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
        ]}
        prepaymentStatus={prepaymentIconVariant}
        paymentDue={
          paymentDueMeta
            ? {
                label: paymentDueMeta.reissued
                  ? "Reissue Invoice"
                  : "Payment Due",
                dateLabel: paymentDueMeta.dateLabel,
                showIcon: true,
              }
            : null
        }
        // Prepayment pending already covered by prepaymentStatus — strip duplicate
        // waiting_for_prepayment / prepaid / refund icons from response list.
        responseIndicators={(() => {
          const raw =
            scenarioIndicators.includes("BR")
              ? responseIndicators
              : scenarioIndicators.length
                ? undefined
                : responseIndicators;
          if (!raw?.length) return raw;
          const skip = new Set<string>();
          if (prepaymentIconVariant === "pending") skip.add("waiting_for_prepayment");
          if (prepaymentIconVariant === "confirmed") skip.add("prepaid");
          if (prepaymentIconVariant === "canceled_or_invalid") {
            skip.add("refund_pending");
          }
          return raw.filter((item) => !skip.has(item));
        })()}
        titleLineClamp={dense ? 1 : 1}
        calendarAction={{
          show: !isTicket && !dense,
          tooltip: "Open calendar",
          onClick: onOpenCalendar,
        }}
        notesAction={{
          show: hasNote,
          tooltip: incomingErNote
            ? "Edit request note"
            : "Note added",
          onClick: onOpenNotes,
          count: hasNote ? 1 : undefined,
        }}
        profileAction={{
          show: true,
          name: event.showClientName ?? "Client",
          tooltip: `Open profile: ${event.showClientName ?? "Client"}`,
          onClick: (e) => onOpenClient(e.currentTarget as HTMLElement),
        }}
        messageAction={{
          show: true,
          count: unreadCount > 0 ? unreadCount : undefined,
          tooltip: `Messages: ${event.showClientName ?? "Client"}`,
          onClick: onOpenMessages,
        }}
        onClick={onOpen}
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
                pl: isCompactTicket ? "6px" : "7px",
                pr: isCompactTicket ? "5px" : "6px",
              }
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
