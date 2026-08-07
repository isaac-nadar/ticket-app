import { DomainEvents } from "@/domain/events/domain-events";
import { redis } from "@/lib/redis";
import { pusherServer } from "@/lib/pusher";
import { notificationKeys } from "./notification.keys";
import { eventKeys } from "@/domain/events/event.keys";
import { webpush } from "@/lib/web-push";
import { isPushKeys } from "../push/push.guards";
import {
  isWebPushGoneError,
  isWebPushNotFoundError,
} from "../push/push.errors";
import { NotificationService } from "./notification.service";
import { PushService } from "../push/push.service";
import { DomainEvent } from "@/domain/events/events.types";

export function registerNotificationListeners() {
  // 🛠️ THE ORCHESTRATOR: Handles the entire Notification Pipeline safely
  async function processNotification(
    event: DomainEvent,
    userId: string | undefined,
    actorId: string | undefined,
    title: string,
    body: string,
  ) {
    if (!userId || !event.id) return;

    // Never notify people about their own actions.
    if (actorId && userId === actorId) return;

    // 1. Check Idempotency (Exactly-Once Processing)
    const idempotencyKey = eventKeys.processed(event.id);
    const alreadyProcessed = await redis.get(idempotencyKey);
    if (alreadyProcessed) return; // 🚫 skip duplicate

    // Lock the event for 1 hour
    await redis.set(idempotencyKey, "1", "EX", 60 * 60);

    // 2. Save to PostgreSQL Database
    await NotificationService.create(userId, title, body);

    // 3. Update the Unread Count in Redis
    const unreadCount = await redis.incr(notificationKeys.unreadCount(userId));

    // 3b. Push the live count + notification to the bell in real time
    await pusherServer.trigger(`user-${userId}`, "notification", {
      count: unreadCount,
      title,
      body,
    });

    // 4. Handle Web Push Notifications (PWA)
    const subs = await PushService.getUserSubscriptions(userId);
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
          await PushService.deleteSubscription(sub.id);
        }
      }
    }
  }

  // 🎧 THE LISTENERS: Strictly typed and isolated!

  DomainEvents.subscribe("CARD_MOVED", async (payload, event) => {
    await processNotification(
      event,
      payload.assigneeId,
      payload.actorId,
      "Card moved",
      `Card ${payload.cardId} moved to new column`,
    );
  });

  DomainEvents.subscribe("CARD_CREATED", async (payload, event) => {
    await processNotification(
      event,
      payload.assigneeId,
      payload.actorId,
      "New card created",
      `Card ${payload.cardId} created`,
    );
  });

  DomainEvents.subscribe("CARD_UPDATED", async (payload, event) => {
    await processNotification(
      event,
      payload.assigneeId,
      payload.actorId,
      "Card Assigned/Updated",
      `You were assigned to or had an update on Card ${payload.cardId}`,
    );
  });

  // Direct pings (e.g. @mentions) already know exactly who to notify.
  DomainEvents.subscribe("NOTIFICATION_CREATED", async (payload, event) => {
    await processNotification(
      event,
      payload.userId,
      payload.actorId,
      payload.title,
      payload.body,
    );
  });
}
