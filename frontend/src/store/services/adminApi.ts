import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AdminDashboardRangeParams = {
  preset: "today" | "7d" | "30d" | "year" | "custom";
  from?: string;
  to?: string;
};

export type AdminDashboardKpi = {
  key: string;
  label: string;
  value: number;
  trend: number;
  icon: "business" | "people" | "person" | "company" | "online" | "offline" | string;
};

export type AdminDashboardChartPoint = {
  date: string;
  online: number;
  offline: number;
};

export type AdminDashboardTopProfessional = {
  id: string;
  name: string;
  city: string;
  province: string;
  bookings: number;
};

export type AdminDashboardActivityItem = {
  id: string;
  admin: string;
  action: string;
  detail: string;
  color: "teal" | "navy" | "warning" | "mint" | string;
  timestamp: string;
};

export type AdminDashboardSummaryRow = {
  label: string;
  value: string;
  breakdown: string;
};

export type AdminDashboardSystemStatus = {
  label: string;
  status: string;
};

export type AdminDashboardData = {
  range: {
    preset: string;
    start: string;
    end: string;
    previousStart: string;
    previousEnd: string;
  };
  kpis: AdminDashboardKpi[];
  bookingsChart: AdminDashboardChartPoint[];
  topProfessionals: AdminDashboardTopProfessional[];
  recentActivity: AdminDashboardActivityItem[];
  summaryOverview: AdminDashboardSummaryRow[];
  systemStatus: AdminDashboardSystemStatus[];
};

export type AdminActivityLogParams = {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  action?: string;
  module?: string;
  user?: string;
  from?: string;
  to?: string;
};

export type AdminActivityLogItem = {
  id: string;
  date: string;
  time: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    initials: string;
  };
  action: string;
  actionLabel: string;
  module: string;
  moduleLabel: string;
  details: string;
  ipAddress: string;
  color?: string;
  admin?: string;
  actionTitle?: string;
  detail?: string;
  timestamp?: string;
};

export type AdminActivityLogData = {
  summary: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  total: number;
  items: AdminActivityLogItem[];
};

export type CreateAdminActivityPayload = {
  action: string;
  detail?: string;
  color?: "teal" | "navy" | "warning" | "mint";
  module?: string;
  action_type?: string;
  actor_email?: string;
  actor_name?: string;
};

export type AdminProfessional = {
  id: string;
  registrationDate: string;
  brandName: string;
  legalName: string;
  email: string;
  phone: string;
  serviceMode: "FL" | "DL" | "DL Project";
  validationStatus: "pending" | "validated" | "not_validated";
  verificationDate?: string;
  accountStatus: "awaiting_setup" | "active" | "suspended" | "disabled";
  primaryCategory: string;
  categories: string[];
  onlineBookings: number;
  offlineBookings: number;
  onlineTransactions: number;
  offlineTransactions: number;
  avgRating: number;
  totalReviews: number;
  ranking: number;
  lastBooking: string;
  province: string;
};

export type AdminProfessionalsData = {
  items: AdminProfessional[];
  summary: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    inactive: number;
    growthTrend: number;
  };
};

export type AdminClient = {
  id: string;
  registrationDate: string;
  registrationTime: string;
  name: string;
  email: string;
  phone: string;
  type: "IC" | "CC";
  lastBookingDate: string;
  lastBookingTime: string;
  accountStatus: "active" | "disabled" | "deleted";
  hasNotes?: boolean;
  note?: string;
  avatarUrl?: string;
  birthdate?: string;
  gender?: string;
  contactPerson?: string;
};

export type AdminClientsData = {
  items: AdminClient[];
  summary: {
    totalIC: number;
    totalCC: number;
    totalClients: number;
    totalBookings: number;
  };
};

export type AdminFlaggedReview = {
  id: string;
  professional: string;
  professionalCategory: string;
  professionalInitials: string;
  client: string;
  clientType: "Individual Client" | "Company Client";
  clientInitials: string;
  rating: number;
  text: string;
  date: string;
  time: string;
};

export type AdminReviewsData = {
  items: AdminFlaggedReview[];
  keywords: string[];
  ranges: Record<string, { label: string; min: number; max: number }>;
};

