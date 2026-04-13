"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, CardTitle } from "../ui/typography";

export type AuthAwareHeaderProps = {
  signupLabel?: string;
  signupHref?: string;
  withDivider?: boolean;
};

function getInitials(emailOrName?: string) {
  const base = (emailOrName ?? "").trim();
  if (!base) return "U";
  const cleaned = base.split("@")[0] ?? base;
  const parts = cleaned.split(/[._\s-]+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

export default function AuthAwareHeader({
  signupLabel = "signup",
  signupHref = "/signup",
  withDivider,
}: AuthAwareHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  // Stub: if you already have auth state in Redux, plug it here.
  const isAuthed = false;
  const userLabel = "user@example.com";

  return (
    <Box sx={{ bgcolor: alpha(m.teal, 0.10) }}>
      <Container maxWidth="lg" sx={{ py: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <CardTitle sx={{ color: m.navy, letterSpacing: "-0.02em" }}>
            Mollure
          </CardTitle>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                px: 1.2,
                py: 0.6,
                borderRadius: "999px",
                bgcolor: alpha("#fff", 0.65),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              }}
            >
              <BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.7) }}>EN</BodyText>
            </Box>

            {isAuthed ? (
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(m.navy, 0.08),
                  color: alpha(m.navy, 0.85),
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {getInitials(userLabel)}
              </Avatar>
            ) : (
              <Button
                component={Link}
                href={signupHref}
                variant="contained"
                disableElevation
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  minHeight: 34,
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "mollure.tealDark" },
                }}
              >
                {signupLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
      {withDivider ? <Divider /> : null}
    </Box>
  );
}

