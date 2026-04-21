"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { Avatar, Box, Button, Container, Divider, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo } from "../../../images";
import { HeaderNavText } from "../ui/typography";
import ClientProfileMenuPopover from "./ClientProfileMenuPopover";

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
  userName?: string;
  userAvatarSrc?: string;
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

function toDisplayName(userName?: string, userLabel?: string) {
  const preferred = (userName ?? "").trim();
  if (preferred) return preferred;
  const email = (userLabel ?? "").trim();
  const local = (email.split("@")[0] ?? "").trim();
  if (!local) return "User";
  const parts = local.split(/[._\s-]+/).filter(Boolean);
  const titled = parts
    .slice(0, 2)
    .map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))
    .join(" ")
    .trim();
  return titled || "User";
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
  userName,
  userAvatarSrc,
  rightSlot,
  maxWidth = "xl",
  bottomBorder = true,
}: MollureMarketingHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const pathname = usePathname() ?? "";
  const pathForActive = activePath ?? pathname;
  const isProfessionalsRoute = pathForActive === "/professionals" || pathForActive.startsWith("/professionals/");
  const resolvedLoginLabel = primaryActionLabel ?? loginLabel ?? "login";
  const resolvedLoginHref = primaryActionHref ?? loginHref ?? "/auth/login";
  const resolvedUserName = toDisplayName(userName, userLabel);
  const [mounted, setMounted] = React.useState(false);
  const [profileAnchor, setProfileAnchor] = React.useState<HTMLElement | null>(null);
  const openProfileMenu = (anchor: HTMLElement) => setProfileAnchor(anchor);
  const closeProfileMenu = () => setProfileAnchor(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const pillBaseSx = {
    borderRadius: 999,
    height: { xs: 34, sm: 34, md: 36 },
    minHeight: { xs: 34, sm: 34, md: 36 },
    px: { xs: 1.1, sm: 1.1, md: 1.35 },
    fontSize: { xs: "0.8125rem", sm: "0.8125rem", md: "0.875rem" },
    lineHeight: 1,
    letterSpacing: "0.01em",
    textTransform: "lowercase" as const,
    whiteSpace: "nowrap" as const,
  };

  const pillOutlineSx = {
    ...pillBaseSx,
    bgcolor: "#fff",
    borderColor: alpha(m.navy, 0.22),
    color: alpha(m.navy, 0.86),
    fontWeight: 500,
    "&:hover": {
      borderColor: alpha(m.navy, 0.32),
      bgcolor: alpha(m.navy, 0.03),
    },
  };

  const pillPrimarySx = {
    ...pillBaseSx,
    bgcolor: m.teal,
    color: "#fff",
    fontWeight: 500,
    boxShadow: "none",
    "&:hover": { bgcolor: m.tealDark, boxShadow: "none" },
  };

  const audienceSwitchSx = {
    ...pillOutlineSx,
    maxWidth: { xs: 170, sm: 200, md: 240 },
    minWidth: 0,
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center" as const,
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
              gridTemplateColumns: { md: "auto minmax(0, 1fr) auto" },
              columnGap: { md: 2 },
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
                spacing={{ md: 2.25, lg: 3.25, xl: 3.75 }}
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
                    <HeaderNavText
                      key={item.href + item.label}
                      component={Link}
                      href={item.href}
                      sx={{
                        lineHeight: 1.25,
                        fontWeight: active ? 600 : 500,
                        color: active ? alpha(m.navy, 0.92) : alpha(m.navy, 0.58),
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        "&:hover": { color: m.navy },
                      }}
                    >
                      {item.label}
                    </HeaderNavText>
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
                spacing={{ xs: 1.1, sm: 1.4, md: 1.6 }}
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
                  startIcon={<LanguageRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.9) }} />}
                  endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }} />}
                  sx={{
                    ...pillOutlineSx,
                    minWidth: { xs: 84, sm: 84, md: 92 },
                    justifyContent: "space-between",
                    gap: 1.1,
                    "& .MuiButton-startIcon": { mr: 0 },
                    "& .MuiButton-endIcon": { ml: 0 },
                  }}
                >
                  {localeLabel}
                </Button>

                {isAuthed ? (
                  <>
                    <IconButton
                      aria-label="Notifications"
                      sx={{
                        width: { xs: 34, md: 36 },
                        height: { xs: 34, md: 36 },
                        borderRadius: 999,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      <NotificationsNoneRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ cursor: "pointer", userSelect: "none" }}
                      role="button"
                      aria-label="Open profile menu"
                      onClick={(e) => openProfileMenu(e.currentTarget)}
                    >
                      <Avatar
                        src={userAvatarSrc}
                        sx={{
                          width: { xs: 34, md: 36 },
                          height: { xs: 34, md: 36 },
                          bgcolor: alpha(m.navy, 0.08),
                          color: alpha(m.navy, 0.85),
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {userAvatarSrc ? null : mounted ? getInitials(userLabel) : "U"}
                      </Avatar>
                      <Typography
                        sx={{
                          display: { xs: "none", sm: "block" },
                          fontWeight: 700,
                          fontSize: 18,
                          lineHeight: 1.2,
                          color: alpha(m.navy, 0.78),
                          whiteSpace: "nowrap",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {mounted ? resolvedUserName : ""}
                      </Typography>
                      <ExpandMoreRoundedIcon sx={{ fontSize: 22, color: alpha(m.navy, 0.55) }} />
                    </Stack>
                  </>
                ) : (
                  <Button
                    component={Link}
                    href={resolvedLoginHref}
                    variant="contained"
                    disableElevation
                    sx={{
                      ...pillPrimarySx,
                      minWidth: { xs: 92, sm: 100, md: 108 },
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
                        minWidth: { xs: 112, sm: 120, md: 128 },
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

      {isAuthed ? (
        <ClientProfileMenuPopover
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={closeProfileMenu}
          name={resolvedUserName}
          email={userLabel}
          avatarSrc={userAvatarSrc}
        />
      ) : null}
    </Box>
  );
}
