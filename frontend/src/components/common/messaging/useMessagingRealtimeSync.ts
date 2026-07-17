"use client";

import * as React from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import { messagingApi, useGetMessagingInboxQuery } from "../../../store/services/messagingApi";
import { mergeIncomingSocketMessage } from "./messagingIncomingMessage";
import {
  joinMessagingThreads,
  joinMessagingUserRoom,
  onMessagingMessage,
  onMessagingMessageDeleted,
  onMessagingRead,
} from "./messagingSocketClient";
import {
  applyMessageDelete,
  loadMessagingPrefs,
  loadMessagingStore,
  mergeApiInboxWithPrefs,
  saveMessagingRuntimeSnapshot,
  saveMessagingStore,
} from "./messagingStorage";
import { applyPeerReadToStore } from "./messagingReadReceiptHelpers";
import type { MessagingAudience } from "./messagingRoutes";

export function useMessagingRealtimeSync(audience: MessagingAudience) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUserId = user?.id ?? "";
  const [persistedToken, setPersistedToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPersistedToken(getPersistedAuthSession()?.accessToken ?? null);
  }, [accessToken]);

  const token = accessToken || persistedToken;
  const isAuthed = Boolean(token);

  const currentUserName = React.useMemo(() => {
    const displayName = (user as { display_name?: string } | null)?.display_name;
    if (displayName?.trim()) return displayName.trim();
    const fullName = `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();
    return fullName || (audience === "client" ? "Client" : "Professional");
  }, [audience, user]);

  const { data: inbox, refetch: refetchInbox } = useGetMessagingInboxQuery(undefined, {
    skip: !isAuthed,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  React.useEffect(() => {
    if (!inbox) return;
    const merged = mergeApiInboxWithPrefs(inbox, loadMessagingPrefs(), audience);
    saveMessagingRuntimeSnapshot(merged);
  }, [audience, inbox]);

  React.useEffect(() => {
    if (!currentUserId || !isAuthed) return;
    joinMessagingUserRoom(currentUserId);
  }, [currentUserId, isAuthed]);

  React.useEffect(() => {
    if (!isAuthed) return;
    const threadIds = inbox?.threads.map((thread) => thread.id) ?? [];
    if (threadIds.length) joinMessagingThreads(threadIds);
  }, [inbox?.threads, isAuthed]);

  React.useEffect(() => {
    if (!isAuthed) return;

    const handleMessage = ({ threadId, message }: { threadId: string; message: Parameters<typeof mergeIncomingSocketMessage>[2] }) => {
      const base = loadMessagingStore();
      const result = mergeIncomingSocketMessage(base, threadId, message, audience, currentUserName);
      if (result.unknownThread) {
        dispatch(messagingApi.util.invalidateTags(["Messaging"]));
        void refetchInbox();
        return;
      }
      if (!result.isNew) return;
      saveMessagingRuntimeSnapshot(result.store);
      saveMessagingStore(result.store);
      dispatch(messagingApi.util.invalidateTags(["Messaging"]));
    };

    const offMessage = onMessagingMessage(handleMessage);
    const offDeleted = onMessagingMessageDeleted(({ threadId, messageId, deletedForEveryone }) => {
      const base = loadMessagingStore();
      const scope = deletedForEveryone ? "everyone" : "me";
      const next = applyMessageDelete(base, audience, threadId, messageId, scope);
      saveMessagingRuntimeSnapshot(next);
      saveMessagingStore(next);
      dispatch(messagingApi.util.invalidateTags(["Messaging"]));
    });
    const offRead = onMessagingRead((payload) => {
      if (!payload.threadId || !payload.lastReadAt) return;
      if (payload.userId && currentUserId && payload.userId === currentUserId) return;
      const base = loadMessagingStore();
      const next = applyPeerReadToStore(base, payload.threadId, payload.lastReadAt);
      saveMessagingRuntimeSnapshot(next);
      saveMessagingStore(next);
    });

    return () => {
      offMessage();
      offDeleted();
      offRead();
    };
  }, [audience, currentUserId, currentUserName, dispatch, isAuthed, refetchInbox]);
}
