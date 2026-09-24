"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  parsePassword,
  rejectInvalid,
} from "../../../lib/inputSchema";
import { getPasswordStrength } from "../../../lib/passwordStrength";
import { useChangePasswordMutation } from "../../../store/services/authApi";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { changePasswordPageData } from "./changePassword.data";

export function useChangePasswordPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      currentPassword: parsePassword(currentPassword, {
        label: "Current password",
      }),
      newPassword: parsePassword(newPassword, {
        strong: true,
        label: "New password",
      }),
      confirmPassword: parsePassword(confirmPassword, {
        label: "Repeat new password",
      }),
    });
    if (!parsed.ok) {
      showSnackbar({
        severity: "error",
        message:
          parsed.errors.currentPassword ||
          parsed.errors.newPassword ||
          parsed.errors.confirmPassword ||
          changePasswordPageData.messages.checkPassword,
      });
      return;
    }

    if (parsed.values.newPassword !== parsed.values.confirmPassword) {
      showSnackbar({
        severity: "error",
        message: changePasswordPageData.messages.passwordsMustMatch,
      });
      return;
    }

    if (!getPasswordStrength(parsed.values.newPassword).isStrong) {
      showSnackbar({
        severity: "error",
        message: changePasswordPageData.messages.chooseStrong,
      });
      return;
    }

    if (parsed.values.currentPassword === parsed.values.newPassword) {
      showSnackbar({
        severity: "error",
        message: changePasswordPageData.messages.mustDiffer,
      });
      return;
    }

    try {
      await changePassword({
        current_password: parsed.values.currentPassword,
        new_password: parsed.values.newPassword,
        confirm_password: parsed.values.confirmPassword,
      }).unwrap();

      showSnackbar({
        severity: "success",
        message: changePasswordPageData.messages.success,
      });
      window.setTimeout(() => {
        router.back();
      }, 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          changePasswordPageData.messages.failed,
        ),
      });
    }
  };

  return {
    m,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleSubmit,
    goBack: () => router.back(),
  };
}
