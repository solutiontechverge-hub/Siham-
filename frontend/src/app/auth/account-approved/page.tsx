"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen, { AuthEmailPrimaryButton, AuthEmailStatusIcon } from "../../../components/auth/AuthEmailScreen";

export default function AccountApprovedPage() {
  const m = useTheme().palette.mollure;
  const searchParams = useSearchParams();
  const stripeStatus = searchParams.get("stripe") ?? "not_connected";
  const stripeConnected = stripeStatus === "connected";
  const showStripeCta = !stripeConnected;

  return (
    <AuthEmailScreen icon={<AuthEmailStatusIcon variant="success" />}>
      <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, sm: 26 }, color: alpha(m.navy, 0.88), lineHeight: 1.25 }}>
        {showStripeCta ? "Welcome to Mollure" : "Your Account is Approved!"}
      </Typography>
      <Typography sx={{ mt: 1.5, fontWeight: 600, fontSize: 14, color: alpha(m.navy, 0.58), lineHeight: 1.65 }}>
        {showStripeCta
          ? "Congratulations! Your Mollure professional account has been validated. The next step is to connect your Stripe account to start receiving payments securely."
          : "Thank you for joining Mollure. Your account has been validated and your Stripe account is connected."}
      </Typography>
      {showStripeCta ? (
        <AuthEmailPrimaryButton href="/auth/login?redirect=/professionals/finance/setting">
          Finalize Stripe Onboarding
        </AuthEmailPrimaryButton>
      ) : (
        <AuthEmailPrimaryButton href="/auth/login">Go to Login</AuthEmailPrimaryButton>
      )}
      <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.45) }}>
        <Typography component={Link} href="/auth/login" sx={{ fontSize: "inherit", fontWeight: 800, color: m.teal }}>
          Sign in
        </Typography>{" "}
        to continue to your dashboard.
      </Typography>
    </AuthEmailScreen>
  );
}
