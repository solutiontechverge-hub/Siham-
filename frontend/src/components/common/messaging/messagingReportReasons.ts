export const MESSAGING_REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate or offensive language" },
  { id: "harassment", label: "Harassment or abusive behavior" },
  { id: "spam", label: "Spam or irrelevant content" },
  { id: "fraud", label: "Fraudulent or misleading information" },
  { id: "personal_details", label: "Sharing personal contact details" },
  { id: "unprofessional", label: "Unprofessional conduct" },
  { id: "other", label: "Other (please specify)" },
] as const;

export type MessagingReportReasonId = (typeof MESSAGING_REPORT_REASONS)[number]["id"];

export type MessagingReportPayload = {
  reasonId: MessagingReportReasonId;
  reasonLabel: string;
  otherText?: string;
};
