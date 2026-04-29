import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiBaseUrl } from "../../lib/api";
import type { RootState } from "../index";

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: ["Profile"],
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      headers.set("Content-Type", "application/json");

      return headers;
    },
  }),
  endpoints: () => ({}),
});
