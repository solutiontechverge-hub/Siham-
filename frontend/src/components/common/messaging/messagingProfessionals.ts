import type { MessagingThread } from "./messagingTypes";

export const CLIENT_PROFESSIONALS_PAGE_SIZE = 5;

export type MessagingProfessionalListItem = {
  id: string;
  professionalUserId: string;
  businessSetupId?: string;
  name: string;
  email?: string;
  locationType: "fixed" | "desired";
  avatarSeed: string;
};

export function mapProfessionalToDraftThread(pro: MessagingProfessionalListItem): MessagingThread {
  const draftId = pro.businessSetupId ? `draft:setup-${pro.businessSetupId}` : `draft:${pro.professionalUserId}`;
  return {
    id: draftId,
    professionalUserId: pro.professionalUserId,
    businessSetupId: pro.businessSetupId,
    isNewConversation: true,
    name: pro.name,
    peerEmail: pro.email,
    peerProfileId: pro.businessSetupId,
    bookingId: "",
    bookingMeta: "",
    bookingStatus: "requested",
    locationType: pro.locationType,
    timeLabel: "",
    preview: "Tap to start a conversation",
    avatarSeed: pro.avatarSeed,
    unlinked: true,
  };
}

function findProfessionalForThread(
  thread: MessagingThread,
  bySetupId: Map<string, MessagingProfessionalListItem>,
  byUserId: Map<string, MessagingProfessionalListItem>,
) {
  if (thread.businessSetupId && bySetupId.has(thread.businessSetupId)) {
    return bySetupId.get(thread.businessSetupId) ?? null;
  }
  if (thread.peerProfileId && bySetupId.has(thread.peerProfileId)) {
    return bySetupId.get(thread.peerProfileId) ?? null;
  }
  if (thread.professionalUserId && byUserId.has(thread.professionalUserId)) {
    return byUserId.get(thread.professionalUserId) ?? null;
  }
  return null;
}

export function mergeClientThreadsWithProfessionals(
  existingThreads: MessagingThread[],
  professionals: MessagingProfessionalListItem[],
): MessagingThread[] {
  const bySetupId = new Map<string, MessagingProfessionalListItem>();
  const byUserId = new Map<string, MessagingProfessionalListItem>();
  for (const pro of professionals) {
    if (pro.businessSetupId) bySetupId.set(pro.businessSetupId, pro);
    byUserId.set(pro.professionalUserId, pro);
  }

  // Keep current business/profile name on existing threads (e.g. renamed shops).
  const updatedExisting = existingThreads.map((thread) => {
    const pro = findProfessionalForThread(thread, bySetupId, byUserId);
    if (!pro?.name?.trim() || thread.name === pro.name) return thread;
    return { ...thread, name: pro.name };
  });

  const existingKeys = new Set(
    updatedExisting.map(
      (thread) => thread.professionalUserId || thread.peerProfileId || thread.id,
    ),
  );

  const drafts = professionals
    .filter(
      (pro) =>
        !existingKeys.has(pro.professionalUserId) &&
        !existingKeys.has(pro.businessSetupId ?? ""),
    )
    .map(mapProfessionalToDraftThread);

  const merged = [...updatedExisting];
  for (const draft of drafts) {
    if (!merged.some((thread) => thread.id === draft.id)) merged.push(draft);
  }

  return merged.sort((a, b) => {
    const aTime = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
    const bTime = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}
