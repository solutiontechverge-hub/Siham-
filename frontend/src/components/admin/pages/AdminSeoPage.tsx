"use client";

import Link from "next/link";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { Box, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton } from "../../common";
import AdminSectionCard from "../AdminSectionCard";
import { AdminDashboardFooter } from "../AdminDashboardHeader";
import { ADMIN_QUICK_LINKS } from "../dashboardData";

const SEO_LINKS = [
  {
    title: ADMIN_QUICK_LINKS[0].title,
    label: "Link to Google Console",
    description: "Monitor search performance, indexing, and site visibility.",
    href: ADMIN_QUICK_LINKS[0].href,
    logoLabel: ADMIN_QUICK_LINKS[0].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[0].logoBg,
    logoColor: ADMIN_QUICK_LINKS[0].logoColor,
  },
  {
    title: ADMIN_QUICK_LINKS[1].title,
    label: "Link to Google Analytics",
    description: "Track website traffic, user behavior, and conversions.",
    href: ADMIN_QUICK_LINKS[1].href,
    logoLabel: ADMIN_QUICK_LINKS[1].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[1].logoBg,
    logoColor: ADMIN_QUICK_LINKS[1].logoColor,
  },
] as const;

export default function AdminSeoPage() {
  const tokens = useTheme().palette.mollure;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
        <Typography
          component={Link}
          href="/admin/dashboard"
          sx={{ fontSize: 12, color: tokens.bodyText, textDecoration: "none", "&:hover": { color: tokens.teal } }}
        >
          Home
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>/</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}>
          SEO
        </Typography>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="mainHeading"
          sx={{ fontSize: { xs: 24, md: 28 }, color: tokens.textcolorgrey700, mb: 0.5 }}
        >
          SEO
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.bodyText, maxWidth: 640 }}>
          Quick access to Google Search Console and Google Analytics.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {SEO_LINKS.map((link) => (
          <Grid key={link.href} size={{ xs: 12, md: 6 }}>
            <AdminSectionCard compact sx={{ height: "100%" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: link.logoBg,
                      color: link.logoColor,
                      fontSize: link.logoLabel.length > 1 ? 10 : 15,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {link.logoLabel}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: tokens.navy, lineHeight: 1.3 }}>
                      {link.label}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.bodyText, mt: 0.35 }}>
                      {link.description}
                    </Typography>
                  </Box>
                </Stack>

                <Box
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textDecoration: "none", flexShrink: 0 }}
                >
                  <AppButton
                    variant="contained"
                    endIcon={<OpenInNewOutlinedIcon />}
                    sx={{
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      boxShadow: `0 4px 14px ${alpha(tokens.teal, 0.25)}`,
                    }}
                  >
                    Open
                  </AppButton>
                </Box>
              </Stack>
            </AdminSectionCard>
          </Grid>
        ))}
      </Grid>

      <AdminDashboardFooter />
    </>
  );
}
