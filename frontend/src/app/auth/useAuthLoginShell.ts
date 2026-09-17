"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../lib/api-error";
import { useAuthSessionLogin } from "../../hooks/useAuthSessionLogin";
import { useLoginMutation } from "../../store/services/authApi";
import { useSnackbar } from "../../components/common/AppSnackbar";
import { parseEmail, parsePassword, rejectInvalid } from "../../lib/inputSchema";
import type { AuthStripHeaderConfig } from "../../data/marketingShell.data";
import { authLoginCopy } from "./authLogin.data";

export type AuthLoginShellProps = {
  header: AuthStripHeaderConfig;
  /** “Create account” link target (client vs professional signup). */
  signupHref: string;
};

export function useAuthLoginShell() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { showSnackbar } = useSnackbar();
  const { completeLogin } = useAuthSessionLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const rememberRef = React.useRef(remember);
  rememberRef.current = remember;
  const [login, { isLoading }] = useLoginMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      email: parseEmail(email),
      password: parsePassword(password),
    });
    if (!parsed.ok) {
      const message =
        parsed.errors.email ||
        parsed.errors.password ||
        authLoginCopy.validationFallback;
      showSnackbar({ severity: "error", message });
      return;
    }

    try {
      const rememberMe = rememberRef.current;
      const result = await login({
        email: parsed.values.email,
        password: parsed.values.password,
        remember: rememberMe,
      }).unwrap();

      completeLogin(result.data, rememberMe, redirectTo);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, authLoginCopy.loginFailedFallback),
      });
    }
  };

  return {
    m,
    cardBorder,
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    rememberRef,
    isLoading,
    handleSubmit,
    completeLogin,
    showSnackbar,
  };
}
