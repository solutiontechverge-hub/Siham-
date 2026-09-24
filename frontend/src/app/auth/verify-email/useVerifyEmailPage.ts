"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { apiUrl } from "../../../lib/api";
import { VERIFY_RESULT_KEY } from "../../../lib/auth-storage";
import { verifyEmailPageData } from "./verifyEmail.data";

export type VerifyUser = {
  user_type?: string;
  is_active?: boolean;
  email?: string;
  email_changed?: boolean;
  stripe_connect_status?: string;
  profile?: { validation_status?: string };
};

export function useVerifyEmailPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState<string>(
    verifyEmailPageData.verifying,
  );
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

        if (user.email_changed) {
          router.replace("/auth/email-verified?changed=1");
          return;
        }

        if (!user.is_active) {
          router.replace("/auth/account-not-approved?reason=inactive");
          return;
        }

        // Pros stay in review until admin validates; clients skip that gate.
        if (user.user_type === "professional") {
          const validation = user.profile?.validation_status ?? "pending";
          if (validation === "validated") {
            const stripe = user.stripe_connect_status ?? "not_connected";
            router.replace(
              `/auth/account-approved?stripe=${encodeURIComponent(stripe)}`,
            );
            return;
          }
          if (validation === "not_validated") {
            router.replace("/auth/account-not-approved?reason=inactive");
            return;
          }
          router.replace("/auth/email-verified?review=1");
          return;
        }

        router.replace("/auth/email-verified");
      } catch {
        setMessage(verifyEmailPageData.unableToVerify);
        window.setTimeout(
          () => router.replace("/auth/account-not-approved?reason=error"),
          1200,
        );
      }
    };

    void verify();
  }, [router, token]);

  return { m, message };
}
