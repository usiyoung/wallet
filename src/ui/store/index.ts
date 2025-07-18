import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./slices/walletSlice";
import backgroundBridge from "./middleware/background-bridge";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(backgroundBridge),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
