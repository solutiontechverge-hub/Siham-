"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Chip, Drawer, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { adminNavItems } from "./adminNav";

const DRAWER_WIDTH = 272;

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Stack sx={{ height: "100%", py: 2.5, px: 2 }}>
      <Box sx={{ px: 1, mb: 3 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: tokens.white,
          }}
        >
          MOLUR
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.footerMuted, mt: 0.25 }}>
          Admin Console
        </Typography>
      </Box>

      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {adminNavItems.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Box
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1.25,
                borderRadius: 2,
                textDecoration: "none",
                color: active ? tokens.white : tokens.footerText,
                bgcolor: active ? alpha(tokens.teal, 0.22) : "transparent",
                border: active ? `1px solid ${alpha(tokens.teal, 0.35)}` : "1px solid transparent",
                transition: "background-color 160ms ease, border-color 160ms ease",
                "&:hover": {
                  bgcolor: active ? alpha(tokens.teal, 0.28) : alpha(tokens.white, 0.06),
                },
              }}
            >
              <Icon sx={{ fontSize: 20, color: active ? tokens.teal : tokens.footerMuted }} />
              <Typography sx={{ fontSize: 13.5, fontWeight: active ? 600 : 500, flex: 1 }}>
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
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
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
      <Drawer variant="permanent" sx={{ display: { xs: "none", md: "block" }, ...drawerSx }}>
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
