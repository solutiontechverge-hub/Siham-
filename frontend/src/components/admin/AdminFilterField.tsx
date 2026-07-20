"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type AdminFilterFieldProps = {
  label?: string;
  children: React.ReactNode;
};

export default function AdminFilterField({ label, children }: AdminFilterFieldProps) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack spacing={0.5} sx={{ width: "100%", minWidth: 0 }}>
      {label ? (
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, lineHeight: 1.2 }}>
          {label}
        </Typography>
      ) : null}
      {children}
    </Stack>
  );
}
