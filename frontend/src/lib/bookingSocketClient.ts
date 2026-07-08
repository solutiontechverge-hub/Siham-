"use client";

import { getMessagingSocket, joinMessagingUserRoom } from "../components/common/messaging/messagingSocketClient";

let joinedBusinessSetupId: string | null = null;

export type BookingChangedPayload = {
  action: "created" | "updated" | string;
  bookingId: string;
  business_setup_id: string;
  customer_id?: string;
};

export function joinBookingBusinessRoom(businessSetupId: string) {
  if (!businessSetupId) return;
  joinedBusinessSetupId = businessSetupId;
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("bookings:join-business", { businessSetupId });
}

export function ensureBookingRealtimeRooms(input: { userId?: string; businessSetupId?: string }) {
  if (input.userId) joinMessagingUserRoom(input.userId);
  if (input.businessSetupId) joinBookingBusinessRoom(input.businessSetupId);
}

export function onBookingChanged(handler: (payload: BookingChangedPayload) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};

  const rejoin = () => {
    if (joinedBusinessSetupId) {
      client.emit("bookings:join-business", { businessSetupId: joinedBusinessSetupId });
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
