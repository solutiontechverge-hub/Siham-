import { applyMessageRetention } from "./messagingStorage";
import { isMessageWithinRetention, withMessageCreatedAt } from "./messagingRetention";
import type { MessagingChatMessage, MessagingStore } from "./messagingTypes";

export function groupMessagesByDate(messages: MessagingChatMessage[]) {
  const groups: { dateLabel: string; dateKey: string; messages: MessagingChatMessage[] }[] = [];
  const map = new Map<string, MessagingChatMessage[]>();
  for (const msg of messages) {
    const list = map.get(msg.dateKey) ?? [];
    list.push(msg);
    map.set(msg.dateKey, list);
  }
  for (const [dateKey, msgs] of map) {
    const d = new Date(dateKey);
    const dateLabel = Number.isNaN(d.getTime())
      ? dateKey
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    groups.push({ dateKey, dateLabel, messages: msgs });
  }
  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return groups;
}

export function mergeRemoteMessages(
  store: MessagingStore,
  threadId: string,
  remoteMessages: MessagingChatMessage[],
): MessagingStore {
  if (!remoteMessages.length) return store;
  const local = store.messagesByThreadId[threadId] ?? [];
  const merged = [...local];
  for (const message of remoteMessages) {
    const normalized = withMessageCreatedAt(message);
    if (!merged.some((item) => item.id === normalized.id)) merged.push(normalized);
  }
  merged.sort((a, b) => a.id.localeCompare(b.id));
  const retained = merged.filter(isMessageWithinRetention);
  return applyMessageRetention({
    ...store,
    messagesByThreadId: { ...store.messagesByThreadId, [threadId]: retained },
  });
}

