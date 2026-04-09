import { NotificationRepository } from "./notification.repo";
import { redis } from "@/lib/redis";
import { notificationKeys } from "./notification.keys";


export const NotificationService = {
  markRead: async (notificationId: string, userId: string) => {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // already read → do nothing
    if (!notif || notif.read) {
      return notif;
    }

    // mark as read in DB (source of truth)
    await NotificationRepository.markAsRead(notificationId);

    // sync Redis safely
    const key = notificationKeys.unreadCount(userId);
    const current = await redis.get(key);

    if (current !== null && Number(current) > 0) {
      await redis.decr(key);
    }

    return notif;
  },

  markAllRead: async (userId: string) => {
    return NotificationRepository.markAllAsRead(userId);
  },

  unreadCount: async (userId: string) => {
    const cached = await redis.get(
      notificationKeys.unreadCount(userId)
    );

    if (cached !== null) {
      return Number(cached);
    }

    // fallback to DB
    const count =
      await NotificationRepository.countUnread(userId);

    await redis.set(
      notificationKeys.unreadCount(userId),
      count
    );

    return count;
  },
};
