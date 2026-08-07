"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PushService } from "@/domain/push/push.service";
import { PushKeys } from "@/domain/push/push.types";
import { isPushKeys } from "@/domain/push/push.guards";

// Called once the browser has registered the service worker and subscribed
// via PushManager — persists the subscription so the notification pipeline
// (domain/notification/notification.listener.ts) can deliver real OS/system
// notifications through it, even when no tab is open.
export const subscribeToPushAction = createSafeAction(
  async (
    data: { endpoint: string; keys: PushKeys },
    { user },
  ) => {
    if (!data?.endpoint || !isPushKeys(data?.keys)) {
      throw new Error("Invalid push subscription payload");
    }

    await PushService.createPushSubscription(
      user.userId,
      data.endpoint,
      data.keys,
    );

    return { success: true, data: null };
  },
);

export const unsubscribeFromPushAction = createSafeAction(
  async (data: { endpoint: string }, { user }) => {
    if (!data?.endpoint) {
      throw new Error("endpoint is required");
    }

    await PushService.deleteAllSubscriptionsForEndpoint(
      user.userId,
      data.endpoint,
    );

    return { success: true, data: null };
  },
);
