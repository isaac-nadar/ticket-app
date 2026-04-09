// apps/web/domain/card/card.repo.ts
import prisma from "@/lib/db";

type Tx = typeof prisma;

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

  reorder: async (
    cardId: string,
    targetColumnId: string,
    targetPosition: number,
  ) => {
    return prisma.$transaction(async (tx: Tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId },
      });

      if (!card) {
        throw new Error("Card not found");
      }

      // Close gap in source column
      await tx.card.updateMany({
        where: {
          columnId: card.columnId,
          position: { gt: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Make room in target column
      await tx.card.updateMany({
        where: {
          columnId: targetColumnId,
          position: { gte: targetPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // Move card
      return tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          position: targetPosition,
        },
      });
    });
  },

  findDoneOlderThan: async (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prisma.card.findMany({
      where: {
        column: {
          name: "Done",
        },
        updatedAt: {
          lt: cutoff,
        },
      },
      select: {
        id: true,
        title: true,
        columnId: true,
        updatedAt: true,
      },
    });
  },

  deleteManyByIds: async (ids: string[]) => {
    return prisma.card.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  },
};