export type AdminReport = {
  id: string;
  reportId: string;
  reporter: {
    name: string;
    email: string;
    phone: string;
    initials: string;
    type: string;
  };
  reported: {
    name: string;
    email: string;
    phone: string;
    initials: string;
    type: string;
  };
  reasonCategory: string;
  reasonDescription: string;
  additionalDetails: string;
  date: string;
  time: string;
  status: "new" | "viewed";
};

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  date: string;
  status: "new" | "replied";
  body: string;
};

export type AdminAccessUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "disabled";
};

export type AdminAccessRole = {
  id: string;
  name: string;
  description: string;
  kind: "system" | "custom";
  icon: "crown" | "code" | "content";
  adminCount: number;
  permissions: Record<string, "full" | "view" | "none">;
};

export type AdminRankingFactor = {
  id: string;
  label: string;
  description: string;
  weight: number;
  impact: "high" | "medium" | "low";
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminLogin: builder.mutation<
      ApiEnvelope<{
        access_token: string;
        refresh_token: string;
        user: {
          id: string;
          email: string;
          user_type: string;
          is_email_verified: boolean;
          is_active: boolean;
        };
      }>,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/api/admin/auth/login",
        method: "POST",
        body,
      }),
    }),

    getAdminDashboard: builder.query<ApiEnvelope<AdminDashboardData>, AdminDashboardRangeParams>({
      query: ({ preset, from, to }) => {
        const params = new URLSearchParams({ preset });
        if (preset === "custom") {
          if (from) params.set("from", from);
          if (to) params.set("to", to);
        }
        return `/api/admin/dashboard?${params.toString()}`;
      },
      providesTags: ["AdminDashboard"],
    }),

    getAdminActivityLog: builder.query<ApiEnvelope<AdminActivityLogData>, AdminActivityLogParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page != null) params.set("page", String(args.page));
        if (args?.limit != null) params.set("limit", String(args.limit));
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.search) params.set("search", args.search);
        if (args?.action && args.action !== "all") params.set("action", args.action);
        if (args?.module && args.module !== "all") params.set("module", args.module);
        if (args?.user && args.user !== "all") params.set("user", args.user);
        if (args?.from) params.set("from", args.from);
        if (args?.to) params.set("to", args.to);
        const qs = params.toString();
        return `/api/admin/activity${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AdminActivityLog"],
    }),

    createAdminActivity: builder.mutation<ApiEnvelope<{ id: string }>, CreateAdminActivityPayload>({
      query: (body) => ({
        url: "/api/admin/activity",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminDashboard", "AdminActivityLog"],
    }),

    getAdminProfessionals: builder.query<ApiEnvelope<AdminProfessionalsData>, void>({
      query: () => "/api/admin/professionals",
      providesTags: ["AdminProfessionals"],
    }),

    updateAdminProfessional: builder.mutation<
      ApiEnvelope<AdminProfessional>,
      { id: string; validationStatus?: string; accountStatus?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/admin/professionals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminProfessionals", "AdminDashboard"],
    }),

    getAdminClients: builder.query<ApiEnvelope<AdminClientsData>, void>({
      query: () => "/api/admin/clients",
      providesTags: ["AdminClients"],
    }),

    updateAdminClient: builder.mutation<
      ApiEnvelope<AdminClient | { deleted: boolean; id: string }>,
      { id: string; accountStatus?: string; note?: string; delete?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/admin/clients/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminClients", "AdminDashboard"],
    }),

    getAdminReviewsModeration: builder.query<ApiEnvelope<AdminReviewsData>, void>({
      query: () => "/api/admin/reviews",
      providesTags: ["AdminReviews"],
    }),

    deleteAdminReview: builder.mutation<ApiEnvelope<{ id: string }>, string>({
      query: (id) => ({
        url: `/api/admin/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminReviews"],
    }),

    addAdminKeyword: builder.mutation<ApiEnvelope<{ keyword: string }>, string>({
      query: (keyword) => ({
        url: "/api/admin/reviews/keywords",
        method: "POST",
        body: { keyword },
      }),
      invalidatesTags: ["AdminReviews"],
    }),

    removeAdminKeyword: builder.mutation<ApiEnvelope<{ keyword: string }>, string>({
      query: (keyword) => ({
        url: `/api/admin/reviews/keywords/${encodeURIComponent(keyword)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminReviews"],
    }),

    updateAdminRatingRanges: builder.mutation<
      ApiEnvelope<AdminReviewsData["ranges"]>,
      AdminReviewsData["ranges"]
    >({
      query: (ranges) => ({
        url: "/api/admin/reviews/rating-ranges",
        method: "PUT",
        body: { ranges },
      }),
      invalidatesTags: ["AdminReviews"],
    }),

    getAdminReports: builder.query<ApiEnvelope<{ items: AdminReport[] }>, void>({
      query: () => "/api/admin/reports",
      providesTags: ["AdminReports"],
    }),

    updateAdminReport: builder.mutation<
      ApiEnvelope<AdminReport | { deleted: boolean; id: string }>,
      { id: string; status?: "new" | "viewed"; delete?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/admin/reports/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminReports"],
    }),

    getAdminMessaging: builder.query<ApiEnvelope<{ items: AdminMessage[] }>, void>({
      query: () => "/api/admin/messaging",
      providesTags: ["AdminMessaging"],
    }),

    replyAdminMessage: builder.mutation<ApiEnvelope<unknown>, { id: string; reply: string }>({
      query: ({ id, reply }) => ({
        url: `/api/admin/messaging/${id}/reply`,
        method: "POST",
        body: { reply },
      }),
      invalidatesTags: ["AdminMessaging"],
    }),

    deleteAdminMessage: builder.mutation<ApiEnvelope<{ id: string }>, string>({
      query: (id) => ({
        url: `/api/admin/messaging/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminMessaging"],
    }),

    getAdminAccessUsers: builder.query<ApiEnvelope<{ items: AdminAccessUser[] }>, void>({
      query: () => "/api/admin/access/users",
      providesTags: ["AdminAccess"],
    }),

    createAdminAccessUser: builder.mutation<
      ApiEnvelope<AdminAccessUser>,
      { name: string; email: string; role: string; status: "active" | "disabled"; password?: string }
    >({
      query: (body) => ({
        url: "/api/admin/access/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminAccess"],
    }),

    updateAdminAccessUser: builder.mutation<
      ApiEnvelope<AdminAccessUser>,
      { id: string; name?: string; email?: string; role?: string; status?: "active" | "disabled" }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/admin/access/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminAccess"],
    }),

    deleteAdminAccessUser: builder.mutation<ApiEnvelope<{ id: string }>, string>({
      query: (id) => ({
        url: `/api/admin/access/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminAccess"],
    }),

    getAdminAccessRoles: builder.query<ApiEnvelope<{ items: AdminAccessRole[] }>, void>({
      query: () => "/api/admin/access/roles",
      providesTags: ["AdminAccess"],
    }),

    saveAdminAccessRole: builder.mutation<ApiEnvelope<AdminAccessRole>, AdminAccessRole>({
      query: (body) => ({
        url: "/api/admin/access/roles",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AdminAccess"],
    }),

    getAdminListingRanking: builder.query<ApiEnvelope<{ factors: AdminRankingFactor[] }>, void>({
      query: () => "/api/admin/listing-ranking",
      providesTags: ["AdminListingRanking"],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useGetAdminDashboardQuery,
  useGetAdminActivityLogQuery,
  useCreateAdminActivityMutation,
  useGetAdminProfessionalsQuery,
  useUpdateAdminProfessionalMutation,
  useGetAdminClientsQuery,
  useUpdateAdminClientMutation,
  useGetAdminReviewsModerationQuery,
  useDeleteAdminReviewMutation,
  useAddAdminKeywordMutation,
  useRemoveAdminKeywordMutation,
  useUpdateAdminRatingRangesMutation,
  useGetAdminReportsQuery,
  useUpdateAdminReportMutation,
  useGetAdminMessagingQuery,
  useReplyAdminMessageMutation,
  useDeleteAdminMessageMutation,
  useGetAdminAccessUsersQuery,
  useCreateAdminAccessUserMutation,
  useUpdateAdminAccessUserMutation,
  useDeleteAdminAccessUserMutation,
  useGetAdminAccessRolesQuery,
  useSaveAdminAccessRoleMutation,
  useGetAdminListingRankingQuery,
} = adminApi;
