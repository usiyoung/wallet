import { BaseControllerV2, ControllerStateMetadata } from "./BaseControllerV2";
import { RestrictedMessenger } from "../messaging/RestrictedMessenger";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { HDKey } from "@scure/bip32";
import { Buffer } from "buffer";

export interface KeyringControllerState {
  isUnlocked: boolean;
  keyrings: Array<{
    type: string;
    accounts: string[];
  }>;
  vault: string;
  [key: string]: unknown;
}

export type KeyringControllerMessenger = RestrictedMessenger;

export interface KeyringControllerActions {
  "KeyringController:createNewVaultAndRestore": (
    password: string,
    mnemonic?: string
  ) => Promise<string[]>;
  "KeyringController:addNewAccount": () => Promise<string>;
  "KeyringController:setLocked": () => Promise<void>;
  "KeyringController:unlock": (password: string) => Promise<void>;
  "KeyringController:getAccounts": () => string[];
  "KeyringController:generateMnemonic": () => string;
  "KeyringController:isVaultCreated": () => boolean;
  "KeyringController:getPrivateKey": (address: string) => string;
  "KeyringController:setTempMnemonic": (mnemonic: string) => void;
  "KeyringController:getTempMnemonic": () => string | null;
  "KeyringController:clearTempMnemonic": () => void;
}

interface EncryptedVault {
  data: string;
  iv: string;
  salt: string;
}

export class KeyringController extends BaseControllerV2<
  "KeyringController",
  KeyringControllerState,
  KeyringControllerMessenger
