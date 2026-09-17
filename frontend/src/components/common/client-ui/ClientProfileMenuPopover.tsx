"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Box, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureBodyMutedSx, mollurePageTitleSx } from "../../../theme/mollureHierarchy";
import { clearAuthSessionState } from "../../../lib/clearAuthSessionState";
import { useAppDispatch } from "../../../store/hooks";
import { useSnackbar } from "../AppSnackbar";
import { queueSnackbarFlash } from "../../../lib/snackbarFlash";
import {
  getProfileMenuInitials,
  profileMenuActiveBtnSx,
  profileMenuOutlinedBtnSx,
} from "../profileMenu.shared";

function isMenuPathActive(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
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

  const outlinedBtnSx = profileMenuOutlinedBtnSx(tokens);
  const activeBtnSx = profileMenuActiveBtnSx(tokens);

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
            {avatarSrc ? null : getProfileMenuInitials(name || email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={mollurePageTitleSx(tokens.navy, {
                color: tokens.navy,
              })}
            >
              {name}
            </Typography>
            <Typography
              sx={mollureBodyMutedSx(tokens.navy, {
                color: tokens.slate,
                mt: 0.25,
              })}
            >
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
