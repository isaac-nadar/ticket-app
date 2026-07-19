import prisma from "@/lib/db";

type Tx = typeof prisma;

export const BoardRepository = {
  createWithDefaultColumns: async (name: string, prefix: string) => {
    return prisma.$transaction(async (tx: Tx) => {
      const board = await tx.board.create({
        data: { name, prefix },
      });

      const columns = [
        { name: "Backlog", position: 0, isBacklog: true },
        { name: "Todo", position: 1 },
        { name: "In Progress", position: 2 },
        { name: "Done", position: 3 },
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
    return await prisma.boardUser.findMany({
      where: { userId },
      include: { board: true },
    });
  },

  findUserOfBoard: async (userId: string, boardId: string) => {
    return await prisma.boardUser.findFirst({
      where: { userId, boardId },
    });
  },

  checkUserAccessToBoard: async (userId: string, boardId: string) => {
    return await prisma.boardUser.findUnique({
      where: {
        boardId_userId: { boardId, userId },
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
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { createdAt: "asc" },
              include: {
                assignee: true,
              },
            },
          },
        },
      },
    });
  },
};
