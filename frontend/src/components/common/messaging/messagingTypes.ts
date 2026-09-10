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
  | "br_accepted"
  | "in_progress"
  | "cancelled"
  | "invalid"
  | "no_show";

export type MessagingLocationType = "fixed" | "desired";

export type MessagingPresenceStatus = "online" | "busy" | "offline";

export type MessagingThread = {
  id: string;
  name: string;
  /** Peer email for search (client or professional). */
  peerEmail?: string;
  /** Client listing id (client view) or professional client id (pro view). */
  peerProfileId?: string;
  bookingId: string;
  bookingMeta: string;
  bookingStatus: MessagingBookingStatus;
  locationType: MessagingLocationType;
  timeLabel: string;
  /** ISO timestamp of last message activity. */
  lastActivityAt?: string;
  preview: string;
  /** Sender label for the latest message preview (e.g. client or professional name). */
  previewSenderName?: string;
  /** True when the latest preview line is from the other party. */
  previewFromPeer?: boolean;
  avatarSeed: string;
  online?: boolean;
  presenceStatus?: MessagingPresenceStatus;
  unlinked?: boolean;
  /** Set when client can start a new chat with this professional. */
  professionalUserId?: string;
  businessSetupId?: string;
  isNewConversation?: boolean;
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
  dbId?: string;
  senderSide: "self" | "peer";
  /** Who sent the message (stable across client/professional views). */
  senderRole?: MessagingSenderRole;
  senderName: string;
  senderAvatarSeed: string;
  timeLabel: string;
  /** ISO timestamp used for retention and conversation time labels. */
  createdAt?: string;
  body: string;
  attachments?: MessagingAttachment[];
  dateKey: string;
  deletedForEveryone?: boolean;
  hiddenForAudience?: Partial<Record<MessagingAudience, boolean>>;
  /** True when the other party has read this message (own messages only). */
  readByPeer?: boolean;
};

export type MessagingSettingsFilters = Record<BookingStatusFilter, boolean>;

export type MessagingDrawerFilters = {
  searchFor: "all" | MessagingBookingStatus | "unlinked";
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
  /** Latest timestamp the other party has read through, per thread. */
  peerLastReadAtByThreadId?: Record<string, string>;
  /** User-selected presence when not automatically online. */
  presenceStatus?: MessagingPresenceStatus;
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
