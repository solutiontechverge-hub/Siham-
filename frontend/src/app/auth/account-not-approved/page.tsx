"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen, {
  AuthEmailPrimaryButton,
  AuthEmailStatusIcon,
} from "../../../components/auth/AuthEmailScreen";

const REASON_COPY: Record<string, string> = {
  invalid:
    "Your verification link is invalid or has expired. Please sign up again or request a new verification email.",
  inactive:
    "We are sorry to inform you but we found no record that you are a registered professional/salon.",
  missing_token:
    "No verification token was provided. Please use the link from your verification email.",
  error: "We could not verify your email right now. Please try again later.",
};

export default function AccountNotApprovedPage() {
  const m = useTheme().palette.mollure;
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "inactive";
  const body =
    REASON_COPY[reason] ??
    "We are sorry to inform you but we found no record that you are a registered professional/salon.";
  const title =
    reason === "invalid" || reason === "missing_token" || reason === "error"
      ? "Email verification failed"
      : "Your Account is not Approved!";

  return (
    <AuthEmailScreen icon={<AuthEmailStatusIcon variant="error" />}>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: 22, sm: 26 },
          color: alpha(m.navy, 0.88),
          lineHeight: 1.25,
        }}
      >
        {title}
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
        {body}
      </Typography>
      <AuthEmailPrimaryButton href="/auth/signup">
        Back to Sign Up
      </AuthEmailPrimaryButton>
      <Typography
        sx={{
          mt: 2,
          fontSize: 12,
          fontWeight: 600,
          color: alpha(m.navy, 0.45),
        }}
      >
        Need help?{" "}
        <Typography
          component={Link}
          href="/contact-us"
          sx={{ fontSize: "inherit", fontWeight: 800, color: m.teal }}
        >
          Contact support
        </Typography>
      </Typography>
    </AuthEmailScreen>
  );
}
