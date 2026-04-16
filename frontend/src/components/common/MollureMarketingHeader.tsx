"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import { Avatar, Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo } from "../../../images";
import { BodyText } from "../ui/typography";

export type MarketingNavItem = {
  label: string;
  href: string;
  match?: "exact" | "prefix";
};

export type MollureMarketingHeaderProps = {
  navItems?: MarketingNavItem[];
  localeLabel?: string;
  loginLabel?: string;
  loginHref?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  professionalLinkLabel?: string;
  professionalHref?: string;
  homeHref?: string;
  activePath?: string | null;
  withDivider?: boolean;
  isAuthed?: boolean;
  userLabel?: string;
  rightSlot?: React.ReactNode;
  /** Outer content width; default `xl` matches wide marketing layouts */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  /** Teal rule under the header bar (default true, same as professionals marketing). */
  bottomBorder?: boolean;
};

function isNavActive(pathname: string, item: MarketingNavItem): boolean {
  const { href, match } = item;
  if (!href || href === "#") return false;
  const mode = match ?? (href === "/" ? "exact" : "prefix");
  if (mode === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(emailOrName?: string) {
  const base = (emailOrName ?? "").trim();
  if (!base) return "U";
  const cleaned = base.split("@")[0] ?? base;
  const parts = cleaned.split(/[._\s-]+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

/**
 * Marketing strip header: white bar, teal bottom rule, logo + nav + locale / login / secondary pill.
 * Pass `navItems` (and optional `homeHref`, CTAs) for each screen.
 */
export default function MollureMarketingHeader({
  navItems = [],
  localeLabel = "EN",
  loginLabel,
  loginHref,
  primaryActionLabel,
  primaryActionHref,
  professionalLinkLabel,
  professionalHref,
  homeHref = "/",
  activePath,
  withDivider,
  isAuthed = false,
  userLabel = "user@example.com",
  rightSlot,
  maxWidth = "xl",
  bottomBorder = true,
}: MollureMarketingHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const pathname = usePathname() ?? "";
  const pathForActive = activePath ?? pathname;
  const resolvedLoginLabel = primaryActionLabel ?? loginLabel ?? "login";
  const resolvedLoginHref = primaryActionHref ?? loginHref ?? "/auth/login";

  const audienceSwitchSx = {
    borderRadius: 999,
    borderColor: alpha(m.navy, 0.18),
    color: alpha(m.navy, 0.62),
    textTransform: "lowercase" as const,
    fontWeight: 600,
    fontSize: { xs: "0.75rem", sm: "0.8125rem", md: "0.875rem" },
    bgcolor: "#fff",
    minHeight: { xs: 34, md: 36 },
    px: { xs: 1.25, sm: 1.5, md: 1.75 },
    py: 0.5,
    maxWidth: { xs: 124, sm: 156, md: 180 },
    minWidth: 0,
    flexShrink: 0,
    lineHeight: 1.2,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center" as const,
    "&:hover": {
      borderColor: alpha(m.navy, 0.28),
      bgcolor: alpha(m.navy, 0.03),
    },
  };

  return (
    <Box component="header">
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#fff",
          borderBottom: bottomBorder ? `1px solid ${alpha(m.teal, 0.45)}` : "none",
        }}
      >
        <Container
          maxWidth={maxWidth}
          sx={{
            py: 1.5,
            px: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
          }}
        >
          {/* md+: true center nav between logo and actions; xs: compact row */}
          <Box
            sx={{
              display: { xs: "flex", md: "grid" },
              flexDirection: { xs: "row" },
              alignItems: "center",
              justifyContent: { xs: "space-between", md: "stretch" },
              gridTemplateColumns: { md: "minmax(0, 1fr) auto minmax(0, 1fr)" },
              columnGap: { md: 3 },
              rowGap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                pl: { md: 2, lg: 3, xl: 4 },
                minWidth: 0,
              }}
            >
              <Box
                component={Link}
                href={homeHref}
                sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0, minWidth: 0 }}
              >
                <Image src={Logo} alt="Mollure" width={160} height={38} priority />
              </Box>
            </Box>

            {navItems.length ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={{ md: 2.5, lg: 3.5, xl: 4 }}
                useFlexGap
                sx={{
                  display: { xs: "none", md: "flex" },
                  justifySelf: "center",
                  flexWrap: "nowrap",
                }}
              >
                {navItems.map((item) => {
                  const active = isNavActive(pathForActive, item);
                  return (
                    <BodyText
                      key={item.href + item.label}
                      component={Link}
                      href={item.href}
                      sx={{
                        fontSize: { md: "0.9375rem", lg: "1rem" },
                        lineHeight: 1.25,
                        fontWeight: active ? 600 : 500,
                        letterSpacing: "0.01em",
                        color: active ? alpha(m.navy, 0.92) : alpha(m.navy, 0.58),
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        "&:hover": { color: m.navy },
                      }}
                    >
                      {item.label}
                    </BodyText>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ display: { xs: "none", md: "block" } }} />
            )}

            {rightSlot ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  pr: { md: 2, lg: 3, xl: 4 },
                  minWidth: 0,
                }}
              >
                {rightSlot}
              </Box>
            ) : (
              <Stack
                direction="row"
                alignItems="center"
                spacing={{ xs: 0.75, sm: 1, md: 1.25 }}
                sx={{
                  flexShrink: 0,
                  justifyContent: "flex-end",
                  justifySelf: "end",
                  alignItems: "center",
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  rowGap: 1,
                  pr: { md: 2, lg: 3, xl: 4 },
                  pl: { xs: 0.5, md: 0 },
                  width: { xs: "auto", md: "100%" },
                  minWidth: 0,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<LanguageRoundedIcon sx={{ fontSize: 18, color: m.navy }} />}
                  endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18, color: m.navy }} />}
                  sx={{
                    borderRadius: 999,
                    borderColor: alpha(m.navy, 0.18),
                    color: m.navy,
                    px: { xs: 1.25, md: 1.5 },
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: { xs: "0.8125rem", md: "0.875rem" },
                    bgcolor: "#fff",
                    height: { xs: 34, md: 36 },
                    minWidth: 84,
                    "& .MuiButton-startIcon": { mr: 0.75 },
                    "& .MuiButton-endIcon": { ml: 0.5 },
                  }}
                >
                  {localeLabel}
                </Button>

                {isAuthed ? (
                  <Avatar
                    sx={{
                      width: { xs: 34, md: 36 },
                      height: { xs: 34, md: 36 },
                      bgcolor: alpha(m.navy, 0.08),
                      color: alpha(m.navy, 0.85),
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {getInitials(userLabel)}
                  </Avatar>
                ) : (
                  <Button
                    component={Link}
                    href={resolvedLoginHref}
                    variant="contained"
                    disableElevation
                    sx={{
                      borderRadius: 999,
                      px: { xs: 2, md: 2.25 },
                      textTransform: "lowercase",
                      fontWeight: 900,
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.tealDark },
                      height: { xs: 34, md: 36 },
                      fontSize: { xs: "0.8125rem", md: "0.875rem" },
                    }}
                  >
                    {resolvedLoginLabel}
                  </Button>
                )}

                {professionalLinkLabel ? (
                  professionalHref ? (
                    <Button
                      component={Link}
                      href={professionalHref}
                      variant="outlined"
                      sx={{
                        ...audienceSwitchSx,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: { xs: 34, md: 36 },
                      }}
                    >
                      {professionalLinkLabel}
                    </Button>
                  ) : (
                    <Typography
                      sx={{
                        display: { xs: "none", sm: "block" },
                        fontSize: "0.9375rem",
                        color: m.headerHint,
                      }}
                    >
                      {professionalLinkLabel}
                    </Typography>
                  )
                ) : null}
              </Stack>
            )}
          </Box>
        </Container>
      </Box>
      {withDivider ? <Divider /> : null}
    </Box>
  );
}
