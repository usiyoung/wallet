import { BaseControllerV2, ControllerStateMetadata } from "./BaseControllerV2";
import { RestrictedMessenger } from "../messaging/RestrictedMessenger";
import axios from "axios";

export interface TransactionParams {
  from: string;
  to: string;
  value: string;
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
}

export interface Transaction extends TransactionParams {
  hash?: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
}

export interface TransactionControllerState {
  transactions: Transaction[];
  [key: string]: unknown;
}

export type TransactionControllerMessenger = RestrictedMessenger;

export interface TransactionControllerActions {
  "TransactionController:sendTransaction": (
    params: TransactionParams
  ) => Promise<string>;
  "TransactionController:getTransactions": () => Transaction[];
  "TransactionController:getRecentTransactions": () => Promise<any[]>;
  "TransactionController:faucet": (
    address: string
  ) => Promise<{ hash: string; value: string }>;
}

export class TransactionController extends BaseControllerV2<
  "TransactionController",
  TransactionControllerState,
  TransactionControllerMessenger
> {
  constructor({ messenger }: { messenger: TransactionControllerMessenger }) {
    const metadata: ControllerStateMetadata = {
      transactions: { persist: true },
    };

    const state: TransactionControllerState = {
      transactions: [],
    };

    super({
      name: "TransactionController",
      metadata,
      state,
      messenger,
    });

    this.registerActions();
  }

  private registerActions(): void {
    this.messagingSystem.registerActionHandler(
      "TransactionController:sendTransaction",
      this.sendTransaction.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "TransactionController:getTransactions",
      this.getTransactions.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "TransactionController:getRecentTransactions",
      this.getRecentTransactions.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "TransactionController:faucet",
      this.faucet.bind(this)
    );
  }

  async sendTransaction(params: TransactionParams): Promise<string> {
    try {
      const nonce = (await this.messagingSystem.call(
        "AccountController:getNonce",
        params.from
      )) as string;

      const privateKey = (await this.messagingSystem.call(
        "KeyringController:getPrivateKey",
        params.from
      )) as string;

      const { createTxInfo } = await import("../utils/transaction");

      const txInfo = createTxInfo(
        privateKey,
        nonce,
        params.from,
        params.to,
        parseInt(params.value),
        "ab"
      );

      const { data } = await axios.post("https://barrelleye.com/txs", txInfo, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txHash = data.hash || data.txHash || data.transactionHash;

      this.update((state) => {
        state.transactions.push({
          hash: txHash,
          from: params.from,
          to: params.to,
          value: params.value,
          timestamp: Date.now(),
          status: "confirmed",
        });
      });

      // 트랜잭션 완료 이벤트 발행 - AccountController가 잔액을 자동 업데이트함
      this.messagingSystem.publish(
        "TransactionController:TransactionCompleted",
        {
          from: params.from,
          to: params.to,
          value: params.value,
          hash: txHash,
        }
      );

      return txHash;
    } catch (error) {
      throw error;
    }
  }

  getTransactions(): Transaction[] {
    return this.state.transactions;
  }

  async getRecentTransactions(): Promise<any[]> {
    try {
      const { data } = await axios.get(
        "https://barrelleye.com/txs?page=1&size=10"
      );

      if (data.statusCode === 200) {
        return data.data.transactions;
      }
      return [];
    } catch (error) {
      console.error("최근 거래 로딩 실패:", error);
      return [];
    }
  }

  async faucet(address: string): Promise<{ hash: string; value: string }> {
    try {
      const { data } = await axios.post(
        "https://barrelleye.com/faucet",
        {
          accountAddress: address,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const transaction = data.data.transaction;

      this.update((state) => {
        state.transactions.push({
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          timestamp: Date.now(),
          status: "confirmed",
        });
      });

      this.messagingSystem.publish(
        "TransactionController:TransactionCompleted",
        {
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          hash: transaction.hash,
        }
      );

      return {
        hash: transaction.hash,
        value: transaction.value,
      };
    } catch (error) {
      throw error;
    }
  }
}
