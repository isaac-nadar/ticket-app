import { CommentRepository } from "./comment.repo";
import { CardService } from "@/domain/card/card.service";
import { DomainEvents } from "@/domain/events/domain-events";
import { randomUUID } from "crypto";

export const CommentService = {
  listComments: async (cardId: string) => {
    return CommentRepository.findByCardId(cardId);
  },

  addComment: async (params: {
    boardId: string;
    cardId: string;
    text: string;
    userId: string;
    userName?: string;
    assigneeId: string | null;
  }) => {
    // 1. Save the comment via Repository
    const comment = await CommentRepository.create({
      text: params.text,
      cardId: params.cardId,
      userId: params.userId,
    });

    // 2. Notify the card's CURRENT assignee (read fresh from the DB, not
    // trusted from the client), skipping self-notification.
    const [cardSummary, cardNumber] = await Promise.all([
      CardService.getSummary(params.cardId),
      CardService.getCardNumber(params.cardId),
    ]);

    if (
      cardSummary?.assigneeId &&
      cardSummary.assigneeId !== params.userId
    ) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "NOTIFICATION_CREATED",
        payload: {
          userId: cardSummary.assigneeId,
          actorId: params.userId,
          cardId: params.cardId,
          boardId: params.boardId,
          title: "New comment",
          body: `${params.userName ?? "Someone"} commented on ${cardNumber} "${cardSummary.title}"`,
        },
      });
    }

    // 3. Broadcast so everyone currently viewing the board sees the new
    // comment show up live (no assigneeId here — this dispatch is only for
    // the realtime board refresh, the notification above already fired).
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_UPDATED",
      payload: {
        boardId: params.boardId,
        cardId: params.cardId,
        actorId: params.userId,
        changes: {},
      },
    });

    return comment;
  },
};
