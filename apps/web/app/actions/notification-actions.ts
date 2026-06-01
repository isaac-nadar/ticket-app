"use server";

import { createSafeAction } from "@/lib/safe-action"; // Adjust path if needed
import { NotificationRepository } from "@/domain/notification/notification.repo"; // 👇 Import the Repo!

// 1. Fetch Unread Count
export const getUnreadCountAction = createSafeAction(
  async (_payload: void, { user }) => {
    const count = await NotificationRepository.getUnreadCount(user.userId);
    return { success: true, data: count };
  },
);

// 2. Fetch Notification List (Lazy Load)
export const getNotificationsAction = createSafeAction(
  async (_payload: void, { user }) => {
    const notifications = await NotificationRepository.getRecent(
      user.userId,
      50,
    );
    return { success: true, data: notifications };
  },
);

// 3. Mark as Read
export const markAsReadAction = createSafeAction(
  async ({ id }: { id: string }, { user }) => {
    await NotificationRepository.markAsRead(id, user.userId);
    return { success: true, data: null };
  },
);
