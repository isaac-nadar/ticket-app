"use server";

import { revalidatePath } from "next/cache";
import { CardRepository } from "@/domain/card/card.repo";
import { redis } from "@/lib/redis";
import { ColumnRepository } from "@/domain/column/column.repo";
import { AuthUser } from "@/lib/auth";
import { UserRepository } from "@/domain/user/user.repo";
import { BoardRepository } from "@/domain/board/board.repo";
import { CardType } from "@/domain/card/card.types";
import { createSafeAction } from "@/lib/safe-action";
import { CommentService } from "@/domain/comment/comment.service";

export async function moveCardAction(
  boardId: string,
  cardId: string,
  targetColumnId: string,
  targetPosition: number,
) {
  try {
    console.log(
      `[SERVER] Moving Card ${cardId} to Column ${targetColumnId} at pos ${targetPosition}`,
    );

    // 2. Do the heavy lifting in Postgres
    await CardRepository.reorder(cardId, targetColumnId, targetPosition);

    // 3. THE FIX: Purge the stale Redis Cache!
    const CACHE_KEY = `board:${boardId}:data`;
    await redis.del(CACHE_KEY);
    console.log(`🧹 [Cache Cleared] Purged Redis key: ${CACHE_KEY}`);

    // 4. Tell Next.js to refresh the page route
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
    // 👇 Delegated entirely to the Domain layer!
    await ColumnRepository.create(boardId, name);

    // Purge Cache & Refresh UI
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
) {
  try {
    // Already perfectly delegated to the Domain layer
    await CardRepository.create(title, "FEATURE", columnId);

    // Purge Cache & Refresh UI
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
  // Add logic to your ColumnRepository to update the position integer!
  await ColumnRepository.updatePosition(columnId, newPosition);
  await redis.del(`board:${boardId}:data`);
  revalidatePath(`/boards/${boardId}`);
}

export const inviteUserAction = createSafeAction(
  async (
    { boardId, email }: { boardId: string; email: string },
    { user }: { user: AuthUser },
  ) => {
    // No need to check tokens or roles, the wrapper already did it!
    const targetUser = await UserRepository.findByEmail(email.trim());
    if (!targetUser) throw new Error("User not found");

    try {
      await BoardRepository.assignUser(boardId, targetUser.id);
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
export async function updateCardDetailsAction(
  boardId: string,
  cardId: string,
  data: {
    title: string;
    type: CardType;
    description: string | null;
    assigneeId: string | null;
  },
) {
  try {
    // 1. Update the database
    await CardRepository.update(cardId, data);

    // 2. Purge Cache & Refresh UI
    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to update card:", error);
    return { success: false, error: "Failed to update card details" };
  }
}

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
    }: { boardId: string; cardId: string; text: string },
    { user },
  ) => {
    await CommentService.addComment({
      boardId,
      cardId,
      text,
      userId: user.userId,
      userName: user.name, // Pass the name so the notification service can use it
    });

    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true, data: null };
  },
);
