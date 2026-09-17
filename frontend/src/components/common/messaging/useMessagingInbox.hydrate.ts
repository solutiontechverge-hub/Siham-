"use client";

import * as React from "react";
import {
  CLIENT_PROFESSIONALS_PAGE_SIZE,
  mergeClientThreadsWithProfessionals,
  type MessagingProfessionalListItem,
} from "./messagingProfessionals";
import {
  applyMessageRetention,
  loadMessagingPrefs,
  loadMessagingStore,
  mapDraftActiveThreadId,
  mergeApiInboxIntoStore,
  mergeApiInboxWithPrefs,
  saveMessagingStore,
  upsertThreadIntoStore,
} from "./messagingStorage";
import {
  findThreadIdByBookingRef,
  findThreadIdByBusinessSetupId,
  findThreadIdByClientName,
} from "./messagingThreadAccess";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingStore, MessagingThread } from "./messagingTypes";
import type { MessagingInboxResponse } from "../../../store/services/messagingApi";

export type MessagingInboxNavigation = {
  bookingRef?: string;
  threadId?: string;
  businessSetupId?: string;
  searchPrefill?: string;
  seedThread?: MessagingThread;
};

type BusinessSetupLike = {
  id: string;
  professionalProfileId?: string | null;
  businessName?: string | null;
  salonName?: string | null;
  locationMode?: string | null;
};

export function useMessagingInboxProfessionals(deps: {
  audience: MessagingAudience;
  search: string;
  fetchProfessionals: (args: {
    offset: number;
    limit: number;
    q: string;
  }) => { unwrap: () => Promise<{ hasMore: boolean; professionals: MessagingProfessionalListItem[] }> };
  businessSetups?: { data?: BusinessSetupLike[] } | null;
  setProfessionalsHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setProfessionalsOffset: React.Dispatch<React.SetStateAction<number>>;
  setListVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  professionalsLoadedRef: React.MutableRefObject<boolean>;
}) {
  const {
    audience,
    search,
    fetchProfessionals,
    businessSetups,
    setProfessionalsHasMore,
    setProfessionalsOffset,
    setListVisibleCount,
    professionalsLoadedRef,
  } = deps;

  React.useEffect(() => {
    setListVisibleCount(CLIENT_PROFESSIONALS_PAGE_SIZE);
    professionalsLoadedRef.current = false;
    setProfessionalsOffset(0);
  }, [search, audience, professionalsLoadedRef, setListVisibleCount, setProfessionalsOffset]);

  const mergeProfessionalsIntoStore = React.useCallback(
    (base: MessagingStore, professionals: MessagingProfessionalListItem[]) => {
      const mergedThreads = mergeClientThreadsWithProfessionals(base.threads, professionals);
      const messagesByThreadId = { ...base.messagesByThreadId };
      for (const thread of mergedThreads) {
        if (!(thread.id in messagesByThreadId)) messagesByThreadId[thread.id] = [];
      }
      return { ...base, threads: mergedThreads, messagesByThreadId };
    },
    [],
  );

  const loadProfessionalsPage = React.useCallback(
    async (baseStore: MessagingStore, offset: number, searchQuery: string) => {
      try {
        const page = await fetchProfessionals({
          offset,
          limit: CLIENT_PROFESSIONALS_PAGE_SIZE,
          q: searchQuery,
        }).unwrap();
        setProfessionalsHasMore(page.hasMore);
        setProfessionalsOffset(offset + page.professionals.length);
        return mergeProfessionalsIntoStore(baseStore, page.professionals);
      } catch {
        return baseStore;
      }
    },
    [fetchProfessionals, mergeProfessionalsIntoStore, setProfessionalsHasMore, setProfessionalsOffset],
  );

  const buildFromSetups = React.useCallback(
    (base: MessagingStore) => {
      if (!businessSetups?.data?.length) return base;
      const professionals: MessagingProfessionalListItem[] = businessSetups.data.map((setup) => ({
        id: setup.id,
        professionalUserId: setup.professionalProfileId ?? setup.id,
        businessSetupId: setup.id,
        name: setup.businessName || setup.salonName || "Professional",
        email: undefined,
        locationType: setup.locationMode === "desired" ? "desired" : "fixed",
        avatarSeed: setup.id,
      }));
      return mergeProfessionalsIntoStore(base, professionals);
    },
    [businessSetups?.data, mergeProfessionalsIntoStore],
  );

  return { mergeProfessionalsIntoStore, loadProfessionalsPage, buildFromSetups };
}

