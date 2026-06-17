import type { MessagingChatMessage, MessagingStore, MessagingThread } from "./messagingTypes";

export const messagingThreadsSeed: MessagingThread[] = [
  {
    id: "lissa-j",
    name: "Lissa J",
    bookingId: "34009",
    bookingMeta: "34009 - Requested - FL",
    bookingStatus: "requested",
    locationType: "fixed",
    timeLabel: "Just now",
    preview: "Hi, can we confirm the hot stone massage time?",
    avatarSeed: "lissa",
    online: true,
  },
  {
    id: "craig-martha",
    name: "Craig Martha",
    bookingId: "B500844",
    bookingMeta: "213 - Confirmed - ER",
    bookingStatus: "confirmed",
    locationType: "fixed",
    timeLabel: "08:34 Pm",
    preview: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
    avatarSeed: "craig",
    online: true,
  },
  {
    id: "malik-usama",
    name: "Malik Usama",
    bookingId: "B500188",
    bookingMeta: "188 - Confirmed - BR",
    bookingStatus: "confirmed",
    locationType: "fixed",
    timeLabel: "07:12 Pm",
    preview: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo",
    avatarSeed: "malik",
  },
  {
    id: "sara-james",
    name: "Sara James",
    bookingId: "B500402",
    bookingMeta: "402 - Requested - NL",
    bookingStatus: "requested",
    locationType: "desired",
    timeLabel: "Yesterday",
    preview: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla",
    avatarSeed: "sara",
  },
  {
    id: "noah-park",
    name: "Noah Park",
    bookingId: "B500119",
    bookingMeta: "119 - Completed - ER",
    bookingStatus: "completed",
    locationType: "fixed",
    timeLabel: "Mon",
    preview: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim",
    avatarSeed: "noah",
  },
];

function seedMessagesForThread(thread: MessagingThread): MessagingChatMessage[] {
  return [
    {
      id: `${thread.id}-m1`,
      senderSide: "peer",
      senderRole: "professional",
      senderName: thread.name,
      senderAvatarSeed: thread.avatarSeed,
      timeLabel: "08:15 pm",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      dateKey: "2023-12-21",
    },
    {
      id: `${thread.id}-m2`,
      senderSide: "self",
      senderRole: "client",
      senderName: "You",
      senderAvatarSeed: "you",
      timeLabel: "08:22 pm",
      body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      dateKey: "2023-12-21",
    },
    {
      id: `${thread.id}-m3`,
      senderSide: "peer",
      senderRole: "professional",
      senderName: thread.name,
      senderAvatarSeed: thread.avatarSeed,
      timeLabel: "09:02 am",
      body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      dateKey: "2023-12-22",
    },
  ];
}

export function createInitialMessagingStore(): MessagingStore {
  const messagesByThreadId: Record<string, MessagingChatMessage[]> = {};
  for (const thread of messagingThreadsSeed) {
    if (thread.id === "lissa-j") {
      messagesByThreadId[thread.id] = [
        {
          id: "lissa-j-m1",
          senderSide: "peer",
          senderRole: "client",
          senderName: "Lissa J",
          senderAvatarSeed: "lissa",
          timeLabel: "08:10 am",
          body: "Hi, can we confirm the hot stone massage time?",
          dateKey: todayDateKey(),
        },
      ];
      continue;
    }
    messagesByThreadId[thread.id] = seedMessagesForThread(thread);
  }

  const clientLastRead: Record<string, string> = {};
  for (const thread of messagingThreadsSeed) {
    const messages = messagesByThreadId[thread.id] ?? [];
    const last = messages[messages.length - 1];
    if (last) clientLastRead[thread.id] = last.id;
  }

  return {
    threads: messagingThreadsSeed,
    messagesByThreadId,
    hiddenByAudience: {},
    blockedThreadIds: [],
    lastReadMessageIdByAudience: { client: clientLastRead, professional: { ...clientLastRead } },
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
