"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  type DrawerProps,
} from "@mui/material";

type AppDrawerProps = DrawerProps & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
};

export default function AppDrawer({
  children,
  onClose,
  subtitle,
  title,
  ...props
}: AppDrawerProps) {
  return (
    <Drawer onClose={onClose} {...props}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              {title ? (
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#10233f" }}>
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            <IconButton aria-label="Close drawer" onClick={() => onClose?.({}, "backdropClick")}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          {children}
        </Stack>
      </Box>
    </Drawer>
  );
}
