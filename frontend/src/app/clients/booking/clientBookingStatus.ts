import type { ClientBookingStatus } from "./clientBookingRecords";

/** Canonical status chip labels — never use payment/response as status text. */
export function bookingStatusLabel(status: ClientBookingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "requested":
      return "Requested";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No Show";
    case "invalid":
      return "Invalid";
    case "waiting_for_prepayment":
      // Display as Confirmed; hourglass icon carries the waiting meaning.
      return "Confirmed";
    default:
      return "Requested";
  }
}

export function bookingStatusChipColors(status: ClientBookingStatus): {
  bgcolor: string;
  color: string;
  border: string;
} {
  switch (status) {
    case "confirmed":
    case "waiting_for_prepayment":
      return {
        bgcolor: "rgba(76, 175, 80, 0.14)",
        color: "#2E7D32",
        border: "1px solid rgba(76, 175, 80, 0.28)",
      };
    case "in_progress":
      return {
        bgcolor: "rgba(33, 184, 191, 0.10)",
        color: "#149CA7",
        border: "1px solid rgba(33, 184, 191, 0.30)",
      };
    case "completed":
      return {
        bgcolor: "#F9FAFB",
        color: "#667085",
        border: "1px solid #D0D5DD",
      };
    case "cancelled":
      return {
        bgcolor: "rgba(229, 115, 115, 0.22)",
        color: "#C62828",
        border: "1px solid rgba(229, 115, 115, 0.35)",
      };
    case "no_show":
      return {
        bgcolor: "#D0D5DD",
        color: "#667085",
        border: "1px solid #D0D5DD",
      };
    case "invalid":
      return {
        bgcolor: "rgba(239, 68, 68, 0.12)",
        color: "#DC2626",
        border: "1px solid rgba(239, 68, 68, 0.45)",
      };
    case "draft":
      return {
        bgcolor: "rgba(52, 74, 102, 0.06)",
        color: "rgba(52, 74, 102, 0.45)",
        border: "1px solid rgba(52, 74, 102, 0.1)",
      };
    case "requested":
    default:
      return {
        bgcolor: "rgba(245, 166, 35, 0.18)",
        color: "#C67A00",
        border: "1px solid rgba(245, 166, 35, 0.35)",
      };
  }
}

export function mapApiBookingStatusToClient(status: string): ClientBookingStatus | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === "requested") return "requested";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "in_progress" || normalized === "in progress") return "in_progress";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "no_show" || normalized === "no show") return "no_show";
  if (normalized === "invalid") return "invalid";
  // Legacy alias — keep confirmed + waiting icon instead of a fake status.
  if (normalized === "waiting_for_prepayment" || normalized === "waiting for prepayment") {
    return "confirmed";
  }
  return null;
}
