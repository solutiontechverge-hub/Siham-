"use client";

import * as React from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Avatar, Box, ButtonBase, Chip, Popover, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { BodyText } from "../../ui/typography";
import {
  professionalCalendarDisplayStatus,
  professionalCalendarStatusLabel,
  statusChipSx,
} from "./bookingStatus";

export type CalendarSplitScreenCandidate = {
  id: string;
  name: string;
  avatarText?: string;
  photoSrc?: string;
};

export type CalendarTeamMemberBookingsPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  memberName: string;
  bookings: readonly CalendarEvent[];
  showDate?: boolean;
  showEditAvailability?: boolean;
  editAvailabilityDisabled?: boolean;
  splitScreenEnabled?: boolean;
  splitScreenActive?: boolean;
  splitScreenCandidates?: readonly CalendarSplitScreenCandidate[];
  onClose: () => void;
  onSelectBooking: (event: CalendarEvent) => void;
  onViewProfile: () => void;
  onEditAvailability: () => void;
  onSplitScreenWith?: (memberId: string) => void;
  onDiscardSplitScreen?: () => void;
};

export default function CalendarTeamMemberBookingsPopover({
  open,
  anchorEl,
  memberName,
  bookings,
  showDate = false,
  showEditAvailability = false,
  editAvailabilityDisabled = false,
  splitScreenEnabled = false,
  splitScreenActive = false,
  splitScreenCandidates = [],
  onClose,
  onSelectBooking,
  onViewProfile,
  onEditAvailability,
  onSplitScreenWith,
  onDiscardSplitScreen,
}: CalendarTeamMemberBookingsPopoverProps) {
  const m = useTheme().palette.mollure;
  const [splitMenuOpen, setSplitMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) setSplitMenuOpen(false);
  }, [open]);

  const showSplitActions =
    splitScreenEnabled &&
    (splitScreenActive || splitScreenCandidates.length > 0);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          mt: 0.75,
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          boxShadow: "0 8px 24px rgba(16, 35, 63, 0.12)",
          minWidth: 260,
          maxWidth: 360,
          py: 0.75,
          px: 0.5,
        },
      }}
    >
      <BodyText
        sx={{
          px: 1,
          pt: 0.35,
          pb: 0.65,
          fontWeight: 800,
          fontSize: 11,
          color: alpha(m.navy, 0.48),
          letterSpacing: 0.2,
        }}
      >
        {memberName ? `${memberName} bookings` : "Bookings"}
      </BodyText>

      {bookings.length === 0 ? (
        <BodyText
          sx={{
            px: 1,
            py: 1.25,
            fontSize: 12,
            fontWeight: 600,
            color: alpha(m.navy, 0.52),
            lineHeight: 1.4,
          }}
        >
          No bookings available for this team member on the selected date.
        </BodyText>
      ) : (
        <Stack
          sx={{
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {bookings.map((booking) => {
            const clientName = booking.showClientName?.trim() || "Client";
            const statusLabel = professionalCalendarStatusLabel(booking);
            return (
              <ButtonBase
                key={booking.id}
                onClick={() => onSelectBooking(booking)}
                sx={{
                  width: "100%",
                  px: 1,
                  py: 0.85,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 1,
                  borderRadius: "8px",
                  textAlign: "left",
                  "&:hover": { bgcolor: alpha(m.teal, 0.05) },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <BodyText
                    sx={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: alpha(m.navy, 0.82),
                      lineHeight: 1.3,
                    }}
                  >
                    {booking.start} – {booking.end}
                    {showDate ? ` · ${booking.date}` : ""}
                  </BodyText>
                  <BodyText
                    sx={{
                      mt: 0.15,
                      fontWeight: 600,
                      fontSize: 11.5,
                      color: alpha(m.navy, 0.62),
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {clientName}
                    {booking.title ? ` · ${booking.title}` : ""}
                  </BodyText>
                </Box>
                <Chip
                  size="small"
                  label={statusLabel}
                  sx={{
                    ...statusChipSx(professionalCalendarDisplayStatus(booking)),
                    height: 24,
                    minHeight: 24,
                    maxHeight: 24,
                    boxSizing: "border-box",
                    flexShrink: 0,
                    fontWeight: 600,
                    border: "none",
                    borderWidth: 0,
                    "& .MuiChip-label": {
                      px: 1.1,
                      py: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: "24px",
                    },
                  }}
                />
              </ButtonBase>
            );
          })}
        </Stack>
      )}

      <Box sx={{ my: 0.5, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }} />

      <ButtonBase
        onClick={onViewProfile}
        sx={{
          width: "100%",
          px: 1,
          py: 0.75,
          justifyContent: "flex-start",
          borderRadius: "8px",
        }}
      >
        <BodyText
          sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}
        >
          View profile
        </BodyText>
      </ButtonBase>
      {showEditAvailability ? (
        <ButtonBase
          disabled={editAvailabilityDisabled}
          onClick={onEditAvailability}
          sx={{
            width: "100%",
            px: 1,
            py: 0.75,
            justifyContent: "flex-start",
            borderRadius: "8px",
            opacity: editAvailabilityDisabled ? 0.5 : 1,
          }}
        >
          <BodyText
            sx={{ fontWeight: 700, fontSize: 11.5, color: alpha(m.navy, 0.78) }}
          >
            Edit availability
          </BodyText>
        </ButtonBase>
      ) : null}

      {showSplitActions ? (
        <>
          <Box
            sx={{ my: 0.5, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }}
          />
          {splitScreenActive ? (
            <ButtonBase
              onClick={onDiscardSplitScreen}
              sx={{
                width: "100%",
                px: 1,
                py: 0.75,
                justifyContent: "flex-start",
                borderRadius: "8px",
              }}
            >
              <BodyText
                sx={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  color: alpha(m.navy, 0.78),
                }}
              >
                Discard split screen
              </BodyText>
            </ButtonBase>
          ) : (
            <>
              <ButtonBase
                onClick={() => setSplitMenuOpen((current) => !current)}
                sx={{
                  width: "100%",
                  px: 1,
                  py: 0.75,
                  justifyContent: "space-between",
                  borderRadius: "8px",
                }}
              >
                <BodyText
                  sx={{
                    fontWeight: 700,
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  Split screen with
                </BodyText>
                {splitMenuOpen ? (
                  <ExpandMoreRoundedIcon
                    sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }}
                  />
                ) : (
                  <ChevronRightRoundedIcon
                    sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }}
                  />
                )}
              </ButtonBase>
              {splitMenuOpen ? (
                <Stack sx={{ pb: 0.25 }}>
                  {splitScreenCandidates.map((candidate) => (
                    <ButtonBase
                      key={candidate.id}
                      onClick={() => onSplitScreenWith?.(candidate.id)}
                      sx={{
                        width: "100%",
                        px: 1,
                        py: 0.7,
                        justifyContent: "flex-start",
                        gap: 0.75,
                        borderRadius: "8px",
                        "&:hover": { bgcolor: alpha(m.teal, 0.05) },
                      }}
                    >
                      <Avatar
                        src={candidate.photoSrc}
                        sx={{
                          width: 22,
                          height: 22,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: alpha(m.navy, 0.08),
                          color: alpha(m.navy, 0.72),
                        }}
                      >
                        {candidate.avatarText?.trim()?.[0]?.toUpperCase() ||
                          candidate.name?.trim()?.[0]?.toUpperCase() ||
                          "T"}
                      </Avatar>
                      <BodyText
                        sx={{
                          fontWeight: 700,
                          fontSize: 11.5,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        {candidate.name}
                      </BodyText>
                    </ButtonBase>
                  ))}
                </Stack>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Popover>
  );
}
