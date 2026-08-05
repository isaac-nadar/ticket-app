"use server";

import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";
import { AuthUser, getCurrentUser } from "@/lib/auth";
import { UserService } from "@/domain/user/user.service";
import { BoardUserService } from "@/domain/board/board.service";
import { CardType } from "@/domain/card/card.types";
import { createSafeAction } from "@/lib/safe-action";
import { CommentService } from "@/domain/comment/comment.service";
import { CardService } from "@/domain/card/card.service";
import { ColumnService } from "@/domain/column/column.service";

export async function moveCardAction(
  boardId: string,
  cardId: string,
  targetColumnId: string,
  targetPosition: number,
  assigneeId?: string,
) {
  try {
    console.log(
      `[SERVER] Moving Card ${cardId} to Column ${targetColumnId} at pos ${targetPosition}`,
    );

    // Actor is derived server-side (not trusted from the client) so we can
    // reliably skip notifying whoever is actually performing the move.
    const actor = await getCurrentUser();

    await CardService.reorderCard(
      boardId,
      cardId,
      targetColumnId,
      targetPosition,
      assigneeId,
      actor?.userId,
    );

    const CACHE_KEY = `board:${boardId}:data`;
    await redis.del(CACHE_KEY);
    console.log(`🧹 [Cache Cleared] Purged Redis key: ${CACHE_KEY}`);

    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to move card:", error);
    return { success: false, error: "Failed to move card" };
  }
}

// --- ADD NEW COLUMN ---
export async function createColumnAction(boardId: string, name: string) {
  try {
    await ColumnService.createColumn(boardId, name);

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to create column:", error);
    return { success: false, error: "Failed to create column" };
  }
}

// --- ADD NEW CARD ---
export async function createCardAction(
  boardId: string,
  columnId: string,
  title: string,
  parentId?: string,
) {
  try {
    await CardService.createCard(title, "FEATURE", columnId, parentId);

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to create card:", error);
    return { success: false, error: "Failed to create card" };
  }
}

export async function moveColumnAction(
  boardId: string,
  columnId: string,
  newPosition: number,
) {
  await ColumnService.updateColumnPosition(columnId, newPosition);
  await redis.del(`board:${boardId}:data`);
  revalidatePath(`/boards/${boardId}`);
}

export const inviteUserAction = createSafeAction(
  async (
    { boardId, email }: { boardId: string; email: string },
    { user }: { user: AuthUser },
  ) => {
    const targetUser = await UserService.checkUser(email.trim());
    if (!targetUser) throw new Error("User not found");

    try {
      await BoardUserService.assignUserToBoard(boardId, targetUser.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (dbError: any) {
      // Prisma throws P2002 if a unique constraint fails (meaning they are already on the board)
      if (dbError.code === "P2002") {
        return { success: false, error: "User is already on this board." };
      }
      throw dbError;
    }
    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);
    return { success: true, data: null };
  },
  "ADMIN",
);

// --- UPDATE CARD DETAILS ---
export const updateCardDetailsAction = async (
  boardId: string,
  cardId: string,
  data: {
    title: string;
    type: "BUG" | "FEATURE";
    description: string;
    assigneeId: string | null;
  }
) => {
  try {
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      select: { assigneeId: true, title: true }
    });

    if (!existingCard) {
      return { success: false, error: "Card not found" };
    }

    // Actor is derived server-side so the assignee-notification pipeline
    // (domain/card/card.service.ts) can skip self-notifications reliably.
    const actor = await getCurrentUser();
    const updatedCard = await CardService.updateCardDetails(
      cardId,
      data,
      boardId,
      actor?.userId,
    );

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);
    return { success: true, data: updatedCard };

  } catch (error) {
    console.error("Failed to update card details:", error);
    return { success: false, error: "Failed to update card details" };
  }
};

export const getCardCommentsAction = createSafeAction(
  async (cardId: string) => {
    const comments = await CommentService.listComments(cardId);
    return { success: true, data: comments };
  },
);

// --- ADD COMMENT ---
export const addCommentAction = createSafeAction(
  async (
    {
      boardId,
      cardId,
      text,
      assigneeId,
    }: {
      boardId: string;
      cardId: string;
      text: string;
      assigneeId: string | null;
    },
    { user },
  ) => {
    await CommentService.addComment({
      boardId,
      cardId,
      text,
      userId: user.userId,
      userName: user.name,
      assigneeId, // Pass the name so the notification service can use it
    });

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true, data: null };
  },
);

export const getCardDetailsAction = createSafeAction(async (cardId: string) => {
  const card = await CardService.getCardDetails(cardId);
  if (!card) {
    throw new Error("Card not found");
  }
  return { success: true, data: card };
});

export const getAvailableUsersAction = createSafeAction(
  async (boardId: string, { user }) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden");

    // Find all users where they do NOT have a BoardUser record for this board
    const availableUsers = await UserService.listAllUsersNotInBoard(boardId);

    return { success: true, data: availableUsers };
  },
);

export const assignUserToBoardAction = createSafeAction(
  async (data: { boardId: string; userId: string }, { user }) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden");

    await BoardUserService.assignUserToBoard(data.boardId, data.userId);

    revalidatePath(`/boards/${data.boardId}`);
    return { success: true, data: null };
  },
);

export const updateCardPriorityAction = createSafeAction(
  async (
    data: {
      cardId: string;
      boardId: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    },
    { user },
  ) => {
    // 1. Security Check: Ensure the user belongs to this board (or is an Admin)

    const boardAccess = await BoardUserService.checkUserAccessToBoard(
      user.userId,
      data.boardId,
    );

    if (!boardAccess && user.role !== "ADMIN") {
      throw new Error("Forbidden: You do not have access to this board.");
    }

    // 2. Update the card
    await CardService.updateCardDetails(
      data.cardId,
      { priority: data.priority },
      data.boardId,
      user.userId,
    );

    // 3. Purge the cache so the Kanban board instantly shows the new flag
    revalidatePath(`/boards/${data.boardId}`);
    return {
      success: true,
      data: { message: "Priority updated successfully" },
    };
  },
);

export const updateCardDescriptionAction = createSafeAction(
  async (
    data: {
      cardId: string;
      boardId: string;
      description: string;
    },
    { user },
  ) => {
    // 1. Security Check: Ensure the user belongs to this board (or is an Admin)
    const boardAccess = await BoardUserService.checkUserAccessToBoard(
      user.userId,
      data.boardId,
    );

    if (!boardAccess && user.role !== "ADMIN") {
      throw new Error("Forbidden: You do not have access to this board.");
    }

    // 2. Update the card description and handle mentions
    await CardService.updateCardDescription(
      data.cardId,
      data.description,
      user.userId,
      user.name || "Unknown User",
      data.boardId,
    );

    // 3. Purge the cache so the Kanban board instantly shows the new description
    revalidatePath(`/boards/${data.boardId}`);
    return {
      success: true,
      data: { message: "Description updated successfully" },
    };
  },
);
