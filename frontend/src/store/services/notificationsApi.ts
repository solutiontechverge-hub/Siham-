import { baseApi } from "./baseApi";

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
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<ApiEnvelope<AppNotificationItem[]>, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const response = await fetchWithBQ({ url: "/api/notifications", method: "GET" });
        if (response.error) return { error: response.error };
        return { data: response.data as ApiEnvelope<AppNotificationItem[]> };
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
