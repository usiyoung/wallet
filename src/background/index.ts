import { RestrictedMessenger } from "./messaging/RestrictedMessenger";
import { KeyringController } from "./controllers/KeyringController";
import { AccountController } from "./controllers/AccountController";
import { TransactionController } from "./controllers/TransactionController";

console.log("Wallet background script loaded");

class BackgroundController {
  private messenger: RestrictedMessenger;
  private keyringController: KeyringController;
  private accountController: AccountController;
  private transactionController: TransactionController;

  constructor() {
    this.messenger = new RestrictedMessenger();

    this.keyringController = new KeyringController({
      messenger: this.messenger,
    });

    this.accountController = new AccountController({
      messenger: this.messenger,
    });

    this.transactionController = new TransactionController({
      messenger: this.messenger,
    });

    this.setupMessageHandlers();
    this.setupStateSync();

    console.log("Controllers initialized:", {
      keyring: this.keyringController.name,
      account: this.accountController.name,
      transaction: this.transactionController.name,
    });
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message)
        .then(sendResponse)
        .catch((error) => {
          console.error("Background script error:", error);
          sendResponse({ error: error.message });
        });

      return true;
    });
  }

  private async handleMessage(message: any): Promise<any> {
    const { action, params = [] } = message;

    try {
      return this.messenger.call(action, ...params);
    } catch (error) {
      throw new Error(`Action failed: ${error}`);
    }
  }

  private setupStateSync(): void {
    this.messenger.subscribe("KeyringController:stateChange", (state) => {
      this.sendStateToUI("keyring", state);
    });

    this.messenger.subscribe("AccountController:stateChange", (state) => {
      this.sendStateToUI("account", state);
    });

    // 트랜잭션 완료 이벤트를 UI로 전송
    this.messenger.subscribe(
      "TransactionController:TransactionCompleted",
      (transactionData) => {
        this.sendTransactionCompletedToUI(transactionData);
      }
    );
  }

  private async sendStateToUI(controller: string, state: any): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "STATE_UPDATE",
              controller,
              state,
            })
            .catch(() => {});
        }
      });

      chrome.runtime
        .sendMessage({
          type: "STATE_UPDATE",
          controller,
          state,
        })
        .catch(() => {});
    } catch (error) {
      console.error("Failed to send state to UI:", error);
    }
  }

  private async sendTransactionCompletedToUI(
    transactionData: any
  ): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "TRANSACTION_COMPLETED",
              data: transactionData,
            })
            .catch(() => {});
        }
      });

      chrome.runtime
        .sendMessage({
          type: "TRANSACTION_COMPLETED",
          data: transactionData,
        })
        .catch(() => {});
    } catch (error) {
      console.error("Failed to send transaction completed to UI:", error);
    }
  }
}

new BackgroundController();
