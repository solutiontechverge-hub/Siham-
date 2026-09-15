"use client";

import * as React from "react";
import { Avatar, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureMetaDot } from "./MollureMetaDot";
import { BodyText } from "../ui/typography";

type ServiceSummaryMetaLineProps = {
  timeRange?: string;
  durationLabel?: string;
  staffName?: string;
  /** Profile photo when available; otherwise initials are shown. */
  staffPhotoSrc?: string | null;
  /** Override initials (defaults from staffName). */
  staffInitials?: string;
  /** When set, staff row is clickable (e.g. open team member profile). */
  onStaffClick?: () => void;
};

function initialsFromName(name: string, override?: string) {
  const fromOverride = override?.trim();
  if (fromOverride) return fromOverride.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function ServiceSummaryMetaLine({
  timeRange,
  durationLabel,
  staffName,
  staffPhotoSrc,
  staffInitials,
  onStaffClick,
}: ServiceSummaryMetaLineProps) {
  const m = useTheme().palette.mollure;
  const textSx = {
    m: 0,
    fontSize: 10.5,
    fontWeight: 700,
    color: alpha(m.navy, 0.48),
  };
  const resolvedStaff = staffName?.trim() || "";
  const photo = staffPhotoSrc?.trim() || undefined;
  const clickable = Boolean(onStaffClick && resolvedStaff);

  return (
    <Stack spacing={0.35} sx={{ mt: 0.25, minWidth: 0 }}>
      {timeRange || durationLabel ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.55}
          sx={{ flexWrap: "wrap", minWidth: 0 }}
        >
          {timeRange ? <BodyText sx={textSx}>{timeRange}</BodyText> : null}
          {timeRange && durationLabel ? <MollureMetaDot /> : null}
          {durationLabel ? (
            <BodyText sx={textSx}>{durationLabel}</BodyText>
          ) : null}
        </Stack>
      ) : null}

      {resolvedStaff ? (
        <Stack
          component={clickable ? "button" : "div"}
          type={clickable ? "button" : undefined}
          direction="row"
          alignItems="center"
          spacing={0.55}
          onClick={
            clickable
              ? (event: React.MouseEvent) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onStaffClick?.();
                }
              : undefined
          }
          onMouseDown={
            clickable
              ? (event: React.MouseEvent) => event.stopPropagation()
              : undefined
          }
          sx={{
            minWidth: 0,
            width: "fit-content",
            maxWidth: "100%",
            p: 0,
            m: 0,
            border: "none",
            bgcolor: "transparent",
            cursor: clickable ? "pointer" : "default",
            textAlign: "left",
            borderRadius: "999px",
            "&:hover": clickable
              ? {
                  "& .service-staff-name": {
                    color: m.teal,
                  },
                }
              : undefined,
          }}
        >
          <Avatar
            src={photo}
            alt=""
            sx={{
              width: 18,
              height: 18,
              fontSize: 8,
              fontWeight: 800,
              bgcolor: alpha(m.teal, 0.16),
              color: m.teal,
              flexShrink: 0,
            }}
          >
            {initialsFromName(resolvedStaff, staffInitials)}
          </Avatar>
          <BodyText
            className="service-staff-name"
            sx={{
              ...textSx,
              color: alpha(m.navy, 0.62),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              transition: "color 0.15s ease",
            }}
          >
            {resolvedStaff}
          </BodyText>
        </Stack>
      ) : null}
    </Stack>
  );
}
