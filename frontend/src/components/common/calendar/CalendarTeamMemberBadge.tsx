"use client";

import * as React from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Avatar, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

export type CalendarTeamMemberBadgeProps = {
  name: string;
  avatarText: string;
  photoSrc?: string | null;
  bookedPercent: number;
  selected?: boolean;
  onClick?: (anchor: HTMLElement) => void;
};

export default function CalendarTeamMemberBadge({
  name,
  avatarText,
  photoSrc,
  bookedPercent,
  selected = false,
  onClick,
}: CalendarTeamMemberBadgeProps) {
  const m = useTheme().palette.mollure;
  const percent = Math.max(0, Math.min(100, Math.round(bookedPercent)));
  const initial = (avatarText || name).trim().slice(0, 1).toUpperCase() || "T";

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${percent}% booked`}
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
        px: 1.15,
        py: 0.5,
        borderRadius: "999px",
        bgcolor: selected ? alpha(m.teal, 0.12) : "transparent",
        cursor: "pointer",
        flexShrink: 1,
        minWidth: 0,
        width: "100%",
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
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.2}
          sx={{ minWidth: 0 }}
        >
          <BodyText
            sx={{
              fontWeight: 600,
              fontSize: 11.5,
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
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.6}
          sx={{ mt: 0.35 }}
        >
          <Box
            sx={{
              height: 3,
              width: "100%",
              maxWidth: 62,
              minWidth: 24,
              borderRadius: "999px",
              bgcolor: m.fxGrayF2F4F7,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${percent}%`,
                bgcolor: m.teal,
                borderRadius: "999px",
                transition: "width 0.2s ease",
              }}
            />
          </Box>
          <BodyText
            sx={{
              fontSize: 9,
              fontWeight: 800,
              color: selected ? alpha(m.tealDark, 0.72) : alpha(m.navy, 0.48),
              lineHeight: 1,
            }}
          >
            {percent}%
          </BodyText>
        </Stack>
      </Box>
    </Box>
  );
}
