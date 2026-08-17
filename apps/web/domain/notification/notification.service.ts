import { NotificationRepository } from "./notification.repo";
import { redis } from "@/lib/redis";
import { notificationKeys } from "./notification.keys";

export const NotificationService = {
  // Used by the domain event listener — keeps prisma out of listener code.
  create: async (
    userId: string,
    title: string,
    body?: string,
    cardId?: string,
    boardId?: string,
  ) => {
    return NotificationRepository.create(userId, title, body, cardId, boardId);
  },

  markRead: async (notificationId: string, userId: string) => {
    const notif = await NotificationRepository.findById(notificationId);

    // Doesn't exist or isn't yours → treat identically (return null)
    // rather than leaking a different result for "not found" vs. "not
    // mine", which would let a caller enumerate other users' notification
    // ids and read-state.
    if (!notif || notif.userId !== userId) {
      return null;
    }

    // Already read → no-op.
    if (notif.read) {
      return notif;
    }

    // mark as read in DB (source of truth)
    await NotificationRepository.markAsRead(notificationId, userId);

    // Sync Redis. DECR is atomic, but the read-then-write below to guard
    // against going negative isn't — that's fine, it's just self-healing
    // for a cache (unreadCount() also clamps defensively on read).
    const key = notificationKeys.unreadCount(userId);
    const newCount = await redis.decr(key);
    if (newCount < 0) {
      await redis.set(key, 0);
    }

    return notif;
  },

  markAllRead: async (userId: string) => {
    const result = await NotificationRepository.markAllAsRead(userId);
    await redis.set(notificationKeys.unreadCount(userId), 0);
    return result;
  },

  unreadCount: async (userId: string) => {
    const cached = await redis.get(notificationKeys.unreadCount(userId));

    if (cached !== null) {
      // Defensive clamp — the decrement path self-heals but isn't
      // strictly atomic, so a reader could transiently see -1.
      return Math.max(0, Number(cached));
    }

    // fallback to DB
    const count = await NotificationRepository.countUnread(userId);

    await redis.set(notificationKeys.unreadCount(userId), count);

    return count;
  },

  getFeed: async (userId: string, limit: number = 10, cursor?: string) => {
    // 👇 THE FIX: Ask the database for ONE extra record!
    const take = limit + 1;

    const notifications = await NotificationRepository.findForUserPaginated(
      userId,
      take, // Pass the 'limit + 1' to the repo
      cursor,
    );

    let nextCursor: string | undefined = undefined;

    // Now, if we asked for 10, and got 11 back, this logic works perfectly!
    if (notifications.length > limit) {
      // Pop the 11th record off the end of the array
      const nextItem = notifications.pop();
      // Save its ID as the cursor for the next API call
      nextCursor = nextItem?.id;
    }

    return {
      data: notifications,
      nextCursor,
    };
  },
};
