"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen, {
  AuthEmailPrimaryButton,
} from "../../../components/auth/AuthEmailScreen";

const SIGNUP_EMAIL_KEY = "mollure_signup_email";

export default function CheckEmailPage() {
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
      window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = `mailto:${email}`;
  }, [email]);

  return (
    <AuthEmailScreen>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: 22, sm: 26 },
          color: alpha(m.navy, 0.88),
          lineHeight: 1.25,
        }}
      >
        One Last Step To Get Started!
      </Typography>
      <Typography
        sx={{
          mt: 1.5,
          fontWeight: 600,
          fontSize: 14,
          color: alpha(m.navy, 0.58),
          lineHeight: 1.65,
        }}
      >
        Welcome to Mollure! We are thrilled to have you. Please verify your
        email address to complete your registration and unlock all features.
      </Typography>
      {email ? (
        <Typography
          sx={{ mt: 1.25, fontWeight: 800, fontSize: 13, color: m.teal }}
        >
          {email}
        </Typography>
      ) : null}
      <AuthEmailPrimaryButton onClick={openMailClient}>
        Verify Your Email
      </AuthEmailPrimaryButton>
      <Typography
        sx={{
          mt: 2,
          fontSize: 12,
          fontWeight: 600,
          color: alpha(m.navy, 0.45),
          lineHeight: 1.5,
        }}
      >
        Open your inbox and click the verification link we sent you.
      </Typography>
      <Typography
        sx={{
          mt: 1.5,
          fontSize: 11.5,
          fontWeight: 600,
          color: alpha(m.navy, 0.4),
        }}
      >
        If you did not sign up for this account, you can ignore this email.{" "}
        <Typography
          component={Link}
          href="/auth/login"
          sx={{ fontSize: "inherit", fontWeight: 800, color: m.teal }}
        >
          Back to login
        </Typography>
      </Typography>
    </AuthEmailScreen>
  );
}
