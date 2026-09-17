"use client";

import AppButton from "../AppButton";
import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, Paper, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureSectionTitleSx, mollureBodySx } from "../../../theme/mollureHierarchy";
import AppDropdown from "../AppDropdown";
import { BodyText, SubHeading } from "../../ui/typography";
import { CALENDAR_HOURS_RULES_COPY } from "./calendarHoursRules.data";
import type { PublicBusinessHoursEntry } from "./CalendarPublicBusinessHoursModal";
import { useLocationHoursBlock } from "./useCalendarHoursRulesPanel";

export function SettingsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.15,
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
        }}
      >
        <SubHeading sx={mollureSectionTitleSx(m.navy)}>{title}</SubHeading>
        {action}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

export function AppearanceActionButton({
  configured,
  onClick,
  disabled,
}: {
  configured: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <AppButton
      tone="primary"
      disabled={disabled}
      onClick={onClick}
      sx={{
        fontSize: 12.5,
        minWidth: 58,
        height: 30,
        px: 1.75,
      }}
    >
      {configured
        ? CALENDAR_HOURS_RULES_COPY.edit
        : CALENDAR_HOURS_RULES_COPY.set}
    </AppButton>
  );
}

export function EditSectionButton({
  active,
  onClick,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <IconButton
      size="small"
      disabled={disabled}
      onClick={onClick}
      aria-label={active ? "Editing section" : "Edit section"}
      sx={{
        width: 30,
        height: 30,
        borderRadius: "999px",
        border: `1px solid ${active ? alpha(m.teal, 0.35) : alpha(m.navy, 0.12)}`,
        bgcolor: active ? alpha(m.teal, 0.12) : "#fff",
        color: active ? m.teal : alpha(m.navy, 0.55),
      }}
    >
      <EditOutlinedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

export function SectionSaveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <AppButton
      tone="primary"
      disabled={disabled}
      onClick={onClick}
      sx={{
        fontSize: 12.5,
        minWidth: 72,
        height: 30,
        px: 1.75,
      }}
    >
      {CALENDAR_HOURS_RULES_COPY.save}
    </AppButton>
  );
}

export function LocationHoursBlock({
  title,
  location,
  entries,
  onEdit,
  isSaving,
}: {
  title: string;
  location: "FL" | "DL";
  entries: PublicBusinessHoursEntry[];
  onEdit: () => void;
  isSaving?: boolean;
}) {
  const m = useTheme().palette.mollure;
  const {
    configured,
    scheduleLabel,
    showInfo,
    infoTitle,
    options,
    dropdownValue,
    setSelectedId,
  } = useLocationHoursBlock({
    location,
    entries,
    colors: {
      override: m.requestAccent,
      notAvailable: m.blockedTimeFg,
    },
  });

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 1.75,
        py: 1.5,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.25 }}
      >
        <BodyText
          sx={{
            fontSize: 13,
            fontWeight: 800,
            color: alpha(m.navy, 0.78),
          }}
        >
          {title}
        </BodyText>
        <AppearanceActionButton
          configured={configured}
          disabled={isSaving}
          onClick={onEdit}
        />
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ minWidth: 148 }}
        >
          <AccessTimeRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
          <BodyText sx={mollureBodySx(m.navy)}>{scheduleLabel}</BodyText>
        </Stack>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <AppDropdown
            value={dropdownValue}
            onChange={(val) => setSelectedId(String(val))}
            options={options}
            fullWidth
            size="small"
            disabled={entries.length === 0}
          />
        </Box>
        {showInfo ? (
          <Tooltip title={infoTitle}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: m.teal }} />
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );
}
