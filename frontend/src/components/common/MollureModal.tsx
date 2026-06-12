"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, Divider, IconButton, Stack, type DialogProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { SubHeading } from "../ui/typography";

type MollureModalProps = Omit<DialogProps, "children" | "title"> & {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentMinHeight?: number;
};

export default function MollureModal({
  title,
  children,
  footer,
  contentMinHeight,
  onClose,
  PaperProps,
  ...props
}: MollureModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { sx: paperSx, ...restPaperProps } = PaperProps ?? {};

  return (
    <Dialog
      onClose={onClose}
      scroll="paper"
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
      PaperProps={{
        ...restPaperProps,
        sx: {
          borderRadius: "14px",
          border: `1px solid ${alpha(m.navy, 0.10)}`,
          boxShadow: "0 20px 55px rgba(16,35,63,0.18)",
          overflow: "hidden",
          margin: 2,
          width: "100%",
          maxHeight: "calc(100vh - 48px)",
          ...paperSx,
        },
      }}
      {...props}
    >
      <Stack sx={{ minHeight: contentMinHeight ?? 0, maxHeight: "inherit" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
          <SubHeading sx={{ fontSize: 16, color: alpha(m.navy, 0.88) }}>{title}</SubHeading>
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

        <Box>{children}</Box>

        {footer ? (
          <>
            <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />
            <Box>{footer}</Box>
          </>
        ) : null}
      </Stack>
    </Dialog>
  );
}

