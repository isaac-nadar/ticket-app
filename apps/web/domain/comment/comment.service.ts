import prisma from "@/lib/db";
import { CommentRepository } from "./comment.repo";
import { NotificationService } from "../notification/notification.service"; // Adjust path if needed

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
  }) => {
    // 1. Save the comment via Repository
    const comment = await CommentRepository.create({
      text: params.text,
      cardId: params.cardId,
      userId: params.userId,
    });

    // 2. Business Logic: Do we need to notify someone?
    // We fetch the card to see who is assigned to it
    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      select: { title: true, assigneeId: true },
    });

    // If the card has an assignee, AND the assignee is NOT the person who just commented...
    // if (card?.assigneeId && card.assigneeId !== params.userId) {
    //   await NotificationService.create(
    //     card.assigneeId,
    //     "COMMENT_ADDED",
    //     `${params.userName || "Someone"} commented on your card: "${card.title}"`,
    //     `/boards/${params.boardId}?card=${params.cardId}`,
    //   );
    // }

    return comment;
  },
};
