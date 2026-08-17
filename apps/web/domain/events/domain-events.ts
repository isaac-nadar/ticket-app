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

// Server Actions and Route Handlers can land in separate module graphs,
// each with their own copy of `subscribers`. Importing bootstrap here
// (idempotent, see domain/bootstrap.ts) guarantees this module instance
// has listeners registered before dispatch looks anything up, regardless
// of which entry point triggered it. Cached so dispatch — a hot path,
// called on every card move/update/comment/attachment — only pays for the
// dynamic import once per module instance instead of on every call.
let bootstrapReady: Promise<unknown> | null = null;
function ensureBootstrap() {
  if (!bootstrapReady) {
    bootstrapReady = import("@/domain/bootstrap");
  }
  return bootstrapReady;
}

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
    await ensureBootstrap();

    const handlers = subscribers[event.type] || [];
    for (const handler of handlers) {
      // Isolate each subscriber: one listener's failure (e.g. the
      // notification pipeline hitting a DB/Redis error) must not stop
      // sibling listeners (e.g. the realtime board broadcast) from running,
      // and must not bubble up to fail the action that triggered the
      // dispatch — the underlying mutation already succeeded by this point.
      try {
        await handler(event.payload, event);
      } catch (err) {
        console.error(
          `🚨 [DomainEvents] Handler failed for "${event.type}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  },
};
