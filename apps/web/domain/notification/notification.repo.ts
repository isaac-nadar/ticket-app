import prisma from "@/lib/db";

export const NotificationRepository = {
  create: async (userId: string, title: string, body?: string) => {
    return prisma.notification.create({
      data: {
        userId,
        title,
        body,
      },
    });
  },

  findById: async (notificationId: string) => {
    return prisma.notification.findUnique({
      where: { id: notificationId },
    });
  },

  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  },

  findByUser: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  getRecent: async (userId: string, take: number = 50) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take, // Limit to prevent massive payloads
    });
  },

  markAsRead: async (notificationId: string, userId: string) => {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  countUnread: async (userId: string) => {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  findForUser: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  findForUserPaginated: async (
    userId: string,
    take: number,
    cursor?: string,
  ) => {
    return prisma.notification.findMany({
      where: { userId },
      take, // The service is already passing limit + 1
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // 👇 CRITICAL: Skip the cursor itself so it doesn't duplicate
      }),
      // 👇 CRITICAL: Ensures new notifications are always at the very top!
      orderBy: { createdAt: "desc" },
    });
  },
};
