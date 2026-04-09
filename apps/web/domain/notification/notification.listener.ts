import { DomainEvents } from "@/domain/events/domain-events";
import { NotificationRepository } from "./notification.repo";
import { isCardMovedEvent } from "@/domain/events/event-guards";

import { redis } from "@/lib/redis";
import { notificationKeys } from "./notification.keys";
import { eventKeys } from "@/domain/events/event.keys";
import { webpush } from "@/lib/web-push";
import { isPushKeys } from "../push/push.guards";
import {
  isWebPushGoneError,
  isWebPushNotFoundError,
} from "../push/push.errors";
import { NotificationHandler } from "../events/handlers/notification.handler";

const ALL_USERS = ["demo-user"]; // placeholder

DomainEvents.register(async (event) => {
  await NotificationHandler.handle(event);

  const alreadyProcessed = await redis.get(eventKeys.processed(event.id));

  if (alreadyProcessed) {
    return; // 🚫 skip duplicate
  }

  if (event.type !== "CARD_MOVED") return;

  if (!isCardMovedEvent(event.payload)) return;

  for (const userId of ALL_USERS) {
    await NotificationRepository.create(
      userId,
      "CARD_MOVED",
      `Card moved to position ${event.payload.targetPosition}`,
    );

    await redis.incr(notificationKeys.unreadCount(userId));

    await redis.set(
      eventKeys.processed(event.id),
      "1",
      "EX",
      60 * 60, // 1 hour TTL
    );

    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subs) {
      if (!isPushKeys(sub.keys)) {
        continue; // skip invalid subscription
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify({
            title: "Kanban Update",
            body: "A card was moved",
          }),
        );
      } catch (err: unknown) {
        if (isWebPushGoneError(err) || isWebPushNotFoundError(err)) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }
  }
});
