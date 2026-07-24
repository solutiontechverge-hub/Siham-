"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Stack spacing={0.5}>
        <Typography variant="mainHeading">{title}</Typography>
        {description ? (
          <Typography
            variant="description"
            sx={{ color: tokens.bodyText, maxWidth: 640 }}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
      {actions ? (
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
