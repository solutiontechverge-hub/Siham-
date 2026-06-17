import type { MessagingAudience } from "./messagingRoutes";
import { getMessagingPeerTypeLabel } from "./messagingPeerLabels";
import { formatConversationTimeLabel, getMessageTimestamp } from "./messagingRetention";
import { isMessageFromClient, isMessageFromProfessional } from "./messagingUnread";
import type { MessagingChatMessage, MessagingThread } from "./messagingTypes";

export function isMessageOwn(message: MessagingChatMessage, audience: MessagingAudience): boolean {
  return audience === "client" ? isMessageFromClient(message) : isMessageFromProfessional(message);
}

export function isMessageFromPeer(message: MessagingChatMessage, audience: MessagingAudience): boolean {
  return !isMessageOwn(message, audience);
}

function cleanStoredSenderName(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed === "You") return "";
  return trimmed;
}

export function resolveMessageSenderDisplayName(
  message: MessagingChatMessage,
  options: { audience: MessagingAudience; currentUserName: string; peerName: string },
): string {
  const isOwn = isMessageOwn(message, options.audience);
  const storedName = cleanStoredSenderName(message.senderName);

  if (isOwn) {
    return "You";
  }

  return storedName || options.peerName.trim() || getMessagingPeerTypeLabel(options.audience);
}

export function resolveMessageSenderLabel(
  message: MessagingChatMessage,
  audience: MessagingAudience,
  peerName: string,
  currentUserName = "",
): string {
  return resolveMessageSenderDisplayName(message, { audience, currentUserName, peerName });
}

export function normalizeMessageForAudience(
  message: MessagingChatMessage,
  audience: MessagingAudience,
  currentUserName: string,
  peerName: string,
): MessagingChatMessage {
  const isOwn = isMessageOwn(message, audience);
  const senderName = resolveMessageSenderDisplayName(message, { audience, currentUserName, peerName });
  return {
    ...message,
    senderSide: isOwn ? "self" : "peer",
    senderName,
    senderAvatarSeed: senderName,
  };
}

export function buildMessagePreviewBody(message: MessagingChatMessage): string {
  if (message.deletedForEveryone) return "Message deleted";
  return message.body || message.attachments?.[0]?.name || "Attachment";
}

export function buildThreadPreviewFromMessage(
  message: MessagingChatMessage,
  audience: MessagingAudience,
  peerName: string,
  currentUserName = "",
): Pick<MessagingThread, "preview" | "previewSenderName" | "previewFromPeer"> {
  const previewFromPeer = isMessageFromPeer(message, audience);
  return {
    preview: buildMessagePreviewBody(message),
    previewSenderName: resolveMessageSenderDisplayName(message, { audience, currentUserName, peerName }),
    previewFromPeer,
  };
}

export function applyLastMessageToThread(
  thread: MessagingThread,
  message: MessagingChatMessage,
  audience: MessagingAudience,
  currentUserName = "",
): MessagingThread {
  const createdAt = message.createdAt ?? new Date(getMessageTimestamp(message)).toISOString();
  return {
    ...thread,
    ...buildThreadPreviewFromMessage(message, audience, thread.name, currentUserName),
    timeLabel: formatConversationTimeLabel(createdAt),
    lastActivityAt: createdAt,
    isNewConversation: false,
  };
}
