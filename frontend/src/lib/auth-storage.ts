import type { AuthUser } from "../store/slices/authSlice";

const ACCESS_TOKEN_KEY = "mollure_access_token";
const REFRESH_TOKEN_KEY = "mollure_refresh_token";
const USER_KEY = "mollure_user";

type PersistAuthSessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  remember: boolean;
};

export const persistAuthSession = ({
  accessToken,
  refreshToken,
  user,
  remember,
}: PersistAuthSessionPayload) => {
  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);
  otherStorage.removeItem(USER_KEY);

  targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  targetStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearPersistedAuthSession = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
};

export const getPersistedAuthSession = () => {
  const readFrom = (storage: Storage) => {
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
  };

  return readFrom(window.localStorage) ?? readFrom(window.sessionStorage);
};
