import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type BusinessSubcategory = {
  id: number;
  title: string;
  category_id: number;
  created_at: string;
};

export type BusinessCategory = {
  id: number;
  title: string;
  created_at: string;
  subcategories: BusinessSubcategory[];
};

export type BusinessServiceDetail = {
  id: number;
  business_setup_id: number;
  service_id: number;
  price: string | number;
  created_at: string;
  service_title: string;
  category_id: number;
  category_title: string;
};

export type BusinessTeamMember = {
  id?: number;
  business_setup_id?: number;
  full_name: string;
  role: string;
  profile_photo: string | null;
  assigned_services: Array<{
    service_id: number;
    title?: string | null;
  }>;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type BusinessSetup = {
  id: number;
  professional_profile_id: number;
  location_mode: "fixed" | "desired" | "both";
  business_name: string | null;
  business_about: string | null;
  business_keywords: string[];
  business_media: string[];
  salon_name: string | null;
  fixed_location_address: string | null;
  fixed_location_street_number: string | null;
  fixed_location_postal_code: string | null;
  fixed_location_province: string | null;
  fixed_location_municipality: string | null;
  service_for: string[];
  service_categories: Array<{
    category_id: number;
    service_id: number;
    amount: number;
  }>;
  project: string | null;
  book_service_notes: string | null;
  team_member_ids: number[];
  additional_notes: string | null;
  price_range: string | null;
  prepayment_percentage: string | number | null;
  prepayment_instruction: string | null;
  kilometer_allowance: string | number | null;
  kilometer_allowance_instruction: string | null;
  response_time_hours: number | null;
  response_time_minutes: number | null;
  policy_custom_instruction: string | null;
  appointment_before_hours: number | null;
  appointment_before_minutes: number | null;
  late_reschedule_fee_percentage: string | number | null;
  late_reschedule_policy_instruction: string | null;
  cancellation_before_hours: number | null;
  cancellation_before_minutes: number | null;
  late_cancellation_fee_percentage: string | number | null;
  cancellation_policy_instruction: string | null;
  no_show_fee_percentage: string | number | null;
  no_show_fee_instruction: string | null;
  desired_location_area: string | null;
  desired_location_province: string | null;
  desired_location_services: string[];
  created_at: string;
  updated_at: string;
  team_members: BusinessTeamMember[];
  service_details: BusinessServiceDetail[];
};

export type UpsertBusinessSetupRequest = {
  location_mode: "fixed" | "desired" | "both";
  business_name?: string;
  business_about?: string;
  business_keywords?: string[];
  business_media?: string[];
  salon_name?: string;
  fixed_location_address?: string;
  fixed_location_street_number?: string;
  fixed_location_postal_code?: string;
  fixed_location_province?: string;
  fixed_location_municipality?: string;
  service_for?: string[];
  service_categories?: Array<{
    category_id: number;
    service_id: number;
    amount: number;
  }>;
  project?: string;
  book_service_notes?: string;
  additional_notes?: string;
  price_range?: string;
  prepayment_percentage?: number | null;
  prepayment_instruction?: string;
  kilometer_allowance?: number | null;
  kilometer_allowance_instruction?: string;
  response_time_hours?: number | null;
  response_time_minutes?: number | null;
  policy_custom_instruction?: string;
  appointment_before_hours?: number | null;
  appointment_before_minutes?: number | null;
  late_reschedule_fee_percentage?: number | null;
  late_reschedule_policy_instruction?: string;
  cancellation_before_hours?: number | null;
  cancellation_before_minutes?: number | null;
  late_cancellation_fee_percentage?: number | null;
  cancellation_policy_instruction?: string;
  no_show_fee_percentage?: number | null;
  no_show_fee_instruction?: string;
  desired_location_area?: string;
  desired_location_province?: string;
  desired_location_services?: string[];
  team_members?: BusinessTeamMember[];
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

export const businessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessCategories: builder.query<ApiEnvelope<BusinessCategory[]>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/categories",
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessCategory[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch business categories.") };
        }

        return { data };
      },
      providesTags: ["BusinessCategories"],
    }),
    getBusinessSetup: builder.query<ApiEnvelope<BusinessSetup | null>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/setup",
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSetup | null>;
        if (!data.success) {
          return { error: customError(data.message || "Unable to fetch business setup.") };
        }

        return { data };
      },
      providesTags: ["BusinessSetup"],
    }),
    upsertBusinessSetup: builder.mutation<ApiEnvelope<BusinessSetup>, UpsertBusinessSetupRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        console.log("[businessApi] upsertBusinessSetup payload:", payload);

        const response = await fetchWithBQ({
          url: "/api/business/setup",
          method: "PUT",
          body: payload,
        });

        console.log("[businessApi] upsertBusinessSetup response:", response);

        if (response.error) {
          console.error("[businessApi] upsertBusinessSetup error:", response.error);
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSetup>;
        if (!data.success || !data.data) {
          console.error("[businessApi] upsertBusinessSetup bad response:", data);
          return { error: customError(data.message || "Unable to save business setup.") };
        }

        return { data };
      },
      invalidatesTags: ["BusinessSetup"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBusinessCategoriesQuery,
  useGetBusinessSetupQuery,
  useUpsertBusinessSetupMutation,
} = businessApi;
