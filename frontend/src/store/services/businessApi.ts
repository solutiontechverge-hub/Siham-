import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "./baseApi";
import {
  buildListQuery,
  normalizeListPagination,
  type ListPagination,
  type ListPaginationParams,
} from "../../lib/listPagination";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: ListPagination;
};

export type BookingsPagination = ListPagination;

export type GetMyBookingsParams = ListPaginationParams & {
  tab?: "past" | "ongoing" | "upcoming";
  /** Search by booking ID, salon name, service, or address. */
  q?: string;
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
  /** Service id of the parent service when this entry is a nested subservice. */
  parent_service_id?: string | null;
  created_at: string;
  service_title: string;
  category_id: string;
  category_title: string;
  /** When false, hidden from business setup UI and public listing (data kept). */
  is_visible?: boolean;
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
  /** First service id in the combo (always a service — field name is legacy). */
  category_id: string;
  category_title?: string | null;
  /** Second service id in the combo. */
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
  isVisible?: boolean;
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
  /** Calendar Service Order Rules (hidden categories / services). */
  serviceOrder?: {
    categories?: string[];
    servicesByCategory?: Record<string, string[]>;
    hiddenCategories?: string[];
    hiddenServicesByCategory?: Record<string, string[]>;
  } | null;
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
    parent_service_id?: string | null;
    category_title?: string | null;
    service_title?: string | null;
    is_visible?: boolean;
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
  section_sync_settings: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  team_members: BusinessTeamMember[];
  service_details: BusinessServiceDetail[];
};