export function useMessagingInboxHydration(deps: {
  audience: MessagingAudience;
  isAuthed: boolean;
  apiInbox: MessagingInboxResponse | undefined;
  apiInboxLoaded: boolean;
  navigation?: MessagingInboxNavigation;
  seedThread?: MessagingThread;
  searchParams: { get: (key: string) => string | null };
  businessSetups?: { data?: BusinessSetupLike[] } | null;
  loadProfessionalsPage: (
    baseStore: MessagingStore,
    offset: number,
    searchQuery: string,
  ) => Promise<MessagingStore>;
  buildFromSetups: (base: MessagingStore) => MessagingStore;
  setStore: React.Dispatch<React.SetStateAction<MessagingStore | null>>;
  setActiveThreadId: React.Dispatch<React.SetStateAction<string>>;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setProfessionalsHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  professionalsLoadedRef: React.MutableRefObject<boolean>;
  inboxHydratingRef: React.MutableRefObject<boolean>;
  inboxHydratedRef: React.MutableRefObject<boolean>;
  store: MessagingStore | null;
}) {
  const {
    audience,
    isAuthed,
    apiInbox,
    apiInboxLoaded,
    navigation,
    seedThread,
    searchParams,
    businessSetups,
    loadProfessionalsPage,
    buildFromSetups,
    setStore,
    setActiveThreadId,
    setSearch,
    setProfessionalsHasMore,
    professionalsLoadedRef,
    inboxHydratingRef,
    inboxHydratedRef,
    store,
  } = deps;

  React.useEffect(() => {
    if (!isAuthed || !apiInboxLoaded || !apiInbox) return;

    const applySeed = (base: MessagingStore) =>
      seedThread ? upsertThreadIntoStore(base, seedThread) : base;

    if (inboxHydratedRef.current) {
      setStore((prev) => {
        if (!prev) return applySeed(mergeApiInboxWithPrefs(apiInbox, loadMessagingPrefs(), audience));
        const merged = applySeed(
          mergeApiInboxIntoStore(prev, apiInbox, loadMessagingPrefs(), audience),
        );
        saveMessagingStore(merged);
        return merged;
      });
      setActiveThreadId((prev) => mapDraftActiveThreadId(prev, apiInbox.threads));
      return;
    }

    if (inboxHydratingRef.current) return;
    inboxHydratingRef.current = true;

    const load = async () => {
      try {
        let merged = applySeed(mergeApiInboxWithPrefs(apiInbox, loadMessagingPrefs(), audience));
        if (audience === "client" && !professionalsLoadedRef.current) {
          professionalsLoadedRef.current = true;
          merged = await loadProfessionalsPage(merged, 0, "");
          if (!merged.threads.some((t) => t.isNewConversation)) {
            merged = buildFromSetups(merged);
            setProfessionalsHasMore((businessSetups?.data?.length ?? 0) > CLIENT_PROFESSIONALS_PAGE_SIZE);
          }
        }
        setStore(merged);
        saveMessagingStore(merged);
        inboxHydratedRef.current = true;
        const preferredId =
          navigation?.threadId?.trim() ||
          seedThread?.id?.trim() ||
          findThreadIdByBookingRef(merged, navigation?.bookingRef) ||
          merged.threads[0]?.id ||
          "";
        if (preferredId) setActiveThreadId((prev) => prev || preferredId);
      } finally {
        inboxHydratingRef.current = false;
      }
    };
    void load();
  }, [
    apiInbox,
    apiInboxLoaded,
    audience,
    buildFromSetups,
    businessSetups?.data?.length,
    inboxHydratedRef,
    inboxHydratingRef,
    isAuthed,
    loadProfessionalsPage,
    navigation?.bookingRef,
    navigation?.threadId,
    professionalsLoadedRef,
    seedThread,
    setActiveThreadId,
    setProfessionalsHasMore,
    setStore,
  ]);

  React.useEffect(() => {
    if (isAuthed) return;
    let loaded = applyMessageRetention(loadMessagingStore());
    if (audience === "client") loaded = buildFromSetups(loaded);
    setStore(loaded);
    if (loaded.threads[0]) setActiveThreadId((prev) => prev || loaded.threads[0].id);
  }, [audience, buildFromSetups, isAuthed, setActiveThreadId, setStore]);

  React.useEffect(() => {
    if (!isAuthed || audience !== "client" || !store || !businessSetups?.data?.length) return;
    if (store.threads.some((t) => t.isNewConversation || t.id.startsWith("draft:"))) return;

    const merged = buildFromSetups(store);
    if (merged.threads.length === store.threads.length) return;

    setStore(merged);
    setProfessionalsHasMore(businessSetups.data.length > CLIENT_PROFESSIONALS_PAGE_SIZE);
  }, [audience, buildFromSetups, businessSetups?.data, isAuthed, setProfessionalsHasMore, setStore, store]);

  React.useEffect(() => {
    if (!store) return;
    const bookingRef = navigation?.bookingRef ?? searchParams.get("booking") ?? "";
    const threadRef =
      navigation?.threadId?.trim() ||
      seedThread?.id?.trim() ||
      searchParams.get("thread") ||
      "";
    const businessSetupId =
      navigation?.businessSetupId ?? searchParams.get("setup") ?? "";
    const fromBooking = Boolean(threadRef || bookingRef || seedThread);
    const searchPrefill = fromBooking
      ? (navigation?.searchPrefill ?? "")
      : (navigation?.searchPrefill ??
        searchParams.get("client") ??
        searchParams.get("professional") ??
        "");

    let workingStore = store;
    if (seedThread) {
      const existing = store.threads.find((item) => item.id === seedThread.id);
      const needsUpsert =
        !existing ||
        existing.bookingId !== seedThread.bookingId ||
        existing.bookingStatus !== seedThread.bookingStatus ||
        Boolean(existing.unlinked) !== Boolean(seedThread.unlinked) ||
        existing.bookingMeta !== seedThread.bookingMeta;
      if (needsUpsert) {
        workingStore = upsertThreadIntoStore(store, seedThread);
        setStore(workingStore);
        saveMessagingStore(workingStore);
      }
    }

    const byBooking = findThreadIdByBookingRef(workingStore, bookingRef);
    const bySetup = findThreadIdByBusinessSetupId(workingStore, businessSetupId);
    const byName = findThreadIdByClientName(workingStore, searchPrefill);
    const resolvedThreadId =
      threadRef ||
      byBooking ||
      (byName && bySetup && byName === bySetup ? byName : "") ||
      bySetup ||
      byName ||
      "";

    if (fromBooking) {
      if (resolvedThreadId) setActiveThreadId(resolvedThreadId);
      setSearch("");
      return;
    }

    if (resolvedThreadId) {
      setActiveThreadId(resolvedThreadId);
      return;
    }

    if (searchPrefill.trim()) {
      setSearch(searchPrefill.trim());
    }
  }, [
    navigation?.bookingRef,
    navigation?.businessSetupId,
    navigation?.searchPrefill,
    navigation?.threadId,
    searchParams,
    seedThread,
    setActiveThreadId,
    setSearch,
    setStore,
    store,
  ]);
}
