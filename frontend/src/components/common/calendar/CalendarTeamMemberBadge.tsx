"use client";

import * as React from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Avatar, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

export type TeamMemberLoadBarProps = {
  /** null = no schedule that day → empty track, no fill / no % utilization. */
  bookedPercent: number | null;
  fullWidth?: boolean;
  selected?: boolean;
};

/** Thin busy÷available track used by calendar badges and listing team rows. */
export function TeamMemberLoadBar({
  bookedPercent,
  fullWidth = false,
  selected = false,
}: TeamMemberLoadBarProps) {
  const m = useTheme().palette.mollure;
  const hasHours = bookedPercent != null;
  const percent = hasHours
    ? Math.max(0, Math.min(100, Math.round(bookedPercent)))
    : 0;

  return (
    <Stack direction="row" alignItems="center" spacing={0.6} sx={{ minWidth: 0, width: "100%" }}>
      <Box
        sx={{
          height: 3,
          width: "100%",
          maxWidth: fullWidth ? "100%" : 62,
          minWidth: 24,
          borderRadius: "999px",
          bgcolor: m.fxGrayF2F4F7,
          overflow: "hidden",
          flex: fullWidth ? 1 : undefined,
        }}
      >
        {hasHours ? (
          <Box
            sx={{
              height: "100%",
              width: `${percent}%`,
              bgcolor: m.teal,
              borderRadius: "999px",
              transition: "width 0.2s ease",
            }}
          />
        ) : null}
      </Box>
      {hasHours ? (
        <BodyText
          sx={{
            fontSize: 9,
            fontWeight: 800,
            color: selected ? alpha(m.tealDark, 0.72) : alpha(m.navy, 0.48),
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {percent}%
        </BodyText>
      ) : null}
    </Stack>
  );
}

export type CalendarTeamMemberBadgeProps = {
  name: string;
  avatarText: string;
  photoSrc?: string | null;
  /** null = no schedule that day → show empty track, no fill / no % utilization. */
  bookedPercent: number | null;
  selected?: boolean;
  /** Stretch across a day-view resource column instead of a compact centered pill. */
  fullWidth?: boolean;
  onClick?: (anchor: HTMLElement) => void;
};

export default function CalendarTeamMemberBadge({
  name,
  avatarText,
  photoSrc,
  bookedPercent,
  selected = false,
  fullWidth = false,
  onClick,
}: CalendarTeamMemberBadgeProps) {
  const m = useTheme().palette.mollure;
  const hasHours = bookedPercent != null;
  const percent = hasHours
    ? Math.max(0, Math.min(100, Math.round(bookedPercent)))
    : 0;
  const initial = (avatarText || name).trim().slice(0, 1).toUpperCase() || "T";

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={
        hasHours ? `${name}, ${percent}% booked` : `${name}, no schedule`
      }
      aria-pressed={selected}
      onClick={(event) => onClick?.(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event.currentTarget);
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.65,
        px: fullWidth ? 1.25 : 1.15,
        py: fullWidth ? 0.65 : 0.5,
        borderRadius: fullWidth ? "10px" : "999px",
        bgcolor: selected ? alpha(m.teal, 0.12) : "transparent",
        cursor: "pointer",
        flexShrink: 1,
        minWidth: 0,
        width: fullWidth ? "100%" : "auto",
        maxWidth: "100%",
        boxSizing: "border-box",
        transition: "background-color 0.15s ease",
        "&:hover": {
          bgcolor: selected ? alpha(m.teal, 0.16) : alpha(m.teal, 0.08),
        },
      }}
    >
      <Avatar
        src={photoSrc || undefined}
        alt=""
        sx={{
          width: 22,
          height: 22,
          bgcolor: alpha(m.teal, 0.14),
          color: m.teal,
          fontWeight: 700,
          fontSize: 9.5,
          flexShrink: 0,
        }}
      >
        {initial}
      </Avatar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flex: fullWidth ? 1 : undefined,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.2}
          sx={{ minWidth: 0 }}
        >
          <BodyText
            sx={{
              fontWeight: 600,
              fontSize: fullWidth ? 12.5 : 11.5,
              color: selected ? m.tealDark : alpha(m.navy, 0.78),
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </BodyText>
          <KeyboardArrowDownRoundedIcon
            sx={{
              fontSize: 15,
              color: selected ? m.tealDark : alpha(m.navy, 0.45),
              flexShrink: 0,
            }}
          />
        </Stack>
        <Box sx={{ mt: 0.35 }}>
          <TeamMemberLoadBar
            bookedPercent={bookedPercent}
            fullWidth={fullWidth}
            selected={selected}
          />
        </Box>
      </Box>
    </Box>
  );
}
