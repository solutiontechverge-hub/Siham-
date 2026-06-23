import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { mapApiBookingStatusToClient } from "../../app/clients/booking/clientBookingStatus";
import { updateClientBookingStatusByRef } from "../../app/clients/booking/clientBookingRecords";
import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type BusinessSubcategory = {
  id: string;
  title: string;
  category_id: string;
  created_at: string;
};

export type BusinessCategory = {
  id: string;
  title: string;
  created_at: string;
  subcategories: BusinessSubcategory[];
};

export type BusinessServiceDetail = {
  id: string;
  business_setup_id: string;
  service_id: string;
  price: string | number;
  /** From service_categories JSONB (computed on read) */
  duration_label?: string | null;
  created_at: string;
  service_title: string;
  category_id: string;
  category_title: string;
};

export type BusinessTeamMember = {
  id?: string;
  business_setup_id?: string;
  full_name: string;
  role: string;
  profile_photo: string | null;
  assigned_services: Array<{
    service_id: string;
    title?: string | null;
  }>;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type BusinessBookServiceCombination = {
  category_id: string;
  category_title?: string | null;
  service_id: string;
  service_title?: string | null;
};

export type BusinessSetupListingTimeBlock = {
  hours: number | null;
  minutes: number | null;
};

export type BusinessSetupListingLocation = {
  address: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  province: string | null;
  municipality: string | null;
};

export type BusinessSetupListingDesiredLocation = {
  area: string | null;
  province: string | null;
  services: string[];
};

export type BusinessSetupListingPolicy = {
  beforeHours?: number | null;
  beforeMinutes?: number | null;
  feePercentage: number | null;
  instruction: string | null;
};

export type BusinessSetupListingCancellationPolicy = BusinessSetupListingPolicy & {
  beforeHours: number | null;
  beforeMinutes: number | null;
};

export type BusinessSetupListingServiceDetail = {
  id: string | null;
  serviceId: string | null;
  price: number | null;
  durationLabel: string | null;
  serviceTitle: string | null;
  categoryId: string | null;
  categoryTitle: string | null;
  createdAt: string | null;
};

export type BusinessSetupListingTeamMember = {
  id: string | null;
  fullName: string | null;
  role: string;
  profilePhoto: string | null;
  assignedServices: Array<{
    service_id?: string;
    serviceId?: string;
    title?: string | null;
  }>;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BusinessSetupListing = {
  id: string;
  professionalProfileId: string | null;
  businessName: string | null;
  about: string | null;
  rating: number;
  totalReviews: number;
  media: string[];
  locationMode: "fixed" | "desired" | "both" | null;
  salonName: string | null;
  fixedLocation: BusinessSetupListingLocation;
  desiredLocation: BusinessSetupListingDesiredLocation;
  serviceCategories: Array<{
    category_id?: string;
    categoryId?: string;
    category_title?: string | null;
    categoryTitle?: string | null;
    service_id?: string;
    serviceId?: string;
    service_title?: string | null;
    serviceTitle?: string | null;
    amount?: number;
    duration_label?: string | null;
    durationLabel?: string | null;
  }>;
  serviceFor: string[];
  bookServiceCombinations: Array<{
    category_id?: string;
    categoryId?: string;
    category_title?: string | null;
    categoryTitle?: string | null;
    service_id?: string;
    serviceId?: string;
    service_title?: string | null;
    serviceTitle?: string | null;
  }>;
  serviceDetails: BusinessSetupListingServiceDetail[];
  priceRange: string | null;
  prepaymentPercentage: number | null;
  prepaymentInstruction: string | null;
  kilometerAllowance: number | null;
  kilometerAllowanceInstruction: string | null;
  responseTime: BusinessSetupListingTimeBlock;
  appointmentBefore: BusinessSetupListingTimeBlock;
  policyCustomInstruction: string | null;
  cancellationPolicy: BusinessSetupListingCancellationPolicy;
  reschedulePolicy: BusinessSetupListingPolicy;
  noShowPolicy: BusinessSetupListingPolicy;
  keywords: string[];
  additionalNotes: string | null;
  notes: string | null;
  project: string | null;
  teamMemberIds: string[];
  teamMembers: BusinessSetupListingTeamMember[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type BusinessSetup = {
  id: string;
  professional_profile_id: string;
  is_active: boolean;
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
    category_id: string;
    service_id: string;
    amount: number;
    duration_label?: string | null;
  }>;
  project: string | null;
  book_service_notes: string | null;
  book_service_combinations: BusinessBookServiceCombination[];
  team_member_ids: string[];
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

export type CalendarEntry = {
  id: string;
  professional_profile_id: string;
  team_member_id: string | null;
  status: "requested" | "cancelled" | "completed" | "confirmed" | "blocked" | "no_show";
  title: string;
  unique_code: string;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  blocked_time_start: string | null;
  blocked_time_end: string | null;
  location_type: "fixed" | "desired" | null;
  booking_type: "online" | "offline" | "project" | "request" | null;
  client_name: string | null;
  notes: string | null;
  service_ids: string[];
  date?: string | null;
  start?: string | null;
  end?: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarBooking = {
  id: string;
  booking_date: string;
  business_setup_id: string;
  customer_id: string;
  service_id: string | null;
  team_member_id: string | null;
  start_time: string | null;
  end_time: string | null;
  location_type: "fixed" | "desired" | null;
  notes: string | null;
  status: string;
  booking_type?: "online" | "offline" | "project" | "request" | null;
  unique_code?: string | null;
  total_price: string | number | null;
  service_title?: string | null;
  team_member_name?: string | null;
  date?: string | null;
  start?: string | null;
  end?: string | null;
};

export type CalendarSettings = {
  id: string;
  professional_profile_id: string;
  availability: Record<string, unknown>;
  design: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CalendarOverview = {
  entries: CalendarEntry[];
  bookings: CalendarBooking[];
  settings: CalendarSettings | null;
};

export type CreateCalendarEntryRequest = {
  team_member_id?: string | null;
  status?: CalendarEntry["status"];
  title: string;
  unique_code?: string;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  blocked_time_start?: string | null;
  blocked_time_end?: string | null;
  location_type?: "fixed" | "desired" | null;
  booking_type?: CalendarEntry["booking_type"];
  client_name?: string | null;
  notes?: string | null;
  service_ids?: string[];
};

export type UpsertCalendarSettingsRequest = {
  availability?: Record<string, unknown>;
  design?: Record<string, unknown>;
};

export type UpdateCalendarEntryStatusRequest = {
  id: string;
  status: "requested" | "cancelled" | "completed" | "confirmed" | "no_show";
};

export type UpdateBookingStatusRequest = {
  id: string;
  status: "requested" | "cancelled" | "completed" | "confirmed" | "no_show";
};

export type UpdateBusinessSetupActiveRequest = {
  is_active: boolean;
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
    category_id: string;
    service_id: string;
    amount: number;
    duration_label?: string | null;
  }>;
  project?: string;
  book_service_notes?: string;
  book_service_combinations?: BusinessBookServiceCombination[];
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
  team_members?: Array<
    BusinessTeamMember & {
      photo_upload_key?: string;
    }
  >;
};

export type UpsertBusinessSetupPayload = UpsertBusinessSetupRequest | FormData;

export const buildUpsertBusinessSetupBody = (
  payload: UpsertBusinessSetupRequest,
  teamPhotoFiles: Array<{ memberKey: string; file: File }> = [],
): UpsertBusinessSetupPayload => {
  if (!teamPhotoFiles.length) {
    return payload;
  }

  const formData = new FormData();
  formData.append("setup", JSON.stringify(payload));
  formData.append("location_mode", payload.location_mode);

  for (const { memberKey, file } of teamPhotoFiles) {
    formData.append(`team_member_photo__${memberKey}`, file);
  }

  return formData;
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
    getAllBusinessSetups: builder.query<ApiEnvelope<BusinessSetupListing[]>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business-setups/all",
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSetupListing[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch business listings.") };
        }

        return { data };
      },
      providesTags: ["BusinessSetupsListing"],
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
    getCalendarOverview: builder.query<ApiEnvelope<CalendarOverview>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/calendar/overview",
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarOverview>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to fetch calendar overview.") };
        }

        return { data };
      },
      providesTags: ["Calendar"],
    }),
    createCalendarEntry: builder.mutation<ApiEnvelope<CalendarEntry>, CreateCalendarEntryRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/calendar",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarEntry>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to save calendar entry.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar"],
    }),
    upsertCalendarSettings: builder.mutation<ApiEnvelope<CalendarSettings>, UpsertCalendarSettingsRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/calendar/settings",
          method: "PUT",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarSettings>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to save calendar settings.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar"],
    }),
    updateCalendarEntryStatus: builder.mutation<ApiEnvelope<CalendarEntry>, UpdateCalendarEntryStatusRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/calendar/${payload.id}/status`,
          method: "PATCH",
          body: { status: payload.status },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarEntry>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update calendar entry status.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar"],
    }),
    deleteCalendarEntry: builder.mutation<ApiEnvelope<{ id: string }>, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/calendar/${id}`,
          method: "DELETE",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<{ id: string }>;
        if (!data.success) {
          return { error: customError(data.message || "Unable to delete calendar entry.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar"],
    }),
    updateBookingStatus: builder.mutation<ApiEnvelope<CalendarBooking>, UpdateBookingStatusRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/bookings/${payload.id}/status`,
          method: "PATCH",
          body: { status: payload.status },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarBooking>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update booking status.") };
        }

        const clientStatus = mapApiBookingStatusToClient(data.data.status);
        const bookingRef = data.data.unique_code;
        if (clientStatus && bookingRef) {
          updateClientBookingStatusByRef(bookingRef, clientStatus);
        }

        return { data };
      },
      invalidatesTags: ["Calendar"],
    }),
    uploadBusinessMedia: builder.mutation<ApiEnvelope<{ business_media: string[] }>, File[]>({
      async queryFn(files, _api, _extraOptions, fetchWithBQ) {
        const formData = new FormData();
        for (const file of files) {
          formData.append("business_media", file);
        }

        const response = await fetchWithBQ({
          url: "/api/business/setup/media",
          method: "POST",
          body: formData,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<{ business_media: string[] }>;
        if (!data.success || !Array.isArray(data.data?.business_media)) {
          return { error: customError(data.message || "Unable to upload business media.") };
        }

        return { data };
      },
    }),
    updateBusinessSetupActive: builder.mutation<ApiEnvelope<BusinessSetup>, UpdateBusinessSetupActiveRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/setup/active",
          method: "PATCH",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSetup>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update business profile status.") };
        }

        return { data };
      },
      invalidatesTags: ["BusinessSetup", "BusinessSetupsListing"],
    }),
    createBusinessSubcategory: builder.mutation<
      ApiEnvelope<BusinessSubcategory>,
      { category_id: string; title: string }
    >({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/subcategories",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSubcategory>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to create catalog service.") };
        }

        return { data };
      },
      invalidatesTags: ["BusinessCategories"],
    }),
    upsertBusinessSetup: builder.mutation<ApiEnvelope<BusinessSetup>, UpsertBusinessSetupPayload>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        console.log("[businessApi] upsertBusinessSetup payload:", payload);

        const isMultipart = typeof FormData !== "undefined" && payload instanceof FormData;

        const response = await fetchWithBQ({
          url: "/api/business/setup",
          method: isMultipart ? "POST" : "PUT",
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
  useGetAllBusinessSetupsQuery,
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
  useCreateCalendarEntryMutation,
  useUpsertCalendarSettingsMutation,
  useUpdateCalendarEntryStatusMutation,
  useDeleteCalendarEntryMutation,
  useUpdateBookingStatusMutation,
  useUploadBusinessMediaMutation,
  useUpdateBusinessSetupActiveMutation,
  useCreateBusinessSubcategoryMutation,
  useUpsertBusinessSetupMutation,
} = businessApi;
