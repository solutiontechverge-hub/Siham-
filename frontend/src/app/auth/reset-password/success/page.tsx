"use client";

import Link from "next/link";
import Image from "next/image";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Paper, Stack } from "@mui/material";
import { MarketingSiteHeader } from "../../../../components/common";
import { authLoginHeaderClient } from "../../../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../../../components/ui/typography";
import { SignupBg, SignupLs, SignupRs } from "../../../../../images";

export default function PasswordResetSuccessPage() {
  const m = useTheme().palette.mollure;
  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: m.white ?? "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupBg}
            alt=""
            width={1440}
            height={553}
            priority
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(52vw, 240px)", sm: 280, md: 323 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupLs}
            alt=""
            width={323}
            height={469}
            sizes="(max-width: 600px) 52vw, 323px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(56vw, 260px)", sm: 300, md: 364 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupRs}
            alt=""
            width={364}
            height={413}
            sizes="(max-width: 600px) 56vw, 364px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <MarketingSiteHeader
          navItems={[...authLoginHeaderClient.navItems]}
          localeLabel={authLoginHeaderClient.localeLabel}
          loginLabel={authLoginHeaderClient.loginLabel}
          loginHref={authLoginHeaderClient.loginHref}
          professionalLinkLabel={authLoginHeaderClient.professionalLinkLabel}
          professionalHref={authLoginHeaderClient.professionalHref}
          homeHref="/"
        />

        <Container maxWidth="lg">
          <Box
            sx={{
              minHeight: "calc(100vh - 120px)",
              display: "grid",
              placeItems: "center",
              py: 4,
              pb: 6,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 620,
                borderRadius: "14px",
                border: `1px solid ${cardBorder}`,
                boxShadow: `0 18px 48px ${alpha(m.navy, 0.08)}, 0 4px 14px ${alpha(m.navy, 0.04)}`,
                bgcolor: m.white ?? "#fff",
                px: { xs: 3, sm: 4.75 },
                py: { xs: 3.5, sm: 4.25 },
              }}
            >
              <Stack spacing={2.25} alignItems="center" textAlign="center">
                <SubHeading
                  sx={{
                    fontSize: { xs: "1.5rem", sm: "1.625rem" },
                    fontWeight: 700,
                    color: m.navy,
                    lineHeight: 1.2,
                  }}
                >
                  Password Reset
                </SubHeading>
                <BodyText
                  sx={{
                    color: alpha(m.navy, 0.52),
                    fontSize: "0.875rem",
                    lineHeight: 1.45,
                  }}
                >
                  Your Password Has Been Successfully Reset
                </BodyText>
                <Button
                  component={Link}
                  href="/auth/login"
                  variant="contained"
                  disableElevation
                  fullWidth
                  sx={{
                    mt: 0.5,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    py: 1.2,
                    minHeight: 44,
                    bgcolor: m.teal,
                    color: m.white,
                    "&:hover": { bgcolor: m.tealDark },
                  }}
                >
                  Login
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
