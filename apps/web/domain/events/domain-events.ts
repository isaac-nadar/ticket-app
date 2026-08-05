// export type DomainEvent = {
//   id: string;
//   type: string;
//   payload: unknown;
// };

// type EventHandler = (event: DomainEvent) => Promise<void>;

import { DomainEventMap, DomainEvent } from "./events.types";

// A handler now only receives the specific payload it cares about!
type EventHandler<T extends keyof DomainEventMap> = (
  payload: DomainEventMap[T],
  event: DomainEvent<T>,
) => Promise<void>;

type AnyEventHandler = (payload: unknown, event: DomainEvent) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscribers: Record<string, EventHandler<any>[]> = {};

// const handlers: EventHandler[] = [];

export const DomainEvents = {
  subscribe: <T extends keyof DomainEventMap>(
    eventType: T,
    handler: EventHandler<T>,
  ) => {
    if (!subscribers[eventType]) {
      subscribers[eventType] = [];
    }
    subscribers[eventType].push(handler as unknown as AnyEventHandler);
  },

  dispatch: async (event: DomainEvent) => {
    // Server Actions and Route Handlers can land in separate module graphs,
    // each with their own copy of `subscribers`. Registering listeners here
    // (idempotent, see domain/bootstrap.ts) guarantees this module instance
    // has them before we look anything up, regardless of which entry point
    // triggered the dispatch.
    await import("@/domain/bootstrap");

    const handlers = subscribers[event.type] || [];
    for (const handler of handlers) {
      await handler(event.payload, event);
    }
  },
};
