"use client";

import { mollureLabelSx, mollureBodySx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { BusinessPublicProfileServiceForItem } from "../../../data/businessPublicProfile.data";
import {
  businessPublicProfileUiCopy,
  displayProfileValue,
} from "../../../data/businessPublicProfile.data";
import { KidsIcon } from "../../../../images";

export function SectionCard({
  title,
  children,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
        }}
      >
        <Typography
          variant="mainHeading"
          sx={{ lineHeight: 1, letterSpacing: 0 }}
        >
          {title}
        </Typography>
        {headerAction ?? null}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

export function ProjectReadOnlyField({ value }: { value: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.5,
        py: 1.25,
        minHeight: 88,
      }}
    >
      <Typography
        sx={mollureBodySx(m.navy, { fontWeight: 500, color: alpha(m.navy, 0.42), lineHeight: 1.55 })}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function ProfileDetailsSubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        bgcolor: m.sectionSurface,
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Typography
        sx={{
          ...mollureLabelSx(m.navy),
          mb: 1.25,
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function ProfileDetailsContentBox({
  children,
  sx,
  multiline = false,
}: {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
  multiline?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.15,
        borderRadius: "8px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        ...(multiline ? { minHeight: 88 } : null),
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 500,
          color: alpha(m.navy, 0.42),
          lineHeight: 1.55,
          ...(multiline ? { whiteSpace: "pre-wrap" } : null),
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export function ProfileDetailsFieldLine({
  label,
  value,
  labelWeight = 800,
  mutedLabel = false,
  valueWeight = 600,
}: {
  label: string;
  value: string | null | undefined;
  labelWeight?: number;
  mutedLabel?: boolean;
  valueWeight?: number;
}) {
  const m = useTheme().palette.mollure;
  const display = displayProfileValue(value);
  return (
    <Typography
      sx={{
        fontSize: mutedLabel ? 12 : 12.5,
        color: alpha(m.navy, 0.78),
        lineHeight: 1.5,
      }}
    >
      <Box
        component="span"
        sx={{
          fontWeight: labelWeight,
          color: alpha(m.navy, mutedLabel ? 0.55 : 0.78),
        }}
      >
        {label}
      </Box>{" "}
      <Box
        component="span"
        sx={{
          fontWeight: valueWeight,
          color: alpha(
            m.navy,
            display === businessPublicProfileUiCopy.emptyValue
              ? 0.45
              : mutedLabel
                ? 0.78
                : 0.5,
          ),
        }}
      >
        {display}
      </Box>
    </Typography>
  );
}

const SERVICE_FOR_ICONS = {
  men: MaleRoundedIcon,
  women: FemaleRoundedIcon,
} as const;

export function ServiceForIcon({
  item,
}: {
  item: BusinessPublicProfileServiceForItem;
}) {
  const m = useTheme().palette.mollure;

  if (item.id === "kids") {
    return (
      <Box
        sx={{
          width: 16,
          height: 16,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Image src={KidsIcon} alt="" width={13} height={13} />
      </Box>
    );
  }

  const Icon = SERVICE_FOR_ICONS[item.id];
  return <Icon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />;
}
