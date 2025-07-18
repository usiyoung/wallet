export interface ControllerStateMetadata {
  [property: string]: {
    persist?: boolean;
  };
}

export interface BaseState {
  [key: string]: unknown;
}

export abstract class BaseControllerV2<
  Name extends string,
  State extends BaseState,
  Messenger
> {
  public readonly name: Name;
  public readonly metadata: ControllerStateMetadata;
  protected state: State;
  protected messagingSystem: Messenger;

  constructor(config: {
    name: Name;
    metadata: ControllerStateMetadata;
    state: State;
    messenger: Messenger;
  }) {
    this.name = config.name;
    this.metadata = config.metadata;
    this.state = config.state;
    this.messagingSystem = config.messenger;

    this.restorePersistedState();
  }

  private getStorageKey(): string {
    return `${this.name}`;
  }

  private async restorePersistedState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([this.getStorageKey()]);
      const persistedData = result[this.getStorageKey()];
      if (persistedData) {
        const parsedData = JSON.parse(persistedData);

        Object.keys(this.metadata).forEach((key) => {
          if (this.metadata[key].persist && parsedData[key] !== undefined) {
            (this.state as any)[key] = parsedData[key];
          }
        });
      }
    } catch (error) {
      console.warn(
        `Failed to restore persisted state for ${this.name}:`,
        error
      );
    }
  }

  private async persistState(): Promise<void> {
    try {
      const persistedData: any = {};

      Object.keys(this.metadata).forEach((key) => {
        if (this.metadata[key].persist) {
          persistedData[key] = (this.state as any)[key];
        }
      });

      await chrome.storage.local.set({
        [this.getStorageKey()]: JSON.stringify(persistedData),
      });
    } catch (error) {
      console.warn(`Failed to persist state for ${this.name}:`, error);
    }
  }

  protected update(callback: (state: State) => void | State): void {
    const newState = callback(this.state);
    if (newState) {
      this.state = newState;
    }
    this.persistState();
    this.publishStateChange();
  }

  protected publishStateChange(): void {
    const eventName = `${this.name}:stateChange` as const;
    (this.messagingSystem as any).publish(eventName, this.state);
  }

  getState(): State {
    return this.state;
  }

  destroy(): void {}
}
