import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type UserType = "individual" | "company" | "professional";

export type IndividualProfile = {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country_code: string | null;
  phone: string | null;
  profile_picture: string | null;
};

export type CompanyProfile = {
  id: number;
  user_id: number;
  legal_name: string | null;
  ccc_number: string | null;
  vat_number: string | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  province: string | null;
  municipality: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  phone: string | null;
  logo: string | null;
};

export type ProfessionalProfile = {
  id: number;
  user_id: number;
  legal_name: string | null;
  ccc_number: string | null;
  vat_number: string | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  province: string | null;
  municipality: string | null;
  business_type: string | null;
  website: string | null;
  instagram: string | null;
  other_link: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  service_location_mode?: string | null;
};

export type ProfileResponse = {
  id: number;
  user_type: UserType;
  email: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: IndividualProfile | CompanyProfile | ProfessionalProfile | null;
};

export type UpdateProfileRequest = Partial<{
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  display_name: string;
  date_of_birth: string;
  gender: string;
  country_code: string;
  phone: string;
  legal_name: string;
  ccc_number: string;
  vat_number: string;
  street: string;
  street_number: string;
  postal_code: string;
  province: string;
  municipality: string;
  business_type: string;
  website: string;
  instagram: string;
  other_link: string;
  contact_first_name: string;
  contact_last_name: string;
}> & {
  logo?: string;
  profile_picture?: string;
};

type MutationError = FetchBaseQueryError;

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

const customError = (message: string): MutationError => ({
  status: "CUSTOM_ERROR",
  error: message,
  data: { message },
});

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ApiEnvelope<ProfileResponse>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/user/profile",
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ProfileResponse>;

        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to fetch profile.") };
        }

        return { data };
      },
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<ApiEnvelope<ProfileResponse>, UpdateProfileRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/user/profile",
          method: "PUT",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ProfileResponse>;

        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update profile.") };
        }

        return { data };
      },
      invalidatesTags: ["Profile"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
