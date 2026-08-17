"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Box, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { clearAuthSessionState } from "../../../lib/clearAuthSessionState";
import { useAppDispatch } from "../../../store/hooks";
import { useSnackbar } from "../AppSnackbar";
import { queueSnackbarFlash } from "../../../lib/snackbarFlash";

function isMenuPathActive(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
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

export type ClientProfileMenuPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  name: string;
  email: string;
  avatarSrc?: string;
};

export default function ClientProfileMenuPopover({
  anchorEl,
  open,
  onClose,
  name,
  email,
  avatarSrc,
}: ClientProfileMenuPopoverProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const handleLogout = () => {
    onClose();
    clearAuthSessionState(dispatch);
    const logoutMessage = "Signed out successfully.";
    queueSnackbarFlash({ severity: "success", message: logoutMessage });
    showSnackbar({ severity: "success", message: logoutMessage });
    router.push("/auth/login");
  };

  const outlinedBtnSx = {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 700,
    color: tokens.navy,
    borderColor: tokens.border,
    py: 1.1,
    "&:hover": {
      borderColor: tokens.inputBorderHover,
      bgcolor: "rgba(52, 74, 102, 0.03)",
    },
  } as const;

  const activeBtnSx = {
    ...outlinedBtnSx,
    fontWeight: 800,
    color: tokens.tealDark,
    borderColor: tokens.teal,
    bgcolor: alpha(tokens.teal, 0.12),
    "&:hover": {
      borderColor: tokens.tealDark,
      bgcolor: alpha(tokens.teal, 0.18),
    },
  } as const;

  const menuItems = [
    { label: "Booking", href: "/clients/booking", match: "/clients/booking" },
    { label: "Favorites", href: "/clients/favourites", match: "/clients/favourites" },
    { label: "Profile", href: "/clients/profile", match: "/clients/profile" },
  ] as const;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          mt: 1,
          width: 360,
          borderRadius: "10px",
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 18px 45px rgba(16, 24, 40, 0.14)",
          p: 2.25,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={avatarSrc}
            sx={{
              width: 54,
              height: 54,
              bgcolor: alpha(tokens.navy, 0.08),
              color: alpha(tokens.navy, 0.85),
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {avatarSrc ? null : getInitials(name || email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                color: tokens.navy,
                fontSize: 18,
                lineHeight: 1.2,
              }}
            >
              {name}
            </Typography>
            <Typography sx={{ color: tokens.slate, fontSize: 12.5, mt: 0.25 }}>
              {email}
            </Typography>
          </Box>
        </Stack>

        {menuItems.map((item) => {
          const active = isMenuPathActive(pathname, item.match);
          return (
            <AppButton
              key={item.href}
              component={Link}
              href={item.href}
              variant="outlined"
              fullWidth
              sx={active ? activeBtnSx : outlinedBtnSx}
              onClick={onClose}
            >
              {item.label}
            </AppButton>
          );
        })}

        <Box sx={{ pt: 0.5 }}>
          <AppButton
            component={Link}
            href="/clients/listing"
            variant="outlined"
            fullWidth
            sx={
              isMenuPathActive(pathname, "/clients/listing")
                ? activeBtnSx
                : outlinedBtnSx
            }
            onClick={onClose}
          >
            Go to listing page
          </AppButton>
        </Box>

        <Box sx={{ pt: 0.5 }}>
          <AppButton
            variant="outlined"
            fullWidth
            sx={outlinedBtnSx}
            onClick={onClose}
          >
            Delete Account
          </AppButton>
        </Box>

        <AppButton
          variant="contained"
          fullWidth
          onClick={handleLogout}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 900,
            bgcolor: tokens.teal,
            color: tokens.white,
            py: 1.2,
            "&:hover": { bgcolor: tokens.tealDark, color: tokens.white },
          }}
        >
          Logout
        </AppButton>
      </Stack>
    </Popover>
  );
}
