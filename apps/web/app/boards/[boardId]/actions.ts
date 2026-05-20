"use server";

import { revalidatePath } from "next/cache";
import { CardRepository } from "@/domain/card/card.repo";
// 1. Import your Redis client!
import { redis } from "@/lib/redis";
import { ColumnRepository } from "@/domain/column/column.repo";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { AuthUser } from "@/lib/auth";
import { UserRepository } from "@/domain/user/user.repo";
import { BoardRepository } from "@/domain/board/board.repo";
import { CardType } from "@/domain/card/card.types";

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

export async function inviteUserAction(boardId: string, email: string) {
  try {
    // 1. Authenticate and verify role
    const cookieStore = await cookies();
    const token = cookieStore.get("kanban_token")?.value;

    if (!token) throw new Error("Unauthorized");
    const session = verifyJwt(token) as unknown as AuthUser;

    if (session.role !== "ADMIN") {
      throw new Error("Forbidden: Only Admins can invite users.");
    }

    // 2. Look up the target user
    const targetUser = await UserRepository.findByEmail(email.trim());
    if (!targetUser) {
      return {
        success: false,
        error: "No user found with that email address.",
      };
    }

    // 3. Assign them to the board
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

    // 4. Purge Cache
    await redis.del(`board:${boardId}:data`);
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[SERVER] Failed to invite user:", message);
    return { success: false, error: message || "Failed to invite user" };
  }
}

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
