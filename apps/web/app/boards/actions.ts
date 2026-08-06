"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { BoardService, BoardUserService } from "@/domain/board/board.service";
import { createSafeAction } from "@/lib/safe-action";
import { enforceRateLimit } from "@/domain/rate-limit/rate-limit.service";
import { IdempotencyService } from "@/domain/idempotency/idempotency.service";

export const createBoardAction = createSafeAction(
  async (name: string, { user }) => {
    await enforceRateLimit(user.userId);

    const prefix = generateBoardPrefix(name);

    // Collapse accidental double-submits within a short window.
    const idempotencyKey = createHash("sha256")
      .update(`create-board:${user.userId}:${name}:${Math.floor(Date.now() / 5000)}`)
      .digest("hex");

    const board = await IdempotencyService.execute(idempotencyKey, () =>
      BoardService.createBoard(name, prefix),
    );
    await BoardUserService.assignUserToBoard(board.id, user.userId);

    revalidatePath("/boards");
    return { success: true, data: { boardId: board.id } };
  },
  "ADMIN",
);

function generateBoardPrefix(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // Take first letter of up to 3 words
    return (words[0][0] + words[1][0] + (words[2]?.[0] || "")).toUpperCase();
  }
  // If it's one word, take the first 3 letters
  return name.substring(0, 3).toUpperCase();
}
