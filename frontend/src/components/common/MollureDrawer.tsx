"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Divider, Drawer, IconButton, Stack, Typography, type DrawerProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type MollureDrawerProps = Omit<DrawerProps, "children"> & {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  width?: number | { xs?: any; sm?: any; md?: any; lg?: any; xl?: any };
};

export default function MollureDrawer({
  title,
  children,
  footer,
  onBack,
  width = { xs: "100%", sm: 500 },
  onClose,
  PaperProps,
  ...props
}: MollureDrawerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Drawer
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          maxWidth: "100%",
          height: "100%",
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",
        },
        ...PaperProps,
      }}
      {...props}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {onBack ? (
              <IconButton
                size="small"
                onClick={onBack}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "999px",
                  bgcolor: alpha(m.navy, 0.05),
                  "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                }}
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
              </IconButton>
            ) : null}
            <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 16 }}>{title}</Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => onClose?.({}, "backdropClick")}
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.05),
              "&:hover": { bgcolor: alpha(m.navy, 0.10) },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />

        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</Box>

        {footer ? (
          <>
            <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />
            <Box>{footer}</Box>
          </>
        ) : null}
      </Stack>
    </Drawer>
  );
}

