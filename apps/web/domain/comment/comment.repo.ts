import prisma from "@/lib/db";

export const CommentRepository = {
  findByCardId: async (cardId: string) => {
    return prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  },

  create: async (data: { text: string; cardId: string; userId: string }) => {
    return prisma.comment.create({
      data,
    });
  },
};
