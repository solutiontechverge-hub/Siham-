"use client";

import { mollureBodySx } from "../../../theme/mollureHierarchy";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { Box, Chip, Grid, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { locationModeChipSx } from "./locationModeChipSx";

type Props = {
  professionalName: string;
  professionalRole?: string;
  address: string;
  locationMode: "fixed" | "desired";
  phone: string;
};

export default function ClientBookingInfoBar({
  professionalName,
  professionalRole,
  address,
  locationMode,
  phone,
}: Props) {
  const m = useTheme().palette.mollure;
  const isDesired = locationMode === "desired";
  const locationBadge = isDesired ? "Desired Location" : "Fixed Location";

  const colSx = {
    px: { xs: 0, md: 2.5 },
    py: { xs: 1.35, md: 1.5 },
    borderRight: { xs: "none", md: `1px solid ${alpha(m.navy, 0.1)}` },
    borderBottom: { xs: `1px solid ${alpha(m.navy, 0.08)}`, md: "none" },
    "&:last-of-type": { borderRight: "none", borderBottom: "none" },
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={0}>
        <Grid item xs={12} md={4} sx={colSx}>
          <BodyText
            sx={{
              m: 0,
              fontSize: 13,
              fontWeight: 800,
              color: alpha(m.navy, 0.48),
              mb: 0.65,
            }}
          >
            Professional
          </BodyText>
          <BodyText
            sx={{
              m: 0,
              fontWeight: 900,
              fontSize: 14,
              color: alpha(m.navy, 0.88),
              lineHeight: 1.25,
            }}
          >
            {professionalName}
          </BodyText>
          {professionalRole ? (
            <BodyText
              sx={{
                m: 0,
                fontSize: 12,
                fontWeight: 600,
                color: alpha(m.navy, 0.48),
                mt: 0.2,
              }}
            >
              {professionalRole}
            </BodyText>
          ) : null}
        </Grid>

        <Grid item xs={12} md={4} sx={colSx}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ mb: 0.65 }}
          >
            <BodyText
              sx={{ m: 0, fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.48) }}
            >
              Location
            </BodyText>
            <Chip label={locationBadge} size="small" sx={locationModeChipSx} />
          </Stack>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            <LocationOnOutlinedIcon
              sx={{
                fontSize: 16,
                width: 16,
                height: 16,
                color: alpha(m.navy, 0.45),
                flexShrink: 0,
                display: "block",
              }}
            />
            <BodyText
              component="span"
              sx={{
                m: 0,
                fontWeight: 700,
                fontSize: 12,
                color: alpha(m.navy, 0.62),
                lineHeight: 1.25,
                minWidth: 0,
              }}
            >
              {address?.trim() || "—"}
            </BodyText>
          </Box>
        </Grid>

        <Grid item xs={12} md={4} sx={colSx}>
          <BodyText
            sx={{
              m: 0,
              fontSize: 13,
              fontWeight: 800,
              color: alpha(m.navy, 0.48),
              mb: 0.65,
            }}
          >
            Contact number
          </BodyText>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <PhoneOutlinedIcon
              sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }}
            />
            <BodyText
              sx={mollureBodySx(m.navy, { m: 0, color: alpha(m.navy, 0.62) })}
            >
              {phone?.trim() || "—"}
            </BodyText>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
