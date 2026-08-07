import prisma from "@/lib/db";

// Define the transaction type just like we did in CardRepository
type Tx = typeof prisma;

export const ColumnRepository = {
  findByIdAndBoard: async (columnId: string, boardId: string) => {
    return prisma.column.findFirst({
      where: { id: columnId, boardId },
      select: { id: true },
    });
  },

  create: async (boardId: string, name: string) => {
    // 1. Find the highest position to put the new column at the end
    const lastCol = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
    });

    const nextPosition = lastCol ? lastCol.position + 1 : 0;

    // 2. Create and return the new column
    return prisma.column.create({
      data: {
        name,
        position: nextPosition,
        boardId,
      },
    });
  },

  updatePosition: async (columnId: string, newPosition: number) => {
    return prisma.$transaction(async (tx: Tx) => {
      // 1. Fetch the column to know where it's coming from and what board it belongs to
      const column = await tx.column.findUnique({
        where: { id: columnId },
      });

      if (!column) throw new Error("Column not found");

      const oldPosition = column.position;
      const boardId = column.boardId;

      if (oldPosition === newPosition) return column;

      const isMovingRight = newPosition > oldPosition;

      // 2. Shift the intermediate columns out of the way
      await tx.column.updateMany({
        where: {
          boardId: boardId,
          position: isMovingRight
            ? { gt: oldPosition, lte: newPosition } // Shift left
            : { gte: newPosition, lt: oldPosition }, // Shift right
        },
        data: {
          position: isMovingRight ? { decrement: 1 } : { increment: 1 },
        },
      });

      // 3. Finally, update the target column itself
      const updatedColumn = await tx.column.update({
        where: { id: columnId },
        data: {
          position: newPosition,
        },
      });

      return updatedColumn;
    });
  },
};
