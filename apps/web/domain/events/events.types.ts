import { UpdateCardPayload } from "../card/card.repo";

// 1. Define every event and its exact payload shape
export type DomainEventMap = {
  CARD_MOVED: {
    boardId: string;
    cardId: string;
    targetColumnId: string;
    targetPosition: number;
    assigneeId?: string; // who should be notified
    actorId?: string; // who performed the move (excluded from notification)
    notificationTitle?: string; // pre-built by the service, e.g. "Card moved"
    notificationBody?: string; // e.g. "'Fix login' moved to Done"
  };
  CARD_CREATED: {
    boardId: string;
    cardId: string;
    assigneeId?: string;
    actorId?: string;
  };
  CARD_UPDATED: {
    boardId: string;
    cardId: string;
    assigneeId?: string; // who should be notified
    actorId?: string; // who performed the edit (excluded from notification)
    changes: UpdateCardPayload;
    notificationTitle?: string; // pre-built by the service
    notificationBody?: string; // e.g. "'Fix login': priority set to HIGH"
  };
  BOARD_UPDATED: { boardId: string }; // We will use this for WebSockets!
  CARD_DELETED: { cardId: string; actorId?: string };
  NOTIFICATION_CREATED: {
    userId: string;
    actorId: string;
    cardId: string;
    boardId: string;
    title: string;
    body: string;
  };
};

// 2. A helper type for dispatching
export type DomainEvent<T extends keyof DomainEventMap = keyof DomainEventMap> =
  {
    id?: string;
    type: T;
    payload: DomainEventMap[T];
  };
