"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { MarketingSiteHeader } from "../../../components/common";
import { BodyText } from "../../../components/ui/typography";
import type { AuthStripHeaderConfig } from "../../../data/marketingShell.data";
import { SignupBg, SignupLs, SignupRs } from "../../../../images";

type AuthSignupShellProps = {
  header: AuthStripHeaderConfig;
  /** When set, wraps children in the shared Paper card with title/subtitle. */
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AuthSignupShell({
  header,
  title,
  subtitle,
  children,
}: AuthSignupShellProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
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
          navItems={[...header.navItems]}
          localeLabel={header.localeLabel}
          loginLabel={header.loginLabel}
          loginHref={header.loginHref}
          professionalLinkLabel={header.professionalLinkLabel}
          professionalHref={header.professionalHref}
          homeHref="/"
        />

        {title != null ? (
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: { xs: 3, sm: 4 },
                pb: { xs: 5, sm: 6 },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  maxWidth: 720,
                  borderRadius: "14px",
                  border: `1px solid ${cardBorder}`,
                  boxShadow: `0 18px 48px ${alpha(m.navy, 0.08)}, 0 4px 14px ${alpha(m.navy, 0.04)}`,
                  bgcolor: m.white ?? "#fff",
                  px: { xs: 3, sm: 4.5 },
                  py: { xs: 3.5, sm: 4.25 },
                }}
              >
                <Stack spacing={3}>
                  <Box textAlign="center">
                    <Typography
                      component="h1"
                      sx={{
                        fontWeight: 700,
                        fontSize: 20,
                        lineHeight: 1.2,
                        color: m.navy,
                      }}
                    >
                      {title}
                    </Typography>
                    {subtitle != null ? (
                      <BodyText
                        sx={{
                          mt: 1,
                          color: alpha(m.navy, 0.52),
                          fontSize: "0.875rem",
                          lineHeight: 1.45,
                        }}
                      >
                        {subtitle}
                      </BodyText>
                    ) : null}
                  </Box>
                  {children}
                </Stack>
              </Paper>
            </Box>
          </Container>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
