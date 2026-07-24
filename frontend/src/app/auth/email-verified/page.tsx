"use client";

import Link from "next/link";
import { Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen, {
  AuthEmailPrimaryButton,
  AuthEmailStatusIcon,
} from "../../../components/auth/AuthEmailScreen";

export default function EmailVerifiedPage() {
  const m = useTheme().palette.mollure;

  return (
    <AuthEmailScreen icon={<AuthEmailStatusIcon variant="success" />}>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: 22, sm: 26 },
          color: alpha(m.navy, 0.88),
          lineHeight: 1.25,
        }}
      >
        Your Email Has Been Verified!
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
        Thank you for your registration! Your account is under review.
      </Typography>
      <AuthEmailPrimaryButton href="/auth/login">
        Go to Login
      </AuthEmailPrimaryButton>
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
    </AuthEmailScreen>
  );
}
