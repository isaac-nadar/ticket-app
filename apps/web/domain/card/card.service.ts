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

  // Lightweight lookup for other domains (comments, attachments) that need
  // to know who to notify and want the card's title for the message.
  getSummary: async (cardId: string) => {
    const card = await CardRepository.findById(cardId);
    if (!card) return null;
    return { title: card.title, assigneeId: card.assigneeId };
  },

  // Human-facing identifier, e.g. "CRD-12" — used to anchor every
  // notification message to the same number the board/UI shows.
  getCardNumber: async (cardId: string) => {
    return CardRepository.getCardNumber(cardId);
  },

  // The card's real board — callers should use this instead of trusting a
  // client-supplied boardId for cache keys / notification targeting.
  getBoardId: async (cardId: string) => {
    return CardRepository.findBoardId(cardId);
  },

  findDoneOlderThan: async (days: number) => {
    return CardRepository.findDoneOlderThan(days);
  },

  bulkDelete: async (ids: string[]) => {
    return CardRepository.deleteManyByIds(ids);
  },

  reorderCard: async (
    boardId: string,
    cardId: string,
    targetColumnId: string,
    targetPosition: number,
    assigneeId?: string,
    actorId?: string,
  ) => {
    if (targetPosition < 0) {
      throw new Error("Invalid target position");
    }

    const [{ updatedCard, targetColumnName }, cardNumber] = await Promise.all([
      CardRepository.reorder(cardId, targetColumnId, targetPosition),
      CardRepository.getCardNumber(cardId),
    ]);

    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_MOVED",
      payload: {
        boardId,
        cardId,
        targetColumnId,
        targetPosition,
        assigneeId,
        actorId,
        notificationTitle: "Card moved",
        notificationBody: `${cardNumber} "${updatedCard.title}" moved to ${targetColumnName}`,
      },
    });
    return updatedCard;
  },

  // Single entry point for the "Save Card Details" flow (title, type,
  // assignee, priority, description all land here together). Diffs against
  // the pre-save card so exactly one, specific notification goes out per
  // Save click — never one per field, never a generic "something changed".
  async updateCardDetails(
    cardId: string,
    data: UpdateCardPayload,
    boardId?: string,
    actorId?: string,
    actorName?: string,
  ) {
    if (!cardId) throw new Error("cardId is required");

    const [oldCard, cardNumber] = await Promise.all([
      CardRepository.findById(cardId),
      CardRepository.getCardNumber(cardId),
    ]);
    if (!oldCard) throw new Error("Card not found");

    const { updatedCard, notificationsToDispatch } = await CardRepository.update(
      cardId,
      data,
      actorId,
      actorName,
      boardId,
      cardNumber,
    );

    const changeDescriptions: string[] = [];
    const isNewAssignment =
      data.assigneeId !== undefined &&
      data.assigneeId !== oldCard.assigneeId &&
      !!data.assigneeId;

    if (data.assigneeId !== undefined && data.assigneeId !== oldCard.assigneeId) {
      changeDescriptions.push(data.assigneeId ? "assigned to you" : "unassigned");
    }
    if (data.priority !== undefined && data.priority !== oldCard.priority) {
      changeDescriptions.push(`priority set to ${data.priority}`);
    }
    if (data.title !== undefined && data.title !== oldCard.title) {
      changeDescriptions.push(`renamed to "${data.title}"`);
    }
    if (data.type !== undefined && data.type !== oldCard.type) {
      changeDescriptions.push(`type changed to ${data.type}`);
    }
    if (
      data.description !== undefined &&
      data.description !== oldCard.description
    ) {
      changeDescriptions.push("description updated");
    }

    // Only fire a notification (and a realtime board broadcast) if the
    // save actually changed something — clicking Save with no edits is a
    // no-op.
    if (changeDescriptions.length > 0) {
      const notificationTitle = isNewAssignment
        ? "You were assigned to a card"
        : "Card updated";
      const notificationBody = isNewAssignment
        ? `You were assigned to ${cardNumber} "${updatedCard.title}"`
        : `${cardNumber} "${updatedCard.title}": ${changeDescriptions.join(", ")}`;

      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "CARD_UPDATED",
        payload: {
          boardId: boardId ?? "",
          cardId,
          changes: data,
          // The card's CURRENT assignee (not just when assigneeId is part of this update)
          assigneeId: updatedCard.assigneeId ?? undefined,
          actorId,
          notificationTitle,
          notificationBody,
        },
      });
    }

    // Unassignment is a different audience than the rest of this update —
    // the *previous* assignee, who won't hear about it from the CARD_UPDATED
    // dispatch above since it targets the (now empty) current assignee.
    const wasUnassigned =
      data.assigneeId !== undefined &&
      data.assigneeId !== oldCard.assigneeId &&
      !data.assigneeId &&
      !!oldCard.assigneeId;

    if (wasUnassigned && actorId && oldCard.assigneeId !== actorId) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "NOTIFICATION_CREATED",
        payload: {
          userId: oldCard.assigneeId!,
          actorId,
          cardId,
          boardId: boardId ?? "",
          title: "Unassigned from a card",
          body: `You were unassigned from ${cardNumber} "${updatedCard.title}"`,
        },
      });
    }

    // Direct pings to @mentioned users — a different audience than the
    // assignee, so these stay separate from the summary notification above.
    for (const notification of notificationsToDispatch) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "NOTIFICATION_CREATED",
        payload: notification,
      });
    }

    return updatedCard;
  },

  async deleteCard(cardId: string, actorId?: string) {
    if (!cardId) throw new Error("cardId is required");

    const card = await CardRepository.softDelete(cardId);

    // Don't forget our Event Bus!
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_DELETED", // Add this to your domain-events.ts types later
      payload: { cardId, actorId },
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

};
