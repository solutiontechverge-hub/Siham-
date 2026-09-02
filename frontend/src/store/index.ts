import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { baseApi } from "./services/baseApi";

// Ensure all injectEndpoints modules register on the shared baseApi
// before the store middleware handles mutations/tag invalidation.
import "./services/authApi";
import "./services/profileApi";
import "./services/businessApi";
import "./services/financeApi";
import "./services/messagingApi";
import "./services/notificationsApi";
import "./services/contactApi";
import "./services/adminApi";
import "./services/reviewsApi";
import "./services/favoritesApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
