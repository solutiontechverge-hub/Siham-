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

export function mergeClientThreadsWithProfessionals(
  existingThreads: MessagingThread[],
  professionals: MessagingProfessionalListItem[],
): MessagingThread[] {
  const existingKeys = new Set(
    existingThreads.map((thread) => thread.professionalUserId || thread.peerProfileId || thread.id),
  );

  const drafts = professionals
    .filter((pro) => !existingKeys.has(pro.professionalUserId) && !existingKeys.has(pro.businessSetupId ?? ""))
    .map(mapProfessionalToDraftThread);

  const merged = [...existingThreads];
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
