/** In-memory messaging store (dev / socket sync). Replace with DB when ready. */

const threadMessages = new Map();

export function getThreadMessages(threadId) {
  return threadMessages.get(threadId) ?? [];
}

export function appendThreadMessage(threadId, message) {
  const list = threadMessages.get(threadId) ?? [];
  if (list.some((item) => item.id === message.id)) return list;
  const next = [...list, message];
  threadMessages.set(threadId, next);
  return next;
}

export function setThreadMessages(threadId, messages) {
  threadMessages.set(threadId, messages);
}
