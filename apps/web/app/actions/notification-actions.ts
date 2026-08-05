"use server";

import { createSafeAction } from "@/lib/safe-action";
import { NotificationService } from "@/domain/notification/notification.service";
import { unstable_noStore as noStore } from "next/cache";

// 1. Fetch Unread Count
export const getUnreadCountAction = createSafeAction(
  async (_payload: void, { user }) => {
    const count = await NotificationService.unreadCount(user.userId);
    return { success: true, data: count };
  },
);

// 2. Fetch Notification List (Lazy Load)
export const getNotificationsAction = createSafeAction(
  async (data: { cursor?: string } | undefined, { user }) => {
    noStore();
    const feed = await NotificationService.getFeed(user.userId, 10, data?.cursor);

    return { success: true, data: feed };
  },
);

// 3. Mark as Read
export const markAsReadAction = createSafeAction(
  async ({ id }: { id: string }, { user }) => {
    await NotificationService.markRead(id, user.userId);
    return { success: true, data: null };
  },
);

// 4. Mark All as Read
export const markAllAsReadAction = createSafeAction(
  async (_payload: void, { user }) => {
    await NotificationService.markAllRead(user.userId);
    return { success: true, data: null };
  },
);
