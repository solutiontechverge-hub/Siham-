import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiBaseUrl } from "../../lib/api";
import { clearPersistedAuthSession } from "../../lib/auth-storage";
import type { RootState } from "../index";
import { clearAuthSession } from "../slices/authSlice";

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
    const state = getState() as RootState;
    const token = state.auth.accessToken;

    if (token && !isTokenExpired(token)) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");

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

  if (status === 401 || status === 403) {
    api.dispatch(clearAuthSession());
    if (typeof window !== "undefined") {
      clearPersistedAuthSession();
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: ["Profile", "BusinessSetup", "BusinessCategories", "Calendar"],
  baseQuery: baseQueryWithAuthHandling,
  endpoints: () => ({}),
});
