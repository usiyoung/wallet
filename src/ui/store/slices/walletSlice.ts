import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PageType = "dashboard" | "transfer" | "receive" | "swap";

interface WalletState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isSettingUp: boolean;
  accounts: string[];
  selectedAccount: string | null;
  balance: string;
  currentPage: PageType;
}

const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  isSettingUp: false,
  accounts: [],
  selectedAccount: null,
  balance: "0",
  currentPage: "dashboard",
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setUnlocked: (state, action: PayloadAction<boolean>) => {
      state.isUnlocked = action.payload;
    },
    setSettingUp: (state, action: PayloadAction<boolean>) => {
      state.isSettingUp = action.payload;
    },
    setAccounts: (state, action: PayloadAction<string[]>) => {
      state.accounts = action.payload;
      if (action.payload.length > 0 && !state.selectedAccount) {
        state.selectedAccount = action.payload[0];
      }
    },
    setSelectedAccount: (state, action: PayloadAction<string>) => {
      state.selectedAccount = action.payload;
    },
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<PageType>) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  setInitialized,
  setUnlocked,
  setSettingUp,
  setAccounts,
  setSelectedAccount,
  setBalance,
  setCurrentPage,
} = walletSlice.actions;

export default walletSlice.reducer;
