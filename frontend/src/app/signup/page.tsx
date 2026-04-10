"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

type UserTypeKey = "individual" | "company" | "professional";

const USER_TYPES: Array<{
  key: UserTypeKey;
  title: string;
  Icon: typeof PersonOutlineRoundedIcon;
  href: string;
}> = [
  {
    key: "individual",
    title: "Individual Client (IC)",
    Icon: PersonOutlineRoundedIcon,
    href: "/auth/signup/individual",
  },
  {
    key: "company",
    title: "Company Client (CC)",
    Icon: ApartmentRoundedIcon,
    href: "/auth/signup/company",
  },
  {
    key: "professional",
    title: "Professional",
    Icon: GroupsRoundedIcon,
    href: "/auth/signup/professional",
  },
];

export default function SignupSelectUserTypePage() {
  const router = useRouter();
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [selected, setSelected] = React.useState<UserTypeKey>("individual");

  const selectedHref =
    USER_TYPES.find((t) => t.key === selected)?.href ?? "/auth/signup/individual";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 88% 42%, rgba(33, 184, 191, 0.10), transparent 42%)",
          pointerEvents: "none",
        },
        "& .bgRingLeft": {
          position: "absolute",
          left: { xs: -155, md: -180 },
          bottom: { xs: -160, md: -185 },
          width: { xs: 380, md: 430 },
          height: { xs: 380, md: 430 },
          borderRadius: "50%",
          border: `18px solid ${alpha(m.teal, 0.10)}`,
          pointerEvents: "none",
        },
        "& .bgRingRight": {
          position: "absolute",
          right: { xs: -170, md: -200 },
          bottom: { xs: -175, md: -205 },
          width: { xs: 420, md: 470 },
          height: { xs: 420, md: 470 },
          borderRadius: "50%",
          border: `18px solid ${alpha(m.teal, 0.10)}`,
          pointerEvents: "none",
        },
      }}
    >
      <Box className="bgRingLeft" />
      <Box className="bgRingRight" />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            pt: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: 84, sm: 96 },
              height: { xs: 20, sm: 24 },
              flexShrink: 0,
            }}
          >
            <Image
              src="/logo.svg"
              alt="Mollure"
              fill
              priority
              sizes="96px"
              style={{ objectFit: "contain" }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 999,
                borderColor: alpha(m.navy, 0.14),
                color: m.navy,
                px: 1.05,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
              }}
            >
              <Stack direction="row" spacing={0.6} alignItems="center">
                <PublicRoundedIcon sx={{ fontSize: 15 }} />
                <span>EN</span>
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
              </Stack>
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="contained"
              size="small"
              sx={{
                borderRadius: 999,
                px: 1.8,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              login
            </Button>
            <Button
              component={Link}
              href="/auth/professional/login"
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 999,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                px: 1.8,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
              }}
            >
              for professional
            </Button>
          </Stack>
        </Box>

        <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.10), mt: 2 }} />

        <Box
          sx={{
            minHeight: "calc(100vh - 72px)",
            display: "grid",
            alignItems: "center",
            pb: 6,
          }}
        >
          <Box sx={{ maxWidth: 980, width: "100%", mx: "auto", px: { xs: 1, sm: 2 } }}>
            <Typography sx={{ color: alpha(m.navy, 0.55), fontSize: 16, mb: 0.5 }}>
              Hi,
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: "mollure.textcolorgrey700",
                fontSize: { xs: 28, md: 34 },
                lineHeight: 1.15,
                textDecoration: "underline",
                textDecorationThickness: "3px",
                textUnderlineOffset: "8px",
                textDecorationColor: alpha(m.teal, 0.9),
              }}
            >
              Select User Type
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 4 }}>
              {USER_TYPES.map(({ key, title, Icon }) => {
                const active = selected === key;
                return (
                  <Paper
                    key={key}
                    elevation={0}
                    onClick={() => setSelected(key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(key);
                    }}
                    sx={{
                      flex: 1,
                      cursor: "pointer",
                      userSelect: "none",
                      height: { xs: 116, md: 132 },
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      px: 2.5,
                      borderRadius: "4px",
                      bgcolor: "#fff",
                      border: `1px solid ${
                        active ? theme.palette.primary.main : alpha(m.navy, 0.10)
                      }`,
                      boxShadow: active
                        ? `0 10px 22px ${alpha(m.teal, 0.14)}`
                        : "0 8px 18px rgba(16, 35, 63, 0.04)",
                      transition: "border-color 140ms ease, box-shadow 140ms ease",
                      "&:hover": {
                        borderColor: active
                          ? theme.palette.primary.main
                          : alpha(m.teal, 0.35),
                        boxShadow: active
                          ? `0 10px 22px ${alpha(m.teal, 0.14)}`
                          : `0 10px 22px ${alpha(m.teal, 0.10)}`,
                      },
                    }}
                  >
                    <Stack spacing={1.35} alignItems="center">
                      <Icon sx={{ fontSize: 34, color: alpha(m.navy, 0.58) }} />
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: alpha(m.navy, 0.80),
                          fontSize: 14,
                          lineHeight: 1.2,
                        }}
                      >
                        {title}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>

            <Button
              fullWidth
              disableElevation
              variant="contained"
              onClick={() => router.push(selectedHref)}
              sx={{
                mt: 5.5,
                borderRadius: "4px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                minHeight: 38,
                bgcolor: "primary.main",
                color: "common.white",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

