import prisma from "@/lib/db";
import { PushKeys } from "./push.types";

export const PushRepository = {
  create: async (userId: string, endpoint: string, keys: PushKeys) => {
    // Upsert on (userId, endpoint): re-subscribing from the same
    // browser/device (two tabs, a double click before isSubscribed
    // updates, re-registering after a permission reset) refreshes the
    // existing row's keys instead of creating a duplicate that would get
    // a duplicate OS notification per event.
    return prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint } },
      create: { userId, endpoint, keys },
      update: { keys },
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

  findByUserId: async (userId: string) => {
    return prisma.pushSubscription.findMany({ where: { userId } });
  },

  deleteById: async (id: string) => {
    return prisma.pushSubscription.delete({ where: { id } });
  },
};
