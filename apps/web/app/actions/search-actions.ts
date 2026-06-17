"use server";

import { createSafeAction } from "@/lib/safe-action";
import { Card } from "@/domain/card/card.types";
import { Board } from "@/domain/board/board.type";
import { BoardUserService } from "@/domain/board/board.service";
import { CardService } from "@/domain/card/card.service";

export const searchCardsAction = createSafeAction(
  async (query: string, { user }) => {
    if (!query || query.length < 2) return { success: true, data: [] };

    // 1. SECURITY: Find exactly which boards this user is a member of
    const userBoards = await BoardUserService.listBoardsForUser(user.userId);

    const allowedBoardIds = userBoards.map((b: Board) => b.boardId);

    if (allowedBoardIds.length === 0) return { success: true, data: [] };

    // 2. PERFORMANCE: Deep query through the Column relation!
    const cards = await CardService.searchCards(query, allowedBoardIds);

    // 3. ABSTRACTION: Map the data so the frontend UI doesn't break
    // The frontend UI expects `card.boardId` and `card.board.title`.
    // We construct that shape here so the UI remains blissfully unaware of the database structure.
    const formattedCards = cards.map((card: Card) => ({
      ...card,
      boardId: card.column?.board?.id,
      board: {
        title: card.column?.board?.name,
      },
    }));

    return { success: true, data: formattedCards };
  },
);
