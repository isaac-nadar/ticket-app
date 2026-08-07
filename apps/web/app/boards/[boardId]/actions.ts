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
import { AuthzService } from "@/domain/authz/authz.service";
import { enforceRateLimit } from "@/domain/rate-limit/rate-limit.service";
import { IdempotencyService } from "@/domain/idempotency/idempotency.service";
import { createHash } from "crypto";

// Shared guard: ADMINs can act on any board; everyone else must be a
// member (BoardUser) of the specific board they're trying to mutate.
async function requireBoardAccess(
  userId: string,
  boardId: string,
  role?: "ADMIN" | "USER",
) {
  if (role === "ADMIN") return;

  const boardAccess = await BoardUserService.checkUserAccessToBoard(
    userId,
    boardId,
  );

  if (!boardAccess) {
    throw new Error("Forbidden: You do not have access to this board.");
  }
}

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
    // reliably skip notifying whoever is actually performing the move, and
    // so we can enforce board membership below.
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized" };

    await AuthzService.requireCardAccess(actor.userId, cardId, actor.role);

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
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized" };

    await requireBoardAccess(actor.userId, boardId, actor.role);
    await enforceRateLimit(actor.userId);

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
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized" };

    await requireBoardAccess(actor.userId, boardId, actor.role);

    // The column must actually belong to the board the caller has access
    // to — otherwise a member of Board A could pass a Board B columnId and
    // inject a card there.
    const columnBelongsToBoard = await ColumnService.belongsToBoard(
      columnId,
      boardId,
    );
    if (!columnBelongsToBoard) {
      return { success: false, error: "Column not found on this board" };
    }

    await enforceRateLimit(actor.userId);

    // Collapse accidental double-submits (double-click / slow network retry)
    // within a short window into a single card creation.
    const idempotencyKey = createHash("sha256")
      .update(`create-card:${actor.userId}:${columnId}:${title}:${parentId ?? ""}:${Math.floor(Date.now() / 5000)}`)
      .digest("hex");

    await IdempotencyService.execute(idempotencyKey, () =>
      CardService.createCard(title, "FEATURE", columnId, parentId),
    );

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
  try {
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized" };

    await requireBoardAccess(actor.userId, boardId, actor.role);

    await ColumnService.updateColumnPosition(columnId, newPosition);
    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to move column:", error);
    return { success: false, error: "Failed to move column" };
  }
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
    // Actor is derived server-side so the assignee-notification pipeline
    // (domain/card/card.service.ts) can skip self-notifications reliably,
    // and so we can enforce board membership below.
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized" };

    // Also doubles as the "card exists" check — a nonexistent cardId can't
    // be accessible to anyone, so requireCardAccess rejects it too.
    await AuthzService.requireCardAccess(actor.userId, cardId, actor.role);

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
  async (cardId: string, { user }) => {
    await AuthzService.requireCardAccess(user.userId, cardId, user.role);

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
    await AuthzService.requireCardAccess(user.userId, cardId, user.role);
    await enforceRateLimit(user.userId);

    // Collapse accidental double-submits within a short window.
    const idempotencyKey = createHash("sha256")
      .update(`add-comment:${user.userId}:${cardId}:${text}:${Math.floor(Date.now() / 5000)}`)
      .digest("hex");

    await IdempotencyService.execute(idempotencyKey, () =>
      CommentService.addComment({
        boardId,
        cardId,
        text,
        userId: user.userId,
        userName: user.name,
        assigneeId, // Pass the name so the notification service can use it
      }),
    );

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true, data: null };
  },
);

export const getCardDetailsAction = createSafeAction(
  async (cardId: string, { user }) => {
    await AuthzService.requireCardAccess(user.userId, cardId, user.role);

    const card = await CardService.getCardDetails(cardId);
    if (!card) {
      throw new Error("Card not found");
    }
    return { success: true, data: card };
  },
);

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
