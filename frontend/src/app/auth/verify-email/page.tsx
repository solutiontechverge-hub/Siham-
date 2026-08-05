"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircularProgress, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AuthEmailScreen from "../../../components/auth/AuthEmailScreen";
import { apiUrl } from "../../../lib/api";

const VERIFY_RESULT_KEY = "mollure_verify_result";

type VerifyUser = {
  user_type?: string;
  is_active?: boolean;
  email?: string;
  stripe_connect_status?: string;
};

export default function VerifyEmailPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState("Verifying your email…");
  const token = searchParams.get("token")?.trim() || "";
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token) {
      router.replace("/auth/account-not-approved?reason=missing_token");
      return;
    }

    // Prevent double-submit in React Strict Mode (dev) which would race the one-time token.
    if (startedRef.current) return;
    startedRef.current = true;

    const verify = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          data?: VerifyUser & { profile?: Record<string, unknown> };
        };

        if (!response.ok || !payload.success || !payload.data) {
          router.replace("/auth/account-not-approved?reason=invalid");
          return;
        }

        const user = payload.data;
        try {
          window.sessionStorage.setItem(
            VERIFY_RESULT_KEY,
            JSON.stringify(user),
          );
        } catch {
          // ignore
        }

        if (!user.is_active) {
          router.replace("/auth/account-not-approved?reason=inactive");
          return;
        }

        if (user.user_type === "professional") {
          const stripe = user.stripe_connect_status ?? "not_connected";
          router.replace(
            `/auth/account-approved?stripe=${encodeURIComponent(stripe)}`,
          );
          return;
        }

        router.replace("/auth/email-verified");
      } catch {
        setMessage("Unable to verify your email. Redirecting…");
        window.setTimeout(
          () => router.replace("/auth/account-not-approved?reason=error"),
          1200,
        );
      }
    };

    void verify();
  }, [router, token]);

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
