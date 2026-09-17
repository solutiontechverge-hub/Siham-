"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { RESET_EMAIL_KEY } from "../../../lib/auth-storage";
import { useForgotPasswordMutation } from "../../../store/services/authApi";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { parseEmail } from "../../../lib/inputSchema";
import { forgotPasswordPageData } from "./forgotPassword.data";

export function useForgotPasswordPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailResult = parseEmail(email);
    if (!emailResult.ok) {
      showSnackbar({ severity: "error", message: emailResult.error });
      return;
    }

    try {
      const result = await forgotPassword({
        email: emailResult.value,
      }).unwrap();

      showSnackbar({
        severity: "success",
        message:
          result.message || forgotPasswordPageData.messages.otpSentFallback,
      });
      window.sessionStorage.setItem(RESET_EMAIL_KEY, emailResult.value);
      window.setTimeout(() => {
        router.push(forgotPasswordPageData.redirectHref);
      }, 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          forgotPasswordPageData.messages.sendFailed,
        ),
      });
    }
  };

  return {
    m,
    cardBorder,
    email,
    setEmail,
    isLoading,
    handleSubmit,
  };
}
