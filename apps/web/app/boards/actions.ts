"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { AuthUser } from "@/lib/auth";
import { BoardService, BoardUserService } from "@/domain/board/board.service";

export async function createBoardAction(name: string) {
  try {
    // 1. Securely grab your custom cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("kanban_token")?.value;

    if (!token) {
      throw new Error("Unauthorized: Missing token");
    }

    // 2. Verify using your exact JWT utility
    const user = verifyJwt(token) as unknown as AuthUser;

    // 3. RBAC (Role-Based Access Control) Check
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Admins can create boards.");
    }

    // 4. Create the board
    const newBoard = await BoardService.createBoard(name);

    // 5. Automatically assign the Admin to their new board
    await BoardUserService.assignUserToBoard(newBoard.id, user.userId);

    revalidatePath("/boards");
    return { success: true, boardId: newBoard.id };
  } catch (error: unknown) {
    console.error("[SERVER] Failed to create board:", error);
    return { success: false, error: (error as Error).message };
  }
}
