"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { SIGNUP_EMAIL_KEY } from "../../../lib/auth-storage";
import { checkEmailPageData } from "./checkEmail.data";

export function useCheckEmailPage() {
  const m = useTheme().palette.mollure;
  const searchParams = useSearchParams();
  const email =
    searchParams.get("email") ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem(SIGNUP_EMAIL_KEY)
      : "") ||
    "";

  const openMailClient = React.useCallback(() => {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (domain.includes("gmail")) {
      window.open(
        checkEmailPageData.gmailUrl,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    window.location.href = `mailto:${email}`;
  }, [email]);

  return { m, email, openMailClient };
}
