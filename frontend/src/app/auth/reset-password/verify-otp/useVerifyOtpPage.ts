"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  RESET_EMAIL_KEY,
  RESET_USER_ID_KEY,
} from "../../../../lib/auth-storage";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
} from "../../../../store/services/authApi";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { INPUT_LIMITS, parseEmail, parseOtp } from "../../../../lib/inputSchema";
import { verifyOtpPageData } from "./verifyOtp.data";

export const OTP_LEN = INPUT_LIMITS.otp;

export function useVerifyOtpPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState<string[]>(() =>
    Array(OTP_LEN).fill(""),
  );
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: isResending }] =
    useForgotPasswordMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  React.useEffect(() => {
    const savedEmail = window.sessionStorage.getItem(RESET_EMAIL_KEY) || "";
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (value.length > 0 && digit === "") {
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < OTP_LEN - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailResult = parseEmail(email);
    const otpResult = parseOtp(digits.join(""), { length: OTP_LEN });
    if (!emailResult.ok) {
      showSnackbar({ severity: "error", message: emailResult.error });
      return;
    }
    if (!otpResult.ok) {
      showSnackbar({
        severity: "error",
        message: otpResult.error,
      });
      return;
    }

    try {
      const result = await verifyOtp({
        email: emailResult.value,
        otp: otpResult.value,
      }).unwrap();

      window.sessionStorage.setItem(
        RESET_EMAIL_KEY,
        email.trim().toLowerCase(),
      );
      window.sessionStorage.setItem(
        RESET_USER_ID_KEY,
        String(result.data.user_id),
      );
      showSnackbar({
        severity: "success",
        message: verifyOtpPageData.messages.otpVerified,
      });

      window.setTimeout(() => {
        router.push(verifyOtpPageData.redirectHref);
      }, 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          verifyOtpPageData.messages.verifyFailed,
        ),
      });
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showSnackbar({
        severity: "error",
        message: verifyOtpPageData.messages.enterEmailFirst,
      });
      return;
    }

    try {
      const result = await forgotPassword({
        email: email.trim().toLowerCase(),
      }).unwrap();

      window.sessionStorage.setItem(
        RESET_EMAIL_KEY,
        email.trim().toLowerCase(),
      );
      showSnackbar({
        severity: "success",
        message:
          result.message || verifyOtpPageData.messages.otpResentFallback,
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          verifyOtpPageData.messages.resendFailed,
        ),
      });
    }
  };

  return {
    theme,
    m,
    cardBorder,
    digits,
    inputRefs,
    isVerifying,
    isResending,
    handleDigitChange,
    handleDigitKeyDown,
    handleSubmit,
    handleResend,
  };
}
