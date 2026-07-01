"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import { ADMIN_QUICK_LINKS } from "../dashboardData";

const SEO_LINKS = [
  {
    title: ADMIN_QUICK_LINKS[0].title,
    description: "Monitor search performance, indexing status, and site visibility in Google Search.",
    href: ADMIN_QUICK_LINKS[0].href,
    icon: SearchOutlinedIcon,
  },
  {
    title: ADMIN_QUICK_LINKS[1].title,
    description: "Track website traffic, user behavior, and conversion metrics.",
    href: ADMIN_QUICK_LINKS[1].href,
    icon: AnalyticsOutlinedIcon,
  },
];

export default function AdminSeoPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <>
      <AdminPageHeader
        title="SEO"
        description="Quick access to external SEO and analytics tools."
      />

      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        {SEO_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <AdminSectionCard key={link.href}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: tokens.mintSoft,
                    display: "grid",
                    placeItems: "center",
                    color: tokens.teal,
                    flexShrink: 0,
                  }}
                >
                  <Icon />
                </Box>
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.textcolorgrey700 }}>
                    {link.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tokens.bodyText }}>{link.description}</Typography>
                  <Box
                    component="a"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: "none", alignSelf: "flex-start" }}
                  >
                    <AppButton variant="contained" endIcon={<OpenInNewOutlinedIcon />} sx={{ textTransform: "none" }}>
                      Open {link.title}
                    </AppButton>
                  </Box>
                </Stack>
              </Stack>
            </AdminSectionCard>
          );
        })}
      </Stack>
    </>
  );
}
