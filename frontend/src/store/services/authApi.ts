import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type LoginRequest = {
  email: string;
  password: string;
};

type LoginData = {
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

type RegisterRequest = {
  user_type: "individual" | "professional" | "company";
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: string;
  country_code?: string;
  phone?: string;
  legal_name?: string;
  ccc_number?: string;
  vat_number?: string;
  street?: string;
  street_number?: string;
  postal_code?: string;
  province?: string;
  municipality?: string;
  business_type?: string;
  website?: string;
  instagram?: string;
  other_link?: string;
  contact_first_name?: string;
  contact_last_name?: string;
};

type ForgotPasswordRequest = {
  email: string;
};

type VerifyOtpRequest = {
  email: string;
  otp: string;
};

type VerifyOtpData = {
  user_id: number;
};

type ResetPasswordRequest = {
  user_id: number;
  new_password: string;
  confirm_password: string;
};

const toMutationError = (error: FetchBaseQueryError): MutationError => {
  const fallbackMessage = "Something went wrong. Please try again.";

  if ("error" in error) {
    return error.error ? error : { ...error, error: fallbackMessage };
  }

  const message =
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
      ? error.data.message
      : fallbackMessage;

  return {
    status: error.status,
    data: { message },
  };
};

type MutationError = FetchBaseQueryError;

const customError = (message: string): MutationError => ({
  status: "CUSTOM_ERROR",
  error: message,
  data: { message },
});

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiEnvelope<LoginData>, LoginRequest>({
      async queryFn(credentials, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/auth/login",
          method: "POST",
          body: {
            email: credentials.email.trim().toLowerCase(),
            password: credentials.password,
          },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<LoginData>;

        if (!data.success || !data.data) {
          return { error: customError(data.message || "Login failed.") };
        }

        return { data };
      },
    }),
    register: builder.mutation<ApiEnvelope<unknown>, RegisterRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/auth/register",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<unknown>;

        if (!data.success) {
          return { error: customError(data.message || "Registration failed.") };
        }

        return { data };
      },
    }),
    forgotPassword: builder.mutation<ApiEnvelope<null>, ForgotPasswordRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/auth/forgot-password",
          method: "POST",
          body: {
            email: payload.email.trim().toLowerCase(),
          },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<null>;

        if (!data.success) {
          return { error: customError(data.message || "Unable to send OTP right now.") };
        }

        return { data };
      },
    }),
    verifyOtp: builder.mutation<ApiEnvelope<VerifyOtpData>, VerifyOtpRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/auth/verify-otp",
          method: "POST",
          body: {
            email: payload.email.trim().toLowerCase(),
            otp: payload.otp,
          },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<VerifyOtpData>;

        if (!data.success || !data.data?.user_id) {
          return { error: customError(data.message || "OTP verification failed.") };
        }

        return { data };
      },
    }),
    resetPassword: builder.mutation<ApiEnvelope<unknown>, ResetPasswordRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/auth/reset-password",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<unknown>;

        if (!data.success) {
          return { error: customError(data.message || "Unable to reset password.") };
        }

        return { data };
      },
    }),
  }),
});

export const {
  useForgotPasswordMutation,
  useLoginMutation,
  useRegisterMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
} = authApi;
