"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

/** Muted info panel used on invoice/receipt previews. */
export default function FinanceInfoBlock({
  title,
  children,
  sx,
}: {
  title: string;
  children: React.ReactNode;
  sx?: Record<string, unknown>;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.015),
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        ...sx,
      }}
    >
      <BodyText sx={mollureLabelSx(m.navy)}>{title}</BodyText>
      <Stack spacing={0.5} sx={{ mt: 1.1 }}>
        {children}
      </Stack>
    </Box>
  );
}
