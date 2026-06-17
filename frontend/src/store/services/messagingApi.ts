import { baseApi } from "./baseApi";
import type { MessagingChatMessage, MessagingStore } from "../../components/common/messaging/messagingTypes";
import type { MessagingProfessionalListItem } from "../../components/common/messaging/messagingProfessionals";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type MessagingInboxResponse = Pick<MessagingStore, "threads" | "messagesByThreadId">;
export type MessagingMessageDeleteScope = "me" | "everyone";

export type MessagingProfessionalsResponse = {
  professionals: MessagingProfessionalListItem[];
  total: number;
  hasMore: boolean;
};

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMessagingInbox: build.query<MessagingInboxResponse, void>({
      query: () => "/api/messaging/inbox",
      transformResponse: (response: ApiEnvelope<MessagingInboxResponse>) => response.data,
      providesTags: ["Messaging"],
    }),
    getMessagingProfessionals: build.query<
      MessagingProfessionalsResponse,
      { offset?: number; limit?: number; q?: string }
    >({
      query: ({ offset = 0, limit = 5, q = "" } = {}) => {
        const params = new URLSearchParams();
        params.set("offset", String(offset));
        params.set("limit", String(limit));
        if (q.trim()) params.set("q", q.trim());
        return `/api/messaging/professionals?${params.toString()}`;
      },
      transformResponse: (response: ApiEnvelope<MessagingProfessionalsResponse>) => response.data,
      providesTags: ["Messaging"],
    }),
    getMessagingThreadMessages: build.query<{ threadId: string; messages: MessagingChatMessage[] }, string>({
      query: (threadId) => `/api/messaging/threads/${threadId}/messages`,
      transformResponse: (response: ApiEnvelope<{ threadId: string; messages: MessagingChatMessage[] }>) =>
        response.data,
      providesTags: (_result, _error, threadId) => [{ type: "Messaging", id: threadId }],
    }),
    sendMessagingMessage: build.mutation<
      { threadId: string; message: MessagingChatMessage },
      { threadId: string; body: string; attachments?: MessagingChatMessage["attachments"]; clientMessageId: string }
    >({
      query: ({ threadId, body, attachments, clientMessageId }) => ({
        url: `/api/messaging/threads/${threadId}/messages`,
        method: "POST",
        body: { body, attachments, clientMessageId },
      }),
      transformResponse: (response: ApiEnvelope<{ threadId: string; message: MessagingChatMessage }>) =>
        response.data,
    }),
    deleteMessagingMessage: build.mutation<
      { threadId: string; messageId: string; scope: MessagingMessageDeleteScope; deletedForEveryone: boolean },
      { threadId: string; messageId: string; scope: MessagingMessageDeleteScope }
    >({
      query: ({ threadId, messageId, scope }) => ({
        url: `/api/messaging/threads/${threadId}/messages/${encodeURIComponent(messageId)}`,
        method: "DELETE",
        body: { scope },
      }),
      transformResponse: (
        response: ApiEnvelope<{
          threadId: string;
          messageId: string;
          scope: MessagingMessageDeleteScope;
          deletedForEveryone: boolean;
        }>,
      ) => response.data,
      invalidatesTags: ["Messaging"],
    }),
    clearMessagingThread: build.mutation<
      { threadId: string; scope: MessagingMessageDeleteScope; cleared: boolean },
      { threadId: string; scope: MessagingMessageDeleteScope }
    >({
      query: ({ threadId, scope }) => ({
        url: `/api/messaging/threads/${threadId}/clear`,
        method: "POST",
        body: { scope },
      }),
      transformResponse: (
        response: ApiEnvelope<{ threadId: string; scope: MessagingMessageDeleteScope; cleared: boolean }>,
      ) => response.data,
      invalidatesTags: ["Messaging"],
    }),
  }),
});

export const {
  useGetMessagingInboxQuery,
  useGetMessagingProfessionalsQuery,
  useLazyGetMessagingProfessionalsQuery,
  useGetMessagingThreadMessagesQuery,
  useSendMessagingMessageMutation,
  useDeleteMessagingMessageMutation,
  useClearMessagingThreadMutation,
} = messagingApi;
