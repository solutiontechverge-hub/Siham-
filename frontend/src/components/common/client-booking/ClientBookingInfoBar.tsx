"use client";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  professionalName: string;
  professionalRole?: string;
  address: string;
  locationMode: "fixed" | "desired";
  phone: string;
};

export default function ClientBookingInfoBar({
  professionalName,
  professionalRole = "Professional",
  address,
  locationMode,
  phone,
}: Props) {
  const m = useTheme().palette.mollure;
  const isDesired = locationMode === "desired";
  const locationBadge = isDesired ? "Desired Location" : "Fixed Location";

  const colSx = {
    px: { xs: 0, md: 2.5 },
    py: { xs: 1.5, md: 0 },
    borderRight: { xs: "none", md: `1px solid ${alpha(m.navy, 0.1)}` },
    "&:last-of-type": { borderRight: "none" },
  };

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        py: { xs: 1.5, md: 2 },
        px: { xs: 2, md: 2.5 },
        mb: 2,
      }}
    >
      <Grid container spacing={0}>
        <Grid item xs={12} md={4} sx={colSx}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              color: alpha(m.navy, 0.5),
              mb: 0.75,
            }}
          >
            Professional
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 13,
              color: alpha(m.navy, 0.85),
              lineHeight: 1.2,
            }}
          >
            {professionalName}
          </Typography>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.48),
              mt: 0.2,
            }}
          >
            {professionalRole}
          </Typography>
        </Grid>

        <Grid item xs={12} md={4} sx={colSx}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ mb: 0.75 }}
          >
            <Typography
              sx={{ fontSize: 14, fontWeight: 800, color: alpha(m.navy, 0.5) }}
            >
              Location
            </Typography>
            <Chip
              label={locationBadge}
              size="small"
              sx={{
                height: 20,
                fontSize: 9,
                fontWeight: 900,
                bgcolor: alpha(m.teal, 0.1),
                color: m.teal,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          </Stack>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
            <LocationOnOutlinedIcon
              sx={{
                fontSize: 16,
                color: alpha(m.navy, 0.45),
                mt: 0.15,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 11.5,
                color: alpha(m.navy, 0.62),
                lineHeight: 1.4,
              }}
            >
              {address}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={4} sx={colSx}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              color: alpha(m.navy, 0.5),
              mb: 0.75,
            }}
          >
            Contact number
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <PhoneOutlinedIcon
              sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 12.5,
                color: alpha(m.navy, 0.62),
              }}
            >
              {phone || "—"}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
