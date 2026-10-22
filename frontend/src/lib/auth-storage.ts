import type { AuthUser } from "../store/slices/authSlice";

const ACCESS_TOKEN_KEY = "mollure_access_token";
const REFRESH_TOKEN_KEY = "mollure_refresh_token";
const USER_KEY = "mollure_user";
const REMEMBER_KEY = "mollure_remember";

export const SIGNUP_EMAIL_KEY = "mollure_signup_email";
export const SIGNUP_USER_TYPE_KEY = "mollure_signup_user_type";
export const SIGNUP_AUDIENCE_KEY = "mollure:signup_audience";
export const RESET_EMAIL_KEY = "mollure_reset_email";
export const RESET_USER_ID_KEY = "mollure_reset_user_id";
export const VERIFY_RESULT_KEY = "mollure_verify_result";

type PersistAuthSessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  remember: boolean;
};

const canUseStorage = (storage: Storage) => {
  try {
    const probe = "__mollure_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

const clearKeys = (storage: Storage) => {
  try {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  } catch {
    // Safari private / blocked storage — ignore.
  }
};

const writeKeys = (
  storage: Storage,
  payload: Omit<PersistAuthSessionPayload, "remember">,
) => {
  storage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(payload.user));
};

export const isRememberMePreferred = () => {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(REMEMBER_KEY) === "1") return true;
    // Tokens already living in localStorage imply Remember Me was used.
    return Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
  } catch {
    return false;
  }
};

export const persistAuthSession = ({
  accessToken,
  refreshToken,
  user,
  remember,
}: PersistAuthSessionPayload) => {
  if (typeof window === "undefined") return;

  const payload = { accessToken, refreshToken, user };
  const localOk = canUseStorage(window.localStorage);
  const sessionOk = canUseStorage(window.sessionStorage);

  // Prefer localStorage when Remember Me is on; fall back to sessionStorage
  // if Safari private mode / ITP blocks persistent storage.
  if (remember && localOk) {
    clearKeys(window.sessionStorage);
    try {
      writeKeys(window.localStorage, payload);
      window.localStorage.setItem(REMEMBER_KEY, "1");
      return;
    } catch {
      // Fall through to sessionStorage.
    }
  }

  if (sessionOk) {
    clearKeys(window.localStorage);
    try {
      window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      // ignore
    }
    try {
      writeKeys(window.sessionStorage, payload);
      return;
    } catch {
      // ignore
    }
  }

  // Last resort: try the other store even if probe failed earlier.
  try {
    writeKeys(window.localStorage, payload);
    if (remember) window.localStorage.setItem(REMEMBER_KEY, "1");
  } catch {
    try {
      writeKeys(window.sessionStorage, payload);
    } catch {
      // Cannot persist — session stays in memory only.
    }
  }
};

export const clearPersistedAuthSession = () => {
  if (typeof window === "undefined") return;
  clearKeys(window.localStorage);
  clearKeys(window.sessionStorage);
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore
  }
};

export const getPersistedAuthSession = () => {
  if (typeof window === "undefined") return null;

  const readFrom = (storage: Storage) => {
    try {
      const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
      const userRaw = storage.getItem(USER_KEY);
      if (!accessToken || !refreshToken || !userRaw) return null;
      try {
        const user = JSON.parse(userRaw) as AuthUser;
        return { accessToken, refreshToken, user };
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  };

  // Prefer localStorage (Remember Me) so a stale sessionStorage copy cannot win.
  return readFrom(window.localStorage) ?? readFrom(window.sessionStorage);
};
