import type { ClientBookingStatus } from "./clientBookingRecords";

export function bookingStatusLabel(status: ClientBookingStatus, opts?: { paymentDue?: boolean }): string {
  if (opts?.paymentDue) return "Payment Due";
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
    default:
      return "Requested";
  }
}

export function bookingStatusChipColors(
  status: ClientBookingStatus,
  opts?: { paymentDue?: boolean },
): {
  bgcolor: string;
  color: string;
  border: string;
} {
  if (opts?.paymentDue) {
    return {
      bgcolor: "rgba(245, 166, 35, 0.18)",
      color: "#C67A00",
      border: "1px solid rgba(245, 166, 35, 0.35)",
    };
  }
  switch (status) {
    case "confirmed":
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
  return null;
}
