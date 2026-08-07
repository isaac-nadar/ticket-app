import { PushRepository } from "./push.repo";
import { PushKeys } from "./push.types";
// import { redis } from "@/lib/redis";

export const PushService = {
  createPushSubscription: async (
    userId: string,
    endpoint: string,
    keys: PushKeys,
  ) => {
    return PushRepository.create(userId, endpoint, keys);
  },

  deleteAllSubscriptionsForEndpoint: async (
    userId: string,
    endpoint: string,
  ) => {
    return PushRepository.deleteMany(userId, endpoint);
  },

  // Used by the notification listener to fan out web-push, and to prune
  // dead subscriptions — keeps prisma out of listener code.
  getUserSubscriptions: async (userId: string) => {
    return PushRepository.findByUserId(userId);
  },

  deleteSubscription: async (id: string) => {
    return PushRepository.deleteById(id);
  },
};