export type CalendarEntry = {
  id: string;
  professional_profile_id: string;
  team_member_id: string | null;
  status: "requested" | "cancelled" | "completed" | "confirmed" | "blocked" | "in_progress" | "no_show";
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
  location_details?: Record<string, unknown> | null;
  notes: string | null;
  status: string;
  prepayment_status?: string | null;
  contact_number?: string | null;
  booking_type?: "online" | "offline" | "project" | "request" | null;
  unique_code?: string | null;
  total_price: string | number | null;
  images?: string[] | null;
  documents?: string[] | null;
  service_title?: string | null;
  team_member_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  client_name?: string | null;
  business_name?: string | null;
  fixed_location_municipality?: string | null;
  fixed_location_address?: string | null;
  fixed_location_street_number?: string | null;
  fixed_location_postal_code?: string | null;
  fixed_location_province?: string | null;
  /** Visit address columns (Desired Location bookings). */
  province?: string | null;
  municipality?: string | null;
  street_address?: string | null;
  street_number?: string | null;
  postal_code?: string | null;
  created_at?: string | null;
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

export type CalendarOverviewQuery = {
  startDate: string;
  endDate: string;
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
  status: "requested" | "cancelled" | "completed" | "confirmed" | "in_progress" | "no_show";
};

export type UpdateCalendarEntryRequest = CreateCalendarEntryRequest & {
  id: string;
};

export type BookingNotificationEvent =
  | "suggest_for_change"
  | "edit_request_outgoing"
  | "booking_date_changed"
  | "time_changed"
  | "service_edited"
  | "unique_item_edited"
  | "ebr_discarded"
  | "incoming_er"
  | "payment_due_set";

export type UpdateBookingStatusRequest = {
  id: string;
  status: "requested" | "cancelled" | "completed" | "confirmed" | "in_progress" | "no_show";
  notification_event?: BookingNotificationEvent;
  notify_incoming_er?: boolean;
  initiated_by?: "client" | "professional";
  notes?: string | null;
  total_price?: number | string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export type UpdateMyBookingRequest = {
  id: string;
  status?: "cancelled" | "confirmed" | "requested";
  prepayment_status?: "paid" | "pending" | "failed" | "required";
  notification_event?: BookingNotificationEvent;
  notify_incoming_er?: boolean;
  notes?: string | null;
  total_price?: number | string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export type DispatchBookingNotificationRequest = {
  id: string;
  event: BookingNotificationEvent;
  initiated_by?: "client" | "professional";
  message?: string;
};

export type CreateBookingRequest = {
  booking_date: string;
  business_setup_id: string;
  service_id?: string | null;
  team_member_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_type?: "fixed" | "desired" | null;
  location_details?: Record<string, unknown>;
  notes?: string | null;
  prepayment_status?: string | null;
  status?: "requested" | "cancelled" | "completed" | "confirmed" | "in_progress" | "no_show";
  booking_type?: "online" | "offline" | "project" | "request";
  unique_code?: string | null;
  total_price?: number | string | null;
  contact_number?: string | null;
  images?: string[];
  documents?: string[];
  province?: string | null;
  municipality?: string | null;
  street_address?: string | null;
  street_number?: string | null;
  postal_code?: string | null;
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
    parent_service_id?: string | null;
    category_title?: string | null;
    service_title?: string | null;
    is_visible?: boolean;
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
  section_sync_settings?: Record<string, string>;
  team_members?: Array<
    BusinessTeamMember & {
      photo_upload_key?: string;
    }
  >;
};

export type UpsertBusinessSetupPayload = UpsertBusinessSetupRequest | FormData;

export type ApiProfessionalClient = {
  id: string;
  client_kind: "individual" | "company";
  is_mollure: boolean;
  mollure_user_id: string | null;
  display_name: string;
  email: string;
  phone: string;
  technical_note: string | null;
  is_blocked: boolean;
  has_no_show: boolean;
  total_sales: number;
  total_sales_label: string;
  last_booking_date: string | null;
  last_booking_label: string;
  stats_last_booking?: string;
  bookings_completed: number;
  average_booking_value: number;
  average_booking_value_label: string;
  recent_services: Array<{ name: string; price: string }>;
  booking_history: Array<{ period: string; bookings: number }>;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  residential_address: string | null;
  legal_name: string | null;
  coc: string | null;
  vat: string | null;
  contact_person_name: string | null;
  business_address: string | null;
  detail_email: string | null;
  added_on: string;
  created_at: string;
};

export type MollureClientDirectoryEntry = {
  id: string;
  name: string;
  email: string;
  has_eligible_booking: boolean;
};

export type MollureClientLookupEntry = {
  id: string;
  name: string;
  email: string;
};

export type CreateProfessionalClientRequest =
  | { mollure_user_id: string }
  | {
      client_kind: "individual" | "company";
      email: string;
      first_name?: string;
      last_name?: string;
      legal_name?: string;
      country_code?: string;
      phone?: string;
      gender?: string;
      date_of_birth?: string;
      residential_address?: string;
      coc?: string;
      vat?: string;
      contact_person_name?: string;
      business_address?: string;
      detail_email?: string;
      technical_note?: string;
    };

export type UpdateProfessionalClientRequest = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  legal_name?: string;
  country_code?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  residential_address?: string;
  coc?: string;
  vat?: string;
  contact_person_name?: string;
  business_address?: string;
  detail_email?: string;
  technical_note?: string;
};

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
    getBusinessCategories: builder.query<
      ApiEnvelope<BusinessCategory[]> & { pagination?: ListPagination },
      ListPaginationParams | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/business/categories", arg ?? undefined),
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessCategory[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch business categories.") };
        }

        return {
          data: {
            ...data,
            pagination: normalizeListPagination(data.pagination, {
              page: arg?.page,
              limit: arg?.limit,
              total: data.data.length,
            }),
          },
        };
      },
      providesTags: ["BusinessCategories"],
    }),
    getAllBusinessSetups: builder.query<
      ApiEnvelope<BusinessSetupListing[]> & { pagination?: ListPagination },
      ListPaginationParams | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/business-setups/all", arg ?? undefined),
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<BusinessSetupListing[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch business listings.") };
        }

        return {
          data: {
            ...data,
            pagination: normalizeListPagination(data.pagination, {
              page: arg?.page,
              limit: arg?.limit,
              total: data.data.length,
            }),
          },
        };
      },
      providesTags: ["BusinessSetupsListing"],
    }),
    getPublicBusinessHours: builder.query<
      ApiEnvelope<{ publicBusinessHours: Record<string, unknown>[] }>,
      string
    >({
      async queryFn(setupId, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business-setups/${encodeURIComponent(setupId)}/public-hours`,
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<{
          publicBusinessHours: Record<string, unknown>[];
        }>;
        if (!data.success || !data.data) {
          return {
            error: customError(
              data.message || "Unable to fetch public business hours.",
            ),
          };
        }

        return { data };
      },
      providesTags: ["Calendar"],
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
    getCalendarOverview: builder.query<ApiEnvelope<CalendarOverview>, CalendarOverviewQuery>({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const params = new URLSearchParams({
          startDate: arg.startDate,
          endDate: arg.endDate,
        });
        const response = await fetchWithBQ({
          url: `/api/business/calendar/overview?${params.toString()}`,
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
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
      invalidatesTags: ["Calendar", "Bookings"],
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
    updateCalendarEntry: builder.mutation<ApiEnvelope<CalendarEntry>, UpdateCalendarEntryRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const { id, ...body } = payload;
        const response = await fetchWithBQ({
          url: `/api/business/calendar/${id}`,
          method: "PUT",
          body,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarEntry>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update calendar entry.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar", "Bookings"],
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
    getMyBookings: builder.query<
      ApiEnvelope<CalendarBooking[]> & { pagination: BookingsPagination },
      GetMyBookingsParams | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/business/bookings", arg ?? undefined, {
            tab: arg?.tab,
            q: arg?.q,
          }),
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarBooking[]> & {
          pagination?: ListPagination;
        };
        if (!data.success) {
          return { error: customError(data.message || "Unable to load bookings.") };
        }

        const rows = Array.isArray(data.data) ? data.data : [];
        const pagination = normalizeListPagination(data.pagination, {
          page: arg?.page,
          limit: arg?.limit,
          total: rows.length,
        });

        return { data: { ...data, data: rows, pagination } };
      },
      providesTags: ["Bookings"],
    }),
    createBooking: builder.mutation<ApiEnvelope<CalendarBooking>, CreateBookingRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/bookings",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarBooking>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to create booking.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar", "Bookings"],
    }),
    updateBookingStatus: builder.mutation<ApiEnvelope<CalendarBooking>, UpdateBookingStatusRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const body: Record<string, string | number | boolean> = { status: payload.status };
        if (payload.notification_event) body.notification_event = payload.notification_event;
        if (payload.notify_incoming_er) body.notify_incoming_er = true;
        if (payload.initiated_by) body.initiated_by = payload.initiated_by;
        if (payload.notes !== undefined) body.notes = payload.notes ?? "";
        if (payload.total_price !== undefined && payload.total_price !== null && payload.total_price !== "") {
          body.total_price = Number(payload.total_price);
        }
        if (payload.booking_date) body.booking_date = payload.booking_date;
        if (payload.start_time) body.start_time = payload.start_time;
        if (payload.end_time) body.end_time = payload.end_time;

        const response = await fetchWithBQ({
          url: `/api/business/bookings/${payload.id}/status`,
          method: "PATCH",
          body,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarBooking>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update booking status.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar", "Bookings"],
    }),
    updateMyBooking: builder.mutation<ApiEnvelope<CalendarBooking>, UpdateMyBookingRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const body: Record<string, string | number | boolean> = {};
        if (payload.status) body.status = payload.status;
        if (payload.prepayment_status) body.prepayment_status = payload.prepayment_status;
        if (payload.notification_event) body.notification_event = payload.notification_event;
        if (payload.notify_incoming_er) body.notify_incoming_er = true;
        if (payload.notes !== undefined) body.notes = payload.notes ?? "";
        if (payload.total_price !== undefined && payload.total_price !== null && payload.total_price !== "") {
          body.total_price = Number(payload.total_price);
        }
        if (payload.booking_date) body.booking_date = payload.booking_date;
        if (payload.start_time) body.start_time = payload.start_time;
        if (payload.end_time) body.end_time = payload.end_time;

        const response = await fetchWithBQ({
          url: `/api/business/bookings/${payload.id}`,
          method: "PATCH",
          body,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<CalendarBooking>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update booking.") };
        }

        return { data };
      },
      invalidatesTags: ["Calendar", "Bookings"],
    }),
    dispatchBookingNotification: builder.mutation<
      ApiEnvelope<{ bookingId: string; event: string }>,
      DispatchBookingNotificationRequest
    >({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const body: Record<string, string> = { event: payload.event };
        if (payload.initiated_by) body.initiated_by = payload.initiated_by;
        if (payload.message) body.message = payload.message;

        const response = await fetchWithBQ({
          url: `/api/business/bookings/${payload.id}/notifications`,
          method: "POST",
          body,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<{ bookingId: string; event: string }>;
        if (!data.success) {
          return { error: customError(data.message || "Unable to dispatch notification.") };
        }

        return { data };
      },
      invalidatesTags: ["Notifications"],
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
    uploadBookingAttachments: builder.mutation<
      ApiEnvelope<{
        attachments: Array<{
          id: string;
          name: string;
          mimeType: string;
          kind: "image" | "document";
          url: string;
        }>;
      }>,
      File[]
    >({
      async queryFn(files, _api, _extraOptions, fetchWithBQ) {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file, file.name);
        }

        const response = await fetchWithBQ({
          url: "/api/business/bookings/attachments",
          method: "POST",
          body: formData,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<{
          attachments: Array<{
            id: string;
            name: string;
            mimeType: string;
            kind: "image" | "document";
            url: string;
          }>;
        }>;
        if (!data.success || !Array.isArray(data.data?.attachments)) {
          return { error: customError(data.message || "Unable to upload booking attachments.") };
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
    getProfessionalClients: builder.query<
      ApiEnvelope<ApiProfessionalClient[]> & { pagination?: ListPagination },
      ListPaginationParams | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/business/clients", arg ?? undefined),
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ApiProfessionalClient[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch clients.") };
        }

        return {
          data: {
            ...data,
            pagination: normalizeListPagination(data.pagination, {
              page: arg?.page,
              limit: arg?.limit,
              total: data.data.length,
            }),
          },
        };
      },
      providesTags: ["ProfessionalClients"],
    }),
    getMollureClientDirectory: builder.query<
      ApiEnvelope<MollureClientDirectoryEntry[]> & { pagination?: ListPagination },
      (ListPaginationParams & { q?: string }) | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/business/clients/mollure-directory", arg ?? undefined, {
            q: arg?.q?.trim(),
          }),
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<MollureClientDirectoryEntry[]>;
        if (!data.success || !Array.isArray(data.data)) {
          return { error: customError(data.message || "Unable to fetch Mollure directory.") };
        }

        return {
          data: {
            ...data,
            pagination: normalizeListPagination(data.pagination, {
              page: arg?.page,
              limit: arg?.limit,
              total: data.data.length,
            }),
          },
        };
      },
      providesTags: ["ProfessionalClients"],
    }),
    lookupMollureClientByEmail: builder.query<
      ApiEnvelope<MollureClientLookupEntry>,
      { email: string }
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const email = arg.email.trim().toLowerCase();
        const response = await fetchWithBQ({
          url: `/api/business/clients/mollure-lookup?email=${encodeURIComponent(email)}`,
          method: "GET",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<MollureClientLookupEntry>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "User is not a Mollure client") };
        }

        return { data };
      },
    }),
    createProfessionalClient: builder.mutation<ApiEnvelope<ApiProfessionalClient>, CreateProfessionalClientRequest>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/business/clients",
          method: "POST",
          body: payload,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ApiProfessionalClient>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to add client.") };
        }

        return { data };
      },
      invalidatesTags: ["ProfessionalClients"],
    }),
    updateProfessionalClient: builder.mutation<ApiEnvelope<ApiProfessionalClient>, UpdateProfessionalClientRequest>({
      async queryFn({ id, ...body }, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/clients/${id}`,
          method: "PATCH",
          body,
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ApiProfessionalClient>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update client.") };
        }

        return { data };
      },
      invalidatesTags: ["ProfessionalClients"],
    }),
    updateProfessionalClientTechnicalNote: builder.mutation<
      ApiEnvelope<ApiProfessionalClient>,
      { id: string; technical_note: string }
    >({
      async queryFn({ id, technical_note }, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/clients/${id}/technical-note`,
          method: "PATCH",
          body: { technical_note },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ApiProfessionalClient>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to save technical note.") };
        }

        return { data };
      },
      invalidatesTags: ["ProfessionalClients"],
    }),
    setProfessionalClientBlocked: builder.mutation<
      ApiEnvelope<ApiProfessionalClient>,
      { id: string; is_blocked: boolean }
    >({
      async queryFn({ id, is_blocked }, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/clients/${id}/block`,
          method: "PATCH",
          body: { is_blocked },
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<ApiProfessionalClient>;
        if (!data.success || !data.data) {
          return { error: customError(data.message || "Unable to update block status.") };
        }

        return { data };
      },
      invalidatesTags: ["ProfessionalClients"],
    }),
    deleteProfessionalClient: builder.mutation<ApiEnvelope<null>, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/business/clients/${id}`,
          method: "DELETE",
        });

        if (response.error) {
          return { error: toMutationError(response.error) };
        }

        const data = response.data as ApiEnvelope<null>;
        if (!data.success) {
          return { error: customError(data.message || "Unable to delete client.") };
        }

        return { data };
      },
      invalidatesTags: ["ProfessionalClients"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBusinessCategoriesQuery,
  useGetAllBusinessSetupsQuery,
  useGetPublicBusinessHoursQuery,
  useGetBusinessSetupQuery,
  useGetCalendarOverviewQuery,
  useCreateCalendarEntryMutation,
  useUpsertCalendarSettingsMutation,
  useUpdateCalendarEntryMutation,
  useUpdateCalendarEntryStatusMutation,
  useDeleteCalendarEntryMutation,
  useGetMyBookingsQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useUpdateMyBookingMutation,
  useDispatchBookingNotificationMutation,
  useUploadBusinessMediaMutation,
  useUploadBookingAttachmentsMutation,
  useUpdateBusinessSetupActiveMutation,
  useCreateBusinessSubcategoryMutation,
  useUpsertBusinessSetupMutation,
  useGetProfessionalClientsQuery,
  useGetMollureClientDirectoryQuery,
  useLazyLookupMollureClientByEmailQuery,
  useCreateProfessionalClientMutation,
  useUpdateProfessionalClientMutation,
  useUpdateProfessionalClientTechnicalNoteMutation,
  useSetProfessionalClientBlockedMutation,
  useDeleteProfessionalClientMutation,
} = businessApi;
