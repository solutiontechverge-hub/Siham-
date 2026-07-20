"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  type DrawerProps,
} from "@mui/material";
import { BodyText, SubHeading } from "../ui/typography";
import { MOLLURE_DRAWER_WIDTH } from "./MollureDrawer";

type AppDrawerProps = DrawerProps & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
};

export default function AppDrawer({
  children,
  onClose,
  subtitle,
  title,
  PaperProps,
  ...props
}: AppDrawerProps) {
  const paperSx = PaperProps?.sx;
  return (
    <Drawer
      onClose={onClose}
      {...props}
      PaperProps={{
        ...PaperProps,
        sx: [
          { width: MOLLURE_DRAWER_WIDTH },
          ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
        ],
      }}
    >
      <Box sx={{ width: "100%", p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              {title ? (
                <SubHeading sx={{ fontSize: "20px", color: "#10233f" }}>{title}</SubHeading>
              ) : null}
              {subtitle ? (
                <BodyText color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </BodyText>
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
