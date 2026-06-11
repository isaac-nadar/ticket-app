import { UpdateCardPayload } from "../card/card.repo";

export type CardMovedEvent = {
  cardId: string;
  targetColumnId: string;
  targetPosition: number;
};

export type CardCommentEvent = {
  cardId: string;
  assigneeId: string;
  content: string;
  commentedBy: string;
};

// 1. Define every event and its exact payload shape
export type DomainEventMap = {
  CARD_MOVED: {
    boardId: string;
    cardId: string;
    targetColumnId: string;
    targetPosition: number;
    userId?: string;
  };
  CARD_CREATED: { boardId: string; cardId: string; userId?: string };
  CARD_UPDATED: {
    boardId: string;
    cardId: string;
    userId?: string;
    changes: UpdateCardPayload;
  };
  BOARD_UPDATED: { boardId: string }; // We will use this for WebSockets!
  CARD_DELETED: { cardId: string; userId?: string };
};

// 2. A helper type for dispatching
export type DomainEvent<T extends keyof DomainEventMap = keyof DomainEventMap> =
  {
    id?: string;
    type: T;
    payload: DomainEventMap[T];
  };
