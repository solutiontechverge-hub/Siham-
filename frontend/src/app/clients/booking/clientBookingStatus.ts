import type { ClientBookingStatus } from "./clientBookingRecords";

export function bookingStatusLabel(status: ClientBookingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "requested":
      return "Requested";
    case "confirmed":
      return "Confirmed";
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

export function bookingStatusChipColors(status: ClientBookingStatus): {
  bgcolor: string;
  color: string;
  border: string;
} {
  switch (status) {
    case "confirmed":
      return {
        bgcolor: "rgba(76, 175, 80, 0.14)",
        color: "#2E7D32",
        border: "1px solid rgba(76, 175, 80, 0.28)",
      };
    case "completed":
      return {
        bgcolor: "rgba(52, 74, 102, 0.08)",
        color: "rgba(52, 74, 102, 0.65)",
        border: "1px solid rgba(52, 74, 102, 0.12)",
      };
    case "cancelled":
      return {
        bgcolor: "rgba(229, 115, 115, 0.22)",
        color: "#C62828",
        border: "1px solid rgba(229, 115, 115, 0.35)",
      };
    case "no_show":
      return {
        bgcolor: "rgba(156, 39, 176, 0.12)",
        color: "#7B1FA2",
        border: "1px solid rgba(156, 39, 176, 0.28)",
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
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "no_show" || normalized === "no show") return "no_show";
  return null;
}
