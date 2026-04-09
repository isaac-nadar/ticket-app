export type DomainEvent = {
  id: string;
  type: string;
  payload: unknown;
};

type EventHandler = (event: DomainEvent) => Promise<void>;

const handlers: EventHandler[] = [];

export const DomainEvents = {
  register: (handler: EventHandler) => {
    handlers.push(handler);
  },

  dispatch: async (event: DomainEvent) => {
    for (const handler of handlers) {
      await handler(event);
    }
  },
};
