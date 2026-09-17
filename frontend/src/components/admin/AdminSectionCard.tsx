"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppCard from "../common/AppCard";
import {
  mollureSectionTitleSx,
  mollureBodyMutedSx,
} from "../../theme/mollureHierarchy";
import { ADMIN_CARD_PADDING as pad } from "./adminCardPadding";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  compact?: boolean;
  /** Adds gap between header and body; removes the divider for a detached table look */
  separateContent?: boolean;
  sx?: SxProps<Theme>;
};

export default function AdminSectionCard({
  title,
  description,
  actions,
  children,
  noPadding = false,
  compact = false,
  separateContent = false,
  sx,
}: AdminSectionCardProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <AppCard
      sx={{
        borderRadius: 3,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "0 8px 24px rgba(16, 35, 63, 0.05)",
        bgcolor: tokens.white,
        overflow: "hidden",
        ...sx,
      }}
    >
      {(title || actions) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{
            px: compact ? pad.headerXCompact : pad.headerX,
            py: compact
              ? pad.headerYCompact
              : separateContent
                ? 2.25
                : pad.headerY,
            borderBottom: separateContent
              ? "none"
              : `1px solid ${tokens.cardBorder}`,
          }}
        >
          <Stack spacing={0.25}>
            {title ? (
              <Typography
                sx={mollureSectionTitleSx(tokens.navy, {
                  fontSize: compact ? 14 : 15,
                  fontWeight: 600,
                  color: tokens.textcolorgrey700,
                })}
              >
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography
                sx={mollureBodyMutedSx(tokens.navy, {
                  color: tokens.bodyText,
                })}
              >
                {description}
              </Typography>
            ) : null}
          </Stack>
          {actions}
        </Stack>
      )}
      <Box
        sx={{
          p: noPadding ? 0 : compact ? pad.bodyCompact : pad.body,
          ...(noPadding && {
            px: compact ? pad.bodyCompact : pad.body,
            pb: compact ? pad.bodyCompact : pad.body,
            ...(separateContent && { pt: compact ? 1.5 : 2.5 }),
          }),
        }}
      >
        {children}
      </Box>
    </AppCard>
  );
}
