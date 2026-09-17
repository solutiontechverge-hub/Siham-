"use client";

import AppButton from "./AppButton";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Avatar, Box, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureBodyMutedSx, mollurePageTitleSx } from "../../theme/mollureHierarchy";
import { clearAuthSessionState } from "../../lib/clearAuthSessionState";
import { useAppDispatch } from "../../store/hooks";
import { useSnackbar } from "./AppSnackbar";
import { queueSnackbarFlash } from "../../lib/snackbarFlash";
import AppModal from "./AppModal";
import ModalConfirmBody from "./ModalConfirmBody";
import { ModalCancelApplyFooter } from "./FinanceDrawerFooter";
import {
  getProfileMenuInitials,
  profileMenuActiveBtnSx,
  profileMenuOutlinedBtnSx,
} from "./profileMenu.shared";

function isMenuPathActive(pathname: string, matches: readonly string[]) {
  return matches.some(
    (match) => pathname === match || pathname.startsWith(`${match}/`),
  );
}

export type ProfessionalProfileMenuPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  name: string;
  email: string;
  avatarSrc?: string;
};

export default function ProfessionalProfileMenuPopover({
  anchorEl,
  open,
  onClose,
  name,
  email,
  avatarSrc,
}: ProfessionalProfileMenuPopoverProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleLogout = () => {
    onClose();
    clearAuthSessionState(dispatch);
    const logoutMessage = "Signed out successfully.";
    queueSnackbarFlash({ severity: "success", message: logoutMessage });
    showSnackbar({ severity: "success", message: logoutMessage });
    router.replace("/auth/login");
  };

  const openDeleteDialog = () => {
    onClose();
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleConfirmDeleteAccount = () => {
    closeDeleteDialog();
    showSnackbar({
      severity: "info",
      message: "Account deletion is not available yet. Please contact support.",
    });
  };

  const outlinedBtnSx = profileMenuOutlinedBtnSx(tokens);
  const activeBtnSx = profileMenuActiveBtnSx(tokens);

  const deleteBtnSx = {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 700,
    color: alpha(tokens.navy, 0.42),
    borderColor: tokens.border,
    py: 1.1,
    "&:hover": {
      borderColor: tokens.inputBorderHover,
      bgcolor: "rgba(52, 74, 102, 0.03)",
      color: alpha(tokens.navy, 0.52),
    },
  } as const;

  const menuItems = [
    {
      label: "Calendar",
      href: "/professionals/calendar",
      matches: ["/professionals/calendar", "/professionals/fixed-location/calendar"],
    },
    {
      label: "Client",
      href: "/professionals/client",
      matches: ["/professionals/client", "/professionals/fixed-location/client"],
    },
    {
      label: "Finance",
      href: "/professionals/finance/overview",
      matches: ["/professionals/finance", "/professionals/fixed-location/finance"],
    },
    {
      label: "Analytics",
      href: "/professionals/analytics",
      matches: ["/professionals/analytics", "/professionals/fixed-location/analytics"],
    },
    {
      label: "Profile",
      href: "/professionals/profile",
      matches: [
        "/professionals/profile",
        "/professionals/fixed-location/profile",
        "/professionals/desired-location/profile",
      ],
    },
    {
      label: "Go to listing",
      href: "/clients/listing",
      matches: ["/clients/listing"],
    },
  ] as const;

  return (
    <>
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
            const active = isMenuPathActive(pathname, item.matches);
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

          <AppButton
            variant="outlined"
            fullWidth
            sx={deleteBtnSx}
            onClick={openDeleteDialog}
          >
            Delete account
          </AppButton>

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

      <AppModal
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        title="Delete account"
        contentMinHeight={220}
        headerTone="danger"
        footer={
          <ModalCancelApplyFooter
            onCancel={closeDeleteDialog}
            onPrimary={handleConfirmDeleteAccount}
            primaryLabel="Delete account"
            primaryTone="danger"
            justifyContent="center"
            buttonSx={{ height: 40 }}
            spacing={1}
          />
        }
      >
        <ModalConfirmBody
          icon={
            <ReportProblemRoundedIcon sx={{ fontSize: 30, color: "#E53935" }} />
          }
          iconFrame="rounded"
          iconColor="#E53935"
          iconFrameSize={52}
          bodyMaxWidth={300}
          bodyOpacity={0.82}
          py={3}
          px={2.5}
          bodySx={{ fontSize: 15, lineHeight: 1.45 }}
          body="This will permanently delete your professional account and cannot be undone."
        />
      </AppModal>
    </>
  );
}
