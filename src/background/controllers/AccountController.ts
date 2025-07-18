import { BaseControllerV2, ControllerStateMetadata } from "./BaseControllerV2";
import { RestrictedMessenger } from "../messaging/RestrictedMessenger";
import axios from "axios";

export interface AccountControllerState {
  accounts: {
    [address: string]: {
      address: string;
      name: string;
      balance?: string;
      nonce?: string;
      metadata: any;
    };
  };
  selectedAccount: string | null;
  [key: string]: unknown;
}

export type AccountControllerMessenger = RestrictedMessenger;

export interface AccountControllerActions {
  "AccountController:setSelectedAccount": (address: string) => void;
  "AccountController:setAccountName": (address: string, name: string) => void;
  "AccountController:listAccounts": () => Array<{
    address: string;
    name: string;
    balance?: string;
    nonce?: string;
    metadata: any;
  }>;
  "AccountController:addAccount": (address: string, name?: string) => void;
  "AccountController:getBalance": (address: string) => Promise<string>;
  "AccountController:updateBalance": (address: string, balance: string) => void;
  "AccountController:getNonce": (address: string) => string;
}

export class AccountController extends BaseControllerV2<
  "AccountController",
  AccountControllerState,
  AccountControllerMessenger
> {
  constructor({ messenger }: { messenger: AccountControllerMessenger }) {
    const metadata: ControllerStateMetadata = {
      accounts: { persist: true },
      selectedAccount: { persist: true },
    };

    const state: AccountControllerState = {
      accounts: {},
      selectedAccount: null,
    };

    super({
      name: "AccountController",
      metadata,
      state,
      messenger,
    });

    this.registerActions();
    this.setupEventListeners();
  }

  private registerActions(): void {
    this.messagingSystem.registerActionHandler(
      "AccountController:setSelectedAccount",
      this.setSelectedAccount.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:setAccountName",
      this.setAccountName.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:listAccounts",
      this.listAccounts.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:addAccount",
      this.addAccount.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:getBalance",
      this.getBalance.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:updateBalance",
      this.updateBalance.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "AccountController:getNonce",
      this.getNonce.bind(this)
    );
  }

  private setupEventListeners(): void {
    this.messagingSystem.subscribe(
      "KeyringController:stateChange",
      this.onKeyringStateChange.bind(this)
    );

    // 트랜잭션 완료 시 잔액 자동 업데이트
    this.messagingSystem.subscribe(
      "TransactionController:TransactionCompleted",
      this.onTransactionCompleted.bind(this)
    );
  }

  private onKeyringStateChange(keyringState: any): void {
    const accounts = keyringState.keyrings.flatMap(
      (keyring: any) => keyring.accounts
    );

    accounts.forEach((address: string, index: number) => {
      if (!this.state.accounts[address]) {
        this.addAccount(address, `계정 ${index + 1}`);
      }
    });

    if (!this.state.selectedAccount && accounts.length > 0) {
      this.setSelectedAccount(accounts[0]);
    }
  }

  private async onTransactionCompleted(transactionData: {
    from: string;
    to: string;
    value: string;
  }): Promise<void> {
    try {
      console.log("트랜잭션 완료 이벤트 수신:", transactionData);

      // from 계정의 잔액 업데이트
      if (transactionData.from) {
        await this.getBalance(transactionData.from);
      }

      // to 계정이 내 계정 중 하나라면 해당 계정의 잔액도 업데이트
      if (transactionData.to && this.state.accounts[transactionData.to]) {
        await this.getBalance(transactionData.to);
      }
    } catch (error) {
      console.error("트랜잭션 완료 후 잔액 업데이트 실패:", error);
    }
  }

  setSelectedAccount(address: string): void {
    if (!this.state.accounts[address]) {
      throw new Error(`Account ${address} not found`);
    }

    this.update(() => {
      this.state.selectedAccount = address;
    });
  }

  setAccountName(address: string, name: string): void {
    if (!this.state.accounts[address]) {
      throw new Error(`Account ${address} not found`);
    }

    this.update(() => {
      this.state.accounts[address].name = name;
    });
  }

  listAccounts(): Array<{
    address: string;
    name: string;
    metadata: any;
  }> {
    return Object.values(this.state.accounts);
  }

  addAccount(address: string, name?: string): void {
    const accountName =
      name || `계정 ${Object.keys(this.state.accounts).length + 1}`;

    this.update(() => {
      this.state.accounts[address] = {
        address,
        name: accountName,
        metadata: {},
      };

      if (!this.state.selectedAccount) {
        this.state.selectedAccount = address;
      }
    });
  }

  getSelectedAccount(): string | null {
    return this.state.selectedAccount;
  }

  async getBalance(address: string): Promise<string> {
    try {
      const { data } = await axios.get(
        `https://barrelleye.com/accounts/${address}`
      );

      console.log(data);
      if (data.statusCode === 404) {
        this.updateAccountData(address, "0", "00");
        return "0";
      }

      if (data.statusCode === 200 && data.data?.account?.balance) {
        const hexBalance = data.data.account.balance;

        const decimalBalance = parseInt(hexBalance, 16);
        console.log("10진수 잔액:", decimalBalance);

        const balanceStr = decimalBalance.toString();
        console.log(`${address} 실제 잔액: ${balanceStr} BARREL`);

        const nonce = data.data.account.nonce || "00";
        this.updateAccountData(address, balanceStr, nonce);
        return balanceStr;
      }

      this.updateAccountData(address, "0", "00");
      return "0";
    } catch (error) {
      console.error("실제 잔액 조회 실패:", error);
      return "0";
    }
  }

  updateBalance(address: string, balance: string): void {
    console.log(`계정 잔액 업데이트: ${address} -> ${balance} BARREL`);

    this.update(() => {
      if (this.state.accounts[address]) {
        this.state.accounts[address].balance = balance;
      }
    });
  }

  updateAccountData(address: string, balance: string, nonce: string): void {
    console.log(
      `계정 데이터 업데이트: ${address} -> 잔액: ${balance} BARREL, nonce: ${nonce}`
    );

    this.update(() => {
      if (this.state.accounts[address]) {
        this.state.accounts[address].balance = balance;
        this.state.accounts[address].nonce = nonce;
      }
    });
  }

  getNonce(address: string): string {
    const account = this.state.accounts[address];

    if (!account || !account.nonce) {
      console.warn(`nonce를 찾을 수 없음: ${address}, 기본값 "00" 반환`);
      return "00";
    }

    console.log(`nonce 조회: ${address} -> ${account.nonce}`);
    return account.nonce;
  }
}
