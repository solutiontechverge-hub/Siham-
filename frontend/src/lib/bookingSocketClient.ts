"use client";

import { getMessagingSocket, joinMessagingUserRoom } from "../components/common/messaging/messagingSocketClient";

let joinedBusinessSetupIds: string[] = [];

export type BookingChangedPayload = {
  action: "created" | "updated" | string;
  bookingId: string;
  business_setup_id: string;
  customer_id?: string;
};

export function joinBookingBusinessRoom(businessSetupId: string) {
  if (!businessSetupId) return;
  if (!joinedBusinessSetupIds.includes(businessSetupId)) {
    joinedBusinessSetupIds.push(businessSetupId);
  }
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("bookings:join-business", { businessSetupId });
}

export function ensureBookingRealtimeRooms(input: {
  userId?: string;
  businessSetupId?: string;
  businessSetupIds?: readonly string[];
}) {
  if (input.userId) joinMessagingUserRoom(input.userId);
  const ids = [
    ...(input.businessSetupId ? [input.businessSetupId] : []),
    ...(input.businessSetupIds ?? []),
  ].filter(Boolean);
  for (const id of ids) joinBookingBusinessRoom(id);
}

export function onBookingChanged(handler: (payload: BookingChangedPayload) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};

  const rejoin = () => {
    for (const businessSetupId of joinedBusinessSetupIds) {
      client.emit("bookings:join-business", { businessSetupId });
    }
  };

  client.on("connect", rejoin);
  client.io.on("reconnect", rejoin);
  client.on("bookings:changed", handler);

  return () => {
    client.off("connect", rejoin);
    client.io.off("reconnect", rejoin);
    client.off("bookings:changed", handler);
  };
}
