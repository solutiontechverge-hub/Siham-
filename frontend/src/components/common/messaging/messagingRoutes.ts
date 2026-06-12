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
