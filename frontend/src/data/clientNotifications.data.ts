export type ClientNotificationStatusType = "pending" | "accepted" | "rejected" | "updated";

export type ClientNotificationItem = {
  id: string;
  /** Primary label — professional name for clients, client name for professionals */
  professionalName: string;
  actorName?: string;
  statusLabel: string;
  statusType: ClientNotificationStatusType;
  bookingIdLabel: string;
  timeLabel: string;
  href?: string | null;
  read?: boolean;
  bookingId?: string | null;
  bookingRef?: string | null;
  message?: string | null;
};
