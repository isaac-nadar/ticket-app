"use server";

import { revalidatePath } from "next/cache";

import { Column } from "@/domain/column/column.types";

// This function runs SECURELY on your Node.js server.
// It never ships to the browser.
export async function updateKanbanColumns(
  boardId: string,
  newColumns: Column[],
) {
  try {
    // 1. Debugging: This will print in your VS Code terminal!
    console.log(
      `[SERVER] Saving ${newColumns.length} columns for board: ${boardId}`,
    );

    // 2. Here is where you would normally call your database (Prisma, Drizzle, Supabase)
    // Example: await db.board.update({ where: { id: boardId }, data: { columns: newColumns } })

    // Simulating network latency so you can see how smooth the UI feels
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. The "SWR" Replacement:
    // This tells Next.js to quietly purge its server cache for this URL.
    // The next time the user hard-refreshes, they get the fresh data!
    revalidatePath(`/boards/${boardId}`);

    return { success: true };
  } catch (error) {
    console.error("[SERVER] Failed to save board state:", error);
    return { success: false, error: "Failed to save board" };
  }
}
