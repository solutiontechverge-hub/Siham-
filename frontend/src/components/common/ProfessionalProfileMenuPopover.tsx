"use client";

import AppButton from "./AppButton";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Avatar, Box, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { clearAuthSessionState } from "../../lib/clearAuthSessionState";
import { useAppDispatch } from "../../store/hooks";
import { useSnackbar } from "./AppSnackbar";
import { queueSnackbarFlash } from "../../lib/snackbarFlash";
import AppModal from "./AppModal";

function getInitials(emailOrName?: string) {
  const base = (emailOrName ?? "").trim();
  if (!base) return "U";
  const cleaned = base.split("@")[0] ?? base;
  const parts = cleaned.split(/[._\s-]+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return `${a}${b}`.slice(0, 2);
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
    { label: "Calendar", href: "/professionals/calendar" },
    { label: "Client", href: "/professionals/client" },
    { label: "Finance", href: "/professionals/finance/overview" },
    { label: "Analytics", href: "/professionals/analytics" },
    { label: "Profile", href: "/professionals/profile" },
    { label: "Go to listing", href: "/clients/listing" },
  ] as const;

  const deleteDialogFooter = (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{ px: 2.5, py: 2 }}
    >
      <AppButton
        onClick={closeDeleteDialog}
        variant="outlined"
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 800,
          borderColor: alpha(tokens.navy, 0.14),
          color: alpha(tokens.navy, 0.72),
          bgcolor: "#fff",
          height: 34,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Cancel
      </AppButton>
      <AppButton
        variant="contained"
        disableElevation
        onClick={handleConfirmDeleteAccount}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 900,
          bgcolor: tokens.teal,
          "&:hover": { bgcolor: tokens.tealDark },
          height: 34,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Delete account
      </AppButton>
    </Stack>
  );

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
              <Typography
                sx={{ color: tokens.slate, fontSize: 12.5, mt: 0.25 }}
              >
                {email}
              </Typography>
            </Box>
          </Stack>

          {menuItems.map((item) => (
            <AppButton
              key={item.href}
              component={Link}
              href={item.href}
              variant="outlined"
              fullWidth
              sx={outlinedBtnSx}
              onClick={onClose}
            >
              {item.label}
            </AppButton>
          ))}

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
        footer={deleteDialogFooter}
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              mx: "auto",
              mb: 1.5,
              bgcolor: alpha("#E53935", 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReportProblemRoundedIcon sx={{ fontSize: 30, color: "#E53935" }} />
          </Box>
          <Typography
            sx={{
              fontWeight: 900,
              color: alpha(tokens.navy, 0.82),
              fontSize: 15,
              lineHeight: 1.45,
              maxWidth: 300,
              mx: "auto",
            }}
          >
            This will permanently delete your professional account and cannot be
            undone.
          </Typography>
        </Box>
      </AppModal>
    </>
  );
}
