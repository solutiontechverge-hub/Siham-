import type { MessagingAudience } from "./messagingRoutes";

/** Label for the other party in a conversation (client sees Professional, professional sees Client). */
export function getMessagingPeerTypeLabel(audience: MessagingAudience): string {
  return audience === "client" ? "Professional" : "Client";
}

export function getMessagingPeerTypeLabelPlural(audience: MessagingAudience): string {
  return audience === "client" ? "Professionals" : "Clients";
}

export function getBlockModalCopy(audience: MessagingAudience) {
  const peer = getMessagingPeerTypeLabel(audience);
  const peers = getMessagingPeerTypeLabelPlural(audience);
  return {
    title: `Block ${peer}`,
    message: `Blocked ${peers} can't book appointment or message you`,
    confirmLabel: "Block",
  };
}

export function getReportModalTitle(audience: MessagingAudience): string {
  const peer = getMessagingPeerTypeLabel(audience);
  return `Report ${peer}`;
}
