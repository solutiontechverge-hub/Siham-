import type { MessagingChatMessage, MessagingStore, MessagingThread } from "./messagingTypes";
import { formatConversationTimeLabel, withMessageCreatedAt } from "./messagingRetention";

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

function daysAgoIso(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedMessagesForThread(thread: MessagingThread): MessagingChatMessage[] {
  const recent = daysAgoIso(2, 20, 15);
  const recent2 = daysAgoIso(2, 20, 22);
  const recent3 = daysAgoIso(1, 9, 2);
  return [
    withMessageCreatedAt({
      id: `${thread.id}-m1`,
      senderSide: "peer",
      senderRole: "professional",
      senderName: thread.name,
      senderAvatarSeed: thread.avatarSeed,
      timeLabel: "08:15 pm",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      dateKey: recent.slice(0, 10),
      createdAt: recent,
    }),
    withMessageCreatedAt({
      id: `${thread.id}-m2`,
      senderSide: "self",
      senderRole: "client",
      senderName: "You",
      senderAvatarSeed: "you",
      timeLabel: "08:22 pm",
      body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      dateKey: recent2.slice(0, 10),
      createdAt: recent2,
    }),
    withMessageCreatedAt({
      id: `${thread.id}-m3`,
      senderSide: "peer",
      senderRole: "professional",
      senderName: thread.name,
      senderAvatarSeed: thread.avatarSeed,
      timeLabel: "09:02 am",
      body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      dateKey: recent3.slice(0, 10),
      createdAt: recent3,
    }),
  ];
}

export function createInitialMessagingStore(): MessagingStore {
  const messagesByThreadId: Record<string, MessagingChatMessage[]> = {};
  for (const thread of messagingThreadsSeed) {
    if (thread.id === "lissa-j") {
      const createdAt = new Date().toISOString();
      messagesByThreadId[thread.id] = [
        withMessageCreatedAt({
          id: "lissa-j-m1",
          senderSide: "peer",
          senderRole: "client",
          senderName: "Lissa J",
          senderAvatarSeed: "lissa",
          timeLabel: "08:10 am",
          body: "Hi, can we confirm the hot stone massage time?",
          dateKey: todayDateKey(),
          createdAt,
        }),
      ];
      continue;
    }
    messagesByThreadId[thread.id] = seedMessagesForThread(thread);
  }

  const threads = messagingThreadsSeed.map((thread) => {
    const messages = messagesByThreadId[thread.id] ?? [];
    const last = messages[messages.length - 1];
    const lastActivityAt = last?.createdAt;
    return {
      ...thread,
      lastActivityAt,
      timeLabel: lastActivityAt ? formatConversationTimeLabel(lastActivityAt) : thread.timeLabel,
    };
  });

  const clientLastRead: Record<string, string> = {};
  for (const thread of messagingThreadsSeed) {
    const messages = messagesByThreadId[thread.id] ?? [];
    const last = messages[messages.length - 1];
    if (last) clientLastRead[thread.id] = last.id;
  }

  return {
    threads,
    messagesByThreadId,
    hiddenByAudience: {},
    blockedThreadIds: [],
    lastReadMessageIdByAudience: { client: clientLastRead, professional: { ...clientLastRead } },
    presenceStatus: "online",
  };
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
