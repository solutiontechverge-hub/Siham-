import { baseApi } from "./baseApi";
import {
  buildListQuery,
  normalizeListPagination,
  type ListPagination,
  type ListPaginationParams,
} from "../../lib/listPagination";

export type NotificationStatusType = "pending" | "accepted" | "rejected" | "updated";

export type AppNotificationItem = {
  id: string;
  audience: "client" | "professional";
  notificationType: string;
  title: string;
  message?: string | null;
  statusType: NotificationStatusType;
  bookingId?: string | null;
  bookingRef?: string | null;
  actorName?: string | null;
  href?: string | null;
  read: boolean;
  createdAt: string;
  bookingIdLabel?: string | null;
  timeLabel: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: ListPagination;
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<
      ApiEnvelope<AppNotificationItem[]> & { pagination?: ListPagination },
      ListPaginationParams | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: buildListQuery("/api/notifications", arg ?? undefined),
          method: "GET",
        });
        if (response.error) return { error: response.error };
        const data = response.data as ApiEnvelope<AppNotificationItem[]>;
        const rows = Array.isArray(data.data) ? data.data : [];
        return {
          data: {
            ...data,
            data: rows,
            pagination: normalizeListPagination(data.pagination, {
              page: arg?.page,
              limit: arg?.limit,
              total: rows.length,
            }),
          },
        };
      },
      providesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: builder.query<ApiEnvelope<{ count: number }>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({ url: "/api/notifications/unread-count", method: "GET" });
        if (response.error) return { error: response.error };
        return { data: response.data as ApiEnvelope<{ count: number }> };
      },
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<ApiEnvelope<AppNotificationItem>, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: `/api/notifications/${id}/read`,
          method: "PATCH",
        });
        if (response.error) return { error: response.error };
        return { data: response.data as ApiEnvelope<AppNotificationItem> };
      },
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<ApiEnvelope<null>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({
          url: "/api/notifications/read-all",
          method: "PATCH",
        });
        if (response.error) return { error: response.error };
        return { data: response.data as ApiEnvelope<null> };
      },
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
