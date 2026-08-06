import prisma from "@/lib/db";
import { PushKeys } from "./push.types";

export const PushRepository = {
  create: async (userId: string, endpoint: string, keys: PushKeys) => {
    return prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        keys,
      },
    });
  },

  deleteMany: async (userId: string, endpoint: string) => {
    return prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  },
};
