import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiBaseUrl } from "../../lib/api";
import {
  clearPersistedAuthSession,
  getPersistedAuthSession,
  isRememberMePreferred,
  persistAuthSession,
} from "../../lib/auth-storage";
import { clearAuthSession, setAuthSession } from "../slices/authSlice";
import type { AuthUser } from "../slices/authSlice";

type AuthAwareState = {
  auth?: {
    accessToken?: string | null;
    refreshToken?: string | null;
    user?: AuthUser | null;
  };
};

type RefreshEnvelope = {
  success?: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
  };
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decodedPayload =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(decodedPayload) as { exp?: number };
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.exp !== "number") return false;
  // Refresh slightly early to avoid race on Mac/Safari sleep resume.
  return payload.exp * 1000 <= Date.now() + 30_000;
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

let refreshInFlight: Promise<boolean> | null = null;

const forceLogoutToLogin = (api: { dispatch: (action: unknown) => void }) => {
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
  api.dispatch(baseApi.util.resetApiState());
};

const tryRefreshSession = async (
  api: Parameters<BaseQueryFn>[1],
): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const state = api.getState() as AuthAwareState;
    const persisted = getPersistedAuthSession();
    const refreshToken =
      state.auth?.refreshToken || persisted?.refreshToken || null;
    if (!refreshToken) return false;

    const remember = isRememberMePreferred();
    const refreshResult = await rawBaseQuery(
      {
        url: "/api/auth/refresh",
        method: "POST",
        body: { refresh_token: refreshToken, remember },
      },
      api,
      {},
    );

    if (refreshResult.error) return false;

    const envelope = refreshResult.data as RefreshEnvelope | undefined;
    const data = envelope?.data;
    if (!data?.access_token || !data?.refresh_token || !data?.user) {
      return false;
    }

    const session = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    };

    api.dispatch(setAuthSession(session));
    persistAuthSession({ ...session, remember });
    return true;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

const baseQueryWithAuthHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const requestUrl = typeof args === "string" ? args : args.url || "";
  const isCredentialAttempt =
    requestUrl.includes("/api/auth/login") ||
    requestUrl.includes("/api/admin/auth/login") ||
    requestUrl.includes("/api/auth/google") ||
    requestUrl.includes("/api/auth/apple") ||
    requestUrl.includes("/api/auth/refresh");

  if (!isCredentialAttempt) {
    const state = api.getState() as AuthAwareState;
    const token = state.auth?.accessToken;
    if (token && isTokenExpired(token)) {
      const refreshed = await tryRefreshSession(api);
      if (!refreshed) {
        forceLogoutToLogin(api);
        return {
          error: {
            status: 401,
            data: { message: "Session expired. Please sign in again." },
          },
        };
      }
    }
  }

  let result = await rawBaseQuery(args, api, extraOptions);
  const status = result.error?.status;

  if ((status === 401 || status === 403) && !isCredentialAttempt) {
    const refreshed = await tryRefreshSession(api);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      forceLogoutToLogin(api);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: [
    "Profile",
    "BusinessSetup",
    "BusinessSetupsListing",
    "BusinessCategories",
    "Calendar",
    "Bookings",
    "ProfessionalClients",
    "FinanceSettings",
    "FinanceTransactions",
    "SalesCardMetadata",
    "SalesAddons",
    "Messaging",
    "Notifications",
    "AdminDashboard",
    "AdminActivityLog",
    "AdminProfessionals",
    "AdminClients",
    "AdminReviews",
    "AdminReports",
    "AdminMessaging",
    "AdminAccess",
    "AdminListingRanking",
    "Favorites",
    "Reviews",
    "UiPrefs",
  ],
  baseQuery: baseQueryWithAuthHandling,
  /** Keep cached query data longer after the last subscriber unmounts (seconds). */
  keepUnusedDataFor: 600,
  /** Avoid automatic refetch when arguments are unchanged on remount (aligns with typical “stale” UX). */
  refetchOnMountOrArgChange: false,
  endpoints: () => ({}),
});
