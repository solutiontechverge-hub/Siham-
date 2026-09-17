"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../lib/api-error";
import { useAuthSessionLogin } from "../../hooks/useAuthSessionLogin";
import { useAdminLoginMutation } from "../../store/services/adminApi";
import { useSnackbar } from "../../components/common/AppSnackbar";
import { parseEmail, parsePassword, rejectInvalid } from "../../lib/inputSchema";
import { adminAuthLoginCopy } from "./adminAuthLogin.data";

export function useAdminAuthLoginShell() {
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
  const [login, { isLoading }] = useAdminLoginMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      email: parseEmail(email),
      password: parsePassword(password),
    });
    if (!parsed.ok) {
      showSnackbar({
        severity: "error",
        message:
          parsed.errors.email ||
          parsed.errors.password ||
          adminAuthLoginCopy.validationFallback,
      });
      return;
    }

    try {
      const rememberMe = rememberRef.current;
      const result = await login({
        email: parsed.values.email,
        password: parsed.values.password,
      }).unwrap();

      completeLogin(
        result.data,
        rememberMe,
        redirectTo || adminAuthLoginCopy.defaultRedirect,
      );
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          adminAuthLoginCopy.loginFailedFallback,
        ),
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
    isLoading,
    handleSubmit,
  };
}
