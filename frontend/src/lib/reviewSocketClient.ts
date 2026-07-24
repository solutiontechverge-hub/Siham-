"use client";

import { getMessagingSocket, joinMessagingUserRoom } from "../components/common/messaging/messagingSocketClient";
import { joinBookingBusinessRoom } from "./bookingSocketClient";

export type ReviewChangedPayload = {
  action: string;
  reviewId: string;
  business_setup_id: string;
  team_member_id?: string | null;
  client_user_id?: string;
};

export function onReviewChanged(handler: (payload: ReviewChangedPayload) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};

  client.on("reviews:changed", handler);
  return () => {
    client.off("reviews:changed", handler);
  };
}

export function ensureReviewRealtimeRooms(input: {
  userId?: string;
  businessSetupId?: string;
}) {
  if (input.userId) joinMessagingUserRoom(input.userId);
  if (input.businessSetupId) joinBookingBusinessRoom(input.businessSetupId);
}
