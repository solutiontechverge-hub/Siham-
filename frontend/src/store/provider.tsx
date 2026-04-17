"use client";

import * as React from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { getPersistedAuthSession } from "../lib/auth-storage";
import { setAuthSession } from "./slices/authSlice";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = React.useRef<ReturnType<typeof makeStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  React.useEffect(() => {
    const persisted = getPersistedAuthSession();
    if (persisted) {
      storeRef.current?.dispatch(setAuthSession(persisted));
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
