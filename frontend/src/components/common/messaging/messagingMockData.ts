import type { MessagingStore, MessagingThread } from "./messagingTypes";

export const messagingThreadsSeed: MessagingThread[] = [
  {
    id: "lissa-j",
    name: "Lissa J",
    peerEmail: "lissa.j@example.com",
    peerProfileId: "client-lissa",
    bookingId: "34009",
    bookingMeta: "34009 - Requested - FL",
    bookingStatus: "requested",
    locationType: "fixed",
    timeLabel: "Just now",
    preview: "Hi, can we confirm the hot stone massage time?",
    avatarSeed: "lissa",
    online: true,
    presenceStatus: "online",
  },
  {
    id: "craig-martha",
    name: "Craig Martha",
    peerEmail: "craig.martha@example.com",
    peerProfileId: "client-craig",
    bookingId: "B500844",
    bookingMeta: "213 - Confirmed - ER",
    bookingStatus: "confirmed",
    locationType: "fixed",
    timeLabel: "08:34 pm",
    preview: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
    avatarSeed: "craig",
    online: true,
    presenceStatus: "online",
  },
  {
    id: "malik-usama",
    name: "Malik Usama",
    peerEmail: "malik.usama@example.com",
    peerProfileId: "client-malik",
    bookingId: "B500188",
    bookingMeta: "188 - Confirmed - BR",
    bookingStatus: "confirmed",
    locationType: "fixed",
    timeLabel: "07:12 pm",
    preview: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo",
    avatarSeed: "malik",
  },
  {
    id: "sara-james",
    name: "Sara James",
    peerEmail: "sara.james@example.com",
    peerProfileId: "client-sara",
    bookingId: "B500402",
    bookingMeta: "402 - Requested - DL",
    bookingStatus: "requested",
    locationType: "desired",
    timeLabel: "Yesterday",
    preview: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla",
    avatarSeed: "sara",
  },
  {
    id: "noah-park",
    name: "Noah Park",
    peerEmail: "noah.park@example.com",
    peerProfileId: "client-noah",
    bookingId: "B500119",
    bookingMeta: "119 - Completed - ER",
    bookingStatus: "completed",
    locationType: "fixed",
    timeLabel: "Mon",
    preview: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim",
    avatarSeed: "noah",
  },
];

export function createEmptyMessagingStore(): MessagingStore {
  return {
    threads: [],
    messagesByThreadId: {},
    hiddenByAudience: {},
    blockedThreadIds: [],
    lastReadMessageIdByAudience: { client: {}, professional: {} },
    presenceStatus: "online",
  };
}

/** @deprecated Prefer createEmptyMessagingStore — mock seed must not appear in production inbox. */
export function createInitialMessagingStore(): MessagingStore {
  return createEmptyMessagingStore();
}

/** Demo seed threads (ids like lissa-j) — never merge into an authenticated inbox. */
export function isMockMessagingThreadId(id: string): boolean {
  return messagingThreadsSeed.some((thread) => thread.id === id);
}

export function formatMessageDateLabel(dateKey: string): string {
  const d = new Date(dateKey);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMessageTimeLabel(date = new Date()): string {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace("AM", "am")
    .replace("PM", "pm");
}

export function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
