"use client";

import { useSearchParams } from "next/navigation";
import { Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen, {
  AuthEmailPrimaryButton,
  AuthEmailStatusIcon,
} from "../../../components/auth/AuthEmailScreen";

export default function EmailVerifiedPage() {
  const m = useTheme().palette.mollure;
  const searchParams = useSearchParams();
  // Pros land with ?review=1 (pending). Clients land without it (ready — no Stripe/pending gate).
  // Email-change confirmations land with ?changed=1.
  const underReview = searchParams.get("review") === "1";
  const emailChanged = searchParams.get("changed") === "1";

  return (
    <AuthEmailScreen icon={<AuthEmailStatusIcon variant="success" />}>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 20,
          color: alpha(m.navy, 0.88),
          lineHeight: 1.25,
        }}
      >
        {emailChanged
          ? "Your Email Has Been Updated!"
          : "Your Email Has Been Verified!"}
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
        {emailChanged
          ? "Your Mollure account now uses the new email address. You can sign in with it anytime."
          : underReview
            ? "Thank you for your registration! Your account is under review."
            : "Thank you for signing up. Your account is ready — you can now log in and start using Mollure."}
      </Typography>
      <AuthEmailPrimaryButton href="/auth/login">
        Go to Login
      </AuthEmailPrimaryButton>
      {underReview && !emailChanged ? (
        <Typography
          sx={{
            mt: 2,
            fontSize: 12,
            fontWeight: 600,
            color: alpha(m.navy, 0.45),
          }}
        >
          We will notify you once your account is ready.
        </Typography>
      ) : null}
    </AuthEmailScreen>
  );
}
