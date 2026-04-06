import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id: number;
  email: string;
  user_type: string;
  is_email_verified: boolean;
  is_active: boolean;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

export type AuthSessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    clearAuthSession: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
  },
});

export const { setAuthSession, clearAuthSession } = authSlice.actions;
export default authSlice.reducer;
