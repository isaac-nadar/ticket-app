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
import { NotificationRepository } from "./notification.repo";
import { DomainEvent } from "@/domain/events/events.types";

export function registerNotificationListeners() {
  // 🛠️ THE ORCHESTRATOR: Handles the entire Notification Pipeline safely
  async function processNotification(
    event: DomainEvent,
    userId: string | undefined,
    title: string,
    body: string,
  ) {
    if (!userId || !event.id) return;

    // 1. Check Idempotency (Exactly-Once Processing)
    const idempotencyKey = eventKeys.processed(event.id);
    const alreadyProcessed = await redis.get(idempotencyKey);
    if (alreadyProcessed) return; // 🚫 skip duplicate

    // Lock the event for 1 hour
    await redis.set(idempotencyKey, "1", "EX", 60 * 60);

    // 2. Save to PostgreSQL Database
    await NotificationRepository.create(userId, title, body);

    // 3. Update the Unread Count in Redis
    await redis.incr(notificationKeys.unreadCount(userId));

    // 4. Handle Web Push Notifications (PWA)
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    for (const sub of subs) {
      if (!isPushKeys(sub.keys)) continue;

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title, body }),
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        console.error("🚨 [Web Push Failed]:", message);
        if (isWebPushGoneError(err) || isWebPushNotFoundError(err)) {
          // Clean up dead subscriptions
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
  }

  // 🎧 THE LISTENERS: Strictly typed and isolated!

  DomainEvents.subscribe("CARD_MOVED", async (payload, event) => {
    await processNotification(
      event,
      payload.userId,
      "Card moved",
      `Card ${payload.cardId} moved to new column`,
    );
  });

  DomainEvents.subscribe("CARD_CREATED", async (payload, event) => {
    await processNotification(
      event,
      payload.userId,
      "New card created",
      `Card ${payload.cardId} created`,
    );
  });

  DomainEvents.subscribe("CARD_UPDATED", async (payload, event) => {
    await processNotification(
      event,
      payload.userId,
      "Card Assigned/Updated",
      `You were assigned to or had an update on Card ${payload.cardId}`,
    );
  });
}
