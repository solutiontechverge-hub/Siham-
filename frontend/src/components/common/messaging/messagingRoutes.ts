import type { MessagingThread } from "./messagingTypes";

export type MessagingAudience = "client" | "professional";

export function getMessagingHref(
  audience: MessagingAudience,
  params?: { booking?: string; thread?: string },
): string {
  const base = audience === "client" ? "/clients/messaging" : "/professionals/messaging";
  const q = new URLSearchParams();
  if (params?.booking) q.set("booking", params.booking);
  if (params?.thread) q.set("thread", params.thread);
  const query = q.toString();
  return query ? `${base}?${query}` : base;
}

export function messagingSearchPlaceholder(audience: MessagingAudience): string {
  return audience === "client"
    ? "Professional/clients name and email, booking ID"
    : "Client name and email, booking ID";
}

export function getMessagingPeerProfileHref(audience: MessagingAudience, thread: MessagingThread): string {
  if (audience === "professional") {
    if (thread.peerProfileId) {
      return `/professionals/client?clientId=${encodeURIComponent(thread.peerProfileId)}`;
    }
    return `/professionals/client?q=${encodeURIComponent(thread.name)}`;
  }
  if (thread.peerProfileId) {
    return `/clients/listing/${encodeURIComponent(thread.peerProfileId)}`;
  }
  return `/clients/listing?q=${encodeURIComponent(thread.name)}`;
}

export function getMessagingBookingHref(audience: MessagingAudience, thread: MessagingThread): string {
  const bookingRef = thread.bookingId.replace(/^B/i, "");
  if (audience === "professional") {
    return `/professionals/calendar?booking=${encodeURIComponent(bookingRef)}`;
  }
  return `/clients/booking?tab=upcoming&ref=${encodeURIComponent(bookingRef)}`;
}
