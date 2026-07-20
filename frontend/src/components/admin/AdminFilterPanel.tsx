"use client";

import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type AdminFilterPanelProps = {
  children: React.ReactNode;
  /** When true, filters align in a horizontal row (wraps on small screens). */
  horizontal?: boolean;
  sx?: SxProps<Theme>;
};

export default function AdminFilterPanel({ children, horizontal = false, sx }: AdminFilterPanelProps) {
  const tokens = useTheme().palette.mollure;

  if (horizontal) {
    return (
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.25}
        flexWrap="wrap"
        useFlexGap
        alignItems={{ lg: "center" }}
        sx={{ width: "100%", ...sx }}
      >
        {children}
      </Stack>
    );
  }

  return (
    <Stack
      spacing={1.25}
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", lg: 360 },
        p: 0.25,
        ...sx,
      }}
    >
      <Stack
        spacing={1.25}
        sx={{
          borderRadius: 2,
          border: `1px solid ${tokens.cardBorder}`,
          bgcolor: tokens.white,
          overflow: "hidden",
        }}
      >
        {children}
      </Stack>
    </Stack>
  );
}

type AdminFilterPanelRowProps = {
  children: React.ReactNode;
  horizontal?: boolean;
  /** flex grow for horizontal layout */
  grow?: boolean;
  sx?: SxProps<Theme>;
};

export function AdminFilterPanelRow({ children, horizontal = false, grow = false, sx }: AdminFilterPanelRowProps) {
  const tokens = useTheme().palette.mollure;

  if (horizontal) {
    return (
      <Box
        sx={{
          width: { xs: "100%", lg: grow ? undefined : "auto" },
          flex: grow ? { lg: "1 1 200px" } : { lg: "0 0 auto" },
          minWidth: { xs: "100%", sm: grow ? 200 : 0 },
          ...sx,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Stack
      spacing={1}
      sx={{
        px: 1.5,
        py: 1.25,
        borderBottom: `1px solid ${tokens.cardBorder}`,
        "&:last-child": { borderBottom: "none" },
        width: "100%",
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}
