import { baseApi } from "./baseApi";
import {
  buildListQuery,
  normalizeListPagination,
  type ListPagination,
  type ListPaginationParams,
} from "../../lib/listPagination";

export type NotificationStatusType = "pending" | "accepted" | "rejected" | "updated";
export type NotificationAudience = "client" | "professional";

export type AppNotificationItem = {
  id: string;
  audience: NotificationAudience;
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

export type NotificationsQueryArg = ListPaginationParams & {
  audience?: NotificationAudience;
};

const PREPAYMENT_NOTIFICATION_TITLES: Record<string, string> = {
  "client.payment.prepayment_received": "Prepayment Made Successfully",
  "pro.payment.prepayment_received": "Prepayment Received",
};

export function displayNotificationTitle(item: Pick<AppNotificationItem, "notificationType" | "title">) {
  return PREPAYMENT_NOTIFICATION_TITLES[item.notificationType] ?? item.title;
}

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
      NotificationsQueryArg | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const audience = arg?.audience;
        const response = await fetchWithBQ({
          url: buildListQuery("/api/notifications", arg ?? undefined, {
            audience,
          }),
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
    getUnreadNotificationCount: builder.query<
      ApiEnvelope<{ count: number }>,
      { audience?: NotificationAudience } | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const audience = arg?.audience;
        const qs = audience ? `?audience=${encodeURIComponent(audience)}` : "";
        const response = await fetchWithBQ({
          url: `/api/notifications/unread-count${qs}`,
          method: "GET",
        });
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
    markAllNotificationsRead: builder.mutation<
      ApiEnvelope<null>,
      { audience?: NotificationAudience } | void
    >({
      async queryFn(arg, _api, _extraOptions, fetchWithBQ) {
        const audience = arg?.audience;
        const qs = audience ? `?audience=${encodeURIComponent(audience)}` : "";
        const response = await fetchWithBQ({
          url: `/api/notifications/read-all${qs}`,
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
