"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import {
  Avatar,
  Badge,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo } from "../../../../images";
import { HeaderNavText } from "../../ui/typography";
import ClientProfileMenuPopover from "../ClientProfileMenuPopover";
import ClientNotificationsDrawer from "../ClientNotificationsDrawer";
import NotificationBookingSummaryModal from "../NotificationBookingSummaryModal";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  displayNotificationTitle,
  type AppNotificationItem,
} from "../../../store/services/notificationsApi";
import type { ClientNotificationItem } from "../../../data/clientNotifications.data";
import { useAppSelector } from "../../../store/hooks";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import ProfessionalProfileMenuPopover from "../ProfessionalProfileMenuPopover";

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
function mapNotificationToDrawerItem(
  item: AppNotificationItem,
): ClientNotificationItem {
  return {
    id: item.id,
    professionalName: item.actorName ?? "—",
    actorName: item.actorName ?? "—",
    statusLabel: displayNotificationTitle(item),
    statusType: item.statusType,
    bookingIdLabel: item.bookingIdLabel ?? "Booking",
    timeLabel: item.timeLabel,
    href: item.href,
    read: item.read,
    bookingId: item.bookingId,
    bookingRef: item.bookingRef,
    message: item.message,
  };
}

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
  isAuthed: isAuthedProp,
  userLabel: userLabelProp,
  userName,
  userAvatarSrc,
  rightSlot,
  maxWidth = "xl",
  bottomBorder = true,
}: MollureMarketingHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const [persisted, setPersisted] = React.useState<ReturnType<
    typeof getPersistedAuthSession
  > | null>(null);
  const pathname = usePathname() ?? "";
  const pathForActive = activePath ?? pathname;
  const isProfessionalsRoute =
    pathForActive === "/professionals" ||
    pathForActive.startsWith("/professionals/");
  const resolvedLoginLabel = primaryActionLabel ?? loginLabel ?? "login";
  const resolvedLoginHref = primaryActionHref ?? loginHref ?? "/auth/login";
  const derivedAuthed = Boolean(accessToken || persisted?.accessToken);
  const isAuthed = isAuthedProp ?? derivedAuthed;
  const userLabel =
    userLabelProp ??
    user?.email ??
    persisted?.user?.email ??
    "user@example.com";
  const resolvedUserName = toDisplayName(userName, userLabel);
  const userType = user?.user_type ?? persisted?.user?.user_type ?? null;
  const isProfessionalContext =
    userType === "professional" || isProfessionalsRoute;
  const notificationAudience = isProfessionalContext
    ? ("professional" as const)
    : ("client" as const);
  const resolvedHomeHref =
    homeHref === "/" && isProfessionalContext ? "/professionals" : homeHref;
  const showNotifications = Boolean(isAuthed);
  const { data: notificationsData } = useGetMyNotificationsQuery(
    { audience: notificationAudience },
    {
      skip: !showNotifications,
    },
  );
  const { data: unreadData } = useGetUnreadNotificationCountQuery(
    { audience: notificationAudience },
    {
      skip: !showNotifications,
    },
  );
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const notificationItems = React.useMemo(
    () =>
      (notificationsData?.data ?? [])
        .filter((item) => item.audience === notificationAudience)
        .map(mapNotificationToDrawerItem),
    [notificationsData?.data, notificationAudience],
  );
  const unreadCount = unreadData?.data?.count ?? 0;
  const [mounted, setMounted] = React.useState(false);
  const [profileAnchor, setProfileAnchor] = React.useState<HTMLElement | null>(
    null,
  );
  const openProfileMenu = (anchor: HTMLElement) => setProfileAnchor(anchor);
  const closeProfileMenu = () => setProfileAnchor(null);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [selectedNotification, setSelectedNotification] =
    React.useState<ClientNotificationItem | null>(null);
  const closeMobileNav = () => setMobileNavOpen(false);
  const openNotifications = () => setNotificationsOpen(true);
  const closeNotifications = () => setNotificationsOpen(false);
  const closeNotificationSummary = () => setSelectedNotification(null);

  const handleNotificationItemClick = (item: ClientNotificationItem) => {
    if (!item.read) void markNotificationRead(item.id);
    setSelectedNotification(item);
    closeNotifications();
  };

  const handleMarkAllNotificationsRead = () => {
    void markAllNotificationsRead({ audience: notificationAudience });
  };

  React.useEffect(() => {
    setMounted(true);
    setPersisted(getPersistedAuthSession());
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
    fontWeight: 500,
  };

  const audienceSwitchSx = {
    ...pillOutlineSx,
    maxWidth: { xs: 170, sm: 200, md: 240 },
    minWidth: 0,
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center" as const,
    textTransform: "none" as const,
  };

  return (
    <Box component="header">
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#fff",
          borderBottom: bottomBorder
            ? `1px solid ${alpha(m.teal, 0.45)}`
            : "none",
        }}
      >
        <Container
          maxWidth={maxWidth}
          sx={{
            py: 1.5,
            px: { xs: 2, sm: 3, md: 5, lg: 6, xl: 8 },
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
              columnGap: { xs: 1, md: 2 },
              rowGap: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                pl: { md: 2, lg: 3, xl: 4 },
                minWidth: 0,
                gap: 0.5,
              }}
            >
              {navItems.length ? (
                <IconButton
                  aria-label="Open menu"
                  onClick={() => setMobileNavOpen(true)}
                  sx={{
                    display: { xs: "inline-flex", md: "none" },
                    color: alpha(m.navy, 0.82),
                    width: { xs: 34, md: 36 },
                    height: { xs: 34, md: 36 },
                    flexShrink: 0,
                  }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              ) : null}
              <Box
                component={Link}
                href={resolvedHomeHref}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  flexShrink: 1,
                  minWidth: 0,
                  width: { xs: 100, sm: 140, md: 160 },
                }}
              >
                <Image
                  src={Logo}
                  alt="Mollure"
                  width={160}
                  height={38}
                  priority
                  style={{ width: "100%", height: "auto" }}
                />
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
                        color: active
                          ? alpha(m.navy, 0.92)
                          : alpha(m.navy, 0.58),
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
        spacing={{ xs: 0.75, sm: 1.4, md: 1.6 }}
                sx={{
                  flexShrink: 0,
                  justifyContent: "flex-end",
                  justifySelf: "end",
                  alignItems: "center",
                  flexWrap: "nowrap",
                  rowGap: 1,
                  pr: { md: 2, lg: 3, xl: 4 },
                  pl: { xs: 0.5, md: 0 },
                  width: { xs: "auto", md: "100%" },
                  minWidth: 0,
                }}
              >
                <AppButton
                  tone="secondary"
                  startIcon={
                    <LanguageRoundedIcon
                      sx={{ fontSize: 20, color: alpha(m.navy, 0.9) }}
                    />
                  }
                  endIcon={
                    <ExpandMoreRoundedIcon
                      sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }}
                    />
                  }
                  sx={{
                    ...pillOutlineSx,
                    minWidth: { xs: 56, sm: 84, md: 92 },
                    justifyContent: "space-between",
                    gap: { xs: 0.4, sm: 1.1 },
                    "& .MuiButton-startIcon": { mr: 0 },
                    "& .MuiButton-endIcon": {
                      ml: 0,
                      display: { xs: "none", sm: "inline-flex" },
                    },
                  }}
                >
                  {localeLabel}
                </AppButton>

                {isAuthed ? (
                  <>
                    {showNotifications ? (
                      <IconButton
                        aria-label="Notifications"
                        onClick={openNotifications}
                        sx={{
                          width: { xs: 34, md: 36 },
                          height: { xs: 34, md: 36 },
                          borderRadius: 999,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        <Badge
                          badgeContent={
                            unreadCount > 0
                              ? unreadCount > 9
                                ? "9+"
                                : unreadCount
                              : 0
                          }
                          color="error"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: 10,
                              minWidth: 18,
                              height: 18,
                              fontWeight: 900,
                            },
                          }}
                        >
                          <NotificationsNoneRoundedIcon sx={{ fontSize: 22 }} />
                        </Badge>
                      </IconButton>
                    ) : null}

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
                        {userAvatarSrc
                          ? null
                          : mounted
                            ? getInitials(userLabel)
                            : "U"}
                      </Avatar>
                      <Typography
                        sx={{
                          display: { xs: "none", md: "block" },
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
                      <ExpandMoreRoundedIcon
                        sx={{ fontSize: 22, color: alpha(m.navy, 0.55) }}
                      />
                    </Stack>
                  </>
                ) : (
                  <AppButton
                    component={Link}
                    href={resolvedLoginHref}
                    tone="primary"
                    sx={{
                      ...pillBaseSx,
                      fontWeight: 500,
                      boxShadow: "none",
                      minWidth: { xs: 80, sm: 100, md: 108 },
                    }}
                  >
                    {resolvedLoginLabel}
                  </AppButton>
                )}

                {!isAuthed && professionalLinkLabel ? (
                  professionalHref ? (
                    <AppButton
                      component={Link}
                      href={professionalHref}
                      tone="secondary"
                      sx={{
                        ...audienceSwitchSx,
                        display: {
                          xs: navItems.length ? "none" : "inline-flex",
                          md: "inline-flex",
                        },
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: { xs: 112, sm: 120, md: 128 },
                      }}
                    >
                      {professionalLinkLabel}
                    </AppButton>
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

      {navItems.length ? (
        <Drawer
          anchor="right"
          open={mobileNavOpen}
          onClose={closeMobileNav}
          PaperProps={{
            sx: {
              width: "min(320px, 100vw)",
              maxWidth: "100vw",
              bgcolor: "#fff",
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${alpha(m.teal, 0.45)}`,
            }}
          >
            <Box
              sx={{
                width: 118,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Image
                src={Logo}
                alt="Mollure"
                width={160}
                height={38}
                style={{ width: "100%", height: "auto" }}
              />
            </Box>
            <IconButton
              aria-label="Close menu"
              onClick={closeMobileNav}
              sx={{ color: alpha(m.navy, 0.82), width: 34, height: 34 }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Stack spacing={0.5} sx={{ px: 1.5, py: 2 }}>
            {navItems.map((item) => {
              const active = isNavActive(pathForActive, item);
              return (
                <HeaderNavText
                  key={item.href + item.label}
                  component={Link}
                  href={item.href}
                  onClick={closeMobileNav}
                  sx={{
                    display: "block",
                    py: 1.1,
                    px: 1.25,
                    borderRadius: "10px",
                    lineHeight: 1.25,
                    fontWeight: active ? 600 : 500,
                    color: active ? alpha(m.navy, 0.92) : alpha(m.navy, 0.58),
                    textDecoration: "none",
                    bgcolor: active ? alpha(m.teal, 0.1) : "transparent",
                    "&:hover": {
                      color: m.navy,
                      bgcolor: alpha(m.navy, 0.04),
                    },
                  }}
                >
                  {item.label}
                </HeaderNavText>
              );
            })}
            {!isAuthed && professionalLinkLabel && professionalHref ? (
              <AppButton
                component={Link}
                href={professionalHref}
                tone="secondary"
                onClick={closeMobileNav}
                sx={{
                  ...audienceSwitchSx,
                  mt: 1,
                  alignSelf: "stretch",
                  maxWidth: "100%",
                  display: { xs: "inline-flex", md: "none" },
                }}
              >
                {professionalLinkLabel}
              </AppButton>
            ) : null}
          </Stack>
        </Drawer>
      ) : null}

      {isAuthed ? (
        isProfessionalContext ? (
          <ProfessionalProfileMenuPopover
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={closeProfileMenu}
            name={resolvedUserName}
            email={userLabel}
            avatarSrc={userAvatarSrc}
          />
        ) : (
          <ClientProfileMenuPopover
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={closeProfileMenu}
            name={resolvedUserName}
            email={userLabel}
            avatarSrc={userAvatarSrc}
          />
        )
      ) : null}

      {showNotifications ? (
        <>
          <ClientNotificationsDrawer
            open={notificationsOpen}
            onClose={closeNotifications}
            title="Notifications"
            items={notificationItems}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onItemClick={handleNotificationItemClick}
          />
          <NotificationBookingSummaryModal
            open={Boolean(selectedNotification)}
            onClose={closeNotificationSummary}
            notification={selectedNotification}
            isProfessional={isProfessionalContext}
          />
        </>
      ) : null}
    </Box>
  );
}
