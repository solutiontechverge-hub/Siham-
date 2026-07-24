"use client";

import AppButton from "../common/AppButton";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo, SignupBg } from "../../../images";

type AuthEmailScreenProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: number;
};

export default function AuthEmailScreen({
  children,
  icon,
  maxWidth = 520,
}: AuthEmailScreenProps) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        component="img"
        src={SignupBg.src}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", width: "100%", maxWidth, zIndex: 1 }}>
        <Stack alignItems="center" sx={{ mb: 3 }}>
          <Image src={Logo} alt="Mollure" width={72} height={72} priority />
        </Stack>

        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: "#fff",
            boxShadow: "0 18px 48px rgba(16, 35, 63, 0.08)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, sm: 4 },
              py: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            {icon ? (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                {icon}
              </Box>
            ) : null}
            {children}
          </Box>

          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: `1px dashed ${alpha(m.navy, 0.12)}`,
              textAlign: "center",
            }}
          >
            <Stack
              direction="row"
              justifyContent="center"
              spacing={1.5}
              sx={{ mb: 1 }}
            >
              {["f", "ig", "web"].map((label) => (
                <Box
                  key={label}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: alpha(m.navy, 0.06),
                    color: alpha(m.navy, 0.45),
                    fontSize: 10,
                    fontWeight: 800,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {label}
                </Box>
              ))}
            </Stack>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: alpha(m.navy, 0.45),
                lineHeight: 1.5,
              }}
            >
              Mollure Inc. © {new Date().getFullYear()}. All Rights Reserved.
            </Typography>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 600,
                color: alpha(m.navy, 0.38),
                mt: 0.35,
              }}
            >
              123 Beauty Lane, Suite 100, Wellness City, 90210
            </Typography>
            <Stack
              direction="row"
              justifyContent="center"
              spacing={1}
              sx={{ mt: 1 }}
            >
              <Typography
                component={Link}
                href="/contact-us"
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.42),
                  textDecoration: "none",
                }}
              >
                Unsubscribe
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: alpha(m.navy, 0.25) }}>
                |
              </Typography>
              <Typography
                component={Link}
                href="/privacy-policy"
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.42),
                  textDecoration: "none",
                }}
              >
                Privacy Policy
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function AuthEmailStatusIcon({
  variant,
  size = 56,
}: {
  variant: "success" | "error" | "mail";
  size?: number;
}) {
  const m = useTheme().palette.mollure;
  const bg =
    variant === "success"
      ? m.teal
      : variant === "error"
        ? alpha("#E85D5D", 0.12)
        : alpha(m.teal, 0.12);
  const color =
    variant === "success" ? "#fff" : variant === "error" ? "#E85D5D" : m.teal;
  const glyph = variant === "success" ? "✓" : variant === "error" ? "✕" : "✉";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: variant === "success" ? m.teal : bg,
        color,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.42,
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      {glyph}
    </Box>
  );
}

export function AuthEmailPrimaryButton({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const m = useTheme().palette.mollure;

  if (href) {
    return (
      <AppButton
        tone="primary"
        component={Link}
        href={href}
        fullWidth
        sx={{
          mt: 2.5,
          fontSize: 15,
          py: 1.35,
        }}
      >
        {children}
      </AppButton>
    );
  }

  return (
    <AppButton
      tone="primary"
      fullWidth
      onClick={onClick}
      sx={{
        mt: 2.5,
        fontSize: 15,
        py: 1.35,
      }}
    >
      {children}
    </AppButton>
  );
}
