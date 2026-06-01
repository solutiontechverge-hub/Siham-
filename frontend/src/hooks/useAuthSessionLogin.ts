"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRouteForUser } from "../lib/auth-routing";
import { persistAuthSession } from "../lib/auth-storage";
import { useAppDispatch } from "../store/hooks";
import { setAuthSession } from "../store/slices/authSlice";
import { useSnackbar } from "../components/common/AppSnackbar";

export type AuthLoginPayload = {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    user_type: string;
    is_email_verified: boolean;
    is_active: boolean;
  };
};

export function useAuthSessionLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const completeLogin = useCallback(
    (data: AuthLoginPayload, remember: boolean) => {
      dispatch(
        setAuthSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        }),
      );
      persistAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
        remember,
      });
      router.push(getDefaultRouteForUser(data.user.user_type));
      showSnackbar({ severity: "success", message: "Signed in successfully." });
    },
    [dispatch, router, showSnackbar],
  );

  return { completeLogin };
}
