export type ActionHandler = (...args: any[]) => any;
export type EventListener = (...args: any[]) => void;

export interface MessengerActions {
  [actionName: string]: ActionHandler;
}

export interface MessengerEvents {
  [eventName: string]: EventListener[];
}

export class RestrictedMessenger {
  private actions: MessengerActions = {};
  private events: MessengerEvents = {};

  registerActionHandler<T extends string>(
    actionName: T,
    handler: ActionHandler
  ): void {
    this.actions[actionName] = handler;
  }

  call<T extends string, Args extends any[], Return>(
    actionName: T,
    ...args: Args
  ): Return {
    const handler = this.actions[actionName];
    if (!handler) {
      throw new Error(`Action "${actionName}" not found`);
    }
    return handler(...args);
  }

  subscribe<T extends string>(eventName: T, listener: EventListener): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  unsubscribe<T extends string>(eventName: T, listener: EventListener): void {
    if (!this.events[eventName]) {
      return;
    }
    const index = this.events[eventName].indexOf(listener);
    if (index > -1) {
      this.events[eventName].splice(index, 1);
    }
  }

  publish<T extends string>(eventName: T, ...args: any[]): void {
    const listeners = this.events[eventName];
    if (!listeners) {
      return;
    }
    listeners.forEach((listener) => listener(...args));
  }

  clearEventSubscriptions(eventName: string): void {
    delete this.events[eventName];
  }

  destroy(): void {
    this.actions = {};
    this.events = {};
  }
}
