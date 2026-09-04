import type { MessagingThread } from "./messagingTypes";
import {
  loadMessagingStore,
  notifyMessagingUpdated,
  saveMessagingStore,
  upsertThreadIntoStore,
} from "./messagingStorage";
import type { MessagingOpenParams } from "./MessagingWidgetContext";

export type OpenBookingMessagingResult = {
  threadId: string;
  thread: MessagingThread;
  bookingRef: string;
  businessSetupId: string;
};

/** Persist a booking-linked thread locally so the widget can select it immediately. */
export function seedBookingThreadInStore(thread: MessagingThread) {
  const store = loadMessagingStore();
  const next = upsertThreadIntoStore(store, thread);
  saveMessagingStore(next);
  notifyMessagingUpdated();
}

export function buildBookingMessagingParams(
  result: OpenBookingMessagingResult,
): MessagingOpenParams {
  return {
    threadId: result.threadId,
    bookingRef: result.bookingRef,
    businessSetupId: result.businessSetupId,
    seedThread: result.thread,
  };
}

export function prepareBookingMessagingOpen(result: OpenBookingMessagingResult) {
  seedBookingThreadInStore(result.thread);
  return buildBookingMessagingParams(result);
}
