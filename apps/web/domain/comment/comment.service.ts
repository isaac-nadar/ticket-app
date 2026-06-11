import { CommentRepository } from "./comment.repo";
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
    if (params.assigneeId !== params.userId) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "COMMENTS_ADDED",
        payload: {
          cardId: params.cardId,
          changes: params.text,
          userId: params.assigneeId,
        },
      });
    }

    return comment;
  },
};
