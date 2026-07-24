"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import {
  Box,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Logo } from "../../../images";
import { AppButton } from "../common";
import {
  adminDashboardNavItem,
  adminNavSections,
  type AdminNavItem,
  type AdminNavSection,
} from "./adminNav";

const DRAWER_WIDTH = 272;

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/admin/dashboard" && pathname.startsWith(href))
  );
}

function sectionContainsActive(pathname: string, section: AdminNavSection) {
  return section.items.some((item) => isNavItemActive(pathname, item.href));
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const Icon = item.icon;

  return (
    <Box
      component={Link}
      href={item.href}
      onClick={onNavigate}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.75,
        py: 1.1,
        borderRadius: 2,
        textDecoration: "none",
        color: active ? tokens.white : tokens.footerText,
        bgcolor: active ? alpha(tokens.teal, 0.28) : "transparent",
        transition: "background-color 160ms ease",
        "&:hover": {
          bgcolor: active
            ? alpha(tokens.teal, 0.32)
            : alpha(tokens.white, 0.06),
        },
      }}
    >
      <Icon
        sx={{ fontSize: 20, color: active ? tokens.teal : tokens.footerMuted }}
      />
      <Typography
        sx={{ fontSize: 13.5, fontWeight: active ? 600 : 500, flex: 1 }}
      >
        {item.label}
      </Typography>
      {item.badge ? (
        <Chip
          label={item.badge}
          size="small"
          sx={{
            height: 20,
            minWidth: 20,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: tokens.teal,
            color: tokens.white,
            "& .MuiChip-label": { px: 0.75 },
          }}
        />
      ) : null}
      {item.showTrailingArrow ? (
        <ChevronRightOutlinedIcon
          sx={{ fontSize: 18, color: tokens.footerMuted }}
        />
      ) : null}
    </Box>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const dashboardActive = isNavItemActive(pathname, adminDashboardNavItem.href);

  const [collapsedSections, setCollapsedSections] = React.useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      adminNavSections.map((section) => [
        section.id,
        section.collapsible ? !sectionContainsActive(pathname, section) : false,
      ]),
    ),
  );

  React.useEffect(() => {
    setCollapsedSections((current) => {
      const next = { ...current };
      for (const section of adminNavSections) {
        if (section.collapsible && sectionContainsActive(pathname, section)) {
          next[section.id] = false;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  return (
    <Stack sx={{ height: "100%", py: 2.5, px: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 1, mb: 3 }}
      >
        <Image src={Logo} alt="Mollure" width={32} height={32} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: tokens.white,
          }}
        >
          Mollure
        </Typography>
      </Stack>

      <Stack spacing={0.5} sx={{ flex: 1, overflowY: "auto" }}>
        <NavLink
          item={adminDashboardNavItem}
          active={dashboardActive}
          onNavigate={onNavigate}
        />

        {adminNavSections.map((section) => {
          const collapsed = Boolean(collapsedSections[section.id]);

          return (
            <Box key={section.id} sx={{ mt: 1.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.25, py: 0.75 }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: tokens.footerMuted,
                  }}
                >
                  {section.label}
                </Typography>
                {section.collapsible ? (
                  <IconButton
                    size="small"
                    onClick={() => toggleSection(section.id)}
                    aria-label={
                      collapsed
                        ? `Expand ${section.label}`
                        : `Collapse ${section.label}`
                    }
                    sx={{ color: tokens.footerMuted, p: 0.25 }}
                  >
                    {collapsed ? (
                      <ExpandMoreOutlinedIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandLessOutlinedIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                ) : null}
              </Stack>

              <Collapse in={!collapsed} timeout={180}>
                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isNavItemActive(pathname, item.href)}
                      onNavigate={onNavigate}
                    />
                  ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Stack>

      <Box
        sx={{
          mt: 2,
          p: 1.75,
          borderRadius: 2,
          bgcolor: alpha(tokens.white, 0.06),
          border: `1px solid ${alpha(tokens.white, 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <HeadsetMicOutlinedIcon
            sx={{ fontSize: 20, color: tokens.teal, mt: 0.25 }}
          />
          <Stack spacing={1}>
            <Typography
              sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.white }}
            >
              Need Help?
            </Typography>
            <Typography
              sx={{ fontSize: 12, lineHeight: 1.5, color: tokens.footerMuted }}
            >
              If you have any questions or need support, feel free to contact
              us.
            </Typography>
            <AppButton
              variant="outlined"
              size="small"
              sx={{
                alignSelf: "flex-start",
                borderColor: tokens.teal,
                color: tokens.teal,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 12.5,
                px: 1.75,
                "&:hover": {
                  borderColor: tokens.teal,
                  bgcolor: alpha(tokens.teal, 0.08),
                },
              }}
            >
              Contact Support
            </AppButton>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  const drawerSx = {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: DRAWER_WIDTH,
      boxSizing: "border-box",
      bgcolor: tokens.footer,
      borderRight: `1px solid ${alpha(tokens.white, 0.08)}`,
    },
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: "none", md: "block" }, ...drawerSx }}
      >
        <SidebarContent />
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, ...drawerSx }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH };
