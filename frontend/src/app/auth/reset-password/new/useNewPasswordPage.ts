"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { RESET_USER_ID_KEY } from "../../../../lib/auth-storage";
import { useResetPasswordMutation } from "../../../../store/services/authApi";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import {
  parsePassword,
  rejectInvalid,
} from "../../../../lib/inputSchema";
import { getPasswordStrength } from "../../../../lib/passwordStrength";
import { newPasswordPageData } from "./newPassword.data";

export function useNewPasswordPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [userId, setUserId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  React.useEffect(() => {
    const savedUserId =
      window.sessionStorage.getItem(RESET_USER_ID_KEY) || "";
    setUserId(savedUserId);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      password: parsePassword(password, { strong: true }),
      confirmPassword: parsePassword(confirmPassword, {
        label: "Confirm password",
      }),
    });
    if (!parsed.ok) {
      showSnackbar({
        severity: "error",
        message:
          parsed.errors.password ||
          parsed.errors.confirmPassword ||
          newPasswordPageData.messages.checkPassword,
      });
      return;
    }

    if (parsed.values.password !== parsed.values.confirmPassword) {
      showSnackbar({
        severity: "error",
        message: newPasswordPageData.messages.passwordsMustMatch,
      });
      return;
    }

    if (!getPasswordStrength(parsed.values.password).isStrong) {
      showSnackbar({
        severity: "error",
        message: newPasswordPageData.messages.chooseStrong,
      });
      return;
    }

    if (!userId) {
      showSnackbar({
        severity: "error",
        message: newPasswordPageData.messages.otpRequired,
      });
      return;
    }

    try {
      await resetPassword({
        user_id: userId,
        new_password: parsed.values.password,
        confirm_password: parsed.values.confirmPassword,
      }).unwrap();

      window.sessionStorage.removeItem(RESET_USER_ID_KEY);
      showSnackbar({
        severity: "success",
        message: newPasswordPageData.messages.resetSuccess,
      });
      router.push(newPasswordPageData.redirectHref);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          newPasswordPageData.messages.resetFailed,
        ),
      });
    }
  };

  return {
    m,
    cardBorder,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleSubmit,
  };
}
