import { DomainEvents } from "@/domain/events/domain-events";
import prisma from "@/lib/db";
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

DomainEvents.register(async (event) => {
  // 1. Check Idempotency FIRST
  const alreadyProcessed = await redis.get(eventKeys.processed(event.id));
  if (alreadyProcessed) {
    return; // 🚫 skip duplicate
  }

  // Mark event as processed immediately (1 hour TTL)
  await redis.set(eventKeys.processed(event.id), "1", "EX", 60 * 60);

  // 2. Delegate core DB notification creation
  // (Moving this down protects the DB from network retries!)
  await NotificationHandler.handle(event);

  // 3. Extract userId safely from the event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (event.payload as any).userId;
  if (!userId) {
    return;
  }

  // 4. Update the unread count in Redis
  await redis.incr(notificationKeys.unreadCount(userId));

  // 5. Handle Web Push Notifications
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subs) {
    if (!isPushKeys(sub.keys)) {
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: "Kanban Update",
          body: "A card assigned to you was updated.",
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      console.error("🚨 [Web Push Failed]:", message); // <-- ADD THIS
      if (isWebPushGoneError(err) || isWebPushNotFoundError(err)) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }
  }
});
