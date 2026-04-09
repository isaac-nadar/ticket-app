import prisma from "@/lib/db";

type Tx = typeof prisma;

export const BoardRepository = {
  createWithDefaultColumns: async (name: string) => {
    return prisma.$transaction(async (tx: Tx) => {
      const board = await tx.board.create({
        data: { name },
      });

      const columns = [
        { name: "Todo", position: 0 },
        { name: "In Progress", position: 1 },
        { name: "Done", position: 2 },
      ];

      await tx.column.createMany({
        data: columns.map((col) => ({
          ...col,
          boardId: board.id,
        })),
      });

      return tx.board.findUnique({
        where: { id: board.id },
        include: { columns: true },
      });
    });
  },

  assignUser: async (boardId: string, userId: string) => {
    return prisma.boardUser.create({
      data: {
        boardId,
        userId,
      },
    });
  },

  /**
   * Return all boards a user has access to.
   */
  findBoardsForUser: async (userId: string) => {
    return prisma.board.findMany({
      where: {
        users: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};

export const BoardReadRepository = {
  findAll: async () => {
    return prisma.board.findMany({
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
  },

  findById: async (boardId: string) => {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
  },
};
