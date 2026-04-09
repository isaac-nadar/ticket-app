// apps/web/domain/card/card.service.ts
import { CardRepository } from "./card.repo";
import { DomainEvents } from "@/domain/events/domain-events";
import { randomUUID } from "crypto";
import { CardType } from "./card.types";

export const CardService = {
  createCard: async (title: string, type: CardType, columnId: string) => {
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    return CardRepository.create(title, type, columnId);
  },

  listCards: async () => {
    return CardRepository.findAll();
  },

  moveCard: async (cardId: string, columnId: string) => {
    return CardRepository.move(cardId, columnId);
  },

  listByBoard: async (boardId: string) => {
    if (!boardId) {
      throw new Error("boardId is required");
    }

    return CardRepository.findByBoard(boardId);
  },

  reorderCard: async (
    cardId: string,
    targetColumnId: string,
    targetPosition: number,
  ) => {
    if (targetPosition < 0) {
      throw new Error("Invalid target position");
    }

    const card = await CardRepository.reorder(
      cardId,
      targetColumnId,
      targetPosition,
    );

    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_MOVED",
      payload: {
        cardId,
        targetColumnId,
        targetPosition,
      },
    });
    return card;
  },
};
