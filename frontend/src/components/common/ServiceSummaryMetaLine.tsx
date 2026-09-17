"use client";

import * as React from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureMetaDot } from "./MollureMetaDot";
import { BodyText } from "../ui/typography";

export type ServiceSummaryStaffOption = {
  id: string;
  name: string;
  photoSrc?: string | null;
  avatarText?: string;
  disabled?: boolean;
  tooltip?: string;
};

type ServiceSummaryMetaLineProps = {
  timeRange?: string;
  durationLabel?: string;
  staffName?: string;
  /** Current assignee id (menu selection highlight). */
  staffId?: string;
  /** Profile photo when available; otherwise initials are shown. */
  staffPhotoSrc?: string | null;
  /** Override initials (defaults from staffName). */
  staffInitials?: string;
  /** When set, avatar/name opens team member profile. */
  onStaffClick?: () => void;
  /** Available assignees for the service window (dropdown). */
  staffOptions?: readonly ServiceSummaryStaffOption[];
  /** Reassign via dropdown (chevron only — does not replace profile click). */
  onStaffChange?: (staffId: string) => void;
};

function initialsFromName(name: string, override?: string) {
  const fromOverride = override?.trim();
  if (fromOverride) return fromOverride.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function firstName(value: string) {
  const name = value.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

export function ServiceSummaryMetaLine({
  timeRange,
  durationLabel,
  staffName,
  staffId,
  staffPhotoSrc,
  staffInitials,
  onStaffClick,
  staffOptions,
  onStaffChange,
}: ServiceSummaryMetaLineProps) {
  const m = useTheme().palette.mollure;
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const textSx = {
    m: 0,
    fontSize: 10.5,
    fontWeight: 700,
    color: alpha(m.navy, 0.48),
  };
  const resolvedStaff = staffName?.trim() || "";
  const photo = staffPhotoSrc?.trim() || undefined;
  const clickable = Boolean(onStaffClick && resolvedStaff);
  const canPick =
    Boolean(onStaffChange) && Boolean(staffOptions && staffOptions.length > 0);

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

      {resolvedStaff || canPick ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.15}
          sx={{ minWidth: 0, width: "fit-content", maxWidth: "100%" }}
        >
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
                width: 20,
                height: 20,
                fontSize: 9,
                fontWeight: 800,
                bgcolor: alpha(m.teal, 0.16),
                color: m.teal,
                flexShrink: 0,
              }}
            >
              {initialsFromName(resolvedStaff || "?", staffInitials)}
            </Avatar>
            <BodyText
              className="service-staff-name"
              sx={{
                m: 0,
                fontSize: 12.5,
                fontWeight: 800,
                color: alpha(m.navy, 0.78),
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "color 0.15s ease",
              }}
            >
              {resolvedStaff || "Unassigned"}
            </BodyText>
          </Stack>

          {canPick ? (
            <>
              <IconButton
                size="small"
                aria-label="Change team member"
                aria-haspopup="menu"
                aria-expanded={Boolean(menuAnchor)}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setMenuAnchor(event.currentTarget);
                }}
                sx={{
                  p: 0.15,
                  color: alpha(m.navy, 0.45),
                  "&:hover": { color: m.teal, bgcolor: alpha(m.teal, 0.08) },
                }}
              >
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                onClick={(event) => event.stopPropagation()}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 0.5,
                      minWidth: 180,
                      borderRadius: "10px",
                      boxShadow: "0 12px 32px rgba(16,35,63,0.14)",
                    },
                  },
                }}
              >
                {(staffOptions ?? []).map((option) => {
                  const label = firstName(option.name) || option.name;
                  const item = (
                    <MenuItem
                      key={option.id}
                      disabled={option.disabled}
                      selected={Boolean(staffId) && option.id === staffId}
                      onClick={() => {
                        setMenuAnchor(null);
                        if (!option.disabled) onStaffChange?.(option.id);
                      }}
                      sx={{ gap: 1, py: 1 }}
                    >
                      <Avatar
                        src={option.photoSrc || undefined}
                        alt=""
                        sx={{
                          width: 22,
                          height: 22,
                          fontSize: 10,
                          fontWeight: 800,
                          bgcolor: alpha(m.teal, 0.14),
                          color: m.teal,
                        }}
                      >
                        {initialsFromName(option.name, option.avatarText)}
                      </Avatar>
                      <BodyText
                        sx={{
                          m: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        {label}
                      </BodyText>
                    </MenuItem>
                  );
                  return option.tooltip ? (
                    <Tooltip key={option.id} title={option.tooltip}>
                      <span>{item}</span>
                    </Tooltip>
                  ) : (
                    item
                  );
                })}
              </Menu>
            </>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
