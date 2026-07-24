"use client";

import * as React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import AdminSidebar, { DRAWER_WIDTH } from "./AdminSidebar";

type AdminShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AdminShell({ children, title }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: tokens.surface }}>
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: `1px solid ${tokens.cardBorder}`,
            bgcolor: tokens.white,
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, color: tokens.navy }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
          {title ? (
            <Typography
              variant="subHeading"
              sx={{ color: tokens.textcolorgrey700 }}
            >
              {title}
            </Typography>
          ) : null}
        </Stack>

        <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
}
