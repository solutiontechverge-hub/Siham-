"use client";

import * as React from "react";
import { Box, Divider, Paper, Stack } from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import AppButton from "../AppButton";
import { Typography } from "../../ui/typography";
import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";

export function addSoftIconButtonSx(m: Theme["palette"]["mollure"], size: number) {
  return {
    width: size,
    height: size,
    borderRadius: "999px",
    bgcolor: m.addSoftBg,
    color: m.addSoftFg,
    border: `1px solid ${m.addSoftBorder}`,
    mr: 0.75,
    "&:hover": { bgcolor: m.addSoftBgHover },
    "&.Mui-disabled": {
      bgcolor: m.addSoftBg,
      color: alpha(m.addSoftFg, 0.5),
      border: `1px solid ${alpha(m.addSoftFg, 0.22)}`,
      opacity: 1,
    },
  } as const;
}

export const setupSectionPaperSx = (m: Theme["palette"]["mollure"]) =>
  ({
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
    overflow: "hidden",
    bgcolor: "#fff",
    minWidth: 0,
    width: "100%",
  }) as const;

export function SectionShell({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  return (
    <Paper elevation={0} sx={setupSectionPaperSx(m)}>
      <Box
        sx={{
          px: { xs: 1.75, sm: 2.25 },
          py: { xs: 1.35, sm: 1.6 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1.25, sm: 2 },
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 auto", maxWidth: "100%" }}>
          {typeof title === "string" ? (
            <Typography
              sx={mollureSectionTitleSx(m.navy)}
            >
              {title}
            </Typography>
          ) : (
            title
          )}
        </Box>
        {action ? (
          <Box sx={{ flexShrink: 0, ml: "auto" }}>{action}</Box>
        ) : null}
      </Box>
      <Divider />
      <Box sx={{ px: { xs: 1.75, sm: 2.25 }, py: { xs: 1.75, sm: 2.1 }, minWidth: 0 }}>
        {children}
      </Box>
    </Paper>
  );
}

export function SetupSubSection({
  title,
  action,
  children,
  toned = false,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Light grey panel (theme container grey) — Price / Policy blocks */
  toned?: boolean;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  return (
    <Box
      sx={
        toned
          ? {
              mx: 2.25,
              borderRadius: "10px",
              bgcolor: m.fxGrayF2F4F7,
              overflow: "hidden",
            }
          : undefined
      }
    >
      <Box
        sx={{
          px: toned ? 2 : 2.25,
          py: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {typeof title === "string" ? (
          <Typography
            sx={mollureSectionTitleSx(m.navy)}
          >
            {title}
          </Typography>
        ) : (
          title
        )}
        {action}
      </Box>
      <Box sx={{ px: toned ? 2 : 2.25, pt: 0, pb: toned ? 2 : 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export function SetupSectionsGroup({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  return (
    <Paper elevation={0} sx={setupSectionPaperSx(m)}>
      <Stack spacing={2} sx={{ pt: 2, pb: 2.1 }}>
        {children}
      </Stack>
    </Paper>
  );
}

export function PrimaryMiniButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <AppButton
      onClick={onClick}
      variant="contained"
      disableElevation
      sx={{
        borderRadius: "6px",
        textTransform: "none",
        fontWeight: 700,
        fontSize: 12,
        minHeight: 30,
        px: 2,
        bgcolor: "primary.main",
        "&:hover": { bgcolor: "mollure.tealDark" },
      }}
    >
      {children}
    </AppButton>
  );
}
