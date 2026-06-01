import { PushRepository } from "./push.repo";
// import { redis } from "@/lib/redis";

export const PushService = {
  createPushSubscription: async (
    userId: string,
    endpoint: string,
    keys: string,
  ) => {
    return PushRepository.create(userId, endpoint, keys);
  },

  deleteAllSubscriptionsForEndpoint: async (
    userId: string,
    endpoint: string,
  ) => {
    return PushRepository.deleteMany(userId, endpoint);
  },
};
