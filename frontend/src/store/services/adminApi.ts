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

  }),

});



export const {

  useAdminLoginMutation,

  useGetAdminDashboardQuery,

  useGetAdminActivityLogQuery,

  useCreateAdminActivityMutation,

} = adminApi;


