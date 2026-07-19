// apps/web/domain/card/card.service.ts
import { CardRepository, UpdateCardPayload } from "./card.repo";
import { DomainEvents } from "@/domain/events/domain-events";
import { randomUUID } from "crypto";
import { CardType } from "./card.types";

export const CardService = {
  createCard: async (
    title: string,
    type: CardType,
    columnId: string,
    parentId?: string,
  ) => {
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    return CardRepository.create(title, type, columnId, parentId);
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
    boardId: string,
    cardId: string,
    targetColumnId: string,
    targetPosition: number,
    userId?: string,
  ) => {
    if (targetPosition < 0) {
      throw new Error("Invalid target position");
    }

    const card = await CardRepository.reorder(
      cardId,
      targetColumnId,
      targetPosition,
      // userId,
    );

    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_MOVED",
      payload: {
        boardId,
        cardId,
        targetColumnId,
        targetPosition,
        userId,
      },
    });
    return card;
  },

  async updateCardDetails(cardId: string, data: UpdateCardPayload) {
    if (!cardId) throw new Error("cardId is required");

    const updatedCard = await CardRepository.update(cardId, data);

    // Use your custom DomainEvents to dispatch the new event
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_UPDATED",
      payload: {
        cardId,
        changes: data,
        userId: data.assigneeId || "", // Passing this so notifications know who to alert
      },
    });

    return updatedCard;
  },

  async deleteCard(cardId: string) {
    if (!cardId) throw new Error("cardId is required");

    const card = await CardRepository.softDelete(cardId);

    // Don't forget our Event Bus!
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_DELETED", // Add this to your domain-events.ts types later
      payload: { cardId },
    });

    return card;
  },

  async getCardDetails(cardId: string) {
    if (!cardId) throw new Error("cardId is required");

    return CardRepository.getByIdWithDetails(cardId);
  },

  async searchCards(query: string, allowedBoardIds: string[]) {
    if (!query || query.length < 2) return [];
    return CardRepository.findByQuery(query, allowedBoardIds);
  },

  async updateCardDescription(
    cardId: string,
    description: string,
    actorId: string,
    actorName: string,
  ) {
    if (!cardId) throw new Error("cardId is required");

    const result = await CardRepository.updateDescription(
      cardId,
      description,
      actorId,
      actorName,
    );

    // A. Dispatch the board update (so everyone sees the new description)
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_UPDATED",
      payload: {
        cardId,
        description,
        userId: actorId,
        actorName,
      },
    });

    // B. Dispatch direct pings to the mentioned users (so their navbar bell lights up!)
    for (const notification of result.notificationsToDispatch) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "NOTIFICATION_CREATED",
        payload: notification,
      });
    }

    return result.updatedCard;
  },
};
