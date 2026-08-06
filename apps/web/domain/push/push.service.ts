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
};
