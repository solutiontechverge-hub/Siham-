import type { MessagingChatMessage } from "./messagingTypes";

/** Messages older than this are permanently removed. */
export const MESSAGE_RETENTION_DAYS = 30;
const RETENTION_MS = MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function getMessageTimestamp(message: MessagingChatMessage): number {
  if (message.createdAt) {
    const parsed = Date.parse(message.createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const fromDateKey = Date.parse(`${message.dateKey}T12:00:00`);
  return Number.isNaN(fromDateKey) ? 0 : fromDateKey;
}

export function isMessageWithinRetention(message: MessagingChatMessage, now = Date.now()): boolean {
  const ts = getMessageTimestamp(message);
  if (!ts) return true;
  return now - ts <= RETENTION_MS;
}

export function withMessageCreatedAt(message: MessagingChatMessage): MessagingChatMessage {
  if (message.createdAt) return message;
  const ts = getMessageTimestamp(message);
  return {
    ...message,
    createdAt: ts ? new Date(ts).toISOString() : new Date().toISOString(),
  };
}

export function formatConversationTimeLabel(input: string | Date, now = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));

  const time = date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace("AM", "am")
    .replace("PM", "pm");

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays > 1 && diffDays < 7) {
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    return `${day} ${time}`;
  }

  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${datePart} ${time}`;
}

export function getThreadLastActivityIso(
  messages: MessagingChatMessage[],
  fallbackIso?: string,
): string | undefined {
  if (!messages.length) return fallbackIso;
  const last = messages[messages.length - 1];
  const ts = getMessageTimestamp(last);
  return ts ? new Date(ts).toISOString() : fallbackIso;
}