> {
  private password: string | null = null;
  private tempMnemonic: string | null = null;
  private memStore: {
    hdKey?: HDKey;
    mnemonic?: string;
  } = {};

  constructor({ messenger }: { messenger: KeyringControllerMessenger }) {
    const metadata: ControllerStateMetadata = {
      isUnlocked: { persist: false },
      keyrings: { persist: true },
      vault: { persist: true },
    };

    const state: KeyringControllerState = {
      isUnlocked: false,
      keyrings: [],
      vault: "",
    };

    super({
      name: "KeyringController",
      metadata,
      state,
      messenger,
    });

    this.registerActions();
  }

  private registerActions(): void {
    this.messagingSystem.registerActionHandler(
      "KeyringController:createNewVaultAndRestore",
      this.createNewVaultAndRestore.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:addNewAccount",
      this.addNewAccount.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:setLocked",
      this.setLocked.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:unlock",
      this.unlock.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:getAccounts",
      this.getAccounts.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:generateMnemonic",
      this.generateMnemonic.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:isVaultCreated",
      this.isVaultCreated.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:getPrivateKey",
      this.getPrivateKey.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:setTempMnemonic",
      this.setTempMnemonic.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:getTempMnemonic",
      this.getTempMnemonic.bind(this)
    );

    this.messagingSystem.registerActionHandler(
      "KeyringController:clearTempMnemonic",
      this.clearTempMnemonic.bind(this)
    );
  }

  generateMnemonic(): string {
    return generateMnemonic();
  }

  async createNewVaultAndRestore(
    password: string,
    mnemonic?: string
  ): Promise<string[]> {
    const seedPhrase = mnemonic || this.generateMnemonic();

    if (!validateMnemonic(seedPhrase)) {
      throw new Error("Invalid mnemonic");
    }

    this.password = password;
    this.memStore.mnemonic = seedPhrase;

    const seed = mnemonicToSeedSync(seedPhrase);
    this.memStore.hdKey = HDKey.fromMasterSeed(seed);

    const firstAccount = this.getAccountFromHDKey(0);
    const accounts = [firstAccount];

    const vault = await this.encryptVault({
      mnemonic: seedPhrase,
      accounts,
    });

    this.update(() => {
      this.state.vault = JSON.stringify(vault);
      this.state.keyrings = [
        {
          type: "HD Key Tree",
          accounts,
        },
      ];
      this.state.isUnlocked = true;
    });

    return accounts;
  }

  async addNewAccount(): Promise<string> {
    if (!this.state.isUnlocked || !this.memStore.hdKey) {
      throw new Error("KeyringController: Cannot add account when locked");
    }

    const currentAccountCount = this.getAccounts().length;
    const newAccount = this.getAccountFromHDKey(currentAccountCount);

    this.update(() => {
      if (this.state.keyrings[0]) {
        this.state.keyrings[0].accounts.push(newAccount);
      }
    });

    await this.persistVault();

    return newAccount;
  }

  async setLocked(): Promise<void> {
    this.password = null;
    this.memStore = {};

    this.update(() => {
      this.state.isUnlocked = false;
    });
  }

  async unlock(password: string): Promise<void> {
    if (!this.state.vault) {
      throw new Error("Cannot unlock without a vault");
    }

    try {
      const vault = JSON.parse(this.state.vault);
      const decrypted = await this.decryptVault(vault, password);

      this.password = password;
      this.memStore.mnemonic = decrypted.mnemonic;

      const seed = mnemonicToSeedSync(decrypted.mnemonic);
      this.memStore.hdKey = HDKey.fromMasterSeed(seed);

      this.update(() => {
        this.state.isUnlocked = true;
      });
    } catch (error) {
      throw new Error("Incorrect password");
    }
  }

  getAccounts(): string[] {
    return this.state.keyrings.flatMap((keyring) => keyring.accounts);
  }

  private getAccountFromHDKey(index: number): string {
    if (!this.memStore.hdKey) {
      throw new Error("HD Key not available");
    }

    const derivedKey = this.memStore.hdKey.derive(`m/44'/60'/0'/0/${index}`);
    if (!derivedKey.privateKey) {
      throw new Error("Failed to derive private key");
    }

    const address = this.privateKeyToAddress(derivedKey.privateKey);
    return address;
  }

  private privateKeyToAddress(privateKey: Uint8Array): string {
    return `0x${Buffer.from(privateKey).toString("hex").slice(0, 40)}`;
  }

  private async encryptVault(data: any): Promise<EncryptedVault> {
    if (!this.password) {
      throw new Error("Password required for encryption");
    }

    const plaintext = JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintextBytes
    );

    return {
      data: Buffer.from(encrypted).toString("base64"),
      iv: Buffer.from(iv).toString("base64"),
      salt: Buffer.from(salt).toString("base64"),
    };
  }

  private async decryptVault(
    vault: EncryptedVault,
    password: string
  ): Promise<any> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const data = Buffer.from(vault.data, "base64");
    const iv = Buffer.from(vault.iv, "base64");
    const salt = Buffer.from(vault.salt, "base64");

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    const plaintext = decoder.decode(decrypted);
    return JSON.parse(plaintext);
  }

  private async persistVault(): Promise<void> {
    if (!this.password || !this.memStore.mnemonic) {
      return;
    }

    const vault = await this.encryptVault({
      mnemonic: this.memStore.mnemonic,
      accounts: this.getAccounts(),
    });

    this.update(() => {
      this.state.vault = JSON.stringify(vault);
    });
  }

  isVaultCreated(): boolean {
    return Boolean(this.state.vault);
  }

  getPrivateKey(address: string): string {
    if (!this.state.isUnlocked || !this.memStore.hdKey) {
      throw new Error("KeyringController: Cannot get private key when locked");
    }

    const accounts = this.getAccounts();
    const accountIndex = accounts.indexOf(address);

    if (accountIndex === -1) {
      throw new Error("Account not found");
    }

    const derivedKey = this.memStore.hdKey.derive(
      `m/44'/60'/0'/0/${accountIndex}`
    );
    if (!derivedKey.privateKey) {
      throw new Error("Failed to derive private key");
    }

    return Buffer.from(derivedKey.privateKey).toString("hex");
  }

  setTempMnemonic(mnemonic: string): void {
    this.tempMnemonic = mnemonic.trim();
  }

  getTempMnemonic(): string | null {
    return this.tempMnemonic;
  }

  clearTempMnemonic(): void {
    this.tempMnemonic = null;
  }
}
