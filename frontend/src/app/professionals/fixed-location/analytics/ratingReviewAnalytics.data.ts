export type ReviewTag = {
  label: string;
};

export type ReviewReply = {
  authorName: string;
  message: string;
};

export type ProfessionalReviewItem = {
  id: string;
  reviewerName: string;
  relativeTimeLabel: string;
  rating: number; // 0..5
  reviewText: string;
  tags: readonly ReviewTag[];
  reply?: ReviewReply;
};

export type ProfessionalFixedLocationRatingReviewAnalyticsData = {
  excellentReviews: {
    title: string;
    reviews: readonly ProfessionalReviewItem[];
  };
};

export const professionalFixedLocationRatingReviewAnalyticsData: ProfessionalFixedLocationRatingReviewAnalyticsData = {
  excellentReviews: {
    title: "Excellent reviews",
    reviews: [
      {
        id: "rev_1",
        reviewerName: "Sara Johnson",
        relativeTimeLabel: "1 week ago",
        rating: 5,
        reviewText:
          "Jessica is an absolute artist! She took the time to listen to what I wanted and gave me the best haircut I’ve had in years. The salon has such a relaxing atmosphere. I’ll definitely be back!",
        tags: [{ label: "TM 1" }, { label: "Haircut" }, { label: "Blowdry" }, { label: "TM 2" }, { label: "Haircut" }, { label: "Blowdry" }],
        reply: {
          authorName: "Micheal",
          message:
            "Thank you, Sarah! So glad you loved your hair. We hope to see you again soon for your next event!",
        },
      },
      {
        id: "rev_2",
        reviewerName: "Sara Johnson",
        relativeTimeLabel: "1 week ago",
        rating: 5,
        reviewText:
          "Jessica is an absolute artist! She took the time to listen to what I wanted and gave me the best haircut I’ve had in years. The salon has such a relaxing atmosphere. I’ll definitely be back!",
        tags: [{ label: "TM 1" }, { label: "Haircut" }, { label: "Blowdry" }, { label: "TM 2" }, { label: "Haircut" }, { label: "Blowdry" }],
        reply: {
          authorName: "Micheal",
          message:
            "Thank you, Sarah! So glad you loved your hair. We hope to see you again soon for your next event!",
        },
      },
    ],
  },
};

