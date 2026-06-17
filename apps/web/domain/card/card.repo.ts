// apps/web/domain/card/card.repo.ts
import prisma from "@/lib/db";
import { CardType } from "./card.types";

type Tx = typeof prisma;

export type UpdateCardPayload = Partial<{
  title: string;
  description: string | null;
  type: CardType | null;
  assigneeId: string | null;
}>;

export const CardRepository = {
  create: async (title: string, type: "BUG" | "FEATURE", columnId: string) => {
    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    const nextPosition = lastCard ? lastCard.position + 1 : 0;

    return prisma.card.create({
      data: {
        title,
        type,
        columnId,
        position: nextPosition,
      },
    });
  },

  move: async (cardId: string, targetColumnId: string) => {
    return prisma.$transaction(async (tx: Tx) => {
      const column = await tx.column.findUnique({
        where: { id: targetColumnId },
      });

      if (!column) {
        throw new Error("Target column does not exist");
      }

      return tx.card.update({
        where: { id: cardId },
        data: { columnId: targetColumnId },
      });
    });
  },

  findAll: async () => {
    return prisma.card.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  findByBoard: async (boardId: string) => {
    return prisma.card.findMany({
      where: {
        column: {
          boardId,
        },
      },
      include: {
        column: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async reorder(
    cardId: string,
    targetColumnId: string,
    targetPosition: number,
  ) {
    // 💡 INTERVIEW POINT: We wrap the logic in prisma.$transaction.
    // Notice we use 'tx' (the transaction client) instead of 'prisma' inside the block!
    return prisma.$transaction(async (tx: Tx) => {
      // 1. Fetch the card to know where it's coming from
      const card = await tx.card.findUnique({
        where: { id: cardId },
      });

      if (!card) throw new Error("Card not found");

      // 2. Are we moving it within the SAME column?
      if (card.columnId === targetColumnId) {
        const isMovingDown = targetPosition > card.position;

        // Shift the intermediate cards out of the way
        await tx.card.updateMany({
          where: {
            columnId: targetColumnId,
            position: isMovingDown
              ? { gt: card.position, lte: targetPosition } // Shift up
              : { gte: targetPosition, lt: card.position }, // Shift down
          },
          data: {
            position: isMovingDown ? { decrement: 1 } : { increment: 1 },
          },
        });
      }

      // 3. Or are we moving it to a DIFFERENT column?
      else {
        // Shift cards in the NEW column down to make room
        await tx.card.updateMany({
          where: {
            columnId: targetColumnId,
            position: { gte: targetPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });

        // Optional: You could also shift cards in the OLD column up to close the gap,
        // but for V1, leaving a gap in the integer sequence is totally fine.
      }

      // 4. Finally, update the target card itself
      const updatedCard = await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          position: targetPosition,
        },
      });

      return updatedCard;
    }); // <-- If any query fails before this bracket, Postgres undoes ALL of them.
  },

  findDoneOlderThan: async (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return prisma.card.findMany({
      where: {
        // We look for columns specifically named "Done" (case-insensitive usually best)
        column: { name: { equals: "Done", mode: "insensitive" } },
        updatedAt: { lt: cutoffDate }, // 'lt' means Less Than (older than) the cutoff
      },
      include: { attachments: true },
    });
  },

  async update(cardId: string, data: UpdateCardPayload) {
    return prisma.card.update({
      where: { id: cardId },
      data,
    });
  },

  deleteManyByIds: async (ids: string[]) => {
    return prisma.card.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  },

  async softDelete(cardId: string) {
    return prisma.card.update({
      where: { id: cardId },
      data: { deletedAt: new Date() }, // Set the timestamp
    });
  },

  getByIdWithDetails: async (cardId: string) => {
    return prisma.card.findUnique({
      where: { id: cardId },
      include: {
        attachments: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  findByQuery: async (query: string, allowedBoardIds: string[]) => {
    return await prisma.card.findMany({
      where: {
        // 👇 Traverse UP to the column to check if its boardId is allowed
        column: {
          boardId: { in: allowedBoardIds },
        },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        // 👇 Fetch the Board title by passing through the column relation
        column: {
          include: {
            board: { select: { id: true, name: true } },
          },
        },
      },
    });
  },
};
