"use client";

import { getMessagingSocket } from "../components/common/messaging/messagingSocketClient";

export type BusinessChangedPayload = {
  action: "updated" | "published" | "activated" | "deactivated" | string;
  scope: "listing" | "calendar" | "finance" | string;
  business_setup_id?: string | null;
};

let listingRoomJoined = false;

export function joinPublicListingRoom() {
  listingRoomJoined = true;
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("listing:join");
}

export function onBusinessChanged(handler: (payload: BusinessChangedPayload) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};

  const rejoin = () => {
    if (listingRoomJoined) {
      client.emit("listing:join");
    }
  };

  client.on("connect", rejoin);
  client.io.on("reconnect", rejoin);
  client.on("business:changed", handler);

  return () => {
    client.off("connect", rejoin);
    client.io.off("reconnect", rejoin);
    client.off("business:changed", handler);
  };
}
