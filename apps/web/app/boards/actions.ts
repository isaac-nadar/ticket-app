"use server";

import { revalidatePath } from "next/cache";
import { BoardService, BoardUserService } from "@/domain/board/board.service";
import { createSafeAction } from "@/lib/safe-action";

export const createBoardAction = createSafeAction(
  async (name: string, { user }) => {
    const prefix = generateBoardPrefix(name);

    const board = await BoardService.createBoard(name, prefix);
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
