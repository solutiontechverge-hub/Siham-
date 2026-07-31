"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRouteForUser } from "../lib/auth-routing";
import { persistAuthSession } from "../lib/auth-storage";
import { useAppDispatch } from "../store/hooks";
import { setAuthSession } from "../store/slices/authSlice";
import { baseApi } from "../store/services/baseApi";
import { useSnackbar } from "../components/common/AppSnackbar";
import { queueSnackbarFlash } from "../lib/snackbarFlash";

export type AuthLoginPayload = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
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
    (data: AuthLoginPayload, remember: boolean, redirectTo?: string | null) => {
      // Drop previous user's RTK Query cache before applying the new session.
      dispatch(baseApi.util.resetApiState());
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
      queueSnackbarFlash({ severity: "success", message: "Signed in successfully." });
      showSnackbar({ severity: "success", message: "Signed in successfully." });
      router.push(redirectTo || getDefaultRouteForUser(data.user.user_type));
    },
    [dispatch, router, showSnackbar],
  );

  return { completeLogin };
}
