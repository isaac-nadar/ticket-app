import prisma from "@/lib/db";

export const PushRepository = {
  create: async (userId: string, endpoint: string, keys: string) => {
    return prisma.notification.create({
      data: {
        userId,
        endpoint,
        keys,
      },
    });
  },

  deleteMany: async (userId: string, endpoint: string) => {
    return prisma.notification.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  },
};
