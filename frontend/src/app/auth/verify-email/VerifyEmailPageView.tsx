"use client";

import { CircularProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AuthEmailScreen from "../../../components/auth/AuthEmailScreen";
import { useVerifyEmailPage } from "./useVerifyEmailPage";

export default function VerifyEmailPageView() {
  const { m, message } = useVerifyEmailPage();

  return (
    <AuthEmailScreen>
      <CircularProgress size={36} sx={{ color: m.teal, mb: 2 }} />
      <Typography
        sx={{ fontWeight: 800, fontSize: 16, color: alpha(m.navy, 0.72) }}
      >
        {message}
      </Typography>
    </AuthEmailScreen>
  );
}
