import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiBaseUrl } from "../../lib/api";
import { clearPersistedAuthSession } from "../../lib/auth-storage";
import { clearAuthSession } from "../slices/authSlice";

type AuthAwareState = {
  auth?: {
    accessToken?: string | null;
  };
};

const isTokenExpired = (token: string) => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;
    const decodedPayload =
      typeof atob === "function"
        ? atob(payloadSegment)
        : Buffer.from(payloadSegment, "base64").toString("utf-8");
    const payload = JSON.parse(decodedPayload);
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as AuthAwareState;
    const token = state.auth?.accessToken;

    if (token && !isTokenExpired(token)) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithAuthHandling: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const status = result.error?.status;
  const requestUrl = typeof args === "string" ? args : args.url || "";
  const isCredentialAttempt =
    requestUrl.includes("/api/auth/login") ||
    requestUrl.includes("/api/admin/auth/login") ||
    requestUrl.includes("/api/auth/google") ||
    requestUrl.includes("/api/auth/apple");

  if ((status === 401 || status === 403) && !isCredentialAttempt) {
    api.dispatch(clearAuthSession());
    if (typeof window !== "undefined") {
      clearPersistedAuthSession();
      const pathname = window.location.pathname;
      const loginPath =
        pathname.startsWith("/admin") || pathname.startsWith("/auth/admin")
          ? "/auth/admin/login"
          : "/auth/login";
      if (pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: ["Profile", "BusinessSetup", "BusinessSetupsListing", "BusinessCategories", "Calendar", "Bookings", "ProfessionalClients", "FinanceSettings", "FinanceTransactions", "Messaging", "Notifications", "AdminDashboard", "AdminActivityLog", "Reviews"],
  baseQuery: baseQueryWithAuthHandling,
  /** Keep cached query data longer after the last subscriber unmounts (seconds). */
  keepUnusedDataFor: 600,
  /** Avoid automatic refetch when arguments are unchanged on remount (aligns with typical “stale” UX). */
  refetchOnMountOrArgChange: false,
  endpoints: () => ({}),
});
