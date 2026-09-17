export const writeReviewCopy = {
  invalidLink: "Invalid review link.",
  inviteUnavailable:
    "This review invite is invalid or no longer available.",
  title: "Write a review",
  thankYou: "Thank you! Your review has been submitted.",
  expired: "This review invite has expired.",
  bodyPlaceholder: "Share your experience...",
  submit: "Submit review",
  submitting: "Submitting...",
  missingToken: "Missing review token.",
  validationFallback: "Please check your review.",
  submitFailedFallback: "Could not submit your review. Please try again.",
  reviewFieldLabel: "Review",
  rateAria: (value: number) => `Rate ${value} stars`,
} as const;
