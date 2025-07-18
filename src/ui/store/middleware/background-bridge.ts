import { Middleware } from "@reduxjs/toolkit";
import {
  setAccounts,
  setUnlocked,
  setInitialized,
  setSelectedAccount,
  setBalance,
} from "../slices/walletSlice";

interface BackgroundMessage {
  action: string;
  params?: any[];
}

class BackgroundBridge {
  private static instance: BackgroundBridge;
  private store: any;

  static getInstance(): BackgroundBridge {
    if (!BackgroundBridge.instance) {
      BackgroundBridge.instance = new BackgroundBridge();
    }
    return BackgroundBridge.instance;
  }

  setStore(store: any): void {
    this.store = store;
    this.setupMessageListener();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      const isVaultCreated = await this.call(
        "KeyringController:isVaultCreated"
      );

      if (isVaultCreated) {
        this.store.dispatch(setInitialized(true));
        this.store.dispatch(setUnlocked(false));
      } else {
        this.store.dispatch(setInitialized(false));
        this.store.dispatch(setUnlocked(false));
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.store.dispatch(setInitialized(false));
      this.store.dispatch(setUnlocked(false));
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === "STATE_UPDATE") {
        this.handleStateUpdate(message);
      } else if (message.type === "TRANSACTION_COMPLETED") {
        this.handleTransactionCompleted(message);
      }
    });
  }

  private handleStateUpdate(message: any): void {
    const { controller, state } = message;

    if (controller === "keyring") {
      this.store.dispatch(setUnlocked(state.isUnlocked));
      this.store.dispatch(setInitialized(state.vault !== ""));

      const accounts = state.keyrings.flatMap(
        (keyring: any) => keyring.accounts
      );
      this.store.dispatch(setAccounts(accounts));
    }

    if (controller === "account") {
      if (state.selectedAccount) {
        this.store.dispatch(setSelectedAccount(state.selectedAccount));
      }
    }
  }

  private async handleTransactionCompleted(message: any): Promise<void> {
    const { data } = message;
    console.log("트랜잭션 완료 이벤트 수신:", data);

    try {
      // 현재 선택된 계정과 관련된 트랜잭션인지 확인
      const state = this.store.getState();
      const selectedAccount = state.wallet.selectedAccount;

      if (
        selectedAccount &&
        (data.from === selectedAccount || data.to === selectedAccount)
      ) {
        // 잔액 자동 업데이트
        const newBalance = await this.call(
          "AccountController:getBalance",
          selectedAccount
        );
        this.store.dispatch(setBalance(newBalance));
        console.log("잔액 자동 업데이트 완료:", newBalance);
      }
    } catch (error) {
      console.error("트랜잭션 완료 후 잔액 업데이트 실패:", error);
    }
  }

  async call(action: string, ...params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const message: BackgroundMessage = { action, params };

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response?.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response);
      });
    });
  }
}

const bridge = BackgroundBridge.getInstance();

const backgroundBridge: Middleware = (store) => {
  bridge.setStore(store);

  return (next) => (action) => {
    const result = next(action);
    return result;
  };
};

export default backgroundBridge;
export { bridge };
