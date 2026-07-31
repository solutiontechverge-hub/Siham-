import { clearPersistedAuthSession } from "./auth-storage";
import { clearAuthSession } from "../store/slices/authSlice";
import { baseApi } from "../store/services/baseApi";

type DispatchLike = (action: unknown) => unknown;

/** Clears tokens/storage and RTK Query cache so the next login cannot reuse another user's data. */
export function clearAuthSessionState(dispatch: DispatchLike) {
  dispatch(clearAuthSession());
  if (typeof window !== "undefined") {
    clearPersistedAuthSession();
  }
  dispatch(baseApi.util.resetApiState());
}
