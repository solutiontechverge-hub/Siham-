"use client";

import * as React from "react";
import { Avatar, AvatarGroup, Box, Popover, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import type { CalendarCardTeamMemberGroup } from "./calendarBookingCardServices";

export function BookingCardTeamGroupIcon({
  members,
  onSelectMember,
  side = "end",
  totalMemberCount,
  bookingId,
}: {
  members: readonly CalendarCardTeamMemberGroup[];
  onSelectMember?: (partnerId: string) => void;
  side?: "start" | "end";
  /** Total assignees on the booking (current lane + others). */
  totalMemberCount?: number;
  /** Same ref as card header ID tooltip (`bookingCode` / extracted id). */
  bookingId?: string;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const closeTimer = React.useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openPopover = (el: HTMLElement) => {
    clearCloseTimer();
    setAnchorEl(el);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setAnchorEl(null), 160);
  };

  React.useEffect(
    () => () => {
      clearCloseTimer();
    },
    [],
  );

  if (!members.length) return null;

  const assigneeCount = Math.max(
    2,
    totalMemberCount ?? members.length + 1,
  );
  const hoverTitle = `This booking is divided across ${assigneeCount} team members`;

  return (
    <>
      <Tooltip
        title={open ? "" : hoverTitle}
        placement="top"
        enterDelay={280}
      >
        <Box
          onMouseEnter={(event) => openPopover(event.currentTarget)}
          onMouseLeave={scheduleClose}
          onClick={(event) => {
            event.stopPropagation();
            openPopover(event.currentTarget);
          }}
          sx={{
            position: "absolute",
            top: 4,
            ...(side === "start" ? { left: 6 } : { right: 6 }),
            zIndex: 3,
            pointerEvents: "auto",
            cursor: "pointer",
            lineHeight: 0,
          }}
        >
          <AvatarGroup
            max={3}
            sx={{
              "& .MuiAvatar-root": {
                width: 20,
                height: 20,
                fontSize: 9,
                fontWeight: 800,
                border: `1.5px solid ${alpha("#fff", 0.95)}`,
                bgcolor: alpha(m.teal, 0.16),
                color: m.teal,
              },
            }}
          >
            {members.map((member) => (
              <Avatar
                key={member.id}
                src={member.photoSrc || undefined}
                alt={member.name}
              >
                {member.avatarText.slice(0, 1).toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
        </Box>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            onMouseEnter: clearCloseTimer,
            onMouseLeave: scheduleClose,
            sx: {
              mt: 0.5,
              px: 1.1,
              py: 1,
              minWidth: 168,
              maxWidth: 240,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 10px 28px rgba(16, 35, 63, 0.14)",
            },
          },
        }}
        sx={{ pointerEvents: "none" }}
      >
        <Stack spacing={0.85} sx={{ pointerEvents: "auto" }}>
          {bookingId ? (
            <BodyText
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.58),
                lineHeight: 1.2,
                px: 0.4,
                letterSpacing: "0.02em",
                userSelect: "all",
              }}
            >
              ID {bookingId}
            </BodyText>
          ) : null}
          {members.map((member) => (
            <Box
              key={member.id}
              component="button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setAnchorEl(null);
                onSelectMember?.(member.id);
              }}
              sx={{
                all: "unset",
                cursor: onSelectMember ? "pointer" : "default",
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                borderRadius: "8px",
                px: 0.4,
                py: 0.35,
                "&:hover": onSelectMember
                  ? { bgcolor: alpha(m.teal, 0.08) }
                  : undefined,
              }}
            >
              <Avatar
                src={member.photoSrc || undefined}
                sx={{
                  width: 22,
                  height: 22,
                  fontSize: 9.5,
                  fontWeight: 800,
                  bgcolor: alpha(m.teal, 0.14),
                  color: m.teal,
                  flexShrink: 0,
                }}
              >
                {member.avatarText.slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <BodyText
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                    lineHeight: 1.2,
                  }}
                >
                  {member.name}
                </BodyText>
                {member.services.map((service, index) => (
                  <BodyText
                    key={`${member.id}-${service.name}-${index}`}
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: alpha(m.navy, 0.58),
                      lineHeight: 1.25,
                      mt: 0.15,
                    }}
                  >
                    {service.name}
                    {service.start && service.end
                      ? ` · ${service.start}–${service.end}`
                      : ""}
                  </BodyText>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Popover>
    </>
  );
}
