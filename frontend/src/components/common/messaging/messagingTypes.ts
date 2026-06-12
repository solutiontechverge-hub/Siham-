import type { MessagingAudience } from "./messagingRoutes";

export type BookingStatusFilter =
  | "completed"
  | "cancelled"
  | "invalid"
  | "no_show"
  | "unlinked";

export type MessagingBookingStatus =
  | "completed"
  | "confirmed"
  | "requested"
  | "cancelled"
  | "invalid"
  | "no_show";

export type MessagingLocationType = "fixed" | "desired";

export type MessagingThread = {
  id: string;
  name: string;
  bookingId: string;
  bookingMeta: string;
  bookingStatus: MessagingBookingStatus;
  locationType: MessagingLocationType;
  timeLabel: string;
  preview: string;
  avatarSeed: string;
  online?: boolean;
  unlinked?: boolean;
};

export type MessagingAttachment = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
};

export type MessagingSenderRole = "client" | "professional";

export type MessagingChatMessage = {
  id: string;
  senderSide: "self" | "peer";
  /** Who sent the message (stable across client/professional views). */
  senderRole?: MessagingSenderRole;
  senderName: string;
  senderAvatarSeed: string;
  timeLabel: string;
  body: string;
  attachments?: MessagingAttachment[];
  dateKey: string;
};

export type MessagingSettingsFilters = Record<BookingStatusFilter, boolean>;

export type MessagingDrawerFilters = {
  searchFor: "all" | MessagingBookingStatus;
  locationFixed: boolean;
  locationDesired: boolean;
};

export type MessagingStore = {
  threads: MessagingThread[];
  messagesByThreadId: Record<string, MessagingChatMessage[]>;
  hiddenByAudience: Partial<Record<MessagingAudience, string[]>>;
  blockedThreadIds: string[];
  /** Per-thread last message id the user has seen (by audience). */
  lastReadMessageIdByAudience?: Partial<Record<MessagingAudience, Record<string, string>>>;
};

export const defaultSettingsFilters = (): MessagingSettingsFilters => ({
  completed: false,
  cancelled: false,
  invalid: false,
  no_show: false,
  unlinked: false,
});

export const defaultDrawerFilters = (): MessagingDrawerFilters => ({
  searchFor: "all",
  locationFixed: true,
  locationDesired: true,
});
