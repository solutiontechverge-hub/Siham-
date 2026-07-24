import { baseApi } from "./baseApi";

export type ReviewReply = {
  message: string;
  authorName: string;
  repliedAt?: string | null;
};

export type ReviewItem = {
  id: string;
  businessSetupId: string;
  teamMemberId: string | null;
  teamMemberName: string | null;
  clientUserId: string;
  bookingId: string;
  serviceId: string | null;
  serviceName: string | null;
  rating: number | null;
  body: string | null;
  reviewerDisplayName: string | null;
  reply: ReviewReply | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  salonName?: string | null;
  inviteExpiresAt?: string | null;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReviewInvite: build.query<
      ApiEnvelope<
        ReviewItem & { expired: boolean; alreadySubmitted: boolean }
      >,
      string
    >({
      query: (token) => `/api/reviews/invite/${encodeURIComponent(token)}`,
    }),
    submitReviewInvite: build.mutation<
      ApiEnvelope<ReviewItem>,
      { token: string; rating: number; body: string }
    >({
      query: ({ token, rating, body }) => ({
        url: `/api/reviews/invite/${encodeURIComponent(token)}`,
        method: "POST",
        body: { rating, body },
      }),
      invalidatesTags: ["Reviews", "BusinessSetupsListing"],
    }),
    getReviews: build.query<
      ApiEnvelope<{ reviews: ReviewItem[]; stats: ReviewStats }>,
      { businessSetupId: string; teamMemberId?: string }
    >({
      query: ({ businessSetupId, teamMemberId }) => {
        const params = new URLSearchParams({ businessSetupId });
        if (teamMemberId) params.set("teamMemberId", teamMemberId);
        return `/api/reviews?${params.toString()}`;
      },
      providesTags: (_result, _error, arg) => [
        { type: "Reviews", id: `${arg.businessSetupId}:${arg.teamMemberId || "all"}` },
        "Reviews",
      ],
    }),
    replyToReview: build.mutation<
      ApiEnvelope<ReviewItem>,
      { reviewId: string; message: string; authorName?: string }
    >({
      query: ({ reviewId, message, authorName }) => ({
        url: `/api/reviews/${encodeURIComponent(reviewId)}/reply`,
        method: "POST",
        body: { message, authorName },
      }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReviewReply: build.mutation<ApiEnvelope<ReviewItem>, { reviewId: string }>({
      query: ({ reviewId }) => ({
        url: `/api/reviews/${encodeURIComponent(reviewId)}/reply`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetReviewInviteQuery,
  useSubmitReviewInviteMutation,
  useGetReviewsQuery,
  useReplyToReviewMutation,
  useDeleteReviewReplyMutation,
} = reviewsApi;
