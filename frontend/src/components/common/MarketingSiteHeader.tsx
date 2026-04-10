"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import { Avatar, Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo } from "../../../images";

export type MarketingNavItem = {
  label: string;
  href: string;
  /** `"exact"` = pathname must match; `"prefix"` = active for nested paths too */
  match?: "exact" | "prefix";
};

export type MarketingSiteHeaderProps = {
  navItems?: MarketingNavItem[];
  localeLabel?: string;
  /** @deprecated Use `primaryActionLabel` instead */
  loginLabel?: string;
  /** @deprecated Use `primaryActionHref` instead */
  loginHref?: string;
  /** Primary action label (e.g. "Login", "Signup") */
  primaryActionLabel?: string;
  /** Primary action target (e.g. "/auth/login", "/signup") */
  primaryActionHref?: string;
  professionalLinkLabel?: string;
  /** When set, shows an outlined “For professional” pill (matches marketing About layout). */
  professionalHref?: string;
  /** Logo link target */
  homeHref?: string;
  /** Override detected path (e.g. tests) */
  activePath?: string | null;
  /** Show an extra Divider below header */
  withDivider?: boolean;
  /** Render user avatar instead of primary action button */
  isAuthed?: boolean;
  /** Display label used to derive initials (email/name) */
  userLabel?: string;
  /** Optionally override the right-side content entirely */
  rightSlot?: React.ReactNode;
};

function isNavActive(
  pathname: string,
  item: MarketingNavItem,
): boolean {
  const { href, match } = item;
  if (!href || href === "#") return false;
  const mode =
    match ?? (href === "/" ? "exact" : "prefix");
  if (mode === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MarketingSiteHeader({
  navItems = [],
  localeLabel = "EN",
  loginLabel,
  loginHref,
  primaryActionLabel,
  primaryActionHref,
  professionalLinkLabel = "for professional",
  professionalHref,
  homeHref = "/",
  activePath,
  withDivider,
  isAuthed = false,
  userLabel = "user@example.com",
  rightSlot,
}: MarketingSiteHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const pathname = usePathname() ?? "";
  const pathForActive = activePath ?? pathname;
  const resolvedPrimaryActionLabel = primaryActionLabel ?? loginLabel ?? "Login";
  const resolvedPrimaryActionHref = primaryActionHref ?? loginHref ?? "/auth/login";

  function getInitials(emailOrName?: string) {
    const base = (emailOrName ?? "").trim();
    if (!base) return "U";
    const cleaned = base.split("@")[0] ?? base;
    const parts = cleaned.split(/[._\s-]+/).filter(Boolean);
    const a = (parts[0]?.[0] ?? "U").toUpperCase();
    const b = (parts[1]?.[0] ?? "").toUpperCase();
    return `${a}${b}`.slice(0, 2);
  }

  return (
    <Box component="header">
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: m.whiteOverlay,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${m.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.75 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={4}>
              <Box component={Link} href={homeHref} sx={{ display: "inline-flex", alignItems: "center" }}>
                <Image src={Logo} alt="Mollure" width={160} height={38} priority />
              </Box>
              {navItems.length ? (
                <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
                  {navItems.map((item) => {
                    const active = isNavActive(pathForActive, item);
                    return (
                      <Typography
                        key={item.href + item.label}
                        component={Link}
                        href={item.href}
                        sx={{
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          color: active ? m.navy : m.slate,
                          textDecoration: "none",
                          cursor: "pointer",
                          borderBottom: active ? `2px solid ${m.teal}` : "2px solid transparent",
                          pb: 0.25,
                          transition: "color 0.15s ease",
                          "&:hover": { color: m.navy },
                        }}
                      >
                        {item.label}
                      </Typography>
                    );
                  })}
                </Stack>
              ) : null}
            </Stack>

            {rightSlot ? (
              rightSlot
            ) : (
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Button
                  startIcon={<LanguageRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    minWidth: 0,
                    px: 1.25,
                    py: 0.6,
                    borderRadius: 999,
                    color: m.navy,
                    border: `1px solid ${m.border}`,
                    textTransform: "none",
                    fontSize: 13,
                  }}
                >
                  {localeLabel}
                </Button>

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
                    href={resolvedPrimaryActionHref}
                    variant="contained"
                    disableElevation
                    sx={{
                      px: 2.25,
                      py: 0.85,
                      borderRadius: 999,
                      textTransform: "none",
                      color: "#fff",
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.teal },
                    }}
                  >
                    {resolvedPrimaryActionLabel}
                  </Button>
                )}

                {professionalLinkLabel ? (
                  professionalHref ? (
                    <Button
                      component={Link}
                      href={professionalHref}
                      variant="outlined"
                      sx={{
                        display: { xs: "none", sm: "inline-flex" },
                        px: 2,
                        py: 0.85,
                        borderRadius: 999,
                        textTransform: "none",
                        fontSize: 13,
                        color: m.teal,
                        borderColor: m.teal,
                        "&:hover": {
                          borderColor: m.tealDark,
                          bgcolor: alpha(m.teal, 0.06),
                        },
                      }}
                    >
                      {professionalLinkLabel}
                    </Button>
                  ) : (
                    <Typography
                      sx={{
                        display: { xs: "none", sm: "block" },
                        fontSize: 13,
                        color: m.headerHint,
                      }}
                    >
                      {professionalLinkLabel}
                    </Typography>
                  )
                ) : null}
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
      {withDivider ? <Divider /> : null}
    </Box>
  );
}
