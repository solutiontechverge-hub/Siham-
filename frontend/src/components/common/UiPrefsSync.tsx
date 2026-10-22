"use client";

import * as React from "react";
import { useAppSelector } from "../../store/hooks";
import {
  useGetUiPrefsQuery,
  usePutUiPrefsMutation,
} from "../../store/services/profileApi";
import {
  configureUiPrefsPersistence,
  hydrateUiPrefs,
  purgeLegacyUiLocalStorage,
  type UiPrefsState,
} from "../../lib/uiPrefsStore";

/** Hydrate / persist users.ui_prefs; purge legacy non-auth localStorage once. */
export default function UiPrefsSync() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const isAuthed = Boolean(accessToken);
  const { data } = useGetUiPrefsQuery(undefined, { skip: !isAuthed });
  const [putUiPrefs] = usePutUiPrefsMutation();

  React.useEffect(() => {
    purgeLegacyUiLocalStorage();
  }, []);

  React.useEffect(() => {
    if (!isAuthed) {
      hydrateUiPrefs({});
      configureUiPrefsPersistence(null);
      return;
    }
    configureUiPrefsPersistence((patch) => {
      void putUiPrefs(patch);
    });
    return () => configureUiPrefsPersistence(null);
  }, [isAuthed, putUiPrefs]);

  React.useEffect(() => {
    if (!isAuthed) return;
    if (!data?.success || !data.data) return;
    hydrateUiPrefs(data.data as UiPrefsState);
  }, [isAuthed, data]);

  return null;
}
