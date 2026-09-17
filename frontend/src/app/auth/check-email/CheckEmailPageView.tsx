"use client";

import Link from "next/link";
import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AuthEmailScreen, {
  AuthEmailPrimaryButton,
} from "../../../components/auth/AuthEmailScreen";
import { checkEmailPageData as copy } from "./checkEmail.data";
import { useCheckEmailPage } from "./useCheckEmailPage";

export default function CheckEmailPageView() {
  const { m, email, openMailClient } = useCheckEmailPage();

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
        {copy.title}
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
        {copy.welcome}
      </Typography>
      {email ? (
        <Typography
          sx={{ mt: 1.25, fontWeight: 800, fontSize: 13, color: m.teal }}
        >
          {email}
        </Typography>
      ) : null}
      <AuthEmailPrimaryButton onClick={openMailClient}>
        {copy.verifyButton}
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
        {copy.inboxHint}
      </Typography>
      <Typography
        sx={{
          mt: 1.5,
          fontSize: 11.5,
          fontWeight: 600,
          color: alpha(m.navy, 0.4),
        }}
      >
        {copy.ignorePrefix}{" "}
        <Typography
          component={Link}
          href={copy.backToLogin.href}
          sx={{ fontSize: "inherit", fontWeight: 800, color: m.teal }}
        >
          {copy.backToLogin.label}
        </Typography>
      </Typography>
    </AuthEmailScreen>
  );
}
