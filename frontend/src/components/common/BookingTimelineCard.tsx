"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Box, Chip, IconButton, Stack, Tooltip, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

export type BookingTimelineCardPattern = "lines" | "dots" | "none";

export type BookingTimelineCardStatus = {
  label: React.ReactNode;
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
};

export type BookingTimelineCardProfileAction = BookingTimelineCardAction & {
  name?: React.ReactNode;
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
  calendarAction?: BookingTimelineCardAction;
  notesAction?: BookingTimelineCardAction;
  messageAction?: BookingTimelineCardAction & { count?: number };
  profileAction?: BookingTimelineCardProfileAction;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actionRailSx?: SxProps<Theme>;
  titleLineClamp?: number;
};

function resolvePattern(pattern: BookingTimelineCardPattern, accentColor: string, bg: string, navy: string) {
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

function renderIconAction(action: BookingTimelineCardAction | undefined, fallbackIcon: React.ReactNode) {
  if (!action?.show) return null;

  return (
    <Tooltip title={action.tooltip ?? ""} placement="left">
      <IconButton
        size="small"
        onClick={stopCardClick(action.onClick)}
        sx={(theme) => ({
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
      </IconButton>
    </Tooltip>
  );
}

export default function BookingTimelineCard({
  accentColor,
  actionRailSx,
  backgroundColor,
  borderColor,
  calendarAction,
  contentSx,
  idLabel,
  locationLabel,
  messageAction,
  notesAction,
  onClick,
  pattern = "lines",
  profileAction,
  requestBadge = false,
  status,
  sx,
  timeLabel,
  title,
  titleLineClamp = 2,
}: BookingTimelineCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const lineColor = accentColor ?? m.teal;
  const bg = backgroundColor ?? alpha(lineColor, 0.08);
  const resolvedBorder = borderColor ?? alpha(lineColor, 0.34);
  const surface = resolvePattern(pattern, lineColor, bg, m.navy);
  const requestBadgeOptions = typeof requestBadge === "object" ? requestBadge : {};
  const showRequestBadge = Boolean(requestBadge);
  const showProfile = profileAction?.show !== false && Boolean(profileAction?.name || profileAction?.icon);
  const visibleMessageAction = messageAction?.show ? messageAction : null;

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
          borderLeft: `4px solid ${lineColor}`,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 66px",
          cursor: onClick ? "pointer" : "default",
          boxShadow: "0 3px 10px rgba(16, 35, 63, 0.045)",
          transition: "box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease",
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
            height: 18,
            overflow: "hidden",
          }}
        >
          <BodyText sx={{ fontSize: 12, fontWeight: 400, color: "#3B3E45", lineHeight: "16px", whiteSpace: "nowrap" }}>
            {idLabel}
          </BodyText>
          {status ? (
            <Chip
              size="small"
              label={status.label}
              sx={[
                {
                  height: 18,
                  borderRadius: "5px",
                  fontSize: 8.5,
                  fontWeight: 500,
                  border: "1px solid",
                  "& .MuiChip-label": { px: 0.85 },
                },
                ...(Array.isArray(status.sx) ? status.sx : [status.sx]),
              ]}
            />
          ) : null}
          {showRequestBadge ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.35}
              sx={[
                {
                  height: 17,
                  borderRadius: "999px",
                  border: `1px solid ${alpha(m.navy, 0.25)}`,
                  bgcolor: alpha("#fff", 0.72),
                  color: alpha(m.navy, 0.78),
                  px: 0.55,
                  pointerEvents: "auto",
                },
                ...(Array.isArray(requestBadgeOptions.sx) ? requestBadgeOptions.sx : [requestBadgeOptions.sx]),
              ]}
            >
              <BodyText sx={{ fontSize: 9.5, fontWeight: 700, color: "inherit", lineHeight: 1 }}>
                {requestBadgeOptions.label ?? "BR"}
              </BodyText>
              {requestBadgeOptions.showAcceptedIcon !== false ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 12, color: m.success }} />
              ) : null}
              {requestBadgeOptions.showPaymentIcon !== false ? (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${alpha(m.navy, 0.35)}`,
                    color: alpha(m.navy, 0.56),
                    bgcolor: alpha("#fff", 0.7),
                  }}
                >
                  <EuroRoundedIcon sx={{ fontSize: 8 }} />
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <BodyText
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#3B3E45",
            lineHeight: "16px",
            overflow: "hidden",
            position: "absolute",
            top: 28,
            left: 8,
            right: 6,
            display: "-webkit-box",
            WebkitLineClamp: titleLineClamp,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </BodyText>
        <BodyText
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#3B3E45",
            lineHeight: "16px",
            position: "absolute",
            top: 44,
            left: 8,
            right: 6,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {timeLabel}
        </BodyText>
        {locationLabel ? (
          <Stack
            direction="row"
            spacing="2px"
            alignItems="center"
            sx={{
              position: "absolute",
              left: 8,
              bottom: 1,
              height: 16,
            }}
          >
            <LocationOnRoundedIcon sx={{ fontSize: 14, color: alpha(m.navy, 0.62), flexShrink: 0 }} />
            <BodyText sx={{ fontSize: 12, fontWeight: 400, color: "#667085", lineHeight: "16px" }}>
              {locationLabel}
            </BodyText>
          </Stack>
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
            borderLeft: `1px solid ${alpha(m.navy, 0.06)}`,
            bgcolor: alpha("#fff", 0.24),
          },
          ...(Array.isArray(actionRailSx) ? actionRailSx : [actionRailSx]),
        ]}
      >
        <Box sx={{ display: "none" }}>
          {renderIconAction(calendarAction, <CalendarMonthRoundedIcon sx={{ fontSize: 13 }} />)}
          {renderIconAction(notesAction, <StickyNote2OutlinedIcon sx={{ fontSize: 13 }} />)}
        </Box>
        <Stack alignItems="center" justifyContent="center" spacing={0.35} sx={{ minWidth: 0, height: "100%" }}>
          {showProfile ? (
            <Tooltip title={profileAction?.tooltip ?? ""} placement="left">
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
                  "&:hover": profileAction?.onClick ? { bgcolor: alpha(m.navy, 0.06) } : undefined,
                }}
              >
                {profileAction?.icon ?? <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.58), flexShrink: 0 }} />}
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
            <Tooltip title={visibleMessageAction.tooltip ?? ""} placement="left">
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
                  "&:hover": visibleMessageAction.onClick ? { bgcolor: alpha(m.navy, 0.06), color: m.navy } : undefined,
                }}
              >
                {visibleMessageAction.icon ?? <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />}
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
