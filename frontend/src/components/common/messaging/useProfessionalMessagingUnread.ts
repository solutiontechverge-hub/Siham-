"use client";

import * as React from "react";
import { getUnreadFromClientCount, MESSAGING_UPDATED_EVENT } from "./messagingUnread";
import { loadMessagingStore } from "./messagingStorage";
import { hasExistingPeerConversation } from "./messagingThreadAccess";
import { useGetMessagingInboxQuery } from "../../../store/services/messagingApi";

export function useProfessionalMessagingUnread(bookingRef?: string) {
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    const store = loadMessagingStore();
    setCount(getUnreadFromClientCount(store, { bookingRef }));
  }, [bookingRef]);

  React.useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  return count;
}

export type ExistingConversationLookup = {
  bookingRef?: string;
  peerName?: string;
  peerEmail?: string;
  peerProfileId?: string;
};

/** Professional Suggest Changes is shown only after a real conversation already exists. */
export function useBookingHasExistingConversation(lookup?: ExistingConversationLookup) {
  const bookingRef = lookup?.bookingRef?.trim() || undefined;
  const peerName = lookup?.peerName?.trim() || undefined;
  const peerEmail = lookup?.peerEmail?.trim() || undefined;
  const peerProfileId = lookup?.peerProfileId?.trim() || undefined;
  const enabled = Boolean(bookingRef || peerName || peerEmail || peerProfileId);
  const { data: inbox } = useGetMessagingInboxQuery(undefined, { skip: !enabled });
  const [hasConversation, setHasConversation] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!enabled) {
      setHasConversation(false);
      return;
    }
    const local = loadMessagingStore();
    const store = inbox
      ? {
          ...local,
          threads: inbox.threads,
          messagesByThreadId: {
            ...local.messagesByThreadId,
            ...inbox.messagesByThreadId,
          },
        }
      : local;
    setHasConversation(
      hasExistingPeerConversation(store, {
        bookingRef,
        peerName,
        peerEmail,
        peerProfileId,
      }),
    );
  }, [enabled, inbox, bookingRef, peerName, peerEmail, peerProfileId]);

  React.useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  return hasConversation;
}
